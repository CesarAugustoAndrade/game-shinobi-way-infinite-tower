/**
 * Campaign Simulator — Multi-Location Run with Itemization
 * =============================================================================
 *
 * WHY THIS EXISTS (T-015)
 *
 * The LocationSimulator (T-006 Phase B.1) measures a SINGLE location with
 * HP/chakra carry-over. Two blind spots remained:
 *
 *  1. A player only ever enters one location at a time, so we could not
 *     measure how attrition compounds across a SEQUENCE of locations (the
 *     real region progression).
 *  2. Merchant / treasure / elite-challenge activities were marked NEUTRAL, so
 *     the simulator never modelled how ITEMIZATION keeps the player's power
 *     curve aligned with the enemy scaling wall.
 *
 * This simulator addresses both by chaining N locations with full carry-over
 * (HP, chakra, ryo, equipment, bag, XP/level) and modelling itemization at
 * "medium depth":
 *
 *   - Loot drops from every combat/eliteChallenge/treasure room.
 *   - A deterministic heuristic IA equips an item when it improves the build
 *     score; otherwise sells it for ryo.
 *   - Merchant rooms generate stock and auto-buy the best affordable upgrade.
 *   - Stats are recalculated via getPlayerFullStats (including EquipmentPassive
 *     passives) by resolveBattle before every combat — no manual recalc needed.
 *   - Level-up is faithful: uses LevelSystem.applyLevelUp (single source of
 *     truth shared with App.tsx); a level-up fully heals the player.
 *
 * COMPARATIVA — runCampaignSimulation
 *
 * The same seed is run twice — items ON and items OFF — to isolate the gear
 * contribution. The PRNG sequences start identically (same seed installed before
 * each batch), but diverge after the first loot/merchant event in the items=ON
 * run: subsequent combat dice differ. Gear deltas therefore include PRNG noise —
 * do not treat them as pure gear measurements. Pairing by-run (same run index
 * across both batches) partially controls for this; a printed caveat reminds the
 * reader of the limitation.
 *
 * DETERMINISM
 *
 * All randomness (floor gen, combat dice, loot rolls) flows through the
 * globally-installed seeded Math.random (seededRandom.ts). No game-system math
 * is duplicated or modified; this file is purely an orchestrator.
 */

import {
  Player,
  Item,
  ItemStatBonus,
  EquipmentSlot,
  ElementType,
  RoomActivities,
  BranchingFloor,
  BranchingRoom,
  Enemy,
} from '../game/types';
import {
  generateLoot,
  generateRandomArtifact,
  generateComponent,
  sellItem,
} from '../game/systems/LootSystem';
import { getPlayerFullStats, getEffectiveAtk } from '../game/systems/StatSystem';
import { applyLevelUp } from '../game/systems/LevelSystem';
import {
  calculateLocationXP,
  calculateLocationRyo,
} from '../game/systems/RegionSystem';
import { applyWealthToRyo, dangerToFloor } from '../game/systems/ScalingSystem';
import { getStoryArcByName } from '../game/systems/EnemySystem';
import {
  generateBranchingFloorFromConfig,
  getCurrentActivity,
  completeActivity,
  moveToRoom,
  getCurrentRoom,
  getChildRooms,
  generateChildrenForRoom,
  getRoomById,
  getArcNameFromFloor,
} from '../game/systems/LocationSystem';
import { createSimPlayer, resolveBattle } from './BattleSimulator';
import {
  PlayerBuildConfig,
  SimulationConfig,
  DEFAULT_CONFIG,
} from './types';
import {
  LocationRunConfig,
  DEFAULT_LOCATION_CONFIG,
} from './LocationSimulator';
import { installSeededRandom } from './seededRandom';
import { prepareForCombat, pickNextRoom } from './simulatorUtils';

// ============================================================================
// CONFIG & RESULT TYPES
// ============================================================================

export interface CampaignConfig {
  /** How many consecutive locations to attempt in one run. */
  numLocations: number;
  /** Danger level of the first location. Increments by 1 each location (capped at 7). */
  startDangerLevel: number;
  /** Region-wide base difficulty modifier (0-100). */
  baseDifficulty: number;
  /**
   * Starting player level.
   *
   * NOTE ON COMPARABILITY: this defaults to 5, which is NOT the same as the
   * battle sim's default baseline of level 10. For cross-table comparisons,
   * re-run both sims at the same player level.
   */
  playerLevel: number;
  /** Per-battle turn cap. */
  maxTurnsPerBattle: number;
  /** Hard cap on rooms traversed per location (safety valve). */
  maxRoomsPerRun: number;
  /** Whether eliteChallenge rooms are fought. */
  fightEliteChallenges: boolean;
  /** Default wealth level used for ryo wealth modifier. */
  defaultWealthLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /**
   * Markup multiplier applied to item.value to estimate the merchant buy-price.
   * Approximates the real game's merchant pricing (which lives in a React hook).
   * This is a simulation-only heuristic — not the authoritative price formula.
   * Default 1.5 (50% over base item value).
   */
  merchantMarkupMultiplier: number;
}

