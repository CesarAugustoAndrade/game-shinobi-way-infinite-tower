import React, { useState, useEffect, useCallback } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Item, MAX_BAG_SLOTS, Rarity, DragData, RegionLootTheme, ComponentId } from '../../game/types';
import { getRecipesUsingComponent } from '../../game/constants/synthesis';
import { COMPONENT_DEFINITIONS } from '../../game/constants/components';
import {
  resolveItemArt,
  getArtifactArt,
  getComponentArt,
} from '../../game/constants/artRegistry';
import { getCraftCombination, CraftCombination } from '../../game/systems/LootSystem';
import { formatStatName } from '../../game/utils/tooltipFormatters';
import {
  itemMatchesEquipmentFocus,
  isFocusStat,
} from '../../game/utils/itemFocusMatch';
import Tooltip from '../shared/Tooltip';
import ArtIcon from '../shared/ArtIcon';
import { getRarityTextBorderColor } from '../../utils/colorHelpers';
import './inventory.css';

/** Resolve product art for a craft combo — result identity first (StS / TFT). */
function craftResultArt(combo: CraftCombination, partner: Item) {
  if (combo.mode === 'upgrade_broken') {
    return getComponentArt(partner.componentId ?? combo.previewName);
  }
  if (combo.mode === 'upgrade_artifact') {
    return getArtifactArt(combo.previewName);
  }
  return getArtifactArt(combo.previewName);
}

function partnerComponentId(recipe: [ComponentId, ComponentId], selfId: ComponentId): ComponentId {
  return recipe[0] === selfId ? recipe[1] : recipe[0];
}

export interface CraftResultInfo {
  item: Item;
  cost: number;
  actionName: string;
}

/** T-058: short bag action feedback toast */
interface BagActionToast {
  kind: 'equip';
  item: Item;
  detail: string;
}

interface BagProps {
  items: (Item | null)[];
  onSelectComponent: (item: Item | null) => void;
  /** Sell is merchant-only; prop kept optional for call-site compatibility */
  onSellComponent?: (item: Item) => number | null | void;
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
  /**
   * Bump when equipment → bag synthesis starts so local synthesisMode arms
   * (selectedComponent alone also marks menu picks without craft intent).
   */
  synthesisSession?: number;
}

