import { useCallback, useState } from 'react';
import {
  GameState, Region, Location, LocationPath, LogEntry, Player,
  IntelPool, LocationDeck, LocationCard, IntelRevealLevel, BranchingFloor
} from '../game/types';
import {
  getCurrentLocation,
  choosePath,
  enterLocationFromCard,
  locationToBranchingFloor,
  drawLocationCards,
  evaluateIntel,
  markLocationComplete,
  updateDeckAfterCompletion,
  exitLocation,
  isRegionBossDefeated,
  discoverSecretsFromEventFlags,
  discoverSecretsFromCompletedLocation,
} from '../game/systems/RegionSystem';
import { isFloorComplete } from '../game/systems/LocationSystem';
import {
  logLocationSelect, logLocationEnter, logLocationLeave,
  logPathChoice, logIntelReset
} from '../game/utils/explorationDebug';
import type { LocationCompleteResult } from '../components/modals/LocationCompleteModal';
import { formatLocationTerrainEffectLines } from '../game/systems/LocationTerrainSystem';

/**
 * Optional overrides when completing a location — prefer passing fresh values
 * to avoid React stale closures (e.g. right after completeActivity / intel gain).
 */
export interface CompleteLocationOptions {
  floor?: BranchingFloor | null;
  intel?: number;
}

/**
 * State needed for location card operations
 */
export interface LocationCardState {
  region: Region | null;
  locationDeck: LocationDeck | null;
  locationFloor: BranchingFloor | null;
  intelPool: IntelPool;
  drawnCards: LocationCard[];
  selectedCardIndex: number | null;
  currentIntel: number;
  /** T-030: needed to sync secret unlocks from eventFlags before card draw */
  player: Player | null;
  // Setters
  setRegion: React.Dispatch<React.SetStateAction<Region | null>>;
  setSelectedLocation: React.Dispatch<React.SetStateAction<Location | null>>;
  setLocationFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;
  setLocationDeck: React.Dispatch<React.SetStateAction<LocationDeck | null>>;
  setDrawnCards: React.Dispatch<React.SetStateAction<LocationCard[]>>;
  setSelectedCardIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setCurrentIntel: React.Dispatch<React.SetStateAction<number>>;
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  setSelectedBranchingRoom: React.Dispatch<React.SetStateAction<import('../game/types').BranchingRoom | null>>;
}

/**
 * Dependencies for location card operations
 */
export interface LocationCardDeps {
  addLog: (text: string, type?: LogEntry['type']) => void;
  setGameState: (state: GameState) => void;
  /** T-023: called when region boss location is completed (before region map redraw). */
  onRegionBossDefeated?: (region: Region) => void;
}

/**
 * Return type for location cards hook
 */
export interface UseLocationCardsReturn {
  handleCardSelect: (index: number) => void;
  handleEnterSelectedLocation: () => void;
  handlePathChoice: (path: LocationPath) => void;
  handleLeaveLocation: () => void;
  /**
   * Request location complete (T-060): stages result panel; real meta path runs on confirm.
   */
  completeLocationAndReturnToRegion: (options?: CompleteLocationOptions) => void;
  /** T-060: pending complete summary for modal */
  locationCompleteResult: LocationCompleteResult | null;
  /** T-060: Continue on panel → execute completion */
  confirmLocationComplete: () => void;
}

/**
 * Hook that handles card selection and location navigation.
 * Manages the region map card-based location selection system.
 */