export const DEFAULT_CAMPAIGN_CONFIG: CampaignConfig = {
  numLocations: 5,
  startDangerLevel: 1,
  baseDifficulty: 40,
  playerLevel: 5,
  maxTurnsPerBattle: 100,
  maxRoomsPerRun: 40,
  fightEliteChallenges: true,
  defaultWealthLevel: 4,
  merchantMarkupMultiplier: 1.5,
};

/**
 * Metrics captured at the START of each location attempt, before any combat.
 * Used to reconstruct the power curve.
 */
export interface LocationStats {
  /** 1-based index of this location in the campaign run. */
  locationIndex: number;
  /** Danger level of this location. */
  dangerLevel: number;
  /** Player level when entering this location. */
  playerLevelAtEntry: number;
  /**
   * player.locationsCleared at entry to this location.
   * For location N, this should equal N-1 if every prior location was cleared.
   * Used to verify that locationsCleared is correctly propagated.
   */
  playerLocationsCleared: number;
  /** HP fraction (0-1) at entry. */
  hpFractionAtEntry: number;
  /** Player's effective max HP (with gear applied). */
  effectiveMaxHp: number;
  /** Player's effective primary ATK stat (physical or elemental, per element). */
  effectiveAtk: number;
  /** Number of combat encounters this location. */
  combats: number;
  /** Ryo earned this location (combat rewards). */
  ryoGained: number;
  /** Ryo spent this location (merchant purchases). */
  ryoSpent: number;
  /** Number of items equipped this location. */
  itemsEquipped: number;
  /** Location outcome. */
  outcome: 'cleared' | 'died' | 'incomplete';
}

export interface CampaignRunResult {
  /** How many locations were attempted (including the one where player died). */
  locationsAttempted: number;
  /** How many locations were fully cleared (exit room). */
  locationsCleared: number;
  /**
   * 'completed' = cleared all numLocations
   * 'died'      = player died during a location
   * 'incomplete' = safety valve terminated a location run
   */
  finalOutcome: 'completed' | 'died' | 'incomplete';
  /** 1-based index of the location where the player died. null = survived all. */
  deathLocationIndex: number | null;
  /** Per-location metrics captured at entry (snapshot). */
  locationStats: LocationStats[];
  /** Player level at the end of the campaign. */
  finalPlayerLevel: number;
  /** Total ryo earned across all locations. */
  totalRyoGained: number;
  /** Total ryo spent on gear/merchant purchases. */
  totalRyoSpent: number;
  /** Score of equipped gear at the end of the run. */
  finalGearScore: number;
  /** Whether itemization was enabled for this run. */
  withItems: boolean;
}

export interface CampaignAggregate {
  buildName: string;
  withItems: boolean;
  runs: number;
  /** clearRateByDepth[i] = fraction of runs that cleared location (i+1). */
  clearRateByDepth: number[];
  /** avgHpFractionByDepth[i] = avg HP% at entry to location (i+1). */
  avgHpFractionByDepth: number[];
  /** avgEffMaxHpByDepth[i] = avg effective maxHp at entry to location (i+1). */
  avgEffMaxHpByDepth: number[];
  /** avgEffAtkByDepth[i] = avg effective ATK at entry to location (i+1). */
  avgEffAtkByDepth: number[];
  /** avgRyoGainedByDepth[i] = avg ryo earned in location (i+1). */
  avgRyoGainedByDepth: number[];
  avgTotalRyoGained: number;
  avgTotalRyoSpent: number;
  avgLocationsCleared: number;
  /** Fraction of runs that completed all N locations. */
  completionRate: number;
  /** Fraction of runs where the player died. */
  deathRate: number;
  /** Fraction of runs terminated by the safety valve (not cleared, not died). */
  incompleteRate: number;
}

// ============================================================================
// PURE HELPERS
// ============================================================================

/**
 * Stat weights for item scoring by element affinity.
 * Higher weight = this stat contributes more to the build score.
 * Unmentioned stats default to 0.5 (minor relevance).
 */
export function getStatWeights(
  element: ElementType
): Partial<Record<keyof ItemStatBonus, number>> {
  switch (element) {
    case ElementType.FIRE:
    case ElementType.LIGHTNING:
    case ElementType.WATER:
    case ElementType.EARTH:
    case ElementType.WIND:
      return {
        spirit: 3.0, chakra: 2.0, intelligence: 1.5,
        willpower: 1.0, speed: 0.8, dexterity: 0.5,
        flatHp: 0.05, flatChakra: 0.08,
      };
    case ElementType.MENTAL:
      return {
        intelligence: 3.0, calmness: 2.5, spirit: 1.5,
        chakra: 1.5, willpower: 1.0,
        flatHp: 0.05,
      };
    case ElementType.PHYSICAL:
    default:
      return {
        strength: 3.0, speed: 2.0, dexterity: 2.0,
        accuracy: 1.5, willpower: 1.0, calmness: 0.5,
        flatHp: 0.05,
      };
  }
}

