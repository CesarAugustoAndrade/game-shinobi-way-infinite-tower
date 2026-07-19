/**
 * =============================================================================
 * LOOT SYSTEM - Items, Components & Synthesis (TFT-Style Crafting)
 * =============================================================================
 *
 * This system handles all item generation, the component-based crafting system,
 * and equipment management. Inspired by Teamfight Tactics' item combine system.
 *
 * ## ITEM TYPES
 *
 * ### Components (Basic Materials)
 * - 8 component types that drop from enemies
 * - Each has a primary stat bonus and base value
 * - Components are ALWAYS Rarity.COMMON
 *
 * | Component          | Primary Stat   | Drop Weight |
 * |--------------------|----------------|-------------|
 * | Ninja Steel        | Strength       | 20          |
 * | Chakra Crystal     | Chakra         | 18          |
 * | Spirit Core        | Spirit         | 15          |
 * | Wind Essence       | Speed          | 12          |
 * | Thunder Orb        | Dexterity      | 12          |
 * | Spirit Tag         | Calmness       | 10          |
 * | Chakra Pill        | Intelligence   | 8           |
 * | Blessing Token     | Willpower      | 5           |
 * | Hashirama Cell     | Willpower      | 0 (event)   |
 *
 * ### Artifacts (Crafted Items)
 * - Created by combining 2 components via synthesis
 * - Have passive abilities from recipes
 * - ONLY source: Elite Challenges or Synthesis
 * - Maximum 2 stat bonuses (highest values kept)
 * - Craft / elite drops: Rarity.RARE; 2× RARE upgrade → EPIC
 *
 * ## SYNTHESIS SYSTEM
 *
 * - Combine any 2 components to find a matching recipe
 * - Stats from both components are combined
 * - Recipe may add bonus stats
 * - Total stats capped at 2 (highest values preserved)
 *
 * ## DISASSEMBLY
 *
 * - Break artifacts back into component materials
 * - Returns 50% of artifact value (DISASSEMBLE_RETURN_RATE)
 * - Splits value between 2 new components
 *
 * ## SKILL TIERS BY FLOOR
 *
 * | Floor Range | Available Skill Tiers        |
 * |-------------|------------------------------|
 * | 1-3         | BASIC                        |
 * | 4-7         | BASIC, ADVANCED              |
 * | 8-12        | ADVANCED, HIDDEN             |
 * | 13-18       | HIDDEN, FORBIDDEN            |
 * | 19+         | FORBIDDEN, KINJUTSU          |
 *
 * ## EQUIPMENT SLOTS
 *
 * - 4 equipment slots for artifacts/components
 * - Bag: 12 fixed slots for components and artifacts
 * - Swapping equipped items moves old item to bag
 *
 * =============================================================================
 */

import {
  Item,
  Skill,
  EquipmentSlot,
  ComponentId,
  RegionLootTheme,
  Rarity,
  ItemStatBonus,
  SkillTier,
  Player,
  DISASSEMBLE_RETURN_RATE,
  MAX_BAG_SLOTS,
  SLOT_MAPPING,
  TreasureQuality,
  PassiveEffect
} from '../types';
import { SKILLS } from '../constants';
import { COMPONENT_DEFINITIONS, COMPONENT_DROP_WEIGHTS } from '../constants/components';
import { findRecipe, SYNTHESIS_RECIPES } from '../constants/synthesis';
import { DIFFICULTY, CRAFTING_COSTS, BALANCE, LOOT_BALANCE } from '../config';
import { generateId as rngGenerateId, pick, weightedPick, random, chance } from '../utils/rng';
import { FeatureFlags, LaunchProperties } from '../../config/featureFlags';

/** Generates a random 7-character ID for item tracking */
const generateId = () => rngGenerateId();

/**
 * Cap stats to maximum of 2, keeping the highest values
 * Used for artifacts to limit stat bonuses
 */
const capStatsToTwo = (stats: ItemStatBonus): ItemStatBonus => {
  const entries = Object.entries(stats).filter(([, v]) => v !== undefined && v !== 0);

  if (entries.length <= 2) return stats;

  // Sort by value descending, take top 2
  const topTwo = entries
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 2);

  return Object.fromEntries(topTwo) as ItemStatBonus;
};

