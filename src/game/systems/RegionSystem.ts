/**
 * =============================================================================
 * REGION SYSTEM - Region-Based Exploration Management
 * =============================================================================
 *
 * Manages the hierarchical exploration: Region > Location > Room
 *
 * ## REGION STRUCTURE
 * - Regions contain 10-15 Locations connected by paths
 * - Card-based location selection with intel-gated revelation
 *
 * ## NAVIGATION RULES
 * - Forward-only: Cannot backtrack to previous locations (except loops)
 * - Intel System: Accumulated intel affects card draw and reveal
 * - Path Types: forward, branch, loop, secret
 *
 * ## DANGER SCALING (from DIFFICULTY config)
 * - Entry (1-2), Early (3), Mid (3-4), Late (5-6), Boss (7)
 * - Danger affects enemy strength: scaling = DANGER_BASE + (danger × DANGER_PER_LEVEL)
 *
 * =============================================================================
 */

import {
  Region,
  Location,
  LocationPath,
  LocationType,
  PathType,
  RegionConfig,
  LocationConfig,
  BranchingFloor,
  Player,
  Enemy,
  // Card-based location selection types
  IntelPool,
  IntelRevealLevel,
  LocationDeck,
  LocationCard,
  CardDisplayInfo,
  TierWeights,
  DangerTier,
  // Wealth and activity types
  LocationActivities,
} from '../types';
import {
  dangerToFloor,
  getDangerScaling,
  calculateXP,
  calculateBaseRyo,
} from './ScalingSystem';
import {
  logIntelEvaluate,
  logCardDrawStart,
  logCardDraw,
  logCardDrawComplete,
} from '../utils/explorationDebug';
import { generateBranchingFloorFromConfig, ensureLocationFlagActivities } from './LocationSystem';
import { formatLocationTerrainEffectLines } from './LocationTerrainSystem';

// ============================================================================
// ID GENERATION
// ============================================================================

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// ============================================================================
// SCALING FUNCTIONS (re-exported from ScalingSystem)
// ============================================================================

// Re-export scaling functions for backward compatibility
export {
  dangerToFloor,
  getDangerScaling,
  getWealthMultiplier,
  applyWealthToRyo,
  calculateMerchantRerollCost,
  getMerchantDiscount,
} from './ScalingSystem';

// Alias functions to match existing API
export function calculateLocationXP(dangerLevel: number, baseDifficulty: number): number {
  return calculateXP(dangerLevel, baseDifficulty);
}

export function calculateLocationRyo(dangerLevel: number, baseDifficulty: number): number {
  return calculateBaseRyo(dangerLevel, baseDifficulty);
}

/**
 * Get the effective scaling value for a location (replaces floor in all calculations).
 * This is the single source of truth for difficulty scaling.
 */
export function getEffectiveScale(location: Location, region: Region): number {
  return dangerToFloor(location.dangerLevel, region.baseDifficulty);
}

// ============================================================================
// WEALTH SYSTEM (location-specific functions)
// ============================================================================

/**
 * Get default wealth level based on LocationType.
 * Returns a value in the range for that type with some randomness.
 */
export function getDefaultWealthForLocationType(locationType: LocationType): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const ranges: Record<LocationType, [number, number]> = {
    [LocationType.SETTLEMENT]: [5, 6],  // Trade hub, prosperous
    [LocationType.WILDERNESS]: [2, 3],  // Sparse resources
    [LocationType.STRONGHOLD]: [3, 4],  // Military, moderate
    [LocationType.LANDMARK]: [4, 5],    // Historical value
    [LocationType.SECRET]: [5, 6],      // Hidden treasures
    [LocationType.BOSS]: [6, 7],        // Hoarded wealth
  };

  const [min, max] = ranges[locationType] || [3, 4];
  const wealth = min + Math.floor(Math.random() * (max - min + 1));
  return Math.max(1, Math.min(7, wealth)) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

/**
 * Get default minimum rooms based on LocationType.
 * Returns a value in the range for that type with some randomness.
 * Range: 5-20 rooms
 */
export function getDefaultMinRoomsForLocationType(locationType: LocationType): number {
  const ranges: Record<LocationType, [number, number]> = {
    [LocationType.SETTLEMENT]: [5, 8],    // Small, focused areas
    [LocationType.WILDERNESS]: [8, 12],   // Medium exploration
    [LocationType.STRONGHOLD]: [10, 15],  // Large military complexes
    [LocationType.LANDMARK]: [8, 12],     // Medium historical sites
    [LocationType.SECRET]: [12, 18],      // Extensive hidden areas
    [LocationType.BOSS]: [15, 20],        // Large boss dungeons
  };

  const [min, max] = ranges[locationType] || [8, 12];
  return min + Math.floor(Math.random() * (max - min + 1));
}

// ============================================================================
// INTEL SYSTEM
// ============================================================================

/**
 * Intel gain constants.
 */
export const INTEL_GAIN = {
  COMBAT_VICTORY: 5,      // +5% per combat
  INFO_GATHERING: 25,     // +25% for info gathering activity
  EVENT_DEFAULT: 15,      // ~15% average for events (can vary)
} as const;

/**
 * Evaluate intel level to determine card count and reveal count.
 * 0-25%:  1 card, 0 revealed (hidden)
 * 25-50%: 2 cards, 1 revealed
 * 50-75%: 3 cards, 2 revealed
 * 75-100%: 3 cards, 3 revealed (all)
 */