/**
 * Compute a deterministic "build score" for an item.
 * Score = sum of (stat_value × stat_weight) across all stat bonuses.
 */
export function scoreItem(item: Item, player: Player): number {
  const weights = getStatWeights(player.element);
  return (Object.entries(item.stats) as [keyof ItemStatBonus, number | undefined][])
    .reduce((total, [stat, value]) => {
      if (value === undefined) return total;
      const w = weights[stat] ?? 0.5;
      return total + value * w;
    }, 0);
}

/**
 * Compute the total gear score for all equipped items.
 */
export function totalGearScore(player: Player): number {
  return (Object.values(player.equipment) as (Item | null)[])
    .reduce((sum, item) => (item ? sum + scoreItem(item, player) : sum), 0);
}

/**
 * Try to equip a new item. Deterministic heuristic:
 *  1. If there is an empty slot → equip directly.
 *  2. Else, find the slot whose item scores the lowest.
 *  3. If new item score > worst slot score → equip (sell displaced).
 *  4. Otherwise → sell the new item.
 *
 * Returns the updated player and how many items were newly equipped (0 or 1).
 */
export function tryEquipOrSell(
  player: Player,
  newItem: Item
): { player: Player; equipped: boolean } {
  const newScore = scoreItem(newItem, player);
  const slots = Object.values(EquipmentSlot) as EquipmentSlot[];

  // Check for an empty slot first
  const emptySlot = slots.find(s => player.equipment[s] === null);
  if (emptySlot) {
    return {
      player: {
        ...player,
        equipment: { ...player.equipment, [emptySlot]: newItem },
      },
      equipped: true,
    };
  }

  // All slots occupied — find the weakest
  let worstSlot: EquipmentSlot = slots[0];
  let worstScore = Infinity;
  for (const slot of slots) {
    const equipped = player.equipment[slot];
    const slotScore = equipped ? scoreItem(equipped, player) : -1;
    if (slotScore < worstScore) {
      worstScore = slotScore;
      worstSlot = slot;
    }
  }

  if (newScore > worstScore) {
    // Equip and sell the displaced item
    const displaced = player.equipment[worstSlot]!;
    let updated = sellItem(player, displaced);
    updated = {
      ...updated,
      equipment: { ...updated.equipment, [worstSlot]: newItem },
    };
    return { player: updated, equipped: true };
  }

  // New item is not an upgrade — sell it
  return { player: sellItem(player, newItem), equipped: false };
}

/**
 * Simulate a merchant visit: generate stock items and auto-buy upgrades.
 *
 * Price = Math.floor(item.value × merchantMarkupMultiplier). This is a
 * simulation-only heuristic — the real merchant price lives in a React hook.
 *
 * Returns updated player and ryo spent.
 */
export function simulateMerchant(
  player: Player,
  effectiveFloor: number,
  baseDifficulty: number,
  merchantMarkupMultiplier: number = 1.5
): { player: Player; ryoSpent: number } {
  let p = player;
  let spent = 0;
  const slotCount = p.merchantSlots;

  for (let i = 0; i < slotCount; i++) {
    // Merchant stock: common-quality components at floor
    const item = generateComponent(effectiveFloor, baseDifficulty);
    const price = Math.floor(item.value * merchantMarkupMultiplier);

    if (p.ryo >= price) {
      const newScore = scoreItem(item, p);
      // Check if this is an upgrade over any current slot
      const slots = Object.values(EquipmentSlot) as EquipmentSlot[];
      const worstEquipped = slots.reduce<number>((min, s) => {
        const eq = p.equipment[s];
        return eq ? Math.min(min, scoreItem(eq, p)) : min;
      }, Infinity);
      const hasEmpty = slots.some(s => p.equipment[s] === null);

      if (hasEmpty || newScore > worstEquipped) {
        // Buy and equip
        p = { ...p, ryo: p.ryo - price };
        spent += price;
        const result = tryEquipOrSell(p, item);
        p = result.player;
      }
    }
  }

  return { player: p, ryoSpent: spent };
}

// ============================================================================
// SINGLE LOCATION WITH ITEMIZATION
// ============================================================================

export interface LocationRunWithItemsResult {
  /** Updated player state after this location (HP/chakra/level/gear/ryo). */
  player: Player;
  /** Outcome of this location run. */
  outcome: 'cleared' | 'died' | 'incomplete';
  /** Metrics for reporting. */
  stats: Omit<LocationStats, 'locationIndex' | 'dangerLevel' | 'playerLevelAtEntry' | 'playerLocationsCleared' | 'hpFractionAtEntry' | 'effectiveMaxHp' | 'effectiveAtk'>;
}

