/**
 * =============================================================================
 * BRANCHING FLOOR SYSTEM - Exploration & Room Management
 * =============================================================================
 *
 * This system manages the procedurally-generated dungeon floors with a
 * branching room structure. Players explore rooms, complete activities,
 * and eventually find the exit to advance to the next floor.
 *
 * ## FLOOR STRUCTURE
 *
 * Binary branching only — always choose 1 of 2, each room has 2 children:
 * ```
 *              [ENTRY HUB] (internal, pre-cleared, not played)
 *                 /     \
 *            [LEFT]    [RIGHT]     ← first choice (2)
 *            /   \      /   \
 *        [C0]  [C1]  [C0] [C1]   ← foresight (4)
 *           ...dynamic 2-child chain...
 * ```
 *
 * Map UI reads as **2 → 4** (path choices + grandchildren). No playable
 * single-room "START" tier.
 *
 * Rooms are generated dynamically as the player explores to ensure:
 * - Memory efficiency (only generate what's needed)
 * - Always 2 levels of rooms visible ahead
 * - Exit can appear from the 3rd visited room onward (intel-scaled)
 *
 * ## ACTIVITY ORDER
 * Each room can have multiple activities that must be completed in order:
 * 1. combat - Fight the room's enemy
 * 2. eliteChallenge - Optional elite fight for artifacts (15% chance in shrines/ruins)
 * 3. merchant - Buy items
 * 4. event - Story/choice event
 * 5. scrollDiscovery - Find and learn jutsu scrolls
 * 6. rest - Heal HP and restore chakra
 * 7. training - Spend HP/chakra to gain stats
 * 8. treasure - Collect components and ryo
 * ## EXIT ROOM PROBABILITY
 * When generating a room's 2 children (after min rooms visited):
 * one roll decides if the batch contains the exit; if so, exactly one of the
 * two children is exit (uniform). Intel raises the roll; long runs force exit.
 *
**/

import {
  BranchingFloor,
  BranchingRoom,
  BranchingRoomType,
  CombatModifierType,
  RoomActivities,
  RoomTier,
  RoomPosition,
  TerrainType,
  Player,
  Enemy,
  Item,
  PrimaryStat,
  ACTIVITY_ORDER,
  ACTIVITY_EXCLUSIONS,
  ActivityCountWeights,
  ActivityWeights,
  DEFAULT_MERCHANT_SLOTS,
  DEFAULT_TREASURE_QUALITY,
  TreasureQuality,
  TreasureType,
  TreasureChoice,
  TreasureHunt,
  VaultRewardOption,
} from '../types';
import { generateEnemy } from './EnemySystem';
import { getEnemyFullStats } from './StatSystem';
import { generateLoot, generateRandomArtifact, generateSkillForFloor, generateComponentByQuality, generateMerchantItem } from './LootSystem';
import {
  getClanLevelSkillChoices,
  getScrollVendorPrice,
  getScrollForgetCostRyo,
  MAX_CLAN_LEVEL,
} from '../constants';
import {
  getLocationTerrainMods,
  getRoomHiddenRoomBonus,
} from './LocationTerrainSystem';
import { TERRAIN_DEFINITIONS } from '../constants/terrain';
import {
  ROOM_TYPE_CONFIGS,
  ROOM_TYPE_ACTIVITY_CONFIGS,
  getRandomRoomName,
  getRandomRoomDescription,
  getRandomTerrain,
  selectRandomRoomType,
  getRoomTypeConfig,
} from '../constants/roomTypes';
import { EVENTS } from '../constants';
import { getAvailableEventsForPlayer, selectWeightedEvent } from './EventSystem';
import { calculateXP, calculateRyo } from './ScalingSystem';
import { FeatureFlags, LaunchProperties } from '../../config/featureFlags';

// Re-export scaling functions for backward compatibility
export { dangerToFloor, getWealthMultiplier, applyWealthToRyo } from './ScalingSystem';

// ============================================================================
// ID GENERATION
// ============================================================================

