import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Item,
  Skill,
  Player,
  SkillTier,
  Rarity,
  EquipmentSlot,
  DamageType,
  MAX_BAG_SLOTS,
  SLOT_MAPPING,
  RegionLootTheme,
  ComponentId,
  ActionType,
} from '../../game/types';
import { canLearnSkill } from '../../game/systems/StatSystem';
import { canAddPlayableSkill } from '../../game/systems/DeckSystem';
import { LaunchProperties } from '../../config/featureFlags';
import { Scroll, Package } from 'lucide-react';
import { SceneBackdrop } from '../../components/layout/SceneBackdrop';
import {
  formatStatName,
  formatScalingStat,
  getStatColor,
  getElementColor,
  getEffectColor,
  getEffectIcon,
  formatEffectDescription,
} from '../../game/utils/tooltipFormatters';
import { getRecipesUsingComponent } from '../../game/constants/synthesis';
import { COMPONENT_DEFINITIONS } from '../../game/constants/components';
import {
  resolveItemArt,
  getSkillArt,
  getArtifactArt,
  getComponentArt,
} from '../../game/constants/artRegistry';

import {
  itemMatchesEquipmentFocus,
  isFocusStat,
} from '../../game/utils/itemFocusMatch';

import ArtIcon from '../../components/shared/ArtIcon';
import { alignItemTileTooltip } from '../../utils/itemTileTooltip';
import './Loot.css';

/** Max synthesis recipe names shown in component tooltip (TFT readability). */
const SYNTH_TOOLTIP_PREVIEW = 4;

interface LootProps {
  droppedItems: Item[];
  droppedSkill: Skill | null;
  player: Player | null;
  playerStats: any;
  onEquipItem: (item: Item) => void;
  /** @deprecated Sell only at merchant — prop ignored if passed */
  onSellItem?: (item: Item) => void;
  onStoreToBag?: (item: Item) => void;
  onLearnSkill: (skill: Skill, slotIndex?: number) => void;
  onLeaveAll: () => void;
  getRarityColor: (rarity: Rarity) => string;
  getDamageTypeColor: (dt: DamageType) => string;
  isProcessing?: boolean;
  /** Biome background image — fills the scene like CinematicViewscreen. */
  background?: string;
  /**
   * T-093: region lootTheme already biases combat drops; show Focus cues.
   */
  lootTheme?: RegionLootTheme | null;
}

// Helper to get rarity name class
const getRarityClass = (rarity: Rarity): string => {
  switch (rarity) {
    case Rarity.BROKEN:    return 'loot-card__name--broken';
    case Rarity.RARE:      return 'loot-card__name--rare';
    case Rarity.EPIC:      return 'loot-card__name--epic';
    case Rarity.LEGENDARY: return 'loot-card__name--legendary';
    case Rarity.CURSED:    return 'loot-card__name--cursed';
    default:               return 'loot-card__name--common';
  }
};

// Helper to get rarity border class for the card itself
const getCardRarityClass = (rarity: Rarity): string => {
  switch (rarity) {
    case Rarity.BROKEN:    return 'loot-card--broken';
    case Rarity.RARE:      return 'loot-card--rare';
    case Rarity.EPIC:      return 'loot-card--epic';
    case Rarity.LEGENDARY: return 'loot-card--legendary';
    case Rarity.CURSED:    return 'loot-card--cursed';
    default:               return '';
  }
};