export function evaluateIntel(intel: number): { cardCount: number; revealedCount: number } {
  let result: { cardCount: number; revealedCount: number };
  if (intel < 25) {
    result = { cardCount: 1, revealedCount: 0 };
  } else if (intel < 50) {
    result = { cardCount: 2, revealedCount: 1 };
  } else if (intel < 75) {
    result = { cardCount: 3, revealedCount: 2 };
  } else {
    result = { cardCount: 3, revealedCount: 3 };
  }
  logIntelEvaluate(intel, result.cardCount, result.revealedCount);
  return result;
}

/**
 * Get activities available in a location based on its flags.
 * Note: Actual room activities are generated dynamically by LocationSystem.
 */
export function getLocationActivities(location: Location): LocationActivities {
  const activities: LocationActivities = {
    combat: false,
    merchant: false,
    rest: false,
    training: false,
    event: false,
    scrollDiscovery: false,
    treasure: false,
    eliteChallenge: false,
    infoGathering: false,
  };

  // R1-012: flagged amenities are injected into the floor — show as present ('normal').
  if (location.flags.isBoss) activities.eliteChallenge = 'normal';
  if (location.flags.hasMerchant) activities.merchant = 'normal';
  if (location.flags.hasTraining) activities.training = 'normal';
  if (location.flags.hasRest) activities.rest = 'normal';
  if (location.flags.hasInfoGathering) activities.infoGathering = 'normal';

  return activities;
}

// T-077: removed dead generateLocationElite / generateRegionBoss (0 callers).
// Room combat uses LocationSystem generateEnemy with preferredElement/pool.

// ============================================================================
// LOCATION GENERATION
// ============================================================================

/**
 * Create a Location from config.
 * Note: Rooms are NOT pre-generated here. They are generated dynamically
 * via locationToBranchingFloor() when the player enters the location.
 */
function createLocation(
  config: LocationConfig,
  regionConfig: RegionConfig,
  difficulty: number,
  player?: Player
): Location {
  const locationId = `location-${config.id}-${generateId()}`;

  return {
    id: locationId,
    name: config.name,
    description: config.description,
    type: config.type,
    icon: config.icon,
    dangerLevel: config.dangerLevel,

    // Location size - use config value or auto-generate from LocationType
    minRooms: config.minRooms ?? getDefaultMinRoomsForLocationType(config.type),

    terrain: config.terrain,
    terrainEffects: config.terrainEffects,
    biome: config.biome,

    // Rooms are generated dynamically when entering location via locationToBranchingFloor()
    rooms: [],
    currentRoomId: null,
    roomsCleared: 0,

    enemyPool: config.enemyPool,
    lootTable: config.lootTable,
    atmosphereEvents: config.atmosphereEvents,
    tiedStoryEvents: config.tiedStoryEvents,

    forwardPaths: config.forwardPaths.map(p => p.id),
    loopPaths: config.loopPaths?.map(p => p.id),
    secretPaths: config.secretPaths?.map(p => p.id),

    flags: config.flags,
    isDiscovered: config.flags.isEntry,
    isAccessible: config.flags.isEntry,
    isCompleted: false,
    isCurrent: false,

    unlockCondition: config.unlockCondition,

    // Wealth system - auto-generated from LocationType
    wealthLevel: getDefaultWealthForLocationType(config.type),
  };
}

// ============================================================================
// PATH GENERATION
// ============================================================================

/**
 * Create all paths for a region from config.
 */
function createRegionPaths(regionConfig: RegionConfig): LocationPath[] {
  const paths: LocationPath[] = [];

  for (const locationConfig of regionConfig.locations) {
    // Forward paths
    for (const pathConfig of locationConfig.forwardPaths) {
      paths.push({
        id: pathConfig.id,
        targetLocationId: pathConfig.targetId,
        pathType: pathConfig.pathType,
        isRevealed: true, // All paths revealed at start
        isUsed: false,
        description: pathConfig.description,
        dangerHint: pathConfig.dangerHint,
      });
    }

    // Loop paths
    if (locationConfig.loopPaths) {
      for (const pathConfig of locationConfig.loopPaths) {
        paths.push({
          id: pathConfig.id,
          targetLocationId: pathConfig.targetId,
          pathType: PathType.LOOP,
          isRevealed: true, // All paths revealed at start
          isUsed: false,
          description: pathConfig.description,
          dangerHint: pathConfig.dangerHint,
        });
      }
    }

    // Secret paths
    if (locationConfig.secretPaths) {
      for (const pathConfig of locationConfig.secretPaths) {
        paths.push({
          id: pathConfig.id,
          targetLocationId: pathConfig.targetId,
          pathType: PathType.SECRET,
          isRevealed: true, // All paths revealed at start
          isUsed: false,
          description: pathConfig.description,
          dangerHint: pathConfig.dangerHint,
        });
      }
    }
  }

  return paths;
}

// ============================================================================
// REGION GENERATION
// ============================================================================

/**
 * Generate a complete Region from config.
 */
