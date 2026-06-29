import { useCallback } from 'react';
import {
  Player, Item, EquipmentSlot, Rarity, LogEntry, MAX_BAG_SLOTS
} from '../game/types';
import {
  equipItem as equipItemFn,
  sellItem as sellItemFn,
  addToBag,
  synthesize,
  disassemble,
  upgradeComponent,
  upgradeArtifact
} from '../game/systems/LootSystem';
import { dangerToFloor } from '../game/systems/ScalingSystem';

export interface InventoryState {
  player: Player | null;
  currentDangerLevel: number;
  currentBaseDifficulty: number;
  difficulty: number;
  isProcessingLoot: boolean;
}

export interface InventorySetters {
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  setIsProcessingLoot: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedComponent: React.Dispatch<React.SetStateAction<Item | null>>;
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
  const { player, currentDangerLevel, currentBaseDifficulty, difficulty, isProcessingLoot } = state;
  const { setPlayer, setIsProcessingLoot, setSelectedComponent } = setters;
  const { addLog, returnToMap } = deps;

  const equipItem = useCallback((item: Item) => {
    if (!player || isProcessingLoot) return;
    setIsProcessingLoot(true);

    const result = equipItemFn(player, item);
    if (!result.success) {
      addLog(result.reason || 'Cannot equip item.', 'danger');
      setIsProcessingLoot(false);
      return;
    }

    setPlayer(result.player);
    if (result.replacedItem) {
      addLog(`Equipped ${item.name}. ${result.replacedItem.name} moved to bag.`, 'loot');
    } else {
      addLog(`Equipped ${item.name}.`, 'loot');
    }
    setTimeout(() => {
      setIsProcessingLoot(false);
      returnToMap();
    }, 100);
  }, [player, isProcessingLoot, setPlayer, addLog, returnToMap, setIsProcessingLoot]);

  const sellItem = useCallback((item: Item) => {
    if (!player || isProcessingLoot) return;
    setIsProcessingLoot(true);
    setPlayer(prev => {
      if (!prev) return null;
      return sellItemFn(prev, item);
    });
    addLog(`Sold ${item.name} for ${Math.floor(item.value * 0.6)} Ryō.`, 'loot');
    setTimeout(() => {
      setIsProcessingLoot(false);
      returnToMap();
    }, 100);
  }, [player, isProcessingLoot, setPlayer, addLog, returnToMap, setIsProcessingLoot]);

  // Store item in bag instead of equipping
  const storeToBag = useCallback((item: Item) => {
    if (!player || isProcessingLoot) return;

    const result = addToBag(player, item);
    if (!result) {
      addLog('Bag is full!', 'danger');
      return;
    }

    setIsProcessingLoot(true);
    setPlayer(result);
    addLog(`Stored ${item.name} in bag.`, 'loot');
    setTimeout(() => {
      setIsProcessingLoot(false);
      returnToMap();
    }, 100);
  }, [player, isProcessingLoot, setPlayer, addLog, returnToMap, setIsProcessingLoot]);

  // Sell component from bag
  const sellComponent = useCallback((item: Item) => {
    if (!player) return;
    const value = Math.floor(item.value * 0.6);
    setPlayer(prev => prev ? {
      ...prev,
      ryo: prev.ryo + value,
      bag: prev.bag.map(c => c?.id === item.id ? null : c)
    } : null);
    addLog(`Sold ${item.name} for ${value} Ryō.`, 'loot');
    setSelectedComponent(null);
  }, [player, setPlayer, addLog, setSelectedComponent]);

  // Equip item from bag
  const equipFromBag = useCallback((item: Item) => {
    if (!player) return;
    // Remove from bag first (set to null), then try to equip
    const playerWithoutItem = {
      ...player,
      bag: player.bag.map(c => c?.id === item.id ? null : c)
    };
    const result = equipItemFn(playerWithoutItem, item);
    if (!result.success) {
      addLog(result.reason || 'Cannot equip item.', 'danger');
      return;
    }
    setPlayer(result.player);
    if (result.replacedItem) {
      addLog(`Equipped ${item.name}. ${result.replacedItem.name} moved to bag.`, 'loot');
    } else {
      addLog(`Equipped ${item.name} from bag.`, 'loot');
    }
    setSelectedComponent(null);
  }, [player, setPlayer, addLog, setSelectedComponent]);

