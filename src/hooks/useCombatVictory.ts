import { useCallback, useEffect, useRef } from 'react';
import {
  Player, Enemy, Item, Skill, GameState, BranchingRoom, BranchingFloor,
  Region, LogEntry
} from '../game/types';
import { CombatState } from '../game/systems/CombatWorkflowSystem';
import {
  getCurrentRoom, completeActivity, addMapPiece, getTreasureHuntReward
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
import { chance } from '../game/utils/rng';
import { simulateGameCombat } from '../game/systems/CombatSimulationService';
import { logVictory, logRewardModal, logFlowCheckpoint } from '../game/utils/combatDebug';
import { logActivityComplete, logIntelGain } from '../game/utils/explorationDebug';
import { resolveExploreReturnState } from './useExploration';

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
  selectedBranchingRoom: BranchingRoom | null;
  pendingArtifact: Item | null;
  currentTreasure: any;
  currentTreasureHunt: any;
  currentIntel: number;
  /** When null after a victory, re-arm payout lock for the next fight. */
  combatReward: unknown;
}

export interface VictorySetters {
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  setBranchingFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;
  setLocationFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;
  setCurrentIntel: React.Dispatch<React.SetStateAction<number>>;
  setDiceRollResult: React.Dispatch<React.SetStateAction<any>>;
  setTreasureHuntReward: React.Dispatch<React.SetStateAction<any>>;
  setCurrentTreasureHunt: React.Dispatch<React.SetStateAction<any>>;
  setCurrentTreasure: React.Dispatch<React.SetStateAction<any>>;
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
}

