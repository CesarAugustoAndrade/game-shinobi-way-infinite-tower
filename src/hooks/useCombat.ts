import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Player,
  Enemy,
  Skill,
  Buff,
  EffectType,
  GameState,
  ActionType,
  Posture,
  LogEntry,
} from '../game/types';
import { getEnemyFullStats } from '../game/systems/StatSystem';
import {
  processEnemyTurn,
  useSkill as useSkillCombat,
  CombatState,
  createCombatState,
  applyApproachEffects,
  processUpkeep,
  buildDeck,
  drawHand,
} from '../game/systems/CombatWorkflowSystem';
import { getApCost } from '../game/constants/combatCards';
import { LaunchProperties } from '../config/featureFlags';
import { ApproachResult, getCombatModifiers } from '../game/systems/ApproachSystem';
import { CombatRef } from '../scenes/combat';
import { TIMING } from '../game/config';
import {
  logSceneEnter,
  logSceneExit,
  logTurnChange,
  logPlayerAction,
  logFlowCheckpoint,
  logCombatStart,
} from '../game/utils/combatDebug';
import { processPassivesOnCombatStart, processPassivesOnKill } from '../game/systems/EquipmentPassiveSystem';

export type TurnState = 'PLAYER' | 'ENEMY_TURN';

// Type for character stats (same structure for player and enemy)
export type FullStats = ReturnType<typeof getEnemyFullStats>;

export interface UseCombatProps {
  player: Player | null;
  playerStats: FullStats | null;
  addLog: (text: string, type?: LogEntry['type'], details?: string) => void;
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  setGameState: (state: GameState) => void;
  onVictory: (enemy: Enemy, combatState: CombatState | null) => void;

  // Shared state from useCombatExplorationState
  combatState: CombatState | null;
  setCombatState: React.Dispatch<React.SetStateAction<CombatState | null>>;
  approachResult: ApproachResult | null;
  setApproachResult: React.Dispatch<React.SetStateAction<ApproachResult | null>>;
}

export interface UseCombatReturn {
  enemy: Enemy | null;
  enemyStats: FullStats | null;
  turnState: TurnState;
  combatRef: React.RefObject<CombatRef | null>;
  setEnemy: React.Dispatch<React.SetStateAction<Enemy | null>>;
  setTurnState: React.Dispatch<React.SetStateAction<TurnState>>;
  useSkill: (skill: Skill) => void;
  startCombat: (
    newEnemy: Enemy,
    result: ApproachResult,
    playerAfterCosts: Player,
    terrain: any
  ) => void;
  resetCombat: () => void;
  autoCombatEnabled: boolean;
  setAutoCombatEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  autoPassTimeRemaining: number | null;
  // T-004 deckbuilder/AP economy
  currentAp: number;
  maxAp: number;
  hand: Skill[];
  posture: Posture;
  changePosture: (next: Posture) => void;
}

/**
 * Custom hook for managing combat state and logic
 * Extracts combat-related functionality from App.tsx
 *
 * Note: combatState/approachResult are now received via props from
 * useCombatExplorationState to break circular dependency with useExploration.
 */
