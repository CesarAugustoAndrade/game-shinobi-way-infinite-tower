/**
 * =============================================================================
 * ITEM GENERATION SYSTEM - Pure item / skill loot generation
 * =============================================================================
 *
 * Extracted from LootSystem (Sprint C / SoC). Crafting lives in CraftSystem;
 * bag/equip in InventorySystem. This module owns generation only (skills,
 * components, artifacts, merchant stock, loot-table / theme helpers).
 *
 * =============================================================================
 */

import {
  Item,
  Skill,
  ComponentId,
  RegionLootTheme,
  Rarity,
  ItemStatBonus,
  SkillTier,
  Clan,
  TreasureQuality,
} from '../types';
import { SKILLS, CLAN_FAVORITE_SKILLS } from '../constants';
import { COMPONENT_DEFINITIONS, COMPONENT_DROP_WEIGHTS } from '../constants/components';
import { SYNTHESIS_RECIPES } from '../constants/synthesis';
import { LOOT_BALANCE } from '../config';
import { generateUniqueId, pick, weightedPick, chance } from '../utils/rng';
import { LaunchProperties } from '../../config/featureFlags';

/** Timestamp + entropy — short Math.random ids were collidable under burst loot. */
const generateId = () => generateUniqueId('item');

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

export const generateSkillLoot = (
  enemyTier: string,
  currentFloor: number,
  /** T-114: optional region theme (same bias as generateSkillForFloor) */
  lootTheme?: RegionLootTheme | null,
  /** Optional clan — favorites get higher drop weight; wrong clan-locks filtered */
  clan?: Clan | null,
): Skill | null => {
  // Tier mapping: BASIC → ADVANCED → HIDDEN → FORBIDDEN → KINJUTSU
  let possibleTiers: SkillTier[] = [SkillTier.BASIC];
  if (enemyTier === 'Chunin') possibleTiers = [SkillTier.BASIC, SkillTier.ADVANCED];
  else if (enemyTier === 'Jonin') possibleTiers = [SkillTier.ADVANCED, SkillTier.HIDDEN];
  else if (enemyTier === 'Akatsuki' || enemyTier === 'Kage Level' || enemyTier.includes('S-Rank')) possibleTiers = [SkillTier.HIDDEN, SkillTier.FORBIDDEN];
  else if (enemyTier === 'Guardian') possibleTiers = [SkillTier.FORBIDDEN, SkillTier.KINJUTSU];

  let candidates = Object.values(SKILLS).filter(s => possibleTiers.includes(s.tier));
  if (clan) {
    candidates = candidates.filter(
      (s) => !s.requirements?.clan || s.requirements.clan === clan,
    );
  }
  if (candidates.length === 0) return SKILLS.SHURIKEN;

  const favorites = clan
    ? new Set(CLAN_FAVORITE_SKILLS[clan] ?? [])
    : null;
  const favWeight = LaunchProperties.CLAN_FAVORITE_SKILL_WEIGHT;

  if (!lootTheme && !favorites) return pick(candidates) ?? SKILLS.SHURIKEN;

  const focus = new Set(
    (lootTheme?.equipmentFocus ?? []).map((s) => s.toLowerCase()),
  );
  const preferred = lootTheme?.primaryElement;
  return (
    weightedPick(candidates, (skill) => {
      let w = 1;
      if (preferred && skill.element === preferred) w *= 1.85;
      const scale = String(skill.scalingStat).toLowerCase();
      if (focus.size > 0 && focus.has(scale)) w *= 1.6;
      if (favorites?.has(skill.id)) w *= favWeight;
      return w;
    }) ?? SKILLS.SHURIKEN
  );
};

/**
 * Generate a skill for scroll discovery based on floor depth
 * Higher floors have better chances for higher tier skills
 *
 * T-113: optional lootTheme biases element (Affinity) and scalingStat (Focus)
 * without changing tier gates — same identity as merchant/treasure component bias.
 */