/**
 * Run a single location with optional itemization.
 * The player is passed in with their current state (HP/chakra/gear carry-over).
 *
 * @param player      - Current player state (HP/chakra will be modified).
 * @param dangerLevel - Location danger level (1-7).
 * @param config      - Campaign config.
 * @param enableItems - Whether to process loot drops and merchant purchases.
 * @param runId       - Run index (for battle ID namespacing).
 * @param locationSeq - Location sequence index (for battle ID namespacing).
 */
export function simulateCampaignLocation(
  player: Player,
  dangerLevel: number,
  config: CampaignConfig,
  enableItems: boolean,
  runId: number = 0,
  locationSeq: number = 0
): LocationRunWithItemsResult {
  const effectiveFloor = dangerToFloor(dangerLevel, config.baseDifficulty);
  const arc = getStoryArcByName(getArcNameFromFloor(effectiveFloor));

  const battleConfig: SimulationConfig = {
    ...DEFAULT_CONFIG,
    maxTurnsPerBattle: config.maxTurnsPerBattle,
    playerLevel: player.level,
    floorNumber: effectiveFloor,
    difficulty: config.baseDifficulty,
  };

  let floor = generateBranchingFloorFromConfig({
    floor: effectiveFloor,
    arc: arc.name,
    biome: arc.biome,
    dangerLevel: dangerLevel as 1 | 2 | 3 | 4 | 5 | 6 | 7,
    wealthLevel: config.defaultWealthLevel,
    roomGenerationMode: 'dynamic',
    targetRoomCount: 10,
    difficulty: config.baseDifficulty,
    initialIntel: 0,
    player,
  });

  let p = player;

  let current = getCurrentRoom(floor);
  let combats = 0;
  let roomIndex = 0;
  let battleSeq = 0;
  let ryoGained = 0;
  let ryoSpent = 0;
  let itemsEquipped = 0;

  while (current) {
    roomIndex++;

    let activityKey: keyof RoomActivities | null;
    while ((activityKey = getCurrentActivity(current)) !== null) {
      const acts = current.activities;
      let died = false;

      // ── Combat / EliteChallenge ────────────────────────────────────────
      if (activityKey === 'combat' || activityKey === 'eliteChallenge') {
        const skipOptionalElite =
          activityKey === 'eliteChallenge' && !config.fightEliteChallenges;

        if (!skipOptionalElite) {
          const enemy: Enemy =
            activityKey === 'combat'
              ? acts.combat!.enemy
              : acts.eliteChallenge!.enemy;

          // T-109: room combat modifiers (combat or elite activity)
          const roomMods =
            activityKey === 'combat'
              ? acts.combat?.modifiers
              : acts.eliteChallenge?.modifiers;
          const res = resolveBattle(
            prepareForCombat(p),
            enemy,
            battleConfig,
            runId * 100000 + locationSeq * 1000 + battleSeq++,
            null,
            current.terrain,
            roomMods,
          );
          combats++;

          if (!res.result.won) {
            died = true;
          } else {
            // Carry HP/chakra forward
            p = { ...p, currentHp: res.result.playerFinalHp, currentChakra: res.playerFinalChakra };

            // ── XP & Ryo reward ──────────────────────────────────────────
            const xpGain = calculateLocationXP(dangerLevel, config.baseDifficulty);
            const baseRyo = calculateLocationRyo(dangerLevel, config.baseDifficulty);
            const ryo = applyWealthToRyo(baseRyo, config.defaultWealthLevel);
            p = { ...p, exp: p.exp + xpGain, ryo: p.ryo + ryo };
            ryoGained += ryo;

            // ── Level-up check ───────────────────────────────────────────
            p = applyLevelUp(p);

            // ── Loot drop (items ON only) ────────────────────────────────
            if (enableItems) {
              const lootItem =
                activityKey === 'eliteChallenge'
                  ? generateRandomArtifact(effectiveFloor, config.baseDifficulty)
                  : generateLoot(effectiveFloor, config.baseDifficulty);

              const equip = tryEquipOrSell(p, lootItem);
              if (equip.equipped) itemsEquipped++;
              p = equip.player;
            }
          }
        }
      }
      // ── Rest ────────────────────────────────────────────────────────────
      else if (activityKey === 'rest') {
        const rest = acts.rest!;
        const currentMaxHp = getPlayerFullStats(p).derived.maxHp;
        const currentMaxChakra = getPlayerFullStats(p).derived.maxChakra;
        const hpHeal = Math.floor(currentMaxHp * (rest.healPercent / 100));
        const chakraHeal = Math.floor(currentMaxChakra * (rest.chakraRestorePercent / 100));
        p = {
          ...p,
          currentHp: Math.min(currentMaxHp, p.currentHp + hpHeal),
          currentChakra: Math.min(currentMaxChakra, p.currentChakra + chakraHeal),
        };
      }
      // ── Treasure (items ON only) ─────────────────────────────────────
      else if (activityKey === 'treasure' && enableItems) {
        const treasureItem = generateComponent(effectiveFloor, config.baseDifficulty);
        const equip = tryEquipOrSell(p, treasureItem);
        if (equip.equipped) itemsEquipped++;
        p = equip.player;
      }
      // ── Merchant (items ON only) ─────────────────────────────────────
      else if (activityKey === 'merchant' && enableItems) {
        const result = simulateMerchant(p, effectiveFloor, config.baseDifficulty, config.merchantMarkupMultiplier);
        ryoSpent += result.ryoSpent;
        p = result.player;
      }
      // All other activities (event, scrollDiscovery, training, etc.) are neutral.

      if (died) {
        return {
          player: { ...p, currentHp: 0 },
          outcome: 'died',
          stats: { combats, ryoGained, ryoSpent, itemsEquipped, outcome: 'died' },
        };
      }

      floor = completeActivity(floor, current.id, activityKey);
      const refreshed = getCurrentRoom(floor);
      if (!refreshed) break;
      current = refreshed;
    }

    // ── Exit room cleared → genuine clear ───────────────────────────────────
    if (current.isExit) {
      return {
        player: p,
        outcome: 'cleared',
        stats: { combats, ryoGained, ryoSpent, itemsEquipped, outcome: 'cleared' },
      };
    }

    // ── Advance to next room ─────────────────────────────────────────────────
    let children = getChildRooms(floor, current.id);
    if (children.length === 0) {
      floor = generateChildrenForRoom(floor, current.id, p);
      children = getChildRooms(floor, current.id);
    }
    if (children.length === 0) break; // Safety: nowhere to go

    const next = pickNextRoom(floor, current, children);
    floor = moveToRoom(floor, next.id, p);
    const moved = getCurrentRoom(floor);
    if (!moved || moved.id === current.id) break;
    current = moved;

    if (roomIndex >= config.maxRoomsPerRun) {
      return {
        player: p,
        outcome: 'incomplete',
        stats: { combats, ryoGained, ryoSpent, itemsEquipped, outcome: 'incomplete' },
      };
    }
  }

  // Navigation dead-end without dying or reaching exit
  return {
    player: p,
    outcome: 'incomplete',
    stats: { combats, ryoGained, ryoSpent, itemsEquipped, outcome: 'incomplete' },
  };
}