const Loot: React.FC<LootProps> = ({
  droppedItems,
  droppedSkill,
  player,
  playerStats,
  onEquipItem,

  onStoreToBag,
  onLearnSkill,
  onLeaveAll,
  getDamageTypeColor,
  isProcessing = false,
  background,
  lootTheme = null,
}) => {
  // T-052: confirm before abandoning unclaimed spoils
  const [confirmLeave, setConfirmLeave] = useState(false);
  /**
   * Sync mutex — isProcessing alone lags; double Enter / Leave them behind
   * can call returnToMap twice (re-chain activity / double floor-complete).
   * Ref resets on remount when LOOT opens again.
   */
  const leaveLockRef = useRef(false);
  const remainingCount = useMemo(
    () => droppedItems.length + (droppedSkill ? 1 : 0),
    [droppedItems.length, droppedSkill],
  );

  const requestLeave = useCallback(() => {
    if (isProcessing || leaveLockRef.current) return;
    if (remainingCount > 0) {
      setConfirmLeave(true);
      return;
    }
    leaveLockRef.current = true;
    onLeaveAll();
  }, [isProcessing, remainingCount, onLeaveAll]);

  const confirmLeaveAll = useCallback(() => {
    // Gate again — sell/equip may have started while confirm dialog was open
    if (isProcessing || leaveLockRef.current) return;
    leaveLockRef.current = true;
    setConfirmLeave(false);
    onLeaveAll();
  }, [isProcessing, onLeaveAll]);

  // Check if bag has space
  const bagHasSpace = player ? player.bag.some(s => s === null) : false;
  const bagSlotCount = player?.bag.filter(s => s !== null).length || 0;

  /** First unclaimed spoil — Z equip / X store act on this card. */
  const primaryItem = droppedItems[0] ?? null;

  // Keep latest handlers/items in refs so the window listener never goes stale
  const equipRef = useRef(onEquipItem);
  const storeRef = useRef(onStoreToBag);
  const primaryRef = useRef(primaryItem);
  const bagSpaceRef = useRef(bagHasSpace);
  equipRef.current = onEquipItem;
  storeRef.current = onStoreToBag;
  primaryRef.current = primaryItem;
  bagSpaceRef.current = bagHasSpace;

  // Keyboard: Z equip · X store · SPACE/ENTER leave; Esc cancels confirm
  // Capture phase so other shell listeners cannot swallow Z/X first.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const t = e.target;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        (t instanceof HTMLElement && t.isContentEditable)
      ) {
        return;
      }
      if (isProcessing) return;

      if (e.key === 'Escape' && confirmLeave) {
        e.preventDefault();
        e.stopPropagation();
        setConfirmLeave(false);
        return;
      }

      if (confirmLeave) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          confirmLeaveAll();
        }
        return;
      }

      // Z — equip first spoil (physical KeyZ; Spanish layout safe)
      if (e.code === 'KeyZ') {
        const item = primaryRef.current;
        if (item) {
          e.preventDefault();
          e.stopPropagation();
          equipRef.current(item);
        }
        return;
      }

      // X — store first spoil in bag
      if (e.code === 'KeyX') {
        const item = primaryRef.current;
        const store = storeRef.current;
        if (item && store && bagSpaceRef.current) {
          e.preventDefault();
          e.stopPropagation();
          store(item);
        }
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        requestLeave();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isProcessing, confirmLeave, confirmLeaveAll, requestLeave]);

  return (
    <SceneBackdrop background={background}>
    <div className="loot">
      {/* Victory header — dramatic scene presence */}
      <div className="loot__victory-header">
        <h2 className="loot__victory-title">VICTORY</h2>
        <p className="loot__victory-subtitle">
          {remainingCount === 0
            ? 'The field is quiet — only dust and victory remain'
            : `Take each spoil${remainingCount > 1 ? ` (${remainingCount} left)` : ''}`}
        </p>
        {/* T-093: drops already bias via lootTheme — surface region identity */}
        {lootTheme && (
          <div className="loot__theme" aria-label="Region loot theme">
            {lootTheme.primaryElement && (
              <span className="loot__theme-chip loot__theme-chip--affinity">
                Affinity {lootTheme.primaryElement}
              </span>
            )}
            {lootTheme.equipmentFocus?.length > 0 && (
              <span className="loot__theme-chip loot__theme-chip--focus">
                Focus{' '}
                {lootTheme.equipmentFocus
                  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                  .join(' · ')}
              </span>
            )}
            {lootTheme.goldMultiplier !== 1 && (
              <span className="loot__theme-chip loot__theme-chip--gold">
                Ryo ×{lootTheme.goldMultiplier}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Keyboard Hints */}
      <div className="loot__hints">
        {remainingCount > 0 && droppedItems.length > 0 && (
          <span className="loot__hint">
            <span className="sw-shortcut">Z</span> Equip
            {onStoreToBag && (
              <>
                {' · '}
                <span className="sw-shortcut">X</span> Store
              </>
            )}
          </span>
        )}
        <span className="loot__hint">
          <span className="sw-shortcut">Space</span> or <span className="sw-shortcut">Enter</span>{' '}
          {remainingCount === 0 ? 'Step onward' : 'Leave the spoils'}
          {remainingCount > 0 ? ' (confirm if unclaimed)' : ''}
        </span>
        {remainingCount > 0 && (
          <span className="loot__remaining-badge" title="Spoils still on the field">
            {remainingCount} unclaimed
          </span>
        )}
      </div>

      <div className="loot__grid">
        {remainingCount === 0 && (
          <div className="loot__empty" role="status">
            <p className="loot__empty-title">Nothing left to take</p>
            <p className="loot__empty-body">
              The mist reclaims what you left behind. Step onward when the silence settles.
            </p>
          </div>
        )}
        {droppedItems.map(item => {
          // Calculate stat comparison with currently equipped item
          const targetSlot = item.type ? SLOT_MAPPING[item.type] : EquipmentSlot.SLOT_1;
          const equippedItem = player?.equipment[targetSlot];
          const statComparisons: Record<string, { value: number; delta: number }> = {};

          Object.entries(item.stats).forEach(([key, val]) => {
            const equippedVal = equippedItem?.stats[key as keyof typeof equippedItem.stats] || 0;
            statComparisons[key] = {
              value: val as number,
              delta: (val as number) - (equippedVal as number)
            };
          });

          if (equippedItem) {
            Object.entries(equippedItem.stats).forEach(([key, val]) => {
              if (!(key in statComparisons) && val) {
                statComparisons[key] = {
                  value: 0,
                  delta: -(val as number)
                };
              }
            });
          }

          const isFocusItem = itemMatchesEquipmentFocus(item, lootTheme?.equipmentFocus);

          return (
            <div
              key={item.id}
              className={`loot-card item-tile ${item.isComponent ? 'loot-card--component' : ''} ${getCardRarityClass(item.rarity)}`}
              tabIndex={0}
              onMouseEnter={(e) => alignItemTileTooltip(e.currentTarget)}
              onFocus={(e) => alignItemTileTooltip(e.currentTarget)}
            >
              {/* Detail tooltip — hover / keyboard focus / touch tap (focus) */}
              <div className="item-tile__tooltip" role="tooltip">
                <div className={`item-tooltip__name ${getRarityClass(item.rarity)}`}>{item.name}</div>
                <div className="item-tooltip__type">
                  {item.rarity} {item.isComponent ? 'Component' : (item.type || 'Artifact')}
                  {isFocusItem && <span className="loot-tooltip__focus"> · Focus</span>}
                </div>
                {item.description && !item.passive && (
                  <div className="item-tooltip__desc">{item.description}</div>
                )}
                {!item.isComponent && item.passive && (
                  <div className="item-tooltip__passive">Passive: {item.description}</div>
                )}

                {/* Stats with comparison vs equipped */}
                {Object.keys(statComparisons).length > 0 && (
                  <div className="item-tooltip__section">
                    {Object.entries(statComparisons).map(([key, data]) => (
                      <div
                        key={key}
                        className={`item-tooltip__row ${isFocusStat(key, lootTheme?.equipmentFocus) ? 'item-tooltip__row--focus' : ''}`}
                      >
                        <span className="item-tooltip__label">
                          {formatStatName(key)}
                          {isFocusStat(key, lootTheme?.equipmentFocus) && (
                            <span className="item-tooltip__focus-mark"> ★</span>
                          )}
                        </span>
                        <div className="item-tooltip__values">
                          <span className="item-tooltip__value">+{data.value}</span>
                          {equippedItem && data.delta !== 0 && (
                            <span className={data.delta > 0 ? 'item-tooltip__delta--positive' : 'item-tooltip__delta--negative'}>
                              ({data.delta > 0 ? '+' : ''}{data.delta})
                            </span>
                          )}
                          {!equippedItem && (
                            <span className="item-tooltip__delta--new">(new)</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TFT/StS synthesis — result identity first, partner need second */}
                {item.isComponent && item.componentId && (() => {
                  const recipes = getRecipesUsingComponent(item.componentId);
                  const preview = recipes.slice(0, SYNTH_TOOLTIP_PREVIEW);
                  const rest = recipes.length - preview.length;
                  const selfId = item.componentId as ComponentId;
                  return (
                    <div className="item-tooltip__synth">
                      <div className="item-tooltip__synth-title">
                        Forge → {recipes.length} artifact{recipes.length === 1 ? '' : 's'}
                      </div>
                      <ul className="item-tooltip__synth-list">
                        {preview.map((r) => {
                          const partnerId =
                            r.recipe[0] === selfId ? r.recipe[1] : r.recipe[0];
                          const partnerName =
                            COMPONENT_DEFINITIONS[partnerId]?.name ?? partnerId;
                          return (
                            <li key={r.name} className="item-tooltip__synth-item">
                              <ArtIcon art={getArtifactArt(r.name)} size="xs" title={r.name} />
                              <span className="item-tooltip__synth-result">{r.name}</span>
                              <span className="item-tooltip__synth-partner" title={partnerName}>
                                +
                                <ArtIcon
                                  art={getComponentArt(partnerId)}
                                  size="xs"
                                  title={partnerName}
                                />
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      {rest > 0 && (
                        <div className="item-tooltip__synth-more">+{rest} more on bag synthesize</div>
                      )}
                    </div>
                  );
                })()}

                <div className="item-tooltip__section">

                </div>
              </div>

              {/* The item IS the asset — fills the void plate */}
              <div className="item-tile__visual" aria-hidden="true">
                <ArtIcon art={resolveItemArt(item)} size="fill" title={item.name} />
              </div>

              <div className="loot-card__header">
                <div className="loot-card__title-row">
                  <h3 className={`loot-card__name ${getRarityClass(item.rarity)}`}>{item.name}</h3>
                  {isFocusItem && (
                    <span className="loot-card__focus-badge" title="Matches region Focus stats">
                      Focus
                    </span>
                  )}
                </div>
                <p className="loot-card__type">
                  {item.isComponent ? 'Component' : (item.type || 'Artifact')} - {item.rarity}
                </p>
              </div>

              {/* Micro chips only — full stats live in tooltip depth */}
              {Object.keys(statComparisons).length > 0 && (
                <div className="item-tile__stat-chips" aria-hidden="true">
                  {Object.entries(statComparisons)
                    .filter(([, d]) => d.value !== 0)
                    .slice(0, 3)
                    .map(([key, data]) => (
                      <span
                        key={key}
                        className={`item-tile__stat-chip ${
                          isFocusStat(key, lootTheme?.equipmentFocus) ? 'item-tile__stat-chip--focus' : ''
                        }`}
                      >
                        {formatStatName(key)} +{data.value}
                      </span>
                    ))}
                </div>
              )}

              {/* Action buttons */}
              <div className={`loot-card__actions ${onStoreToBag ? 'loot-card__actions--three' : 'loot-card__actions--two'}`}>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={(e) => { e.stopPropagation(); onEquipItem(item); }}
                  className="loot-card__btn loot-card__btn--equip"
                  title={item.id === primaryItem?.id ? 'Equip (Z)' : 'Equip'}
                >
                  Equip
                  {item.id === primaryItem?.id && (
                    <span className="sw-shortcut">Z</span>
                  )}
                </button>
                {onStoreToBag && (
                  <button
                    type="button"
                    disabled={isProcessing || !bagHasSpace}
                    onClick={(e) => { e.stopPropagation(); onStoreToBag(item); }}
                    className={`loot-card__btn ${bagHasSpace ? 'loot-card__btn--store' : 'loot-card__btn--store-disabled'}`}
                    title={
                      bagHasSpace
                        ? `Store in bag (${bagSlotCount}/${MAX_BAG_SLOTS})${item.id === primaryItem?.id ? ' · X' : ''}`
                        : 'Bag is full'
                    }
                  >
                    <Package size={12} />
                    Store
                    {item.id === primaryItem?.id && bagHasSpace && (
                      <span className="sw-shortcut">X</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {droppedSkill && playerStats && (
          <div
            className="loot-card loot-card--skill item-tile"
            tabIndex={0}
            onMouseEnter={(e) => alignItemTileTooltip(e.currentTarget)}
            onFocus={(e) => alignItemTileTooltip(e.currentTarget)}
          >
            {/* Full skill depth on hover / focus — card stays icon-first */}
            <div className="item-tile__tooltip" role="tooltip">
              <div className={`item-tooltip__name ${droppedSkill.tier === SkillTier.FORBIDDEN ? 'loot-card__name--forbidden' : 'loot-card__name--rare'}`}>
                {droppedSkill.name}
              </div>
              <div className="item-tooltip__type">Secret Scroll · {droppedSkill.tier}</div>
              {droppedSkill.description && (
                <div className="item-tooltip__desc">{droppedSkill.description}</div>
              )}
              <div className="item-tooltip__section">
                <div className="item-tooltip__row">
                  <span className="item-tooltip__label">Chakra</span>
                  <span className="item-tooltip__value item-tooltip__value--chakra">{droppedSkill.chakraCost}</span>
                </div>
                <div className="item-tooltip__row">
                  <span className="item-tooltip__label">Damage</span>
                  <span className={getDamageTypeColor(droppedSkill.damageType)}>{droppedSkill.damageType}</span>
                </div>
                <div className="item-tooltip__row">
                  <span className="item-tooltip__label">Property</span>
                  <span className="item-tooltip__value">{droppedSkill.damageProperty}</span>
                </div>
                <div className="item-tooltip__row">
                  <span className="item-tooltip__label">Scales</span>
                  <span className={getStatColor(droppedSkill.scalingStat)}>{formatScalingStat(droppedSkill.scalingStat)}</span>
                </div>
                <div className="item-tooltip__row">
                  <span className="item-tooltip__label">Element</span>
                  <span className={getElementColor(droppedSkill.element)}>{droppedSkill.element}</span>
                </div>
                {droppedSkill.requirements?.stats &&
                  Object.entries(droppedSkill.requirements.stats).map(([stat, min]) => {
                    if (min === undefined) return null;
                    const have =
                      playerStats?.effectivePrimary?.[
                        stat.toLowerCase() as keyof typeof playerStats.effectivePrimary
                      ] ?? 0;
                    const met = have >= min;
                    return (
                      <div className="item-tooltip__row" key={stat}>
                        <span className="item-tooltip__label">Requires {stat}</span>
                        <span
                          className={
                            met
                              ? 'loot-card__skill-stat-value--requirement-met'
                              : 'loot-card__skill-stat-value--requirement-not-met'
                          }
                        >
                          {min}
                        </span>
                      </div>
                    );
                  })}
                {droppedSkill.requirements?.intelligence && (
                  <div className="item-tooltip__row">
                    <span className="item-tooltip__label">Requires INT</span>
                    <span className={playerStats.effectivePrimary.intelligence >= droppedSkill.requirements.intelligence ? 'loot-card__skill-stat-value--requirement-met' : 'loot-card__skill-stat-value--requirement-not-met'}>
                      {droppedSkill.requirements.intelligence}
                    </span>
                  </div>
                )}
                {droppedSkill.requirements?.clan && (
                  <div className="item-tooltip__row">
                    <span className="item-tooltip__label">Clan</span>
                    <span
                      className={
                        player?.clan === droppedSkill.requirements.clan
                          ? 'loot-card__skill-stat-value--requirement-met'
                          : 'loot-card__skill-stat-value--requirement-not-met'
                      }
                    >
                      {droppedSkill.requirements.clan}
                    </span>
                  </div>
                )}
              </div>
              {droppedSkill.effects && droppedSkill.effects.length > 0 && (
                <div className="item-tooltip__section">
                  <div className="item-tooltip__effects-title">Effects</div>
                  {droppedSkill.effects.map((effect, idx) => (
                    <div key={idx} className="item-tooltip__effect">
                      <span className={getEffectColor(effect.type)}>{getEffectIcon(effect.type)}</span>
                      <span>{formatEffectDescription(effect)}</span>
                    </div>
                  ))}
                </div>
              )}
              {(droppedSkill.critBonus || droppedSkill.penetration || droppedSkill.isToggle) && (
                <div className="item-tooltip__section">
                  {droppedSkill.critBonus && (
                    <div className="loot-card__bonus--crit">+{droppedSkill.critBonus}% Crit</div>
                  )}
                  {droppedSkill.penetration && (
                    <div className="loot-card__bonus--pen">{Math.round(droppedSkill.penetration * 100)}% Pen</div>
                  )}
                  {droppedSkill.isToggle && (
                    <div className="loot-card__bonus--toggle">Toggle · {droppedSkill.upkeepCost} CP/turn</div>
                  )}
                </div>
              )}
            </div>

            <div className="item-tile__visual item-tile__visual--hero" aria-hidden="true">
              <ArtIcon art={getSkillArt(droppedSkill)} size="fill" title={droppedSkill.name} />
            </div>

            <div className="loot-card__header">
              <div className="loot-card__title-row">
                <h3 className={`loot-card__name ${droppedSkill.tier === SkillTier.FORBIDDEN ? 'loot-card__name--forbidden' : 'loot-card__name--rare'}`}>
                  {droppedSkill.name}
                </h3>
              </div>
              <p className="loot-card__type">
                <Scroll size={10} className="loot-card__type-icon" aria-hidden />
                Secret Scroll · {droppedSkill.tier}
              </p>
            </div>

            <div className="item-tile__stat-chips" aria-hidden="true">
              <span className="item-tile__stat-chip">CP {droppedSkill.chakraCost}</span>
              <span className="item-tile__stat-chip">{droppedSkill.element}</span>
              <span className="item-tile__stat-chip">{formatScalingStat(droppedSkill.scalingStat)}</span>
            </div>

            <div className="loot-card__skill-actions">
              {player && player.skills.some(s => s.id === droppedSkill.id) ? (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => onLearnSkill(droppedSkill)}
                  className="loot-card__btn loot-card__btn--upgrade"
                >
                  Upgrade
                </button>
              ) : (
                <>
                  {player && playerStats && (() => {
                    const learnCheck = canLearnSkill(
                      droppedSkill,
                      playerStats.effectivePrimary,
                      player.level,
                      player.clan,
                    );
                    const roomInDeck =
                      droppedSkill.actionType === ActionType.PASSIVE ||
                      canAddPlayableSkill(player.skills);
                    const deckFull =
                      droppedSkill.actionType !== ActionType.PASSIVE &&
                      !canAddPlayableSkill(player.skills);
                    return (
                      <>
                        {!learnCheck.canLearn && (
                          <p className="loot-card__replace-hint">{learnCheck.reason}</p>
                        )}
                        {learnCheck.canLearn && roomInDeck && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => onLearnSkill(droppedSkill)}
                            className="loot-card__btn loot-card__btn--learn"
                          >
                            Learn
                          </button>
                        )}
                        {learnCheck.canLearn && deckFull && (
                          <div className="loot-card__replace-grid">
                            <p className="loot-card__replace-hint">
                              Deck full ({LaunchProperties.MAX_DECK_SIZE}). Forget a card to learn this:
                            </p>
                            {player.skills
                              .map((s, idx) => ({ s, idx }))
                              .filter(({ s }) => s.actionType !== ActionType.PASSIVE)
                              .map(({ s, idx }) => (
                                <button
                                  type="button"
                                  key={s.id}
                                  disabled={isProcessing}
                                  onClick={() => onLearnSkill(droppedSkill, idx)}
                                  className="loot-card__btn loot-card__btn--replace"
                                >
                                  Forget {s.name}
                                </button>
                              ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="loot__footer">
        <button type="button" onClick={requestLeave} className="loot__leave-btn">
          {remainingCount === 0 ? 'Step onward' : 'Leave the spoils'}
          <span className="sw-shortcut">Enter</span>
        </button>
      </div>

      {/* T-052: confirm abandoning unclaimed spoils */}
      {confirmLeave && (
        <div className="loot-confirm" role="dialog" aria-modal="true" aria-label="Confirm leave spoils">
          <div className="loot-confirm__panel">
            <h3 className="loot-confirm__title">Leave unclaimed spoils?</h3>
            <p className="loot-confirm__body">
              You still have <strong>{remainingCount}</strong> unclaimed
              {remainingCount === 1 ? ' spoil' : ' spoils'}
              {droppedSkill ? ` (includes skill: ${droppedSkill.name})` : ''}.
              Walk away and the mist keeps them.
            </p>
            <div className="loot-confirm__actions">
              <button
                type="button"
                className="loot-confirm__btn loot-confirm__btn--cancel"
                onClick={() => setConfirmLeave(false)}
              >
                Keep taking
                <span className="sw-shortcut">Esc</span>
              </button>
              <button
                type="button"
                className="loot-confirm__btn loot-confirm__btn--leave"
                onClick={confirmLeaveAll}
                disabled={isProcessing}
              >
                Leave them behind
                <span className="sw-shortcut">Enter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </SceneBackdrop>
  );
};

export default Loot;