  // Smart craft handler - determines which operation based on item rarities
  const handleSynthesize = useCallback((compA: Item, compB: Item) => {
    if (!player) return;

    const bothBroken = compA.rarity === Rarity.BROKEN && compB.rarity === Rarity.BROKEN;
    const bothCommon = compA.rarity === Rarity.COMMON && compB.rarity === Rarity.COMMON;
    const bothRareArtifacts = compA.rarity === Rarity.RARE && compB.rarity === Rarity.RARE
                              && !compA.isComponent && !compB.isComponent;

    let result;
    let actionName = '';
    const effectiveFloor = dangerToFloor(currentDangerLevel, currentBaseDifficulty);

    if (bothBroken && compA.isComponent && compB.isComponent) {
      result = upgradeComponent(compA, compB, effectiveFloor);
      actionName = 'Upgraded';
    } else if (bothRareArtifacts) {
      result = upgradeArtifact(compA, compB, effectiveFloor);
      actionName = 'Forged';
    } else if (bothCommon && compA.isComponent && compB.isComponent) {
      result = synthesize(compA, compB, effectiveFloor);
      actionName = 'Synthesized';
    } else {
      result = synthesize(compA, compB, effectiveFloor);
      actionName = 'Synthesized';
    }

    if (!result.success || !result.item) {
      addLog(result.reason || 'These items cannot be combined.', 'danger');
      return;
    }

    if (player.ryo < result.cost) {
      addLog(`Not enough Ryō! Need ${result.cost} Ryō.`, 'danger');
      return;
    }

    const newBag = player.bag.map(c =>
      c?.id === compA.id || c?.id === compB.id ? null : c
    );
    const emptyIndex = newBag.findIndex(slot => slot === null);
    if (emptyIndex !== -1) {
      newBag[emptyIndex] = result.item;
    }

    setPlayer({ ...player, bag: newBag, ryo: player.ryo - result.cost });
    addLog(`${actionName} ${result.item.name} for ${result.cost} Ryō!`, 'gain');
    setSelectedComponent(null);
  }, [player, currentDangerLevel, currentBaseDifficulty, difficulty, setPlayer, addLog, setSelectedComponent]);

  // Upgrade two BROKEN components (same type) into a COMMON component
  const handleUpgradeComponent = useCallback((compA: Item, compB: Item) => {
    if (!player) return;

    const effectiveFloor = dangerToFloor(currentDangerLevel, currentBaseDifficulty);
    const result = upgradeComponent(compA, compB, effectiveFloor);
    if (!result.success || !result.item) {
      addLog(result.reason || 'These components cannot be upgraded.', 'danger');
      return;
    }

    if (player.ryo < result.cost) {
      addLog(`Not enough Ryō! Need ${result.cost} Ryō.`, 'danger');
      return;
    }

    const newBag = player.bag.map(c =>
      c?.id === compA.id || c?.id === compB.id ? null : c
    );
    const emptyIndex = newBag.findIndex(slot => slot === null);
    if (emptyIndex !== -1) {
      newBag[emptyIndex] = result.item;
    }

    setPlayer({ ...player, bag: newBag, ryo: player.ryo - result.cost });
    addLog(`Upgraded to ${result.item.name} for ${result.cost} Ryō!`, 'gain');
    setSelectedComponent(null);
  }, [player, currentDangerLevel, currentBaseDifficulty, setPlayer, addLog, setSelectedComponent]);

  // Upgrade two RARE artifacts (same type) into an EPIC artifact
  const handleUpgradeArtifact = useCallback((artifactA: Item, artifactB: Item) => {
    if (!player) return;

    const effectiveFloor = dangerToFloor(currentDangerLevel, currentBaseDifficulty);
    const result = upgradeArtifact(artifactA, artifactB, effectiveFloor);
    if (!result.success || !result.item) {
      addLog(result.reason || 'These artifacts cannot be upgraded.', 'danger');
      return;
    }

    if (player.ryo < result.cost) {
      addLog(`Not enough Ryō! Need ${result.cost} Ryō.`, 'danger');
      return;
    }

    const newBag = player.bag.map(c =>
      c?.id === artifactA.id || c?.id === artifactB.id ? null : c
    );
    const emptyIndex = newBag.findIndex(slot => slot === null);
    if (emptyIndex !== -1) {
      newBag[emptyIndex] = result.item;
    }

    setPlayer({ ...player, bag: newBag, ryo: player.ryo - result.cost });
    addLog(`Forged ${result.item.name} for ${result.cost} Ryō!`, 'gain');
    setSelectedComponent(null);
  }, [player, currentDangerLevel, currentBaseDifficulty, setPlayer, addLog, setSelectedComponent]);

  // Sell equipped item directly from equipment panel
  const sellEquipped = useCallback((slot: EquipmentSlot, item: Item) => {
    if (!player) return;
    const value = Math.floor(item.value * 0.6);
    setPlayer(prev => prev ? {
      ...prev,
      ryo: prev.ryo + value,
      equipment: { ...prev.equipment, [slot]: null }
    } : null);
    addLog(`Sold ${item.name} for ${value} Ryō.`, 'loot');
  }, [player, setPlayer, addLog]);

  // Unequip item to bag (both components and artifacts)
  const unequipToBag = useCallback((slot: EquipmentSlot, item: Item) => {
    if (!player) return;
    const emptyIndex = player.bag.findIndex(s => s === null);
    if (emptyIndex === -1) {
      addLog('Bag is full!', 'danger');
      return;
    }
    const newBag = [...player.bag];
    newBag[emptyIndex] = item;
    setPlayer(prev => prev ? {
      ...prev,
      equipment: { ...prev.equipment, [slot]: null },
      bag: newBag
    } : null);
    addLog(`Moved ${item.name} to bag.`, 'info');
  }, [player, setPlayer, addLog]);