// ============================================================================
// FULL CAMPAIGN RUN
// ============================================================================

/**
 * Run a full campaign: N consecutive locations with carry-over.
 * Returns per-location metrics and the final player state.
 */
export function simulateCampaignRun(
  build: PlayerBuildConfig,
  config: CampaignConfig,
  enableItems: boolean,
  runId: number = 0
): CampaignRunResult {
  // Create a fresh player at the configured starting level
  let player = createSimPlayer({ ...build, level: config.playerLevel });

  const locationStats: LocationStats[] = [];
  let locationsCleared = 0;
  let deathLocationIndex: number | null = null;
  let finalOutcome: 'completed' | 'died' | 'incomplete' = 'completed';
  let totalRyoGained = 0;
  let totalRyoSpent = 0;

  for (let locIdx = 1; locIdx <= config.numLocations; locIdx++) {
    const dangerLevel = Math.min(7, config.startDangerLevel + locIdx - 1);

    // Snapshot at entry
    const entryStats = getPlayerFullStats(player);
    const entryMaxHp = entryStats.derived.maxHp;

    const locationStat: LocationStats = {
      locationIndex: locIdx,
      dangerLevel,
      playerLevelAtEntry: player.level,
      playerLocationsCleared: player.locationsCleared,
      hpFractionAtEntry: entryMaxHp > 0 ? Math.max(0, Math.min(1, player.currentHp / entryMaxHp)) : 0,
      effectiveMaxHp: entryMaxHp,
      effectiveAtk: getEffectiveAtk(player),
      combats: 0,
      ryoGained: 0,
      ryoSpent: 0,
      itemsEquipped: 0,
      outcome: 'incomplete',
    };

    const result = simulateCampaignLocation(
      player,
      dangerLevel,
      config,
      enableItems,
      runId,
      locIdx
    );

    // Merge stats
    locationStat.combats = result.stats.combats;
    locationStat.ryoGained = result.stats.ryoGained;
    locationStat.ryoSpent = result.stats.ryoSpent;
    locationStat.itemsEquipped = result.stats.itemsEquipped;
    locationStat.outcome = result.outcome;
    locationStats.push(locationStat);

    totalRyoGained += result.stats.ryoGained;
    totalRyoSpent += result.stats.ryoSpent;

    if (result.outcome === 'cleared') {
      locationsCleared++;
      // BUG FIX (T-015 attempt 2): propagate locationsCleared to the player object
      // so that generateEnemy in subsequent locations receives the correct
      // progressionMult. Without this, enemies in location N+1 always scale as if
      // it's the start of the region (locationsCleared=0), making them ~16-20%
      // weaker than the real game.
      player = { ...result.player, locationsCleared };
    } else if (result.outcome === 'died') {
      deathLocationIndex = locIdx;
      finalOutcome = 'died';
      break;
    } else {
      // incomplete — player survives but location not cleared
      finalOutcome = 'incomplete';
      player = result.player;
      // Continue to the next location (player moves on regardless)
    }
  }

  if (locationsCleared === config.numLocations) {
    finalOutcome = 'completed';
  }

  return {
    locationsAttempted: locationStats.length,
    locationsCleared,
    finalOutcome,
    deathLocationIndex,
    locationStats,
    finalPlayerLevel: player.level,
    totalRyoGained,
    totalRyoSpent,
    finalGearScore: totalGearScore(player),
    withItems: enableItems,
  };
}

