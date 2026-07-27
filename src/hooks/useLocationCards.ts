import { useCallback, useRef, useState } from 'react';
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
  /** Drop staged complete panel + locks (new run / game over retry). */
  clearLocationCompleteUi: () => void;
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
   * Double Space/Enter before re-render re-ran enterLocationFromCard + intel reset.
   * Short arm only — region map unmounts on success so permanent lock is fine too.
   */
  const enterLocationLockRef = useRef(false);

  /**
   * Enter the selected location from a card.
   * Falls back to card 0 when selection is still null (first-run / post-redraw race)
   * so Space/Enter and the deploy CTA never silently no-op with a marked path on screen.
   */
  const handleEnterSelectedLocation = useCallback(() => {
    if (!region || !locationDeck || drawnCards.length === 0) return;
    if (enterLocationLockRef.current) return;
    enterLocationLockRef.current = true;

    const index =
      selectedCardIndex !== null && drawnCards[selectedCardIndex]
        ? selectedCardIndex
        : 0;
    const selectedCard = drawnCards[index];
    if (!selectedCard) {
      enterLocationLockRef.current = false;
      return;
    }
    // Keep parent selection in sync when we had to fall back
    if (selectedCardIndex !== index) {
      setSelectedCardIndex(index);
      setSelectedLocation(selectedCard.location);
    }

    // Drop any stale room pointer from a prior site (approach/activity residue)
    setSelectedBranchingRoom(null);

    // Reset intel for new location
    setCurrentIntel(0);
    logIntelReset(selectedCard.location.name);

    const locationToEnter = selectedCard.location;

    logLocationEnter(locationToEnter.id, locationToEnter.name, locationToEnter.dangerLevel);
    const updatedRegion = enterLocationFromCard(region, locationToEnter.id);
    setRegion(updatedRegion);
    setSelectedLocation(locationToEnter);

    const locationFloorData = locationToBranchingFloor(updatedRegion, player ?? undefined);
    // Soft-lock guard: never land on LOCATION_EXPLORE without a floor (blank map UI)
    if (!locationFloorData) {
      addLog(
        `Could not open ${locationToEnter.name} — signal lost. Choose another destination.`,
        'danger',
      );
      setLocationFloor(null);
      setGameState(GameState.REGION_MAP);
      // Failed open — re-arm so player can pick another card
      enterLocationLockRef.current = false;
      return;
    }
    setLocationFloor(locationFloorData);

    addLog(`Entering ${locationToEnter.name}${selectedCard.isRevisit ? ' (Revisit)' : ''}...`, 'info');
    // A4: location-visit scar — clear feedback that this ground is spent
    if (selectedCard.isRevisit) {
      addLog(
        `${locationToEnter.name} bears your earlier visit. Loot will be thinner here.`,
        'info',
      );
    }
    // T-046: ambient atmosphereEvents flavor (authored location color, not GameEvent)
    if (locationFloorData.atmosphereFlavor) {
      addLog(locationFloorData.atmosphereFlavor, 'info');
    }
    setGameState(GameState.LOCATION_EXPLORE);
    // Success path leaves region map; re-arm when cards redraw after a later complete
    window.setTimeout(() => {
      enterLocationLockRef.current = false;
    }, 400);
  }, [
    region, locationDeck, selectedCardIndex, drawnCards, player,
    setCurrentIntel, setRegion, setSelectedLocation, setSelectedCardIndex,
    setLocationFloor, setSelectedBranchingRoom, addLog, setGameState,
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
        addLog(`A veiled route surfaces: ${name}.`, 'gain');
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
  // Same-tick leave + auto-returnToMap must not double-stage the panel
  const completePanelOpenRef = useRef(false);
  // Leave meta execute once (Enter keydown + button click before re-render)
  const completeExecuteLockRef = useRef(false);

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
    // R1-016: path unlock also writes unlockCondition.requirement → eventFlags
    let pathUnlockReqs: string[] = [];
    if (!wasAlreadyComplete) {
      const pathDiscover = discoverSecretsFromCompletedLocation(updatedRegion, locationId);
      updatedRegion = pathDiscover.region;
      pathUnlockReqs = pathDiscover.unlockedRequirements ?? [];
      for (const name of pathDiscover.newlyDiscovered) {
        addLog(`You uncovered a path off the ledgers: ${name}.`, 'gain');
      }
    }

    // 4. Advance progression + merge path-discovered secret flags into eventFlags
    // (before flag-based secret sync so same-tick flags can unlock further secrets)
    if (!wasAlreadyComplete || pathUnlockReqs.length > 0) {
      setPlayer((prev) => {
        if (!prev) return null;
        let next = prev;
        if (!wasAlreadyComplete) {
          next = { ...next, locationsCleared: next.locationsCleared + 1 };
        }
        if (pathUnlockReqs.length > 0) {
          const eventFlags = { ...(next.eventFlags ?? {}) };
          for (const req of pathUnlockReqs) {
            eventFlags[req] = Math.max(1, eventFlags[req] ?? 0);
          }
          next = { ...next, eventFlags };
        }
        return next;
      });
    }

    // 1c. T-030: narrative flags may unlock secrets (includes flags just written)
    const flagsForSync = {
      ...(player?.eventFlags ?? {}),
      ...Object.fromEntries(pathUnlockReqs.map((r) => [r, 1])),
    };
    if (Object.keys(flagsForSync).length > 0) {
      const flagDiscover = discoverSecretsFromEventFlags(updatedRegion, flagsForSync);
      updatedRegion = flagDiscover.region;
      for (const name of flagDiscover.newlyDiscovered) {
        addLog(`A veiled route surfaces: ${name}.`, 'gain');
      }
    }

    // 2. Exit location so region map has no currentLocationId
    updatedRegion = exitLocation(updatedRegion);
    setRegion(updatedRegion);

    // 3. Update deck weights / revisit penalty
    const updatedDeck = updateDeckAfterCompletion(locationDeck, locationId);
    setLocationDeck(updatedDeck);

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
    // Already showing / staging complete panel — don't re-stage (leave + auto-return race)
    if (completePanelOpenRef.current) return;

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

    completePanelOpenRef.current = true;
    // New panel → allow one Continue (see confirmLocationComplete lock)
    completeExecuteLockRef.current = false;

    const wasAlreadyComplete = location.isCompleted ?? false;
    const floor = options?.floor ?? locationFloor;
    const roomsVisited = floor?.roomsVisited ?? 0;

    // Dry-run secret unlocks for panel (same pure functions as execute path)
    const secretUnlocks: string[] = [];
    if (!wasAlreadyComplete) {
      const pathDiscover = discoverSecretsFromCompletedLocation(region, locationId);
      secretUnlocks.push(...pathDiscover.newlyDiscovered);
      const flagsForPreview = {
        ...(player?.eventFlags ?? {}),
        ...Object.fromEntries(
          (pathDiscover.unlockedRequirements ?? []).map((r) => [r, 1]),
        ),
      };
      if (Object.keys(flagsForPreview).length > 0) {
        const flagDiscover = discoverSecretsFromEventFlags(
          pathDiscover.region,
          flagsForPreview,
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
      // A4 wave3: biome for location-as-transform scar copy
      biome: location.biome ?? locationFloor?.biome ?? null,
    });
  }, [region, locationDeck, locationFloor, player, executeLocationComplete]);

  const confirmLocationComplete = useCallback(() => {
    // Sync lock first — useState eager updaters re-read lastRenderedState until commit,
    // so two same-tick Continues both see a non-null panel without this ref.
    if (completeExecuteLockRef.current) return;
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
    // Hold until next panel is staged (closedRef on modal is primary; this is belt)
    completeExecuteLockRef.current = true;
    completePanelOpenRef.current = false;
    executeLocationComplete(box.opts);
  }, [executeLocationComplete]);

  const clearLocationCompleteUi = useCallback(() => {
    setLocationCompleteResult(null);
    setPendingCompleteOptions(undefined);
    completePanelOpenRef.current = false;
    completeExecuteLockRef.current = false;
  }, []);

  /**
   * Leave the current location and return to region map (only if floor complete).
   */
  const handleLeaveLocation = useCallback(() => {
    if (!region || !locationDeck || !locationFloor) return;
    // Already staged complete panel (auto path or prior leave) — avoid re-stage
    if (completePanelOpenRef.current) return;

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
    clearLocationCompleteUi,
  };
}
