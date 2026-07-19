import { useCallback } from 'react';
import {
  GameState, Player, BranchingRoom, BranchingFloor, CharacterStats,
  Location, Item, Enemy, LogEntry,
} from '../game/types';
import { getCurrentActivity, getCurrentRoom, isFloorComplete } from '../game/systems/LocationSystem';
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
  const {
    handleCardSelect,
    handleEnterSelectedLocation,
    handlePathChoice,
    handleLeaveLocation,
    completeLocationAndReturnToRegion,
    locationCompleteResult,
    confirmLocationComplete,
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
    { player, playerStats, executeRoomActivity }
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
    logRoomExit(selectedBranchingRoom?.id || 'unknown', 'returnToMap');
    setDroppedItems([]);
    setDroppedSkill(null);
    setEnemy(null);

    // If in location mode, check for activity chaining
    if (region && locationFloor && region.currentLocationId) {
      const currentRoom = getCurrentRoom(locationFloor);
      if (currentRoom) {
        const nextActivity = getCurrentActivity(currentRoom);
        if (nextActivity) {
          // Auto-trigger next activity in room without incrementing roomsVisited
          setSelectedBranchingRoom(null);
          logStateChange(gameState.toString(), 'LOCATION_EXPLORE', 'returnToMap - chain activity');
          setTimeout(() => executeRoomActivity(currentRoom, locationFloor, setLocationFloor, GameState.LOCATION_EXPLORE), 100);
          return;
        }
      }

      // Location completed → full meta path (cards, deck, locationsCleared)
      if (isFloorComplete(locationFloor)) {
        setSelectedBranchingRoom(null);
        logStateChange(gameState.toString(), 'REGION_MAP', 'returnToMap - location complete');
        completeLocationAndReturnToRegion({ floor: locationFloor, intel: currentIntel });
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
   * Return to map after an activity that was already completed.
   * Skips activity checking since caller guarantees the activity is done.
   * Use this instead of returnToMap when you've already called completeActivity().
   *
   * @param updatedFloor - Optional updated floor for completion check (stale-safe).
   * @param options - Optional intel override for the completion redraw path.
   */
  const returnToMapActivityComplete = useCallback((
    updatedFloor?: BranchingFloor,
    options?: CompleteLocationOptions
  ) => {
    logRoomExit(selectedBranchingRoom?.id || 'unknown', 'returnToMapActivityComplete');
    setDroppedItems([]);
    setDroppedSkill(null);
    setEnemy(null);
    setSelectedBranchingRoom(null);

    // Use updatedFloor if provided (for sync check after completeActivity),
    // otherwise fall back to locationFloor from state
    const floorToCheck = updatedFloor ?? locationFloor;

    // Skip activity checking - caller guarantees activity is complete
    if (region && floorToCheck && region.currentLocationId) {
      if (isFloorComplete(floorToCheck)) {
        logStateChange(gameState.toString(), 'REGION_MAP', 'returnToMapActivityComplete - floor complete');
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
    completeLocationAndReturnToRegion,
  ]);

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
  };
}