// ============================================================================
// BATCH RUNS
// ============================================================================

/**
 * Run N campaign attempts for one build, aggregating results.
 */
export function runCampaignBatch(
  build: PlayerBuildConfig,
  config: CampaignConfig,
  enableItems: boolean,
  n: number
): CampaignRunResult[] {
  return Array.from({ length: n }, (_, i) =>
    simulateCampaignRun(build, config, enableItems, i)
  );
}

/**
 * Aggregate N campaign runs into summary statistics.
 */
export function aggregateCampaignRuns(
  results: CampaignRunResult[],
  build: PlayerBuildConfig,
  numLocations: number
): CampaignAggregate {
  const n = results.length;
  if (n === 0) {
    return {
      buildName: build.name,
      withItems: false,
      runs: 0,
      clearRateByDepth: [],
      avgHpFractionByDepth: [],
      avgEffMaxHpByDepth: [],
      avgEffAtkByDepth: [],
      avgRyoGainedByDepth: [],
      avgTotalRyoGained: 0,
      avgTotalRyoSpent: 0,
      avgLocationsCleared: 0,
      completionRate: 0,
      deathRate: 0,
      incompleteRate: 0,
    };
  }

  const withItems = results[0].withItems;

  const clearRateByDepth: number[] = [];
  const avgHpFractionByDepth: number[] = [];
  const avgEffMaxHpByDepth: number[] = [];
  const avgEffAtkByDepth: number[] = [];
  const avgRyoGainedByDepth: number[] = [];

  for (let loc = 1; loc <= numLocations; loc++) {
    const attemptsAtThisDepth = results.filter(
      r => r.locationStats.some(s => s.locationIndex === loc)
    );
    const clearedAtThisDepth = attemptsAtThisDepth.filter(
      r => r.locationStats.find(s => s.locationIndex === loc)?.outcome === 'cleared'
    );

    const avg = (vals: number[]) =>
      vals.length === 0 ? 0 : vals.reduce((a, b) => a + b, 0) / vals.length;

    const statsAtDepth = results
      .map(r => r.locationStats.find(s => s.locationIndex === loc))
      .filter((s): s is LocationStats => s !== undefined);

    clearRateByDepth.push(attemptsAtThisDepth.length === 0 ? 0 : clearedAtThisDepth.length / attemptsAtThisDepth.length);
    avgHpFractionByDepth.push(avg(statsAtDepth.map(s => s.hpFractionAtEntry)));
    avgEffMaxHpByDepth.push(avg(statsAtDepth.map(s => s.effectiveMaxHp)));
    avgEffAtkByDepth.push(avg(statsAtDepth.map(s => s.effectiveAtk)));
    avgRyoGainedByDepth.push(avg(statsAtDepth.map(s => s.ryoGained)));
  }

  const avgN = (vals: number[]) =>
    vals.length === 0 ? 0 : vals.reduce((a, b) => a + b, 0) / vals.length;

  return {
    buildName: build.name,
    withItems,
    runs: n,
    clearRateByDepth,
    avgHpFractionByDepth,
    avgEffMaxHpByDepth,
    avgEffAtkByDepth,
    avgRyoGainedByDepth,
    avgTotalRyoGained: avgN(results.map(r => r.totalRyoGained)),
    avgTotalRyoSpent: avgN(results.map(r => r.totalRyoSpent)),
    avgLocationsCleared: avgN(results.map(r => r.locationsCleared)),
    completionRate: results.filter(r => r.finalOutcome === 'completed').length / n,
    deathRate: results.filter(r => r.finalOutcome === 'died').length / n,
    incompleteRate: results.filter(r => r.finalOutcome === 'incomplete').length / n,
  };
}

// ============================================================================
// REPORT PRINTER
// ============================================================================

const PCT = (v: number): string => `${(v * 100).toFixed(0)}%`;
const FMT = (v: number, d = 0): string => v.toFixed(d);

