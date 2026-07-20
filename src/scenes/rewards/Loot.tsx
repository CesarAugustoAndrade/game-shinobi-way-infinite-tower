import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Item, Skill, Player, SkillTier, Rarity, EquipmentSlot, DamageType, MAX_BAG_SLOTS, SLOT_MAPPING, RegionLootTheme } from '../../game/types';
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
import { resolveItemArt, getSkillArt } from '../../game/constants/artRegistry';
import { getSellPrice } from '../../game/systems/LootSystem';
import {
  itemMatchesEquipmentFocus,
  isFocusStat,
} from '../../game/utils/itemFocusMatch';
import { BALANCE } from '../../game/config';
import ArtIcon from '../../components/shared/ArtIcon';
import './Loot.css';

interface LootProps {
  droppedItems: Item[];
  droppedSkill: Skill | null;
  player: Player | null;
  playerStats: any;
  onEquipItem: (item: Item) => void;
  onSellItem: (item: Item) => void;
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
  onSellItem,
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
  const remainingCount = useMemo(
    () => droppedItems.length + (droppedSkill ? 1 : 0),
    [droppedItems.length, droppedSkill],
  );

  const requestLeave = useCallback(() => {
    if (isProcessing) return;
    if (remainingCount > 0) {
      setConfirmLeave(true);
      return;
    }
    onLeaveAll();
  }, [isProcessing, remainingCount, onLeaveAll]);

  const confirmLeaveAll = useCallback(() => {
    setConfirmLeave(false);
    onLeaveAll();
  }, [onLeaveAll]);

  // Keyboard: SPACE/ENTER leave (or confirm); Esc cancels confirm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (isProcessing) return;

      if (e.key === 'Escape' && confirmLeave) {
        e.preventDefault();
        setConfirmLeave(false);
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (confirmLeave) {
          confirmLeaveAll();
        } else {
          requestLeave();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProcessing, confirmLeave, confirmLeaveAll, requestLeave]);

  // Check if bag has space
  const bagHasSpace = player ? player.bag.some(s => s === null) : false;
  const bagSlotCount = player?.bag.filter(s => s !== null).length || 0;

