import { useCallback } from 'react';
import {
  Player, Enemy, Item, Skill, GameState, BranchingRoom, BranchingFloor,
  Region, LogEntry
} from '../game/types';
import { CombatState } from '../game/systems/CombatWorkflowSystem';
import {
  getCurrentRoom, completeActivity, addMapPiece, getTreasureHuntReward
} from '../game/systems/LocationSystem';
import {
  calculateLocationXP, calculateLocationRyo, markLocationComplete, INTEL_GAIN
} from '../game/systems/RegionSystem';
import {
  applyWealthToRyo
} from '../game/systems/ScalingSystem';
import { simulateGameCombat } from '../game/systems/CombatSimulationService';
import { logVictory, logRewardModal, logFlowCheckpoint } from '../game/utils/combatDebug';
import { logActivityComplete, logIntelGain } from '../game/utils/explorationDebug';

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
}

export interface VictorySetters {
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  setBranchingFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;
  setLocationFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;
  setRegion: React.Dispatch<React.SetStateAction<Region | null>>;
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
    pendingArtifact, currentTreasure, currentTreasureHunt, currentIntel
  } = state;

  const {
    setPlayer, setBranchingFloor, setLocationFloor, setRegion, setCurrentIntel,
    setDiceRollResult, setTreasureHuntReward, setCurrentTreasureHunt, setCurrentTreasure,
    setCombatReward, setGameState, setEnemy, setPendingArtifact, setDroppedItems, setDroppedSkill
  } = setters;

  const { addLog, checkLevelUp, returnToMap } = deps;

  const handleCombatVictory = useCallback((defeatedEnemy: Enemy, combatStateAtVictory: CombatState | null) => {
    logFlowCheckpoint('handleCombatVictory START', {
      enemy: defeatedEnemy.name,
      tier: defeatedEnemy.tier,
      dangerLevel: currentDangerLevel
    });

    addLog("Enemy Defeated!", 'gain');

    // Check if this was a Treasure Guardian fight
    const wasTreasureGuardian = defeatedEnemy.name === 'Treasure Guardian' && currentTreasureHunt;

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
          addLog('Location cleared! Intel mission awaits...', 'gain');
          // Mark location as complete in region
          setRegion(markLocationComplete(region));
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

    // Apply wealth multiplier to ryo based on current location's wealth level
    const baseRyo = calculateLocationRyo(currentDangerLevel, currentBaseDifficulty);
    const locationWealthLevel = currentLocation?.wealthLevel ?? 4;
    const ryoGain = applyWealthToRyo(baseRyo, locationWealthLevel);

    // Add intel from combat victory (+5%)
    if (region) {
      const intelGain = INTEL_GAIN.COMBAT_VICTORY;
      setCurrentIntel(prev => Math.min(100, prev + intelGain));
      logIntelGain('Combat', intelGain, Math.min(100, currentIntel + intelGain));
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
      addLog(`Gained ${ryoGain} Ryō${locationWealthLevel !== 4 ? ` (${locationWealthLevel > 4 ? 'wealthy' : 'poor'} area)` : ''}.`, 'loot');

      return updatedPlayer;
    });

    // Log victory rewards
    logVictory(defeatedEnemy.name, {
      xpGain: expGain,
      ryoGain: ryoGain,
      levelUp: !!levelUpInfo
    });

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
        const reward = getTreasureHuntReward(newHunt.collectedPieces, wealthLevel, currentDangerLevel, difficulty);
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

      // Show combat reward modal first, then dice result modal will show after
      setCombatReward({
        expGain,
        ryoGain,
        levelUp: levelUpInfo
      });

      setTimeout(() => {
        if (region && region.currentLocationId) {
          setGameState(GameState.LOCATION_EXPLORE);
        } else {
          setGameState(GameState.EXPLORE);
        }
      }, 100);
      return;
    }

    // Show reward modal instead of returning to map immediately
    logRewardModal('show', { xpGain: expGain, ryoGain: ryoGain, levelUp: !!levelUpInfo });
    setCombatReward({
      expGain,
      ryoGain,
      levelUp: levelUpInfo
    });

    // Set game state to appropriate explore view so the modal shows on the map
    logFlowCheckpoint('Transitioning to explore with reward modal');
    setTimeout(() => {
      // Return to correct explore state based on mode
      if (region && region.currentLocationId) {
        setGameState(GameState.LOCATION_EXPLORE);
      } else {
        setGameState(GameState.EXPLORE);
      }
    }, 100);
  }, [
    branchingFloor, region, currentDangerLevel, currentBaseDifficulty, addLog, pendingArtifact,
    currentTreasureHunt, locationFloor, selectedBranchingRoom, currentLocation, difficulty,
    setDiceRollResult, setTreasureHuntReward, setCurrentTreasureHunt, setCurrentTreasure,
    setBranchingFloor, setLocationFloor, setRegion, setCurrentIntel, setPlayer, setCombatReward,
    setGameState, checkLevelUp, currentIntel
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
    const result = simulateGameCombat(player, playerStats, combatEnemy, undefined, room.terrain);

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
    const result = simulateGameCombat(player, playerStats, eliteEnemy, undefined, room.terrain);

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
