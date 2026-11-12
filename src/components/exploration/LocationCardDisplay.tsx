import React, { useState } from 'react';
import { LocationCard, LocationType } from '../../game/types';
import { getCardDisplayInfo } from '../../game/systems/RegionSystem';
import { resolveLaminaPaths } from '../../utils/colorHelpers';
import LocationIcon from '../shared/LocationIcon';
import DangerLevelBar from './DangerLevelBar';
import WealthLevelBar from './WealthLevelBar';
import ActivityIcons, { getActivityDisplayEntries } from './ActivityIcons';
import Tooltip from '../shared/Tooltip';
import './exploration.css';

interface LocationCardDisplayProps {
  card: LocationCard;
  isSelected: boolean;
  onClick: () => void;
  onActivate?: () => void;
  cardIndex: number;
}

/**
 * Map a FULL-intel special feature string to a footer style variant.
 * Colour semantics: ops-table instrument (see exploration.css).
 */
function getFeatureVariant(feature: string): string {
  const f = feature.toLowerCase();
  if (f.includes('merchant')) return 'merchant';
  if (f.includes('rest')) return 'rest';
  if (f.includes('training')) return 'training';
  if (f.includes('boss')) return 'boss';
  if (f.includes('secret') || f.includes('veiled') || f.includes('unmarked')) return 'secret';
  if (f.includes('story') || f.includes('event')) return 'event';
  return 'default';
}