export function generateRegion(
  regionConfig: RegionConfig,
  difficulty: number,
  player: Player
): Region {
  // Create all locations
  const locations = regionConfig.locations.map(locConfig =>
    createLocation(locConfig, regionConfig, difficulty, player)
  );

  // Create all paths
  const paths = createRegionPaths(regionConfig);

  return {
    id: `region-${regionConfig.id}-${generateId()}`,
    name: regionConfig.name,
    description: regionConfig.description,
    theme: regionConfig.theme,

    entryLocationIds: regionConfig.entryLocationIds,
    bossLocationId: regionConfig.bossLocationId,
    currentLocationId: null,

    locations,
    paths,

    locationsCompleted: 0,
    totalLocations: locations.filter(l => !l.flags.isSecret).length,
    visitedLocationIds: [],
    discoveredSecretIds: [],

    isCompleted: false,

    arc: regionConfig.arc,
    biome: regionConfig.biome,
    lootTheme: regionConfig.lootTheme,
    baseDifficulty: regionConfig.baseDifficulty,
  };
}

// ============================================================================
// LOCATION NAVIGATION
// ============================================================================

/**
 * Enter a location from the region map.
 * Note: Room generation is handled by LocationSystem via locationToBranchingFloor().
 */
export function enterLocation(region: Region, locationId: string): Region {
  const location = region.locations.find(l => l.id === locationId);
  if (!location || !location.isAccessible) {
    return region;
  }

  const updatedLocations = region.locations.map(loc => {
    if (loc.id === locationId) {
      return { ...loc, isCurrent: true };
    }
    return { ...loc, isCurrent: false };
  });

  return {
    ...region,
    currentLocationId: locationId,
    locations: updatedLocations,
    visitedLocationIds: region.visitedLocationIds.includes(locationId)
      ? region.visitedLocationIds
      : [...region.visitedLocationIds, locationId],
  };
}

/**
 * Enter a location from a drawn card (bypasses accessibility check).
 * Note: Room generation is handled by LocationSystem via locationToBranchingFloor().
 */
export function enterLocationFromCard(region: Region, locationId: string): Region {
  const location = region.locations.find(l => l.id === locationId);
  if (!location) {
    return region;
  }

  const updatedLocations = region.locations.map(loc => {
    if (loc.id === locationId) {
      return {
        ...loc,
        isCurrent: true,
        isAccessible: true, // Mark as accessible when entering from card
      };
    }
    return { ...loc, isCurrent: false };
  });

  return {
    ...region,
    currentLocationId: locationId,
    locations: updatedLocations,
    visitedLocationIds: region.visitedLocationIds.includes(locationId)
      ? region.visitedLocationIds
      : [...region.visitedLocationIds, locationId],
  };
}

/**
 * Get the current location.
 */
export function getCurrentLocation(region: Region): Location | undefined {
  return region.locations.find(l => l.id === region.currentLocationId);
}

// ============================================================================
// PATH CHOICE
// ============================================================================

/**
 * Get available paths from current location.
 */
export function getAvailablePaths(region: Region): LocationPath[] {
  const location = getCurrentLocation(region);
  if (!location) return [];

  const allPathIds = [
    ...location.forwardPaths,
    ...(location.loopPaths || []),
    ...(location.secretPaths || []),
  ];

  return region.paths.filter(path => {
    if (!allPathIds.includes(path.id)) return false;
    if (!path.isRevealed) return false;
    if (path.pathType === PathType.LOOP && path.isUsed) return false;

    // Check if target location is accessible (not already completed, unless it's a loop)
    const targetLoc = region.locations.find(l => l.id === path.targetLocationId);
    if (!targetLoc) return false;
    if (path.pathType !== PathType.LOOP && targetLoc.isCompleted) return false;

    return true;
  });
}

/**
 * Choose a path and move to the target location.
 */
export function choosePath(region: Region, pathId: string): Region {
  const path = region.paths.find(p => p.id === pathId);
  if (!path) return region;

  const targetLocation = region.locations.find(l => l.id === path.targetLocationId);
  if (!targetLocation) return region;

  // Mark loop paths as used
  const updatedPaths = region.paths.map(p => {
    if (p.id === pathId && p.pathType === PathType.LOOP) {
      return { ...p, isUsed: true };
    }
    return p;
  });

  // Update current location
  const updatedLocations = region.locations.map(loc => {
    if (loc.id === path.targetLocationId) {
      return {
        ...loc,
        isDiscovered: true,
        isAccessible: true,
        isCurrent: false, // Will be set when entering
      };
    }
    if (loc.isCurrent) {
      return { ...loc, isCurrent: false };
    }
    return loc;
  });

  return {
    ...region,
    locations: updatedLocations,
    paths: updatedPaths,
    currentLocationId: null, // Back to region map
  };
}

/**
 * Get a random path (when intel was skipped).
 */
export function getRandomPath(region: Region): LocationPath | null {
  const location = getCurrentLocation(region);
  if (!location) return null;

  // Only forward and branch paths for random selection
  const forwardPaths = region.paths.filter(p =>
    location.forwardPaths.includes(p.id) &&
    (p.pathType === PathType.FORWARD || p.pathType === PathType.BRANCH)
  );

  if (forwardPaths.length === 0) return null;
  return forwardPaths[Math.floor(Math.random() * forwardPaths.length)];
}

// ============================================================================
// REGION STATE QUERIES
// ============================================================================

/**
 * Check if the region boss location is defeated.
 * Prefer flags.isBoss / LocationType.BOSS — runtime location ids are
 * `location-<configId>-…` so comparing to config bossLocationId alone is brittle.
 */
