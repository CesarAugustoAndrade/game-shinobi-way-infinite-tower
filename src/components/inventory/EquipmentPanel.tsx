import React, { useState, useEffect, useCallback } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Item, EquipmentSlot, Rarity, DragData, RegionLootTheme } from '../../game/types';
import { getSellPrice } from '../../game/systems/LootSystem';
import { resolveItemArt } from '../../game/constants/artRegistry';
import {
  itemMatchesEquipmentFocus,
  isFocusStat,
} from '../../game/utils/itemFocusMatch';
import Tooltip from '../shared/Tooltip';
import ArtIcon from '../shared/ArtIcon';
import { formatStatName } from '../../game/utils/tooltipFormatters';
import { getRarityTextColorWithEffects } from '../../utils/colorHelpers';
import './inventory.css';

interface EquipmentPanelProps {
  equipment: Record<EquipmentSlot, Item | null>;
  /** T-062: may return sell price for toast */
  onSellEquipped?: (slot: EquipmentSlot, item: Item) => number | null | void;
  /** T-067: may return success boolean for toast */
  onUnequip?: (slot: EquipmentSlot, item: Item) => boolean | void;
  /** T-069: may return recovered component for toast */
  onDisassemble?: (slot: EquipmentSlot, item: Item) => Item | null | void;
  onStartSynthesis?: (slot: EquipmentSlot, item: Item) => void;
  isDragging?: boolean;
  /**
   * T-097: region lootTheme for Focus honesty on worn loadout (bag already T-096).
   */
  lootTheme?: RegionLootTheme | null;
}

/** T-062/T-067/T-069: short equipment action toast */
interface EquipActionToast {
  kind: 'sell' | 'unequip' | 'disassemble';
  item: Item;
  detail: string;
}