const generateId = (): string => {
  return `room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// ============================================================================
// QUALITY UPGRADE HELPER
// ============================================================================

/**
 * Maybe upgrade treasure quality with 50% chance.
 * BROKEN → COMMON → RARE (caps at RARE).
 */
function maybeUpgradeQuality(baseQuality: TreasureQuality): TreasureQuality {
  if (Math.random() >= 0.5) return baseQuality;
  if (baseQuality === TreasureQuality.BROKEN) return TreasureQuality.COMMON;
  if (baseQuality === TreasureQuality.COMMON) return TreasureQuality.RARE;
  return baseQuality; // Already RARE, no upgrade
}

// ============================================================================
// WEIGHTED ACTIVITY SELECTION UTILITIES
// ============================================================================

/**
 * Select activity count (1, 2, or 3) based on weighted probabilities.
 * Returns 0 for START rooms (no activities).
 */
function selectActivityCount(weights: ActivityCountWeights, isStartRoom: boolean): number {
  if (isStartRoom) return 0;

  const totalWeight = weights.one + weights.two + weights.three;
  if (totalWeight === 0) return 1; // Fallback to 1 activity

  const roll = Math.random() * totalWeight;

  if (roll < weights.one) return 1;
  if (roll < weights.one + weights.two) return 2;
  return 3;
}

/**
 * Build activity pool from room type weights.
 * Filters out activities with 0 weight.
 */
function buildActivityPool(
  weights: ActivityWeights
): { activity: keyof RoomActivities; weight: number }[] {
  return (Object.entries(weights) as [keyof RoomActivities, number][])
    .filter(([_, weight]) => weight > 0)
    .map(([activity, weight]) => ({ activity, weight }));
}

/**
 * Select an activity from weighted pool using weighted random selection.
 * Each activity's weight represents relative probability.
 * Returns null if pool is empty.
 */
function selectWeightedActivity(
  pool: { activity: keyof RoomActivities; weight: number }[]
): keyof RoomActivities | null {
  if (pool.length === 0) return null;

  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return null;

  let roll = Math.random() * totalWeight;

  for (const item of pool) {
    roll -= item.weight;
    if (roll <= 0) return item.activity;
  }

  // Fallback to last item (shouldn't happen, but safe)
  return pool[pool.length - 1].activity;
}

// ============================================================================
// DYNAMIC BRANCHING HELPERS
// ============================================================================

/**
 * Get the number of children for a room.
 * Fixed at 2 children per room for consistent branching.
 */
export function getChildCount(): number {
  return 2;
}

/**
 * Get the positions array for a given number of children.
 * Uses CHILD_0 and CHILD_1 for the 2-child branching pattern.
 *
 * @param childCount - Number of children (fixed at 2)
 * @returns Array of RoomPosition values
 */
export function getChildPositions(childCount: number): RoomPosition[] {
  const positions: RoomPosition[] = [];
  for (let i = 0; i < Math.min(childCount, 2); i++) {
    positions.push(`CHILD_${i}` as RoomPosition);
  }
  return positions;
}

// ============================================================================
// FLOOR TO DANGER LEVEL CONVERSION
// ============================================================================

/**
 * Convert floor number to danger level — LEGACY only.
 * Used solely by generateBranchingFloor() (legacy floor crawler entry).
 * Region/location path must pass explicit dangerLevel via FloorGenerationConfig
 * and must NOT call this on effectiveFloor (that double-counts danger:
 * D1 → dangerToFloor≈14 → ceil(14/3)=5).
 *
 * Maps floors to danger levels 1-7:
 * - Floors 1-3 → Danger 1
 * - Floors 4-6 → Danger 2
 * - Floors 7-9 → Danger 3
 * - Floors 10-12 → Danger 4
 * - Floors 13-15 → Danger 5
 * - Floors 16-18 → Danger 6
 * - Floors 19+ → Danger 7
 */
function floorToDangerLevel(floor: number): number {
  return Math.min(7, Math.max(1, Math.ceil(floor / 3)));
}

/**
 * Determine story arc name based on floor range.
 * - Floors 1-10: WAVES_ARC (Land of Waves)
 * - Floors 11-20: EXAMS_ARC (Chunin Exams)
 * - Floors 21-30: ROGUE_ARC (Sasuke Retrieval)
 * - Floors 31+: WAR_ARC (Great Ninja War)
 */
export function getArcNameFromFloor(floor: number): string {
  if (floor <= 10) return 'WAVES_ARC';
  if (floor <= 20) return 'EXAMS_ARC';
  if (floor <= 30) return 'ROGUE_ARC';
  return 'WAR_ARC';
}

/**
 * Get story arc data for a floor (name, label, biome).
 */
function getStoryArc(floor: number): { name: string; label: string; biome: string } {
  const arcName = getArcNameFromFloor(floor);
  const arcs: Record<string, { name: string; label: string; biome: string }> = {
    'WAVES_ARC': { name: 'WAVES_ARC', label: 'Land of Waves', biome: 'Mist Covered Bridge' },
    'EXAMS_ARC': { name: 'EXAMS_ARC', label: 'Chunin Exams', biome: 'Forest of Death' },
    'ROGUE_ARC': { name: 'ROGUE_ARC', label: 'Sasuke Retrieval', biome: 'Valley of the End' },
    'WAR_ARC': { name: 'WAR_ARC', label: 'Great Ninja War', biome: 'Divine Tree Roots' },
  };
  return arcs[arcName];
}

// ============================================================================
// ROOM GENERATION
// ============================================================================

/**
 * Create a single branching room with activities based on type
 */
function createRoom(
  tier: RoomTier,
  position: RoomPosition,
  parentId: string | null,
  floor: number,
  difficulty: number,
  arc: string,
  forceType?: BranchingRoomType,
  depth: number = 0,
  player?: Player,
  preferredEventIds?: string[],
  enemyPool?: string[],
  lootTable?: string,
  ambushChanceBonus: number = 0,
  terrainEffects?: import('../types').LocationTerrainEffect[],
  preferredElement?: import('../types').ElementType,
  lootTheme?: import('../types').RegionLootTheme,
  /** Location danger (1-7) — must come from FloorGenerationConfig, NOT floorToDangerLevel(floor) */
  dangerLevel: number = 4,
  /** Location wealth (1-7) for treasure/merchant scaling */
  wealthLevel: number = 4,
  treasureHunt?: import('../types').TreasureHunt | null,
  huntDeclined?: boolean,
  clanRiteUsed?: boolean,
): BranchingRoom {
  // Select room type
  const type = forceType ?? selectRandomRoomType(tier);
  const config = getRoomTypeConfig(type);

  // Generate room name and description
  const name = getRandomRoomName(type, arc);
  const description = getRandomRoomDescription(type);
  const terrain = getRandomTerrain(type);

  // Create the room
  const room: BranchingRoom = {
    id: generateId(),
    tier,
    position,
    parentId,
    childIds: [],

    type,
    name,
    description,
    terrain,
    icon: config.icon,

    activities: {},
    currentActivityIndex: 0,

    isVisible: true,
    isAccessible: tier === 0, // Only tier 0 is initially accessible
    isCleared: tier === 0, // Start room is pre-cleared
    isExit: false,
    isCurrent: tier === 0,

    // Dynamic generation tracking
    depth,
    hasGeneratedChildren: false,
  };

  // Generate activities (T-033/056/059/064/068/070) — use config danger/wealth, not floor→danger
  room.activities = generateActivities(
    room, config, floor, difficulty, arc, player, wealthLevel,
    treasureHunt ?? null, huntDeclined ?? false,
    preferredEventIds, enemyPool, lootTable, ambushChanceBonus, preferredElement, lootTheme,
    dangerLevel, clanRiteUsed,
  );

  return room;
}

/**
 * Generate activities for a room based on its configuration.
 * Activities are determined by the room type config and random chance.
 *
 * ## Activity Generation Rules:
 *
 * - **Combat**: Required or optional based on config, 50% for optional
 * - **Elite Challenge**: 15% in SHRINE/RUINS, drops artifacts
 * - **Merchant**: Uses player.merchantSlots for item count, 20% chance of 15% discount
 * - **Event**: Filtered by current story arc
 * - **Scroll Discovery**: 25% chance if room has events
 * - **Rest**: 30-50% HP heal, 40-60% chakra restore
 * - **Training**: 3 random stats with light/medium/intense intensity
 * - **Treasure**: Uses player.treasureQuality for component quality + ryo (scales with floor)
 *
 * @param room - The room being populated with activities
 * @param config - Room type configuration (from ROOM_TYPE_CONFIGS)
 * @param floor - Current floor number for scaling
 * @param difficulty - Difficulty modifier for enemy/loot generation
 * @param arc - Current story arc name for event filtering
 * @param player - Player for treasure quality and merchant slots (optional for backward compat)
 * @returns RoomActivities object with all generated activities
 */
// ============================================================================
// ACTIVITY GENERATION HELPERS
// ============================================================================

/**
 * Generate combat activity for a room.
 * Called only when weighted selection picks combat for this room.
 */
function generateCombatActivity(
  room: BranchingRoom,
  config: typeof ROOM_TYPE_CONFIGS[BranchingRoomType],
  floor: number,
  difficulty: number,
  arc: string,
  player?: Player,
  enemyPool?: string[],
  ambushChanceBonus: number = 0,
  preferredElement?: import('../types').ElementType,
  /** Explicit location danger (1-7). Do NOT derive via floorToDangerLevel(floor). */
  dangerLevel: number = 4,
): RoomActivities['combat'] {
  // Base elite chance 30% on tier-2; location ambush_chance (T-064) stacks, capped
  const eliteChance = Math.min(0.7, 0.3 + Math.max(0, ambushChanceBonus));
  const isElite = room.tier === 2 && Math.random() < eliteChance;
  // High ambush: small chance of AMBUSH archetype-style enemy type on non-elite
  const forceAmbush =
    !isElite && ambushChanceBonus > 0 && Math.random() < Math.min(0.25, ambushChanceBonus);
  const enemyType = isElite ? 'ELITE' : forceAmbush ? 'AMBUSH' : 'NORMAL';
  // Use config dangerLevel directly — floor is effectiveFloor for loot/training only.
  // floorToDangerLevel(effectiveFloor) double-counts danger (e.g. D1→floor 14→D5).
  const enemy = generateEnemy(
    dangerLevel,
    player?.locationsCleared ?? 0,
    enemyType,
    difficulty,
    arc,
    undefined,
    enemyPool,
    preferredElement,
  );

  const modifiers: CombatModifierType[] = config.combatModifiers
    ? [config.combatModifiers[Math.floor(Math.random() * config.combatModifiers.length)]]
    : [CombatModifierType.NONE];

  return { enemy, modifiers, completed: false };
}

/**
 * Generate merchant activity for a room.
 * Called only when weighted selection picks merchant for this room.
 */
function generateMerchantActivity(
  floor: number,
  difficulty: number,
  player?: Player,
  lootTable?: string,
  lootTheme?: import('../types').RegionLootTheme,
): RoomActivities['merchant'] {
  const itemCount = player?.merchantSlots ?? DEFAULT_MERCHANT_SLOTS;
  const treasureQuality = player?.treasureQuality ?? DEFAULT_TREASURE_QUALITY;
  const items: Item[] = [];
  for (let i = 0; i < itemCount; i++) {
    items.push(generateMerchantItem(floor, difficulty, treasureQuality, lootTable, lootTheme));
  }

  return {
    items,
    discountPercent: Math.random() < 0.2 ? 15 : 0,
    completed: false,
  };
}

/**
 * Pick an event for a room activity (T-033).
 * Prefers location-tied story event ids when they are eligible for the player.
 * Exported for unit tests.
 */
export function pickEventForLocation(
  arc: string,
  player?: Player,
  preferredEventIds?: string[],
  rng: () => number = Math.random,
): (typeof EVENTS)[number] | undefined {
  const arcEvents = EVENTS.filter(e => !e.allowedArcs || e.allowedArcs.includes(arc));
  const eligible = player ? getAvailableEventsForPlayer(arcEvents, player) : arcEvents;
  const basePool = eligible.length > 0 ? eligible : arcEvents;
  if (basePool.length === 0) return EVENTS[0];

  if (preferredEventIds && preferredEventIds.length > 0) {
    const preferred = basePool.filter((e) => preferredEventIds.includes(e.id));
    if (preferred.length > 0) {
      return selectWeightedEvent(preferred, rng()) ?? preferred[0];
    }
  }

  return selectWeightedEvent(basePool, rng()) ?? basePool[0];
}

/**
 * Generate event activity for a room.
 * Called only when weighted selection picks event for this room.
 */
function generateEventActivity(
  arc: string,
  player?: Player,
  preferredEventIds?: string[],
): RoomActivities['event'] | undefined {
  // Check feature flag first
  if (!FeatureFlags.ENABLE_STORY_EVENTS) return undefined;

  const event = pickEventForLocation(arc, player, preferredEventIds);
  if (!event) return undefined;

  return { definition: event, completed: false };
}

const CLAN_RITE_SPAWN_CHANCE = 0.22;

/**
 * Generate scroll discovery activity for a room.
 * Modes: vendor (buy/forget ryo) or clan rite (once/location, free skill pick).
 */
function generateScrollDiscoveryActivity(
  floor: number,
  lootTheme?: import('../types').RegionLootTheme,
  player?: Player,
  clanRiteUsed?: boolean,
): RoomActivities['scrollDiscovery'] {
  const clan = player?.clan;
  const clanLevel = player?.clanLevel ?? 0;
  const canClanRite = !clanRiteUsed && clanLevel < MAX_CLAN_LEVEL && Boolean(clan);

  if (canClanRite && Math.random() < CLAN_RITE_SPAWN_CHANCE && clan) {
    const owned = new Set(player!.skills.map((s) => s.id));
    const targetLevel = clanLevel + 1;
    const choices = getClanLevelSkillChoices(clan, targetLevel, owned, 3);
    return {
      mode: 'clan',
      availableScrolls: [],
      prices: {},
      forgetCostRyo: 0,
      clanLevelAfter: targetLevel,
      clanSkillChoices: choices,
      completed: false,
    };
  }

  const count = 2 + (Math.random() < 0.45 ? 1 : 0);
  const scrolls: import('../types').Skill[] = [];
  const prices: Record<string, number> = {};
  for (let i = 0; i < count; i++) {
    const skill = generateSkillForFloor(floor, lootTheme, clan);
    if (scrolls.some((s) => s.id === skill.id)) continue;
    scrolls.push(skill);
  }
  if (scrolls.length === 0) {
    scrolls.push(generateSkillForFloor(floor, lootTheme, clan));
  }
  for (const s of scrolls) {
    prices[s.id] = getScrollVendorPrice(s, floor);
  }
  return {
    mode: 'vendor',
    availableScrolls: scrolls,
    prices,
    forgetCostRyo: getScrollForgetCostRyo(1),
    completed: false,
  };
}

/**
 * Generate elite challenge activity for a room.
 * This is the ONLY source of artifacts in the game.
 * Called only when weighted selection picks eliteChallenge for this room.
 */
function generateEliteChallengeActivity(
  room: BranchingRoom,
  floor: number,
  difficulty: number,
  arc: string,
  player?: Player,
  enemyPool?: string[],
  preferredElement?: import('../types').ElementType,
  /** Explicit location danger (1-7). Elite bumps one step, capped at 7. */
  dangerLevel: number = 4,
  config?: typeof ROOM_TYPE_CONFIGS[BranchingRoomType],
): RoomActivities['eliteChallenge'] | undefined {
  // Check feature flag first
  if (!FeatureFlags.ENABLE_ELITE_CHALLENGES) return undefined;

  // Elite is one danger step harder than the location (preserves old floor+1 intent)
  // without double-counting via floorToDangerLevel(effectiveFloor).
  const eliteDangerLevel = Math.min(7, dangerLevel + 1);
  const eliteEnemy = generateEnemy(
    eliteDangerLevel,
    player?.locationsCleared ?? 0,
    'ELITE',
    difficulty + 15,
    arc,
    undefined,
    enemyPool,
    preferredElement,
  );
  eliteEnemy.name = `${eliteEnemy.name} (Artifact Guardian)`;

  // T-108: room-type combat modifiers (elite rooms have no combat activity)
  const roomConfig = config ?? getRoomTypeConfig(room.type);
  const modifiers: CombatModifierType[] = roomConfig.combatModifiers
    ? [roomConfig.combatModifiers[Math.floor(Math.random() * roomConfig.combatModifiers.length)]]
    : [CombatModifierType.NONE];

  return {
    enemy: eliteEnemy,
    artifact: generateRandomArtifact(floor, difficulty + 20),
    modifiers,
    completed: false,
  };
}

/**
 * Generate rest activity for a room.
 * Called only when weighted selection picks rest for this room.
 */
function generateRestActivity(): RoomActivities['rest'] {
  return {
    healPercent: 30 + Math.floor(Math.random() * 20),
    chakraRestorePercent: 40 + Math.floor(Math.random() * 20),
    completed: false,
  };
}

/**
 * Generate training activity for a room.
 * Called only when weighted selection picks training for this room.
 */
function generateTrainingActivity(
  floor: number
): RoomActivities['training'] | undefined {
  // Check feature flag first
  if (!FeatureFlags.ENABLE_TRAINING) return undefined;

  const allStats: PrimaryStat[] = [
    PrimaryStat.WILLPOWER, PrimaryStat.CHAKRA, PrimaryStat.STRENGTH,
    PrimaryStat.SPIRIT, PrimaryStat.INTELLIGENCE, PrimaryStat.CALMNESS,
    PrimaryStat.SPEED, PrimaryStat.ACCURACY, PrimaryStat.DEXTERITY,
  ];

  const shuffledStats = [...allStats].sort(() => Math.random() - 0.5);
  const selectedStats = shuffledStats.slice(0, 3);

  // One offer per resource so the player picks the toll (HP / CP / ryo).
  const costTypes: Array<'hp' | 'chakra' | 'ryo'> = ['hp', 'chakra', 'ryo'];
  const shuffledCosts = [...costTypes].sort(() => Math.random() - 0.5);

  const baseGain = 1 + Math.floor(floor / 10);
  const hpCost = 10 + floor * 2;
  const chakraCost = Math.max(1, Math.round(8 + floor * 1.5));
  const ryoCost = 15 + floor * 5;

  const costFor = (t: 'hp' | 'chakra' | 'ryo'): number => {
    if (t === 'hp') return hpCost;
    if (t === 'chakra') return chakraCost;
    return ryoCost;
  };

  return {
    options: selectedStats.map((stat, i) => ({
      stat,
      costType: shuffledCosts[i],
      cost: costFor(shuffledCosts[i]),
      gain: baseGain,
    })),
    completed: false,
  };
}

// ============================================================================
// TREASURE SYSTEM HELPERS
// ============================================================================

/**
 * Get treasure configuration based on wealth level.
 * Higher wealth = more choices, artifact chance, and ryo multiplier.
 */
function getTreasureConfig(wealthLevel: number): {
  choiceCount: number;
  artifactChance: number;
  ryoMultiplier: number;
} {
  const config = LaunchProperties.TREASURE_CONFIG;
  if (wealthLevel <= 2) return config.LOW;
  if (wealthLevel <= 4) return config.MEDIUM;
  if (wealthLevel <= 6) return config.HIGH;
  return config.RICH;
}

/**
 * Calculate chakra cost to reveal treasure choices.
 * Formula: 10 + (floor * 2) + (choiceCount * 5)
 */
function calculateRevealCost(floor: number, choiceCount: number): number {
  return 10 + (floor * 2) + (choiceCount * 5);
}

/**
 * Get required map pieces for treasure hunt based on danger level.
 */
export function getRequiredMapPieces(dangerLevel: number): number {
  const pieces = LaunchProperties.TREASURE_MAP_PIECES;
  if (dangerLevel <= 2) return pieces.lowDanger;
  if (dangerLevel <= 4) return pieces.midDanger;
  return pieces.highDanger;
}

/**
 * Build one sealed vault face: item | hp | ryo | scroll (weighted).
 */
function generateVaultRewardOption(
  floor: number,
  difficulty: number,
  quality: TreasureQuality,
  artifactChance: number,
  ryoMultiplier: number,
  lootTable?: string,
  lootTheme?: import('../types').RegionLootTheme,
  clan?: Player['clan'],
): VaultRewardOption {
  const roll = Math.random();
  // 48% item, 20% ryo, 17% hp, 15% scroll
  if (roll < 0.48) {
    const isArtifact = artifactChance > 0 && Math.random() < artifactChance;
    const item = isArtifact
      ? generateRandomArtifact(floor, difficulty)
      : generateComponentByQuality(floor, difficulty + 5, quality, lootTable, lootTheme);
    return { kind: 'item', revealed: false, item, isArtifact };
  }
  if (roll < 0.68) {
    const base = 40 + floor * 12 + Math.floor(Math.random() * 50);
    return {
      kind: 'ryo',
      revealed: false,
      ryoAmount: Math.floor(base * ryoMultiplier),
    };
  }
  if (roll < 0.85) {
    // Flat HP: scales mildly with floor (claim clamps to maxHp in handler)
    const hpAmount = 25 + floor * 8 + Math.floor(Math.random() * 20);
    return { kind: 'hp', revealed: false, hpAmount };
  }
  const skill = generateSkillForFloor(floor, lootTheme, clan);
  return { kind: 'scroll', revealed: false, skill };
}

/**
 * Generate treasure activity for a room.
 * Vault overhaul: entry chooses Open Vault (chakra) or free Map Piece (if available).
 * Open → 3 mixed sealed faces; pay to reveal; pick one.
 */
function generateTreasureActivity(
  floor: number,
  difficulty: number,
  wealthLevel: number = 4,
  player?: Player,
  treasureHunt?: TreasureHunt | null,
  huntDeclined?: boolean,
  lootTable?: string,
  lootTheme?: import('../types').RegionLootTheme,
): RoomActivities['treasure'] {
  const quality = maybeUpgradeQuality(player?.treasureQuality ?? DEFAULT_TREASURE_QUALITY);
  const { choiceCount, artifactChance, ryoMultiplier } = getTreasureConfig(wealthLevel);
  const VAULT_FACES = 3;

  const vaultOptions: VaultRewardOption[] = [];
  for (let i = 0; i < VAULT_FACES; i++) {
    vaultOptions.push(
      generateVaultRewardOption(
        floor, difficulty, quality, artifactChance, ryoMultiplier,
        lootTable, lootTheme, player?.clan,
      ),
    );
  }

  // Legacy choices: item faces only (bag-full / old callers)
  const choices: TreasureChoice[] = vaultOptions
    .filter((o) => o.kind === 'item' && o.item)
    .map((o) => ({ item: o.item!, isArtifact: Boolean(o.isArtifact) }));
  // Ensure at least one legacy choice for empty-item vaults
  if (choices.length === 0) {
    const fallback = generateComponentByQuality(
      floor, difficulty + 5, quality, lootTable, lootTheme,
    );
    choices.push({ item: fallback, isArtifact: false });
    vaultOptions[0] = {
      kind: 'item',
      revealed: false,
      item: fallback,
      isArtifact: false,
    };
  }

  const baseRyo = 50 + floor * 10 + Math.floor(Math.random() * 67);
  const openCost = calculateRevealCost(floor, choiceCount);
  const revealCost = Math.max(5, Math.floor(openCost / 3));

  const isFirstTreasure = !treasureHunt;
  const isHuntRoom = treasureHunt?.isActive ?? false;

  // Map piece path: active hunt rooms, or first treasure 50% (starts hunt on take)
  let type = TreasureType.LOCKED_CHEST;
  let mapPieceAvailable = false;
  if (!huntDeclined) {
    if (isHuntRoom) {
      type = TreasureType.TREASURE_HUNTER;
      mapPieceAvailable = true;
    } else if (isFirstTreasure && Math.random() < 0.5) {
      type = TreasureType.TREASURE_HUNTER;
      mapPieceAvailable = true;
    }
  }

  return {
    type,
    choices,
    vaultOptions,
    ryoBonus: Math.floor(baseRyo * ryoMultiplier * 0.35),
    openCost,
    revealCost,
    isRevealed: false,
    phase: 'entry',
    selectedIndex: null,
    collected: false,
    isHuntRoom: type === TreasureType.TREASURE_HUNTER,
    mapPieceAvailable,
  };
}

/**
 * Initialize a treasure hunt for a location.
 * Called when first treasure room is encountered and player chooses to start hunt.
 */
export function initializeTreasureHunt(
  floor: BranchingFloor
): BranchingFloor {
  const treasureHunt: TreasureHunt = {
    isActive: true,
    requiredPieces: getRequiredMapPieces(floor.dangerLevel),
    collectedPieces: 0,
    mapId: `map-${floor.id}-${Date.now()}`,
  };

  return {
    ...floor,
    treasureHunt,
    treasureProbabilityBoost: 0.25, // +25% treasure room chance during hunt
  };
}

/**
 * Add a map piece to the treasure hunt.
 * Returns updated floor and whether the map is now complete.
 */
export function addMapPiece(
  floor: BranchingFloor
): { floor: BranchingFloor; isComplete: boolean } {
  if (!floor.treasureHunt) {
    return { floor, isComplete: false };
  }

  const newPieces = floor.treasureHunt.collectedPieces + 1;
  const isComplete = newPieces >= floor.treasureHunt.requiredPieces;

  return {
    floor: {
      ...floor,
      treasureHunt: {
        ...floor.treasureHunt,
        collectedPieces: newPieces,
        isActive: !isComplete, // Deactivate when complete
      },
    },
    isComplete,
  };
}

/**
 * Calculate trap damage for failed dice roll.
 * Formula: 5% + (dangerLevel * 3)% of max HP
 */
export function calculateTrapDamage(dangerLevel: number, maxHp: number): number {
  const { base, perDanger } = LaunchProperties.TREASURE_TRAP_DAMAGE;
  const damagePercent = base + (dangerLevel * perDanger);
  return Math.floor(maxHp * damagePercent);
}

/**
 * Get treasure hunt completion reward based on pieces collected and wealth level.
 */
export function getTreasureHuntReward(
  pieces: number,
  wealthLevel: number,
  floor: number,
  difficulty: number,
  /** T-072: location/region loot bias for component rewards */
  lootTable?: string,
  lootTheme?: import('../types').RegionLootTheme,
  clan?: Player['clan'],
): { items: Item[]; skills: import('../types').Skill[]; ryo: number } {
  const items: Item[] = [];
  const skills: import('../types').Skill[] = [];
  let ryo = 0;
  const genComp = (q: TreasureQuality) =>
    generateComponentByQuality(floor, difficulty, q, lootTable, lootTheme);
  const genSkill = () => generateSkillForFloor(floor, lootTheme, clan);

  // Reward matrix based on pieces and wealth
  if (pieces === 2) {
    if (wealthLevel <= 2) {
      items.push(genComp(TreasureQuality.COMMON));
      ryo = 100;
    } else if (wealthLevel <= 4) {
      items.push(genComp(TreasureQuality.RARE));
      ryo = 150;
    } else if (wealthLevel <= 6) {
      // T-114: themed skill rewards (same as scroll discovery)
      skills.push(genSkill());
    } else {
      items.push(generateRandomArtifact(floor, difficulty));
    }
  } else if (pieces === 3) {
    if (wealthLevel <= 2) {
      items.push(genComp(TreasureQuality.RARE));
      ryo = 150;
    } else if (wealthLevel <= 4) {
      skills.push(genSkill());
      ryo = 200;
    } else if (wealthLevel <= 6) {
      items.push(generateRandomArtifact(floor, difficulty));
    } else {
      items.push(generateRandomArtifact(floor, difficulty));
      skills.push(genSkill());
    }
  } else if (pieces >= 4) {
    if (wealthLevel <= 2) {
      skills.push(genSkill());
      ryo = 200;
    } else if (wealthLevel <= 4) {
      items.push(generateRandomArtifact(floor, difficulty));
    } else if (wealthLevel <= 6) {
      items.push(generateRandomArtifact(floor, difficulty));
      ryo = 300;
    } else {
      items.push(generateRandomArtifact(floor, difficulty));
      skills.push(genSkill());
      ryo = 500;
    }
  }

  return { items, skills, ryo };
}

/**
 * Generate info gathering activity for a room.
 * Called only when weighted selection picks infoGathering for this room.
 */
function generateInfoGatheringActivity(): RoomActivities['infoGathering'] {
  const flavorTexts = [
    'You gather information from locals.',
    'Ancient inscriptions reveal secrets.',
    'A passing traveler shares rumors.',
    'You overhear valuable intelligence.',
    'Careful observation reveals hidden details.',
  ];

  return {
    intelGain: 25,
    flavorText: flavorTexts[Math.floor(Math.random() * flavorTexts.length)],
    completed: false,
  };
}

// ============================================================================
// MAIN ACTIVITY GENERATION ORCHESTRATOR
// ============================================================================

/**
 * Generate specific activity data based on activity type.
 * Delegates to existing generator functions (now without config checks).
 */
function generateActivityData(
  activityKey: keyof RoomActivities,
  room: BranchingRoom,
  config: typeof ROOM_TYPE_CONFIGS[BranchingRoomType],
  floor: number,
  difficulty: number,
  arc: string,
  player?: Player,
  wealthLevel: number = 4,
  treasureHunt?: TreasureHunt | null,
  huntDeclined?: boolean,
  preferredEventIds?: string[],
  enemyPool?: string[],
  lootTable?: string,
  ambushChanceBonus: number = 0,
  preferredElement?: import('../types').ElementType,
  lootTheme?: import('../types').RegionLootTheme,
  dangerLevel: number = 4,
  clanRiteUsed?: boolean,
): RoomActivities[keyof RoomActivities] | undefined {
  switch (activityKey) {
    case 'combat':
      return generateCombatActivity(
        room, config, floor, difficulty, arc, player, enemyPool, ambushChanceBonus,
        preferredElement, dangerLevel,
      );
    case 'eliteChallenge':
      return generateEliteChallengeActivity(
        room, floor, difficulty, arc, player, enemyPool, preferredElement, dangerLevel, config,
      );
    case 'merchant':
      return generateMerchantActivity(floor, difficulty, player, lootTable, lootTheme);
    case 'event':
      return generateEventActivity(arc, player, preferredEventIds);
    case 'scrollDiscovery':
      return generateScrollDiscoveryActivity(floor, lootTheme, player, clanRiteUsed);
    case 'rest':
      return generateRestActivity();
    case 'training':
      return generateTrainingActivity(floor);
    case 'treasure':
      return generateTreasureActivity(
        floor, difficulty, wealthLevel, player, treasureHunt, huntDeclined, lootTable,
        lootTheme,
      );
    case 'infoGathering':
      return generateInfoGatheringActivity();
    default:
      return undefined;
  }
}

/**
 * Generate all activities for a room using the weighted probability system.
 *
 * Algorithm:
 * 1. Get activity config for room type
 * 2. Determine activity count (1, 2, or 3) from weights
 * 3. Build pool of available activities (weight > 0)
 * 4. Select activities via weighted random, respecting exclusions
 * 5. Generate data for each selected activity
 * 6. Ensure minimum 1 activity (except START rooms)
 */
function generateActivities(
  room: BranchingRoom,
  config: typeof ROOM_TYPE_CONFIGS[BranchingRoomType],
  floor: number,
  difficulty: number,
  arc: string,
  player?: Player,
  wealthLevel: number = 4,
  treasureHunt?: TreasureHunt | null,
  huntDeclined?: boolean,
  preferredEventIds?: string[],
  enemyPool?: string[],
  lootTable?: string,
  ambushChanceBonus: number = 0,
  preferredElement?: import('../types').ElementType,
  lootTheme?: import('../types').RegionLootTheme,
  dangerLevel: number = 4,
  clanRiteUsed?: boolean,
): RoomActivities {
  const roomType = room.type;
  const activityConfig = ROOM_TYPE_ACTIVITY_CONFIGS[roomType];

  // Step 1: Determine how many activities this room will have
  const isStartRoom = roomType === BranchingRoomType.START;
  const targetCount = selectActivityCount(activityConfig.activityCountWeights, isStartRoom);

  if (targetCount === 0) {
    return {}; // START room - no activities
  }

  // Step 2: Build weighted activity pool
  const pool = buildActivityPool(activityConfig.activityWeights);

  // Step 3: Select activities via weighted random
  const selectedActivities: (keyof RoomActivities)[] = [];
  const excludedActivities = new Set<keyof RoomActivities>();

  for (let i = 0; i < targetCount && pool.length > 0; i++) {
    // Filter pool: remove already selected and excluded activities
    const availablePool = pool.filter(
      item => !selectedActivities.includes(item.activity) &&
              !excludedActivities.has(item.activity)
    );

    if (availablePool.length === 0) break;

    // Weighted random selection
    const selected = selectWeightedActivity(availablePool);
    if (!selected) break;

    selectedActivities.push(selected);

    // Add exclusions for this activity (e.g., combat excludes eliteChallenge)
    const exclusions = ACTIVITY_EXCLUSIONS[selected] || [];
    exclusions.forEach(e => excludedActivities.add(e));
  }

  // Step 4: Ensure minimum 1 activity (fallback for non-START rooms)
  if (selectedActivities.length === 0 && !isStartRoom && pool.length > 0) {
    // Find highest-weight activity as fallback
    const sortedPool = [...pool].sort((a, b) => b.weight - a.weight);
    if (sortedPool[0]) {
      selectedActivities.push(sortedPool[0].activity);
    }
  }

  // Step 5: Generate activity data for each selected activity
  const activities: RoomActivities = {};

  for (const activityKey of selectedActivities) {
    const activityData = generateActivityData(
      activityKey,
      room,
      config,
      floor,
      difficulty,
      arc,
      player,
      wealthLevel,
      treasureHunt,
      huntDeclined,
      preferredEventIds,
      enemyPool,
      lootTable,
      ambushChanceBonus,
      preferredElement,
      lootTheme,
      dangerLevel,
      clanRiteUsed,
    );
    if (activityData) {
      (activities as Record<keyof RoomActivities, unknown>)[activityKey] = activityData;
    }
  }

  return activities;
}

/**
 * R1-012: After random weighted gen, inject amenities promised by location flags
 * so card UI ("Has Merchant/Rest/Training") matches playable rooms.
 *
 * Picks the non-START room with fewest activities; does not remove existing ones.
 * Safe no-op when the floor already has the activity somewhere.
 */
export function ensureLocationFlagActivities(
  floor: BranchingFloor,
  flags: {
    hasMerchant?: boolean;
    hasRest?: boolean;
    hasTraining?: boolean;
    /** Boss / story: guarantee at least one preferred event room (R1-007) */
    ensureStoryEvent?: boolean;
  },
  gen: {
    difficulty: number;
    arc: string;
    player?: Player;
    preferredEventIds?: string[];
    lootTable?: string;
    lootTheme?: import('../types').RegionLootTheme;
  },
): BranchingFloor {
  const needed: (keyof RoomActivities)[] = [];
  if (flags.hasMerchant) needed.push('merchant');
  if (flags.hasRest) needed.push('rest');
  if (flags.hasTraining) needed.push('training');
  if (flags.ensureStoryEvent && gen.preferredEventIds && gen.preferredEventIds.length > 0) {
    needed.push('event');
  }
  if (needed.length === 0) return floor;

  let rooms = floor.rooms;

  for (const key of needed) {
    const already = rooms.some((r) => r.activities[key] != null);
    if (already) continue;

    const candidates = rooms
      .filter((r) => r.type !== BranchingRoomType.START && !r.isExit)
      .slice()
      .sort(
        (a, b) =>
          Object.keys(a.activities).length - Object.keys(b.activities).length,
      );
    const target = candidates[0];
    if (!target) continue;

    const config = getRoomTypeConfig(target.type);
    const data = generateActivityData(
      key,
      target,
      config,
      floor.floor,
      gen.difficulty,
      gen.arc,
      gen.player,
      floor.wealthLevel ?? 4,
      floor.treasureHunt,
      floor.huntDeclined,
      gen.preferredEventIds,
      floor.enemyPool,
      gen.lootTable ?? floor.lootTable,
      getLocationTerrainMods(floor.terrainEffects).ambushChance,
      floor.preferredElement,
      gen.lootTheme ?? floor.lootTheme,
      floor.dangerLevel ?? 4,
      floor.clanRiteUsed,
    );
    if (!data) continue;

    rooms = rooms.map((r) =>
      r.id === target.id
        ? { ...r, activities: { ...r.activities, [key]: data } }
        : r,
    );
  }

  if (rooms === floor.rooms) return floor;
  return { ...floor, rooms };
}

/**
 * Generate a semi-boss "Guardian" enemy for exit rooms.
 * Guardians are enhanced elite enemies that guard the floor exit.
 *
 * ## Guardian Stat Multipliers:
 * - Willpower: ×1.3 (30% more HP and HP regen)
 * - Strength: ×1.2 (20% more physical damage/defense)
 * - Spirit: ×1.2 (20% more elemental defense)
 *
 * ## HP Recalculation:
 * After the stat boost, HP is recalculated from the live derived-stat formula
 * (getEnemyFullStats -> derived.maxHp), so the Guardian always spawns exactly at its own maxHp.
 *
 * The ×1.3 willpower boost is what makes the Guardian a meaningful floor-ending
 * challenge — the HP follows from it rather than from a separate hardcoded curve.
 *
 * @param floor - Effective floor (loot/label scaling only; NOT used for danger)
 * @param difficulty - Difficulty modifier (extra +15 applied)
 * @param locationsCleared - Global count of locations cleared (for scaling)
 * @param arc - Story arc name for theming
 * @param dangerLevel - Explicit location danger (1-7); do not derive from floor
 * @returns Enhanced Enemy with Guardian tier and boosted stats
 */
function generateGuardian(
  floor: number,
  difficulty: number,
  locationsCleared: number,
  arc: string,
  enemyPool?: string[],
  preferredElement?: import('../types').ElementType,
  dangerLevel: number = 4,
): Enemy {
  // Use config dangerLevel directly — floorToDangerLevel(effectiveFloor) double-counts.
  // T-057/T-073: pool art + region preferred element bias
  const enemy = generateEnemy(
    dangerLevel, locationsCleared, 'ELITE', difficulty + 15, arc, undefined, enemyPool,
    preferredElement,
  );

  // Apply Guardian stat multipliers
  enemy.name = `Guardian ${enemy.name}`;
  enemy.tier = 'Guardian';
  enemy.primaryStats.willpower = Math.floor(enemy.primaryStats.willpower * 1.3);
  enemy.primaryStats.strength = Math.floor(enemy.primaryStats.strength * 1.2);
  enemy.primaryStats.spirit = Math.floor(enemy.primaryStats.spirit * 1.2);

  // Recalculate HP from the boosted willpower using the LIVE formula. This used to hardcode the
  // pre-T-006 curve (willpower * 12 + 50), which exceeds the current HP_BASE 80 + willpower * 9 for
  // any willpower > 10 — so guardians spawned above their own displayed maxHp (D7 read "1010 / 800")
  // with the HP bar pinned at 100% for the first couple hundred damage. This is the only place in
  // the repo that overrides an enemy's currentHp; everything else derives it the same way.
  enemy.currentHp = getEnemyFullStats(enemy).derived.maxHp;

  return enemy;
}

// ============================================================================
// EXIT ROOM PROBABILITY
// ============================================================================
//
// The exit room system creates a dynamic floor length that scales with
// danger level while ensuring players always explore a meaningful amount.
//
// Formula: minRooms = 2 + dangerLevel (D1→3, D4→6, D7→9)
// After minimum: 30% base + 5% per additional room (capped at 80%)
//
// Example progression:
// - Danger 1: Min 3 rooms, exit appears around rooms 3-13
// - Danger 4: Min 6 rooms, exit appears around rooms 6-16
// - Danger 7: Min 9 rooms, exit appears around rooms 9-19
// ============================================================================

/**
 * Calculate minimum rooms player must visit before exit can appear.
 * Floor is always ≥3 (first exit chance from the 3rd room). Danger still
 * stretches safer/higher locations: D1→3, D4→6, D7→9.
 *
 * @param dangerLevel - Location danger level (1-7)
 * @returns Minimum room count before exit is possible
 */
function getMinRoomsBeforeExit(dangerLevel: number): number {
  return Math.max(3, 2 + dangerLevel);
}

/** Rooms past min before the next child batch is forced to include the exit. */
const EXIT_FORCE_AFTER_EXTRA_ROOMS = 5;

/**
 * Calculate probability that a child-generation batch includes the exit.
 * One roll per batch; if it hits, exactly one of the 2 children becomes exit.
 *
 * ## Probability Curve:
 * - Below minimum roomsVisited: 0%
 * - At minimum: 25% base
 * - Each room beyond min: +5%
 * - Intel 0–100: +0–40%
 * - T-081: optional hiddenRoomBonus from parent room terrain
 * - Cap 90% (force path handles soft-lock)
 *
 * @param roomsVisited - Total rooms player has entered (hub does not count)
 * @param dangerLevel - Location danger level (affects minimum)
 * @param hiddenRoomBonus - Absolute bonus from terrain (e.g. 0.2 from +20)
 * @param intel - Current intel 0–100 (raises exit find chance)
 * @returns Probability 0.0–0.9 that this batch contains the exit
 */
export function calculateExitProbability(
  roomsVisited: number,
  dangerLevel: number,
  hiddenRoomBonus: number = 0,
  intel: number = 0,
): number {
  const minRooms = getMinRoomsBeforeExit(dangerLevel);

  if (roomsVisited < minRooms) {
    return 0;
  }

  const roomsBeyondMin = roomsVisited - minRooms;
  const baseChance = 0.25;
  const incrementPerRoom = 0.05;
  const clampedIntel = Math.max(0, Math.min(100, intel));
  const intelBonus = (clampedIntel / 100) * 0.4;

  const raw =
    baseChance +
    roomsBeyondMin * incrementPerRoom +
    hiddenRoomBonus +
    intelBonus;
  return Math.max(0, Math.min(0.9, raw));
}

/**
 * Pick which child index (if any) becomes the exit for this generation batch.
 * - No exit if one already exists
 * - Force after min + EXIT_FORCE_AFTER_EXTRA_ROOMS visits
 * - Else one roll from calculateExitProbability; uniform among children
 *
 * @returns child index 0..childCount-1, or null if no exit this batch
 */
function pickExitChildIndex(
  branchingFloor: BranchingFloor,
  parentRoom: BranchingRoom | undefined,
  childCount: number,
): number | null {
  if (branchingFloor.exitRoomId || childCount <= 0) {
    return null;
  }

  const minRooms = branchingFloor.minRoomsBeforeExit;
  const force =
    branchingFloor.roomsVisited >= minRooms + EXIT_FORCE_AFTER_EXTRA_ROOMS;

  if (!force) {
    const bonus = parentRoom
      ? getRoomHiddenRoomBonus(TERRAIN_DEFINITIONS[parentRoom.terrain])
      : 0;
    const probability = calculateExitProbability(
      branchingFloor.roomsVisited,
      branchingFloor.dangerLevel,
      bonus,
      branchingFloor.currentIntel,
    );
    if (Math.random() >= probability) {
      return null;
    }
  }

  return Math.floor(Math.random() * childCount);
}

// ============================================================================
// DYNAMIC ROOM GENERATION
// ============================================================================

/**
 * Configure a room as an exit room with guardian enemy and treasure.
 * Returns a new room object instead of mutating the input.
 */
function configureAsExitRoom(
  room: BranchingRoom,
  floor: number,
  difficulty: number,
  arc: string,
  player?: Player,
  wealthLevel: number = 4,
  enemyPool?: string[],
  lootTable?: string,
  lootTheme?: import('../types').RegionLootTheme,
  preferredElement?: import('../types').ElementType,
  dangerLevel: number = 4,
): BranchingRoom {
  const quality = maybeUpgradeQuality(player?.treasureQuality ?? DEFAULT_TREASURE_QUALITY);
  const { choiceCount, artifactChance, ryoMultiplier } = getTreasureConfig(wealthLevel);
  const VAULT_FACES = 3;
  const vaultOptions: VaultRewardOption[] = [];
  for (let i = 0; i < VAULT_FACES; i++) {
    vaultOptions.push(
      generateVaultRewardOption(
        floor, difficulty + 15, quality, artifactChance * 1.5, ryoMultiplier,
        lootTable, lootTheme, player?.clan,
      ),
    );
  }
  const choices: TreasureChoice[] = vaultOptions
    .filter((o) => o.kind === 'item' && o.item)
    .map((o) => ({ item: o.item!, isArtifact: Boolean(o.isArtifact) }));
  if (choices.length === 0) {
    const fallback = generateComponentByQuality(
      floor, difficulty + 15, quality, lootTable, lootTheme,
    );
    choices.push({ item: fallback, isArtifact: false });
    vaultOptions[0] = { kind: 'item', revealed: false, item: fallback, isArtifact: false };
  }
  const baseRyo = 80 + floor * 15;
  const openCost = Math.max(0, calculateRevealCost(floor, choiceCount) - 5);

  return {
    ...room,
    isExit: true,
    name: getRandomRoomName(BranchingRoomType.BOSS_GATE, arc),
    description: getRandomRoomDescription(BranchingRoomType.BOSS_GATE),
    icon: ROOM_TYPE_CONFIGS[BranchingRoomType.BOSS_GATE].icon,
    activities: {
      combat: {
        enemy: generateGuardian(
          floor, difficulty, player?.locationsCleared ?? 0, arc, enemyPool,
          preferredElement ?? lootTheme?.primaryElement,
          dangerLevel,
        ),
        modifiers: [CombatModifierType.NONE],
        completed: false,
      },
      treasure: {
        type: TreasureType.LOCKED_CHEST,
        choices,
        vaultOptions: vaultOptions.map((o) => ({ ...o, revealed: true })),
        ryoBonus: Math.floor(baseRyo * ryoMultiplier * 0.35),
        openCost: 0, // Free open for boss treasure
        revealCost: 0,
        isRevealed: true,
        phase: 'vault' as const, // Skip entry — boss vault already open
        selectedIndex: null,
        collected: false,
        isHuntRoom: false,
        mapPieceAvailable: false,
      },
    },
  };
}

/**
 * Link child rooms to their parent and update the parent's state.
 */
function linkChildrenToParent(
  rooms: BranchingRoom[],
  parentId: string,
  childIds: string[]
): BranchingRoom[] {
  return rooms.map(r => {
    if (r.id === parentId) {
      return { ...r, childIds, hasGeneratedChildren: true };
    }
    return r;
  });
}

/**
 * Generate children for a room dynamically (2-4 children).
 * Uses lazy loading - children are only generated when their parent is visited.
 */
export function generateChildrenForRoom(
  branchingFloor: BranchingFloor,
  roomId: string,
  player?: Player
): BranchingFloor {
  const room = branchingFloor.rooms.find(r => r.id === roomId);
  if (!room || room.hasGeneratedChildren) {
    return branchingFloor;
  }

  const { floor, arc, difficulty, dangerLevel, wealthLevel } = branchingFloor;
  const newRooms: BranchingRoom[] = [];
  const childDepth = room.depth + 1;
  let updatedFloor = branchingFloor;

  // Always 2 children; at most one exit in the batch (uniform among the two)
  const childCount = getChildCount();
  const positions = getChildPositions(childCount);
  const exitIndex = pickExitChildIndex(updatedFloor, room, childCount);

  for (let i = 0; i < childCount; i++) {
    const isExit = exitIndex === i;

    const childAmbush = getLocationTerrainMods(branchingFloor.terrainEffects).ambushChance;
    const childRoom = createRoom(
      2, // Children are always displayed as tier 2 (grandchildren in relative view)
      positions[i],
      room.id,
      floor,
      difficulty,
      arc,
      isExit ? BranchingRoomType.BOSS_GATE : undefined,
      childDepth,
      player,
      branchingFloor.preferredEventIds,
      branchingFloor.enemyPool,
      branchingFloor.lootTable,
      childAmbush,
      branchingFloor.terrainEffects,
      branchingFloor.preferredElement,
      branchingFloor.lootTheme,
      dangerLevel,
      wealthLevel,
      branchingFloor.treasureHunt,
      branchingFloor.huntDeclined,
      branchingFloor.clanRiteUsed,
    );

    const finalRoom = isExit
      ? configureAsExitRoom(
          childRoom, floor, difficulty, arc, player, wealthLevel, branchingFloor.enemyPool,
          branchingFloor.lootTable, branchingFloor.lootTheme,
          branchingFloor.preferredElement,
          dangerLevel,
        )
      : childRoom;

    if (isExit) {
      updatedFloor = { ...updatedFloor, exitRoomId: finalRoom.id };
    }

    newRooms.push(finalRoom);
  }

  const updatedRooms = linkChildrenToParent(updatedFloor.rooms, roomId, newRooms.map(r => r.id));

  return {
    ...updatedFloor,
    rooms: [...updatedRooms, ...newRooms],
    totalRooms: updatedRooms.length + newRooms.length,
  };
}

/**
 * Generate grandchildren for current room's children (called when entering a room)
 * This ensures we always have 2 levels of rooms visible ahead
 */
export function ensureGrandchildrenExist(
  branchingFloor: BranchingFloor,
  currentRoomId: string,
  player?: Player
): BranchingFloor {
  const currentRoom = branchingFloor.rooms.find(r => r.id === currentRoomId);
  if (!currentRoom) {
    return branchingFloor;
  }

  let updatedFloor = branchingFloor;

  // Generate children for each child of current room (to show grandchildren)
  for (const childId of currentRoom.childIds) {
    const childRoom = updatedFloor.rooms.find(r => r.id === childId);
    if (childRoom && !childRoom.hasGeneratedChildren) {
      updatedFloor = generateChildrenForRoom(updatedFloor, childId, player);
    }
  }

  return updatedFloor;
}

// ============================================================================
// FLOOR GENERATION
// ============================================================================

/**
 * Configuration for generating a branching floor.
 * Used by RegionSystem when creating floors from Location configs.
 */
export interface FloorGenerationConfig {
  floor: number;
  arc: string;
  biome: string;
  dangerLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  wealthLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  roomGenerationMode: 'static' | 'dynamic';
  targetRoomCount: number;
  difficulty: number;
  initialIntel?: number;  // Defaults to 0
  player?: Player;
  /** T-033: Location.tiedStoryEvents preferred for room event activities */
  preferredEventIds?: string[];
  /** T-056: Location.enemyPool for room combat names/art */
  enemyPool?: string[];
  /** T-059: Location.lootTable for drop component bias */
  lootTable?: string;
  /** T-064: Location.terrainEffects for ambush bias */
  terrainEffects?: import('../types').LocationTerrainEffect[];
  /** T-068: region lootTheme.primaryElement for enemy affinity bias */
  preferredElement?: import('../types').ElementType;
  /** T-070: region lootTheme for merchant component bias */
  lootTheme?: import('../types').RegionLootTheme;
}

/**
 * Generate a branching floor from a configuration object.
 * Used by RegionSystem when converting Locations to BranchingFloors.
 */
export function generateBranchingFloorFromConfig(config: FloorGenerationConfig): BranchingFloor {
  const {
    floor,
    arc,
    biome,
    dangerLevel,
    wealthLevel,
    roomGenerationMode,
    targetRoomCount,
    difficulty,
    initialIntel = 0,
    player,
    preferredEventIds,
    enemyPool,
    lootTable,
    terrainEffects,
    preferredElement,
    lootTheme,
  } = config;

  const ambushChanceBonus = getLocationTerrainMods(terrainEffects).ambushChance;

  const rooms: BranchingRoom[] = [];

  // Internal entry hub (START type): pre-cleared, not played, never counted as visited.
  // Map UI hides it so the first view is 2 path choices + 4 foresight rooms.
  const entryHub = createRoom(
    0,
    'CENTER',
    null,
    floor,
    difficulty,
    arc,
    BranchingRoomType.START,
    0,
    player,
    preferredEventIds,
    enemyPool,
    lootTable,
    ambushChanceBonus,
    terrainEffects,
    preferredElement,
    lootTheme,
    dangerLevel,
    wealthLevel,
  );
  entryHub.hasGeneratedChildren = true;
  entryHub.isVisible = false;
  rooms.push(entryHub);

  // First choice: always 2 rooms off the hub
  const tier1Left = createRoom(
    1, 'LEFT', entryHub.id, floor, difficulty, arc, undefined, 1,
    player, preferredEventIds, enemyPool, lootTable, ambushChanceBonus,
    terrainEffects, preferredElement, lootTheme, dangerLevel, wealthLevel,
  );
  const tier1Right = createRoom(
    1, 'RIGHT', entryHub.id, floor, difficulty, arc, undefined, 1,
    player, preferredEventIds, enemyPool, lootTable, ambushChanceBonus,
    terrainEffects, preferredElement, lootTheme, dangerLevel, wealthLevel,
  );

  tier1Left.isAccessible = true;
  tier1Right.isAccessible = true;
  tier1Left.hasGeneratedChildren = true;
  tier1Right.hasGeneratedChildren = true;
  tier1Left.isCurrent = false;
  tier1Right.isCurrent = false;

  entryHub.childIds = [tier1Left.id, tier1Right.id];
  rooms.push(tier1Left, tier1Right);

  // Foresight tier: 2 children per entry room → 4 visible ahead
  const tier2Rooms: BranchingRoom[] = [];
  const leftChildCount = getChildCount();
  const leftPositions = getChildPositions(leftChildCount);
  const leftChildren: BranchingRoom[] = [];
  for (let i = 0; i < leftChildCount; i++) {
    leftChildren.push(
      createRoom(
        2, leftPositions[i], tier1Left.id, floor, difficulty, arc, undefined, 2,
        player, preferredEventIds, enemyPool, lootTable, ambushChanceBonus,
        terrainEffects, preferredElement, lootTheme, dangerLevel, wealthLevel,
      ),
    );
  }
  tier2Rooms.push(...leftChildren);
  tier1Left.childIds = leftChildren.map(r => r.id);

  const rightChildCount = getChildCount();
  const rightPositions = getChildPositions(rightChildCount);
  const rightChildren: BranchingRoom[] = [];
  for (let i = 0; i < rightChildCount; i++) {
    rightChildren.push(
      createRoom(
        2, rightPositions[i], tier1Right.id, floor, difficulty, arc, undefined, 2,
        player, preferredEventIds, enemyPool, lootTable, ambushChanceBonus,
        terrainEffects, preferredElement, lootTheme, dangerLevel, wealthLevel,
      ),
    );
  }
  tier2Rooms.push(...rightChildren);
  tier1Right.childIds = rightChildren.map(r => r.id);

  rooms.push(...tier2Rooms);

  // Stay on hub so map shows the 2 entry rooms as immediate choices (not parked on left).
  const currentRoomId = entryHub.id;

  const generatedFloor: BranchingFloor = {
    id: `floor-${floor}-${Date.now()}`,
    floor,
    arc,
    biome,
    rooms,
    currentRoomId,
    exitRoomId: null,
    totalRooms: rooms.length,
    clearedRooms: 0, // hub is structural, not a cleared playable room
    roomsVisited: 0,
    difficulty,
    currentIntel: initialIntel,
    intelGainedThisLocation: 0,
    wealthLevel,
    roomGenerationMode,
    targetRoomCount,
    minRoomsBeforeExit: getMinRoomsBeforeExit(dangerLevel),
    dangerLevel,
    treasureHunt: null,
    treasureProbabilityBoost: 0,
    huntDeclined: false,
    clanRiteUsed: false,
    preferredEventIds,
    enemyPool,
    lootTable,
    terrainEffects,
    preferredElement,
    lootTheme,
  };

  return generatedFloor;
}

/**
 * Generate a complete branching floor with entry hub → 2 → 4 foresight structure.
 * Convenience wrapper around generateBranchingFloorFromConfig.
 */
export function generateBranchingFloor(
  floor: number,
  difficulty: number,
  player: Player
): BranchingFloor {
  const arc = getStoryArc(floor);
  const dangerLevel = floorToDangerLevel(floor) as 1 | 2 | 3 | 4 | 5 | 6 | 7;

  return generateBranchingFloorFromConfig({
    floor,
    arc: arc.name,
    biome: arc.biome,
    dangerLevel,
    wealthLevel: 4, // Default medium wealth
    roomGenerationMode: 'dynamic',
    targetRoomCount: 10,
    difficulty,
    initialIntel: floor === 1 ? 50 : 0, // First floor starts at 50%
    player,
  });
}

// ============================================================================
// ROOM NAVIGATION
// ============================================================================

/**
 * Check if a room is accessible from the current room
 */
export function isRoomAccessible(
  branchingFloor: BranchingFloor,
  targetRoomId: string
): boolean {
  const currentRoom = branchingFloor.rooms.find(r => r.id === branchingFloor.currentRoomId);
  if (!currentRoom) return false;

  // Can always access current room
  if (targetRoomId === branchingFloor.currentRoomId) return true;

  // Can only move to child rooms if current room is cleared
  if (!currentRoom.isCleared) return false;

  return currentRoom.childIds.includes(targetRoomId);
}

/**
 * Move to a new room
 * Also triggers dynamic generation of grandchildren for the new room
 */
export function moveToRoom(
  branchingFloor: BranchingFloor,
  targetRoomId: string,
  player?: Player
): BranchingFloor {
  const targetRoom = branchingFloor.rooms.find(r => r.id === targetRoomId);

  // Check if target room exists and is accessible
  if (!targetRoom || !targetRoom.isAccessible) {
    return branchingFloor;
  }

  // Only increment roomsVisited if actually moving to a different room
  // (re-entering current room for remaining activities shouldn't count)
  const isNewRoom = branchingFloor.currentRoomId !== targetRoomId;

  // Update current room flags - preserve existing accessibility
  const updatedRooms = branchingFloor.rooms.map(room => ({
    ...room,
    isCurrent: room.id === targetRoomId,
  }));

  let updatedFloor: BranchingFloor = {
    ...branchingFloor,
    currentRoomId: targetRoomId,
    rooms: updatedRooms,
    roomsVisited: isNewRoom ? branchingFloor.roomsVisited + 1 : branchingFloor.roomsVisited,
  };

  // Generate grandchildren for this room's children (ensure 2 levels visible)
  updatedFloor = ensureGrandchildrenExist(updatedFloor, targetRoomId, player);

  return updatedFloor;
}

// ============================================================================
// ACTIVITY MANAGEMENT
// ============================================================================

/**
 * Get the current activity for a room
 */
export function getCurrentActivity(room: BranchingRoom): keyof RoomActivities | null {
  for (const activityKey of ACTIVITY_ORDER) {
    const activity = room.activities[activityKey];
    if (activity && !isActivityCompleted(activity)) {
      return activityKey;
    }
  }
  return null;
}

/**
 * Check if an activity is completed
 */
function isActivityCompleted(activity: RoomActivities[keyof RoomActivities]): boolean {
  if (!activity) return true;

  if ('completed' in activity) return activity.completed;
  if ('collected' in activity) return activity.collected;

  return false;
}

/**
 * Mark an activity as completed
 */
export function completeActivity(
  branchingFloor: BranchingFloor,
  roomId: string,
  activityKey: keyof RoomActivities
): BranchingFloor {
  const updatedRooms = branchingFloor.rooms.map(room => {
    if (room.id !== roomId) return room;

    const activity = room.activities[activityKey];
    if (!activity) return room;

    const updatedActivity = { ...activity };
    if ('completed' in updatedActivity) {
      updatedActivity.completed = true;
    }
    if ('collected' in updatedActivity) {
      updatedActivity.collected = true;
    }

    const updatedActivities = {
      ...room.activities,
      [activityKey]: updatedActivity,
    };

    // Check if all activities are now complete
    const allCompleted = ACTIVITY_ORDER.every(key => {
      const act = updatedActivities[key];
      return !act || isActivityCompleted(act);
    });

    // Update child rooms accessibility if room is now cleared
    let updatedChildIds = room.childIds;

    return {
      ...room,
      activities: updatedActivities,
      isCleared: allCompleted,
    };
  });

  // If the room was cleared, unlock children without mutating prior room objects
  // (map kept non-target rooms by reference — in-place isAccessible=true corrupted history).
  const clearedRoom = updatedRooms.find(r => r.id === roomId);
  const roomsAfterUnlock =
    clearedRoom?.isCleared
      ? updatedRooms.map((room) =>
          clearedRoom.childIds.includes(room.id) && !room.isAccessible
            ? { ...room, isAccessible: true }
            : room
        )
      : updatedRooms;

  // Count cleared rooms
  const clearedCount = roomsAfterUnlock.filter(r => r.isCleared).length;

  return {
    ...branchingFloor,
    rooms: roomsAfterUnlock,
    clearedRooms: clearedCount,
  };
}

/**
 * Soft-lock recovery: room has no remaining activities but is still !isCleared
 * (empty gen after event/elite flag dropouts, or spent residue). Without this,
 * children never unlock and the branch is permanently sealed.
 * No-op when room already cleared or still has a pending activity.
 */
export function clearRoomIfSpent(
  branchingFloor: BranchingFloor,
  roomId: string
): BranchingFloor {
  const room = branchingFloor.rooms.find((r) => r.id === roomId);
  if (!room || room.isCleared) return branchingFloor;
  if (getCurrentActivity(room)) return branchingFloor;

  const updatedRooms = branchingFloor.rooms.map((r) =>
    r.id === roomId ? { ...r, isCleared: true } : r
  );
  const clearedRoom = updatedRooms.find((r) => r.id === roomId);
  const roomsAfterUnlock = clearedRoom
    ? updatedRooms.map((r) =>
        clearedRoom.childIds.includes(r.id) && !r.isAccessible
          ? { ...r, isAccessible: true }
          : r
      )
    : updatedRooms;

  return {
    ...branchingFloor,
    rooms: roomsAfterUnlock,
    clearedRooms: roomsAfterUnlock.filter((r) => r.isCleared).length,
  };
}

/**
 * Check if the floor is complete (exit room cleared)
 */
export function isFloorComplete(branchingFloor: BranchingFloor): boolean {
  const exitRoom = branchingFloor.rooms.find(r => r.id === branchingFloor.exitRoomId);
  return exitRoom?.isCleared ?? false;
}

// ============================================================================
// ROOM STATE QUERIES
// ============================================================================

/**
 * Get a room by ID
 */
export function getRoomById(
  branchingFloor: BranchingFloor,
  roomId: string
): BranchingRoom | undefined {
  return branchingFloor.rooms.find(r => r.id === roomId);
}

/**
 * Get the current room
 */
export function getCurrentRoom(branchingFloor: BranchingFloor): BranchingRoom | undefined {
  return branchingFloor.rooms.find(r => r.id === branchingFloor.currentRoomId);
}

/**
 * Get child rooms of a room
 */
export function getChildRooms(
  branchingFloor: BranchingFloor,
  roomId: string
): BranchingRoom[] {
  const room = branchingFloor.rooms.find(r => r.id === roomId);
  if (!room) return [];

  return room.childIds
    .map(childId => branchingFloor.rooms.find(r => r.id === childId))
    .filter((r): r is BranchingRoom => r !== undefined);
}

/**
 * Get rooms by tier
 */
export function getRoomsByTier(
  branchingFloor: BranchingFloor,
  tier: RoomTier
): BranchingRoom[] {
  return branchingFloor.rooms.filter(r => r.tier === tier);
}

// ============================================================================
// COMBAT MODIFIER HELPERS
// ============================================================================

/**
 * Get combat setup for a room
 */
export function getCombatSetup(room: BranchingRoom): {
  enemy: Enemy | null;
  modifiers: CombatModifierType[];
  terrain: TerrainType;
} {
  const combat = room.activities.combat;

  return {
    enemy: combat?.enemy ?? null,
    modifiers: combat?.modifiers ?? [CombatModifierType.NONE],
    terrain: room.terrain,
  };
}

// ============================================================================
// INTEL SYSTEM
// ============================================================================

/**
 * Intel gain constants - how much intel is gained from each source
 */
export const INTEL_GAIN = {
  COMBAT: 5,           // Small gain from combat encounters
  EVENT: 15,           // Moderate gain from story events
  INFO_GATHERING: 25,  // Large gain from info gathering rooms
  TRAINING: 10,        // Small gain from training (overhearing others)
};

/**
 * Add intel to the current floor.
 * Intel is capped at 100%.
 */
export function addIntel(floor: BranchingFloor, amount: number): BranchingFloor {
  const newIntel = Math.min(100, floor.currentIntel + amount);
  return {
    ...floor,
    currentIntel: newIntel,
    intelGainedThisLocation: floor.intelGainedThisLocation + amount,
  };
}

/**
 * Evaluate intel percentage to determine card draw and reveal.
 * - 0-24%: 1 card, 0 revealed (mystery)
 * - 25-49%: 2 cards, 1 revealed
 * - 50-74%: 3 cards, 2 revealed
 * - 75-100%: 3 cards, all revealed
 */
export function evaluateIntel(intel: number): { cardCount: number; revealedCount: number } {
  if (intel < 25) {
    return { cardCount: 1, revealedCount: 0 };
  } else if (intel < 50) {
    return { cardCount: 2, revealedCount: 1 };
  } else if (intel < 75) {
    return { cardCount: 3, revealedCount: 2 };
  } else {
    return { cardCount: 3, revealedCount: 3 };
  }
}

// ============================================================================
// REWARD CALCULATIONS (using ScalingSystem)
// ============================================================================

/**
 * Calculate XP gain for completing a room/location.
 * Uses the floor's danger level and difficulty for scaling.
 * Formula: 25 + (effectiveFloor * 5)
 */
export function calculateLocationXP(floor: BranchingFloor): number {
  return calculateXP(floor.dangerLevel, floor.difficulty);
}

/**
 * Calculate Ryo gain for completing a room/location.
 * Applies wealth multiplier to base ryo.
 * Formula: ((effectiveFloor * 10) + random(0-16)) * wealthMultiplier
 */
export function calculateLocationRyo(floor: BranchingFloor): number {
  return calculateRyo(floor.dangerLevel, floor.difficulty, floor.wealthLevel);
}
