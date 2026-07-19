import React, { useState, useEffect, useCallback } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Item, MAX_BAG_SLOTS, Rarity, DragData } from '../../game/types';
import { getRecipesUsingComponent, findRecipe } from '../../game/constants/synthesis';
import { resolveItemArt } from '../../game/constants/artRegistry';
import { getSellPrice } from '../../game/systems/LootSystem';
import { formatStatName } from '../../game/utils/tooltipFormatters';
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
}) => {
  const sellValue = item ? getSellPrice(item) : 0;

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
              </div>
              <div className="bag__tooltip-desc">{item.description}</div>
              <div className="bag__tooltip-stats">
                {Object.entries(item.stats).map(([key, val]) => (
                  <div key={key} className="bag__tooltip-stat">
                    <span>{formatStatName(key)}</span>
                    <span className="bag__tooltip-stat-value">+{val}</span>
                  </div>
                ))}
              </div>
              {item.componentId && (
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
            <ArtIcon art={resolveItemArt(item)} size="sm" title={item.name} />
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
}) => {
  const [synthesisMode, setSynthesisMode] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  /** T-032: last successful craft reveal */
  const [craftResult, setCraftResult] = useState<{ item: Item; recipeName: string } | null>(null);

  const itemCount = items.filter(item => item !== null).length;
  const getRarityColor = getRarityTextBorderColor;

  const handleComponentClick = (item: Item) => {
    if (synthesisMode && selectedComponent && selectedComponent.id !== item.id) {
      if (onSynthesize && selectedComponent.componentId && item.componentId) {
        const recipe = findRecipe(selectedComponent.componentId, item.componentId);
        if (recipe) {
          const crafted = onSynthesize(selectedComponent, item);
          setSynthesisMode(false);
          setActiveMenu(null);
          if (crafted) {
            setCraftResult({ item: crafted, recipeName: recipe.name });
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
    if (!synthesisMode || !selectedComponent || !selectedComponent.componentId || !item.componentId) return false;
    if (selectedComponent.id === item.id) return false;
    return findRecipe(selectedComponent.componentId, item.componentId) !== null;
  };

  return (
    <div className="bag">
      <div className="bag__header">
        <h3 className="bag__title">Bag ({itemCount}/{MAX_BAG_SLOTS})</h3>
        {synthesisMode && selectedComponent && (
          <button type="button" onClick={cancelSynthesis} className="bag__cancel">Cancel</button>
        )}
      </div>

      {synthesisMode && selectedComponent && (
        <div className="bag__synthesis-hint">
          Select another component to synthesize with {selectedComponent.name}
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
                  {onSynthesize && item.componentId && (
                    <button
                      type="button"
                      onClick={() => startSynthesis(item)}
                      className="bag__menu-btn bag__menu-btn--synthesize"
                    >
                      Synthesize
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

      {synthesisMode && selectedComponent && selectedComponent.componentId && (
        <div className="bag__synthesis-preview">
          <div className="bag__synthesis-title">Available combinations:</div>
          <div className="bag__synthesis-grid">
            {items
              .filter((c): c is Item => c !== null && c.id !== selectedComponent.id && !!c.componentId)
              .map(c => {
                const recipe = c.componentId && selectedComponent.componentId
                  ? findRecipe(selectedComponent.componentId, c.componentId)
                  : null;
                if (!recipe) return null;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleComponentClick(c)}
                    className="bag__synthesis-option"
                  >
                    + <ArtIcon art={resolveItemArt(c)} size="xs" className="inline-block align-middle" /> - {recipe.name}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* T-032: craft reveal — art + passive + equip CTA */}
      {craftResult && (
        <div className="bag__craft-result" role="status">
          <div className="bag__craft-result-header">Crafted!</div>
          <div className="bag__craft-result-body">
            <ArtIcon art={resolveItemArt(craftResult.item)} size="lg" className="bag__craft-result-art" />
            <div className="bag__craft-result-info">
              <div
                className="bag__craft-result-name"
                style={{ color: getRarityColor(craftResult.item.rarity) }}
              >
                {craftResult.item.name}
              </div>
              <div className="bag__craft-result-recipe">{craftResult.recipeName}</div>
              {(craftResult.item.description || craftResult.item.passive) && (
                <div className="bag__craft-result-desc">
                  {craftResult.item.description
                    || (craftResult.item.passive
                      ? String(craftResult.item.passive.type).replace(/_/g, ' ')
                      : '')}
                </div>
              )}
            </div>
          </div>
          <div className="bag__craft-result-actions">
            {onEquipFromBag && (
              <button
                type="button"
                className="bag__craft-result-btn bag__craft-result-btn--equip"
                onClick={() => handleEquip(craftResult.item)}
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
      )}

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