export function isRegionBossDefeated(region: Region): boolean {
  if (region.isCompleted) return true;
  const byFlag = region.locations.find(l => l.flags.isBoss);
  if (byFlag) return byFlag.isCompleted === true;
  const byType = region.locations.find(l => l.type === LocationType.BOSS);
  if (byType) return byType.isCompleted === true;
  // Fallback: config id substring match on runtime id
  const bossId = region.bossLocationId;
  const byId = region.locations.find(
    l => l.id === bossId || l.id.includes(`-${bossId}-`) || l.id.endsWith(`-${bossId}`),
  );
  return byId?.isCompleted === true;
}

/** @deprecated Prefer isRegionBossDefeated — kept as alias for call sites. */
export function isRegionComplete(region: Region): boolean {
  return isRegionBossDefeated(region);
}

/**
 * Get location by ID.
 */
export function getLocationById(region: Region, locationId: string): Location | undefined {
  return region.locations.find(l => l.id === locationId);
}

/**
 * Get all discovered locations.
 */
export function getDiscoveredLocations(region: Region): Location[] {
  return region.locations.filter(l => l.isDiscovered);
}

/**
 * Get all accessible locations.
 */
export function getAccessibleLocations(region: Region): Location[] {
  return region.locations.filter(l => l.isAccessible && !l.isCompleted);
}

// ============================================================================
// BRANCHING FLOOR ADAPTER
// ============================================================================

/**
 * Generate a BranchingFloor for a Location using dynamic room generation.
 * Uses LocationSystem's generateBranchingFloorFromConfig for room creation.
 *
 * @param region - Active region with currentLocationId set
 * @param player - Optional player (merchant slots, treasure quality, event eligibility, locationsCleared)
 */
export function locationToBranchingFloor(region: Region, player?: Player): BranchingFloor | null {
  const location = getCurrentLocation(region);
  if (!location) return null;

  const effectiveFloor = dangerToFloor(location.dangerLevel, region.baseDifficulty);

  const preferredEventIds = location.tiedStoryEvents;
  let floor = generateBranchingFloorFromConfig({
    floor: effectiveFloor,
    arc: region.arc,
    biome: location.biome || location.name,
    dangerLevel: location.dangerLevel,
    wealthLevel: location.wealthLevel,
    roomGenerationMode: 'dynamic',
    targetRoomCount: 10,
    difficulty: region.baseDifficulty,
    initialIntel: 0,
    player,
    // T-033: prefer location story hooks when generating room events
    preferredEventIds,
    // T-056: location enemy pool for combat theming
    enemyPool: location.enemyPool,
    // T-059: loot table bias for treasure/merchant drops
    lootTable: location.lootTable,
    // T-064: terrain effects for ambush bias + combat mods path
    terrainEffects: location.terrainEffects,
    // T-068: region elemental theme for enemy affinity
    preferredElement: region.lootTheme?.primaryElement,
    lootTheme: region.lootTheme,
  });

  // R1-012 / R1-007: honor location amenity flags + boss/story event guarantee
  floor = ensureLocationFlagActivities(
    floor,
    {
      hasMerchant: location.flags.hasMerchant,
      hasRest: location.flags.hasRest,
      hasTraining: location.flags.hasTraining,
      // R1-007/R1-013: force preferred story beat when location authors tiedStoryEvents
      ensureStoryEvent: Boolean(preferredEventIds && preferredEventIds.length > 0),
    },
    {
      difficulty: region.baseDifficulty,
      arc: region.arc,
      player,
      preferredEventIds,
      lootTable: location.lootTable,
      lootTheme: region.lootTheme,
    },
  );

  // T-046: ambient flavor for location map header + enter log
  const atmosphereFlavor = pickAtmosphereFlavor(location) ?? undefined;
  // A4: revisit scar for LocationMap chip + enter log (location already completed)
  const isRevisit = Boolean(location.isCompleted);
  // A4 wave2: veiled route chip (no new unlock systems — pass-through of authored flags)
  const isSecret =
    Boolean(location.flags.isSecret) || location.type === LocationType.SECRET;
  return {
    ...floor,
    ...(atmosphereFlavor ? { atmosphereFlavor } : {}),
    ...(isRevisit ? { isRevisit: true } : {}),
    ...(isSecret ? { isSecret: true } : {}),
    enemyPool: location.enemyPool,
    lootTable: location.lootTable,
    terrainEffects: location.terrainEffects,
    preferredElement: region.lootTheme?.primaryElement,
    lootTheme: region.lootTheme,
  };
}

/**
 * Mark the current location as completed.
 * Called when the exit room of a BranchingFloor is cleared.
 * Idempotent: if already completed, returns region unchanged (no double-count).
 */
export function markLocationComplete(region: Region): Region {
  const location = getCurrentLocation(region);
  if (!location) return region;
  if (location.isCompleted) return region;

  const updatedLocation: Location = {
    ...location,
    isCompleted: true,
  };

  const next: Region = {
    ...region,
    locations: region.locations.map(l =>
      l.id === location.id ? updatedLocation : l
    ),
    locationsCompleted: region.locationsCompleted + 1,
  };

  // T-023: boss clear marks the region complete
  if (location.flags.isBoss || location.type === LocationType.BOSS) {
    return { ...next, isCompleted: true };
  }
  return next;
}

