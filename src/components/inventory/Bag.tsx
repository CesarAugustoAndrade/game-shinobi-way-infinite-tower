import React, { useState, useEffect, useCallback } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Item, MAX_BAG_SLOTS, Rarity, DragData, RegionLootTheme } from '../../game/types';
import { getRecipesUsingComponent } from '../../game/constants/synthesis';
import { resolveItemArt } from '../../game/constants/artRegistry';
import { getSellPrice, getCraftCombination } from '../../game/systems/LootSystem';
import { formatStatName } from '../../game/utils/tooltipFormatters';
import {
  itemMatchesEquipmentFocus,
  isFocusStat,
} from '../../game/utils/itemFocusMatch';
import Tooltip from '../shared/Tooltip';
import ArtIcon from '../shared/ArtIcon';
import { getRarityTextBorderColor } from '../../utils/colorHelpers';
import './inventory.css';

export interface CraftResultInfo {
  item: Item;
  cost: number;
  actionName: string;
}

/** T-058: short bag action feedback toast */
interface BagActionToast {
  kind: 'equip' | 'sell';
  item: Item;
  detail: string;
}

interface BagProps {
  items: (Item | null)[];
  onSelectComponent: (item: Item | null) => void;
  /** T-058: may return sell price for toast */
  onSellComponent: (item: Item) => number | null | void;
  selectedComponent: Item | null;
  /** T-032: may return crafted item for reveal panel */
  onSynthesize?: (componentA: Item, componentB: Item) => Item | null | void;
  /** T-058: may return equip summary for toast */
  onEquipFromBag?: (item: Item) => { replacedName?: string } | null | void;
  isDragging?: boolean;
  /**
   * T-096: region lootTheme for Focus honesty while equipping between loot peaks.
   */
  lootTheme?: RegionLootTheme | null;
}

interface BagSlotProps {
  item: Item | null;
  index: number;
  isSelected: boolean;
  canCombine: boolean;
  isMenuOpen: boolean;
  sellValue: number;
  globalDragging: boolean;
  onItemClick: (item: Item) => void;
  onContextMenu: (e: React.MouseEvent, item: Item) => void;
  getRarityColor: (r: Rarity) => string;
  getCompatibleRecipes: (item: Item) => { name: string }[];
  children?: React.ReactNode;
  /** T-096 */
  equipmentFocus?: string[] | null;
}

