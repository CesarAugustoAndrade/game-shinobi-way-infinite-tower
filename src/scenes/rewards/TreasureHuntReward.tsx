import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Item, Skill, Rarity, SkillTier, DamageType, RegionLootTheme } from '../../game/types';
import { Scroll, MapPin, Coins, Award } from 'lucide-react';
import { formatStatName, getStatColor, formatScalingStat, getEffectColor, getEffectIcon, formatEffectDescription } from '../../game/utils/tooltipFormatters';
import { resolveItemArt, getSkillArt } from '../../game/constants/artRegistry';
import {
  itemMatchesEquipmentFocus,
  isFocusStat,
} from '../../game/utils/itemFocusMatch';
import { SceneBackdrop } from '../../components/layout/SceneBackdrop';
import ArtIcon from '../../components/shared/ArtIcon';
import { alignItemTileTooltip } from '../../utils/itemTileTooltip';
import './treasure.css';

interface TreasureHuntReward {
  items: Item[];
  skills: Skill[];
  ryo: number;
  piecesCollected: number;
  wealthLevel: number;
}

interface TreasureHuntRewardProps {
  reward: TreasureHuntReward;
  onClaim: () => void;
  getRarityColor: (rarity: Rarity) => string;
  getDamageTypeColor: (dt: DamageType) => string;
  /** Biome background image — replaces the solid-black backdrop. */
  background?: string;
  /**
   * T-094: region lootTheme already biases hunt items (T-072); show Focus cues.
   */
  lootTheme?: RegionLootTheme | null;
}