// ============================================================================
// SECRET LOCATION DISCOVERY (T-030)
// ============================================================================

/**
 * Mark a secret location discovered if it matches unlockCondition.requirement.
 * Pure; no-op if already discovered or no match.
 */
export function discoverSecretByRequirement(
  region: Region,
  requirement: string,
): { region: Region; discoveredName: string | null } {
  const secret = region.locations.find(
    (l) =>
      l.flags.isSecret &&
      !l.isDiscovered &&
      l.unlockCondition?.requirement === requirement,
  );
  if (!secret) {
    return { region, discoveredName: null };
  }

  const discoveredSecretIds = region.discoveredSecretIds.includes(secret.id)
    ? region.discoveredSecretIds
    : [...region.discoveredSecretIds, secret.id];

  return {
    region: {
      ...region,
      discoveredSecretIds,
      locations: region.locations.map((l) =>
        l.id === secret.id
          ? { ...l, isDiscovered: true, isAccessible: true }
          : l,
      ),
    },
    discoveredName: secret.name,
  };
}

/**
 * Unlock any secrets whose unlockCondition.requirement is present in eventFlags (>0).
 */
export function discoverSecretsFromEventFlags(
  region: Region,
  eventFlags: Record<string, number>,
): { region: Region; newlyDiscovered: string[] } {
  let next = region;
  const newlyDiscovered: string[] = [];

  for (const loc of region.locations) {
    if (!loc.flags.isSecret || loc.isDiscovered) continue;
    const req = loc.unlockCondition?.requirement;
    if (typeof req !== 'string') continue;
    if ((eventFlags[req] ?? 0) <= 0) continue;
    const result = discoverSecretByRequirement(next, req);
    next = result.region;
    if (result.discoveredName) {
      newlyDiscovered.push(result.discoveredName);
    }
  }

  return { region: next, newlyDiscovered };
}

/**
 * Paths store config location ids (e.g. `drowned_shrine`); runtime Location.id is
 * `location-<configId>-<uuid>`. Match either form.
 */
function locationMatchesConfigOrId(location: Location, configOrFullId: string): boolean {
  if (location.id === configOrFullId) return true;
  // location-<configId>-<suffix>
  return location.id.startsWith(`location-${configOrFullId}-`);
}

/**
 * When a location is completed, discover secret locations linked by SECRET paths
 * listed on that location's secretPaths.
 *
 * R1-016: also returns unlockCondition.requirement strings so callers can set
 * matching eventFlags (path unlock used to skip flags that combat/story check).
 */
export function discoverSecretsFromCompletedLocation(
  region: Region,
  completedLocationId: string,
): {
  region: Region;
  newlyDiscovered: string[];
  unlockedRequirements: string[];
} {
  const completed = region.locations.find((l) => l.id === completedLocationId);
  if (!completed?.secretPaths?.length) {
    return { region, newlyDiscovered: [], unlockedRequirements: [] };
  }

  const targetConfigIds = new Set<string>();
  for (const pathId of completed.secretPaths) {
    const path = region.paths.find((p) => p.id === pathId);
    if (path?.targetLocationId) {
      targetConfigIds.add(path.targetLocationId);
    }
  }
  if (targetConfigIds.size === 0) {
    return { region, newlyDiscovered: [], unlockedRequirements: [] };
  }

  const newlyDiscovered: string[] = [];
  const unlockedRequirements: string[] = [];
  const discoveredSecretIds = [...region.discoveredSecretIds];
  const locations = region.locations.map((l) => {
    const isTarget = [...targetConfigIds].some((cfg) => locationMatchesConfigOrId(l, cfg));
    if (!isTarget || !l.flags.isSecret || l.isDiscovered) {
      return l;
    }
    newlyDiscovered.push(l.name);
    if (!discoveredSecretIds.includes(l.id)) {
      discoveredSecretIds.push(l.id);
    }
    const req = l.unlockCondition?.requirement;
    if (typeof req === 'string' && req.length > 0 && !unlockedRequirements.includes(req)) {
      unlockedRequirements.push(req);
    }
    return { ...l, isDiscovered: true, isAccessible: true };
  });

  if (newlyDiscovered.length === 0) {
    return { region, newlyDiscovered: [], unlockedRequirements: [] };
  }

  return {
    region: { ...region, locations, discoveredSecretIds },
    newlyDiscovered,
    unlockedRequirements,
  };
}

/**
 * Exit the current location and return to region map.
 * Called after completing a location or choosing to leave.
 */
export function exitLocation(region: Region): Region {
  const location = getCurrentLocation(region);
  if (!location) return region;

  const updatedLocations = region.locations.map(loc => ({
    ...loc,
    isCurrent: false,
  }));

  return {
    ...region,
    currentLocationId: null,
    locations: updatedLocations,
  };
}

// ============================================================================
// CARD-BASED LOCATION SELECTION SYSTEM
// ============================================================================
// Replaces node-map with 3-card selection from a weighted deck

/**
 * Get danger tier from danger level.
 */
function getDangerTier(dangerLevel: number): DangerTier {
  if (dangerLevel <= 2) return 'low';
  if (dangerLevel <= 4) return 'mid';
  return 'high';
}