interface BagSlotProps {
  item: Item | null;
  index: number;
  isSelected: boolean;
  canCombine: boolean;
  isMenuOpen: boolean;
  globalDragging: boolean;
  onItemClick: (item: Item) => void;
  getRarityColor: (r: Rarity) => string;
  getCompatibleRecipes: (item: Item) => { name: string; recipe: [ComponentId, ComponentId] }[];
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
  getRarityColor,
  getCompatibleRecipes,
  children,
  equipmentFocus = null,
}) => {
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
                <ArtIcon art={resolveItemArt(item)} size="sm" className="bag__tooltip-art" />
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
                  <div className="bag__tooltip-recipes-title">Forge path</div>
                  <div className="bag__tooltip-recipe bag__tooltip-recipe--result">
                    <ArtIcon
                      art={getComponentArt(item.componentId)}
                      size="xs"
                      title={item.name}
                    />
                    <span className="bag__tooltip-recipe-name">{item.name}</span>
                    <span className="bag__tooltip-recipe-need">2× Broken</span>
                  </div>
                </div>
              )}
              {item.isComponent && item.rarity === Rarity.COMMON && item.componentId && (
                <div className="bag__tooltip-recipes">
                  <div className="bag__tooltip-recipes-title">Forges into</div>
                  {getCompatibleRecipes(item).slice(0, 3).map((recipe) => {
                    const partnerId = partnerComponentId(recipe.recipe, item.componentId!);
                    const partnerDef = COMPONENT_DEFINITIONS[partnerId];
                    return (
                      <div key={recipe.name} className="bag__tooltip-recipe bag__tooltip-recipe--result">
                        <ArtIcon art={getArtifactArt(recipe.name)} size="xs" title={recipe.name} />
                        <span className="bag__tooltip-recipe-name">{recipe.name}</span>
                        <span className="bag__tooltip-recipe-need" title={partnerDef?.name}>
                          +
                          <ArtIcon
                            art={getComponentArt(partnerId)}
                            size="xs"
                            title={partnerDef?.name ?? partnerId}
                          />
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="bag__tooltip-hint">Drag to shift · click to act · sell at shop</div>
            </div>
          ) : (
            <div className="bag__tooltip-hint">Hollow pocket — the mist holds nothing yet</div>
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
            // Open action menu (equip/synth) — sell is merchant-only
            if (item) onItemClick(item);
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
  selectedComponent,
  onSynthesize,
  onEquipFromBag,
  isDragging: globalDragging = false,
  lootTheme = null,
  synthesisSession = 0,
}) => {
  const equipmentFocus = lootTheme?.equipmentFocus ?? null;
  const [synthesisMode, setSynthesisMode] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  /** T-032: last successful craft reveal */
  const [craftResult, setCraftResult] = useState<{ item: Item; recipeName: string } | null>(null);

  const itemCount = items.filter(item => item !== null).length;
  const getRarityColor = getRarityTextBorderColor;

  // Equipment "Synthesize" moves the piece into bag + sets selectedComponent, but
  // synthesisMode is local — arm it when parent bumps the session token.
  useEffect(() => {
    if (!synthesisSession || !selectedComponent) return;
    setSynthesisMode(true);
    setActiveMenu(null);
    setCraftResult(null);
  }, [synthesisSession, selectedComponent]);

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
    // Toggle off — re-click same tile clears selection (prevents sticky "infinite select")
    if (activeMenu === item.id || selectedComponent?.id === item.id) {
      setActiveMenu(null);
      onSelectComponent(null);
      return;
    }
    setActiveMenu(item.id);
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

  // Esc layers (capture so InventoryOverlay does not close first):
  // toast → craft reveal → slot menu → synthesis → let overlay/parent close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.repeat) return;
      if (actionToast) {
        e.preventDefault();
        e.stopPropagation();
        setActionToast(null);
        return;
      }
      if (craftResult) {
        e.preventDefault();
        e.stopPropagation();
        setCraftResult(null);
        return;
      }
      if (activeMenu) {
        e.preventDefault();
        e.stopPropagation();
        setActiveMenu(null);
        return;
      }
      if (synthesisMode) {
        e.preventDefault();
        e.stopPropagation();
        setSynthesisMode(false);
        setActiveMenu(null);
        onSelectComponent(null);
        return;
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [actionToast, craftResult, activeMenu, synthesisMode, onSelectComponent]);

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

          return (
            <BagSlot
              key={index}
              item={item}
              index={index}
              isSelected={isSelected}
              canCombine={canCombine}
              isMenuOpen={!!isMenuOpen}
              equipmentFocus={equipmentFocus}
              globalDragging={globalDragging}
              onItemClick={handleComponentClick}
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
        Drag to shift or equip · click to act · sell only at the merchant
      </div>

      {synthesisMode && selectedComponent && (() => {
        const partners = items.filter(
          (c): c is Item => c !== null && c.id !== selectedComponent.id && getCraftCombination(selectedComponent, c) !== null,
        );
        return (
        <div className="bag__synthesis-preview">
          <div className="bag__synthesis-title">Result · click partner to craft</div>
          {partners.length === 0 ? (
            <div className="bag__synthesis-empty" role="status">
              No echo answers this piece. Another shard waits elsewhere in the dark.
            </div>
          ) : (
          <div className="bag__synthesis-grid">
            {partners.map((c) => {
                const combo = getCraftCombination(selectedComponent, c)!;
                const resultArt = craftResultArt(combo, c);
                const modeLabel =
                  combo.mode === 'upgrade_broken'
                    ? 'Upgrade'
                    : combo.mode === 'upgrade_artifact'
                      ? 'Forge Epic'
                      : 'Synthesize';
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => handleComponentClick(c)}
                    className="bag__synthesis-option"
                    title={`${modeLabel}: ${combo.previewName}`}
                  >
                    {/* StS / TFT: result identity dominates the row */}
                    <div className="bag__synthesis-option-result">
                      <ArtIcon art={resultArt} size="sm" title={combo.previewName} />
                      <div className="bag__synthesis-option-copy">
                        <span className="bag__synthesis-option-name">{combo.previewName}</span>
                        <span className="bag__synthesis-option-mode">{modeLabel}</span>
                      </div>
                    </div>
                    <div className="bag__synthesis-option-ingredients" aria-hidden="true">
                      <ArtIcon art={resolveItemArt(selectedComponent)} size="xs" />
                      <span className="bag__synthesis-option-plus">+</span>
                      <ArtIcon art={resolveItemArt(c)} size="xs" />
                      <span className="bag__synthesis-option-arrow">→</span>
                    </div>
                  </button>
                );
              })}
          </div>
          )}
        </div>
        );
      })()}

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
            <div className="bag__craft-result-plate" aria-hidden="true">
              <ArtIcon art={resolveItemArt(crafted)} size="fill" title={crafted.name} />
            </div>
            <div className="bag__craft-result-info">
              <div className={`bag__craft-result-name ${getRarityColor(crafted.rarity)}`}>
                {crafted.name}
              </div>
              <div className="bag__craft-result-recipe">From · {craftResult.recipeName}</div>
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