export const generateSkillLoot = (enemyTier: string, currentFloor: number): Skill | null => {
  // Tier mapping: BASIC → ADVANCED → HIDDEN → FORBIDDEN → KINJUTSU
  let possibleTiers: SkillTier[] = [SkillTier.BASIC];
  if (enemyTier === 'Chunin') possibleTiers = [SkillTier.BASIC, SkillTier.ADVANCED];
  else if (enemyTier === 'Jonin') possibleTiers = [SkillTier.ADVANCED, SkillTier.HIDDEN];
  else if (enemyTier === 'Akatsuki' || enemyTier === 'Kage Level' || enemyTier.includes('S-Rank')) possibleTiers = [SkillTier.HIDDEN, SkillTier.FORBIDDEN];
  else if (enemyTier === 'Guardian') possibleTiers = [SkillTier.FORBIDDEN, SkillTier.KINJUTSU];

  const candidates = Object.values(SKILLS).filter(s => possibleTiers.includes(s.tier));
  if (candidates.length === 0) return SKILLS.SHURIKEN;
  return pick(candidates) ?? SKILLS.SHURIKEN;
};

/**
 * Generate a skill for scroll discovery based on floor depth
 * Higher floors have better chances for higher tier skills
 */
export const generateSkillForFloor = (floor: number): Skill => {
  // Tier mapping: BASIC → ADVANCED → HIDDEN → FORBIDDEN → KINJUTSU
  let possibleTiers: SkillTier[];

  if (floor <= 3) {
    possibleTiers = [SkillTier.BASIC];
  } else if (floor <= 7) {
    possibleTiers = [SkillTier.BASIC, SkillTier.ADVANCED];
  } else if (floor <= 12) {
    possibleTiers = [SkillTier.ADVANCED, SkillTier.HIDDEN];
  } else if (floor <= 18) {
    possibleTiers = [SkillTier.HIDDEN, SkillTier.FORBIDDEN];
  } else {
    possibleTiers = [SkillTier.FORBIDDEN, SkillTier.KINJUTSU];
  }

  const candidates = Object.values(SKILLS).filter(s => possibleTiers.includes(s.tier));
  if (candidates.length === 0) return SKILLS.SHURIKEN;
  return pick(candidates) ?? SKILLS.SHURIKEN;
};

/**
 * Result of attempting to equip an item
 */
export interface EquipResult {
  player: Player;
  success: boolean;
  reason?: string;
  replacedItem?: Item;
}

/**
 * Equip an item to a specific slot or auto-assign based on legacy type.
 * If slot is occupied, the old item moves to component bag.
 * If bag is full and slot is occupied, equip fails.
 *
 * @param player - The player to equip the item on
 * @param item - The item to equip
 * @param targetSlot - Optional specific slot to equip to (overrides auto-assignment)
 * @returns EquipResult with success status and updated player
 */
export const equipItem = (player: Player, item: Item, targetSlot?: EquipmentSlot): EquipResult => {
  let slotToUse: EquipmentSlot;

  if (targetSlot) {
    // Use the explicitly specified slot
    slotToUse = targetSlot;
  } else if (item.type) {
    // Map legacy ItemSlot to EquipmentSlot
    slotToUse = SLOT_MAPPING[item.type];
  } else {
    // For components/artifacts without a type, find first empty slot or use SLOT_1
    const emptySlot = Object.values(EquipmentSlot).find(
      slot => player.equipment[slot] === null
    );
    slotToUse = emptySlot || EquipmentSlot.SLOT_1;
  }

  const existingItem = player.equipment[slotToUse];

  // If slot is occupied, check bag space
  if (existingItem) {
    const emptySlotIndex = player.bag.findIndex(slot => slot === null);
    if (emptySlotIndex === -1) {
      return {
        player,
        success: false,
        reason: 'Bag is full. Sell or discard items first.'
      };
    }

    // Move old item to bag, equip new item
    const newBag = [...player.bag];
    newBag[emptySlotIndex] = existingItem;
    const newEquip = { ...player.equipment, [slotToUse]: item };
    return {
      player: { ...player, equipment: newEquip, bag: newBag },
      success: true,
      replacedItem: existingItem
    };
  }

  // Slot is empty, just equip
  const newEquip = { ...player.equipment, [slotToUse]: item };
  return {
    player: { ...player, equipment: newEquip },
    success: true
  };
};