/**
 * Get tier weights based on region progress percentage.
 *
 * Progress 0-25%:   Low (danger 1-2) = 80%, Mid (3-4) = 18%, High (5-7) = 2%
 * Progress 25-50%:  Low = 40%, Mid = 50%, High = 10%
 * Progress 50-75%:  Low = 15%, Mid = 45%, High = 40%
 * Progress 75-100%: Low = 5%, Mid = 25%, High = 70%
 */
function getTierWeights(progressPercent: number): TierWeights {
  if (progressPercent < 25) {
    return { low: 0.80, mid: 0.18, high: 0.02 };
  } else if (progressPercent < 50) {
    return { low: 0.40, mid: 0.50, high: 0.10 };
  } else if (progressPercent < 75) {
    return { low: 0.15, mid: 0.45, high: 0.40 };
  } else {
    return { low: 0.05, mid: 0.25, high: 0.70 };
  }
}

/**
 * Weighted random selection from an array of items with weights.
 */
function weightedRandomSelect<T extends { calculatedWeight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.calculatedWeight, 0);
  if (totalWeight === 0) {
    // Fallback to uniform random if all weights are 0
    return items[Math.floor(Math.random() * items.length)];
  }

  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.calculatedWeight;
    if (random <= 0) {
      return item;
    }
  }
  return items[items.length - 1]; // Fallback
}

/**
 * Initialize a location deck from a region.
 * All locations are added to the deck with base weights based on danger level.
 */
export function initializeLocationDeck(region: Region): LocationDeck {
  return {
    regionId: region.id,
    locations: region.locations.map(loc => ({
      locationId: loc.id,
      dangerLevel: loc.dangerLevel,
      isCompleted: loc.isCompleted,
      baseWeight: 10 - loc.dangerLevel, // Lower danger = higher base weight
      completionPenalty: loc.isCompleted ? 0.3 : 1.0,
    })),
  };
}

/**
 * Update deck after a location is completed.
 * Completed locations return to deck with reduced weight.
 */
export function updateDeckAfterCompletion(deck: LocationDeck, locationId: string): LocationDeck {
  return {
    ...deck,
    locations: deck.locations.map(loc => {
      if (loc.locationId === locationId) {
        return {
          ...loc,
          isCompleted: true,
          completionPenalty: 0.3, // 30% of original weight
        };
      }
      return loc;
    }),
  };
}

/**
 * Calculate intel reveal level for a location card.
 *
 * - NONE (0 intel): Mystery card
 * - PARTIAL (1+ intel): Name and danger visible
 * - FULL (3+ intel OR previously visited): One special feature shown
 */
export function calculateIntelLevel(intelPool: IntelPool, location: Location): IntelRevealLevel {
  const intel = intelPool.totalIntel;

  // FULL reveal requires 3+ intel OR location was previously visited
  if (intel >= 3 || location.isCompleted) {
    return IntelRevealLevel.FULL;
  }

  // PARTIAL reveal requires 1+ intel
  if (intel >= 1) {
    return IntelRevealLevel.PARTIAL;
  }

  // No intel = mysterious placeholder
  return IntelRevealLevel.NONE;
}

/**
 * Get the location type display label.
 */
function getLocationTypeLabel(type: LocationType): string {
  const labels: Record<LocationType, string> = {
    [LocationType.SETTLEMENT]: 'Settlement',
    [LocationType.WILDERNESS]: 'Wilderness',
    [LocationType.STRONGHOLD]: 'Stronghold',
    [LocationType.LANDMARK]: 'Landmark',
    [LocationType.SECRET]: 'Veiled Route',
    [LocationType.BOSS]: 'Boss Lair',
  };
  return labels[type] || 'Unknown';
}

// ============================================================================
// ATMOSPHERE FLAVOR (T-046)
// ============================================================================

/**
 * Humanize atmosphere event ids (snake_case flavor tags, not GameEvent ids).
 * Exported for unit tests.
 */