  // Unequip component and start synthesis mode
  const startSynthesisEquipped = useCallback((slot: EquipmentSlot, item: Item) => {
    if (!player || !item.isComponent) return;
    const emptyIndex = player.bag.findIndex(s => s === null);
    if (emptyIndex === -1) {
      addLog('Bag is full!', 'danger');
      return;
    }
    const newBag = [...player.bag];
    newBag[emptyIndex] = item;
    setPlayer(prev => prev ? {
      ...prev,
      equipment: { ...prev.equipment, [slot]: null },
      bag: newBag
    } : null);
    setSelectedComponent(item);
    addLog(`Select another component to synthesize with ${item.name}.`, 'info');
  }, [player, setPlayer, addLog, setSelectedComponent]);

  // Disassemble artifact into a component
  const handleDisassembleEquipped = useCallback((slot: EquipmentSlot, item: Item) => {
    if (!player || item.isComponent || !item.recipe) return;

    const component = disassemble(item);
    if (!component) {
      addLog('Cannot disassemble this item.', 'danger');
      return;
    }

    const emptyIndex = player.bag.findIndex(s => s === null);
    if (emptyIndex === -1) {
      addLog('Not enough bag space for component!', 'danger');
      return;
    }

    const newBag = [...player.bag];
    newBag[emptyIndex] = component;
    setPlayer(prev => prev ? {
      ...prev,
      equipment: { ...prev.equipment, [slot]: null },
      bag: newBag
    } : null);
    addLog(`Disassembled ${item.name} into ${component.name}!`, 'loot');
  }, [player, setPlayer, addLog]);

  // Swap items within the bag
  const reorderBag = useCallback((fromIndex: number, toIndex: number) => {
    if (!player) return;
    if (fromIndex === toIndex) return;

    const newBag = [...player.bag];
    [newBag[fromIndex], newBag[toIndex]] = [newBag[toIndex], newBag[fromIndex]];

    setPlayer({ ...player, bag: newBag });
  }, [player, setPlayer]);

  // Equip item from bag to a specific slot via drag
  const dragBagToEquip = useCallback((item: Item, bagIndex: number, targetSlot: EquipmentSlot) => {
    if (!player) return;

    const existingItem = player.equipment[targetSlot];
    const newBag = [...player.bag];
    newBag[bagIndex] = null;

    if (existingItem) {
      newBag[bagIndex] = existingItem;
      addLog(`Swapped ${item.name} with ${existingItem.name}.`, 'info');
    } else {
      addLog(`Equipped ${item.name}.`, 'loot');
    }

    setPlayer({
      ...player,
      bag: newBag,
      equipment: { ...player.equipment, [targetSlot]: item }
    });
    setSelectedComponent(null);
  }, [player, setPlayer, addLog, setSelectedComponent]);

  // Unequip item from equipment to bag via drag
  const dragEquipToBag = useCallback((item: Item, slot: EquipmentSlot, targetBagIndex?: number) => {
    if (!player) return;

    const newBag = [...player.bag];

    if (targetBagIndex !== undefined && targetBagIndex >= 0 && targetBagIndex < MAX_BAG_SLOTS) {
      const existingItem = newBag[targetBagIndex];
      newBag[targetBagIndex] = item;

      setPlayer({
        ...player,
        equipment: { ...player.equipment, [slot]: existingItem },
        bag: newBag
      });

      if (existingItem) {
        addLog(`Swapped ${item.name} with ${existingItem.name}.`, 'info');
      } else {
        addLog(`Moved ${item.name} to bag.`, 'info');
      }
    } else {
      const emptySlot = newBag.findIndex(s => s === null);
      if (emptySlot === -1) {
        addLog('Bag is full!', 'danger');
        return;
      }
      newBag[emptySlot] = item;
      setPlayer({
        ...player,
        equipment: { ...player.equipment, [slot]: null },
        bag: newBag
      });
      addLog(`Moved ${item.name} to bag.`, 'info');
    }
  }, [player, setPlayer, addLog]);

  // Swap items between two equipment slots
  const swapEquipment = useCallback((fromSlot: EquipmentSlot, toSlot: EquipmentSlot) => {
    if (!player) return;
    if (fromSlot === toSlot) return;

    const fromItem = player.equipment[fromSlot];
    const toItem = player.equipment[toSlot];

    if (!fromItem && !toItem) return;

    setPlayer({
      ...player,
      equipment: {
        ...player.equipment,
        [fromSlot]: toItem,
        [toSlot]: fromItem
      }
    });

    if (fromItem && toItem) {
      addLog(`Swapped ${fromItem.name} and ${toItem.name}.`, 'info');
    } else if (fromItem) {
      addLog(`Moved ${fromItem.name} to another slot.`, 'info');
    }
  }, [player, setPlayer, addLog]);

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
    swapEquipment
  };
}