const LocationCardDisplay: React.FC<LocationCardDisplayProps> = ({
  card,
  isSelected,
  onClick,
  onActivate,
  cardIndex,
}) => {
  const displayInfo = getCardDisplayInfo(card);
  const [artError, setArtError] = useState(false);

  const isMystery = displayInfo.showMystery;
  // Fog may seal the name; still tag veiled routes (flags or LocationType.SECRET)
  const isSecret =
    Boolean(displayInfo.isSecret) ||
    Boolean(card.location.flags?.isSecret) ||
    card.location.type === LocationType.SECRET;

  // Biome plate via resolveLaminaPaths (aliases + default; A3 can add laminas later).
  // Missing PNGs fail gracefully (onError) → themed gradient + LocationIcon.
  const artSrc = resolveLaminaPaths(card.location.biome || '').background;

  const cardClasses = [
    'location-card',
    isSelected ? 'location-card--selected' : 'location-card--default',
    isMystery ? 'location-card--mystery' : '',
    !isMystery && isSecret ? 'location-card--secret' : '',
  ].filter(Boolean).join(' ');

  const featureVariant = displayInfo.specialFeature
    ? getFeatureVariant(displayInfo.specialFeature)
    : isSecret
      ? 'secret'
      : 'default';

  const terrainLabel = card.location.terrain
    ? String(card.location.terrain).replace(/_/g, ' ')
    : null;

  const activityEntries = getActivityDisplayEntries(displayInfo.activities);
  const activitySummary = activityEntries
    .map(({ label, isSpecial }) => (isSpecial ? `Possible ${label}` : label))
    .join(' · ');
  const locationDescription = isMystery
    ? `${displayInfo.name}. Threat unreadable${isSecret ? '. Veiled route' : ''}`
    : [
        displayInfo.name,
        displayInfo.dangerLevel != null ? `Danger ${displayInfo.dangerLevel}` : null,
        displayInfo.wealthLevel != null ? `Wealth ${displayInfo.wealthLevel}` : null,
        displayInfo.minRooms != null ? `${displayInfo.minRooms} or more rooms` : null,
        terrainLabel ? `Terrain ${terrainLabel}` : null,
        activitySummary ? `Known activities: ${activitySummary}` : null,
        displayInfo.specialFeature,
        displayInfo.revisitBadge ? 'Previously cleared, reduced rewards' : null,
      ].filter(Boolean).join('. ');

  const tooltipContent = (
    <div className="location-card__tooltip">
      <strong>{displayInfo.name}</strong>
      {isMystery ? (
        <span>Fog conceals the threat. Advance your intel to reveal reliable details.</span>
      ) : (
        <>
          <span>
            {displayInfo.dangerLevel != null ? `Danger ${displayInfo.dangerLevel}` : 'Danger unknown'}
            {displayInfo.wealthLevel != null ? ` · Wealth ${displayInfo.wealthLevel}` : ''}
            {displayInfo.minRooms != null ? ` · ${displayInfo.minRooms}+ rooms` : ''}
            {terrainLabel ? ` · ${terrainLabel}` : ''}
            {displayInfo.revisitBadge ? ' · Scarred (reduced rewards)' : ''}
          </span>
          {activitySummary && <span>Known: {activitySummary}</span>}
          {displayInfo.specialFeature && <span>{displayInfo.specialFeature}</span>}
        </>
      )}
      {isSecret && <span>Veiled route · absent from the official path.</span>}
    </div>
  );

  return (
    <Tooltip content={tooltipContent} position="top" className="location-card__tooltip-host">
      <button
        type="button"
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || !isSelected || !onActivate) return;
          event.preventDefault();
          event.stopPropagation();
          onActivate();
        }}
        data-card-index={cardIndex}
        className={cardClasses}
        aria-label={locationDescription}
        aria-pressed={isSelected}
      >
      {/* Revisit scar — top-right, rust heat */}
      {displayInfo.revisitBadge && (
        <div className="location-card__revisit-badge">
          <span className="location-card__revisit-text">Scar</span>
        </div>
      )}

      {/* Title Bar: slot # + name + type legend */}
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
          {/* StS scan row: danger + biome/scar/secret without clutter */}
          {isMystery ? (
            <div className="location-card__identity" aria-label="Fogged location intel">
              <span
                className="location-card__id-chip location-card__id-chip--fog"
              >
                Threat unreadable
              </span>
              {/* A4 wave7: secret path UI — signal veiled route without naming it */}
              {isSecret && (
                <span
                  className="location-card__id-chip location-card__id-chip--secret"
                >
                  Veiled signal
                </span>
              )}
            </div>
          ) : (
            <div className="location-card__identity" aria-label="Location identity">
              {displayInfo.dangerLevel != null && (
                <span
                  className={`location-card__d-badge location-card__d-badge--d${displayInfo.dangerLevel}`}
                >
                  D{displayInfo.dangerLevel}
                </span>
              )}
              {card.location.biome && (
                <span
                  className="location-card__id-chip location-card__id-chip--biome"
                >
                  {card.location.biome}
                </span>
              )}
              {isSecret && (
                <span className="location-card__id-chip location-card__id-chip--secret">
                  Veiled
                </span>
              )}
              {displayInfo.revisitBadge && (
                <span className="location-card__id-chip location-card__id-chip--scar">
                  Scar
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Area — painted plate with graceful fallback (void plate always) */}
      <div className={`location-card__image ${isMystery ? 'location-card__image--mystery' : 'location-card__image--revealed'}`}>
        {isMystery ? (
          <div className="location-card__glitch">
            <span className="location-card__glitch-mark" data-mark="?">?</span>
            <span className="location-card__glitch-caption">Signal fogged</span>
          </div>
        ) : (
          <>
            <div className="location-card__image-fallback">
              <LocationIcon icon={card.location.icon} size="xl" />
            </div>
            {!artError && (
              <img
                src={artSrc}
                alt=""
                aria-hidden="true"
                className="location-card__image-art"
                onError={() => setArtError(true)}
              />
            )}
            <span className="location-card__biome">&quot;{card.location.biome}&quot;</span>
          </>
        )}
      </div>

      {/* Stats — segmented bars + rooms + terrain tag */}
      <div className="location-card__stats">
        <DangerLevelBar level={displayInfo.dangerLevel} />
        <WealthLevelBar level={displayInfo.wealthLevel} />
        <div className="location-card__rooms">
          <span className="location-card__rooms-label">Rooms</span>
          <span className="location-card__rooms-value">
            {displayInfo.minRooms !== null ? `${displayInfo.minRooms}+` : '?'}
          </span>
        </div>
        {!isMystery && terrainLabel && (
          <div className="location-card__terrain-tag">
            <span className="location-card__terrain-label">Terrain</span>
            <span className="location-card__terrain-value">{terrainLabel}</span>
          </div>
        )}
      </div>

      <div className="location-card__activities">
        <ActivityIcons activities={displayInfo.activities} />
      </div>

      {/* Feature / mystery footer */}
      <div
        className={
          isMystery
            ? 'location-card__feature location-card__feature--mystery'
            : `location-card__feature location-card__feature--${featureVariant}`
        }
      >
        {isMystery ? (
          <span className="location-card__feature-text">
            {isSecret
              ? 'Signal fogged · veiled route (name sealed)'
              : 'Signal fogged · threat unreadable'}
          </span>
        ) : displayInfo.specialFeature ? (
          <>
            <span className="location-card__feature-icon">{isSecret ? '◈' : '★'}</span>
            <span className="location-card__feature-text">{displayInfo.specialFeature}</span>
          </>
        ) : isSecret ? (
          <>
            <span className="location-card__feature-icon">◈</span>
            <span className="location-card__feature-text">Veiled Route</span>
          </>
        ) : (
          <span className="location-card__feature-text">{displayInfo.subtitle}</span>
        )}
      </div>

      {isSelected && <div className="location-card__selection-glow" />}
      </button>
    </Tooltip>
  );
};

export default LocationCardDisplay;
