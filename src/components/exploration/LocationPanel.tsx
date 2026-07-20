import React from 'react';
import type { RegionLootTheme } from '../../game/types';
import './exploration.css';

interface LocationPanelProps {
  locationName: string;
  dangerLevel: number;
  regionName: string;
  storyArcLabel: string;
  backgroundImage?: string;
  /**
   * T-099: region lootTheme for persistent Affinity/Focus/Ryo chrome
   * (same language as RegionMap / loot peaks).
   */
  lootTheme?: RegionLootTheme | null;
}

const LocationPanel: React.FC<LocationPanelProps> = ({
  locationName,
  dangerLevel,
  regionName,
  storyArcLabel,
  backgroundImage,
  lootTheme = null,
}) => {
  // Get danger modifier class based on level
  const getDangerModifier = (level: number): string => {
    if (level <= 2) return 'location-panel__danger--safe';
    if (level <= 4) return 'location-panel__danger--medium';
    if (level <= 5) return 'location-panel__danger--high';
    return 'location-panel__danger--extreme';
  };

  return (
    <div 
      className="location-panel"
      style={backgroundImage ? { 
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : undefined}
    >
      <div className="location-panel__content">
        <div className="location-panel__header">
          <div className="location-panel__arc">
            {storyArcLabel}
          </div>
          <div className={`location-panel__danger ${getDangerModifier(dangerLevel)}`}>
            <span className="location-panel__danger-label">Danger</span>
            <span className="location-panel__danger-value">
              {dangerLevel}
            </span>
          </div>
        </div>
        <div className="location-panel__name">
          {locationName}
        </div>
        <div className="location-panel__region">
          {regionName}
        </div>
        {/* T-099: persistent region theme (loot/enemy bias already live) */}
        {lootTheme && (
          <div className="location-panel__theme" aria-label="Region theme">
            {lootTheme.primaryElement && (
              <span className="location-panel__theme-chip location-panel__theme-chip--affinity">
                {lootTheme.primaryElement}
              </span>
            )}
            {lootTheme.equipmentFocus?.length > 0 && (
              <span className="location-panel__theme-chip location-panel__theme-chip--focus">
                Focus{' '}
                {lootTheme.equipmentFocus
                  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                  .join(' · ')}
              </span>
            )}
            {lootTheme.goldMultiplier !== 1 && (
              <span className="location-panel__theme-chip location-panel__theme-chip--gold">
                Ryo ×{lootTheme.goldMultiplier}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPanel;