/** Sell value for an item (BALANCE.SELL_PRICE_RATIO of base value). */
export const getSellPrice = (item: { value: number }): number =>
  Math.floor(item.value * BALANCE.SELL_PRICE_RATIO);

export const sellItem = (player: Player, item: Item): Player => {
  const val = getSellPrice(item);
  return { ...player, ryo: player.ryo + val };
};

// ============================================================================
// SYNTHESIS SYSTEM - Component Generation & Crafting
// ============================================================================

// ============================================================================
// LOOT TABLE PROFILES (T-059)
// ============================================================================

/** Kind parsed from location.lootTable id suffix (e.g. waves_settlement). */
export type LootTableKind =
  | 'settlement'
  | 'wilderness'
  | 'stronghold'
  | 'landmark'
  | 'boss'
  | 'secret'
  | 'default';

/**
 * Map authored lootTable string → kind for weight bias.
 * Exported for unit tests.
 */
export function parseLootTableKind(lootTable?: string | null): LootTableKind {
  if (!lootTable) return 'default';
  const t = lootTable.toLowerCase();
  if (t.includes('settlement')) return 'settlement';
  if (t.includes('wilderness')) return 'wilderness';
  if (t.includes('stronghold')) return 'stronghold';
  if (t.includes('landmark')) return 'landmark';
  if (t.includes('boss')) return 'boss';
  if (t.includes('secret')) return 'secret';
  return 'default';
}

/**
 * Relative weight multipliers per component for a loot table kind.
 * Hashirama stays 0 via base weights.
 */
function lootTableWeightMultipliers(kind: LootTableKind): Partial<Record<ComponentId, number>> {
  switch (kind) {
    case 'settlement':
      return {
        [ComponentId.NINJA_STEEL]: 1.35,
        [ComponentId.CHAKRA_PILL]: 1.35,
        [ComponentId.TACTICAL_SCROLL]: 1.2,
      };
    case 'wilderness':
      return {
        [ComponentId.TRAINING_WEIGHTS]: 1.35,
        [ComponentId.SWIFT_SANDALS]: 1.35,
        [ComponentId.IRON_SAND]: 1.2,
      };
    case 'stronghold':
      return {
        [ComponentId.NINJA_STEEL]: 1.5,
        [ComponentId.IRON_SAND]: 1.4,
        [ComponentId.ANBU_MASK]: 1.25,
      };
    case 'landmark':
      return {
        [ComponentId.SPIRIT_TAG]: 1.4,
        [ComponentId.TACTICAL_SCROLL]: 1.35,
        [ComponentId.CHAKRA_PILL]: 1.15,
      };
    case 'boss':
      return {
        [ComponentId.ANBU_MASK]: 1.5,
        [ComponentId.SPIRIT_TAG]: 1.35,
        [ComponentId.NINJA_STEEL]: 1.25,
      };
    case 'secret':
      return {
        [ComponentId.ANBU_MASK]: 1.6,
        [ComponentId.TACTICAL_SCROLL]: 1.5,
        [ComponentId.SPIRIT_TAG]: 1.3,
      };
    default:
      return {};
  }
}

/**
 * T-061: boost components whose primaryStat is in region lootTheme.equipmentFocus.
 * Multiplier stacks with T-059 lootTable bias.
 */
export function equipmentFocusWeightMultipliers(
  equipmentFocus?: string[] | null,
): Partial<Record<ComponentId, number>> {
  if (!equipmentFocus || equipmentFocus.length === 0) return {};
  const focus = new Set(equipmentFocus.map((s) => s.toLowerCase()));
  const mults: Partial<Record<ComponentId, number>> = {};
  for (const [id, def] of Object.entries(COMPONENT_DEFINITIONS) as [ComponentId, { primaryStat: string }][]) {
    if (id === ComponentId.HASHIRAMA_CELL) continue;
    if (focus.has(def.primaryStat.toLowerCase())) {
      mults[id] = 1.4;
    }
  }
  return mults;
}

/**
 * T-061: apply region goldMultiplier to ryo after wealth/flag scaling.
 */
