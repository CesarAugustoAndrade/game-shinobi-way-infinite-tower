import React, { useEffect } from 'react';
import { Item, Skill, Player, SkillTier, Rarity, EquipmentSlot, DamageType, MAX_BAG_SLOTS, SLOT_MAPPING } from '../../game/types';
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
}) => {
  // Keyboard shortcut: SPACE/ENTER to leave all
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (isProcessing) return;
        e.preventDefault();
        onLeaveAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onLeaveAll, isProcessing]);

  // Check if bag has space
  const bagHasSpace = player ? player.bag.some(s => s === null) : false;
  const bagSlotCount = player?.bag.filter(s => s !== null).length || 0;

  return (
    <SceneBackdrop background={background}>
    <div className="loot">
      {/* Victory header — dramatic scene presence */}
      <div className="loot__victory-header">
        <h2 className="loot__victory-title">VICTORY</h2>
        <p className="loot__victory-subtitle">Spoils of War — Choose one reward</p>
      </div>

      {/* Keyboard Hints */}
      <div className="loot__hints">
        <span className="loot__hint">
          <span className="sw-shortcut">Space</span> or <span className="sw-shortcut">Enter</span> Leave All
        </span>
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
                      <div key={key} className="item-tooltip__row">
                        <span className="item-tooltip__label">{formatStatName(key)}</span>
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
                    Sell: {Math.floor(item.value * 0.6)} Ryo (60%)
                  </div>
                </div>
              </div>

              {/* The item IS the asset — big visual, PNG-ready slot */}
              <div className="item-tile__visual" aria-hidden="true">{item.icon || '📦'}</div>

              <div className="loot-card__header">
                <h3 className={`loot-card__name ${getRarityClass(item.rarity)}`}>{item.name}</h3>
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
                  Sell (+{Math.floor(item.value * 0.6)})
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
        <button type="button" onClick={onLeaveAll} className="loot__leave-btn">
          Leave All
        </button>
      </div>
    </div>
    </SceneBackdrop>
  );
};

export default Loot;