const EquipmentPanel: React.FC<EquipmentPanelProps> = ({
  equipment,
  onSellEquipped,
  onUnequip,
  onDisassemble,
  onStartSynthesis,
  isDragging: globalDragging = false,
  lootTheme = null,
}) => {
  const [activeMenu, setActiveMenu] = useState<EquipmentSlot | null>(null);
  const [actionToast, setActionToast] = useState<EquipActionToast | null>(null);

  const getRarityColor = getRarityTextColorWithEffects;
  const equipmentFocus = lootTheme?.equipmentFocus ?? null;

  useEffect(() => {
    if (!actionToast) return;
    const t = setTimeout(() => setActionToast(null), 2200);
    return () => clearTimeout(t);
  }, [actionToast]);

  // Esc layers (capture so InventoryOverlay does not close first):
  // toast → slot menu → let overlay/parent close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.repeat) return;
      if (actionToast) {
        e.preventDefault();
        e.stopPropagation();
        setActionToast(null);
        return;
      }
      if (activeMenu) {
        e.preventDefault();
        e.stopPropagation();
        setActiveMenu(null);
        return;
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [actionToast, activeMenu]);

  const SLOT_NAMES: Record<EquipmentSlot, string> = {
    [EquipmentSlot.SLOT_1]: 'Primary (+50%)',
    [EquipmentSlot.SLOT_2]: 'Secondary',
    [EquipmentSlot.SLOT_3]: 'Secondary',
    [EquipmentSlot.SLOT_4]: 'Secondary',
  };

  const isPrimarySlot = (slot: EquipmentSlot) => slot === EquipmentSlot.SLOT_1;

  const handleSlotClick = (slot: EquipmentSlot, item: Item | null) => {
    if (!item) return;
    setActiveMenu(activeMenu === slot ? null : slot);
  };

  const handleSell = (slot: EquipmentSlot, item: Item) => {
    const sold = onSellEquipped?.(slot, item);
    setActiveMenu(null);
    if (typeof sold === 'number' && sold >= 0) {
      setActionToast({ kind: 'sell', item, detail: `+${sold} Ryō` });
    }
  };

  const handleUnequip = (slot: EquipmentSlot, item: Item) => {
    const ok = onUnequip?.(slot, item);
    setActiveMenu(null);
    if (ok === true) {
      setActionToast({ kind: 'unequip', item, detail: 'Moved to bag' });
    }
  };

  const handleDisassemble = (slot: EquipmentSlot, item: Item) => {
    const component = onDisassemble?.(slot, item);
    setActiveMenu(null);
    if (component && typeof component === 'object' && 'name' in component) {
      setActionToast({
        kind: 'disassemble',
        item,
        detail: `→ ${component.name}`,
      });
    }
  };

  const handleStartSynthesis = (slot: EquipmentSlot, item: Item) => {
    onStartSynthesis?.(slot, item);
    setActiveMenu(null);
  };

  const renderEquip = (slot: EquipmentSlot) => {
    const item = equipment[slot];
    const isMenuOpen = activeMenu === slot;
    const sellValue = item ? getSellPrice(item) : 0;
    const canUnequip = !!item;
    const canDisassemble = item && !item.isComponent && item.recipe;
    const isFocusItem = item ? itemMatchesEquipmentFocus(item, equipmentFocus) : false;

    const { setNodeRef: setDropRef, isOver } = useDroppable({
      id: `equip-${slot}`,
    });

    const dragData: DragData | undefined = item
      ? { item, source: { type: 'equipment', slot } }
      : undefined;

    const {
      attributes,
      listeners,
      setNodeRef: setDragRef,
      transform,
      isDragging,
    } = useDraggable({
      id: `equip-drag-${slot}`,
      data: dragData,
      disabled: !item,
    });

    const combinedRef = (node: HTMLElement | null) => {
      setDropRef(node);
      setDragRef(node);
    };

    const style = transform
      ? { transform: CSS.Translate.toString(transform) }
      : undefined;

    const getSlotClasses = () => {
      const classes = ['equipment-panel__slot'];

      if (isDragging) {
        classes.push('equipment-panel__slot--dragging');
      } else if (isOver && globalDragging) {
        classes.push('equipment-panel__slot--drop-target');
      } else if (isMenuOpen) {
        classes.push('equipment-panel__slot--selected');
      } else if (isPrimarySlot(slot)) {
        classes.push('equipment-panel__slot--primary');
      } else if (item) {
        classes.push('equipment-panel__slot--filled');
      } else {
        classes.push('equipment-panel__slot--empty');
      }

      return classes.join(' ');
    };

    const tooltipContent = item ? (
      <div className="equipment-panel__tooltip">
        <div className={`equipment-panel__tooltip-name ${getRarityColor(item.rarity)}`}>
          {item.name}
          {isFocusItem && (
            <span className="equipment-panel__tooltip-focus" title="Matches region Focus">
              {' '}· Focus
            </span>
          )}
        </div>
        <div className="equipment-panel__tooltip-type">
          {item.rarity} {item.isComponent ? 'Component' : (item.type || 'Artifact')}
        </div>
        {item.description && (
          <div className="equipment-panel__tooltip-desc">{item.description}</div>
        )}
        {item.passive && (
          <div className="equipment-panel__tooltip-passive">
            Passive: {item.description}
          </div>
        )}
        <div className="equipment-panel__tooltip-stats">
          {Object.entries(item.stats).map(([key, val]) => (
            <div
              key={key}
              className={`equipment-panel__tooltip-stat ${isFocusStat(key, equipmentFocus) ? 'equipment-panel__tooltip-stat--focus' : ''}`}
            >
              <span>
                {formatStatName(key)}
                {isFocusStat(key, equipmentFocus) && (
                  <span className="equipment-panel__tooltip-focus-mark"> ★</span>
                )}
              </span>
              <span className="equipment-panel__tooltip-stat-value">+{val}</span>
            </div>
          ))}
        </div>
        <div className="equipment-panel__tooltip-sell">Fence for {sellValue} Ryo</div>
        {canDisassemble && (
          <div className="equipment-panel__tooltip-disassemble">Can unmake (half returned)</div>
        )}
        <div className="equipment-panel__tooltip-hint">Drag to shift · click to act</div>
      </div>
    ) : (
      <div className="equipment-panel__tooltip-empty">A hollow groove — nothing worn here</div>
    );

    return (
      <div key={slot} className="equipment-panel__slot-wrapper">
        <Tooltip content={tooltipContent} position="left">
          <div
            ref={combinedRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => handleSlotClick(slot, item)}
            className={getSlotClasses()}
          >
            <div className={`equipment-panel__slot-header ${isDragging ? 'equipment-panel__slot-invisible' : ''}`}>
              <span className={`equipment-panel__slot-label ${isPrimarySlot(slot) ? 'equipment-panel__slot-label--primary' : ''}`}>
                {SLOT_NAMES[slot]}
              </span>
              {item && (
                <span className="equipment-panel__slot-meta">
                  {isFocusItem && (
                    <span className="equipment-panel__slot-focus" title="Matches region Focus">
                      F
                    </span>
                  )}
                  <span className={`equipment-panel__slot-rarity ${getRarityColor(item.rarity)}`}>
                    {item.rarity}
                  </span>
                </span>
              )}
            </div>
            <div className={`equipment-panel__slot-name ${
              item ? getRarityColor(item.rarity) : 'equipment-panel__slot-name--empty'
            } ${isDragging ? 'equipment-panel__slot-invisible' : ''}`}>
              {item ? (
                <span className="equipment-panel__slot-name-row">
                  <ArtIcon art={resolveItemArt(item)} size="xs" />
                  {item.name}
                </span>
              ) : '— vacant —'}
            </div>
          </div>
        </Tooltip>

        {isMenuOpen && item && (
          <div className="equipment-panel__menu">
            <button
              type="button"
              onClick={() => handleSell(slot, item)}
              className="equipment-panel__menu-btn equipment-panel__menu-btn--sell"
            >
              <span>Sell</span>
              <span className="equipment-panel__menu-price">+{sellValue} Ryo</span>
            </button>

            {canUnequip && onUnequip && (
              <button
                type="button"
                onClick={() => handleUnequip(slot, item)}
                className="equipment-panel__menu-btn equipment-panel__menu-btn--unequip"
              >
                Move to Bag
              </button>
            )}

            {item.isComponent && onStartSynthesis && (
              <button
                type="button"
                onClick={() => handleStartSynthesis(slot, item)}
                className="equipment-panel__menu-btn equipment-panel__menu-btn--synthesize"
              >
                Synthesize
              </button>
            )}

            {canDisassemble && onDisassemble && (
              <button
                type="button"
                onClick={() => handleDisassemble(slot, item)}
                className="equipment-panel__menu-btn equipment-panel__menu-btn--disassemble"
              >
                Disassemble (50%)
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveMenu(null)}
              className="equipment-panel__menu-btn equipment-panel__menu-btn--cancel"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="equipment-panel">
      <h3 className="equipment-panel__title">Equipment</h3>
      {renderEquip(EquipmentSlot.SLOT_1)}
      {renderEquip(EquipmentSlot.SLOT_2)}
      {renderEquip(EquipmentSlot.SLOT_3)}
      {renderEquip(EquipmentSlot.SLOT_4)}

      {/* T-062/T-067: sell / unequip toast (parity with bag) */}
      {actionToast && (
        <div
          className={`bag-toast bag-toast--${
            actionToast.kind === 'sell'
              ? 'sell'
              : actionToast.kind === 'disassemble'
                ? 'sell'
                : 'equip'
          }`}
          role="status"
          onClick={() => setActionToast(null)}
        >
          <ArtIcon
            art={resolveItemArt(actionToast.item)}
            size="md"
            className="bag-toast__art"
            title={actionToast.item.name}
          />
          <div className="bag-toast__copy">
            <span className="bag-toast__label">
              {actionToast.kind === 'sell'
                ? 'Sold'
                : actionToast.kind === 'disassemble'
                  ? 'Disassembled'
                  : 'Unequipped'}
            </span>
            <span className="bag-toast__name">{actionToast.item.name}</span>
            <span className="bag-toast__detail">{actionToast.detail}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentPanel;