export function printCampaignReport(
  withItems: CampaignAggregate[],
  withoutItems: CampaignAggregate[],
  meta: {
    seed: number;
    runsPerBatch: number;
    config: CampaignConfig;
  }
): void {
  const { config } = meta;
  const runs = meta.runsPerBatch;
  const numLoc = config.numLocations;
  const dangerLevels = Array.from({ length: numLoc }, (_, i) =>
    Math.min(7, config.startDangerLevel + i)
  );

  const line = '='.repeat(72);
  const sep = '-'.repeat(72);

  console.log('\n' + line);
  console.log('CAMPAIGN SIMULATION  (multi-location run with itemization)');
  console.log(line);
  console.log(`  Seed: ${meta.seed}   Runs/batch: ${meta.runsPerBatch}   baseDifficulty: ${config.baseDifficulty}`);
  console.log(`  Starting level: ${config.playerLevel}   Locations: ${numLoc}   DangerLevels: ${config.startDangerLevel}→${dangerLevels[numLoc - 1]}`);
  console.log(`  Fight elite challenges: ${config.fightEliteChallenges}`);
  console.log(`  Merchant markup: ×${config.merchantMarkupMultiplier}`);
  console.log(`  NOTE: Starting level ${config.playerLevel} ≠ battle sim baseline (10); cross-table`);
  console.log(`        comparisons require re-running both sims at the same level.`);
  console.log(`  NOTE: PRNG sequences start identically but diverge after`);
  console.log(`        the first loot/merchant event in the items=ON run.`);
  console.log(`        Gear deltas include PRNG noise — do not treat them`);
  console.log(`        as pure gear measurements.`);
  if (runs < 20) {
    const ciPp = Math.round(1.96 * 50 / Math.sqrt(runs));
    console.log(`  NOTE: ${runs} runs/batch — 95% CI ≈ ±${ciPp}pp per cell.`);
    console.log(`        Treat percentages as directional, not precise.`);
  }

  const buildNames = [...new Set(withItems.map(a => a.buildName))];
  const col = 20;
  const cw = 8;

  const header = (): string => {
    let h = 'BUILD'.padEnd(col);
    for (const d of dangerLevels) h += `D${d}`.padStart(cw);
    return h;
  };

  // ── 1. Clear rate by location depth: WITH items ──────────────────────────
  console.log('\n[1] CLEAR RATE BY LOCATION DEPTH — WITH ITEMS');
  console.log('    (% of runs that cleared each location; unfair to count campaign start as 100%)');
  console.log(header());
  console.log(sep);
  for (const build of buildNames) {
    const agg = withItems.find(a => a.buildName === build);
    let row = build.slice(0, col - 1).padEnd(col);
    for (let i = 0; i < numLoc; i++) {
      row += (agg ? PCT(agg.clearRateByDepth[i] ?? 0) : '-').padStart(cw);
    }
    console.log(row);
  }

  // ── 2. Clear rate by location depth: WITHOUT items ───────────────────────
  console.log('\n[2] CLEAR RATE BY LOCATION DEPTH — WITHOUT ITEMS');
  console.log(header());
  console.log(sep);
  for (const build of buildNames) {
    const agg = withoutItems.find(a => a.buildName === build);
    let row = build.slice(0, col - 1).padEnd(col);
    for (let i = 0; i < numLoc; i++) {
      row += (agg ? PCT(agg.clearRateByDepth[i] ?? 0) : '-').padStart(cw);
    }
    console.log(row);
  }

  // ── 3. Comparativa: gear delta ──────────────────────────────────────────
  console.log('\n[3] GEAR DELTA  (clearRate WITH items − WITHOUT items per location)');
  console.log('    Positive = gear helps; Negative = gear hurts (surprising)');
  console.log(header());
  console.log(sep);
  for (const build of buildNames) {
    const wi = withItems.find(a => a.buildName === build);
    const wo = withoutItems.find(a => a.buildName === build);
    let row = build.slice(0, col - 1).padEnd(col);
    for (let i = 0; i < numLoc; i++) {
      const delta = (wi?.clearRateByDepth[i] ?? 0) - (wo?.clearRateByDepth[i] ?? 0);
      const sign = delta >= 0 ? '+' : '';
      row += `${sign}${PCT(delta)}`.padStart(cw);
    }
    console.log(row);
  }

  // ── 4. Power curve: Effective HP (with items) ────────────────────────────
  console.log('\n[4] POWER CURVE — AVG EFFECTIVE MAX HP AT ENTRY (with items, HP pts)');
  console.log(header());
  console.log(sep);
  for (const build of buildNames) {
    const agg = withItems.find(a => a.buildName === build);
    let row = build.slice(0, col - 1).padEnd(col);
    for (let i = 0; i < numLoc; i++) {
      row += (agg ? FMT(agg.avgEffMaxHpByDepth[i] ?? 0) : '-').padStart(cw);
    }
    console.log(row);
  }

  // ── 5. Power curve: Effective ATK (with items) ───────────────────────────
  console.log('\n[5] POWER CURVE — AVG EFFECTIVE ATK AT ENTRY (with items, stat pts)');
  console.log(header());
  console.log(sep);
  for (const build of buildNames) {
    const agg = withItems.find(a => a.buildName === build);
    let row = build.slice(0, col - 1).padEnd(col);
    for (let i = 0; i < numLoc; i++) {
      row += (agg ? FMT(agg.avgEffAtkByDepth[i] ?? 0) : '-').padStart(cw);
    }
    console.log(row);
  }

  // ── 6. Ryo economy (with items only) ─────────────────────────────────────
  console.log('\n[6] RYO ECONOMY  (with items — avg per run)');
  console.log('BUILD'.padEnd(col) + 'GAINED'.padStart(cw) + 'SPENT'.padStart(cw) + 'NET'.padStart(cw));
  console.log(sep);
  for (const build of buildNames) {
    const agg = withItems.find(a => a.buildName === build);
    if (!agg) continue;
    const net = agg.avgTotalRyoGained - agg.avgTotalRyoSpent;
    const sign = net >= 0 ? '+' : '';
    console.log(
      build.slice(0, col - 1).padEnd(col) +
      FMT(agg.avgTotalRyoGained).padStart(cw) +
      FMT(agg.avgTotalRyoSpent).padStart(cw) +
      `${sign}${FMT(net)}`.padStart(cw)
    );
  }

  // ── 7. Summary ─────────────────────────────────────────────────────────────
  console.log('\n[7] SUMMARY — COMPLETION RATE (cleared all locations)');
  console.log(
    'BUILD'.padEnd(col) +
    'WITH ITEMS'.padStart(11) +
    '±SD'.padStart(6) +
    'WITHOUT'.padStart(9) +
    'DELTA'.padStart(8) +
    'AVG_CLR'.padStart(8) +
    'INCOMPL'.padStart(9)
  );
  console.log(sep);
  for (const build of buildNames) {
    const wi = withItems.find(a => a.buildName === build);
    const wo = withoutItems.find(a => a.buildName === build);
    const wiRate = wi?.completionRate ?? 0;
    const woRate = wo?.completionRate ?? 0;
    const delta = wiRate - woRate;
    const sign = delta >= 0 ? '+' : '';
    const incompl = wi?.incompleteRate ?? 0;
    const avgClr = wi?.avgLocationsCleared ?? 0;
    const sdPp = Math.round(Math.sqrt(wiRate * (1 - wiRate) / runs) * 100);
    console.log(
      build.slice(0, col - 1).padEnd(col) +
      PCT(wiRate).padStart(11) +
      `±${sdPp}pp`.padStart(6) +
      PCT(woRate).padStart(9) +
      `${sign}${PCT(delta)}`.padStart(8) +
      FMT(avgClr, 1).padStart(8) +
      PCT(incompl).padStart(9)
    );
  }

  console.log('\n' + line);
  console.log('END CAMPAIGN SIMULATION');
  console.log(line + '\n');
}

