import { useCallback, useRef } from 'react';
import {
  Player, Item, Skill, EquipmentSlot, Rarity, LogEntry, MAX_BAG_SLOTS
} from '../game/types';
import {
  equipItem as equipItemFn,
  getSellPrice,
  addToBag,
  bagHasItem,
  synthesize,
  disassemble,
  upgradeComponent,
  upgradeArtifact,
  getCraftCombination,
} from '../game/systems/LootSystem';
import { dangerToFloor } from '../game/systems/ScalingSystem';

/**
 * Apply craft/upgrade on latest prev bag: both materials must be present,
 * product must fit, then charge ryo. Abort with no charge if any check fails.
 */
function applyCraftToPlayer(
  prev: Player,
  materialA: Item,
  materialB: Item,
  product: Item,
  cost: number
): { player: Player; ok: true } | { player: Player; ok: false; reason: 'missing' | 'ryo' | 'space' } {
  if (!bagHasItem(prev, materialA.id) || !bagHasItem(prev, materialB.id)) {
    return { player: prev, ok: false, reason: 'missing' };
  }
  if (prev.ryo < cost) {
    return { player: prev, ok: false, reason: 'ryo' };
  }
  const newBag = prev.bag.map(c =>
    c?.id === materialA.id || c?.id === materialB.id ? null : c
  );
  const emptyIndex = newBag.findIndex(slot => slot === null);
  if (emptyIndex === -1) {
    return { player: prev, ok: false, reason: 'space' };
  }
  newBag[emptyIndex] = product;
  return {
    player: { ...prev, bag: newBag, ryo: prev.ryo - cost },
    ok: true
  };
}

export interface InventoryState {
  player: Player | null;
  currentDangerLevel: number;
  currentBaseDifficulty: number;
  difficulty: number;
  isProcessingLoot: boolean;
  /** LOOT screen drops — used so equip/sell/store don't leave until all claimed */
  droppedItems: Item[];
  droppedSkill: Skill | null;
}

export interface InventorySetters {
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  setIsProcessingLoot: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedComponent: React.Dispatch<React.SetStateAction<Item | null>>;
  setDroppedItems: React.Dispatch<React.SetStateAction<Item[]>>;
}

export interface InventoryDeps {
  addLog: (text: string, type?: LogEntry['type']) => void;
  returnToMap: () => void;
}