/** R1-010: sober flavor for Waves atmosphere tags (not GameEvents). */
const ATMOSPHERE_PROSE: Record<string, string> = {
  suspicious_cargo: 'Crates sweat salt. No one claims the ink on the manifests.',
  overheard_conversation: 'Two voices under the pier: names, prices, a child as collateral.',
  dock_brawl: 'Knuckles on wet wood. The fight ends before the watch arrives.',
  washed_up_treasure: 'Something glints in the foam — then the tide takes interest.',
  stranded_sailor: 'A man without a ship watches the mist like it still owes him.',
  ghost_ship_sighting: 'A hull without lanterns slides past the horizon and is gone.',
  animal_attack: 'Something large moved between the trunks. Blood on the needles.',
  hidden_cache: 'A cache buried shallow — someone left in a hurry.',
  bandit_camp: 'Ash rings and boot prints. They were here last night.',
  hidden_stash: 'Oilcloth and coin. Smugglers keep better books than the village.',
  cave_in: 'Dust falls from the ceiling. The mountain is thinking about it.',
  smuggler_deal: 'Hands change under a tarp. Nobody smiles.',
  villager_plea: 'A mother counts coins that will never be enough.',
  hidden_resistance: 'Someone scrapes a kanji into a post: not yet, not broken.',
  tax_collection: 'Gato’s men leave with more than coin. Quiet doors stay shut.',
  campfire_tales: 'Smoke tastes of fish and fear. The stories stop when you sit.',
  river_crossing: 'The rope is slick. One misstep and the current keeps you.',
  supply_trade: 'Rations for a rumor. Fair enough in this weather.',
  trapped_air_pocket: 'The wreck holds a bubble of old breath. It won’t last.',
  spectral_captain: 'A wet coat with no man inside still points the way below.',
  treasure_cache: 'Gold is quiet. The lock is not.',
  bridge_sabotage: 'Sawdust and cut ropes. Someone wants the span to fail.',
  worker_strike: 'Hammers rest. Hunger does not.',
  gato_threat: 'A sealed notice: delay, and the pier burns.',
  prisoner_rescue: 'Iron on wrists. Eyes that already left this country.',
  supply_raid: 'The warehouse door hangs open. Fresh footprints lead inland.',
  commander_duel: 'A circle of men. Two blades. No referee but the fog.',
  ghostly_wailing: 'The manor sings when the wind finds the broken glass.',
  hidden_passage: 'Wallpaper peels around a seam that should not exist.',
  noble_treasure: 'Dust on silver. A family name nobody uses anymore.',
  smuggler_meeting: 'Lanterns low. Maps of channels the coastguard never charts.',
  rare_cargo: 'Something sealed in wax that hums under your palm.',
  sea_monster: 'The water bulges wrong. Then it is flat again.',
  dark_ritual: 'Salt lines and old blood. The shrine is not empty.',
  forbidden_knowledge: 'A scroll that stains the gloves black.',
  ancient_curse: 'Your name feels heavier after you speak it here.',
  gato_speech: 'Greed wearing a smile. The room applauds on cue.',
  servant_whispers: 'In the kitchens they talk about who did not come back.',
  display_of_power: 'A body left where the path narrows. Message received.',
};

