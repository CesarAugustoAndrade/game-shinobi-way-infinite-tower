/**
 * =============================================================================
 * CRAFT SYSTEM - TFT-Style Component Synthesis & Artifact Upgrades
 * =============================================================================
 *
 * Pure crafting logic extracted from LootSystem.
 * Zero React/DOM dependencies.
 *
 * ## CRAFT PATHS
 * - 2× BROKEN same componentId → COMMON component (upgradeComponent)
 * - 2× COMMON with recipe → RARE artifact (synthesize)
 * - 2× RARE same recipe → EPIC artifact (upgradeArtifact)
 * - disassemble: artifact → one prior-tier component
 *
 * =============================================================================
 */

import {
  Item,
  Rarity,
  ItemStatBonus,
  DISASSEMBLE_RETURN_RATE,
  PassiveEffect,
} from '../types';
import { COMPONENT_DEFINITIONS } from '../constants/components';
import { findRecipe } from '../constants/synthesis';
import { CRAFTING_COSTS, LOOT_BALANCE } from '../config';
import { generateUniqueId, chance } from '../utils/rng';
import { FeatureFlags } from '../../config/featureFlags';

/** Generates a random ID for crafted item tracking */
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
 * Result of a crafting operation
 */
export interface CraftResult {
  success: boolean;
  item?: Item;
  cost: number;
  reason?: string;
}

/** Craft path for two bag/equipment items (mirrors handleSynthesize routing). */
export type CraftMode = 'upgrade_broken' | 'synthesize' | 'upgrade_artifact';

export interface CraftCombination {
  mode: CraftMode;
  /** Short label for UI previews (product name). */
  previewName: string;
  actionName: 'Upgraded' | 'Synthesized' | 'Forged';
}

/**
 * Pure check: can these two items be crafted together, and how?
 *
 * Rules:
 * - 2× BROKEN components, same componentId → COMMON component (repair/upgrade)
 * - 2× COMMON components with a recipe → RARE artifact
 * - 2× RARE artifacts, same recipe → EPIC artifact
 */
export const getCraftCombination = (a: Item, b: Item): CraftCombination | null => {
  if (!a || !b || a.id === b.id) return null;

  // 2× Broken same type → Common component
  if (
    a.isComponent &&
    b.isComponent &&
    a.rarity === Rarity.BROKEN &&
    b.rarity === Rarity.BROKEN &&
    a.componentId &&
    a.componentId === b.componentId
  ) {
    const def = COMPONENT_DEFINITIONS[a.componentId];
    return {
      mode: 'upgrade_broken',
      previewName: def?.name ?? a.componentId,
      actionName: 'Upgraded',
    };
  }

  // 2× Common with recipe → Rare artifact
  if (
    a.isComponent &&
    b.isComponent &&
    a.rarity === Rarity.COMMON &&
    b.rarity === Rarity.COMMON &&
    a.componentId &&
    b.componentId
  ) {
    const recipe = findRecipe(a.componentId, b.componentId);
    if (recipe) {
      return {
        mode: 'synthesize',
        previewName: recipe.name,
        actionName: 'Synthesized',
      };
    }
    return null;
  }

  // 2× Rare same artifact → Epic
  if (
    !a.isComponent &&
    !b.isComponent &&
    a.rarity === Rarity.RARE &&
    b.rarity === Rarity.RARE &&
    a.recipe &&
    b.recipe
  ) {
    const recipeA = [...a.recipe].sort().join(',');
    const recipeB = [...b.recipe].sort().join(',');
    if (recipeA === recipeB) {
      return {
        mode: 'upgrade_artifact',
        previewName: a.name,
        actionName: 'Forged',
      };
    }
  }

  return null;
};

/** UI-agnostic craft partner row for bag synthesis preview. */
export interface CraftPreviewOption {
  partner: Item;
  combination: CraftCombination;
  previewName: string;
}

/**
 * Pure check: can `selected` craft with `partner`?
 * Thin wrapper over getCraftCombination for call sites that only need a boolean.
 */