export function useInventoryHandlers(
  state: InventoryState,
  setters: InventorySetters,
  deps: InventoryDeps
) {
  const {
    player,
    currentDangerLevel,
    currentBaseDifficulty,
    isProcessingLoot,
    droppedItems,
    droppedSkill,
  } = state;
  const { setPlayer, setIsProcessingLoot, setSelectedComponent, setDroppedItems } = setters;
  const { addLog, returnToMap } = deps;

  /** Sync mutex — isProcessingLoot lags one frame; double-click sold for double ryo. */
  const lootClaimLockRef = useRef(false);
  /**
   * Closure `droppedSkill` can be stale if Learn ran while settling a claim
   * (skill already consumed → empty LOOT would soft-stick without Step onward).
   */
  const droppedSkillRef = useRef(droppedSkill);
  droppedSkillRef.current = droppedSkill;
  /**
   * Sync pile mirror. Filtered by claimedLootIds so a re-render with stale
   * droppedItems cannot resurrect a spoil already taken (infinite equip/store).
   */
  const claimedLootIdsRef = useRef<Set<string>>(new Set());
  const droppedItemsRef = useRef(droppedItems);
  // Keep mirror in sync but never re-surface already-claimed ids
  droppedItemsRef.current = droppedItems.filter(
    (i) => !claimedLootIdsRef.current.has(i.id),
  );
  /**
   * Bag / equipment mutations that destroy an instance (sell, craft materials).
   * bagHasItem alone re-reads lastRendered until commit — same-tick double click
   * sold twice or crafted twice (double ryo / double charge). Claim ids before
   * functional write (parity LOOT). Unique instance ids stay claimed after success.
   */
  const claimedInventoryItemIdsRef = useRef(new Set<string>());

  const claimInventoryItemIds = (ids: string[]): boolean => {
    if (ids.some((id) => claimedInventoryItemIdsRef.current.has(id))) return false;
    for (const id of ids) claimedInventoryItemIdsRef.current.add(id);
    return true;
  };
  const releaseInventoryItemIds = (ids: string[]) => {
    for (const id of ids) claimedInventoryItemIdsRef.current.delete(id);
  };
  /**
   * Equipment panel actions (unequip / disassemble / synth-from-equip).
   * Slot id checks alone re-read lastRendered — same-tick double unequip/disassemble
   * cloned the instance into the bag (item dupe / double component). Key = slot+itemId;
   * free on fail only (success consumes that equip occupancy).
   */
  const claimedEquipActionKeysRef = useRef(new Set<string>());
  const equipActionKey = (slot: EquipmentSlot, itemId: string) => `${slot}::${itemId}`;
  const claimEquipAction = (slot: EquipmentSlot, itemId: string): boolean => {
    const key = equipActionKey(slot, itemId);
    if (claimedEquipActionKeysRef.current.has(key)) return false;
    claimedEquipActionKeysRef.current.add(key);
    return true;
  };
  const releaseEquipAction = (slot: EquipmentSlot, itemId: string) => {
    claimedEquipActionKeysRef.current.delete(equipActionKey(slot, itemId));
  };
  /** Clear stale occupancy claims when a new piece is worn on the slot (re-unequip allowed). */
  const releaseEquipActionsForSlot = (slot: EquipmentSlot) => {
    const prefix = `${slot}::`;
    for (const key of [...claimedEquipActionKeysRef.current]) {
      if (key.startsWith(prefix)) claimedEquipActionKeysRef.current.delete(key);
    }
  };
  /**
   * One-shot LOOT exit — Leave All, Learn (empty pile), and delayed finish claim
   * can all call returnToMap in the same breath (confirm abandon + Learn, or
   * finish settle + Leave). Double returnToMap re-chains activities / double
   * floor-complete meta.
   */
  const lootExitLockRef = useRef(false);

  /** Re-arm when LOOT scene opens for a new pile. */
  const rearmLootExit = useCallback(() => {
    lootExitLockRef.current = false;
    claimedLootIdsRef.current.clear();
    lootClaimLockRef.current = false;
    // Prior visit must not leave isProcessingLoot true (blocks merchant buy / LOOT claim)
    setIsProcessingLoot(false);
  }, [setIsProcessingLoot]);

  /** Leave LOOT at most once per visit. */
  const exitLootOnce = useCallback(() => {
    if (lootExitLockRef.current) return;
    lootExitLockRef.current = true;
    lootClaimLockRef.current = false;
    setIsProcessingLoot(false);
    returnToMap();
  }, [returnToMap, setIsProcessingLoot]);

  /**
   * Atomically claim a spoil: mark id claimed + remove from pile.
   * Returns remaining unclaimed count, or null if already taken / missing.
   */
  const claimFromLootPile = useCallback((itemId: string): number | null => {
    if (claimedLootIdsRef.current.has(itemId)) return null;
    const prev = droppedItemsRef.current;
    if (!prev.some((i) => i.id === itemId)) return null;
    claimedLootIdsRef.current.add(itemId);
    const next = prev.filter((i) => i.id !== itemId);
    droppedItemsRef.current = next;
    // Strip any stale copies of this id from React state too
    setDroppedItems((state) =>
      state.filter((i) => i.id !== itemId && !claimedLootIdsRef.current.has(i.id)),
    );
    return next.length;
  }, [setDroppedItems]);

  /** Undo claim when equip/store fails after pull. */
  const restoreToLootPile = useCallback((item: Item) => {
    claimedLootIdsRef.current.delete(item.id);
    if (droppedItemsRef.current.some((i) => i.id === item.id)) return;
    const next = [...droppedItemsRef.current, item];
    droppedItemsRef.current = next;
    setDroppedItems((state) =>
      state.some((i) => i.id === item.id) ? state : [...state, item],
    );
  }, [setDroppedItems]);

  /**
   * Release loot mutex; leave LOOT when pile+skill empty.
   * Defer exit one tick so setPlayer(equipment) is not racing returnToMap.
   */
  const settleLootClaim = useCallback((remainingAfterClaim: number) => {
    setIsProcessingLoot(false);
    lootClaimLockRef.current = false;
    if (remainingAfterClaim === 0 && !droppedSkillRef.current) {
      // Defer: equip/bag writes must land before LOOT teardown / activity chain
      setTimeout(() => exitLootOnce(), 0);
    }
  }, [setIsProcessingLoot, exitLootOnce]);

  const equipItem = useCallback((item: Item) => {
    if (!player || isProcessingLoot || lootClaimLockRef.current) return;

    lootClaimLockRef.current = true;
    setIsProcessingLoot(true);

    // Claim FIRST — one spoil, one action (blocks infinite equip/store)
    const remainingAfter = claimFromLootPile(item.id);
    if (remainingAfter === null) {
      lootClaimLockRef.current = false;
      setIsProcessingLoot(false);
      return;
    }

    type EquipOut = 'ok' | 'fail' | 'noprev';
    const box: { o: EquipOut; reason?: string; replacedName?: string } = { o: 'noprev' };

    setPlayer(prev => {
      if (!prev) {
        box.o = 'noprev';
        return null;
      }
      const result = equipItemFn(prev, item);
      if (!result.success) {
        box.o = 'fail';
        box.reason = result.reason;
        return prev;
      }
      box.o = 'ok';
      box.replacedName = result.replacedItem?.name;
      return result.player;
    });

    if (box.o !== 'ok') {
      restoreToLootPile(item);
      lootClaimLockRef.current = false;
      setIsProcessingLoot(false);
      if (box.o === 'fail') {
        addLog(box.reason || 'Cannot equip item.', 'danger');
      }
      return;
    }

    if (box.replacedName) {
      addLog(`Equipped ${item.name}. ${box.replacedName} moved to bag.`, 'loot');
    } else {
      addLog(`Equipped ${item.name}.`, 'loot');
    }
    settleLootClaim(remainingAfter);
  }, [player, isProcessingLoot, setPlayer, addLog, setIsProcessingLoot, claimFromLootPile, restoreToLootPile, settleLootClaim]);

  const sellItem = useCallback((item: Item) => {
    if (!player || isProcessingLoot || lootClaimLockRef.current) return;

    lootClaimLockRef.current = true;
    setIsProcessingLoot(true);

    const remainingAfter = claimFromLootPile(item.id);
    if (remainingAfter === null) {
      lootClaimLockRef.current = false;
      setIsProcessingLoot(false);
      return;
    }

    const price = getSellPrice(item);
    // Functional grant — restore spoil if player vanished mid-claim (parity equip/store)
    let granted = false;
    setPlayer(prev => {
      if (!prev) return null;
      granted = true;
      // Loot sell: grant ryo only (item is not in bag yet)
      return { ...prev, ryo: prev.ryo + price };
    });
    if (!granted) {
      restoreToLootPile(item);
      lootClaimLockRef.current = false;
      setIsProcessingLoot(false);
      return;
    }
    addLog(`Sold ${item.name} for ${price} Ryō.`, 'loot');
    settleLootClaim(remainingAfter);
  }, [player, isProcessingLoot, setPlayer, addLog, setIsProcessingLoot, claimFromLootPile, restoreToLootPile, settleLootClaim]);

  // Store item in bag instead of equipping
  const storeToBag = useCallback((item: Item) => {
    if (!player || isProcessingLoot || lootClaimLockRef.current) return;

    type StoreOut = 'ok' | 'full' | 'noprev';
    const box: { o: StoreOut } = { o: 'noprev' };

    lootClaimLockRef.current = true;
    setIsProcessingLoot(true);

    // Claim FIRST — one spoil cannot fill the bag repeatedly
    const remainingAfter = claimFromLootPile(item.id);
    if (remainingAfter === null) {
      lootClaimLockRef.current = false;
      setIsProcessingLoot(false);
      return;
    }

    setPlayer(prev => {
      if (!prev) {
        box.o = 'noprev';
        return null;
      }
      const result = addToBag(prev, item);
      if (!result) {
        box.o = 'full';
        return prev;
      }
      box.o = 'ok';
      return result;
    });

    if (box.o !== 'ok') {
      restoreToLootPile(item);
      lootClaimLockRef.current = false;
      setIsProcessingLoot(false);
      if (box.o === 'full') {
        addLog('Bag is full!', 'danger');
      }
      return;
    }

    addLog(`Stored ${item.name} in bag.`, 'loot');
    settleLootClaim(remainingAfter);
  }, [player, isProcessingLoot, setPlayer, addLog, setIsProcessingLoot, claimFromLootPile, restoreToLootPile, settleLootClaim]);

  /**
   * Sell component from bag.
   * T-058: returns sell price on success for UI toast (null on fail).
   * Claim id first — bagHasItem alone is not enough for same-tick double sell.
   * Only grants ryo if the item is still present on the latest prev bag.
   */
  const sellComponent = useCallback((item: Item): number | null => {
    if (!claimInventoryItemIds([item.id])) return null;

    let soldValue: number | null = null;
    setPlayer(prev => {
      if (!prev) return null;
      if (!bagHasItem(prev, item.id)) return prev;
      const value = getSellPrice(item);
      soldValue = value;
      return {
        ...prev,
        ryo: prev.ryo + value,
        bag: prev.bag.map(c => c?.id === item.id ? null : c)
      };
    });
    if (soldValue === null) {
      releaseInventoryItemIds([item.id]);
      return null;
    }
    addLog(`Sold ${item.name} for ${soldValue} Ryō.`, 'loot');
    setSelectedComponent(null);
    return soldValue;
  }, [setPlayer, addLog, setSelectedComponent]);

  /**
   * Equip item from bag.
   * T-058: returns equip summary for toast (null on fail).
   * Requires bag membership on latest prev; aborts if item is already gone.
   */
  const equipFromBag = useCallback((item: Item): { replacedName?: string } | null => {
    type Outcome = {
      kind: 'missing' | 'fail' | 'ok';
      reason?: string;
      summary?: { replacedName?: string };
      equippedSlot?: EquipmentSlot;
    };
    // Mutable box so TS control-flow sees assignments inside setPlayer updater
    const box: { outcome: Outcome } = { outcome: { kind: 'missing' } };

    setPlayer(prev => {
      if (!prev) return null;
      if (!bagHasItem(prev, item.id)) {
        box.outcome = { kind: 'missing' };
        return prev;
      }
      // Item already worn (stale bag click / duplicate id) — do not multi-slot
      if ((Object.values(EquipmentSlot) as EquipmentSlot[]).some(
        s => prev.equipment[s]?.id === item.id
      )) {
        box.outcome = { kind: 'fail', reason: 'Item is already equipped.' };
        return prev;
      }
      const playerWithoutItem = {
        ...prev,
        bag: prev.bag.map(c => c?.id === item.id ? null : c)
      };
      const result = equipItemFn(playerWithoutItem, item);
      if (!result.success) {
        box.outcome = { kind: 'fail', reason: result.reason };
        return prev;
      }
      // Resolve slot for occupancy re-arm (so a later unequip of this piece is allowed)
      let equippedSlot: EquipmentSlot | undefined;
      for (const s of Object.values(EquipmentSlot) as EquipmentSlot[]) {
        if (result.player.equipment[s]?.id === item.id) {
          equippedSlot = s;
          break;
        }
      }
      box.outcome = {
        kind: 'ok',
        summary: result.replacedItem ? { replacedName: result.replacedItem.name } : {},
        equippedSlot,
      };
      return result.player;
    });

    const outcome = box.outcome;
    if (outcome.kind === 'missing') {
      addLog('Item no longer in bag.', 'danger');
      return null;
    }
    if (outcome.kind === 'fail') {
      addLog(outcome.reason || 'Cannot equip item.', 'danger');
      return null;
    }
    if (outcome.equippedSlot) {
      releaseEquipActionsForSlot(outcome.equippedSlot);
    }
    if (outcome.summary?.replacedName) {
      addLog(`Equipped ${item.name}. ${outcome.summary.replacedName} moved to bag.`, 'loot');
    } else {
      addLog(`Equipped ${item.name} from bag.`, 'loot');
    }
    setSelectedComponent(null);
    return outcome.summary ?? {};
  }, [setPlayer, addLog, setSelectedComponent]);

  /**
   * Smart craft handler - determines which operation based on item rarities.
   * T-032: returns the crafted Item on success so UI can show a reveal panel.
   * Verifies both materials still in bag; places product or aborts without charging.
   *
   * Craft ladder:
   * - 2× Broken (same component) → Common component
   * - 2× Common (recipe) → Rare artifact
   * - 2× Rare artifact (same recipe) → Epic artifact
   */
  const handleSynthesize = useCallback((compA: Item, compB: Item): Item | null => {
    if (!player) return null;
    // Claim materials first — same-tick partner double-click re-ran craft (double ryo/product)
    if (!claimInventoryItemIds([compA.id, compB.id])) return null;

    const combo = getCraftCombination(compA, compB);
    if (!combo) {
      releaseInventoryItemIds([compA.id, compB.id]);
      if (
        compA.isComponent &&
        compB.isComponent &&
        compA.rarity === Rarity.BROKEN &&
        compB.rarity === Rarity.BROKEN &&
        compA.componentId !== compB.componentId
      ) {
        addLog('Broken components must match (e.g. two Broken Chakra Pills).', 'danger');
      } else {
        addLog('These items cannot be combined.', 'danger');
      }
      return null;
    }

    const effectiveFloor = dangerToFloor(currentDangerLevel, currentBaseDifficulty);
    let result;
    if (combo.mode === 'upgrade_broken') {
      result = upgradeComponent(compA, compB, effectiveFloor);
    } else if (combo.mode === 'upgrade_artifact') {
      result = upgradeArtifact(compA, compB, effectiveFloor);
    } else {
      result = synthesize(compA, compB, effectiveFloor);
    }
    const actionName = combo.actionName;

    if (!result.success || !result.item) {
      releaseInventoryItemIds([compA.id, compB.id]);
      addLog(result.reason || 'These items cannot be combined.', 'danger');
      return null;
    }

    const product = result.item;
    const cost = result.cost;
    type CraftOutcome = 'ok' | 'missing' | 'ryo' | 'space' | 'noprev';
    const craftBox: { o: CraftOutcome } = { o: 'noprev' };

    setPlayer(prev => {
      if (!prev) {
        craftBox.o = 'noprev';
        return null;
      }
      const applied = applyCraftToPlayer(prev, compA, compB, product, cost);
      if (!applied.ok) {
        craftBox.o = applied.reason;
        return prev;
      }
      craftBox.o = 'ok';
      return applied.player;
    });

    if (craftBox.o !== 'ok') {
      releaseInventoryItemIds([compA.id, compB.id]);
      if (craftBox.o === 'missing') {
        addLog('Materials no longer in bag.', 'danger');
      } else if (craftBox.o === 'ryo') {
        addLog(`Not enough Ryō! Need ${cost} Ryō.`, 'danger');
      } else if (craftBox.o === 'space') {
        addLog('No bag space for crafted item.', 'danger');
      }
      return null;
    }

    // Materials consumed — leave ids claimed (unique instances)
    addLog(`${actionName} ${product.name} for ${cost} Ryō!`, 'gain');
    setSelectedComponent(null);
    return product;
  }, [player, currentDangerLevel, currentBaseDifficulty, setPlayer, addLog, setSelectedComponent]);

  // Upgrade two BROKEN components (same type) into a COMMON component
  const handleUpgradeComponent = useCallback((compA: Item, compB: Item) => {
    if (!player) return;
    if (!claimInventoryItemIds([compA.id, compB.id])) return;

    const effectiveFloor = dangerToFloor(currentDangerLevel, currentBaseDifficulty);
    const result = upgradeComponent(compA, compB, effectiveFloor);
    if (!result.success || !result.item) {
      releaseInventoryItemIds([compA.id, compB.id]);
      addLog(result.reason || 'These components cannot be upgraded.', 'danger');
      return;
    }

    const product = result.item;
    const cost = result.cost;
    type CraftOutcome = 'ok' | 'missing' | 'ryo' | 'space' | 'noprev';
    const craftBox: { o: CraftOutcome } = { o: 'noprev' };

    setPlayer(prev => {
      if (!prev) {
        craftBox.o = 'noprev';
        return null;
      }
      const applied = applyCraftToPlayer(prev, compA, compB, product, cost);
      if (!applied.ok) {
        craftBox.o = applied.reason;
        return prev;
      }
      craftBox.o = 'ok';
      return applied.player;
    });

    if (craftBox.o !== 'ok') {
      releaseInventoryItemIds([compA.id, compB.id]);
      if (craftBox.o === 'missing') {
        addLog('Materials no longer in bag.', 'danger');
      } else if (craftBox.o === 'ryo') {
        addLog(`Not enough Ryō! Need ${cost} Ryō.`, 'danger');
      } else if (craftBox.o === 'space') {
        addLog('No bag space for upgraded item.', 'danger');
      }
      return;
    }

    addLog(`Upgraded to ${product.name} for ${cost} Ryō!`, 'gain');
    setSelectedComponent(null);
  }, [player, currentDangerLevel, currentBaseDifficulty, setPlayer, addLog, setSelectedComponent]);

  // Upgrade two RARE artifacts (same type) into an EPIC artifact
  const handleUpgradeArtifact = useCallback((artifactA: Item, artifactB: Item) => {
    if (!player) return;
    if (!claimInventoryItemIds([artifactA.id, artifactB.id])) return;

    const effectiveFloor = dangerToFloor(currentDangerLevel, currentBaseDifficulty);
    const result = upgradeArtifact(artifactA, artifactB, effectiveFloor);
    if (!result.success || !result.item) {
      releaseInventoryItemIds([artifactA.id, artifactB.id]);
      addLog(result.reason || 'These artifacts cannot be upgraded.', 'danger');
      return;
    }

    const product = result.item;
    const cost = result.cost;
    type CraftOutcome = 'ok' | 'missing' | 'ryo' | 'space' | 'noprev';
    const craftBox: { o: CraftOutcome } = { o: 'noprev' };

    setPlayer(prev => {
      if (!prev) {
        craftBox.o = 'noprev';
        return null;
      }
      const applied = applyCraftToPlayer(prev, artifactA, artifactB, product, cost);
      if (!applied.ok) {
        craftBox.o = applied.reason;
        return prev;
      }
      craftBox.o = 'ok';
      return applied.player;
    });

    if (craftBox.o !== 'ok') {
      releaseInventoryItemIds([artifactA.id, artifactB.id]);
      if (craftBox.o === 'missing') {
        addLog('Materials no longer in bag.', 'danger');
      } else if (craftBox.o === 'ryo') {
        addLog(`Not enough Ryō! Need ${cost} Ryō.`, 'danger');
      } else if (craftBox.o === 'space') {
        addLog('No bag space for forged item.', 'danger');
      }
      return;
    }

    addLog(`Forged ${product.name} for ${cost} Ryō!`, 'gain');
    setSelectedComponent(null);
  }, [player, currentDangerLevel, currentBaseDifficulty, setPlayer, addLog, setSelectedComponent]);

  /**
   * Sell equipped item directly from equipment panel.
   * T-062: returns sell price on success for UI toast (null on fail).
   * Claim id first — slot id check alone can double-pay same-tick (parity bag sell).
   * Only grants ryo if the slot still holds that item on latest prev.
   */
  const sellEquipped = useCallback((slot: EquipmentSlot, item: Item): number | null => {
    // Equip-occupancy claim (blocks sell×2 / sell+unequip race on same piece)
    if (!claimEquipAction(slot, item.id)) return null;
    // Also mark instance destroyed so bag sell cannot re-pay if it races into bag
    if (!claimInventoryItemIds([item.id])) {
      releaseEquipAction(slot, item.id);
      return null;
    }

    let soldValue: number | null = null;
    setPlayer(prev => {
      if (!prev) return null;
      if (prev.equipment[slot]?.id !== item.id) return prev;
      const value = getSellPrice(item);
      soldValue = value;
      return {
        ...prev,
        ryo: prev.ryo + value,
        equipment: { ...prev.equipment, [slot]: null }
      };
    });
    if (soldValue === null) {
      releaseEquipAction(slot, item.id);
      releaseInventoryItemIds([item.id]);
      return null;
    }
    addLog(`Sold ${item.name} for ${soldValue} Ryō.`, 'loot');
    return soldValue;
  }, [setPlayer, addLog]);

  /**
   * Unequip item to bag (both components and artifacts).
   * T-067: returns true on success for UI toast (false on fail).
   * Claim equip occupancy first — slot check alone can dupe into bag same-tick.
   */
  const unequipToBag = useCallback((slot: EquipmentSlot, item: Item): boolean => {
    if (!claimEquipAction(slot, item.id)) return false;

    type Outcome = 'ok' | 'full' | 'missing' | 'noprev';
    const outBox: { o: Outcome } = { o: 'noprev' };

    setPlayer(prev => {
      if (!prev) {
        outBox.o = 'noprev';
        return null;
      }
      if (prev.equipment[slot]?.id !== item.id) {
        outBox.o = 'missing';
        return prev;
      }
      const emptyIndex = prev.bag.findIndex(s => s === null);
      if (emptyIndex === -1) {
        outBox.o = 'full';
        return prev;
      }
      const newBag = [...prev.bag];
      newBag[emptyIndex] = item;
      outBox.o = 'ok';
      return {
        ...prev,
        equipment: { ...prev.equipment, [slot]: null },
        bag: newBag
      };
    });

    if (outBox.o !== 'ok') {
      releaseEquipAction(slot, item.id);
      if (outBox.o === 'full') {
        addLog('Bag is full!', 'danger');
      }
      return false;
    }
    addLog(`Moved ${item.name} to bag.`, 'info');
    return true;
  }, [setPlayer, addLog]);

  /**
   * Unequip component into bag and select it for synthesis.
   * Returns true when bag received the piece (Bag must arm synthesisMode via session token).
   * Claim equip occupancy first (parity unequip — no double bag inject).
   */
  const startSynthesisEquipped = useCallback((slot: EquipmentSlot, item: Item): boolean => {
    if (!item.isComponent) return false;
    if (!claimEquipAction(slot, item.id)) return false;

    type Outcome = 'ok' | 'full' | 'missing' | 'noprev';
    const outBox: { o: Outcome } = { o: 'noprev' };

    setPlayer(prev => {
      if (!prev) {
        outBox.o = 'noprev';
        return null;
      }
      if (prev.equipment[slot]?.id !== item.id) {
        outBox.o = 'missing';
        return prev;
      }
      const emptyIndex = prev.bag.findIndex(s => s === null);
      if (emptyIndex === -1) {
        outBox.o = 'full';
        return prev;
      }
      const newBag = [...prev.bag];
      newBag[emptyIndex] = item;
      outBox.o = 'ok';
      return {
        ...prev,
        equipment: { ...prev.equipment, [slot]: null },
        bag: newBag
      };
    });

    if (outBox.o !== 'ok') {
      releaseEquipAction(slot, item.id);
      if (outBox.o === 'full') {
        addLog('Bag is full!', 'danger');
      }
      return false;
    }
    setSelectedComponent(item);
    if (item.rarity === Rarity.BROKEN) {
      addLog(`Select a matching Broken component to upgrade ${item.name}.`, 'info');
    } else {
      addLog(`Select another component to synthesize with ${item.name}.`, 'info');
    }
    return true;
  }, [setPlayer, addLog, setSelectedComponent]);

  /**
   * Disassemble artifact into a component.
   * T-069: returns the recovered component on success for UI toast (null on fail).
   * Claim equip occupancy first — same-tick double click yielded two components.
   */
  const handleDisassembleEquipped = useCallback((slot: EquipmentSlot, item: Item): Item | null => {
    if (item.isComponent || !item.recipe) return null;
    if (!claimEquipAction(slot, item.id)) return null;

    const component = disassemble(item);
    if (!component) {
      releaseEquipAction(slot, item.id);
      addLog('Cannot disassemble this item.', 'danger');
      return null;
    }

    type Outcome = 'ok' | 'full' | 'missing' | 'noprev';
    const outBox: { o: Outcome } = { o: 'noprev' };

    setPlayer(prev => {
      if (!prev) {
        outBox.o = 'noprev';
        return null;
      }
      if (prev.equipment[slot]?.id !== item.id) {
        outBox.o = 'missing';
        return prev;
      }
      const emptyIndex = prev.bag.findIndex(s => s === null);
      if (emptyIndex === -1) {
        outBox.o = 'full';
        return prev;
      }
      const newBag = [...prev.bag];
      newBag[emptyIndex] = component;
      outBox.o = 'ok';
      return {
        ...prev,
        equipment: { ...prev.equipment, [slot]: null },
        bag: newBag
      };
    });

    if (outBox.o !== 'ok') {
      releaseEquipAction(slot, item.id);
      if (outBox.o === 'full') {
        addLog('Not enough bag space for component!', 'danger');
      }
      return null;
    }
    addLog(`Disassembled ${item.name} into ${component.name}!`, 'loot');
    return component;
  }, [setPlayer, addLog]);

  // Swap items within the bag
  const reorderBag = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setPlayer(prev => {
      if (!prev) return null;
      const newBag = [...prev.bag];
      [newBag[fromIndex], newBag[toIndex]] = [newBag[toIndex], newBag[fromIndex]];
      return { ...prev, bag: newBag };
    });
  }, [setPlayer]);

  // Equip item from bag to a specific slot via drag
  const dragBagToEquip = useCallback((item: Item, bagIndex: number, targetSlot: EquipmentSlot) => {
    let swappedName: string | null = null;
    let didEquip = false;
    let failReason: string | null = null;

    setPlayer(prev => {
      if (!prev) return null;
      if (prev.bag[bagIndex]?.id !== item.id) return prev;

      // Block multi-slot clone of the same instance
      const wornElsewhere = (Object.values(EquipmentSlot) as EquipmentSlot[]).some(
        s => s !== targetSlot && prev.equipment[s]?.id === item.id
      );
      if (wornElsewhere) {
        failReason = 'Item is already equipped.';
        return prev;
      }

      const existingItem = prev.equipment[targetSlot];
      // Same instance already on this slot — no-op
      if (existingItem?.id === item.id) {
        didEquip = true;
        return prev;
      }

      const newBag = [...prev.bag];
      newBag[bagIndex] = existingItem ?? null;
      swappedName = existingItem?.name ?? null;
      didEquip = true;
      return {
        ...prev,
        bag: newBag,
        equipment: { ...prev.equipment, [targetSlot]: item }
      };
    });

    if (failReason) {
      addLog(failReason, 'danger');
      return;
    }
    if (!didEquip) return;
    // Re-arm unequip for this slot after a fresh equip (prior sell/unequip claim would stick)
    releaseEquipActionsForSlot(targetSlot);
    if (swappedName) {
      addLog(`Swapped ${item.name} with ${swappedName}.`, 'info');
    } else {
      addLog(`Equipped ${item.name}.`, 'loot');
    }
    setSelectedComponent(null);
  }, [setPlayer, addLog, setSelectedComponent]);

  // Unequip item from equipment to bag via drag
  const dragEquipToBag = useCallback((item: Item, slot: EquipmentSlot, targetBagIndex?: number) => {
    if (!claimEquipAction(slot, item.id)) return;

    type Outcome = 'ok' | 'full' | 'missing' | 'swapped' | 'noprev';
    const outBox: { o: Outcome } = { o: 'noprev' };
    let swappedName: string | null = null;

    setPlayer(prev => {
      if (!prev) {
        outBox.o = 'noprev';
        return null;
      }
      if (prev.equipment[slot]?.id !== item.id) {
        outBox.o = 'missing';
        return prev;
      }

      const newBag = [...prev.bag];

      if (targetBagIndex !== undefined && targetBagIndex >= 0 && targetBagIndex < MAX_BAG_SLOTS) {
        const existingItem = newBag[targetBagIndex];
        newBag[targetBagIndex] = item;
        swappedName = existingItem?.name ?? null;
        outBox.o = existingItem ? 'swapped' : 'ok';
        return {
          ...prev,
          equipment: { ...prev.equipment, [slot]: existingItem },
          bag: newBag
        };
      }

      const emptySlot = newBag.findIndex(s => s === null);
      if (emptySlot === -1) {
        outBox.o = 'full';
        return prev;
      }
      newBag[emptySlot] = item;
      outBox.o = 'ok';
      return {
        ...prev,
        equipment: { ...prev.equipment, [slot]: null },
        bag: newBag
      };
    });

    if (outBox.o === 'full' || outBox.o === 'missing' || outBox.o === 'noprev') {
      releaseEquipAction(slot, item.id);
      if (outBox.o === 'full') {
        addLog('Bag is full!', 'danger');
      }
      return;
    }
    // swapped / ok — equip occupancy consumed (re-equip to slot re-arms via dragBagToEquip)
    if (outBox.o === 'swapped' && swappedName) {
      addLog(`Swapped ${item.name} with ${swappedName}.`, 'info');
      return;
    }
    if (outBox.o === 'ok') {
      addLog(`Moved ${item.name} to bag.`, 'info');
    }
  }, [setPlayer, addLog]);

  // Swap items between two equipment slots
  const swapEquipment = useCallback((fromSlot: EquipmentSlot, toSlot: EquipmentSlot) => {
    if (fromSlot === toSlot) return;

    let fromName: string | null = null;
    let toName: string | null = null;
    let didSwap = false;

    setPlayer(prev => {
      if (!prev) return null;
      const fromItem = prev.equipment[fromSlot];
      const toItem = prev.equipment[toSlot];
      if (!fromItem && !toItem) return prev;

      fromName = fromItem?.name ?? null;
      toName = toItem?.name ?? null;
      didSwap = true;
      return {
        ...prev,
        equipment: {
          ...prev.equipment,
          [fromSlot]: toItem,
          [toSlot]: fromItem
        }
      };
    });

    if (!didSwap) return;
    if (fromName && toName) {
      addLog(`Swapped ${fromName} and ${toName}.`, 'info');
    } else if (fromName) {
      addLog(`Moved ${fromName} to another slot.`, 'info');
    }
  }, [setPlayer, addLog]);

  return {
    equipItem,
    sellItem,
    storeToBag,
    sellComponent,
    equipFromBag,
    handleSynthesize,
    handleUpgradeComponent,
    handleUpgradeArtifact,
    sellEquipped,
    unequipToBag,
    startSynthesisEquipped,
    handleDisassembleEquipped,
    reorderBag,
    dragBagToEquip,
    dragEquipToBag,
    swapEquipment,
    exitLootOnce,
    rearmLootExit,
  };
}