  return (
    <SceneBackdrop background={background}>
    <div className="loot">
      {/* Victory header — dramatic scene presence */}
      <div className="loot__victory-header">
        <h2 className="loot__victory-title">VICTORY</h2>
        <p className="loot__victory-subtitle">
          Spoils of War — Claim each reward{remainingCount > 1 ? ` (${remainingCount} left)` : ''}
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
        <span className="loot__hint">
          <span className="sw-shortcut">Space</span> or <span className="sw-shortcut">Enter</span> Leave
          {remainingCount > 0 ? ' (confirm if unclaimed)' : ''}
        </span>
        {remainingCount > 0 && (
          <span className="loot__remaining-badge" title="Unclaimed spoils">
            {remainingCount} unclaimed
          </span>
        )}
      </div>

      <div className="loot__grid">
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

                {/* Component synthesis hint */}
                {item.isComponent && item.componentId && (
                  <div className="item-tooltip__synth">
                    Can be combined into {getRecipesUsingComponent(item.componentId).length} artifacts
                  </div>
                )}

                <div className="item-tooltip__section">
                  <div className="item-tooltip__sell">
                    Sell: {getSellPrice(item)} Ryo ({Math.round(BALANCE.SELL_PRICE_RATIO * 100)}%)
                  </div>
                </div>
              </div>

              {/* The item IS the asset — big visual, PNG-ready slot */}
              <div className="item-tile__visual" aria-hidden="true">
                <ArtIcon art={resolveItemArt(item)} size="lg" />
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

              {/* Action buttons */}
              <div className={`loot-card__actions ${onStoreToBag ? 'loot-card__actions--three' : 'loot-card__actions--two'}`}>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={(e) => { e.stopPropagation(); onEquipItem(item); }}
                  className="loot-card__btn loot-card__btn--equip"
                >
                  Equip
                </button>
                {onStoreToBag && (
                  <button
                    type="button"
                    disabled={isProcessing || !bagHasSpace}
                    onClick={(e) => { e.stopPropagation(); onStoreToBag(item); }}
                    className={`loot-card__btn ${bagHasSpace ? 'loot-card__btn--store' : 'loot-card__btn--store-disabled'}`}
                    title={bagHasSpace ? `Store in bag (${bagSlotCount}/${MAX_BAG_SLOTS})` : 'Bag is full'}
                  >
                    <Package size={12} />
                    {bagSlotCount}/{MAX_BAG_SLOTS}
                  </button>
                )}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={(e) => { e.stopPropagation(); onSellItem(item); }}
                  className="loot-card__btn loot-card__btn--sell"
                >
                  Sell (+{getSellPrice(item)})
                </button>
              </div>
            </div>
          );
        })}

        {droppedSkill && playerStats && (
          <div className="loot-card loot-card--skill">
            <div className="loot-card__header">
              <h3 className={`loot-card__name ${droppedSkill.tier === SkillTier.FORBIDDEN ? 'loot-card__name--forbidden' : 'loot-card__name--rare'}`}>
                {droppedSkill.name}
              </h3>
              <p className="loot-card__type">Secret Scroll - {droppedSkill.tier}</p>
            </div>

            <div className="item-tile__visual" aria-hidden="true">
              <ArtIcon art={getSkillArt(droppedSkill)} size="xl" title={droppedSkill.name} />
            </div>

            <div className="loot-card__skill-header">
              <Scroll className="loot-card__skill-icon" size={28} />
              <p className="loot-card__skill-description">{droppedSkill.description}</p>
            </div>

            <div className="loot-card__skill-stats">
              <div className="loot-card__skill-stat">
                <span className="loot-card__skill-stat-label">Chakra Cost</span>
                <span className="loot-card__skill-stat-value--chakra">{droppedSkill.chakraCost}</span>
              </div>
              <div className="loot-card__skill-stat">
                <span className="loot-card__skill-stat-label">Damage Type</span>
                <span className={getDamageTypeColor(droppedSkill.damageType)}>{droppedSkill.damageType}</span>
              </div>
              <div className="loot-card__skill-stat">
                <span className="loot-card__skill-stat-label">Property</span>
                <span>{droppedSkill.damageProperty}</span>
              </div>
              <div className="loot-card__skill-stat">
                <span className="loot-card__skill-stat-label">Scales with</span>
                <span className={getStatColor(droppedSkill.scalingStat)}>{formatScalingStat(droppedSkill.scalingStat)}</span>
              </div>
              <div className="loot-card__skill-stat">
                <span className="loot-card__skill-stat-label">Element</span>
                <span className={getElementColor(droppedSkill.element)}>{droppedSkill.element}</span>
              </div>
              {droppedSkill.requirements?.intelligence && (
                <div className="loot-card__skill-stat">
                  <span className="loot-card__skill-stat-label loot-card__skill-stat-label--int">Requires INT</span>
                  <span className={playerStats.effectivePrimary.intelligence >= droppedSkill.requirements.intelligence ? 'loot-card__skill-stat-value--requirement-met' : 'loot-card__skill-stat-value--requirement-not-met'}>
                    {droppedSkill.requirements.intelligence}
                  </span>
                </div>
              )}
            </div>

            {/* Effects Section */}
            {droppedSkill.effects && droppedSkill.effects.length > 0 && (
              <div className="loot-card__effects">
                <div className="loot-card__effects-title">Applies Effects</div>
                <div className="loot-card__effects-list">
                  {droppedSkill.effects.map((effect, idx) => (
                    <div key={idx} className="loot-card__effect">
                      <span className={getEffectColor(effect.type)}>{getEffectIcon(effect.type)}</span>
                      <span className="loot-card__effect-text">{formatEffectDescription(effect)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bonus Stats */}
            {(droppedSkill.critBonus || droppedSkill.penetration || droppedSkill.isToggle) && (
              <div className="loot-card__bonuses">
                {droppedSkill.critBonus && (
                  <div className="loot-card__bonus--crit">+{droppedSkill.critBonus}% Crit Chance</div>
                )}
                {droppedSkill.penetration && (
                  <div className="loot-card__bonus--pen">{Math.round(droppedSkill.penetration * 100)}% Defense Penetration</div>
                )}
                {droppedSkill.isToggle && (
                  <div className="loot-card__bonus--toggle">Toggle Skill - {droppedSkill.upkeepCost} CP/turn upkeep</div>
                )}
              </div>
            )}

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
                  {player && player.skills.length < 4 && (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => onLearnSkill(droppedSkill)}
                      className="loot-card__btn loot-card__btn--learn"
                    >
                      Learn
                    </button>
                  )}
                  {player && player.skills.length > 0 && (
                    <div className="loot-card__replace-grid">
                      {player.skills.map((s, idx) => (
                        <button
                          type="button"
                          key={idx}
                          disabled={isProcessing}
                          onClick={() => onLearnSkill(droppedSkill, idx)}
                          className="loot-card__btn loot-card__btn--replace"
                        >
                          Replace {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="loot__footer">
        <button type="button" onClick={requestLeave} className="loot__leave-btn">
          Leave All
        </button>
      </div>

      {/* T-052: confirm abandoning unclaimed spoils */}
      {confirmLeave && (
        <div className="loot-confirm" role="dialog" aria-modal="true" aria-label="Confirm leave loot">
          <div className="loot-confirm__panel">
            <h3 className="loot-confirm__title">Leave unclaimed spoils?</h3>
            <p className="loot-confirm__body">
              You still have <strong>{remainingCount}</strong> unclaimed
              {remainingCount === 1 ? ' spoil' : ' spoils'}
              {droppedSkill ? ` (includes skill: ${droppedSkill.name})` : ''}.
              Leave now and they are lost.
            </p>
            <div className="loot-confirm__actions">
              <button
                type="button"
                className="loot-confirm__btn loot-confirm__btn--cancel"
                onClick={() => setConfirmLeave(false)}
              >
                Cancel
                <span className="sw-shortcut">Esc</span>
              </button>
              <button
                type="button"
                className="loot-confirm__btn loot-confirm__btn--leave"
                onClick={confirmLeaveAll}
              >
                Leave anyway
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
