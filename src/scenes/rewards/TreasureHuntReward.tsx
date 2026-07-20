import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Item, Skill, Rarity, SkillTier, DamageType, RegionLootTheme } from '../../game/types';
import { Scroll, MapPin, Coins, Sparkles, Award } from 'lucide-react';
import { formatStatName, getStatColor, formatScalingStat, getEffectColor, getEffectIcon, formatEffectDescription } from '../../game/utils/tooltipFormatters';
import { resolveItemArt } from '../../game/constants/artRegistry';
import {
  itemMatchesEquipmentFocus,
  isFocusStat,
} from '../../game/utils/itemFocusMatch';
import ArtIcon from '../../components/shared/ArtIcon';
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
  const [bgError, setBgError] = useState(false);
  const handleBgError = useCallback(() => setBgError(true), []);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const [claimed, setClaimed] = useState(false);

  const handleClaimOnce = useCallback(() => {
    if (claimed) return;
    setClaimed(true);
    onClaim();
  }, [claimed, onClaim]);

  // Keyboard handler — one claim only
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleClaimOnce();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClaimOnce]);

  // Memoized particles for performance
  const particles = useMemo(() =>
    [...Array(15)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${2.5 + Math.random() * 1.5}s`,
    })),
  []);

  // Render map pieces
  const renderMapPieces = () => {
    return [...Array(reward.piecesCollected)].map((_, i) => (
      <div
        key={i}
        className="map-progress__piece map-progress__piece--collected"
        style={{ animationDelay: `${i * 150}ms` }}
      >
        <MapPin className="map-progress__piece-icon" />
      </div>
    ));
  };

  // Render item reward card — the item IS the asset; details in scoped tooltip
  const renderItemCard = (item: Item, index: number) => {
    const isFocusItem = itemMatchesEquipmentFocus(item, lootTheme?.equipmentFocus);
    return (
    <div
      key={item.id}
      className={`treasure-reward__card item-tile ${item.passive ? 'treasure-reward__card--artifact' : ''}`}
      style={{ animationDelay: `${index * 100 + 500}ms` }}
      tabIndex={0}
    >
      {/* Detail tooltip — hover / keyboard focus / touch tap (focus) */}
      <div className="item-tile__tooltip" role="tooltip">
        <div className={`item-tooltip__name ${getRarityColor(item.rarity)}`}>{item.name}</div>
        <div className="item-tooltip__type">
          {item.rarity} {item.isComponent ? 'Component' : 'Artifact'}
          {isFocusItem && <span className="treasure-tooltip__focus"> · Focus</span>}
        </div>
        {item.description && !item.passive && (
          <div className="item-tooltip__desc">{item.description}</div>
        )}
        {item.passive && (
          <div className="item-tooltip__passive">Passive: {item.description}</div>
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

      {/* Corner ornaments */}
      <div className="treasure-card__corner treasure-card__corner--tl" />
      <div className="treasure-card__corner treasure-card__corner--tr" />
      <div className="treasure-card__corner treasure-card__corner--bl" />
      <div className="treasure-card__corner treasure-card__corner--br" />

      {/* Artifact sparkle */}
      {item.passive && (
        <div className="treasure-card__artifact-badge">
          <Sparkles className="w-6 h-6" />
        </div>
      )}
      {/* T-094: region Focus match (hunt rewards already biased T-072) */}
      {isFocusItem && (
        <span className="treasure-card__focus-badge" title="Matches region Focus stats">
          Focus
        </span>
      )}

      <div className="treasure-reward__card-content">
        {/* The item IS the asset — big visual, PNG-ready slot */}
        <span className="item-tile__visual" aria-hidden="true">
          <ArtIcon art={resolveItemArt(item)} size="lg" />
        </span>
        <div className={`treasure-reward__card-name ${getRarityColor(item.rarity)}`}>
          {item.name}
        </div>
        <div className="treasure-reward__card-type">
          {item.rarity} {item.isComponent ? 'Component' : 'Artifact'}
        </div>
      </div>
    </div>
    );
  };

  // Render skill scroll card — details in scoped tooltip
  const renderSkillCard = (skill: Skill, index: number) => (
    <div
      key={skill.id}
      className="treasure-reward__card treasure-reward__card--skill item-tile"
      style={{ animationDelay: `${index * 100 + 600}ms` }}
      tabIndex={0}
    >
      {/* Detail tooltip — hover / keyboard focus / touch tap (focus) */}
      <div className="item-tile__tooltip" role="tooltip">
        <div className={`item-tooltip__name ${skill.tier === SkillTier.FORBIDDEN ? 'treasure-skill--forbidden' : 'treasure-skill--scroll'}`}>
          {skill.name}
        </div>
        <div className="item-tooltip__type">{skill.tier} Jutsu</div>
        <div className="item-tooltip__desc">{skill.description}</div>

        <div className="item-tooltip__section">
          <div className="item-tooltip__row">
            <span className="item-tooltip__label">Chakra Cost</span>
            <span className="item-tooltip__value item-tooltip__value--chakra">{skill.chakraCost}</span>
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

      {/* Corner ornaments */}
      <div className="treasure-card__corner treasure-card__corner--tl" />
      <div className="treasure-card__corner treasure-card__corner--tr" />
      <div className="treasure-card__corner treasure-card__corner--bl" />
      <div className="treasure-card__corner treasure-card__corner--br" />

      <div className="treasure-reward__card-content">
        <Scroll className="treasure-reward__card-scroll-icon" />
        <div className={`treasure-reward__card-name ${skill.tier === SkillTier.FORBIDDEN ? 'treasure-skill--forbidden' : 'treasure-skill--scroll'}`}>
          {skill.name}
        </div>
        <div className="treasure-reward__card-type treasure-reward__card-type--skill">
          {skill.tier} Scroll
        </div>
      </div>
    </div>
  );

  return (
    <div className="treasure-modal">
      {/* Backdrop — biome scene + scrim layers */}
      <div className="treasure-modal__backdrop">
        {background && !bgError && (
          <img src={background} alt="" className="treasure-modal__bg-img" aria-hidden="true" onError={handleBgError} />
        )}
        <div className="treasure-modal__scrim" />
        <div className="treasure-modal__vignette" />
        <div className="treasure-modal__scanlines" />
      </div>

      {/* Main container */}
      <div className="treasure-modal__container treasure-reward">
        {/* Ambient particles */}
        <div className="treasure-reward__particles">
          {particles.map(p => (
            <div
              key={p.id}
              className="treasure-reward__particle"
              style={{
                left: p.left,
                top: p.top,
                animationDelay: p.delay,
                animationDuration: p.duration,
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div className={`treasure-reward__header ${showContent ? 'treasure-reward__header--visible' : ''}`}>
          <div className="treasure-reward__trophy">
            <Award className="treasure-reward__trophy-icon" />
          </div>
          <h2 className="treasure-modal__title">Map Complete!</h2>
          <p className="treasure-modal__subtitle">
            You've assembled all {reward.piecesCollected} map pieces
          </p>
          {/* T-094: hunt items already bias via lootTheme — surface identity */}
          {lootTheme && (
            <div className="treasure-modal__theme" aria-label="Region loot theme">
              {lootTheme.primaryElement && (
                <span className="treasure-modal__theme-chip treasure-modal__theme-chip--affinity">
                  Affinity {lootTheme.primaryElement}
                </span>
              )}
              {lootTheme.equipmentFocus?.length > 0 && (
                <span className="treasure-modal__theme-chip treasure-modal__theme-chip--focus">
                  Focus{' '}
                  {lootTheme.equipmentFocus
                    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(' · ')}
                </span>
              )}
              {lootTheme.goldMultiplier !== 1 && (
                <span className="treasure-modal__theme-chip treasure-modal__theme-chip--gold">
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
        <div className={`treasure-modal__body ${showContent ? 'treasure-modal__body--visible' : ''}`}>
          {/* Section header */}
          <div className="treasure-reward__section-header">
            <span className="treasure-reward__section-title">Your Rewards</span>
            <div className="treasure-reward__section-divider" />
          </div>

          {/* Reward cards grid */}
          <div className="treasure-reward__cards">
            {/* Item rewards */}
            {reward.items.map((item, index) => renderItemCard(item, index))}

            {/* Skill rewards */}
            {reward.skills.map((skill, index) => renderSkillCard(skill, index))}

            {/* Ryo reward */}
            {reward.ryo > 0 && (
              <div className="treasure-reward__card treasure-reward__card--ryo">
                {/* Corner ornaments */}
                <div className="treasure-card__corner treasure-card__corner--tl" />
                <div className="treasure-card__corner treasure-card__corner--tr" />
                <div className="treasure-card__corner treasure-card__corner--bl" />
                <div className="treasure-card__corner treasure-card__corner--br" />

                <div className="treasure-reward__card-content">
                  <Coins className="treasure-reward__card-ryo-icon" />
                  <div className="treasure-reward__card-ryo-amount">{reward.ryo}</div>
                  <div className="treasure-reward__card-type treasure-reward__card-type--ryo">Ryō</div>
                </div>
              </div>
            )}
          </div>

          {/* Wealth level indicator */}
          <div className="treasure-reward__wealth-info">
            Wealth Level {reward.wealthLevel} • {reward.piecesCollected} Pieces Collected
          </div>

          {/* Claim button */}
          <div className="treasure-reward__actions">
            <button
              type="button"
              onClick={handleClaimOnce}
              disabled={claimed}
              className="treasure-btn treasure-btn--gold treasure-btn--claim"
            >
              <span className="treasure-btn__label">Claim Rewards</span>
              <span className="treasure-btn__key">[SPACE]</span>
            </button>
          </div>
        </div>

        {/* Bottom decorative line */}
        <div className="treasure-reward__footer">
          <div className="treasure-reward__footer-line treasure-reward__footer-line--left" />
          <MapPin className="treasure-reward__footer-icon" />
          <div className="treasure-reward__footer-line treasure-reward__footer-line--right" />
        </div>
      </div>
    </div>
  );
};

export default TreasureHuntRewardScene;
