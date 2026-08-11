import { useCallback, useEffect, useRef } from 'react';
import {
  Player, Enemy, Item, Skill, GameState, BranchingRoom, BranchingFloor,
  Region, LogEntry, ApproachType,
} from '../game/types';
import { CombatState } from '../game/systems/CombatWorkflowSystem';
import {
  getCurrentRoom, applyFloorHeatDelta,
} from '../game/systems/LocationSystem';
import {
  calculateLocationXP, calculateLocationRyo, INTEL_GAIN,
  dangerToFloor
} from '../game/systems/RegionSystem';
import {
  applyWealthToRyo
} from '../game/systems/ScalingSystem';
import { getEventFlagRunModifiers } from '../game/systems/EventSystem';
import { generateLoot, applyLootThemeGoldMultiplier } from '../game/systems/LootSystem';
import {
  applyVisibilityToIntelGain,
  getLocationTerrainMods,
} from '../game/systems/LocationTerrainSystem';
import { LOOT_BALANCE } from '../game/config';
import { FeatureFlags } from '../config/featureFlags';
import { chance } from '../game/utils/rng';
import { simulateGameCombat } from '../game/systems/CombatSimulationService';
import { logVictory, logRewardModal, logFlowCheckpoint } from '../game/utils/combatDebug';
import { logActivityComplete, logIntelGain } from '../game/utils/explorationDebug';
import {
  resolvePostActivityGameState,
  resolveVisitContext,
  completeActivityOnVisit,
  visitToFloorPatch,
} from '../game/session';
import {
  accumulateEncounterStage,
  canRollHeatEliteChain,
  createEmptyEncounterChain,
  mergeEncounterRewards,
  markAwaitingSecondFight,
  tryRollHeatEliteChain,
  type EncounterChainState,
  type EncounterRewardSlice,
} from '../game/systems/EncounterChainSystem';
import { generateEnemy } from '../game/systems/EnemySystem';
import type { ApproachResult } from '../game/systems/ApproachSystem';
import { TERRAIN_DEFINITIONS } from '../game/constants/terrain';

export interface VictoryState {
  player: Player | null;
  playerStats: any;
  currentDangerLevel: number;
  currentBaseDifficulty: number;
  difficulty: number;
  region: Region | null;
  currentLocation: any;
  branchingFloor: BranchingFloor | null;
  locationFloor: BranchingFloor | null;
  pendingArtifact: Item | null;
  currentIntel: number;
  /** When null after a victory, re-arm payout lock for the next fight. */
  combatReward: unknown;
}

export interface VictorySetters {
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  setBranchingFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;
  setLocationFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;
  setCurrentIntel: React.Dispatch<React.SetStateAction<number>>;
  setCombatReward: React.Dispatch<React.SetStateAction<any>>;
  setGameState: (state: GameState) => void;
  setEnemy: (enemy: Enemy | null) => void;
  setPendingArtifact: React.Dispatch<React.SetStateAction<Item | null>>;
  setDroppedItems: React.Dispatch<React.SetStateAction<Item[]>>;
  setDroppedSkill: React.Dispatch<React.SetStateAction<Skill | null>>;
}

export interface VictoryDeps {
  addLog: (text: string, type?: LogEntry['type'], details?: string) => void;
  checkLevelUp: (p: Player) => any;
  returnToMap: () => void;
  /**
   * F3: start a follow-up heat-chain elite fight without paying fight-1 rewards.
   * Optional — if missing, chain is disabled and fight 1 commits immediately.
   */
  startCombat?: (
    enemy: Enemy,
    result: ApproachResult,
    playerAfterCosts: Player,
    terrain: any,
    locationTerrainMods?: any,
    roomCombatModifiers?: any,
  ) => void;
}

function frontalOpenApproach(visitHeat: number, description: string): ApproachResult {
  return {
    approach: ApproachType.FRONTAL_ASSAULT,
    success: true,
    successChance: 100,
    roll: 1,
    skipCombat: false,
    guaranteedFirst: false,
    initiativeBonus: 0,
    firstHitMultiplier: 1,
    enemyHpReduction: 0,
    playerBuffs: [],
    enemyDebuffs: [],
    chakraCost: 0,
    hpCost: 0,
    xpMultiplier: 1,
    heatDelta: 0,
    visitHeat,
    description,
  };
}

