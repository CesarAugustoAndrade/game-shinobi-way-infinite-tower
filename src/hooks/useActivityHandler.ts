import { useCallback } from 'react';
import {
  GameState, Player, BranchingRoom, BranchingFloor, CharacterStats,
  Location, Item, GameEvent, Skill, Enemy, LogEntry,
  TrainingActivity, ScrollDiscoveryActivity, TreasureActivity, TreasureHunt, TreasureType
} from '../game/types';
import { getCurrentActivity, completeActivity } from '../game/systems/LocationSystem';
import { getMerchantDiscount, applyWealthToRyo } from '../game/systems/ScalingSystem';
import {
  logRoomEnter, logActivityStart, logActivityComplete,
  logModalOpen, logStateChange, logExplorationCheckpoint,
  logIntelGain
} from '../game/utils/explorationDebug';
import { FeatureFlags } from '../config/featureFlags';
import {
  applyVisibilityToIntelGain,
  getLocationTerrainMods,
} from '../game/systems/LocationTerrainSystem';

/**
 * Activity scene data setters - passed from App.tsx
 */
export interface ActivitySceneSetters {
  setMerchantItems: React.Dispatch<React.SetStateAction<Item[]>>;
  setMerchantDiscount: React.Dispatch<React.SetStateAction<number>>;
  setTrainingData: React.Dispatch<React.SetStateAction<TrainingActivity | null>>;
  setScrollDiscoveryData: React.Dispatch<React.SetStateAction<ScrollDiscoveryActivity | null>>;
  setEliteChallengeData: React.Dispatch<React.SetStateAction<{
    enemy: Enemy;
    artifact: Item;
    room: BranchingRoom;
  } | null>>;
  setDroppedItems: React.Dispatch<React.SetStateAction<Item[]>>;
  setDroppedSkill: React.Dispatch<React.SetStateAction<Skill | null>>;
  setActiveEvent: React.Dispatch<React.SetStateAction<GameEvent | null>>;
  /** T-011: cleared when a fresh (non-chained) event opens from a room. */
  setCameFromChain: React.Dispatch<React.SetStateAction<boolean>>;
  // Treasure system
  setCurrentTreasure: React.Dispatch<React.SetStateAction<TreasureActivity | null>>;
  setCurrentTreasureHunt: React.Dispatch<React.SetStateAction<TreasureHunt | null>>;
  /** T-049/T-086: intel gathering result panel */
  setIntelResult?: React.Dispatch<
    React.SetStateAction<{
      flavorText: string;
      intelGain: number;
      intelBefore: number;
      intelAfter: number;
      baseIntelGain?: number;
      fogNote?: string | null;
    } | null>
  >;
  /** T-050: rest heal result panel */
  setRestResult?: React.Dispatch<
    React.SetStateAction<{
      hpHeal: number;
      chakraHeal: number;
      healPercent: number;
      chakraRestorePercent: number;
      hpBefore: number;
      hpAfter: number;
      chakraBefore: number;
      chakraAfter: number;
      maxHp: number;
      maxChakra: number;
    } | null>
  >;
}

/**
 * Dependencies for activity handler
 */
export interface ActivityHandlerDeps {
  player: Player | null;
  playerStats: CharacterStats | null;
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  setGameState: (state: GameState) => void;
  addLog: (text: string, type?: LogEntry['type']) => void;
  currentLocation: Location | null;
  activitySetters: ActivitySceneSetters;
  // State setters from exploration state
  setSelectedBranchingRoom: React.Dispatch<React.SetStateAction<BranchingRoom | null>>;
  setShowApproachSelector: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentIntel: React.Dispatch<React.SetStateAction<number>>;
  currentIntel: number;
  // Auto-combat callback for when ENABLE_MANUAL_COMBAT is false
  onAutoCombat?: (room: BranchingRoom, floor: BranchingFloor, setFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>) => void;
  // Auto-elite-combat callback for elite challenges when ENABLE_MANUAL_COMBAT is false
  onAutoEliteCombat?: (room: BranchingRoom, enemy: Enemy, artifact: Item, floor: BranchingFloor, setFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>) => void;
}