export function applyLootThemeGoldMultiplier(
  ryo: number,
  lootTheme?: RegionLootTheme | null,
): number {
  if (!lootTheme || !lootTheme.goldMultiplier || lootTheme.goldMultiplier === 1) {
    return ryo;
  }
  return Math.floor(ryo * lootTheme.goldMultiplier);
}

/**
 * Weighted random selection of a component type.
 * Excludes Hashirama Cell (weight 0) from normal drops.
 * T-059: optional lootTable biases weights by location kind.
 * T-061: optional lootTheme.equipmentFocus stacks bias by primaryStat.
 */
function weightedRandomComponent(
  lootTable?: string | null,
  lootTheme?: RegionLootTheme | null,
): ComponentId {
  const tableMults = lootTableWeightMultipliers(parseLootTableKind(lootTable));
  const focusMults = equipmentFocusWeightMultipliers(lootTheme?.equipmentFocus);
  const entries = (Object.entries(COMPONENT_DROP_WEIGHTS) as [ComponentId, number][]).map(
    ([id, weight]) => {
      const m = (tableMults[id] ?? 1) * (focusMults[id] ?? 1);
      return [id, weight * m] as [ComponentId, number];
    },
  );
  return weightedPick(entries, ([, weight]) => weight)?.[0] ?? ComponentId.NINJA_STEEL;
}

/**
 * Generate a BROKEN tier component (lowest quality)
 * These drop from treasure and enemies by default
 */
export const generateBrokenComponent = (
  currentFloor: number,
  _difficulty: number,
  lootTable?: string | null,
  lootTheme?: RegionLootTheme | null,
): Item => {
  const componentId = weightedRandomComponent(lootTable, lootTheme);
  const def = COMPONENT_DEFINITIONS[componentId];

  // Broken items have reduced stats (40-60% of normal)
  const floorScaling = 1 + (currentFloor * DIFFICULTY.FLOOR_SCALING);
  const qualityRoll = LOOT_BALANCE.COMMON_QUALITY_BASE + (random() * LOOT_BALANCE.COMMON_QUALITY_RANGE);
  const baseStatValue = Math.floor(def.baseValue * floorScaling * qualityRoll);
  const statValue = Math.floor(baseStatValue * LaunchProperties.LOOT_MULTIPLIER);

  return {
    id: generateId(),
    name: `Broken ${def.name}`,
    rarity: Rarity.BROKEN,
    stats: { [def.primaryStat]: statValue },
    value: statValue * 8, // Lower value than common
    description: `${def.description} (Damaged - needs repair)`,
    isComponent: true,
    componentId,
    icon: def.icon,
  };
};

/**
 * Generate a COMMON tier component
 * These are created by upgrading 2x Broken components
 */
export const generateComponent = (
  currentFloor: number,
  difficulty: number,
  lootTable?: string | null,
  lootTheme?: RegionLootTheme | null,
): Item => {
  const componentId = weightedRandomComponent(lootTable, lootTheme);
  const def = COMPONENT_DEFINITIONS[componentId];

  // Scale value based on floor (similar to regular item scaling)
  const floorScaling = 1 + (currentFloor * DIFFICULTY.FLOOR_SCALING);
  const qualityRoll = LOOT_BALANCE.RARE_QUALITY_BASE + (random() * LOOT_BALANCE.RARE_QUALITY_RANGE);
  const baseStatValue = Math.floor(def.baseValue * floorScaling * qualityRoll);
  const statValue = Math.floor(baseStatValue * LaunchProperties.LOOT_MULTIPLIER);

  return {
    id: generateId(),
    name: def.name,
    rarity: Rarity.COMMON,
    stats: { [def.primaryStat]: statValue },
    value: statValue * 15,
    description: def.description,
    isComponent: true,
    componentId,
    icon: def.icon,
  };
};

/**
 * Generate a component based on player's treasure quality tier
 */