const BagSlot: React.FC<BagSlotProps> = ({
  item,
  index,
  isSelected,
  canCombine,
  globalDragging,
  onItemClick,
  onContextMenu,
  getRarityColor,
  getCompatibleRecipes,
  children,
  equipmentFocus = null,
}) => {
  const sellValue = item ? getSellPrice(item) : 0;
  const isFocusItem = item ? itemMatchesEquipmentFocus(item, equipmentFocus) : false;

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `bag-${index}`,
  });

  const dragData: DragData | undefined = item
    ? { item, source: { type: 'bag', index } }
    : undefined;

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `bag-drag-${index}`,
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
    const classes = ['bag__slot'];

    if (isDragging) {
      classes.push('bag__slot--dragging');
    } else if (isOver && globalDragging) {
      classes.push('bag__slot--drop-target');
    } else if (item) {
      if (isSelected) {
        classes.push('bag__slot--selected');
      } else if (canCombine) {
        classes.push('bag__slot--combinable');
      } else {
        classes.push('bag__slot--filled');
      }
    } else {
      classes.push('bag__slot--empty');
    }

    return classes.join(' ');
  };

  return (
    <div className="bag__slot-wrapper">
      <Tooltip
        position="left"
        content={
          item ? (
            <div className="bag__tooltip">
              <div className={`bag__tooltip-name ${getRarityColor(item.rarity)}`}>
                <ArtIcon art={resolveItemArt(item)} size="sm" className="inline-block align-middle mr-1" />
                {' '}{item.name}
                {isFocusItem && (
                  <span className="bag__tooltip-focus" title="Matches region Focus"> · Focus</span>
                )}
              </div>
              <div className="bag__tooltip-desc">{item.description}</div>
              <div className="bag__tooltip-stats">
                {Object.entries(item.stats).map(([key, val]) => (
                  <div
                    key={key}
                    className={`bag__tooltip-stat ${isFocusStat(key, equipmentFocus) ? 'bag__tooltip-stat--focus' : ''}`}
                  >
                    <span>
                      {formatStatName(key)}
                      {isFocusStat(key, equipmentFocus) && (
                        <span className="bag__tooltip-focus-mark"> ★</span>
                      )}
                    </span>
                    <span className="bag__tooltip-stat-value">+{val}</span>
                  </div>
                ))}
              </div>
              {item.isComponent && item.rarity === Rarity.BROKEN && item.componentId && (
                <div className="bag__tooltip-recipes">
                  <div className="bag__tooltip-recipes-title">Upgrade path:</div>
                  <div className="bag__tooltip-recipe">
                    2× matching Broken → Common component
                  </div>
                </div>
              )}
              {item.isComponent && item.rarity === Rarity.COMMON && item.componentId && (
                <div className="bag__tooltip-recipes">
                  <div className="bag__tooltip-recipes-title">Can combine into:</div>
                  {getCompatibleRecipes(item).slice(0, 3).map(recipe => (
                    <div key={recipe.name} className="bag__tooltip-recipe">{recipe.name}</div>
                  ))}
                </div>
              )}
              <div className="bag__tooltip-sell">Sell: {sellValue} Ryo (60%)</div>
              <div className="bag__tooltip-hint">Drag to move - Click for actions</div>
            </div>
          ) : (
            <div className="bag__tooltip-hint">Empty slot - drop items here</div>
          )
        }
      >
        <div
          ref={combinedRef}
          style={style}
          {...attributes}
          {...listeners}
          onClick={() => item && onItemClick(item)}
          onContextMenu={(e) => {
            e.preventDefault();
            if (item) onContextMenu(e, item);
          }}
          className={getSlotClasses()}
        >
          {item ? (
            <>
              <ArtIcon art={resolveItemArt(item)} size="sm" title={item.name} />
              {isFocusItem && (
                <span className="bag__slot-focus" title="Matches region Focus stats">
                  F
                </span>
              )}
            </>
          ) : (
            <span className="bag__slot-empty-icon">·</span>
          )}
        </div>
      </Tooltip>
      {children}
    </div>
  );
};