/**
 * Return type for activity handler hook
 */
export interface UseActivityHandlerReturn {
  executeRoomActivity: (
    currentRoom: BranchingRoom,
    updatedFloor: BranchingFloor,
    setFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>,
    exploreState: GameState
  ) => void;
}

/**
 * Hook that handles room activity execution.
 * Extracted from useExploration to separate activity logic from navigation.
 */
export function useActivityHandler(deps: ActivityHandlerDeps): UseActivityHandlerReturn {
  const {
    player,
    playerStats,
    setPlayer,
    addLog,
    currentLocation,
    setGameState,
    activitySetters,
    setSelectedBranchingRoom,
    setShowApproachSelector,
    setCurrentIntel,
    currentIntel,
    onAutoCombat,
    onAutoEliteCombat,
  } = deps;

  const {
    setMerchantItems,
    setMerchantDiscount,
    setTrainingData,
    setScrollDiscoveryData,
    setEliteChallengeData,
    setDroppedItems,
    setDroppedSkill,
    setActiveEvent,
    setCameFromChain,
    setCurrentTreasure,
    setCurrentTreasureHunt,
    setIntelResult,
    setRestResult,
  } = activitySetters;

  /**
   * Handles room activity execution - shared between branching and location modes
   */
  const executeRoomActivity = useCallback((
    currentRoom: BranchingRoom,
    updatedFloor: BranchingFloor,
    setFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>,
    exploreState: GameState
  ) => {
    const activity = getCurrentActivity(currentRoom);
    logRoomEnter(currentRoom.id, currentRoom.name, activity);

    if (!activity) {
      logExplorationCheckpoint('Room already cleared', { roomId: currentRoom.id });
      addLog(`You enter ${currentRoom.name}. Nothing remains here.`, 'info');
      return;
    }

    switch (activity) {
      case 'combat':
        if (currentRoom.activities.combat) {
          logActivityStart(currentRoom.id, 'combat', { enemy: currentRoom.activities.combat.enemy.name });

          // Check if manual combat is enabled
          if (FeatureFlags.ENABLE_MANUAL_COMBAT) {
            logModalOpen('ApproachSelector', { roomId: currentRoom.id, enemy: currentRoom.activities.combat.enemy.name });
            setSelectedBranchingRoom(currentRoom);
            setShowApproachSelector(true);
            addLog(`Enemy spotted: ${currentRoom.activities.combat.enemy.name}. Choose your approach!`, 'info');
          } else {
            // Auto-combat mode
            if (onAutoCombat) {
              addLog(`Engaging ${currentRoom.activities.combat.enemy.name} in combat...`, 'info');
              onAutoCombat(currentRoom, updatedFloor, setFloor);
            } else {
              // Fallback to manual combat if callback not provided
              setSelectedBranchingRoom(currentRoom);
              setShowApproachSelector(true);
              addLog(`Enemy spotted: ${currentRoom.activities.combat.enemy.name}. Choose your approach!`, 'info');
            }
          }
        }
        break;

      case 'merchant':
        if (currentRoom.activities.merchant) {
          logActivityStart(currentRoom.id, 'merchant', { itemCount: currentRoom.activities.merchant.items.length });
          logStateChange(exploreState.toString(), 'MERCHANT', 'merchant activity');
          setMerchantItems(currentRoom.activities.merchant.items);
          const roomDiscount = currentRoom.activities.merchant.discountPercent || 0;
          const wealthDiscount = getMerchantDiscount(currentLocation?.wealthLevel ?? 4);
          const totalDiscount = Math.min(0.5, roomDiscount / 100 + wealthDiscount);
          setMerchantDiscount(totalDiscount * 100);
          setSelectedBranchingRoom(currentRoom);
          setGameState(GameState.MERCHANT);
          addLog(`A merchant greets you. ${currentRoom.activities.merchant.items.length} items available${wealthDiscount > 0 ? ` (${Math.round(wealthDiscount * 100)}% wealth discount!)` : ''}.`, 'info');
        }
        break;

      case 'event':
        if (currentRoom.activities.event) {
          logActivityStart(currentRoom.id, 'event', { eventId: currentRoom.activities.event.definition.id });
          logStateChange(exploreState.toString(), 'EVENT', 'event activity');
          // Fresh event from a room — not reached via a chain.
          setCameFromChain(false);
          setActiveEvent(currentRoom.activities.event.definition);
          setGameState(GameState.EVENT);
        }
        break;

      case 'rest':
        if (currentRoom.activities.rest && playerStats && player) {
          logActivityStart(currentRoom.id, 'rest', { healPercent: currentRoom.activities.rest.healPercent });
          const restData = currentRoom.activities.rest;
          const maxHp = playerStats.derived.maxHp;
          const maxChakra = playerStats.derived.maxChakra;
          const hpHealCap = Math.floor(maxHp * (restData.healPercent / 100));
          const chakraHealCap = Math.floor(maxChakra * (restData.chakraRestorePercent / 100));
          const hpBefore = player.currentHp;
          const chakraBefore = player.currentChakra;
          const hpAfter = Math.min(maxHp, hpBefore + hpHealCap);
          const chakraAfter = Math.min(maxChakra, chakraBefore + chakraHealCap);
          // Actual gained amounts (not theoretical % of max when already near full)
          const hpHeal = hpAfter - hpBefore;
          const chakraHeal = chakraAfter - chakraBefore;

          setPlayer(p => p ? {
            ...p,
            currentHp: hpAfter,
            currentChakra: chakraAfter,
          } : null);

          addLog(`You rest and recover. +${hpHeal} HP, +${chakraHeal} Chakra.`, 'gain');

          const floorAfterRest = completeActivity(updatedFloor, currentRoom.id, 'rest');
          setFloor(floorAfterRest);
          logActivityComplete(currentRoom.id, 'rest');
          // T-050: visual heal payoff
          setRestResult?.({
            hpHeal,
            chakraHeal,
            healPercent: restData.healPercent,
            chakraRestorePercent: restData.chakraRestorePercent,
            hpBefore,
            hpAfter,
            chakraBefore,
            chakraAfter,
            maxHp,
            maxChakra,
          });
        }
        break;

      case 'training':
        if (currentRoom.activities.training && !currentRoom.activities.training.completed) {
          logActivityStart(currentRoom.id, 'training', { options: currentRoom.activities.training.options.map(o => o.stat) });
          logStateChange(exploreState.toString(), 'TRAINING', 'training activity');
          setTrainingData(currentRoom.activities.training);
          setSelectedBranchingRoom(currentRoom);
          setGameState(GameState.TRAINING);
          addLog('You arrive at a training area. Choose your training regimen.', 'info');
        }
        break;

      case 'scrollDiscovery':
        if (currentRoom.activities.scrollDiscovery && !currentRoom.activities.scrollDiscovery.completed) {
          logActivityStart(currentRoom.id, 'scrollDiscovery', { scrollCount: currentRoom.activities.scrollDiscovery.availableScrolls.length });
          logStateChange(exploreState.toString(), 'SCROLL_DISCOVERY', 'scroll discovery activity');
          setScrollDiscoveryData(currentRoom.activities.scrollDiscovery);
          setSelectedBranchingRoom(currentRoom);
          setGameState(GameState.SCROLL_DISCOVERY);
          addLog('You discovered ancient jutsu scrolls!', 'gain');
        }
        break;

      case 'eliteChallenge':
        if (currentRoom.activities.eliteChallenge && !currentRoom.activities.eliteChallenge.completed) {
          const challenge = currentRoom.activities.eliteChallenge;
          logActivityStart(currentRoom.id, 'eliteChallenge', { enemy: challenge.enemy.name, artifact: challenge.artifact.name });

          // Check if manual combat is enabled
          if (FeatureFlags.ENABLE_MANUAL_COMBAT) {
            logStateChange(exploreState.toString(), 'ELITE_CHALLENGE', 'elite challenge activity');
            setEliteChallengeData({
              enemy: challenge.enemy,
              artifact: challenge.artifact,
              room: currentRoom,
            });
            setGameState(GameState.ELITE_CHALLENGE);
            addLog(`An artifact guardian bars your path...`, 'danger');
          } else {
            // Auto-combat mode for elite challenge
            if (onAutoEliteCombat) {
              addLog(`Engaging artifact guardian: ${challenge.enemy.name}...`, 'danger');
              onAutoEliteCombat(currentRoom, challenge.enemy, challenge.artifact, updatedFloor, setFloor);
            } else {
              // Fallback to manual if callback not provided
              setEliteChallengeData({
                enemy: challenge.enemy,
                artifact: challenge.artifact,
                room: currentRoom,
              });
              setGameState(GameState.ELITE_CHALLENGE);
              addLog(`An artifact guardian bars your path...`, 'danger');
            }
          }
        }
        break;

      case 'treasure':
        if (currentRoom.activities.treasure) {
          const treasure = currentRoom.activities.treasure;
          logActivityStart(currentRoom.id, 'treasure', { choiceCount: treasure.choices.length, type: treasure.type });
          logStateChange(exploreState.toString(), 'TREASURE', 'treasure activity');

          // Set treasure data for the TreasureChoice scene
          setCurrentTreasure(treasure);
          setCurrentTreasureHunt(updatedFloor.treasureHunt);
          setSelectedBranchingRoom(currentRoom);

          addLog(`You discovered a ${treasure.type === TreasureType.LOCKED_CHEST ? 'mysterious chest' : 'treasure map fragment'}!`, 'loot');

          // Don't complete activity yet - completed when player makes selection
          setGameState(GameState.TREASURE);
        }
        break;

      case 'infoGathering':
        if (currentRoom.activities.infoGathering) {
          const infoActivity = currentRoom.activities.infoGathering;
          const intelBefore = currentIntel;
          // T-067: location visibility_penalty scales intel gain
          const locMods = getLocationTerrainMods(currentLocation?.terrainEffects);
          const baseGain = infoActivity.intelGain;
          const effectiveGain = applyVisibilityToIntelGain(baseGain, locMods);
          const intelAfter = Math.min(100, intelBefore + effectiveGain);
          logActivityStart(currentRoom.id, 'infoGathering', { intelGain: effectiveGain });
          setCurrentIntel(intelAfter);
          logIntelGain('InfoGathering', effectiveGain, intelAfter);
          addLog(`${infoActivity.flavorText} +${effectiveGain}% intel.`, 'info');
          const floorAfterInfo = completeActivity(updatedFloor, currentRoom.id, 'infoGathering');
          setFloor(floorAfterInfo);
          logActivityComplete(currentRoom.id, 'infoGathering');
          // T-049/T-086: visual payoff; show fog honesty when gain was reduced
          const fogReduced = effectiveGain !== baseGain;
          const fogPct = Math.round((locMods.visibilityPenalty || 0) * 100);
          setIntelResult?.({
            flavorText: infoActivity.flavorText,
            intelGain: effectiveGain,
            intelBefore,
            intelAfter,
            baseIntelGain: fogReduced ? baseGain : undefined,
            fogNote: fogReduced
              ? `Fog reduced intel (visibility ${fogPct > 0 ? '+' : ''}${fogPct}%)`
              : null,
          });
        }
        break;
    }
  }, [
    playerStats, setPlayer, addLog, currentLocation, setGameState,
    setSelectedBranchingRoom, setShowApproachSelector,
    setMerchantItems, setMerchantDiscount, setActiveEvent, setCameFromChain,
    setTrainingData, setScrollDiscoveryData, setEliteChallengeData,
    setDroppedItems, setDroppedSkill, setCurrentIntel, currentIntel,
    player, setCurrentTreasure, setCurrentTreasureHunt, setIntelResult, setRestResult, onAutoCombat, onAutoEliteCombat
  ]);

  return { executeRoomActivity };
}