export const generateComponentByQuality = (
  currentFloor: number,
  difficulty: number,
  quality: TreasureQuality,
  lootTable?: string | null,
  lootTheme?: RegionLootTheme | null,
): Item => {
  switch (quality) {
    case TreasureQuality.BROKEN:
      return generateBrokenComponent(currentFloor, difficulty, lootTable, lootTheme);
    case TreasureQuality.COMMON:
      return generateComponent(currentFloor, difficulty, lootTable, lootTheme);
    case TreasureQuality.RARE: {
      // Rare quality: same as Common but with boosted stats
      const item = generateComponent(currentFloor, difficulty, lootTable, lootTheme);
      item.rarity = Rarity.RARE;
      // Boost stat values
      for (const key of Object.keys(item.stats) as (keyof ItemStatBonus)[]) {
        const val = item.stats[key];
        if (val !== undefined) {
          item.stats[key] = Math.floor(val * LOOT_BALANCE.ENHANCED_STAT_MULT);
        }
      }
      item.value = Math.floor(item.value * LOOT_BALANCE.ENHANCED_VALUE_MULT);
      item.name = `Quality ${item.name}`;
      return item;
    }
    default:
      return generateBrokenComponent(currentFloor, difficulty, lootTable, lootTheme);
  }
};

/**
 * Generate loot from combat - now drops BROKEN components by default
 * Use generateComponentByQuality for treasure quality scaling
 * T-059: optional location lootTable biases component type
 * T-061: optional region lootTheme.equipmentFocus stacks bias
 */
export const generateLoot = (
  currentFloor: number,
  difficulty: number,
  lootTable?: string | null,
  lootTheme?: RegionLootTheme | null,
): Item => {
  return generateBrokenComponent(currentFloor, difficulty, lootTable, lootTheme);
};

/**
 * Generate a merchant shop item.
 * Unlike combat drops (always Broken), shop stock mixes qualities:
 * - Uses player's treasureQuality as a quality floor/ceiling guide
 * - Scales Common/Rare mix by effective floor so mid/late shops feel better
 */
export const generateMerchantItem = (
  currentFloor: number,
  difficulty: number,
  treasureQuality: TreasureQuality = TreasureQuality.BROKEN,
  lootTable?: string | null,
  lootTheme?: RegionLootTheme | null,
): Item => {
  let quality: TreasureQuality;

  if (treasureQuality === TreasureQuality.RARE) {
    // Mostly rare, some common filler
    const rareChance = Math.min(0.85, 0.55 + currentFloor * 0.02);
    quality = chance(rareChance) ? TreasureQuality.RARE : TreasureQuality.COMMON;
  } else if (treasureQuality === TreasureQuality.COMMON) {
    // Common baseline; occasional rare at higher floors
    const rareChance = Math.min(0.35, 0.05 + currentFloor * 0.025);
    quality = chance(rareChance) ? TreasureQuality.RARE : TreasureQuality.COMMON;
  } else {
    // BROKEN treasure quality: mix Broken + Common (never pure Broken shop)
    const commonChance = Math.min(0.8, 0.3 + currentFloor * 0.05);
    quality = chance(commonChance) ? TreasureQuality.COMMON : TreasureQuality.BROKEN;
  }

  return generateComponentByQuality(currentFloor, difficulty, quality, lootTable, lootTheme);
};

/**
 * Generate a random artifact (for rare drops or special events)
 * Picks a random recipe and creates the artifact with floor-scaled stats
 */
export const generateRandomArtifact = (currentFloor: number, difficulty: number): Item => {
  const recipe = pick(SYNTHESIS_RECIPES) ?? SYNTHESIS_RECIPES[0];
  const [compIdA, compIdB] = recipe.recipe;
  const defA = COMPONENT_DEFINITIONS[compIdA];
  const defB = COMPONENT_DEFINITIONS[compIdB];

  // Generate base stats from both components
  const floorScaling = 1 + (currentFloor * DIFFICULTY.FLOOR_SCALING);
  const statValueA = Math.floor(defA.baseValue * floorScaling);
  const statValueB = Math.floor(defB.baseValue * floorScaling);

  // Combine stats
  const combinedStats: ItemStatBonus = {
    [defA.primaryStat]: statValueA,
    [defB.primaryStat]: (defA.primaryStat === defB.primaryStat)
      ? statValueA + statValueB
      : statValueB,
  };

  // Add recipe bonus stats
  if (recipe.bonusStats) {
    for (const [key, val] of Object.entries(recipe.bonusStats)) {
      if (val !== undefined) {
        combinedStats[key as keyof ItemStatBonus] =
          (combinedStats[key as keyof ItemStatBonus] || 0) + val;
      }
    }
  }

  // Cap to maximum 2 stat bonuses
  const cappedStats = capStatsToTwo(combinedStats);

  const baseValue = (statValueA + statValueB) * 15;

  return {
    id: generateId(),
    name: recipe.name,
    // RARE matches craft-path synthesize(); EPIC requires upgrading 2× RARE
    rarity: Rarity.RARE,
    stats: cappedStats,
    value: baseValue * 2, // Artifacts are worth more
    description: recipe.description,
    isComponent: false,
    recipe: recipe.recipe,
    passive: recipe.passive,
    icon: recipe.icon,
  };
};