export function humanizeAtmosphereEventId(id: string): string {
  const key = id.trim().toLowerCase();
  if (ATMOSPHERE_PROSE[key]) return ATMOSPHERE_PROSE[key];
  const cleaned = key.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Pick one atmosphere flavor line for a location, or null if none authored.
 */
export function pickAtmosphereFlavor(
  location: { atmosphereEvents?: string[]; name?: string },
  rng: () => number = Math.random,
): string | null {
  const events = location.atmosphereEvents?.filter((e) => e && e.trim().length > 0) ?? [];
  if (events.length === 0) return null;
  const idx = Math.min(events.length - 1, Math.floor(rng() * events.length));
  const phrase = humanizeAtmosphereEventId(events[idx]!);
  if (!phrase) return null;
  // Prose entries stand alone; fallback titles keep a light prefix
  if (ATMOSPHERE_PROSE[events[idx]!.trim().toLowerCase()]) return phrase;
  return `Atmosphere: ${phrase}`;
}

/**
 * Determine the special feature to display for a location at FULL intel.
 * Returns the highest priority feature.
 *
 * R1-012: Merchant / Rest / Training flags are guaranteed on the location floor
 * via ensureLocationFlagActivities — UI can state them as present (not "May have").
 */
function determineSpecialFeature(location: Location): string | null {
  // Priority order for special features
  if (location.flags.isBoss) return 'REGION BOSS';
  // Veiled / unmarked — mysterious without inventing new systems
  if (location.flags.isSecret) return 'Veiled Route';
  if (location.type === LocationType.SECRET) return 'Unmarked Path';
  if (location.flags.hasMerchant) return 'Merchant';
  if (location.flags.hasTraining) return 'Training Ground';
  if (location.flags.hasRest) return 'Safe Rest';
  if (location.tiedStoryEvents && location.tiedStoryEvents.length > 0) return 'Story Event';
  return null;
}

/**
 * Get display info for a card based on intel level.
 * Determines what information is shown to the player.
 */
export function getCardDisplayInfo(card: LocationCard): CardDisplayInfo {
  const { location, intelLevel, isRevisit } = card;

  switch (intelLevel) {
    case IntelRevealLevel.NONE:
      return {
        name: '???',
        subtitle: 'Signal Fogged',
        dangerLevel: null,
        locationType: null,
        specialFeature: null,
        showMystery: true,
        revisitBadge: false,
        wealthLevel: null,
        activities: null,
        isBoss: false,
        // Veiled signal under fog (name stays sealed) — parity PARTIAL/FULL + UI chips
        isSecret:
          location.type === LocationType.SECRET || Boolean(location.flags.isSecret),
        minRooms: null,
        description: null,
        atmosphereLine: null,
        terrainEffectLines: null,
      };

    case IntelRevealLevel.PARTIAL:
      return {
        name: location.name,
        subtitle: getLocationTypeLabel(location.type),
        dangerLevel: location.dangerLevel,
        locationType: location.type,
        specialFeature: null,
        showMystery: false,
        revisitBadge: isRevisit,
        wealthLevel: location.wealthLevel,
        activities: getLocationActivities(location),
        isBoss: location.type === LocationType.BOSS,
        isSecret: location.type === LocationType.SECRET || Boolean(location.flags.isSecret),
        minRooms: location.minRooms,
        // T-047: authored prose visible once name is known
        description: location.description || null,
        atmosphereLine: null,
        terrainEffectLines: null,
      };

    case IntelRevealLevel.FULL:
      return {
        name: location.name,
        subtitle: getLocationTypeLabel(location.type),
        dangerLevel: location.dangerLevel,
        locationType: location.type,
        specialFeature: determineSpecialFeature(location),
        showMystery: false,
        revisitBadge: isRevisit,
        wealthLevel: location.wealthLevel,
        activities: getLocationActivities(location),
        isBoss: location.type === LocationType.BOSS,
        isSecret: location.type === LocationType.SECRET || Boolean(location.flags.isSecret),
        minRooms: location.minRooms,
        description: location.description || null,
        // FULL intel also surfaces atmosphere flavor (T-046 helper)
        atmosphereLine: pickAtmosphereFlavor(location, () => 0),
        // T-063: location terrain effects
        terrainEffectLines: formatLocationTerrainEffectLines(location.terrainEffects),
      };

    default:
      return {
        name: '???',
        subtitle: 'Unknown',
        dangerLevel: null,
        locationType: null,
        specialFeature: null,
        showMystery: true,
        revisitBadge: false,
        wealthLevel: null,
        activities: null,
        isBoss: false,
        isSecret:
          location.type === LocationType.SECRET || Boolean(location.flags.isSecret),
        minRooms: null,
        description: null,
        atmosphereLine: null,
        terrainEffectLines: null,
      };
  }
}

/**
 * Draw location cards from the deck.
 * Uses progress-weighted random selection based on danger tiers.
 *
 * @param region - The current region
 * @param deck - The location deck
 * @param intelPool - Player's intel pool
 * @param count - Number of cards to draw (default: 3)
 * @returns Array of drawn LocationCards
 */
export function drawLocationCards(
  region: Region,
  deck: LocationDeck,
  intelPool: IntelPool,
  count: number = 3,
  revealedCount?: number // NEW: Override reveal count from currentIntel system
): LocationCard[] {
  logCardDrawStart(region.id, count, revealedCount);
  // Calculate progress percentage
  const progressPercent = region.totalLocations > 0
    ? Math.min(100, Math.round((region.locationsCompleted / region.totalLocations) * 100))
    : 0;

  const tierWeights = getTierWeights(progressPercent);
  const drawnCards: LocationCard[] = [];

  // Calculate weights for all locations
  const weightedLocations = deck.locations.map(deckLoc => {
    const location = region.locations.find(l => l.id === deckLoc.locationId);
    if (!location) {
      return { ...deckLoc, calculatedWeight: 0, location: null };
    }

    const tier = getDangerTier(deckLoc.dangerLevel);
    let weight = tierWeights[tier] * deckLoc.baseWeight;

    // Apply completion modifier (completed = 30% base weight)
    weight *= deckLoc.completionPenalty;

    // Boss location only available at 75%+ progress
    if (location.flags.isBoss && progressPercent < 75) {
      weight = 0;
    }

    // Secret locations require discovery first
    if (location.flags.isSecret && !location.isDiscovered) {
      weight = 0;
    }

    return { ...deckLoc, calculatedWeight: weight, location };
  }).filter(item => item.location !== null && item.calculatedWeight > 0);

  // Draw cards
  for (let i = 0; i < count; i++) {
    if (weightedLocations.length === 0) break;

    const selected = weightedRandomSelect(weightedLocations);
    const location = region.locations.find(l => l.id === selected.locationId)!;

    // NEW: Use revealedCount to determine intel level if provided
    // First N cards are FULL, rest are NONE
    let intelLevel: IntelRevealLevel;
    if (revealedCount !== undefined) {
      intelLevel = i < revealedCount ? IntelRevealLevel.FULL : IntelRevealLevel.NONE;
    } else {
      intelLevel = calculateIntelLevel(intelPool, location);
    }

    logCardDraw(i, location.name, intelLevel, i < (revealedCount ?? 0));

    drawnCards.push({
      locationId: selected.locationId,
      location,
      intelLevel,
      isRevisit: selected.isCompleted,
    });

    // Note: We don't remove from weightedLocations to allow same location
    // to appear multiple times (as per requirements)
  }

  // If we couldn't draw enough cards, fill with whatever is available
  while (drawnCards.length < count && weightedLocations.length > 0) {
    const randomIndex = Math.floor(Math.random() * weightedLocations.length);
    const selected = weightedLocations[randomIndex];
    const location = region.locations.find(l => l.id === selected.locationId)!;

    // NEW: Use revealedCount for fallback cards too
    let intelLevel: IntelRevealLevel;
    if (revealedCount !== undefined) {
      intelLevel = drawnCards.length < revealedCount ? IntelRevealLevel.FULL : IntelRevealLevel.NONE;
    } else {
      intelLevel = calculateIntelLevel(intelPool, location);
    }

    drawnCards.push({
      locationId: selected.locationId,
      location,
      intelLevel,
      isRevisit: selected.isCompleted,
    });
  }

  logCardDrawComplete(drawnCards.map(c => ({
    name: c.location.name,
    intelLevel: c.intelLevel
  })));

  return drawnCards;
}

/**
 * Create initial intel pool for a new region.
 */
export function createInitialIntelPool(): IntelPool {
  return {
    totalIntel: 0,
    maxIntel: 10,
  };
}

/**
 * Add intel to the pool (called after completing intel missions).
 */
export function addIntel(intelPool: IntelPool, amount: number = 1): IntelPool {
  return {
    ...intelPool,
    totalIntel: Math.min(intelPool.totalIntel + amount, intelPool.maxIntel),
  };
}

