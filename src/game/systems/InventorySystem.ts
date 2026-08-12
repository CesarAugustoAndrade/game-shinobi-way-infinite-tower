/**
 * =============================================================================
 * INVENTORY SYSTEM - Equipment Slots & Bag Management
 * =============================================================================
 *
 * Pure inventory logic extracted from LootSystem.
 * Zero React/DOM dependencies.
 *
 * - Equip / sell
 * - Bag CRUD (add, swap, remove, space checks)
 *
 * =============================================================================
 */

import {
  Item,
  EquipmentSlot,
  Player,
  MAX_BAG_SLOTS,
  SLOT_MAPPING,
} from '../types';
import { BALANCE, MERCHANT } from '../config';

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

  // Same instance must never occupy multiple equipment slots (loot re-claim / race guard).
  const alreadySlot = (Object.values(EquipmentSlot) as EquipmentSlot[]).find(
    slot => player.equipment[slot]?.id === item.id
  );
  if (alreadySlot) {
    if (alreadySlot === slotToUse) {
      // Idempotent re-equip of the same piece into its current slot
      return { player, success: true };
    }
    return {
      player,
      success: false,
      reason: 'Item is already equipped in another slot.',
    };
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

/**
 * Merchant list price before discount (strikethrough original in UI).
 * floor(value * ITEM_PRICE_MULTIPLIER)
 */
export function getMerchantBasePrice(item: { value: number }): number {
  return Math.floor(item.value * MERCHANT.ITEM_PRICE_MULTIPLIER);
}

/**
 * Merchant buy price: floor(value * ITEM_PRICE_MULTIPLIER * (1 - discountPercent/100))
 * discountPercent is 0–100.
 */
export function getMerchantBuyPrice(
  item: { value: number },
  discountPercent: number = 0,
): number {
  return Math.floor(
    item.value * MERCHANT.ITEM_PRICE_MULTIPLIER * (1 - discountPercent / 100),
  );
}

export const sellItem = (player: Player, item: Item): Player => {
  const val = getSellPrice(item);
  return { ...player, ryo: player.ryo + val };
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
