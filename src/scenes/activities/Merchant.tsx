import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Item,
  Player,
  Rarity,
  EquipmentSlot,
  SLOT_MAPPING,
  TreasureQuality,
  MAX_MERCHANT_SLOTS,
  RegionLootTheme,
} from '../../game/types';
import {
  Coins,
  RefreshCw,
  ShoppingBag,
  Gem,
  Sparkles,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { formatStatName } from '../../game/utils/tooltipFormatters';
import { MERCHANT } from '../../game/config';
import { calculateMerchantRerollCost } from '../../game/systems/ScalingSystem';
import { resolveItemArt, getActivityArt } from '../../game/constants/artRegistry';
import { SceneBackdrop } from '../../components/layout/SceneBackdrop';
import ArtIcon from '../../components/shared/ArtIcon';
import {
  itemMatchesEquipmentFocus,
  isFocusStat,
} from '../../game/utils/itemFocusMatch';
import { alignItemTileTooltip } from '../../utils/itemTileTooltip';
import './Merchant.css';

interface MerchantProps {
  merchantItems: Item[];
  discountPercent: number;
  player: Player | null;
  dangerLevel: number;
  baseDifficulty: number;
  /** T-055: return paid price on success, null on fail */
  onBuyItem: (item: Item) => number | null | void;
  onLeave: () => void;
  onReroll: () => void;
  onBuySlot: () => void;
  onUpgradeQuality: () => void;
  isProcessing?: boolean;
  /** Biome background image — fills the scene like CinematicViewscreen. */
  background?: string;
  /**
   * T-090: region lootTheme already biases stock (T-070); show Focus/Affinity/Ryo.
   */
  lootTheme?: RegionLootTheme | null;
}

/** T-055: short purchase success toast */
interface PurchaseToast {
  item: Item;
  price: number;
}

/* ===========================================
   Helper Functions
   =========================================== */

const getRarityClass = (rarity: Rarity): string => {
  switch (rarity) {
    case Rarity.BROKEN:
      return 'broken';
    case Rarity.COMMON:
      return 'common';
    case Rarity.RARE:
      return 'rare';
    case Rarity.EPIC:
      return 'epic';
    case Rarity.LEGENDARY:
      return 'legendary';
    case Rarity.CURSED:
      return 'cursed';
    default:
      return 'common';
  }
};

const getRarityLabel = (rarity: Rarity): string => {
  switch (rarity) {
    case Rarity.LEGENDARY:
      return '\u2550\u2550 LEGENDARY \u2550\u2550';
    case Rarity.EPIC:
      return '\u2500\u2500 EPIC \u2500\u2500';
    case Rarity.RARE:
      return '\u2500\u2500 RARE \u2500\u2500';
    case Rarity.CURSED:
      return '\u2620 CURSED \u2620';
    case Rarity.BROKEN:
      return '\u00b7\u00b7 BROKEN \u00b7\u00b7';
    default:
      return '\u00b7\u00b7 COMMON \u00b7\u00b7';
  }
};

/* ===========================================
   Ryo Display Component
   =========================================== */

interface RyoDisplayProps {
  current: number;
  previewCost: number | null;
}

const RyoDisplay: React.FC<RyoDisplayProps> = ({ current, previewCost }) => {
  const afterPurchase = previewCost !== null ? current - previewCost : null;

  return (
    <div className="ryo-display">
      <Coins className="ryo-display__icon" size={18} />
      <span className="ryo-display__amount">{current} Ryo</span>
      {afterPurchase !== null && (
        <div className="ryo-display__preview">
          <span className="ryo-display__arrow">→</span>
          <span className="ryo-display__after">{afterPurchase}</span>
          <span className="ryo-display__cost">(-{previewCost})</span>
        </div>
      )}
    </div>
  );
};

/* ===========================================
   Merchant Status Component
   =========================================== */

interface MerchantStatusProps {
  quality: TreasureQuality;
  slots: number;
  maxSlots: number;
}

const MerchantStatus: React.FC<MerchantStatusProps> = ({
  quality,
  slots,
  maxSlots,
}) => {
  return (
    <div className="merchant-status">
      <span>
        Quality: <span className="merchant-status__value">{quality}</span>
      </span>
      <span>
        Slots:{' '}
        <span className="merchant-status__value">
          {slots}/{maxSlots}
        </span>
      </span>
    </div>
  );
};

/* ===========================================
   Service Button Component
   =========================================== */

interface ServiceButtonProps {
  variant: 'reroll' | 'slot' | 'quality';
  cost: number;
  onClick: () => void;
  disabled: boolean;
  label: string;
}

const ServiceButton: React.FC<ServiceButtonProps> = ({
  variant,
  cost,
  onClick,
  disabled,
  label,
}) => {
  const icons = {
    reroll: <RefreshCw size={14} />,
    slot: <ShoppingBag size={14} />,
    quality: <Gem size={14} />,
  };

  return (
    <button
      type="button"
      className={`service-button service-button--${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="service-button__icon">{icons[variant]}</span>
      <span>{label}</span>
      <span className="service-button__cost">({cost} Ryo)</span>
    </button>
  );
};

/* ===========================================
   Item Card Component
   =========================================== */

interface StatComparison {
  value: number;
  delta: number;
  isNew: boolean;
}

interface ItemCardProps {
  item: Item;
  price: number;
  affordable: boolean;
  /** Ryo shortfall when unaffordable (Waves poverty readability). */
  shortfall: number;
  /** True when bag has no free slot — buy would soft-fail. */
  bagFull: boolean;
  playerRyo: number;
  statComparisons: Record<string, StatComparison>;
  isSelected: boolean;
  isDimmed: boolean;
  discountPercent: number;
  onSelect: () => void;
  onBuy: () => void;
  isProcessing?: boolean;
  /** T-091: region equipmentFocus for badge */
  equipmentFocus?: string[] | null;
  /** Region economy lean (goldMultiplier < 1). */
  leanEconomy?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  price,
  affordable,
  shortfall,
  bagFull,
  playerRyo,
  statComparisons,
  isSelected,
  isDimmed,
  discountPercent,
  onSelect,
  onBuy,
  isProcessing = false,
  equipmentFocus = null,
  leanEconomy = false,
}) => {
  const rarityClass = getRarityClass(item.rarity);
  const rarityLabel = getRarityLabel(item.rarity);
  const isFocusItem = itemMatchesEquipmentFocus(item, equipmentFocus);
  const canBuy = affordable && !bagFull && !isProcessing;
  const afterBuy = canBuy ? playerRyo - price : null;

  const handleClick = useCallback(() => {
    onSelect();
  }, [onSelect]);

  const handleBuy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (canBuy) {
      onBuy();
    }
  }, [canBuy, onBuy]);

  return (
    <div
      className={`item-card item-tile item-card--${rarityClass} ${
        isSelected ? 'item-card--selected' : ''
      } ${isDimmed ? 'item-card--dimmed' : ''} ${
        !affordable || bagFull ? 'item-card--unaffordable' : ''
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={isDimmed ? -1 : 0}
      onMouseEnter={(e) => alignItemTileTooltip(e.currentTarget)}
      onFocus={(e) => alignItemTileTooltip(e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Detail tooltip — hover / keyboard focus. Hidden while the card is
          selected (the PreviewPanel already shows the full details). */}
      <div className="item-tile__tooltip" role="tooltip">
        <div className={`item-tooltip__name item-card__name--${rarityClass}`}>{item.name}</div>
        <div className="item-tooltip__type">{item.rarity} {item.type}</div>
        {item.description && (
          <div className="item-tooltip__desc">{item.description}</div>
        )}
        <div className="item-tooltip__section">
          {Object.entries(statComparisons)
            .filter(([, data]) => data.value !== 0 || data.delta !== 0)
            .map(([key, data]) => (
              <div
                key={key}
                className={`item-tooltip__row ${isFocusStat(key, equipmentFocus) ? 'item-tooltip__row--focus' : ''}`}
              >
                <span className="item-tooltip__label">
                  {formatStatName(key)}
                  {isFocusStat(key, equipmentFocus) && (
                    <span className="item-tooltip__focus-mark"> ★</span>
                  )}
                </span>
                <div className="item-tooltip__values">
                  <span className="item-tooltip__value">+{data.value}</span>
                  {data.delta !== 0 && !data.isNew && (
                    <span className={data.delta > 0 ? 'item-tooltip__delta--positive' : 'item-tooltip__delta--negative'}>
                      {data.delta > 0 ? '▲' : '▼'}{Math.abs(data.delta)}
                    </span>
                  )}
                  {data.isNew && <span className="item-tooltip__delta--new">NEW</span>}
                </div>
              </div>
            ))}
        </div>
        <div className="item-tooltip__section">
          <div className="item-tooltip__row">
            <span className="item-tooltip__label">Price</span>
            <span className={affordable && !bagFull ? 'item-tooltip__value' : 'item-tooltip__delta--negative'}>
              {price} Ryo
            </span>
          </div>
          {!affordable && shortfall > 0 && (
            <div className="item-tooltip__row">
              <span className="item-tooltip__label">Purse</span>
              <span className="item-tooltip__delta--negative">short {shortfall}</span>
            </div>
          )}
          {bagFull && (
            <div className="item-tooltip__row">
              <span className="item-tooltip__label">Bag</span>
              <span className="item-tooltip__delta--negative">full — free a pocket</span>
            </div>
          )}
          {canBuy && afterBuy !== null && (
            <div className="item-tooltip__row">
              <span className="item-tooltip__label">After</span>
              <span className="item-tooltip__value">{afterBuy} Ryo</span>
            </div>
          )}
          {leanEconomy && (
            <div className="item-tooltip__synth">Wave Country · lean ryo economy</div>
          )}
        </div>
      </div>

      {/* Frame overlay */}
      <div className="item-card__frame" />

      {/* Corner ornaments */}
      <div className="item-card__corner item-card__corner--tl" />
      <div className="item-card__corner item-card__corner--tr" />
      <div className="item-card__corner item-card__corner--bl" />
      <div className="item-card__corner item-card__corner--br" />

      {/* Content */}
      <div className="item-card__content">
        {/* Header */}
        <div className="item-card__header">
          <span className={`item-card__rarity-tag item-card__rarity-tag--${rarityClass}`}>
            {rarityLabel}
          </span>
          <span className="item-card__header-right">
            {isFocusItem && (
              <span className="item-card__focus-badge" title="Matches region Focus stats">
                Focus
              </span>
            )}
            <span
              className={`item-card__afford-indicator ${
                canBuy
                  ? 'item-card__afford-indicator--ok'
                  : 'item-card__afford-indicator--risk'
              }`}
            >
              {canBuy ? (
                <CheckCircle size={14} />
              ) : (
                <AlertTriangle size={14} />
              )}
            </span>
          </span>
        </div>

        {/* The item IS the asset */}
        <div className="item-tile__visual" aria-hidden="true">
          <ArtIcon art={resolveItemArt(item)} size="fill" title={item.name} />
        </div>

        {/* Item Info */}
        <div className="item-card__info">
          <h3 className={`item-card__name item-card__name--${rarityClass}`}>
            {item.name}
          </h3>
        </div>

        {/* Footer — price + risk readable for Waves poverty */}
        <div className="item-card__footer">
          <div className="item-card__price">
            <span
              className={`item-card__price-current ${
                canBuy
                  ? 'item-card__price-current--affordable'
                  : 'item-card__price-current--unaffordable'
              }`}
            >
              {price} Ryo
            </span>
            {discountPercent > 0 && (
              <span className="item-card__price-original">
                {Math.floor(item.value * MERCHANT.ITEM_PRICE_MULTIPLIER)}
              </span>
            )}
            {bagFull && (
              <div className="item-card__price-shortfall" title="Bag has no free slots">
                Bag full
              </div>
            )}
            {!bagFull && !affordable && shortfall > 0 && (
              <div className="item-card__price-shortfall" title="Ryo shortfall">
                Purse short {shortfall}
              </div>
            )}
            {canBuy && afterBuy !== null && afterBuy < price && leanEconomy && (
              <div className="item-card__price-after" title="Ryo remaining after purchase">
                → {afterBuy} left
              </div>
            )}
          </div>
          <button
            type="button"
            className={`item-card__buy-button ${
              canBuy ? 'item-card__buy-button--affordable' : 'item-card__buy-button--unaffordable'
            }`}
            onClick={handleBuy}
            disabled={!canBuy}
          >
            {bagFull ? 'BAG FULL' : affordable ? (isProcessing ? '…' : 'BUY') : 'THIN PURSE'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ===========================================
   Preview Panel Component
   =========================================== */

interface PreviewPanelProps {
  item: Item;
  price: number;
  affordable: boolean;
  shortfall: number;
  bagFull: boolean;
  playerRyo: number;
  statComparisons: Record<string, StatComparison>;
  discountPercent: number;
  equippedItemName: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
  /** T-091 */
  equipmentFocus?: string[] | null;
  leanEconomy?: boolean;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  item,
  price,
  affordable,
  shortfall,
  bagFull,
  playerRyo,
  statComparisons,
  discountPercent,
  equippedItemName,
  onConfirm,
  onCancel,
  isProcessing,
  equipmentFocus = null,
  leanEconomy = false,
}) => {
  const rarityClass = getRarityClass(item.rarity);
  const rarityLabel = getRarityLabel(item.rarity);
  const isFocusItem = itemMatchesEquipmentFocus(item, equipmentFocus);
  const canBuy = affordable && !bagFull && !isProcessing;
  const afterBuy = canBuy ? playerRyo - price : null;

  return (
    <div className="preview-panel">
      {/* Header — asset first */}
      <div className="preview-panel__header">
        <div className="preview-panel__label">Item Preview</div>
        <div className="item-tile__visual item-tile__visual--hero preview-panel__art" aria-hidden="true">
          <ArtIcon art={resolveItemArt(item)} size="fill" title={item.name} />
        </div>
        <div className={`preview-panel__rarity item-card__name--${rarityClass}`}>
          {rarityLabel}
          {isFocusItem && (
            <span className="preview-panel__focus-badge" title="Matches region Focus">
              Focus
            </span>
          )}
        </div>
        <h2 className={`preview-panel__name item-card__name--${rarityClass}`}>
          {item.name}
        </h2>
        <p className="preview-panel__type">{item.type} Equipment</p>
      </div>

      {/* Description */}
      {item.description && (
        <p className="preview-panel__description">"{item.description}"</p>
      )}

      {/* Stat Comparison */}
      <div className="preview-panel__stats">
        <div className="preview-panel__stats-header">Stat Comparison</div>
        {Object.entries(statComparisons)
          .filter(([, data]) => data.value !== 0 || data.delta !== 0)
          .map(([key, data]) => (
            <div
              key={key}
              className={`preview-panel__stat ${isFocusStat(key, equipmentFocus) ? 'preview-panel__stat--focus' : ''}`}
            >
              <span className="preview-panel__stat-name">
                {formatStatName(key)}
                {isFocusStat(key, equipmentFocus) && (
                  <span className="preview-panel__focus-mark" title="Region Focus stat"> ★</span>
                )}
              </span>
              <div className="preview-panel__stat-values">
                <span className="preview-panel__stat-value">+{data.value}</span>
                {data.delta !== 0 && !data.isNew && (
                  <span
                    className={`preview-panel__stat-delta ${
                      data.delta > 0
                        ? 'preview-panel__stat-delta--increase'
                        : 'preview-panel__stat-delta--decrease'
                    }`}
                  >
                    ({data.delta > 0 ? '+' : ''}
                    {data.delta})
                  </span>
                )}
                {data.isNew && (
                  <span className="preview-panel__stat-delta preview-panel__stat-delta--new">
                    (NEW)
                  </span>
                )}
              </div>
            </div>
          ))}
        <div className="preview-panel__currently">
          Currently: {equippedItemName || '— vacant groove —'}
        </div>
      </div>

      {/* Price + risk (Waves poverty) */}
      <div
        className={`preview-panel__price ${
          !affordable || bagFull ? 'preview-panel__price--risk' : ''
        }`}
      >
        <div className="preview-panel__price-label">Price</div>
        <span
          className={`preview-panel__price-value ${
            canBuy
              ? 'preview-panel__price-value--affordable'
              : 'preview-panel__price-value--unaffordable'
          }`}
        >
          {price} Ryo
        </span>
        {discountPercent > 0 && (
          <>
            <span className="preview-panel__price-original">
              {Math.floor(item.value * MERCHANT.ITEM_PRICE_MULTIPLIER)}
            </span>
            <div className="preview-panel__price-discount">
              {discountPercent}% OFF!
            </div>
          </>
        )}
        {canBuy && afterBuy !== null && (
          <div className="preview-panel__price-after">
            Purse after: <strong>{afterBuy}</strong> Ryo
          </div>
        )}
        {bagFull && (
          <div className="preview-panel__price-shortfall">
            Bag is full — equip or sell a piece before buying
          </div>
        )}
        {!bagFull && !affordable && shortfall > 0 && (
          <div className="preview-panel__price-shortfall">
            Purse runs short — need <strong>{shortfall}</strong> more Ryo
            {leanEconomy && <span className="preview-panel__lean"> · lean region</span>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="preview-panel__actions">
        <button
          type="button"
          className="preview-panel__confirm"
          onClick={onConfirm}
          disabled={!canBuy}
        >
          <Sparkles size={16} />
          <span>
            {bagFull
              ? 'Bag full'
              : affordable
                ? isProcessing
                  ? 'Purchasing…'
                  : 'Confirm Purchase'
                : 'Purse too thin'}
          </span>
        </button>
        <button type="button" className="preview-panel__cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

/* ===========================================
   Main Merchant Component
   =========================================== */

const Merchant: React.FC<MerchantProps> = ({
  merchantItems,
  discountPercent,
  player,
  dangerLevel,
  baseDifficulty,
  onBuyItem,
  onLeave,
  onReroll,
  onBuySlot,
  onUpgradeQuality,
  isProcessing = false,
  background,
  lootTheme = null,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  // T-055: brief purchase success toast
  const [purchaseToast, setPurchaseToast] = useState<PurchaseToast | null>(null);

  const rerollCost = calculateMerchantRerollCost(
    dangerLevel,
    baseDifficulty,
    MERCHANT.REROLL_BASE_COST,
    MERCHANT.REROLL_FLOOR_SCALING
  );

  const getPrice = useCallback(
    (item: Item) => {
      const basePrice = item.value * MERCHANT.ITEM_PRICE_MULTIPLIER;
      return Math.floor(basePrice * (1 - discountPercent / 100));
    },
    [discountPercent]
  );

  const canAfford = useCallback(
    (item: Item) => {
      return player !== null && player.ryo >= getPrice(item);
    },
    [player, getPrice]
  );

  const getStatComparisons = useCallback(
    (item: Item): Record<string, StatComparison> => {
      if (!player) return {};

      const targetSlot = item.type ? SLOT_MAPPING[item.type] : EquipmentSlot.SLOT_1;
      const equippedItem = player.equipment[targetSlot];
      const comparisons: Record<string, StatComparison> = {};

      // Add stats from new item
      Object.entries(item.stats).forEach(([key, val]) => {
        const equippedVal =
          equippedItem?.stats[key as keyof typeof equippedItem.stats] || 0;
        comparisons[key] = {
          value: val as number,
          delta: (val as number) - (equippedVal as number),
          isNew: !equippedItem,
        };
      });

      // Add stats that would be lost
      if (equippedItem) {
        Object.entries(equippedItem.stats).forEach(([key, val]) => {
          if (!(key in comparisons) && val) {
            comparisons[key] = {
              value: 0,
              delta: -(val as number),
              isNew: false,
            };
          }
        });
      }

      return comparisons;
    },
    [player]
  );

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return merchantItems.find((item) => item.id === selectedItemId) || null;
  }, [selectedItemId, merchantItems]);

  const selectedPrice = selectedItem ? getPrice(selectedItem) : null;

  const getEquippedItemName = useCallback(
    (item: Item): string | null => {
      if (!player) return null;
      const targetSlot = item.type ? SLOT_MAPPING[item.type] : EquipmentSlot.SLOT_1;
      const equippedItem = player.equipment[targetSlot];
      return equippedItem?.name || null;
    },
    [player]
  );

  const handleSelect = useCallback((itemId: string) => {
    setSelectedItemId((prev) => (prev === itemId ? null : itemId));
  }, []);

  const showPurchaseToast = useCallback((item: Item, price: number) => {
    setPurchaseToast({ item, price });
  }, []);

  const tryBuy = useCallback(
    (item: Item) => {
      const paid = onBuyItem(item);
      if (typeof paid === 'number' && paid >= 0) {
        showPurchaseToast(item, paid);
        setSelectedItemId(null);
      }
    },
    [onBuyItem, showPurchaseToast],
  );

  const handleConfirmPurchase = useCallback(() => {
    if (selectedItem) {
      tryBuy(selectedItem);
    }
  }, [selectedItem, tryBuy]);

  const handleCancel = useCallback(() => {
    setSelectedItemId(null);
  }, []);

  // Auto-dismiss purchase toast
  useEffect(() => {
    if (!purchaseToast) return;
    const t = setTimeout(() => setPurchaseToast(null), 2200);
    return () => clearTimeout(t);
  }, [purchaseToast]);

  // ESC: dismiss toast → close selection → leave shop (R1 friction)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (e.repeat) return;
      e.preventDefault();
      if (purchaseToast) {
        setPurchaseToast(null);
        return;
      }
      if (selectedItemId) {
        setSelectedItemId(null);
        return;
      }
      onLeave();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedItemId, purchaseToast, onLeave]);

  if (!player) {
    return null;
  }

  const slotCost = MERCHANT.SLOT_COSTS[player.merchantSlots] || 999999;
  const qualityCost =
    player.treasureQuality === TreasureQuality.BROKEN
      ? MERCHANT.QUALITY_UPGRADE_COSTS.COMMON
      : MERCHANT.QUALITY_UPGRADE_COSTS.RARE;

  const leanEconomy = Boolean(lootTheme && lootTheme.goldMultiplier < 1);
  const merchantArt = getActivityArt('merchant');
  const bagFull = !player.bag.some((s) => s === null);

  return (
    <SceneBackdrop background={background}>
    <div className={`merchant ${leanEconomy ? 'merchant--lean' : ''}`}>
      {/* Mobile bottom-sheet backdrop */}
      {selectedItem && (
        <div
          className="merchant__sheet-backdrop"
          onClick={handleCancel}
          aria-hidden="true"
        />
      )}

      {/* Top HUD: NPC left · identity center · purse right — no ornate bar */}
      <header className="merchant__top">
        <div className="merchant__npc">
          <div className="merchant__npc-frame">
            <ArtIcon
              art={merchantArt}
              size="fill"
              title="Traveling Merchant"
              className="merchant__npc-art"
            />
          </div>
          <div className="merchant__npc-meta">
            <div className="merchant__npc-nameplate">
              <span className="merchant__npc-role">Traveling Merchant</span>
              {discountPercent > 0 && (
                <span className="merchant__discount-badge">{discountPercent}% OFF</span>
              )}
            </div>
            <p className="merchant__npc-quote">
              {leanEconomy
                ? 'Coin is thin here. Spend carefully — or walk hungry.'
                : 'Finest wares from the far corners of the shinobi world.'}
            </p>
            {lootTheme && (
              <div className="merchant__theme" aria-label="Region shop bias">
                {lootTheme.primaryElement && (
                  <span className="merchant__theme-chip merchant__theme-chip--affinity">
                    Affinity {lootTheme.primaryElement}
                  </span>
                )}
                {lootTheme.equipmentFocus?.length > 0 && (
                  <span className="merchant__theme-chip merchant__theme-chip--focus">
                    Focus{' '}
                    {lootTheme.equipmentFocus
                      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                      .join(' · ')}
                  </span>
                )}
                {lootTheme.goldMultiplier !== 1 && (
                  <span
                    className={`merchant__theme-chip merchant__theme-chip--gold ${
                      leanEconomy ? 'merchant__theme-chip--lean' : ''
                    }`}
                  >
                    Ryo ×{lootTheme.goldMultiplier}
                    {leanEconomy ? ' · Lean' : ''}
                  </span>
                )}
              </div>
            )}
            {leanEconomy && (
              <p className="merchant__lean-note" role="note">
                Lean economy — check shortfall before you buy.
              </p>
            )}
          </div>
        </div>

        <div className="merchant__hud">
          <RyoDisplay current={player.ryo} previewCost={selectedPrice} />
          <MerchantStatus
            quality={player.treasureQuality}
            slots={player.merchantSlots}
            maxSlots={MAX_MERCHANT_SLOTS}
          />
        </div>
      </header>

      {/* Services + leave on one tool strip */}
      <div className="merchant__toolbar">
        <div className="merchant__services">
          <ServiceButton
            variant="reroll"
            cost={rerollCost}
            label="Reroll"
            onClick={onReroll}
            disabled={isProcessing || player.ryo < rerollCost}
          />
          {player.merchantSlots < MAX_MERCHANT_SLOTS && (
            <ServiceButton
              variant="slot"
              cost={slotCost}
              label="+1 Slot"
              onClick={onBuySlot}
              disabled={isProcessing || player.ryo < slotCost}
            />
          )}
          {player.treasureQuality !== TreasureQuality.RARE && (
            <ServiceButton
              variant="quality"
              cost={qualityCost}
              label="Quality ↑"
              onClick={onUpgradeQuality}
              disabled={isProcessing || player.ryo < qualityCost}
            />
          )}
        </div>
        <button
          type="button"
          className="merchant__leave-button"
          onClick={onLeave}
        >
          Leave shop
          <span className="sw-shortcut">Esc</span>
        </button>
      </div>

      {/* Wares — primary stage */}
      {merchantItems.length === 0 ? (
        <div className="merchant__empty" role="status">
          <p className="merchant__empty-title">The cart is bare</p>
          <p className="merchant__empty-body">
            Dust settles where wares once waited. Reroll the stock — or walk on into the mist.
          </p>
        </div>
      ) : (
        <div
          className={`merchant__content ${
            selectedItem ? 'merchant__content--with-preview' : ''
          }`}
        >
          <div
            className={`item-grid ${
              selectedItem ? 'item-grid--with-selection' : ''
            }`}
          >
            {merchantItems.map((item) => {
              const price = getPrice(item);
              const affordable = canAfford(item);
              const shortfall = affordable ? 0 : Math.max(0, price - player.ryo);
              return (
                <ItemCard
                  key={item.id}
                  item={item}
                  price={price}
                  affordable={affordable}
                  shortfall={shortfall}
                  bagFull={bagFull}
                  playerRyo={player.ryo}
                  statComparisons={getStatComparisons(item)}
                  isSelected={selectedItemId === item.id}
                  isDimmed={selectedItemId !== null && selectedItemId !== item.id}
                  discountPercent={discountPercent}
                  onSelect={() => handleSelect(item.id)}
                  onBuy={() => tryBuy(item)}
                  isProcessing={isProcessing}
                  equipmentFocus={lootTheme?.equipmentFocus}
                  leanEconomy={leanEconomy}
                />
              );
            })}
          </div>

          {selectedItem && (
            <PreviewPanel
              item={selectedItem}
              price={getPrice(selectedItem)}
              affordable={canAfford(selectedItem)}
              shortfall={Math.max(0, getPrice(selectedItem) - player.ryo)}
              bagFull={bagFull}
              playerRyo={player.ryo}
              statComparisons={getStatComparisons(selectedItem)}
              discountPercent={discountPercent}
              equippedItemName={getEquippedItemName(selectedItem)}
              onConfirm={handleConfirmPurchase}
              onCancel={handleCancel}
              isProcessing={isProcessing}
              equipmentFocus={lootTheme?.equipmentFocus}
              leanEconomy={leanEconomy}
            />
          )}
        </div>
      )}

      {/* T-055: purchase success toast */}
      {purchaseToast && (
        <div
          className="merchant-toast"
          role="status"
          onClick={() => setPurchaseToast(null)}
        >
          <div className="merchant-toast__panel">
            <ArtIcon
              art={resolveItemArt(purchaseToast.item)}
              size="lg"
              className="merchant-toast__art"
              title={purchaseToast.item.name}
            />
            <div className="merchant-toast__copy">
              <span className="merchant-toast__label">Purchased</span>
              <span className="merchant-toast__name">{purchaseToast.item.name}</span>
              <span className="merchant-toast__price">−{purchaseToast.price} Ryō · bag</span>
            </div>
            <CheckCircle size={18} className="merchant-toast__ok" aria-hidden />
          </div>
        </div>
      )}
    </div>
    </SceneBackdrop>
  );
};

export default Merchant;