/**
 * Result of a crafting operation
 */
export interface CraftResult {
  success: boolean;
  item?: Item;
  cost: number;
  reason?: string;
}

/**
 * Upgrade two BROKEN components of the same type into one COMMON component
 * Cost: 100 + floor×15
 */
export const upgradeComponent = (
  componentA: Item,
  componentB: Item,
  floor: number
): CraftResult => {
  // Validation
  if (!componentA.isComponent || !componentB.isComponent) {
    return { success: false, cost: 0, reason: 'Both items must be components' };
  }

  if (componentA.rarity !== Rarity.BROKEN || componentB.rarity !== Rarity.BROKEN) {
    return { success: false, cost: 0, reason: 'Both components must be BROKEN tier' };
  }

  if (componentA.componentId !== componentB.componentId) {
    return { success: false, cost: 0, reason: 'Components must be the same type' };
  }

  // Calculate cost
  const cost = CRAFTING_COSTS.UPGRADE_BROKEN_BASE + (floor * CRAFTING_COSTS.UPGRADE_BROKEN_PER_FLOOR);

  // Create COMMON component with combined stats
  const def = COMPONENT_DEFINITIONS[componentA.componentId!];
  const primaryStat = def.primaryStat as keyof ItemStatBonus;
  const combinedStatValue = (componentA.stats[primaryStat] || 0) + (componentB.stats[primaryStat] || 0);

  const result: Item = {
    id: generateId(),
    name: def.name,
    rarity: Rarity.COMMON,
    stats: { [primaryStat]: combinedStatValue },
    value: Math.floor((componentA.value + componentB.value) * LOOT_BALANCE.SYNTHESIS_VALUE_MULT),
    description: def.description,
    isComponent: true,
    componentId: componentA.componentId,
    icon: def.icon,
  };

  return { success: true, item: result, cost };
};

/**
 * Synthesize two COMMON components into a RARE artifact
 * Components can be the same or different types (must have a recipe)
 * Cost: 200 + floor×30
 */
export const synthesize = (
  componentA: Item,
  componentB: Item,
  floor: number
): CraftResult => {
  // Check feature flag first
  if (!FeatureFlags.ENABLE_SYNTHESIS) {
    return { success: false, cost: 0, reason: 'Synthesis is disabled' };
  }

  // Both items must be components
  if (!componentA.isComponent || !componentB.isComponent) {
    return { success: false, cost: 0, reason: 'Both items must be components' };
  }
  if (!componentA.componentId || !componentB.componentId) {
    return { success: false, cost: 0, reason: 'Invalid components' };
  }

  // Components must be COMMON tier
  if (componentA.rarity !== Rarity.COMMON || componentB.rarity !== Rarity.COMMON) {
    return { success: false, cost: 0, reason: 'Both components must be COMMON tier' };
  }

  // Find matching recipe
  const recipe = findRecipe(componentA.componentId, componentB.componentId);
  if (!recipe) {
    return { success: false, cost: 0, reason: 'No recipe found for this combination' };
  }

  // Calculate cost
  const cost = CRAFTING_COSTS.SYNTHESIZE_BASE + (floor * CRAFTING_COSTS.SYNTHESIZE_PER_FLOOR);

  // Combine stats from both components
  const combinedStats: ItemStatBonus = {};

  // Add stats from component A
  for (const key of Object.keys(componentA.stats) as (keyof ItemStatBonus)[]) {
    combinedStats[key] = (combinedStats[key] || 0) + (componentA.stats[key] || 0);
  }

  // Add stats from component B
  for (const key of Object.keys(componentB.stats) as (keyof ItemStatBonus)[]) {
    combinedStats[key] = (combinedStats[key] || 0) + (componentB.stats[key] || 0);
  }

  // Add recipe bonus stats
  if (recipe.bonusStats) {
    for (const key of Object.keys(recipe.bonusStats) as (keyof ItemStatBonus)[]) {
      const val = recipe.bonusStats[key];
      if (val !== undefined) {
        combinedStats[key] = (combinedStats[key] || 0) + val;
      }
    }
  }

  // Cap to maximum 2 stat bonuses
  const cappedStats = capStatsToTwo(combinedStats);

  const artifact: Item = {
    id: generateId(),
    name: recipe.name,
    rarity: Rarity.RARE, // Synthesized artifacts are now RARE
    stats: cappedStats,
    value: (componentA.value + componentB.value) * 2,
    description: recipe.description,
    isComponent: false,
    recipe: recipe.recipe,
    passive: recipe.passive,
    icon: recipe.icon,
  };

  return { success: true, item: artifact, cost };
};