export function useLocationCards(
  state: LocationCardState,
  deps: LocationCardDeps
): UseLocationCardsReturn {
  const {
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
  } = state;

  const { addLog, setGameState, onRegionBossDefeated } = deps;

  /**
   * Select a card on the region map
   */
  const handleCardSelect = useCallback((index: number) => {
    if (index >= 0 && index < drawnCards.length) {
      const card = drawnCards[index];
      logLocationSelect(card.locationId, card.location.name);
      setSelectedCardIndex(index);
      setSelectedLocation(card.location);
    }
  }, [drawnCards, setSelectedCardIndex, setSelectedLocation]);

  /**
   * Enter the selected location from a card
   */
  const handleEnterSelectedLocation = useCallback(() => {
    if (!region || !locationDeck || selectedCardIndex === null) return;

    const selectedCard = drawnCards[selectedCardIndex];
    if (!selectedCard) return;

    // Reset intel for new location
    setCurrentIntel(0);
    logIntelReset(selectedCard.location.name);

    const locationToEnter = selectedCard.location;

    logLocationEnter(locationToEnter.id, locationToEnter.name, locationToEnter.dangerLevel);
    const updatedRegion = enterLocationFromCard(region, locationToEnter.id);
    setRegion(updatedRegion);
    setSelectedLocation(locationToEnter);

    const locationFloorData = locationToBranchingFloor(updatedRegion, player ?? undefined);
    setLocationFloor(locationFloorData);

    addLog(`Entering ${locationToEnter.name}${selectedCard.isRevisit ? ' (Revisit)' : ''}...`, 'info');
    // T-046: ambient atmosphereEvents flavor (authored location color, not GameEvent)
    if (locationFloorData?.atmosphereFlavor) {
      addLog(locationFloorData.atmosphereFlavor, 'info');
    }
    setGameState(GameState.LOCATION_EXPLORE);
  }, [
    region, locationDeck, selectedCardIndex, drawnCards, player,
    setCurrentIntel, setRegion, setSelectedLocation, setLocationFloor,
    addLog, setGameState
  ]);

  /**
   * Choose a path to travel to next location
   */
  const handlePathChoice = useCallback((path: LocationPath) => {
    if (!region || !locationDeck) return;
    const targetLoc = region.locations.find(l => l.id === path.targetLocationId);
    logPathChoice(path.id, targetLoc?.name || 'Unknown', path.pathType);
    let updatedRegion = choosePath(region, path.id);
    // T-030: apply any secret unlocks from narrative flags before redraw
    if (player?.eventFlags) {
      const synced = discoverSecretsFromEventFlags(updatedRegion, player.eventFlags);
      updatedRegion = synced.region;
      for (const name of synced.newlyDiscovered) {
        addLog(`Secret location revealed: ${name}!`, 'gain');
      }
    }
    setRegion(updatedRegion);

    const { cardCount, revealedCount } = evaluateIntel(currentIntel);

    const rawCards = drawLocationCards(updatedRegion, locationDeck, intelPool, cardCount, revealedCount);
    const newCards = rawCards.map((card, index) => ({
      ...card,
      intelLevel: index < revealedCount ? IntelRevealLevel.FULL : IntelRevealLevel.NONE,
    }));
    setDrawnCards(newCards);
    setSelectedCardIndex(null);

    addLog(`Traveling to the next location...`, 'info');
    setGameState(GameState.REGION_MAP);
  }, [
    region, locationDeck, intelPool, currentIntel, player,
    setRegion, setDrawnCards, setSelectedCardIndex, addLog, setGameState
  ]);

  // T-060: stage complete panel, then execute on confirm
  const [locationCompleteResult, setLocationCompleteResult] =
    useState<LocationCompleteResult | null>(null);
  const [pendingCompleteOptions, setPendingCompleteOptions] =
    useState<CompleteLocationOptions | undefined>(undefined);

  /**
   * Single completion path for location → region meta.
   * markLocationComplete + updateDeckAfterCompletion + evaluateIntel +
   * drawLocationCards + player.locationsCleared++ + REGION_MAP.
   *
   * Safe to call when floor is known complete. Prefer passing fresh floor/intel
   * when state may be stale (post-activity React batching).
   */
  const executeLocationComplete = useCallback((options?: CompleteLocationOptions) => {
    if (!region || !locationDeck) {
      setSelectedBranchingRoom(null);
      setLocationFloor(null);
      setGameState(GameState.REGION_MAP);
      return;
    }

    const location = getCurrentLocation(region);
    const locationId = location?.id ?? region.currentLocationId;
    if (!locationId) {
      setSelectedBranchingRoom(null);
      setLocationFloor(null);
      setGameState(GameState.REGION_MAP);
      return;
    }

    const wasAlreadyComplete = location?.isCompleted ?? false;

    // 1. Mark location complete (idempotent)
    let updatedRegion = markLocationComplete(region);

    // 1b. T-030: secret paths from this location unlock secret destinations
    if (!wasAlreadyComplete) {
      const pathDiscover = discoverSecretsFromCompletedLocation(updatedRegion, locationId);
      updatedRegion = pathDiscover.region;
      for (const name of pathDiscover.newlyDiscovered) {
        addLog(`You uncovered a secret route to ${name}!`, 'gain');
      }
    }

    // 1c. T-030: narrative flags may unlock secrets
    if (player?.eventFlags) {
      const flagDiscover = discoverSecretsFromEventFlags(updatedRegion, player.eventFlags);
      updatedRegion = flagDiscover.region;
      for (const name of flagDiscover.newlyDiscovered) {
        addLog(`Secret location revealed: ${name}!`, 'gain');
      }
    }

    // 2. Exit location so region map has no currentLocationId
    updatedRegion = exitLocation(updatedRegion);
    setRegion(updatedRegion);

    // 3. Update deck weights / revisit penalty
    const updatedDeck = updateDeckAfterCompletion(locationDeck, locationId);
    setLocationDeck(updatedDeck);

    // 4. Advance global progression (once per completion)
    if (!wasAlreadyComplete) {
      setPlayer(prev =>
        prev ? { ...prev, locationsCleared: prev.locationsCleared + 1 } : null
      );
    }

    // 5. Redraw destination cards from intel
    const intel = options?.intel ?? currentIntel;
    const { cardCount, revealedCount } = evaluateIntel(intel);
    const rawCards = drawLocationCards(
      updatedRegion,
      updatedDeck,
      intelPool,
      cardCount,
      revealedCount
    );
    const newCards = rawCards.map((card, index) => ({
      ...card,
      intelLevel: index < revealedCount ? IntelRevealLevel.FULL : IntelRevealLevel.NONE,
    }));
    setDrawnCards(newCards);
    setSelectedCardIndex(null);

    // 6. Clear in-location exploration state
    setSelectedBranchingRoom(null);
    setLocationFloor(null);
    setSelectedLocation(null);

    logLocationLeave(locationId, location?.name ?? 'Unknown', 'completed');

    // T-023: region boss clear → interlude / victory instead of another REGION_MAP loop
    if (isRegionBossDefeated(updatedRegion)) {
      addLog(`${location?.name ?? 'Boss'} defeated. The region is clear!`, 'gain');
      if (onRegionBossDefeated) {
        onRegionBossDefeated(updatedRegion);
      } else {
        setGameState(GameState.VICTORY);
      }
      return;
    }

    addLog('Location cleared. Choose your next destination.', 'info');
    setGameState(GameState.REGION_MAP);
  }, [
    region, locationDeck, intelPool, currentIntel, player,
    setRegion, setLocationDeck, setPlayer, setDrawnCards, setSelectedCardIndex,
    setSelectedBranchingRoom, setLocationFloor, setSelectedLocation,
    addLog, setGameState, onRegionBossDefeated,
  ]);

  /**
   * T-060: show location-complete panel first; real meta path on Continue.
   */
  const completeLocationAndReturnToRegion = useCallback((options?: CompleteLocationOptions) => {
    if (!region || !locationDeck) {
      executeLocationComplete(options);
      return;
    }

    const location = getCurrentLocation(region);
    const locationId = location?.id ?? region.currentLocationId;
    if (!locationId || !location) {
      executeLocationComplete(options);
      return;
    }

    const wasAlreadyComplete = location.isCompleted ?? false;
    const floor = options?.floor ?? locationFloor;
    const roomsVisited = floor?.roomsVisited ?? 0;

    // Dry-run secret unlocks for panel (same pure functions as execute path)
    const secretUnlocks: string[] = [];
    if (!wasAlreadyComplete) {
      const pathDiscover = discoverSecretsFromCompletedLocation(region, locationId);
      secretUnlocks.push(...pathDiscover.newlyDiscovered);
      if (player?.eventFlags) {
        const flagDiscover = discoverSecretsFromEventFlags(
          pathDiscover.region,
          player.eventFlags,
        );
        for (const name of flagDiscover.newlyDiscovered) {
          if (!secretUnlocks.includes(name)) secretUnlocks.push(name);
        }
      }
    }

    const regionCompleted =
      (region.locationsCompleted ?? 0) + (wasAlreadyComplete ? 0 : 1);
    const locationsClearedAfter =
      (player?.locationsCleared ?? 0) + (wasAlreadyComplete ? 0 : 1);

    setPendingCompleteOptions(options);
    // T-075: capture identity for clear panel (terrain + region loot theme)
    const terrainLines = formatLocationTerrainEffectLines(
      location.terrainEffects ?? locationFloor?.terrainEffects,
    );
    const theme = region.lootTheme;
    const regionIdentity = theme
      ? [
          theme.primaryElement ? `Affinity ${theme.primaryElement}` : null,
          theme.equipmentFocus?.length
            ? `Focus ${theme.equipmentFocus.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' · ')}`
            : null,
        ]
          .filter(Boolean)
          .join(' · ') || null
      : null;

    setLocationCompleteResult({
      locationId,
      locationName: location.name,
      dangerLevel: location.dangerLevel,
      roomsVisited,
      wasAlreadyComplete,
      locationsClearedAfter,
      regionCompleted,
      regionTotal: region.totalLocations,
      secretUnlocks,
      isBoss: Boolean(location.flags?.isBoss),
      terrainLines,
      regionIdentity,
    });
  }, [region, locationDeck, locationFloor, player, executeLocationComplete]);

  const confirmLocationComplete = useCallback(() => {
    // Consume panel first — blocks double Continue (double leave / boss callbacks)
    const box: { opts?: CompleteLocationOptions; had: boolean } = { had: false };
    setLocationCompleteResult(prev => {
      if (!prev) return null;
      box.had = true;
      return null;
    });
    setPendingCompleteOptions(prev => {
      box.opts = prev;
      return undefined;
    });
    if (!box.had) return;
    executeLocationComplete(box.opts);
  }, [executeLocationComplete]);

  /**
   * Leave the current location and return to region map (only if floor complete).
   */
  const handleLeaveLocation = useCallback(() => {
    if (!region || !locationDeck || !locationFloor) return;

    if (isFloorComplete(locationFloor)) {
      completeLocationAndReturnToRegion({ floor: locationFloor, intel: currentIntel });
    } else {
      addLog('Complete the location before leaving.', 'danger');
    }
  }, [
    region, locationDeck, locationFloor, currentIntel,
    completeLocationAndReturnToRegion, addLog,
  ]);

  return {
    handleCardSelect,
    handleEnterSelectedLocation,
    handlePathChoice,
    handleLeaveLocation,
    completeLocationAndReturnToRegion,
    locationCompleteResult,
    confirmLocationComplete,
  };
}