// ============================================================================
// ENTRY POINT (called from index.ts)
// ============================================================================

/**
 * Run the full campaign simulation comparison (with items vs without items)
 * for all preset builds, printing a unified report.
 */
export function runCampaignSimulation(
  runsPerBatch: number,
  config: CampaignConfig,
  seed: number,
  builds: PlayerBuildConfig[]
): void {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║    SHINOBI WAY - CAMPAIGN SIMULATION (multi-location + gear)║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`  Seed: ${seed}`);
  console.log(`  Builds: ${builds.length}   Locations: ${config.numLocations}   Runs/batch: ${runsPerBatch}`);
  console.log(`  Total runs: ${builds.length * runsPerBatch * 2}  (×2 for with/without items)`);

  const withItemsResults: CampaignAggregate[] = [];
  const withoutItemsResults: CampaignAggregate[] = [];

  for (const build of builds) {
    // ── WITH items: install seed, run, aggregate ──────────────────────────
    installSeededRandom(seed);
    const runsWithItems = runCampaignBatch(build, config, true, runsPerBatch);
    withItemsResults.push(aggregateCampaignRuns(runsWithItems, build, config.numLocations));

    // ── WITHOUT items: SAME seed, same starting PRNG sequence ────────────
    // NOTE: sequences diverge after the first loot/merchant event in the
    // items=ON run. The printed report includes a PRNG-noise caveat.
    installSeededRandom(seed);
    const runsWithoutItems = runCampaignBatch(build, config, false, runsPerBatch);
    withoutItemsResults.push(aggregateCampaignRuns(runsWithoutItems, build, config.numLocations));
  }

  printCampaignReport(withItemsResults, withoutItemsResults, { seed, runsPerBatch, config });
}