/**
 * Boost a passive effect's value by 1.5× for Epic tier
 */
const boostPassive = (passive?: PassiveEffect): PassiveEffect | undefined => {
  if (!passive) return undefined;
  return {
    ...passive,
    value: passive.value !== undefined ? Math.floor(passive.value * LOOT_BALANCE.ENHANCED_VALUE_MULT) : undefined,
  };
};

/**
 * Upgrade two identical RARE artifacts into one EPIC artifact
 * The Epic artifact has the same passive but with 1.5× values
 * Cost: 400 + floor×75
 */
export const upgradeArtifact = (
  artifactA: Item,
  artifactB: Item,
  floor: number
): CraftResult => {
  // Validation: must be artifacts (not components)
  if (artifactA.isComponent || artifactB.isComponent) {
    return { success: false, cost: 0, reason: 'Items must be artifacts, not components' };
  }

  // Must be RARE tier
  if (artifactA.rarity !== Rarity.RARE || artifactB.rarity !== Rarity.RARE) {
    return { success: false, cost: 0, reason: 'Both artifacts must be RARE tier' };
  }

  // Must be the same artifact type (same recipe)
  if (!artifactA.recipe || !artifactB.recipe) {
    return { success: false, cost: 0, reason: 'Invalid artifacts' };
  }

  const recipeA = [...artifactA.recipe].sort().join(',');
  const recipeB = [...artifactB.recipe].sort().join(',');
  if (recipeA !== recipeB) {
    return { success: false, cost: 0, reason: 'Artifacts must be the same type' };
  }

  // Calculate cost
  const cost = CRAFTING_COSTS.UPGRADE_ARTIFACT_BASE + (floor * CRAFTING_COSTS.UPGRADE_ARTIFACT_PER_FLOOR);

  // Create EPIC artifact with boosted stats (retain % of combined)
  const upgradedStats: ItemStatBonus = {};
  for (const key of Object.keys(artifactA.stats) as (keyof ItemStatBonus)[]) {
    const valA = artifactA.stats[key] || 0;
    const valB = artifactB.stats[key] || 0;
    upgradedStats[key] = Math.floor((valA + valB) * LOOT_BALANCE.UPGRADE_STAT_RETENTION);
  }
  // Also include any stats only in B
  for (const key of Object.keys(artifactB.stats) as (keyof ItemStatBonus)[]) {
    if (upgradedStats[key] === undefined) {
      const valB = artifactB.stats[key] || 0;
      upgradedStats[key] = Math.floor(valB * LOOT_BALANCE.UPGRADE_STAT_RETENTION);
    }
  }

  const artifact: Item = {
    id: generateId(),
    name: artifactA.name, // Same name
    rarity: Rarity.EPIC,
    stats: upgradedStats,
    value: Math.floor((artifactA.value + artifactB.value) * LOOT_BALANCE.SYNTHESIS_VALUE_MULT),
    description: artifactA.description,
    isComponent: false,
    recipe: artifactA.recipe,
    passive: boostPassive(artifactA.passive),
    icon: artifactA.icon,
  };

  return { success: true, item: artifact, cost };
};

/**
 * Disassemble an artifact back into ONE random component of the previous tier
 * - EPIC artifact → returns 1 RARE component
 * - RARE artifact → returns 1 COMMON component
 * Returns null if the item cannot be disassembled
 */