export function useCombatVictory(
  state: VictoryState,
  setters: VictorySetters,
  deps: VictoryDeps
) {
  const {
    player, playerStats, currentDangerLevel, currentBaseDifficulty, difficulty,
    region, currentLocation, branchingFloor, locationFloor,
    pendingArtifact, currentIntel, combatReward,
  } = state;

  const {
    setPlayer, setBranchingFloor, setLocationFloor, setCurrentIntel,
    setCombatReward, setGameState, setEnemy, setPendingArtifact, setDroppedItems, setDroppedSkill
  } = setters;

  const { addLog, checkLevelUp, returnToMap, startCombat } = deps;

  /**
   * Blocks double XP/ryo when auto-combat / event-sim call handleCombatVictory twice
   * (manual path also uses victoryLockRef in useCombat). Re-arm when combatReward
   * is cleared so the next fight can pay out.
   */
  const combatVictoryLockRef = useRef(false);

  /** F3 EncounterChain buffer — not paid until commit. Forfeit on fight-2 death. */
  const encounterChainRef = useRef<EncounterChainState>(createEmptyEncounterChain());

  useEffect(() => {
    if (!combatReward) {
      combatVictoryLockRef.current = false;
    }
  }, [combatReward]);

  const buildRewardSlice = useCallback((
    defeatedEnemy: Enemy,
    combatStateAtVictory: CombatState | null,
    opts: { isHeatChainElite: boolean; forceXpMult?: number },
  ): EncounterRewardSlice => {
    const xpMultiplier =
      opts.forceXpMult ??
      (opts.isHeatChainElite ? 1.0 : (combatStateAtVictory?.xpMultiplier || 1.0));
    const rewardMult = defeatedEnemy.rewardMultiplier ?? 1;

    const isAmbush = defeatedEnemy?.tier.includes('S-Rank');
    const isGuardian = defeatedEnemy?.tier === 'Guardian';
    const isHunter = !!defeatedEnemy?.isHunter || defeatedEnemy?.tier === 'Hunter';
    const enemyTier = defeatedEnemy?.tier || 'Chunin';

    const baseExp = calculateLocationXP(currentDangerLevel, currentBaseDifficulty);
    const tierBonus = isHunter
      ? 400
      : isGuardian
        ? 300
        : enemyTier === 'Jonin'
          ? 20
          : enemyTier === 'Kage Level'
            ? 200
            : isAmbush
              ? 100
              : opts.isHeatChainElite
                ? 40
                : 0;
    const expGain = Math.floor((baseExp + tierBonus) * xpMultiplier * rewardMult);

    const baseRyo = calculateLocationRyo(currentDangerLevel, currentBaseDifficulty);
    const locationWealthLevel = currentLocation?.wealthLevel ?? 4;
    let ryoGain = applyWealthToRyo(baseRyo, locationWealthLevel);
    const flagMods = player ? getEventFlagRunModifiers(player) : { ryoMultiplier: 1, damageBonus: 0, activeLabels: [] as string[] };
    if (flagMods.ryoMultiplier !== 1) {
      ryoGain = Math.floor(ryoGain * flagMods.ryoMultiplier);
    }
    const goldMult = region?.lootTheme?.goldMultiplier ?? 1;
    ryoGain = applyLootThemeGoldMultiplier(ryoGain, region?.lootTheme);
    ryoGain = Math.floor(ryoGain * rewardMult);

    const ryoNoteParts: string[] = [];
    if (locationWealthLevel !== 4) {
      ryoNoteParts.push(locationWealthLevel > 4 ? 'wealthy area' : 'poor area');
    }
    if (flagMods.ryoMultiplier !== 1) {
      ryoNoteParts.push(`story ×${flagMods.ryoMultiplier}`);
    }
    if (goldMult !== 1) {
      ryoNoteParts.push(`region Ryo ×${goldMult}`);
    }
    if (rewardMult !== 1) {
      ryoNoteParts.push(`foe ×${rewardMult}`);
    }
    const ryoNote = ryoNoteParts.length > 0 ? ryoNoteParts.join(' · ') : null;

    let intelGain = 0;
    let baseIntelGain = 0;
    let fogNote: string | null = null;
    if (region) {
      const locMods = getLocationTerrainMods(currentLocation?.terrainEffects);
      baseIntelGain = INTEL_GAIN.COMBAT_VICTORY;
      intelGain = applyVisibilityToIntelGain(baseIntelGain, locMods);
      if (intelGain !== baseIntelGain) {
        const fogPct = Math.round((locMods.visibilityPenalty || 0) * 100);
        fogNote = `Fog reduced intel (visibility ${fogPct > 0 ? '+' : ''}${fogPct}%)`;
      }
    }

    const wasEliteChallenge = pendingArtifact !== null && !opts.isHeatChainElite;
    let lootPreviews: Item[] = [];
    if (wasEliteChallenge && pendingArtifact) {
      lootPreviews = [pendingArtifact];
    } else if (isHunter) {
      // Guaranteed artifact for Hunter
      const effectiveFloor = dangerToFloor(currentDangerLevel, currentBaseDifficulty);
      const drop = generateLoot(
        effectiveFloor,
        difficulty,
        currentLocation?.lootTable,
        region?.lootTheme,
      );
      lootPreviews = [drop];
    } else if (!wasEliteChallenge) {
      if (chance(LOOT_BALANCE.COMBAT_ITEM_DROP_CHANCE) || opts.isHeatChainElite) {
        const effectiveFloor = dangerToFloor(currentDangerLevel, currentBaseDifficulty);
        const drop = generateLoot(
          effectiveFloor,
          difficulty,
          currentLocation?.lootTable,
          region?.lootTheme,
        );
        lootPreviews = [drop];
      }
    }

    return {
      expGain,
      ryoGain,
      intelGain,
      baseIntelGain,
      fogNote,
      ryoNote,
      lootPreviews,
      xpMultiplier,
      enemyName: defeatedEnemy.name,
      enemyTier,
      isHeatChainElite: opts.isHeatChainElite,
    };
  }, [
    currentDangerLevel, currentBaseDifficulty, currentLocation, player, region,
    pendingArtifact, difficulty,
  ]);

  const commitEncounterRewards = useCallback((chain: EncounterChainState) => {
    const merged = mergeEncounterRewards(chain);
    const wasEliteChallenge = pendingArtifact !== null && !chain.stages.some(s => s.isHeatChainElite);

    // Complete activity only on commit — single floor via VisitContext / floorKind
    if (chain.activity) {
      const { roomId, activityType, floorKind } = chain.activity;

      // Prefer explicit floorKind from chain when the matching floor is present
      let visit = resolveVisitContext({ locationFloor, branchingFloor });
      if (floorKind === 'location' && locationFloor) {
        visit = { kind: 'location', floor: locationFloor };
      } else if (floorKind === 'branching' && branchingFloor) {
        visit = { kind: 'branching', floor: branchingFloor };
      }

      if (visit) {
        let next = completeActivityOnVisit(visit, roomId, activityType);
        // completeActivity does not move currentRoomId — repair if snapshot was off-room
        if (next.floor.currentRoomId !== roomId) {
          next = {
            ...next,
            floor: {
              ...next.floor,
              currentRoomId: roomId,
              rooms: next.floor.rooms.map(room => ({
                ...room,
                isCurrent: room.id === roomId,
              })),
            },
          };
        }
        const updatedRoom = next.floor.rooms.find(r => r.id === roomId);
        if (updatedRoom?.isCleared && updatedRoom.isExit) {
          if (next.kind === 'location') {
            addLog('Location cleared! Return when ready to choose the next destination.', 'gain');
          } else {
            addLog('You cleared the exit! Proceed to the next floor?', 'gain');
          }
        }
        const patch = visitToFloorPatch(next);
        if (patch.locationFloor) setLocationFloor(patch.locationFloor);
        if (patch.branchingFloor) setBranchingFloor(patch.branchingFloor);
      }
    }

    if (merged.intelGain > 0) {
      setCurrentIntel(prev => Math.min(100, prev + merged.intelGain));
      logIntelGain('Combat', merged.intelGain, Math.min(100, currentIntel + merged.intelGain));
      if (merged.fogNote) {
        addLog(`Gained +${merged.intelGain}% intel (${merged.fogNote}).`, 'info');
      } else {
        addLog(`Gained +${merged.intelGain}% intel.`, 'info');
      }
    }

    let levelUpInfo: { oldLevel: number; newLevel: number; statGains: Record<string, number> } | undefined;

    setPlayer(prev => {
      if (!prev) return null;
      let updatedPlayer = { ...prev, exp: prev.exp + merged.expGain };
      addLog(`Gained ${merged.expGain} Experience.`, 'info');
      const levelUpResult = checkLevelUp(updatedPlayer);
      updatedPlayer = levelUpResult.player;
      levelUpInfo = levelUpResult.levelUpInfo;
      updatedPlayer = {
        ...updatedPlayer,
        ryo: updatedPlayer.ryo + merged.ryoGain,
      };
      addLog(
        `Gained ${merged.ryoGain} Ryō${merged.ryoNote ? ` (${merged.ryoNote})` : ''}.`,
        'loot',
      );
      return updatedPlayer;
    });

    logVictory(merged.enemyNames.join(' + ') || 'Enemy', {
      xpGain: merged.expGain,
      ryoGain: merged.ryoGain,
      levelUp: !!levelUpInfo
    });

    if (merged.lootPreviews.length > 0) {
      setDroppedItems(merged.lootPreviews);
      setDroppedSkill(null);
      for (const drop of merged.lootPreviews) {
        addLog(`Found ${drop.name}!`, 'loot');
      }
    } else if (!wasEliteChallenge) {
      setDroppedItems([]);
      setDroppedSkill(null);
    }

    logRewardModal('show', { xpGain: merged.expGain, ryoGain: merged.ryoGain, levelUp: !!levelUpInfo });
    setCombatReward({
      expGain: merged.expGain,
      ryoGain: merged.ryoGain,
      levelUp: levelUpInfo,
      lootPreviews: merged.lootPreviews,
      continuesToLoot: merged.lootPreviews.length > 0,
      intelGain: merged.intelGain > 0 ? merged.intelGain : undefined,
      baseIntelGain:
        merged.intelGain > 0 && merged.intelGain !== merged.baseIntelGain
          ? merged.baseIntelGain
          : undefined,
      fogNote: merged.fogNote || undefined,
      ryoNote: merged.ryoNote || undefined,
      chainStages: merged.stages > 1 ? merged.stages : undefined,
    });

    encounterChainRef.current = createEmptyEncounterChain();
    logFlowCheckpoint('Transitioning to explore with reward modal (commit)');
    setGameState(
      resolvePostActivityGameState(
        region,
        resolveVisitContext({ locationFloor, branchingFloor }),
      ),
    );
  }, [
    pendingArtifact, branchingFloor, locationFloor, region, currentIntel,
    setBranchingFloor, setLocationFloor, setCurrentIntel, setPlayer, setCombatReward,
    setGameState, setDroppedItems, setDroppedSkill, addLog, checkLevelUp,
  ]);

  const handleCombatVictory = useCallback((defeatedEnemy: Enemy, combatStateAtVictory: CombatState | null) => {
    if (combatVictoryLockRef.current) {
      logFlowCheckpoint('handleCombatVictory SKIP (already applied)', {
        enemy: defeatedEnemy.name,
      });
      return;
    }
    combatVictoryLockRef.current = true;

    logFlowCheckpoint('handleCombatVictory START', {
      enemy: defeatedEnemy.name,
      tier: defeatedEnemy.tier,
      dangerLevel: currentDangerLevel
    });

    addLog("Enemy Defeated!", 'gain');

    const wasEliteChallenge = pendingArtifact !== null;
    const chain = encounterChainRef.current;
    // Detect fight-2 of heat chain (rewards still buffered from fight 1)
    const finishingHeatElite = chain.awaitingSecondFight;

    const slice = buildRewardSlice(defeatedEnemy, combatStateAtVictory, {
      isHeatChainElite: finishingHeatElite,
      forceXpMult: finishingHeatElite ? 1.0 : undefined,
    });

    const room =
      (locationFloor && getCurrentRoom(locationFloor)) ||
      (branchingFloor && getCurrentRoom(branchingFloor)) ||
      null;
    const floorKind: 'location' | 'branching' | null = locationFloor
      ? 'location'
      : branchingFloor
        ? 'branching'
        : null;

    let nextChain = accumulateEncounterStage(
      finishingHeatElite ? chain : createEmptyEncounterChain(),
      slice,
      room && floorKind
        ? {
            roomId: room.id,
            activityType: wasEliteChallenge ? 'eliteChallenge' : 'combat',
            floorKind,
          }
        : chain.activity,
    );

    // Heat at roll: prefer locationFloor (visit runtime)
    const visitFloor = locationFloor ?? branchingFloor;
    const heat = visitFloor?.heat ?? 0;

    if (finishingHeatElite) {
      // Dual win → single commit
      encounterChainRef.current = nextChain;
      commitEncounterRewards(nextChain);
      return;
    }

    // Roll heat elite chain after Normal win (pre-pay)
    const eligible = canRollHeatEliteChain({
      heat,
      enemy: defeatedEnemy,
      wasAuthoredEliteChallenge: wasEliteChallenge,
      isTutorial: false,
      alreadyInChain: false,
    });

    if (eligible && player && tryRollHeatEliteChain(heat)) {
      nextChain = markAwaitingSecondFight(nextChain, heat);
      encounterChainRef.current = nextChain;

      addLog('Ambush! Heat draws an elite response — rewards held until the fight ends.', 'danger');

      const elite = generateEnemy(
        currentDangerLevel,
        player.locationsCleared ?? 0,
        'ELITE',
        difficulty,
        visitFloor?.arc ?? 'WAVES_ARC',
        undefined,
        visitFloor?.enemyPool,
        visitFloor?.preferredElement,
      );
      elite.name = elite.name.startsWith('Elite') ? elite.name : `Elite ${elite.name}`;

      // Auto-sim path: resolve fight 2 immediately without UI (same accumulate API)
      if (!FeatureFlags.ENABLE_MANUAL_COMBAT || !startCombat) {
        const locMods = getLocationTerrainMods(currentLocation?.terrainEffects);
        const sim2 = simulateGameCombat(
          player,
          playerStats,
          elite,
          undefined,
          room?.terrain,
          locMods,
          room?.activities.combat?.modifiers,
          heat,
        );
        setPlayer(prev => {
          if (!prev) return null;
          return {
            ...prev,
            currentHp: Math.max(1, sim2.playerHpRemaining),
            currentChakra: sim2.playerChakraRemaining,
          };
        });
        if (!sim2.won) {
          encounterChainRef.current = createEmptyEncounterChain();
          addLog(`Defeated by ambush elite ${elite.name} — uncommitted rewards forfeited.`, 'danger');
          setGameState(GameState.GAME_OVER);
          return;
        }
        addLog(`Ambush cleared! Defeated ${elite.name}.`, 'gain');
        combatVictoryLockRef.current = false;
        handleCombatVictory(elite, null);
        return;
      }

      const terrain = room?.terrain
        ? TERRAIN_DEFINITIONS[room.terrain]
        : TERRAIN_DEFINITIONS[Object.keys(TERRAIN_DEFINITIONS)[0] as keyof typeof TERRAIN_DEFINITIONS];
      const locMods = getLocationTerrainMods(currentLocation?.terrainEffects);
      const roomMods =
        room?.activities.combat?.modifiers
        ?? room?.activities.eliteChallenge?.modifiers
        ?? null;

      // Re-arm victory lock for fight 2 (startCombat also clears its lock)
      combatVictoryLockRef.current = false;

      startCombat(
        elite,
        frontalOpenApproach(heat, 'Heat ambush — no approach bonus.'),
        player,
        terrain,
        locMods,
        roomMods,
      );
      setGameState(GameState.COMBAT);
      return;
    }

    // Single fight (or chain not rolled) → commit immediately
    encounterChainRef.current = nextChain;
    commitEncounterRewards(nextChain);
  }, [
    branchingFloor, region, currentDangerLevel, currentBaseDifficulty, addLog, pendingArtifact,
    locationFloor, currentLocation, difficulty, player, startCombat,
    buildRewardSlice, commitEncounterRewards, setGameState,
  ]);

  const handleAutoCombat = useCallback((
    room: BranchingRoom,
    floor: BranchingFloor,
    setFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>
  ) => {
    if (!player || !playerStats || !room.activities.combat) return;

    const combatEnemy = room.activities.combat.enemy;
    addLog(`Auto-combat started against ${combatEnemy.name}...`, 'info');

    const locMods = getLocationTerrainMods(currentLocation?.terrainEffects);
    const result = simulateGameCombat(
      player,
      playerStats,
      combatEnemy,
      undefined,
      room.terrain,
      locMods,
      room.activities.combat?.modifiers,
      floor.heat ?? 0,
    );

    setPlayer(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentHp: Math.max(1, result.playerHpRemaining),
        currentChakra: result.playerChakraRemaining,
      };
    });

    if (result.won) {
      addLog(`Victory! Defeated ${combatEnemy.name} in ${result.turnsElapsed} turns.`, 'gain');
      if (result.gutsTriggered > 0) {
        addLog(`Guts triggered ${result.gutsTriggered} time(s)!`, 'info');
      }

      // Activity completion deferred to commit inside handleCombatVictory
      // Keep floor pointer current for room id lookup
      setFloor(floor);

      handleCombatVictory(combatEnemy, null);
    } else {
      // Death mid-chain forfeits buffer
      encounterChainRef.current = createEmptyEncounterChain();
      addLog(`Defeated by ${combatEnemy.name} after ${result.turnsElapsed} turns...`, 'danger');
      setGameState(GameState.GAME_OVER);
    }
  }, [player, playerStats, addLog, handleCombatVictory, setGameState, setPlayer, currentLocation]);

  const handleAutoEliteCombat = useCallback((
    room: BranchingRoom,
    eliteEnemy: Enemy,
    artifact: Item,
    floor: BranchingFloor,
    setFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>
  ) => {
    if (!player || !playerStats) return;

    addLog(`Auto-combat started against elite: ${eliteEnemy.name}...`, 'danger');

    const eliteLocMods = getLocationTerrainMods(currentLocation?.terrainEffects);
    const result = simulateGameCombat(
      player,
      playerStats,
      eliteEnemy,
      undefined,
      room.terrain,
      eliteLocMods,
      room.activities.eliteChallenge?.modifiers
        ?? room.activities.combat?.modifiers,
      floor.heat ?? 0,
    );

    setPlayer(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentHp: Math.max(1, result.playerHpRemaining),
        currentChakra: result.playerChakraRemaining,
      };
    });

    if (result.won) {
      addLog(`Victory! Defeated elite ${eliteEnemy.name} in ${result.turnsElapsed} turns.`, 'gain');
      addLog(`Obtained artifact: ${artifact.name}!`, 'loot');

      setFloor(floor);
      setPendingArtifact(artifact);
      handleCombatVictory(eliteEnemy, null);
    } else {
      encounterChainRef.current = createEmptyEncounterChain();
      addLog(`Defeated by elite ${eliteEnemy.name} after ${result.turnsElapsed} turns...`, 'danger');
      setGameState(GameState.GAME_OVER);
    }
  }, [player, playerStats, addLog, handleCombatVictory, setGameState, setPlayer, setPendingArtifact, currentLocation]);

  return {
    handleCombatVictory,
    handleAutoCombat,
    handleAutoEliteCombat
  };
}
