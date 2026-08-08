/**
 * =============================================================================
 * LOOT SYSTEM - Facade (item generation + craft + inventory)
 * =============================================================================
 *
 * Stable import path for App/hooks/LocationSystem/simulation.
 *
 * Implementation lives in pure subsystems (Sprint C SoC):
 * - ItemGenerationSystem — skills, components, artifacts, merchant, loot tables
 * - CraftSystem — synthesis, upgrades, disassemble
 * - InventorySystem — equip, sell, bag CRUD
 *
 * Consumers keep importing from this module.
 *
 * =============================================================================
 */

// ---------------------------------------------------------------------------
// Item / skill generation
// ---------------------------------------------------------------------------
export {
  generateSkillLoot,
  generateSkillForFloor,
  parseLootTableKind,
  equipmentFocusWeightMultipliers,
  applyLootThemeGoldMultiplier,
  generateBrokenComponent,
  generateComponent,
  generateComponentByQuality,
  generateLoot,
  generateMerchantItem,
  generateRandomArtifact,
  grantHashiramaCell,
} from './ItemGenerationSystem';
export type { LootTableKind } from './ItemGenerationSystem';

// ---------------------------------------------------------------------------
// Craft (TFT synthesis / upgrades / disassemble)
// ---------------------------------------------------------------------------
export type {
  CraftResult,
  CraftMode,
  CraftCombination,
  CraftPreviewOption,
} from './CraftSystem';
export {
  getCraftCombination,
  canCraftWith,
  listCraftOptions,
  upgradeComponent,
  synthesize,
  upgradeArtifact,
  disassemble,
} from './CraftSystem';

// ---------------------------------------------------------------------------
// Inventory (equip / sell / bag)
// ---------------------------------------------------------------------------
export type { EquipResult } from './InventorySystem';
export {
  equipItem,
  getSellPrice,
  getMerchantBasePrice,
  getMerchantBuyPrice,
  sellItem,
  addToBag,
  addToBagAtIndex,
  swapBagSlots,
  removeFromBag,
  bagHasItem,
  hasBagSpace,
} from './InventorySystem';