export const generateSkillForFloor = (
  floor: number,
  lootTheme?: RegionLootTheme | null,
  clan?: Clan | null,
): Skill => {
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

  let candidates = Object.values(SKILLS).filter(s => possibleTiers.includes(s.tier));
  if (clan) {
    candidates = candidates.filter(
      (s) => !s.requirements?.clan || s.requirements.clan === clan,
    );
  }
  if (candidates.length === 0) return SKILLS.SHURIKEN;

  const favorites = clan
    ? new Set(CLAN_FAVORITE_SKILLS[clan] ?? [])
    : null;
  const favWeight = LaunchProperties.CLAN_FAVORITE_SKILL_WEIGHT;

  if (!lootTheme && !favorites) return pick(candidates) ?? SKILLS.SHURIKEN;

  const focus = new Set(
    (lootTheme?.equipmentFocus ?? []).map((s) => s.toLowerCase()),
  );
  const preferred = lootTheme?.primaryElement;
  const picked = weightedPick(candidates, (skill) => {
    let w = 1;
    // Affinity: matching skill element (e.g. Waves → Water)
    if (preferred && skill.element === preferred) w *= 1.85;
    // Focus: scaling stat in region equipmentFocus (e.g. Speed)
    const scale = String(skill.scalingStat).toLowerCase();
    if (focus.size > 0 && focus.has(scale)) w *= 1.6;
    if (favorites?.has(skill.id)) w *= favWeight;
    return w;
  });
  return picked ?? SKILLS.SHURIKEN;
};

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
 * Equipment Focus system removed — returns empty object.
 */
export function equipmentFocusWeightMultipliers(
  _equipmentFocus?: string[] | null,
): Partial<Record<ComponentId, number>> {
  return {};
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

  // F1: components always grant +1 primary (no floor/quality mult on primaries).
  // Rarity still affects sell value and craft tier only.
  void currentFloor;
  void _difficulty;
  const statValue = 1;
  const sell = Math.max(5, Math.floor(8 + currentFloor));

  return {
    id: generateId(),
    name: `Broken ${def.name}`,
    rarity: Rarity.BROKEN,
    stats: { [def.primaryStat]: statValue },
    value: sell,
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

  // F1: common component = +1 primary flat
  void difficulty;
  const statValue = 1;
  const sell = Math.max(10, Math.floor(15 + currentFloor * 2));

  return {
    id: generateId(),
    name: def.name,
    rarity: Rarity.COMMON,
    stats: { [def.primaryStat]: statValue },
    value: sell,
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
      // F1: rare is sell/cosmetic tier; primary stays +1
      const item = generateComponent(currentFloor, difficulty, lootTable, lootTheme);
      item.rarity = Rarity.RARE;
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

  // F1: each component contributes +1 primary; artifact = sum + ≤1 thematic primary
  void difficulty;
  const statValueA = 1;
  const statValueB = 1;

  const combinedStats: ItemStatBonus = {
    [defA.primaryStat]: statValueA,
    [defB.primaryStat]:
      defA.primaryStat === defB.primaryStat ? statValueA + statValueB : statValueB,
  };

  // Add recipe bonus stats — primary keys capped at +1 thematic total
  if (recipe.bonusStats) {
    let thematicPrimaryUsed = 0;
    const primaryKeys = new Set([
      'willpower', 'chakra', 'strength', 'spirit', 'intelligence',
      'calmness', 'speed', 'accuracy', 'dexterity',
    ]);
    for (const [key, val] of Object.entries(recipe.bonusStats)) {
      if (val === undefined) continue;
      const k = key as keyof ItemStatBonus;
      if (primaryKeys.has(key)) {
        if (thematicPrimaryUsed >= 1) continue;
        const add = Math.min(1, Math.max(0, Math.round(Number(val) > 0 ? 1 : 0)));
        if (add <= 0) continue;
        combinedStats[k] = (combinedStats[k] || 0) + add;
        thematicPrimaryUsed += add;
      } else {
        // Non-primary passives (crit%, flat def, etc.) kept as authored
        combinedStats[k] = (combinedStats[k] || 0) + val;
      }
    }
  }

  const cappedStats = capStatsToTwo(combinedStats);
  const baseValue = 40 + currentFloor * 5;

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
 * Grant a Hashirama Cell (special event only)
 * This component never drops naturally
 */
export const grantHashiramaCell = (currentFloor: number): Item => {
  const def = COMPONENT_DEFINITIONS[ComponentId.HASHIRAMA_CELL];
  void currentFloor;

  return {
    id: generateId(),
    name: def.name,
    rarity: Rarity.LEGENDARY,
    // F1: +1 primary only — no floor scale, no SLOT×1.5
    stats: { [def.primaryStat]: 1 },
    value: 500,
    description: def.description,
    isComponent: true,
    componentId: ComponentId.HASHIRAMA_CELL,
    icon: def.icon,
  };
};