const TreasureHuntRewardScene: React.FC<TreasureHuntRewardProps> = ({
  reward,
  onClaim,
  getRarityColor,
  getDamageTypeColor,
  background,
  lootTheme = null,
}) => {
  const [showContent, setShowContent] = useState(false);
  const [claimed, setClaimed] = useState(false);
  /** Sync mutex — claimed state lags one frame (click + Enter same tick). */
  const claimLockRef = useRef(false);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleClaimOnce = useCallback(() => {
    if (claimed || claimLockRef.current) return;
    claimLockRef.current = true;
    setClaimed(true);
    onClaim();
  }, [claimed, onClaim]);

  // Keyboard handler — one claim only (Escape parity continue-family modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.key === 'Escape') {
        if (e.repeat) return;
        e.preventDefault();
        handleClaimOnce();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClaimOnce]);

  // Render map pieces
  const renderMapPieces = () => {
    return [...Array(reward.piecesCollected)].map((_, i) => (
      <div
        key={i}
        className="map-progress__piece map-progress__piece--collected"
        style={{ animationDelay: `${i * 120}ms` }}
      >
        <MapPin className="map-progress__piece-icon" />
      </div>
    ));
  };

  // Render item reward card
  const renderItemCard = (item: Item, index: number) => {
    const isFocusItem = itemMatchesEquipmentFocus(item, lootTheme?.equipmentFocus);
    return (
      <div
        key={`item-${index}`}
        className="treasure-reward__card item-tile"
        style={{ animationDelay: `${index * 150}ms` }}
        tabIndex={0}
        onMouseEnter={(e) => alignItemTileTooltip(e.currentTarget)}
        onFocus={(e) => alignItemTileTooltip(e.currentTarget)}
      >
        <div className="item-tile__tooltip" role="tooltip">
          <div className={`item-tooltip__name ${getRarityColor(item.rarity)}`}>{item.name}</div>
          <div className="item-tooltip__type">
            {item.rarity} {item.isComponent ? 'Component' : 'Artifact'}
            {isFocusItem && <span className="treasure-tooltip__focus"> · Focus</span>}
          </div>
          {item.description && (
            <div className="item-tooltip__desc">{item.description}</div>
          )}
          <div className="item-tooltip__section">
            {Object.entries(item.stats).map(([key, val]) => (
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
                <span className="item-tooltip__value">+{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="treasure-card__corner treasure-card__corner--tl" />
        <div className="treasure-card__corner treasure-card__corner--tr" />
        <div className="treasure-card__corner treasure-card__corner--bl" />
        <div className="treasure-card__corner treasure-card__corner--br" />
        {isFocusItem && (
          <span className="treasure-card__focus-badge" title="Matches region Focus stats">
            Focus
          </span>
        )}

        <div className="treasure-reward__card-content">
          <span className="item-tile__visual" aria-hidden="true">
            <ArtIcon art={resolveItemArt(item)} size="fill" title={item.name} />
          </span>
          <div className={`treasure-reward__card-name ${getRarityColor(item.rarity)}`}>
            {item.name}
          </div>
          <div className={`treasure-reward__card-type ${getRarityColor(item.rarity)}`}>
            {item.rarity}
          </div>
        </div>
      </div>
    );
  };

  // Render skill reward card
  const renderSkillCard = (skill: Skill, index: number) => {
    const themed = Boolean(
      (lootTheme?.primaryElement && skill.element === lootTheme.primaryElement) ||
        (lootTheme?.equipmentFocus && isFocusStat(skill.scalingStat, lootTheme.equipmentFocus)),
    );
    return (
      <div
        key={`skill-${index}`}
        className="treasure-reward__card treasure-reward__card--skill item-tile"
        style={{ animationDelay: `${(reward.items.length + index) * 150}ms` }}
        tabIndex={0}
        onMouseEnter={(e) => alignItemTileTooltip(e.currentTarget)}
        onFocus={(e) => alignItemTileTooltip(e.currentTarget)}
      >
        <div className="item-tile__tooltip" role="tooltip">
          <div className={`item-tooltip__name ${skill.tier === SkillTier.FORBIDDEN ? 'treasure-skill--forbidden' : 'treasure-skill--scroll'}`}>
            {skill.name}
          </div>
          <div className="item-tooltip__type">
            {skill.tier} {skill.element} Scroll
            {themed && <span className="treasure-tooltip__focus"> · Region</span>}
          </div>
          {skill.description && (
            <div className="item-tooltip__desc">{skill.description}</div>
          )}
          <div className="item-tooltip__section">
            <div className="item-tooltip__row">
              <span className="item-tooltip__label">Chakra Cost</span>
              <span className="item-tooltip__value">{skill.chakraCost}</span>
            </div>
            <div className="item-tooltip__row">
              <span className="item-tooltip__label">Damage Type</span>
              <span className={getDamageTypeColor(skill.damageType)}>{skill.damageType}</span>
            </div>
            <div className="item-tooltip__row">
              <span className="item-tooltip__label">Scales with</span>
              <span className={getStatColor(skill.scalingStat)}>{formatScalingStat(skill.scalingStat)}</span>
            </div>
          </div>

          {skill.effects && skill.effects.length > 0 && (
            <div className="item-tooltip__section">
              <div className="item-tooltip__effects-title">Effects</div>
              {skill.effects.map((effect, idx) => (
                <div key={idx} className="item-tooltip__effect">
                  <span className={getEffectColor(effect.type)}>{getEffectIcon(effect.type)}</span>
                  <span>{formatEffectDescription(effect)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="treasure-card__corner treasure-card__corner--tl" />
        <div className="treasure-card__corner treasure-card__corner--tr" />
        <div className="treasure-card__corner treasure-card__corner--bl" />
        <div className="treasure-card__corner treasure-card__corner--br" />
        {themed && (
          <span className="treasure-card__focus-badge" title="Matches region Affinity or Focus">
            Region
          </span>
        )}

        <div className="treasure-reward__card-content">
          <span className="item-tile__visual" aria-hidden="true">
            <ArtIcon art={getSkillArt(skill)} size="fill" title={skill.name} />
          </span>
          <div className={`treasure-reward__card-name ${skill.tier === SkillTier.FORBIDDEN ? 'treasure-skill--forbidden' : 'treasure-skill--scroll'}`}>
            <Scroll size={12} className="treasure-reward__card-scroll-icon" aria-hidden />
            {skill.name}
          </div>
          <div className="treasure-reward__card-type treasure-reward__card-type--skill">
            {skill.tier} Scroll
          </div>
        </div>
      </div>
    );
  };

  return (
    <SceneBackdrop background={background}>
      <div className="treasure-scene">
        <div className="treasure-scene__container treasure-reward">
          {/* Header */}
          <div className={`treasure-reward__header ${showContent ? 'treasure-reward__header--visible' : ''}`}>
            <div className="treasure-reward__trophy">
              <Award className="treasure-reward__trophy-icon" />
            </div>
            <h2 className="treasure-scene__title">Ninja Scroll Complete</h2>
            <p className="treasure-scene__subtitle">
              All {reward.piecesCollected} map seals assembled — Master Treasure unsealed
            </p>
            {lootTheme && (
              <div className="treasure-scene__theme" aria-label="Region loot theme">
                {lootTheme.primaryElement && (
                  <span className="treasure-scene__theme-chip treasure-scene__theme-chip--affinity">
                    Affinity {lootTheme.primaryElement}
                  </span>
                )}
                {lootTheme.equipmentFocus?.length > 0 && (
                  <span className="treasure-scene__theme-chip treasure-scene__theme-chip--focus">
                    Focus{' '}
                    {lootTheme.equipmentFocus
                      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                      .join(' · ')}
                  </span>
                )}
                {lootTheme.goldMultiplier !== 1 && (
                  <span className="treasure-scene__theme-chip treasure-scene__theme-chip--gold">
                    Ryo ×{lootTheme.goldMultiplier}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Map pieces display */}
          <div className={`treasure-reward__map-pieces ${showContent ? 'treasure-reward__map-pieces--visible' : ''}`}>
            <div className="map-progress__pieces">
              {renderMapPieces()}
            </div>
          </div>

          {/* Body */}
          <div className={`treasure-scene__body ${showContent ? 'treasure-scene__body--visible' : ''}`}>
            <div className="treasure-reward__section-header">
              <span className="treasure-reward__section-title">Master Relics Unsealed</span>
              <div className="treasure-reward__section-divider" />
            </div>

            {/* Reward cards grid */}
            <div className="treasure-reward__cards">
              {reward.items.map((item, index) => renderItemCard(item, index))}
              {reward.skills.map((skill, index) => renderSkillCard(skill, index))}

              {reward.ryo > 0 && (
                <div className="treasure-reward__card treasure-reward__card--ryo">
                  <div className="treasure-card__corner treasure-card__corner--tl" />
                  <div className="treasure-card__corner treasure-card__corner--tr" />
                  <div className="treasure-card__corner treasure-card__corner--bl" />
                  <div className="treasure-card__corner treasure-card__corner--br" />

                  <div className="treasure-reward__card-content">
                    <Coins className="treasure-reward__card-ryo-icon" />
                    <div className="treasure-reward__card-ryo-amount">+{reward.ryo}</div>
                    <div className="treasure-reward__card-type treasure-reward__card-type--ryo">Ryō Bonus</div>
                  </div>
                </div>
              )}
            </div>

            <div className="treasure-reward__wealth-info">
              Wealth Level {reward.wealthLevel} • {reward.piecesCollected} Seals Assembled
            </div>

            <div className="treasure-reward__actions">
              <button
                type="button"
                onClick={handleClaimOnce}
                disabled={claimed}
                className="treasure-btn treasure-btn--gold treasure-btn--claim"
              >
                <span className="treasure-btn__label">Claim Relics</span>
                <span className="treasure-btn__key">[SPACE]</span>
                <span className="treasure-btn__key">[Esc]</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </SceneBackdrop>
  );
};

export default TreasureHuntRewardScene;