export const disassemble = (artifact: Item): Item | null => {
  // Can only disassemble artifacts (not components or legacy items)
  if (artifact.isComponent || !artifact.recipe) return null;

  const [compIdA, compIdB] = artifact.recipe;
  // Randomly pick one of the two component types
  const returnedCompId = chance(0.5) ? compIdA : compIdB;
  const def = COMPONENT_DEFINITIONS[returnedCompId];

  // Determine return tier based on artifact tier
  let returnRarity: Rarity;
  let namePrefix = '';

  if (artifact.rarity === Rarity.EPIC) {
    // Epic → Rare component (but components can't be rare, so return Common)
    returnRarity = Rarity.COMMON;
  } else if (artifact.rarity === Rarity.RARE) {
    // Rare → Common component
    returnRarity = Rarity.COMMON;
  } else {
    // Fallback for legacy items
    returnRarity = Rarity.BROKEN;
    namePrefix = 'Broken ';
  }

  // Calculate return value (50% of artifact value)
  const returnValue = Math.floor(artifact.value * DISASSEMBLE_RETURN_RATE);

  // Estimate stat value from returned value
  const statValue = Math.floor(returnValue / 15);

  return {
    id: generateId(),
    name: namePrefix + def.name,
    rarity: returnRarity,
    stats: { [def.primaryStat]: statValue },
    value: returnValue,
    description: def.description,
    isComponent: true,
    componentId: returnedCompId,
    icon: def.icon,
  };
};

/**
 * Grant a Hashirama Cell (special event only)
 * This component never drops naturally
 */
export const grantHashiramaCell = (currentFloor: number): Item => {
  const def = COMPONENT_DEFINITIONS[ComponentId.HASHIRAMA_CELL];
  const floorScaling = 1 + (currentFloor * DIFFICULTY.FLOOR_SCALING);

  return {
    id: generateId(),
    name: def.name,
    rarity: Rarity.LEGENDARY, // Special rarity for this rare component
    stats: { [def.primaryStat]: Math.floor(def.baseValue * floorScaling * BALANCE.PRIMARY_SLOT_MULTIPLIER) },
    value: 500, // High base value
    description: def.description,
    isComponent: true,
    componentId: ComponentId.HASHIRAMA_CELL,
    icon: def.icon,
  };
};

/**
 * Add an item to the player's bag at the first available slot
 * Returns updated player or null if bag is full
 */
export const addToBag = (player: Player, item: Item): Player | null => {
  const emptyIndex = player.bag.findIndex(slot => slot === null);
  if (emptyIndex === -1) {
    return null; // Bag is full
  }
  const newBag = [...player.bag];
  newBag[emptyIndex] = item;
  return { ...player, bag: newBag };
};

/**
 * Add an item to a specific bag slot
 * Returns updated player or null if slot is occupied or invalid
 */
export const addToBagAtIndex = (player: Player, item: Item, index: number): Player | null => {
  if (index < 0 || index >= MAX_BAG_SLOTS) return null;
  if (player.bag[index] !== null) return null;
  const newBag = [...player.bag];
  newBag[index] = item;
  return { ...player, bag: newBag };
};

/**
 * Swap two bag slots (for drag-and-drop reordering)
 */
export const swapBagSlots = (player: Player, indexA: number, indexB: number): Player => {
  const newBag = [...player.bag];
  [newBag[indexA], newBag[indexB]] = [newBag[indexB], newBag[indexA]];
  return { ...player, bag: newBag };
};

/**
 * Remove an item from the player's bag by ID (sets slot to null)
 */
export const removeFromBag = (player: Player, itemId: string): Player => {
  return {
    ...player,
    bag: player.bag.map(item => item?.id === itemId ? null : item),
  };
};

/**
 * Check if the bag still contains an item with the given id
 * (guards double-sell / double-equip / double-craft races)
 */
export const bagHasItem = (player: Player, itemId: string): boolean => {
  return player.bag.some(slot => slot?.id === itemId);
};

/**
 * Check if the player's bag has at least one empty slot
 */
export const hasBagSpace = (player: Player): boolean => {
  return player.bag.some(slot => slot === null);
};
