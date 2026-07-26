import { useCallback, useEffect, useRef } from 'react';
import {
  GameState, Player, BranchingRoom, BranchingFloor, CharacterStats,
  Location, Item, Enemy, LogEntry,
} from '../game/types';
import {
  getCurrentActivity,
  getCurrentRoom,
  isFloorComplete,
  clearRoomIfSpent,
} from '../game/systems/LocationSystem';
import { logRoomExit, logStateChange, logSyncWarning } from '../game/utils/explorationDebug';
import { CombatExplorationState } from './useCombatExplorationState';
import { useActivityHandler, ActivitySceneSetters } from './useActivityHandler';
import { useLocationCards, CompleteLocationOptions } from './useLocationCards';
import { useRoomNavigation } from './useRoomNavigation';

// Re-export types for App.tsx compatibility
export type { ActivitySceneSetters } from './useActivityHandler';

/**
 * Resolve a safe post-activity map state. Never returns EXPLORE (no UI).
 * Prefer LOCATION_EXPLORE when still inside a location; otherwise REGION_MAP.
 */
export function resolveExploreReturnState(
  region: { currentLocationId: string | null } | null,
  hasLocationFloor: boolean
): GameState {
  if (region?.currentLocationId && hasLocationFloor) {
    return GameState.LOCATION_EXPLORE;
  }
  return GameState.REGION_MAP;
}

/**
 * Dependencies for the useExploration hook
 */
export interface UseExplorationDeps {
  player: Player | null;
  playerStats: CharacterStats | null;
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  setGameState: (state: GameState) => void;
  gameState: GameState;
  addLog: (text: string, type?: LogEntry['type']) => void;
  currentLocation: Location | null;
  activitySetters: ActivitySceneSetters;
  setEnemy: (enemy: Enemy | null) => void;
  // Auto-combat callbacks for when ENABLE_MANUAL_COMBAT is false
  onAutoCombat?: (room: BranchingRoom, floor: BranchingFloor, setFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>) => void;
  onAutoEliteCombat?: (room: BranchingRoom, enemy: Enemy, artifact: Item, floor: BranchingFloor, setFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>) => void;
  /** T-023: region boss cleared → campaign interlude / victory */
  onRegionBossDefeated?: (region: import('../game/types').Region) => void;
}

/**
 * Return type for useExploration hook
 */
export interface UseExplorationReturn {
  // Card selection handlers
  handleCardSelect: (index: number) => void;
  handleEnterSelectedLocation: () => void;
  // Room handlers
  handleLocationRoomSelect: (room: BranchingRoom) => void;
  handleLocationRoomEnter: (room: BranchingRoom) => void;
  handleBranchingRoomSelect: (room: BranchingRoom) => void;
  handleBranchingRoomEnter: (room: BranchingRoom) => void;
  // Navigation handlers
  handlePathChoice: (path: import('../game/types').LocationPath) => void;
  handleLeaveLocation: () => void;
  returnToMap: () => void;
  returnToMapActivityComplete: (updatedFloor?: BranchingFloor, options?: CompleteLocationOptions) => void;
  /** T-060: location complete panel */
  locationCompleteResult: import('../components/modals/LocationCompleteModal').LocationCompleteResult | null;
  confirmLocationComplete: () => void;
  /** Cancel multi-activity chain + drop complete panel (new run / death retry). */
  resetExplorationUi: () => void;
}

/**
 * Hook that manages exploration navigation and activity handling.
 * Composes smaller specialized hooks for cleaner separation of concerns.
 *
 * Architecture:
 * - useActivityHandler: Room activity execution (combat, merchant, etc.)
 * - useLocationCards: Card selection and location navigation
 * - useRoomNavigation: Room-level select/enter handlers
 * - useExploration: Composition layer + returnToMap
 */