export function useCombatVictory(
  state: VictoryState,
  setters: VictorySetters,
  deps: VictoryDeps
) {
  const {
    player, playerStats, currentDangerLevel, currentBaseDifficulty, difficulty,
    region, currentLocation, branchingFloor, locationFloor, selectedBranchingRoom,
    pendingArtifact, currentTreasure, currentTreasureHunt, currentIntel, combatReward,
  } = state;

  const {
    setPlayer, setBranchingFloor, setLocationFloor, setCurrentIntel,
    setDiceRollResult, setTreasureHuntReward, setCurrentTreasureHunt, setCurrentTreasure,
    setCombatReward, setGameState, setEnemy, setPendingArtifact, setDroppedItems, setDroppedSkill
  } = setters;

  const { addLog, checkLevelUp, returnToMap } = deps;

  /**
   * Blocks double XP/ryo when auto-combat / event-sim call handleCombatVictory twice
   * (manual path also uses victoryLockRef in useCombat). Re-arm when combatReward
   * is cleared so the next fight can pay out.
   */
  const combatVictoryLockRef = useRef(false);

  useEffect(() => {
    if (!combatReward) {
      combatVictoryLockRef.current = false;
    }
  }, [combatReward]);

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

    // Check if this was a Treasure Guardian fight (name only — do not gate on hunt state)
    const wasTreasureGuardian = defeatedEnemy.name === 'Treasure Guardian';

    // Determine if this was an elite challenge (check pendingArtifact)
    const wasEliteChallenge = pendingArtifact !== null;

    // Complete the appropriate activity in branching floor
    // Skip for treasure guardian - that's handled separately below
    if (branchingFloor && !wasTreasureGuardian) {
      setBranchingFloor(prevFloor => {
        if (!prevFloor) return prevFloor;
        const combatRoom = getCurrentRoom(prevFloor);  // Uses currentRoomId set by moveToRoom
        if (!combatRoom) return prevFloor;

        // Mark the correct activity as completed
        const activityType = wasEliteChallenge ? 'eliteChallenge' : 'combat';
        let updatedFloor = completeActivity(prevFloor, combatRoom.id, activityType);
        if (updatedFloor.currentRoomId !== combatRoom.id) {
          updatedFloor = {
            ...updatedFloor,
            currentRoomId: combatRoom.id,
            rooms: updatedFloor.rooms.map(room => ({
              ...room,
              isCurrent: room.id === combatRoom.id,
            })),
          };
        }

        const updatedRoom = updatedFloor.rooms.find(r => r.id === combatRoom.id);
        if (updatedRoom?.isCleared && updatedRoom.isExit) {
          addLog('You cleared the exit! Proceed to the next floor?', 'gain');
        }

        return updatedFloor;
      });
    }

    // Complete the appropriate activity in location mode (using locationFloor)
    // Skip for treasure guardian - that's handled separately below
    if (locationFloor && region && !wasTreasureGuardian) {
      setLocationFloor(prevFloor => {
        if (!prevFloor) return prevFloor;
        const combatRoom = getCurrentRoom(prevFloor);
        if (!combatRoom) return prevFloor;

        // Mark the correct activity as completed
        const activityType = wasEliteChallenge ? 'eliteChallenge' : 'combat';
        let updatedFloor = completeActivity(prevFloor, combatRoom.id, activityType);
        if (updatedFloor.currentRoomId !== combatRoom.id) {
          updatedFloor = {
            ...updatedFloor,
            currentRoomId: combatRoom.id,
            rooms: updatedFloor.rooms.map(room => ({
              ...room,
              isCurrent: room.id === combatRoom.id,
            })),
          };
        }

        const updatedRoom = updatedFloor.rooms.find(r => r.id === combatRoom.id);
        if (updatedRoom?.isCleared && updatedRoom.isExit) {
          // Meta completion (mark + deck + cards + locationsCleared) runs in
          // returnToMap / completeLocationAndReturnToRegion after rewards close.
          addLog('Location cleared! Return when ready to choose the next destination.', 'gain');
        }

        return updatedFloor;
      });
    }

    // Apply XP multiplier from approach
    const xpMultiplier = combatStateAtVictory?.xpMultiplier || 1.0;

    // Calculate rewards outside setPlayer so we can use them for the modal
    const isAmbush = defeatedEnemy?.tier.includes('S-Rank');
    const isGuardian = defeatedEnemy?.tier === 'Guardian';
    const enemyTier = defeatedEnemy?.tier || 'Chunin';

    const baseExp = calculateLocationXP(currentDangerLevel, currentBaseDifficulty);
    const tierBonus = isGuardian ? 300 : enemyTier === 'Jonin' ? 20 : enemyTier === 'Kage Level' ? 200 : isAmbush ? 100 : 0;
    const expGain = Math.floor((baseExp + tierBonus) * xpMultiplier);

    // Apply wealth multiplier + T-034 event-flag ryo modifiers + T-061 region gold
    const baseRyo = calculateLocationRyo(currentDangerLevel, currentBaseDifficulty);
    const locationWealthLevel = currentLocation?.wealthLevel ?? 4;
    let ryoGain = applyWealthToRyo(baseRyo, locationWealthLevel);
    const flagMods = player ? getEventFlagRunModifiers(player) : { ryoMultiplier: 1, damageBonus: 0, activeLabels: [] as string[] };
    if (flagMods.ryoMultiplier !== 1) {
      ryoGain = Math.floor(ryoGain * flagMods.ryoMultiplier);
    }
    // T-061: region lootTheme.goldMultiplier (Waves 0.8 … War 1.2)
    const goldMult = region?.lootTheme?.goldMultiplier ?? 1;
    ryoGain = applyLootThemeGoldMultiplier(ryoGain, region?.lootTheme);
    // T-089: notes for RewardModal / log (wealth + story + region ryo)
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
    const ryoNote = ryoNoteParts.length > 0 ? ryoNoteParts.join(' · ') : null;

    // Add intel from combat victory (+5%, reduced by location visibility_penalty T-067)
    // T-087: keep base/effective for RewardModal fog honesty
    let intelGain = 0;
    let baseIntelGain = 0;
    let fogNote: string | null = null;
    if (region) {
      const locMods = getLocationTerrainMods(currentLocation?.terrainEffects);
      baseIntelGain = INTEL_GAIN.COMBAT_VICTORY;
      intelGain = applyVisibilityToIntelGain(baseIntelGain, locMods);
      setCurrentIntel(prev => Math.min(100, prev + intelGain));
      logIntelGain('Combat', intelGain, Math.min(100, currentIntel + intelGain));
      if (intelGain !== baseIntelGain) {
        const fogPct = Math.round((locMods.visibilityPenalty || 0) * 100);
        fogNote = `Fog reduced intel (visibility ${fogPct > 0 ? '+' : ''}${fogPct}%)`;
        addLog(`Gained +${intelGain}% intel (fog: ${baseIntelGain}%→${intelGain}%).`, 'info');
      } else if (intelGain > 0) {
        addLog(`Gained +${intelGain}% intel.`, 'info');
      }
    }

    let levelUpInfo: { oldLevel: number; newLevel: number; statGains: Record<string, number> } | undefined;

    setPlayer(prev => {
      if (!prev) return null;

      let updatedPlayer = { ...prev, exp: prev.exp + expGain };
      addLog(`Gained ${expGain} Experience${xpMultiplier > 1 ? ` (${Math.round((xpMultiplier - 1) * 100)}% bonus!)` : ''}.`, 'info');

      const levelUpResult = checkLevelUp(updatedPlayer);
      updatedPlayer = levelUpResult.player;
      levelUpInfo = levelUpResult.levelUpInfo;

      updatedPlayer.ryo += ryoGain;
      addLog(
        `Gained ${ryoGain} Ryō${ryoNote ? ` (${ryoNote})` : ''}.`,
        'loot',
      );

      return updatedPlayer;
    });

    // Log victory rewards
    logVictory(defeatedEnemy.name, {
      xpGain: expGain,
      ryoGain: ryoGain,
      levelUp: !!levelUpInfo
    });

    // Normal combat (non-elite, non-guardian): chance to drop Broken components.
    // Elite rewards use pendingArtifact → LOOT after the reward modal; do not
    // overwrite that path. Treasure guardians use map pieces instead.
    // T-035: keep local previews for RewardModal (setState is async).
    let lootPreviews: Item[] = [];
    if (wasEliteChallenge && pendingArtifact) {
      lootPreviews = [pendingArtifact];
    } else if (!wasEliteChallenge && !wasTreasureGuardian) {
      if (chance(LOOT_BALANCE.COMBAT_ITEM_DROP_CHANCE)) {
        const effectiveFloor = dangerToFloor(currentDangerLevel, currentBaseDifficulty);
        // T-059/T-061: bias combat drops by location lootTable + region lootTheme
        const drop = generateLoot(
          effectiveFloor,
          difficulty,
          currentLocation?.lootTable,
          region?.lootTheme,
        );
        lootPreviews = [drop];
        setDroppedItems([drop]);
        setDroppedSkill(null);
        addLog(`Found ${drop.name}!`, 'loot');
      } else {
        setDroppedItems([]);
        setDroppedSkill(null);
      }
    }

    // Handle Treasure Guardian victory - award guaranteed map piece
    if (wasTreasureGuardian && locationFloor) {
      const { floor: updatedFloorWithPiece, isComplete } = addMapPiece(locationFloor);
      const newHunt = updatedFloorWithPiece.treasureHunt;

      // Complete the treasure activity
      const combatRoom = selectedBranchingRoom || getCurrentRoom(updatedFloorWithPiece);
      let finalFloor = updatedFloorWithPiece;
      if (combatRoom) {
        finalFloor = completeActivity(updatedFloorWithPiece, combatRoom.id, 'treasure');
      }

      if (newHunt) {
        setDiceRollResult({
          type: 'piece',
          piecesCollected: newHunt.collectedPieces,
          piecesRequired: newHunt.requiredPieces,
        });
        addLog(`Guardian defeated! Found a map piece! (${newHunt.collectedPieces}/${newHunt.requiredPieces})`, 'loot');
      }

      // Check if map is complete
      if (isComplete && newHunt) {
        const wealthLevel = currentLocation?.wealthLevel ?? 4;
        const reward = getTreasureHuntReward(
          newHunt.collectedPieces,
          wealthLevel,
          currentDangerLevel,
          difficulty,
          currentLocation?.lootTable,
          region?.lootTheme,
        );
        setTreasureHuntReward({
          items: reward.items,
          skills: reward.skills,
          ryo: reward.ryo,
          piecesCollected: newHunt.collectedPieces,
          wealthLevel,
        });
        setLocationFloor({ ...finalFloor, treasureHunt: null, treasureProbabilityBoost: 0 });
      } else {
        setLocationFloor(finalFloor);
      }

      setCurrentTreasureHunt(newHunt);
      setCurrentTreasure(null);

      // Show combat reward modal first, then dice result modal will show after.
      // Set explore state in the same turn as combatReward — delayed setGameState left
      // COMBAT + null enemy + reward staged for ~100ms with no Combat UI and no RewardModal
      // (RewardModal only mounts on LOCATION_EXPLORE / REGION_MAP).
      setCombatReward({
        expGain,
        ryoGain,
        levelUp: levelUpInfo,
        lootPreviews: [],
        continuesToLoot: false,
        intelGain: intelGain > 0 ? intelGain : undefined,
        baseIntelGain:
          intelGain > 0 && intelGain !== baseIntelGain ? baseIntelGain : undefined,
        fogNote: fogNote || undefined,
        ryoNote: ryoNote || undefined,
      });
      setGameState(resolveExploreReturnState(region, !!locationFloor));
      return;
    }

    // Show reward modal instead of returning to map immediately
    logRewardModal('show', { xpGain: expGain, ryoGain: ryoGain, levelUp: !!levelUpInfo });
    setCombatReward({
      expGain,
      ryoGain,
      levelUp: levelUpInfo,
      lootPreviews,
      continuesToLoot: lootPreviews.length > 0,
      intelGain: intelGain > 0 ? intelGain : undefined,
      baseIntelGain:
        intelGain > 0 && intelGain !== baseIntelGain ? baseIntelGain : undefined,
      fogNote: fogNote || undefined,
      ryoNote: ryoNote || undefined,
    });

    // Same-turn explore transition so RewardModal mounts with combatReward (no blank COMBAT beat).
    logFlowCheckpoint('Transitioning to explore with reward modal');
    setGameState(resolveExploreReturnState(region, !!locationFloor));
  }, [
    branchingFloor, region, currentDangerLevel, currentBaseDifficulty, addLog, pendingArtifact,
    currentTreasureHunt, locationFloor, selectedBranchingRoom, currentLocation, difficulty,
    setDiceRollResult, setTreasureHuntReward, setCurrentTreasureHunt, setCurrentTreasure,
    setBranchingFloor, setLocationFloor, setCurrentIntel, setPlayer, setCombatReward,
    setGameState, checkLevelUp, currentIntel, setDroppedItems, setDroppedSkill
  ]);

  const handleAutoCombat = useCallback((
    room: BranchingRoom,
    floor: BranchingFloor,
    setFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>
  ) => {
    if (!player || !playerStats || !room.activities.combat) return;

    const combatEnemy = room.activities.combat.enemy;
    addLog(`Auto-combat started against ${combatEnemy.name}...`, 'info');

    // Run simulation
    const locMods = getLocationTerrainMods(currentLocation?.terrainEffects);
    const result = simulateGameCombat(
      player,
      playerStats,
      combatEnemy,
      undefined,
      room.terrain,
      locMods,
      room.activities.combat?.modifiers,
    );

    // Update player HP and chakra based on simulation result
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

      // Complete the activity in the floor
      const updatedFloor = completeActivity(floor, room.id, 'combat');
      setFloor(updatedFloor);

      // Call victory handler
      handleCombatVictory(combatEnemy, null);
    } else {
      addLog(`Defeated by ${combatEnemy.name} after ${result.turnsElapsed} turns...`, 'danger');
      setGameState(GameState.GAME_OVER);
    }
  }, [player, playerStats, addLog, handleCombatVictory, setGameState, setPlayer]);

  const handleAutoEliteCombat = useCallback((
    room: BranchingRoom,
    eliteEnemy: Enemy,
    artifact: Item,
    floor: BranchingFloor,
    setFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>
  ) => {
    if (!player || !playerStats) return;

    addLog(`Auto-combat started against elite guardian: ${eliteEnemy.name}...`, 'danger');

    // Run simulation
    const eliteLocMods = getLocationTerrainMods(currentLocation?.terrainEffects);
    const result = simulateGameCombat(
      player,
      playerStats,
      eliteEnemy,
      undefined,
      room.terrain,
      eliteLocMods,
      // T-108: elite-only rooms store mods on eliteChallenge
      room.activities.eliteChallenge?.modifiers
        ?? room.activities.combat?.modifiers,
    );

    // Update player HP and chakra based on simulation result
    setPlayer(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentHp: Math.max(1, result.playerHpRemaining),
        currentChakra: result.playerChakraRemaining,
      };
    });

    if (result.won) {
      addLog(`Victory! Defeated elite guardian ${eliteEnemy.name} in ${result.turnsElapsed} turns.`, 'gain');
      addLog(`Obtained artifact: ${artifact.name}!`, 'loot');

      // Complete the activity in the floor
      const updatedFloor = completeActivity(floor, room.id, 'eliteChallenge');
      setFloor(updatedFloor);

      // Set pending artifact for loot scene
      setPendingArtifact(artifact);

      // Call victory handler (with elite enemy)
      handleCombatVictory(eliteEnemy, null);
    } else {
      addLog(`Defeated by elite guardian ${eliteEnemy.name} after ${result.turnsElapsed} turns...`, 'danger');
      setGameState(GameState.GAME_OVER);
    }
  }, [player, playerStats, addLog, handleCombatVictory, setGameState, setPlayer, setPendingArtifact]);

  return {
    handleCombatVictory,
    handleAutoCombat,
    handleAutoEliteCombat
  };
}