const Bag: React.FC<BagProps> = ({
  items,
  onSelectComponent,
  onSellComponent,
  selectedComponent,
  onSynthesize,
  onEquipFromBag,
  isDragging: globalDragging = false,
  lootTheme = null,
}) => {
  const equipmentFocus = lootTheme?.equipmentFocus ?? null;
  const [synthesisMode, setSynthesisMode] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  /** T-032: last successful craft reveal */
  const [craftResult, setCraftResult] = useState<{ item: Item; recipeName: string } | null>(null);

  const itemCount = items.filter(item => item !== null).length;
  const getRarityColor = getRarityTextBorderColor;

  const handleComponentClick = (item: Item) => {
    if (synthesisMode && selectedComponent && selectedComponent.id !== item.id) {
      if (onSynthesize) {
        const combo = getCraftCombination(selectedComponent, item);
        if (combo) {
          const crafted = onSynthesize(selectedComponent, item);
          setSynthesisMode(false);
          setActiveMenu(null);
          if (crafted) {
            setCraftResult({ item: crafted, recipeName: combo.previewName });
          }
          return;
        }
      }
    }
    setActiveMenu(activeMenu === item.id ? null : item.id);
    onSelectComponent(item);
  };

  const [actionToast, setActionToast] = useState<BagActionToast | null>(null);

  const showActionToast = useCallback((toast: BagActionToast) => {
    setActionToast(toast);
  }, []);

  useEffect(() => {
    if (!actionToast) return;
    const t = setTimeout(() => setActionToast(null), 2200);
    return () => clearTimeout(t);
  }, [actionToast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && actionToast) {
        setActionToast(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actionToast]);

  const handleEquip = (item: Item) => {
    const result = onEquipFromBag?.(item);
    setActiveMenu(null);
    setSynthesisMode(false);
    setCraftResult(null);
    if (result && typeof result === 'object') {
      const detail = result.replacedName
        ? `Equipped · ${result.replacedName} → bag`
        : 'Equipped';
      showActionToast({ kind: 'equip', item, detail });
    }
  };

  const dismissCraftResult = () => setCraftResult(null);

  const startSynthesis = (item: Item) => {
    onSelectComponent(item);
    setSynthesisMode(true);
    setActiveMenu(null);
  };

  const handleSell = (e: React.MouseEvent, item: Item) => {
    e.stopPropagation();
    const sold = onSellComponent(item);
    setSynthesisMode(false);
    setActiveMenu(null);
    if (typeof sold === 'number' && sold >= 0) {
      // Clear craft reveal if the sold item was the craft result (stale equip CTA)
      setCraftResult(prev => (prev?.item.id === item.id ? null : prev));
      showActionToast({ kind: 'sell', item, detail: `+${sold} Ryō` });
    }
  };

  const handleSellFromMenu = (item: Item) => {
    const sold = onSellComponent(item);
    setSynthesisMode(false);
    setActiveMenu(null);
    if (typeof sold === 'number' && sold >= 0) {
      // Clear craft reveal if the sold item was the craft result (stale equip CTA)
      setCraftResult(prev => (prev?.item.id === item.id ? null : prev));
      showActionToast({ kind: 'sell', item, detail: `+${sold} Ryō` });
    }
  };

  const cancelSynthesis = () => {
    setSynthesisMode(false);
    setActiveMenu(null);
    onSelectComponent(null);
  };

  const getCompatibleRecipes = (item: Item) => {
    if (!item.componentId) return [];
    return getRecipesUsingComponent(item.componentId).slice(0, 4);
  };

  const canCombineWithSelected = (item: Item) => {
    if (!synthesisMode || !selectedComponent) return false;
    if (selectedComponent.id === item.id) return false;
    // Broken + same Broken, Common + recipe partner, or matching Rare artifacts
    return getCraftCombination(selectedComponent, item) !== null;
  };

  return (
    <div className="bag">
      <div className="bag__header">
        <h3 className="bag__title">Bag ({itemCount}/{MAX_BAG_SLOTS})</h3>
        {synthesisMode && selectedComponent && (
          <button type="button" onClick={cancelSynthesis} className="bag__cancel">Cancel</button>
        )}
      </div>
      {/* T-096: region Focus while equipping between loot peaks */}
      {equipmentFocus && equipmentFocus.length > 0 && (
        <div className="bag__focus-chip" title="Region Focus — matching items marked F">
          Focus{' '}
          {equipmentFocus
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' · ')}
        </div>
      )}

      {synthesisMode && selectedComponent && (
        <div className="bag__synthesis-hint">
          {selectedComponent.rarity === Rarity.BROKEN
            ? `Select a matching Broken component to upgrade ${selectedComponent.name}`
            : `Select another component to synthesize with ${selectedComponent.name}`}
        </div>
      )}

      <div className="bag__grid">
        {items.map((item, index) => {
          const isSelected = selectedComponent?.id === item?.id;
          const canCombine = item ? canCombineWithSelected(item) : false;
          const isMenuOpen = item && activeMenu === item.id && !synthesisMode;
          const sellValue = item ? getSellPrice(item) : 0;

          return (
            <BagSlot
              key={index}
              item={item}
              index={index}
              isSelected={isSelected}
              canCombine={canCombine}
              isMenuOpen={!!isMenuOpen}
              sellValue={sellValue}
              equipmentFocus={equipmentFocus}
              globalDragging={globalDragging}
              onItemClick={handleComponentClick}
              onContextMenu={handleSell}
              getRarityColor={getRarityColor}
              getCompatibleRecipes={getCompatibleRecipes}
            >
              {isMenuOpen && item && (
                <div className="bag__menu">
                  {onEquipFromBag && (
                    <button
                      type="button"
                      onClick={() => handleEquip(item)}
                      className="bag__menu-btn bag__menu-btn--equip"
                    >
                      Equip
                    </button>
                  )}
                  {onSynthesize && (item.isComponent || item.rarity === Rarity.RARE) && (
                    <button
                      type="button"
                      onClick={() => startSynthesis(item)}
                      className="bag__menu-btn bag__menu-btn--synthesize"
                    >
                      {item.rarity === Rarity.BROKEN ? 'Upgrade' : 'Synthesize'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSellFromMenu(item)}
                    className="bag__menu-btn bag__menu-btn--sell"
                  >
                    <span>Sell</span>
                    <span className="bag__menu-price">+{sellValue}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMenu(null)}
                    className="bag__menu-btn bag__menu-btn--cancel"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </BagSlot>
          );
        })}
      </div>

      <div className="bag__help">
        Drag to reorder/equip - Click for actions - Right-click to quick sell
      </div>

      {synthesisMode && selectedComponent && (
        <div className="bag__synthesis-preview">
          <div className="bag__synthesis-title">Available combinations:</div>
          <div className="bag__synthesis-grid">
            {items
              .filter((c): c is Item => c !== null && c.id !== selectedComponent.id)
              .map(c => {
                const combo = getCraftCombination(selectedComponent, c);
                if (!combo) return null;
                const label =
                  combo.mode === 'upgrade_broken'
                    ? `Upgrade → ${combo.previewName}`
                    : combo.mode === 'upgrade_artifact'
                      ? `Forge Epic ${combo.previewName}`
                      : combo.previewName;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleComponentClick(c)}
                    className="bag__synthesis-option"
                  >
                    + <ArtIcon art={resolveItemArt(c)} size="xs" className="inline-block align-middle" /> - {label}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* T-032/T-098: craft reveal — art + Focus honesty + equip CTA */}
      {craftResult && (() => {
        const crafted = craftResult.item;
        const isFocusCraft = itemMatchesEquipmentFocus(crafted, equipmentFocus);
        const stats = Object.entries(crafted.stats || {}).filter(
          ([, v]) => typeof v === 'number' && v !== 0,
        );
        return (
        <div className="bag__craft-result" role="status">
          <div className="bag__craft-result-header">
            Crafted!
            {isFocusCraft && (
              <span className="bag__craft-result-focus" title="Matches region Focus stats">
                Focus
              </span>
            )}
          </div>
          <div className="bag__craft-result-body">
            <ArtIcon art={resolveItemArt(crafted)} size="lg" className="bag__craft-result-art" />
            <div className="bag__craft-result-info">
              <div
                className="bag__craft-result-name"
                style={{ color: getRarityColor(crafted.rarity) }}
              >
                {crafted.name}
              </div>
              <div className="bag__craft-result-recipe">{craftResult.recipeName}</div>
              {(crafted.description || crafted.passive) && (
                <div className="bag__craft-result-desc">
                  {crafted.description
                    || (crafted.passive
                      ? String(crafted.passive.type).replace(/_/g, ' ')
                      : '')}
                </div>
              )}
              {stats.length > 0 && (
                <div className="bag__craft-result-stats">
                  {stats.map(([key, val]) => (
                    <div
                      key={key}
                      className={`bag__craft-result-stat ${isFocusStat(key, equipmentFocus) ? 'bag__craft-result-stat--focus' : ''}`}
                    >
                      <span>
                        {formatStatName(key)}
                        {isFocusStat(key, equipmentFocus) && (
                          <span className="bag__craft-result-stat-mark"> ★</span>
                        )}
                      </span>
                      <span>+{val as number}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="bag__craft-result-actions">
            {onEquipFromBag && (
              <button
                type="button"
                className="bag__craft-result-btn bag__craft-result-btn--equip"
                onClick={() => handleEquip(crafted)}
              >
                Equip
              </button>
            )}
            <button
              type="button"
              className="bag__craft-result-btn bag__craft-result-btn--dismiss"
              onClick={dismissCraftResult}
            >
              Keep in bag
            </button>
          </div>
        </div>
        );
      })()}

      {/* T-058: equip / sell success toast */}
      {actionToast && (
        <div
          className={`bag-toast bag-toast--${actionToast.kind}`}
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
              {actionToast.kind === 'equip' ? 'Equipped' : 'Sold'}
            </span>
            <span className="bag-toast__name">{actionToast.item.name}</span>
            <span className="bag-toast__detail">{actionToast.detail}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bag;
