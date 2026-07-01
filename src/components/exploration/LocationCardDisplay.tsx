import React, { useState } from 'react';
import { LocationCard } from '../../game/types';
import { getCardDisplayInfo } from '../../game/systems/RegionSystem';
import LocationIcon from '../shared/LocationIcon';
import DangerLevelBar from './DangerLevelBar';
import WealthLevelBar from './WealthLevelBar';
import ActivityIcons from './ActivityIcons';
import './exploration.css';

interface LocationCardDisplayProps {
  card: LocationCard;
  isSelected: boolean;
  onClick: () => void;
  cardIndex: number;
}

/**
 * Map a FULL-intel special feature string to a footer style variant.
 * Colour semantics follow the retro-arcade reference (see exploration.css).
 */
function getFeatureVariant(feature: string): string {
  const f = feature.toLowerCase();
  if (f.includes('merchant')) return 'merchant';
  if (f.includes('rest')) return 'rest';
  if (f.includes('training')) return 'training';
  if (f.includes('boss')) return 'boss';
  if (f.includes('secret')) return 'secret';
  if (f.includes('story') || f.includes('event')) return 'event';
  return 'default';
}

const LocationCardDisplay: React.FC<LocationCardDisplayProps> = ({
  card,
  isSelected,
  onClick,
  cardIndex,
}) => {
  const displayInfo = getCardDisplayInfo(card);
  const [artError, setArtError] = useState(false);

  const isMystery = displayInfo.showMystery;

  // Pixel-art background slot, keyed by BIOME (stable + shared across locations of
  // the same biome) — the runtime location.id carries a random suffix, so it can't
  // map to a fixed asset. Missing PNGs fail gracefully (onError) and the themed
  // gradient + LocationIcon fallback show through.
  const biomeSlug = card.location.biome.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const artSrc = `/assets/location_${biomeSlug}.png`;

  // Build card classes (cyan accent by default, magenta when mystery/locked).
  const cardClasses = [
    'location-card',
    isSelected ? 'location-card--selected' : 'location-card--default',
    isMystery ? 'location-card--mystery' : '',
  ].filter(Boolean).join(' ');

  const featureVariant = displayInfo.specialFeature
    ? getFeatureVariant(displayInfo.specialFeature)
    : 'default';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cardClasses}
    >
      {/* Revisit badge */}
      {displayInfo.revisitBadge && (
        <div className="location-card__revisit-badge">
          <span className="location-card__revisit-text">Revisit</span>
        </div>
      )}

      {/* Title Bar: numbered badge + title + classification legend */}
      <div className="location-card__header">
        <div className="location-card__badge">
          <span className="location-card__badge-text">{cardIndex + 1}</span>
        </div>
        <div className="location-card__header-text">
          <h3 className={`location-card__title ${isMystery ? 'location-card__title--mystery' : ''}`}>
            {displayInfo.name}
          </h3>
          <p className="location-card__legend">
            {isMystery && <span className="location-card__legend-mark">?</span>}
            {displayInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Image Area — pixel-art slot with graceful fallback */}
      <div className={`location-card__image ${isMystery ? 'location-card__image--mystery' : 'location-card__image--revealed'}`}>
        {isMystery ? (
          <div className="location-card__glitch">
            <span className="location-card__glitch-mark" data-mark="?">?</span>
          </div>
        ) : (
          <>
            {/* Fallback layer (always present, shows through if art is missing) */}
            <div className="location-card__image-fallback">
              <LocationIcon icon={card.location.icon} size="xl" />
            </div>
            {/* Pixel-art layer (hidden on load error) */}
            {!artError && (
              <img
                src={artSrc}
                alt=""
                aria-hidden="true"
                className="location-card__image-art"
                onError={() => setArtError(true)}
              />
            )}
            {/* Biome nickname overlay */}
            <span className="location-card__biome">&quot;{card.location.biome}&quot;</span>
          </>
        )}
      </div>

      {/* Stats Bars Section */}
      <div className="location-card__stats">
        <DangerLevelBar level={displayInfo.dangerLevel} />
        <WealthLevelBar level={displayInfo.wealthLevel} />
        <div className="location-card__rooms">
          <span className="location-card__rooms-label">Rooms</span>
          <span className="location-card__rooms-value">
            {displayInfo.minRooms !== null ? `${displayInfo.minRooms}+` : '?'}
          </span>
        </div>
      </div>

      {/* Activity Icons */}
      <div className="location-card__activities">
        <ActivityIcons activities={displayInfo.activities} />
      </div>

      {/* Feature status bar (full-width, colour-coded by main feature) */}
      <div
        className={
          isMystery
            ? 'location-card__feature location-card__feature--mystery'
            : `location-card__feature location-card__feature--${featureVariant}`
        }
      >
        {isMystery ? (
          <span className="location-card__feature-text">Unknown Territory</span>
        ) : displayInfo.specialFeature ? (
          <>
            <span className="location-card__feature-icon">★</span>
            <span className="location-card__feature-text">{displayInfo.specialFeature}</span>
          </>
        ) : (
          <span className="location-card__feature-text">{displayInfo.subtitle}</span>
        )}
      </div>

      {/* Selected indicator glow */}
      {isSelected && (
        <div className="location-card__selection-glow" />
      )}
    </button>
  );
};

export default LocationCardDisplay;
