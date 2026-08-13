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
  ApproachType,
  RangeMoveDirection,
  CombatRange,
} from '../game/types';
import { getEnemyFullStats, getPlayerFullStats } from '../game/systems/StatSystem';
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
import { voluntaryPlayerMove } from '../game/systems/PlayerTurnSystem';
import { bootstrapPlayerSkillConfig, normalizeSkillConfig } from '../game/systems/SkillConfigLive';
import {
  resolveInitialRange,
  skillAllowedAt,
  outOfRangeBlockReason,
} from '../game/systems/RangeSystem';
import { determineTurnOrder } from '../game/systems/CombatCalculationSystem';
import { getApCost } from '../game/constants/combatCards';
import { LaunchProperties } from '../config/featureFlags';
import { ApproachResult, getCombatModifiers } from '../game/systems/ApproachSystem';
import { applyRoomCombatModifiers } from '../game/systems/RoomCombatModifierSystem';
import type { CombatModifierType } from '../game/types';
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
import { openingPostureForApproach, openingPostureLog } from '../game/systems/PostureSystem';
import {
  applyMovementPenaltyToMaxAp,
  applyRoomMovementCostToMaxAp,
} from '../game/systems/LocationTerrainSystem';

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
    terrain: any,
    locationTerrainMods?: import('../game/systems/LocationTerrainSystem').LocationTerrainMods | null,
    /** T-102: room combat activity modifiers */
    roomCombatModifiers?: CombatModifierType[] | null,
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
  /** End player turn (Space / End Turn). Ref-locked against same-tick double fire. */
  passTurn: () => void;
  /** F2: current engagement band */
  currentRange: CombatRange | null;
  /** F2: voluntary approach/retreat (1 AP, once/turn) */
  moveInRange: (direction: RangeMoveDirection) => void;
  playerMoveUsedThisTurn: boolean;
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
  /**
   * Sync lock: blocks same-tick double card resolve (double-click / key repeat)
   * before React re-renders turnState / combatState. Cleared when the player
   * can act again (multi-card turn with remaining AP, or next PLAYER turn).
   */
  const skillActionLockRef = useRef(false);
  /** Blocks double victory (double XP/ryo / double reward modal) until next startCombat. */
  const victoryLockRef = useRef(false);

  // Compute enemy stats when enemy changes
  const enemyStats = useMemo(() => {
    if (!enemy) return null;
    return getEnemyFullStats(enemy);
  }, [enemy]);

  /**
   * Handle victory - called when enemy HP reaches 0
   */
  const handleVictory = useCallback(() => {
    // Same-tick double path (e.g. skill kill + late enemy-turn cleanup) must not
    // double-apply XP/ryo or open two reward flows.
    if (victoryLockRef.current) return;
    if (!enemy) return;
    victoryLockRef.current = true;
    logSceneExit('COMBAT', `Victory over ${enemy.name}`);
    logFlowCheckpoint('handleVictory called', { enemy: enemy.name, tier: enemy.tier });
    // Store enemy reference before clearing state
    const defeatedEnemy = enemy;
    // Clear enemy state immediately to prevent re-triggering
    setEnemy(null);
    setTurnState('PLAYER');
    onVictory(defeatedEnemy, combatState);
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
      // Dead player must not act (mid-delay cancel / desync); death path owns GAME_OVER
      if (player.currentHp <= 0 || enemy.currentHp <= 0) return;
      // Gate off-player-turn race (double-click / late key after ENEMY_TURN)
      if (turnState !== 'PLAYER') return;
      // Same-tick double-submit (stale combatState AP / hand still has the card)
      if (skillActionLockRef.current) return;

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

      // Silence blocks any skill that costs chakra (activation / cast), not free taijutsu
      // and not toggle deactivation (handled below for toggles).
      const isSilenced = player.activeBuffs.some(b => b?.effect?.type === EffectType.SILENCE);

      // F2: range gate (shared pure helper — matches useSkillCombat)
      if (combatState.currentRange && !skillAllowedAt(skill, combatState.currentRange)) {
        addLog(outOfRangeBlockReason(skill, combatState.currentRange), 'danger');
        return;
      }

      // Action Point gate
      const apCost = getApCost(skill);
      if (combatState.currentAp < apCost) {
        addLog(`Not enough Action Points (need ${apCost}, have ${combatState.currentAp}).`, 'danger');
        return;
      }

      // Card must still be in hand (guards double-play of same id before re-render)
      if (!combatState.hand.some((c) => c.id === skill.id)) {
        return;
      }

      const apAfter = combatState.currentAp - apCost;
      // Commit lock after validation — released when combatState/turn commits
      skillActionLockRef.current = true;

      // Shared bookkeeping after a card resolves: spend AP, move the played card
      // to the discard pile, optionally shift posture, then end the turn if AP
      // is exhausted.
      const finishCardPlay = (shiftedPosture?: Posture) => {
        setCombatState((prev) => {
          if (!prev) return prev;
          const newHand = prev.hand.filter((c) => c.id !== skill.id);
          return {
            ...prev,
            currentAp: prev.currentAp - apCost,
            hand: newHand,
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
        // FREE_FIRST_SKILL: activation chakra waived on first accepted skill (parity with useSkill).
        // Silence still keys off base chakraCost — free-first does not bypass silence.
        const skipToggleChakra =
          Boolean(combatState.skipFirstSkillCost) && !isActive && skill.chakraCost > 0;
        const effectiveToggleChakra = skipToggleChakra ? 0 : isActive ? 0 : skill.chakraCost;

        // Silence blocks toggle activation (but not deactivation)
        if (!isActive && isSilenced && skill.chakraCost > 0) {
          addLog('Cannot activate - you are Silenced!', 'danger');
          skillActionLockRef.current = false;
          return;
        }

        // Check chakra cost for activation (honour FREE_FIRST waiver)
        if (!isActive && player.currentChakra < effectiveToggleChakra) {
          addLog('Insufficient Chakra to activate!', 'danger');
          skillActionLockRef.current = false;
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
            // Activate: Apply effects and pay initial cost (0 when FREE_FIRST)
            newChakra -= effectiveToggleChakra;
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
            addLog(
              skipToggleChakra
                ? `${skill.name} Activated! FREE!`
                : `${skill.name} Activated!`,
              'gain',
            );
          }

          return { ...prev, skills: newSkills, activeBuffs: newBuffs, currentChakra: newChakra };
        });

        // Consume FREE_FIRST on any accepted toggle play (same as regular cards)
        if (combatState.skipFirstSkillCost) {
          setCombatState((prev) =>
            prev ? { ...prev, skipFirstSkillCost: false } : prev,
          );
        }

        finishCardPlay();
        // Lock stays until combatState commits (see unlock effect) — blocks stale-AP double play
        return;
      }

      // ── Regular cards: silence blocks chakra-cost skills before paying ──
      if (isSilenced && skill.chakraCost > 0) {
        addLog('You are Silenced and cannot use chakra skills!', 'danger');
        skillActionLockRef.current = false;
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

      if (!result) {
        skillActionLockRef.current = false;
        return;
      }

      // Apply result to game state
      addLog(result.logMessage, result.logType);

      // A rejected action (e.g. insufficient chakra/HP) spends no AP and stays in hand.
      if (result.apCost === 0 && result.damageDealt === 0 && result.logType === 'danger') {
        skillActionLockRef.current = false;
        return;
      }

      // Consume free-first after any accepted skill; ambush first-hit only on a real hit.
      // Matches PlayerTurnSystem: firstHitMultiplier only scales successful damage.
      if (
        combatState.skipFirstSkillCost ||
        (combatState.isFirstTurn && result.damageDealt > 0) ||
        result.artifactGutsTriggered
      ) {
        setCombatState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            skipFirstSkillCost: combatState.skipFirstSkillCost ? false : prev.skipFirstSkillCost,
            isFirstTurn:
              combatState.isFirstTurn && result.damageDealt > 0 ? false : prev.isFirstTurn,
            artifactGutsUsed: result.artifactGutsTriggered ? true : prev.artifactGutsUsed,
          };
        });
      }

      // Spawn floating combat text — color by skill damage channel / element (A7b)
      if (result.damageDealt > 0) {
        const isCrit = result.logMessage.includes('CRITICAL');
        combatRef.current?.spawnFloatingText(
          'enemy',
          result.damageDealt.toString(),
          isCrit ? 'crit' : 'damage',
          { damageType: skill.damageType, element: skill.element },
        );
      } else if (result.logMessage.includes('EVADED')) {
        combatRef.current?.spawnFloatingText('enemy', 'EVADE', 'miss');
      } else if (result.logMessage.includes('MISSED')) {
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
              currentChakra:
                result.newEnemyChakra !== undefined ? result.newEnemyChakra : prev.currentChakra,
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
        // On-kill passives use post-hit player (skills/HP after the killing blow)
        if (player && enemy) {
          const playerAfterHit: Player = {
            ...player,
            currentHp: result.newPlayerHp,
            currentChakra: result.newPlayerChakra,
            activeBuffs: result.newPlayerBuffs,
            skills: result.skillsUpdate || player.skills,
          };
          const onKillResult = processPassivesOnKill(playerAfterHit, enemy);
          if (onKillResult.logs.length > 0) {
            onKillResult.logs.forEach(log => addLog(log, 'gain'));
            setPlayer(prev => prev ? { ...prev, skills: onKillResult.player.skills } : null);
          }
        }
        handleVictory();
        setTurnState('PLAYER'); // Stop enemy turn effect from re-running
        skillActionLockRef.current = false;
        return;
      } else if (result.playerDefeated) {
        // Clear combat actors so auto-pass / enemy-turn / upkeep cannot re-fire after death
        setGameState(GameState.GAME_OVER);
        setEnemy(null);
        setCombatState(null);
        setTurnState('PLAYER');
        skillActionLockRef.current = false;
        return;
      }

      finishCardPlay(result.newPosture);
      // Lock stays until combatState commits (see unlock effect) — blocks stale-AP double play
    },
    [player, enemy, playerStats, enemyStats, combatState, turnState, addLog, setPlayer, setCombatState, handleVictory, setGameState, setTurnState]
  );

  /**
   * Switch the active combat posture (T-004).
   * Costs POSTURE_SWITCH_AP_COST AP; ends the turn if that exhausts AP.
   * Shares skillActionLockRef — double-click spent AP twice via functional setState
   * while the gate still saw the pre-switch combatState.
   */
  const changePosture = useCallback(
    (next: Posture) => {
      if (!combatState || turnState !== 'PLAYER') return;
      if (player && player.currentHp <= 0) return;
      if (next === combatState.posture) return;
      if (skillActionLockRef.current) return;

      const cost = LaunchProperties.POSTURE_SWITCH_AP_COST;
      if (combatState.currentAp < cost) {
        addLog(`Not enough Action Points to change stance (need ${cost}).`, 'danger');
        return;
      }

      skillActionLockRef.current = true;
      const apAfter = combatState.currentAp - cost;
      setCombatState((prev) =>
        prev ? { ...prev, currentAp: prev.currentAp - cost, posture: next } : prev
      );
      addLog(`Stance: ${next}.`, 'info');
      if (apAfter <= 0) {
        setTurnState('ENEMY_TURN');
      }
    },
    [combatState, turnState, player, addLog, setCombatState, setTurnState]
  );

  /**
   * End the player turn (Space / End Turn button).
   * Ref-locked: turnState stays PLAYER until re-render, so double click/Space
   * used to log twice and race auto-pass / enemy-turn scheduling.
   */
  const passTurn = useCallback(() => {
    if (turnState !== 'PLAYER') return;
    if (skillActionLockRef.current) return;
    // Do not hand the turn to a live enemy when already dead (soft-lock / ghost combat)
    if (!player || player.currentHp <= 0) return;
    if (!enemy || enemy.currentHp <= 0) return;
    skillActionLockRef.current = true;
    addLog('You focus on defense and wait.', 'info');
    setTurnState('ENEMY_TURN');
  }, [turnState, player, enemy, addLog, setTurnState]);

  /** F2: voluntary move one band (1 AP, once per player turn). */
  const moveInRange = useCallback(
    (direction: RangeMoveDirection) => {
      if (turnState !== 'PLAYER' || !combatState) return;
      if (!player || player.currentHp <= 0) return;
      const result = voluntaryPlayerMove(combatState, direction, 0);
      addLog(result.logMessage, result.success ? 'info' : 'danger');
      if (result.success) {
        setCombatState(result.combatState);
      }
    },
    [turnState, combatState, player, addLog, setCombatState]
  );

  /**
   * Start a new combat encounter
   */
  const startCombat = useCallback(
    (
      newEnemy: Enemy,
      result: ApproachResult,
      playerAfterCosts: Player,
      terrain: any,
      /** T-063: location terrain effect mods */
      locationTerrainMods?: import('../game/systems/LocationTerrainSystem').LocationTerrainMods | null,
      /** T-102: room CombatActivity.modifiers */
      roomCombatModifiers?: CombatModifierType[] | null,
    ) => {
      victoryLockRef.current = false;
      skillActionLockRef.current = false;
      logSceneEnter('COMBAT', {
        enemy: newEnemy.name,
        enemyTier: newEnemy.tier,
        enemyHp: newEnemy.currentHp,
        approach: result.approach
      });

      let modifiers = getCombatModifiers(result);

      // Fresh encounter hygiene (mirrors simulatorUtils.prepareForCombat):
      // - reset cooldowns, deactivate toggles
      // - drop leftover combat buffs (shields/DoTs/toggle auras) that stacked across fights
      // - keep narrative curses/event flags' buffs (source === 'event' or CURSE)
      const persistentBuffs = (playerAfterCosts.activeBuffs || []).filter(
        (b) => b.source === 'event' || b.effect?.type === EffectType.CURSE
      );
      let encounterPlayer: Player = {
        ...playerAfterCosts,
        activeBuffs: persistentBuffs,
        skills: playerAfterCosts.skills.map((s) => ({
          ...s,
          currentCooldown: 0,
          isActive: false,
        })),
      };

      // T-102: room type combat modifiers (AMBUSH / PREPARED / SANCTUARY / …)
      const combatStartStatsPreview = playerStats ?? getPlayerFullStats(encounterPlayer);
      const roomApplied = applyRoomCombatModifiers(
        roomCombatModifiers,
        modifiers,
        encounterPlayer,
        combatStartStatsPreview.derived.maxHp,
      );
      modifiers = roomApplied.modifiers;
      encounterPlayer = roomApplied.player;
      roomApplied.logs.forEach((log) => addLog(log, 'info'));

      let { player: preparedPlayer, enemy: preparedEnemy, logs: effectLogs } = applyApproachEffects(
        encounterPlayer,
        newEnemy,
        modifiers
      );
      effectLogs.forEach((log) => addLog(log, 'info'));

      // Process artifact passives at combat start (shields, invuln, reflect, free skill)
      // SHIELD_ON_START uses max chakra from derived stats (A-017)
      const combatStartStats = playerStats ?? getPlayerFullStats(preparedPlayer);
      const passiveResult = processPassivesOnCombatStart(preparedPlayer, preparedEnemy, {
        maxHp: combatStartStats.derived.maxHp,
        maxChakra: combatStartStats.derived.maxChakra,
      });
      passiveResult.logs.forEach(log => addLog(log, 'gain'));

      // Merge combat-start passive state including Uzumaki heal (currentHp) and any chakra changes
      preparedPlayer = {
        ...preparedPlayer,
        activeBuffs: passiveResult.player.activeBuffs,
        skills: passiveResult.player.skills,
        currentHp: passiveResult.player.currentHp,
        currentChakra: passiveResult.player.currentChakra,
      };

      // Create combat state with modifiers + T-063 location + T-103 room combat residual
      const newCombatState = createCombatState(
        modifiers,
        terrain,
        locationTerrainMods ?? null,
        {
          roomCombatEvasion: roomApplied.playerEvasionBonus,
          fallDamageOnMiss: roomApplied.environment.fallDamageOnMiss,
          roomConditionNames: roomApplied.activeNames,
          enemyFirstHitMultiplier: roomApplied.enemyFirstHitMultiplier,
        },
      );
      // Store skipFirstSkillCost from artifact passive
      newCombatState.skipFirstSkillCost = passiveResult.skipFirstSkillCost;

      // T-004 / T-039: initialise deckbuilder/AP and opening posture from approach.
      const openingPosture = openingPostureForApproach(result.approach, result.success);

      let maxAp = playerStats
        ? playerStats.derived.actionPointsPerTurn
        : LaunchProperties.AP_BASE;
      // T-082: room movementCost (footing) then T-067 location movement_penalty
      maxAp = applyRoomMovementCostToMaxAp(maxAp, terrain ?? null);
      maxAp = applyMovementPenaltyToMaxAp(maxAp, locationTerrainMods ?? null);
      const boot = bootstrapPlayerSkillConfig(preparedPlayer, Math.random);
      preparedPlayer = boot.player;
      if (boot.notified) {
        addLog(`Main Attack designated: ${preparedPlayer.skillConfig?.mainAttackId}`, 'info');
        setPlayer(preparedPlayer);
      }
      const playablePool = buildDeck(preparedPlayer.skills);
      newCombatState.maxAp = maxAp;
      newCombatState.posture = openingPosture;
      newCombatState.playablePool = playablePool;
      newCombatState.modeUpkeepPriority = normalizeSkillConfig(preparedPlayer.skillConfig).modeUpkeepPriority;

      // F2/F3: seed engagement band from approach + enemy preferred + heat bias
      const initialRange = resolveInitialRange({
        approach: result.approach,
        success: result.success,
        enemy: preparedEnemy,
        heat: result.visitHeat ?? 0,
      });
      newCombatState.currentRange = initialRange;
      newCombatState.playerMoveUsedThisTurn = false;
      newCombatState.enemyMoveUsedThisTurn = false;
      // Enemy AP budget (same terrain transforms)
      let enemyMaxAp = getEnemyFullStats(preparedEnemy).derived.actionPointsPerTurn;
      enemyMaxAp = applyRoomMovementCostToMaxAp(enemyMaxAp, terrain ?? null);
      enemyMaxAp = applyMovementPenaltyToMaxAp(enemyMaxAp, locationTerrainMods ?? null);
      newCombatState.enemyMaxAp = enemyMaxAp;
      newCombatState.enemyCurrentAp = enemyMaxAp;

      // Who acts first — approach initiativeBonus / guaranteedFirst actually govern combat.
      const openingPlayerStats = playerStats ?? getPlayerFullStats(preparedPlayer);
      const openingEnemyStats = getEnemyFullStats(preparedEnemy);
      const whoFirst = determineTurnOrder(openingPlayerStats, openingEnemyStats, {
        isFirstTurn: true,
        playerGoesFirst: newCombatState.playerGoesFirst,
        playerInitiativeBonus: newCombatState.playerInitiativeBonus,
        terrain: newCombatState.terrain,
      });
      // Persist resolved roll for SEN strip / open banner (not just approach flags)
      newCombatState.openingInitHolder = whoFirst;

      addLog(`Range: ${initialRange}.`, 'info');

      if (whoFirst === 'player') {
        // Player opens: draw hand now and skip the first upkeep redraw.
        const opening = drawHand(
          playablePool,
          {
            posture: openingPosture,
            turnIndex: newCombatState.turnIndex,
            mainAttackId: normalizeSkillConfig(preparedPlayer.skillConfig).mainAttackId,
          },
          LaunchProperties.HAND_SIZE,
          Math.random,
        );
        newCombatState.currentAp = maxAp;
        newCombatState.hand = opening.hand;
        setUpkeepProcessedThisTurn(true);
        setTurnState('PLAYER');
        const postureLog = openingPostureLog(openingPosture, result.approach);
        if (postureLog) {
          addLog(postureLog, 'gain');
        }
        if (modifiers.playerGoesFirst || modifiers.playerInitiativeBonus > 0) {
          addLog('You seize the initiative!', 'info');
        } else if (modifiers.playerInitiativeBonus < 0) {
          addLog('You recovered initiative despite a failed approach.', 'info');
        }
      } else {
        // Enemy opens: player draws on their first turn via processUpkeep.
        newCombatState.currentAp = 0;
        newCombatState.hand = [];
        setUpkeepProcessedThisTurn(false);
        setTurnState('ENEMY_TURN');
        if (modifiers.playerInitiativeBonus < 0) {
          addLog('Failed approach — the enemy seizes the initiative!', 'danger');
        } else {
          addLog('The enemy acts first!', 'danger');
        }
      }

      setCombatState(newCombatState);
      setApproachResult(result);

      // Set up combat
      setPlayer(preparedPlayer);
      setEnemy(preparedEnemy);
      setGameState(GameState.COMBAT);
      addLog(`Engaged: ${newEnemy.name}`, 'danger');
      // A-003: surface opening telegraph in the combat log (UI can also read intendedSkillName)
      if (preparedEnemy.intendedSkillName) {
        addLog(`${preparedEnemy.name} prepares ${preparedEnemy.intendedSkillName}...`, 'danger');
      }

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
    victoryLockRef.current = false;
    skillActionLockRef.current = false;
    setEnemy(null);
    setCombatState(null);
    setApproachResult(null);
    setTurnState('PLAYER');
  }, []);

  // Auto-pass effect: When enabled and it's player's turn, count down and auto-pass
  useEffect(() => {
    if (
      !autoCombatEnabled ||
      turnState !== 'PLAYER' ||
      !enemy ||
      enemy.currentHp <= 0 ||
      !player ||
      player.currentHp <= 0
    ) {
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

    // Auto-pass after delay — share skillActionLockRef with passTurn / card play so
    // Space + timer same tick cannot double-log or race enemy-turn scheduling.
    // If a card is resolving at fire time, one short retry so auto-pass is not dropped
    // for the rest of the turn (silent no-op left players waiting on auto).
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const fireAutoPass = () => {
      if (skillActionLockRef.current) return false;
      // Victory/death may clear enemy in state before this effect re-runs and cancels
      // the timer — closed-over enemy still looks alive. victoryLockRef is set sync on
      // kill; also gate HP so we never schedule ENEMY_TURN after the fight ends.
      if (victoryLockRef.current) return true;
      if (!enemy || enemy.currentHp <= 0 || !player || player.currentHp <= 0) {
        return true; // treat as done — do not reschedule
      }
      skillActionLockRef.current = true;
      addLog('Auto-pass: Focusing on defense...', 'info');
      setTurnState('ENEMY_TURN');
      return true;
    };
    const autoPassTimer = setTimeout(() => {
      if (!fireAutoPass()) {
        retryTimer = setTimeout(() => {
          fireAutoPass();
        }, 50);
      }
    }, TIMING.AUTO_PASS_DELAY);

    return () => {
      clearTimeout(autoPassTimer);
      if (retryTimer != null) clearTimeout(retryTimer);
      clearInterval(countdownInterval);
      setAutoPassTimeRemaining(null);
    };
  }, [autoCombatEnabled, turnState, enemy, player, addLog, setTurnState]);

  // Enemy turn effect
  useEffect(() => {
    // Safety guard: skip if either side is gone/dead (prevents post-death reschedule hang)
    if (
      turnState === 'ENEMY_TURN' &&
      player &&
      player.currentHp > 0 &&
      enemy &&
      enemy.currentHp > 0 &&
      playerStats &&
      enemyStats
    ) {
      logTurnChange('PLAYER', 'ENEMY_TURN', 'Player action completed');

      const timer = setTimeout(() => {
        // Mid-delay hygiene: prior code set turn PLAYER for ANY dead actor, which left
        // a 0-HP player in COMBAT with a live enemy (ghost combat / no GAME_OVER).
        if (!player || player.currentHp <= 0) {
          logFlowCheckpoint('Enemy turn cancelled - player already defeated');
          setGameState(GameState.GAME_OVER);
          setEnemy(null);
          setCombatState(null);
          setTurnState('PLAYER');
          return;
        }
        if (!enemy) {
          // Victory already nulled the foe — stop ENEMY_TURN loop
          setTurnState('PLAYER');
          return;
        }
        if (enemy.currentHp <= 0) {
          // Corpse still present (victory race) — ensure reward path runs once
          logFlowCheckpoint('Enemy turn cancelled - enemy already defeated, ensuring victory');
          handleVictory();
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
          const enemySkill =
            enemy.skills.find((s) => s.id === enemy.intendedSkillId) ??
            enemy.skills[0];
          combatRef.current?.spawnFloatingText(
            'player',
            playerDamageTaken.toString(),
            isCrit ? 'crit' : 'damage',
            {
              damageType: enemySkill?.damageType,
              element: enemySkill?.element ?? enemy.element,
            },
          );
        } else if (result.logMessages.some((m) => m.includes('EVADED'))) {
          combatRef.current?.spawnFloatingText('player', 'EVADE', 'miss');
        } else if (result.logMessages.some((m) => m.includes('MISSED'))) {
          combatRef.current?.spawnFloatingText('player', 'MISS', 'miss');
        }

        // Check if enemy took DoT damage for floating text (tick — status tint)
        const enemyDamageTaken = enemy.currentHp - result.newEnemyHp;
        if (enemyDamageTaken > 0) {
          combatRef.current?.spawnFloatingText(
            'enemy',
            enemyDamageTaken.toString(),
            'status',
          );
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
                currentChakra: result.newPlayerChakra,
                activeBuffs: result.newPlayerBuffs,
                skills: result.playerSkills,
              }
            : null
        );

        // Update combatState: artifact guts + F2 range/enemy AP after enemy action
        setCombatState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            artifactGutsUsed: result.artifactGutsTriggered
              ? true
              : prev.artifactGutsUsed,
            currentRange: result.currentRange ?? prev.currentRange,
            enemyCurrentAp: result.enemyCurrentAp ?? prev.enemyCurrentAp,
            enemyMoveUsedThisTurn: result.enemyMoveUsedThisTurn ?? false,
            // Player turn starts next — reset player move flag on upkeep path
            playerMoveUsedThisTurn: false,
          };
        });

        if (result.enemyDefeated) {
          logFlowCheckpoint('Enemy defeated - calling handleVictory', { enemy: enemy.name });
          // handleVictory nulls enemy + sets PLAYER — do not setEnemy with corpse first
          handleVictory();
          setTurnState('PLAYER'); // Stop the effect from re-running
          return;
        } else if (result.playerDefeated) {
          // P1: prior path left ENEMY_TURN + live enemy → effect re-scheduled forever
          // (player/enemy identity change after setState, turnState stuck, GAME_OVER UI only).
          logFlowCheckpoint('Player defeated - GAME OVER');
          setGameState(GameState.GAME_OVER);
          setEnemy(null);
          setCombatState(null);
          setTurnState('PLAYER');
          return;
        }

        setEnemy((prev) =>
          prev
            ? {
                ...prev,
                currentHp: result.newEnemyHp,
                currentChakra: result.newEnemyChakra,
                activeBuffs: result.newEnemyBuffs,
                skills: result.enemySkills,
                // A-003: persist next-skill telegraph for UI / next enemy turn
                intendedSkillId: result.intendedSkillId,
                intendedSkillName: result.intendedSkillName,
                intentReason: result.intentReason,
              }
            : null
        );

        logTurnChange('ENEMY_TURN', 'PLAYER', 'Enemy turn completed');
        setTurnState('PLAYER');
      }, TIMING.ENEMY_TURN_DELAY);

      return () => clearTimeout(timer);
    }
  }, [turnState, player, enemy, playerStats, enemyStats, combatState, addLog, setPlayer, handleVictory, setGameState, setTurnState]);

  // Process upkeep when turn changes to PLAYER (after enemy turn).
  // T-004: restores the AP budget and deals a fresh, posture-weighted hand.
  useEffect(() => {
    // Skip when either actor is already dead — avoid redrawing a hand in a ghost combat
    // after mid-delay death cancel / victory race left turn on PLAYER briefly.
    if (
      turnState === 'PLAYER' &&
      player &&
      player.currentHp > 0 &&
      playerStats &&
      enemy &&
      enemy.currentHp > 0 &&
      combatState &&
      !upkeepProcessedThisTurn
    ) {
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

      // Refill AP and deal the new hand for this turn; reset F2 voluntary move + enemy AP
      setCombatState((prev) => {
        if (!prev) return prev;
        let eMax = prev.enemyMaxAp;
        if (enemy) {
          let budget = getEnemyFullStats(enemy).derived.actionPointsPerTurn;
          budget = applyRoomMovementCostToMaxAp(budget, prev.terrain);
          budget = applyMovementPenaltyToMaxAp(budget, prev.locationTerrainMods);
          eMax = budget;
        }
        return {
          ...prev,
          currentAp: upkeepResult.currentAp,
          maxAp: upkeepResult.maxAp,
          hand: upkeepResult.hand,
          activeModes: upkeepResult.activeModes,
          marks: upkeepResult.marks,
          turnIndex: upkeepResult.turnIndex,
          playerMoveUsedThisTurn: false,
          enemyMoveUsedThisTurn: false,
          enemyMaxAp: eMax,
          enemyCurrentAp: eMax,
        };
      });

      setUpkeepProcessedThisTurn(true);
    }
  }, [turnState, player, playerStats, enemy, combatState, upkeepProcessedThisTurn, addLog, setPlayer, setCombatState]);

  // Reset upkeep flag when turn changes to enemy
  useEffect(() => {
    if (turnState === 'ENEMY_TURN') {
      setUpkeepProcessedThisTurn(false);
    }
  }, [turnState]);

  // Clear skill lock after React commits turn / AP / hand (safe for multi-card turns)
  useEffect(() => {
    if (turnState === 'PLAYER') {
      skillActionLockRef.current = false;
    }
  }, [turnState, combatState?.currentAp, combatState?.hand]);

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
    passTurn,
    currentRange: combatState?.currentRange ?? null,
    moveInRange,
    playerMoveUsedThisTurn: combatState?.playerMoveUsedThisTurn ?? false,
  };
}