export const canCraftWith = (selected: Item, partner: Item): boolean =>
  getCraftCombination(selected, partner) !== null;

/**
 * List craft partners for a selected bag item against other bag slots.
 * Excludes self by id; only non-null items with a valid craft combination.
 */
export const listCraftOptions = (
  selected: Item,
  bag: (Item | null)[],
): CraftPreviewOption[] => {
  const options: CraftPreviewOption[] = [];
  for (const item of bag) {
    if (item === null || item.id === selected.id) continue;
    const combination = getCraftCombination(selected, item);
    if (!combination) continue;
    options.push({
      partner: item,
      combination,
      previewName: combination.previewName,
    });
  }
  return options;
};

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

  // F1: COMMON component stays +1 primary (not sum of broken rolls)
  const def = COMPONENT_DEFINITIONS[componentA.componentId!];
  const primaryStat = def.primaryStat as keyof ItemStatBonus;

  const result: Item = {
    id: generateId(),
    name: def.name,
    rarity: Rarity.COMMON,
    stats: { [primaryStat]: 1 },
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

  // F1: artifact primaries = each component +1 (+ optional ≤1 thematic primary)
  const primaryKeys = new Set([
    'willpower', 'chakra', 'strength', 'spirit', 'intelligence',
    'calmness', 'speed', 'accuracy', 'dexterity',
  ]);
  const combinedStats: ItemStatBonus = {};
  const defA = COMPONENT_DEFINITIONS[componentA.componentId!];
  const defB = COMPONENT_DEFINITIONS[componentB.componentId!];
  combinedStats[defA.primaryStat] = 1;
  combinedStats[defB.primaryStat] =
    (combinedStats[defB.primaryStat] || 0) + 1;

  if (recipe.bonusStats) {
    let thematicPrimaryUsed = 0;
    for (const key of Object.keys(recipe.bonusStats) as (keyof ItemStatBonus)[]) {
      const val = recipe.bonusStats[key];
      if (val === undefined) continue;
      if (primaryKeys.has(key as string)) {
        if (thematicPrimaryUsed >= 1) continue;
        combinedStats[key] = (combinedStats[key] || 0) + 1;
        thematicPrimaryUsed += 1;
      } else {
        combinedStats[key] = (combinedStats[key] || 0) + val;
      }
    }
  }

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

  // F1: EPIC keeps primary totals (no 75% of 2× balloon); non-primary passives may boost
  const primaryKeys = new Set([
    'willpower', 'chakra', 'strength', 'spirit', 'intelligence',
    'calmness', 'speed', 'accuracy', 'dexterity',
  ]);
  const upgradedStats: ItemStatBonus = {};
  for (const key of Object.keys(artifactA.stats) as (keyof ItemStatBonus)[]) {
    const valA = artifactA.stats[key] || 0;
    const valB = artifactB.stats[key] || 0;
    if (primaryKeys.has(key as string)) {
      // Keep max of the two (already sum-of-components scale), do not double
      upgradedStats[key] = Math.max(valA, valB);
    } else {
      upgradedStats[key] = Math.floor((valA + valB) * LOOT_BALANCE.UPGRADE_STAT_RETENTION);
    }
  }
  for (const key of Object.keys(artifactB.stats) as (keyof ItemStatBonus)[]) {
    if (upgradedStats[key] === undefined) {
      const valB = artifactB.stats[key] || 0;
      upgradedStats[key] = primaryKeys.has(key as string)
        ? valB
        : Math.floor(valB * LOOT_BALANCE.UPGRADE_STAT_RETENTION);
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

  // Sell value may remain a fraction of the artifact; primary is always +1 (F1).
  const returnValue = Math.floor(artifact.value * DISASSEMBLE_RETURN_RATE);

  return {
    id: generateId(),
    name: namePrefix + def.name,
    rarity: returnRarity,
    stats: { [def.primaryStat]: 1 },
    value: returnValue,
    description: def.description,
    isComponent: true,
    componentId: returnedCompId,
    icon: def.icon,
  };
};
