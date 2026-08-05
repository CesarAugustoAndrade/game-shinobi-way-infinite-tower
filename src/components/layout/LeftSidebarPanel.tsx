import React from 'react';
import { useGame } from '../../contexts/GameContext';
import LocationPanel from '../exploration/LocationPanel';
import PrimaryStatsPanel from '../character/PrimaryStatsPanel';
import DerivedStatsPanel from '../character/DerivedStatsPanel';
import './layout.css';

/** Atmospheric sidebar plate — served from public/ (missing ui_seinen-* asset removed). */
const LOCATION_PANEL_BG = '/assets/locations/location_foggy_shoreline.png';

interface LeftSidebarPanelProps {
  // Props are now optional - uses context if not provided
  storyArcLabel?: string;
}

const LeftSidebarPanel: React.FC<LeftSidebarPanelProps> = ({
  storyArcLabel,
}) => {
  const { player, playerStats, region, currentLocation, dangerLevel } = useGame();

  // Early return if no player data
  if (!player || !playerStats) return null;

  // Get region info for display
  const arcLabel = storyArcLabel ?? region?.arc ?? 'Exploring';
  const locationName = currentLocation?.name ?? 'Unknown Location';
  const regionName = region?.name ?? 'Unknown Region';

  return (
    <div className="sidebar">
      <LocationPanel
        locationName={locationName}
        dangerLevel={dangerLevel}
        regionName={regionName}
        storyArcLabel={arcLabel}
        backgroundImage={LOCATION_PANEL_BG}
        lootTheme={region?.lootTheme}
      />

      <PrimaryStatsPanel
        player={player}
        effectivePrimary={playerStats.effectivePrimary}
        equipmentFocus={region?.lootTheme?.equipmentFocus}
      />

      <DerivedStatsPanel
        derived={playerStats.derived}
      />
    </div>
  );
};

export default LeftSidebarPanel;