export function useExploration(
  explorationState: CombatExplorationState,
  deps: UseExplorationDeps
): UseExplorationReturn {
  const {
    // Legacy branching exploration
    branchingFloor,
    setBranchingFloor,
    selectedBranchingRoom,
    setSelectedBranchingRoom,
    setShowApproachSelector,
    // Region exploration
    region,
    setRegion,
    setSelectedLocation,
    locationFloor,
    setLocationFloor,
    // Card-based location selection
    locationDeck,
    setLocationDeck,
    intelPool,
    drawnCards,
    setDrawnCards,
    selectedCardIndex,
    setSelectedCardIndex,
    // Location intel
    currentIntel,
    setCurrentIntel,
  } = explorationState;

  const {
    player,
    playerStats,
    setPlayer,
    setGameState,
    gameState,
    addLog,
    currentLocation,
    activitySetters,
    setEnemy,
    onAutoCombat,
    onAutoEliteCombat,
    onRegionBossDefeated,
  } = deps;

  const { setDroppedItems, setDroppedSkill } = activitySetters;

  /**
   * Prevents double-scheduled multi-activity chain (returnToMap ×2 → two setTimeouts
   * open merchant+event etc. on a stale floor). Cleared when the chain fires.
   * Shared with returnToMapActivityComplete; manual Enter Room cancels pending chain.
   */
  const activityChainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelActivityChain = useCallback(() => {
    if (activityChainTimerRef.current != null) {
      clearTimeout(activityChainTimerRef.current);
      activityChainTimerRef.current = null;
    }
  }, []);

  // Drop pending chain if exploration unmounts mid-timer (region leave / hard reset).
  useEffect(() => {
    return () => {
      if (activityChainTimerRef.current != null) {
        clearTimeout(activityChainTimerRef.current);
        activityChainTimerRef.current = null;
      }
    };
  }, []);

  // ============================================================================
  // COMPOSE SPECIALIZED HOOKS
  // ============================================================================

  // Activity handler - executes room activities
  const { executeRoomActivity } = useActivityHandler({
    player,
    playerStats,
    setPlayer,
    setGameState,
    addLog,
    currentLocation,
    activitySetters,
    setSelectedBranchingRoom,
    setShowApproachSelector,
    setCurrentIntel,
    currentIntel,
    onAutoCombat,
    onAutoEliteCombat,
  });

  // Location cards - card selection and location navigation
  // (enter/leave should cancel any pending multi-activity chain from prior site)
  const {
    handleCardSelect,
    handleEnterSelectedLocation: enterSelectedLocationInner,
    handlePathChoice,
    handleLeaveLocation: leaveLocationInner,
    completeLocationAndReturnToRegion,
    locationCompleteResult,
    confirmLocationComplete,
    clearLocationCompleteUi,
  } = useLocationCards(
    {
      region,
      locationDeck,
      locationFloor,
      intelPool,
      drawnCards,
      selectedCardIndex,
      currentIntel,
      player,
      setRegion,
      setSelectedLocation,
      setLocationFloor,
      setLocationDeck,
      setDrawnCards,
      setSelectedCardIndex,
      setCurrentIntel,
      setPlayer,
      setSelectedBranchingRoom,
    },
    { addLog, setGameState, onRegionBossDefeated }
  );

  const handleEnterSelectedLocation = useCallback(() => {
    cancelActivityChain();
    enterSelectedLocationInner();
  }, [cancelActivityChain, enterSelectedLocationInner]);

  const handleLeaveLocation = useCallback(() => {
    cancelActivityChain();
    leaveLocationInner();
  }, [cancelActivityChain, leaveLocationInner]);

  // Room navigation - room select/enter handlers
  const {
    handleLocationRoomSelect,
    handleLocationRoomEnter,
    handleBranchingRoomSelect,
    handleBranchingRoomEnter,
  } = useRoomNavigation(
    {
      branchingFloor,
      locationFloor,
      region,
      setBranchingFloor,
      setLocationFloor,
      setSelectedBranchingRoom,
    },
    { player, playerStats, executeRoomActivity, cancelActivityChain }
  );

  // ============================================================================
  // RETURN TO MAP (requires cross-hook coordination)
  // ============================================================================

  /**
   * Return to map after completing an activity (combat, loot, etc.)
   * Handles activity chaining and location completion checks.
   * On location complete: single path via completeLocationAndReturnToRegion
   * (mark + deck + intel draw + locationsCleared++).
   */
  const returnToMap = useCallback(() => {
    // A second returnToMap while a chain is already queued would double-fire executeRoomActivity
    if (activityChainTimerRef.current != null) return;

    logRoomExit(selectedBranchingRoom?.id || 'unknown', 'returnToMap');
    setDroppedItems([]);
    setDroppedSkill(null);
    setEnemy(null);

    // If in location mode, check for activity chaining
    if (region && locationFloor && region.currentLocationId) {
      // Recover empty/spent rooms that never got isCleared (branch seal soft-lock)
      let floor = locationFloor;
      const spentRoom = getCurrentRoom(floor);
      if (spentRoom && !spentRoom.isCleared && !getCurrentActivity(spentRoom)) {
        floor = clearRoomIfSpent(floor, spentRoom.id);
        if (floor !== locationFloor) {
          setLocationFloor(floor);
          logSyncWarning('returnToMap: clearRoomIfSpent recovered sealed branch', {
            roomId: spentRoom.id,
          });
        }
      }

      const currentRoom = getCurrentRoom(floor);
      if (currentRoom) {
        const nextActivity = getCurrentActivity(currentRoom);
        if (nextActivity) {
          // Auto-trigger next activity in room without incrementing roomsVisited.
          // Must leave LOOT/MERCHANT/activity gameState immediately — prior path left
          // gameState as LOOT for ~100ms so empty LOOT shell stayed mounted while the
          // chain timer ran (blank leave-only pile / approach under LOOT UI).
          setSelectedBranchingRoom(null);
          setGameState(GameState.LOCATION_EXPLORE);
          logStateChange(gameState.toString(), 'LOCATION_EXPLORE', 'returnToMap - chain activity');
          activityChainTimerRef.current = setTimeout(() => {
            activityChainTimerRef.current = null;
            executeRoomActivity(currentRoom, floor, setLocationFloor, GameState.LOCATION_EXPLORE);
          }, 100);
          return;
        }
      }

      // Location completed → full meta path (cards, deck, locationsCleared)
      if (isFloorComplete(floor)) {
        setSelectedBranchingRoom(null);
        // Leave LOOT/activity shell so LocationCompleteModal is not over an empty LOOT UI
        setGameState(GameState.LOCATION_EXPLORE);
        logStateChange(gameState.toString(), 'LOCATION_EXPLORE', 'returnToMap - location complete (panel)');
        completeLocationAndReturnToRegion({ floor, intel: currentIntel });
        return;
      }

      setSelectedBranchingRoom(null);
      logStateChange(gameState.toString(), 'LOCATION_EXPLORE', 'returnToMap');
      setGameState(GameState.LOCATION_EXPLORE);
      return;
    }

    // Region present but not mid-location, or no region: never soft-lock on EXPLORE
    setSelectedBranchingRoom(null);
    const next = resolveExploreReturnState(region, !!locationFloor);
    if (!region) {
      logSyncWarning('returnToMap: No region, falling back to REGION_MAP', {});
    }
    logStateChange(gameState.toString(), next.toString(), 'returnToMap - fallback');
    setGameState(next);
  }, [
    selectedBranchingRoom, gameState, region, locationFloor, currentIntel,
    setDroppedItems, setDroppedSkill, setEnemy, setSelectedBranchingRoom, setGameState,
    executeRoomActivity, setLocationFloor, completeLocationAndReturnToRegion
  ]);

  /**
   * Return to map after an activity that was already completed via completeActivity().
   * Prefer updatedFloor so completion / multi-activity chain is not stale.
   * Still chains remaining activities on the current room (parity returnToMap) —
   * merchant/training/event/treasure leave used to dump the player on the map while
   * treasure/infoGather still waited in the same room (must re-Enter; children stayed sealed).
   *
   * @param updatedFloor - Optional updated floor for completion check (stale-safe).
   * @param options - Optional intel override for the completion redraw path.
   */
  const returnToMapActivityComplete = useCallback((
    updatedFloor?: BranchingFloor,
    options?: CompleteLocationOptions
  ) => {
    // Shared mutex with returnToMap — do not double-queue multi-activity chain
    if (activityChainTimerRef.current != null) return;

    logRoomExit(selectedBranchingRoom?.id || 'unknown', 'returnToMapActivityComplete');
    setDroppedItems([]);
    setDroppedSkill(null);
    setEnemy(null);
    setSelectedBranchingRoom(null);

    // Use updatedFloor if provided (for sync check after completeActivity),
    // otherwise fall back to locationFloor from state
    let floorToCheck = updatedFloor ?? locationFloor;

    // Recover empty/spent rooms that never got isCleared (branch seal soft-lock)
    if (floorToCheck) {
      const spentRoom = getCurrentRoom(floorToCheck);
      if (spentRoom && !spentRoom.isCleared && !getCurrentActivity(spentRoom)) {
        const recovered = clearRoomIfSpent(floorToCheck, spentRoom.id);
        if (recovered !== floorToCheck) {
          floorToCheck = recovered;
          setLocationFloor(recovered);
          logSyncWarning('returnToMapActivityComplete: clearRoomIfSpent recovered sealed branch', {
            roomId: spentRoom.id,
          });
        }
      }
    }

    if (region && floorToCheck && region.currentLocationId) {
      // Multi-activity rooms (1–3 acts): after merchant/event/training/treasure complete,
      // open the next pending activity on this room (same path as combat loot → returnToMap).
      const currentRoom = getCurrentRoom(floorToCheck);
      if (currentRoom) {
        const nextActivity = getCurrentActivity(currentRoom);
        if (nextActivity) {
          // Leave MERCHANT/TRAINING/EVENT shell before chain (blank activity under modal)
          setGameState(GameState.LOCATION_EXPLORE);
          logStateChange(
            gameState.toString(),
            'LOCATION_EXPLORE',
            'returnToMapActivityComplete - chain activity',
          );
          const floorForChain = floorToCheck;
          activityChainTimerRef.current = setTimeout(() => {
            activityChainTimerRef.current = null;
            executeRoomActivity(
              currentRoom,
              floorForChain,
              setLocationFloor,
              GameState.LOCATION_EXPLORE,
            );
          }, 100);
          return;
        }
      }

      if (isFloorComplete(floorToCheck)) {
        // Leave MERCHANT/TRAINING/EVENT/TREASURE shell before complete panel
        // (same bug class as returnToMap LOOT leave — activity UI stayed mounted).
        setGameState(GameState.LOCATION_EXPLORE);
        logStateChange(
          gameState.toString(),
          'LOCATION_EXPLORE',
          'returnToMapActivityComplete - floor complete (panel)',
        );
        completeLocationAndReturnToRegion({
          floor: floorToCheck,
          intel: options?.intel ?? currentIntel,
        });
        return;
      }
      logStateChange(gameState.toString(), 'LOCATION_EXPLORE', 'returnToMapActivityComplete');
      setGameState(GameState.LOCATION_EXPLORE);
      return;
    }

    if (region) {
      // Region exists but missing currentLocationId or floor data (stale closure fallback)
      logSyncWarning('returnToMapActivityComplete: Missing currentLocationId or floor, falling back to REGION_MAP', {
        hasRegion: !!region,
        hasCurrentLocationId: !!region?.currentLocationId,
        hasFloorToCheck: !!floorToCheck,
        hasUpdatedFloor: !!updatedFloor,
        hasLocationFloor: !!locationFloor,
      });
      logStateChange(gameState.toString(), 'REGION_MAP', 'returnToMapActivityComplete - fallback');
      setGameState(GameState.REGION_MAP);
      return;
    }

    // No region: never leave player in EXPLORE without UI
    logStateChange(gameState.toString(), 'REGION_MAP', 'returnToMapActivityComplete - no region');
    setGameState(GameState.REGION_MAP);
  }, [
    selectedBranchingRoom, gameState, region, locationFloor, currentIntel,
    setDroppedItems, setDroppedSkill, setEnemy, setSelectedBranchingRoom, setGameState,
    executeRoomActivity, setLocationFloor, completeLocationAndReturnToRegion,
  ]);

  const resetExplorationUi = useCallback(() => {
    cancelActivityChain();
    clearLocationCompleteUi();
  }, [cancelActivityChain, clearLocationCompleteUi]);

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  return {
    // Card selection
    handleCardSelect,
    handleEnterSelectedLocation,
    // Room navigation
    handleLocationRoomSelect,
    handleLocationRoomEnter,
    handleBranchingRoomSelect,
    handleBranchingRoomEnter,
    // Location navigation
    handlePathChoice,
    handleLeaveLocation,
    returnToMap,
    returnToMapActivityComplete,
    locationCompleteResult,
    confirmLocationComplete,
    resetExplorationUi,
  };
}