export function useCombat({
  player,
  playerStats,
  addLog,
  setPlayer,
  setGameState,
  onVictory,
  // Shared state from useCombatExplorationState
  combatState,
  setCombatState,
  approachResult,
  setApproachResult,
}: UseCombatProps): UseCombatReturn {
  // Combat-only state (not shared with exploration)
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [turnState, setTurnState] = useState<TurnState>('PLAYER');
  const [autoCombatEnabled, setAutoCombatEnabled] = useState(false);
  const [autoPassTimeRemaining, setAutoPassTimeRemaining] = useState<number | null>(null);
  const [upkeepProcessedThisTurn, setUpkeepProcessedThisTurn] = useState(false);

  const combatRef = useRef<CombatRef>(null);

  // Compute enemy stats when enemy changes
  const enemyStats = useMemo(() => {
    if (!enemy) return null;
    return getEnemyFullStats(enemy);
  }, [enemy]);

  /**
   * Handle victory - called when enemy HP reaches 0
   */
  const handleVictory = useCallback(() => {
    if (enemy) {
      logSceneExit('COMBAT', `Victory over ${enemy.name}`);
      logFlowCheckpoint('handleVictory called', { enemy: enemy.name, tier: enemy.tier });
      // Store enemy reference before clearing state
      const defeatedEnemy = enemy;
      // Clear enemy state immediately to prevent re-triggering
      setEnemy(null);
      setTurnState('PLAYER');
      onVictory(defeatedEnemy, combatState);
    }
  }, [enemy, combatState, onVictory]);

  /**
   * Play a card from the hand during combat (T-004 AP economy).
   *
   * - Rejects if stunned, if the skill is PASSIVE, or if there isn't enough AP.
   * - TOGGLE cards flip activation and pay their AP cost (they no longer end the turn).
   * - Regular cards run the combat math, spend AP, may shift the player's stance,
   *   and leave the hand (to the discard pile).
   * - The player's turn ends when AP is exhausted (or via SPACE / changePosture).
   */
  const useSkill = useCallback(
    (skill: Skill) => {
      if (!player || !enemy || !playerStats || !enemyStats || !combatState) return;

      logPlayerAction(skill.name, {
        enemyHpBefore: enemy.currentHp
      });

      // STUN blocks ALL actions (except PASSIVE which returns early anyway)
      const isStunned = player.activeBuffs.some(b => b?.effect?.type === EffectType.STUN);
      if (isStunned) {
        addLog('You are stunned and cannot act!', 'danger');
        return;
      }

      // PASSIVE skills are always active and never played as cards
      if (skill.actionType === ActionType.PASSIVE) {
        addLog('Passive abilities are always active!', 'info');
        return;
      }

      // Action Point gate
      const apCost = getApCost(skill);
      if (combatState.currentAp < apCost) {
        addLog(`Not enough Action Points (need ${apCost}, have ${combatState.currentAp}).`, 'danger');
        return;
      }

      const apAfter = combatState.currentAp - apCost;

      // Shared bookkeeping after a card resolves: spend AP, move the played card
      // to the discard pile, optionally shift posture, then end the turn if AP
      // is exhausted.
      const finishCardPlay = (shiftedPosture?: Posture) => {
        setCombatState((prev) => {
          if (!prev) return prev;
          const newHand = prev.hand.filter((c) => c.id !== skill.id);
          const playedFromHand = newHand.length !== prev.hand.length;
          return {
            ...prev,
            currentAp: prev.currentAp - apCost,
            hand: newHand,
            discard: playedFromHand ? [...prev.discard, skill] : prev.discard,
            posture: shiftedPosture ?? prev.posture,
          };
        });
        if (apAfter <= 0) {
          setTurnState('ENEMY_TURN');
        }
      };

      // ── TOGGLE cards: flip activation, pay AP, do NOT end the turn directly ──
      if (skill.isToggle || skill.actionType === ActionType.TOGGLE) {
        const isActive = skill.isActive || false;

        // Silence blocks toggle activation (but not deactivation)
        const isSilenced = player.activeBuffs.some(b => b?.effect?.type === EffectType.SILENCE);
        if (!isActive && isSilenced) {
          addLog('Cannot activate - you are Silenced!', 'danger');
          return;
        }

        // Check chakra cost for activation
        if (!isActive && player.currentChakra < skill.chakraCost) {
          addLog('Insufficient Chakra to activate!', 'danger');
          return;
        }

        setPlayer((prev) => {
          if (!prev) return null;
          let newBuffs = [...prev.activeBuffs];
          const newSkills = prev.skills.map((s) =>
            s.id === skill.id ? { ...s, isActive: !isActive } : s
          );
          let newChakra = prev.currentChakra;

          if (isActive) {
            // Deactivate: Remove all buffs from this skill
            newBuffs = newBuffs.filter((b) => b.source !== skill.name);
            addLog(`${skill.name} Deactivated.`, 'info');
          } else {
            // Activate: Apply effects and pay initial cost
            newChakra -= skill.chakraCost;
            if (skill.effects) {
              skill.effects.forEach((eff) => {
                const buff: Buff = {
                  id: Math.random().toString(36).substring(2, 9),
                  name: eff.type,
                  duration: eff.duration,
                  effect: eff,
                  source: skill.name,
                };
                newBuffs.push(buff);
              });
            }
            addLog(`${skill.name} Activated!`, 'gain');
          }

          return { ...prev, skills: newSkills, activeBuffs: newBuffs, currentChakra: newChakra };
        });

        finishCardPlay();
        return;
      }

      // ── Regular cards: run the combat math ──
      const result = useSkillCombat(
        player,
        playerStats,
        enemy,
        enemyStats,
        skill,
        combatState
      );

      if (!result) return;

      // Apply result to game state
      addLog(result.logMessage, result.logType);

      // A rejected action (e.g. insufficient chakra/HP) spends no AP and stays in hand.
      if (result.apCost === 0 && result.damageDealt === 0 && result.logType === 'danger') {
        return;
      }

      // Mark first turn as complete if applicable
      if (combatState.isFirstTurn) {
        setCombatState((prev) => (prev ? { ...prev, isFirstTurn: false } : null));
      }

      // Spawn floating combat text
      if (result.damageDealt > 0) {
        const isCrit = result.logMessage.includes('CRITICAL');
        combatRef.current?.spawnFloatingText(
          'enemy',
          result.damageDealt.toString(),
          isCrit ? 'crit' : 'damage'
        );
      } else if (result.logMessage.includes('MISSED') || result.logMessage.includes('EVADED')) {
        combatRef.current?.spawnFloatingText('enemy', 'MISS', 'miss');
      }

      setPlayer((prev) =>
        prev
          ? {
              ...prev,
              currentHp: result.newPlayerHp,
              currentChakra: result.newPlayerChakra,
              activeBuffs: result.newPlayerBuffs,
              skills: result.skillsUpdate || prev.skills,
            }
          : null
      );

      setEnemy((prev) =>
        prev
          ? {
              ...prev,
              currentHp: result.newEnemyHp,
              activeBuffs: result.newEnemyBuffs,
            }
          : null
      );

      // Announce a free stance shift granted by the card
      if (result.newPosture && result.newPosture !== combatState.posture) {
        addLog(`Stance shifted to ${result.newPosture}.`, 'info');
      }

      // Check for victory/defeat
      if (result.enemyDefeated) {
        // Process on-kill passives (cooldown reset)
        if (player && enemy) {
          const onKillResult = processPassivesOnKill(player, enemy);
          if (onKillResult.logs.length > 0) {
            onKillResult.logs.forEach(log => addLog(log, 'gain'));
            // Update player skills with reset cooldowns
            setPlayer(prev => prev ? { ...prev, skills: onKillResult.player.skills } : null);
          }
        }
        handleVictory();
        setTurnState('PLAYER'); // Stop enemy turn effect from re-running
        return;
      } else if (result.playerDefeated) {
        setGameState(GameState.GAME_OVER);
        return;
      }

      finishCardPlay(result.newPosture);
    },
    [player, enemy, playerStats, enemyStats, combatState, addLog, setPlayer, setCombatState, handleVictory, setGameState, setTurnState]
  );

  /**
   * Switch the active combat posture (T-004).
   * Costs POSTURE_SWITCH_AP_COST AP; ends the turn if that exhausts AP.
   */
  const changePosture = useCallback(
    (next: Posture) => {
      if (!combatState || turnState !== 'PLAYER') return;
      if (next === combatState.posture) return;

      const cost = LaunchProperties.POSTURE_SWITCH_AP_COST;
      if (combatState.currentAp < cost) {
        addLog(`Not enough Action Points to change stance (need ${cost}).`, 'danger');
        return;
      }

      const apAfter = combatState.currentAp - cost;
      setCombatState((prev) =>
        prev ? { ...prev, currentAp: prev.currentAp - cost, posture: next } : prev
      );
      addLog(`Stance: ${next}.`, 'info');
      if (apAfter <= 0) {
        setTurnState('ENEMY_TURN');
      }
    },
    [combatState, turnState, addLog, setCombatState, setTurnState]
  );

  /**
   * Start a new combat encounter
   */
  const startCombat = useCallback(
    (
      newEnemy: Enemy,
      result: ApproachResult,
      playerAfterCosts: Player,
      terrain: any
    ) => {
      logSceneEnter('COMBAT', {
        enemy: newEnemy.name,
        enemyTier: newEnemy.tier,
        enemyHp: newEnemy.currentHp,
        approach: result.approach
      });

      const modifiers = getCombatModifiers(result);
      let { player: preparedPlayer, enemy: preparedEnemy, logs: effectLogs } = applyApproachEffects(
        playerAfterCosts,
        newEnemy,
        modifiers
      );
      effectLogs.forEach((log) => addLog(log, 'info'));

      // Process artifact passives at combat start (shields, invuln, reflect, free skill)
      const passiveResult = processPassivesOnCombatStart(preparedPlayer, preparedEnemy);
      passiveResult.logs.forEach(log => addLog(log, 'gain'));

      // Apply passive buffs to player
      preparedPlayer = {
        ...preparedPlayer,
        activeBuffs: passiveResult.player.activeBuffs
      };

      // Create combat state with modifiers
      const newCombatState = createCombatState(modifiers, terrain);
      // Store skipFirstSkillCost from artifact passive
      newCombatState.skipFirstSkillCost = passiveResult.skipFirstSkillCost;

      // T-004: initialise the deckbuilder/AP economy for turn 1. The deck is the
      // player's non-PASSIVE skills; the opening hand is drawn under a neutral
      // (BALANCED) posture and AP is filled from the player's speed-derived budget.
      const maxAp = playerStats
        ? playerStats.derived.actionPointsPerTurn
        : LaunchProperties.AP_BASE;
      const deck = buildDeck(preparedPlayer.skills);
      const opening = drawHand(deck, Posture.BALANCED, LaunchProperties.HAND_SIZE);
      newCombatState.maxAp = maxAp;
      newCombatState.currentAp = maxAp;
      newCombatState.posture = Posture.BALANCED;
      newCombatState.deck = opening.deck;
      newCombatState.hand = opening.hand;
      newCombatState.discard = [];

      setCombatState(newCombatState);
      setApproachResult(result);

      // startCombat handles turn-1 setup itself, so skip the first upkeep redraw.
      setUpkeepProcessedThisTurn(true);

      // Set up combat
      setPlayer(preparedPlayer);
      setEnemy(preparedEnemy);
      setTurnState('PLAYER');
      setGameState(GameState.COMBAT);
      addLog(`Engaged: ${newEnemy.name}`, 'danger');

      logCombatStart(
        {
          name: preparedPlayer.clan || 'Player',
          hp: preparedPlayer.currentHp,
          maxHp: preparedPlayer.currentHp, // Will be recalculated with stats
          chakra: preparedPlayer.currentChakra
        },
        {
          name: preparedEnemy.name,
          hp: preparedEnemy.currentHp,
          tier: preparedEnemy.tier
        }
      );
    },
    [addLog, setPlayer, setGameState, playerStats, setCombatState, setApproachResult]
  );

  /**
   * Reset combat state (after victory/defeat)
   */
  const resetCombat = useCallback(() => {
    setEnemy(null);
    setCombatState(null);
    setApproachResult(null);
    setTurnState('PLAYER');
  }, []);

  // Auto-pass effect: When enabled and it's player's turn, count down and auto-pass
  useEffect(() => {
    if (!autoCombatEnabled || turnState !== 'PLAYER' || !enemy) {
      setAutoPassTimeRemaining(null);
      return;
    }

    // Start countdown
    setAutoPassTimeRemaining(TIMING.AUTO_PASS_DELAY);
    const startTime = Date.now();

    // Update countdown every 100ms for smooth display
    const countdownInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, TIMING.AUTO_PASS_DELAY - elapsed);
      setAutoPassTimeRemaining(remaining);
    }, 100);

    // Auto-pass after delay
    const autoPassTimer = setTimeout(() => {
      addLog('Auto-pass: Focusing on defense...', 'info');
      setTurnState('ENEMY_TURN');
    }, TIMING.AUTO_PASS_DELAY);

    return () => {
      clearTimeout(autoPassTimer);
      clearInterval(countdownInterval);
      setAutoPassTimeRemaining(null);
    };
  }, [autoCombatEnabled, turnState, enemy, addLog, setTurnState]);

  // Enemy turn effect
  useEffect(() => {
    // Safety guard: don't process if enemy is null or already defeated
    if (turnState === 'ENEMY_TURN' && player && enemy && enemy.currentHp > 0 && playerStats && enemyStats) {
      logTurnChange('PLAYER', 'ENEMY_TURN', 'Player action completed');

      const timer = setTimeout(() => {
        // Double-check enemy is still valid (may have been cleared)
        if (!enemy || enemy.currentHp <= 0) {
          logFlowCheckpoint('Enemy turn cancelled - enemy already defeated or cleared');
          setTurnState('PLAYER');
          return;
        }
        logFlowCheckpoint('Processing enemy turn', { enemy: enemy.name });
        const result = processEnemyTurn(
          player,
          playerStats,
          enemy,
          enemyStats,
          combatState || undefined
        );

        result.logMessages.forEach((msg) => {
          addLog(
            msg,
            msg.includes('GUTS') ? 'gain' : msg.includes('took') ? 'combat' : 'danger'
          );
        });

        // Calculate damage dealt to player for floating text
        const playerDamageTaken = player.currentHp - result.newPlayerHp;
        if (playerDamageTaken > 0) {
          const isCrit = result.logMessages.some((m) => m.includes('Crit'));
          combatRef.current?.spawnFloatingText(
            'player',
            playerDamageTaken.toString(),
            isCrit ? 'crit' : 'damage'
          );
        } else if (
          result.logMessages.some((m) => m.includes('MISSED') || m.includes('EVADED'))
        ) {
          combatRef.current?.spawnFloatingText('player', 'MISS', 'miss');
        }

        // Check if enemy took DoT damage for floating text
        const enemyDamageTaken = enemy.currentHp - result.newEnemyHp;
        if (enemyDamageTaken > 0) {
          combatRef.current?.spawnFloatingText('enemy', enemyDamageTaken.toString(), 'damage');
        }

        // Check for player healing (regen)
        if (result.logMessages.some((m) => m.includes('regenerated'))) {
          const healMatch = result.logMessages.find((m) => m.includes('You regenerated'));
          if (healMatch) {
            const healAmount = healMatch.match(/(\d+)/)?.[1];
            if (healAmount) {
              combatRef.current?.spawnFloatingText('player', healAmount, 'heal');
            }
          }
        }

        setPlayer((prev) =>
          prev
            ? {
                ...prev,
                currentHp: result.newPlayerHp,
                activeBuffs: result.newPlayerBuffs,
                skills: result.playerSkills,
              }
            : null
        );

        setEnemy((prev) =>
          prev
            ? {
                ...prev,
                currentHp: result.newEnemyHp,
                activeBuffs: result.newEnemyBuffs,
              }
            : null
        );

        // Update combatState if artifact guts was triggered (one-time per combat)
        if (result.artifactGutsTriggered) {
          setCombatState((prev) => prev ? { ...prev, artifactGutsUsed: true } : null);
        }

        if (result.enemyDefeated) {
          logFlowCheckpoint('Enemy defeated - calling handleVictory', { enemy: enemy.name });
          handleVictory();
          setTurnState('PLAYER'); // Stop the effect from re-running
          return;
        } else if (result.playerDefeated) {
          logFlowCheckpoint('Player defeated - GAME OVER');
          setGameState(GameState.GAME_OVER);
        } else {
          logTurnChange('ENEMY_TURN', 'PLAYER', 'Enemy turn completed');
          setTurnState('PLAYER');
        }
      }, TIMING.ENEMY_TURN_DELAY);

      return () => clearTimeout(timer);
    }
  }, [turnState, player, enemy, playerStats, enemyStats, combatState, addLog, setPlayer, handleVictory, setGameState, setTurnState]);

  // Process upkeep when turn changes to PLAYER (after enemy turn).
  // T-004: restores the AP budget and deals a fresh, posture-weighted hand.
  useEffect(() => {
    if (turnState === 'PLAYER' && player && playerStats && enemy && combatState && !upkeepProcessedThisTurn) {
      // Process toggle upkeep costs, passive regen, artifact turn-start passives,
      // and draw the new-turn AP/hand economy.
      const upkeepResult = processUpkeep(player, playerStats, combatState, enemy);

      // Log upkeep messages
      upkeepResult.logs.forEach((msg) => {
        const isDeactivation = msg.includes('deactivated');
        addLog(msg, isDeactivation ? 'danger' : 'info');
      });

      // Update player with upkeep results
      if (upkeepResult.player !== player) {
        setPlayer(upkeepResult.player);
      }

      // Refill AP and deal the new hand for this turn
      setCombatState((prev) =>
        prev
          ? {
              ...prev,
              currentAp: upkeepResult.currentAp,
              maxAp: upkeepResult.maxAp,
              hand: upkeepResult.hand,
              deck: upkeepResult.deck,
              discard: upkeepResult.discard,
            }
          : prev
      );

      setUpkeepProcessedThisTurn(true);
    }
  }, [turnState, player, playerStats, enemy, combatState, upkeepProcessedThisTurn, addLog, setPlayer, setCombatState]);

  // Reset upkeep flag when turn changes to enemy
  useEffect(() => {
    if (turnState === 'ENEMY_TURN') {
      setUpkeepProcessedThisTurn(false);
    }
  }, [turnState]);

  return {
    enemy,
    enemyStats,
    turnState,
    combatRef,
    setEnemy,
    setTurnState,
    useSkill,
    startCombat,
    resetCombat,
    autoCombatEnabled,
    setAutoCombatEnabled,
    autoPassTimeRemaining,
    // T-004 deckbuilder/AP economy (single source of truth lives in combatState)
    currentAp: combatState?.currentAp ?? 0,
    maxAp: combatState?.maxAp ?? 0,
    hand: combatState?.hand ?? [],
    posture: combatState?.posture ?? Posture.BALANCED,
    changePosture,
  };
}
