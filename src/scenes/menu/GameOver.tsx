import React, { useEffect, useCallback } from 'react';
import { Skull } from 'lucide-react';
import { Clan, Player } from '../../game/types';
import { getEventFlagRunModifiers } from '../../game/systems/EventSystem';
import { SceneBackdrop } from '../../components/layout/SceneBackdrop';
import './GameOver.css';

interface GameOverProps {
  locationName: string;
  dangerLevel: number;
  regionName: string;
  playerLevel?: number;
  clan?: Clan | string;
  ryo?: number;
  locationsCleared?: number;
  /** T-027: Infinite Ascent height (regions cleared in tower mode) */
  towerHeight?: number;
  /** T-044: optional full player for story-run chips */
  player?: Player | null;
  onRetry: () => void;
  /** Biome background where the player fell — shown very darkened behind the death screen. */
  background?: string;
}

const GameOver: React.FC<GameOverProps> = ({
  locationName,
  dangerLevel,
  regionName,
  playerLevel,
  clan,
  ryo,
  locationsCleared,
  towerHeight,
  player,
  onRetry,
  background,
}) => {
  const storyLabels = player ? getEventFlagRunModifiers(player).activeLabels : [];
  // Keyboard shortcut
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onRetry();
    }
  }, [onRetry]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Get danger level modifier for CSS
  const getDangerModifier = (level: number): string => {
    if (level <= 2) return 'game-over__danger--safe';
    if (level <= 4) return 'game-over__danger--low';
    if (level <= 6) return 'game-over__danger--medium';
    return 'game-over__danger--high';
  };

  const hasRunSummary =
    playerLevel != null ||
    clan != null ||
    ryo != null ||
    locationsCleared != null ||
    towerHeight != null;

  return (
    <div className="game-over">
      <SceneBackdrop background={background} dim={0.2}>
        {/* Red death vignette — layered inside content (z-10), behind all real content */}
        <div className="game-over__death-vignette" aria-hidden="true" />
      <div className="game-over__content">
        {/* Death Icon */}
        <Skull size={64} className="game-over__icon" />

        {/* Title */}
        <h1 className="game-over__title">Death</h1>

        {/* Stats Panel */}
        <div className="game-over__panel">
          <p className="game-over__location">
            You fell at {locationName}
            <span className={`game-over__danger ${getDangerModifier(dangerLevel)}`}>
              (Danger {dangerLevel})
            </span>
          </p>

          <p className="game-over__region">{regionName}</p>

          {hasRunSummary && (
            <div className="game-over__summary">
              {clan != null && (
                <div className="game-over__stat">
                  <span className="game-over__stat-label">Clan</span>
                  <span className="game-over__stat-value">{clan}</span>
                </div>
              )}
              {playerLevel != null && (
                <div className="game-over__stat">
                  <span className="game-over__stat-label">Level</span>
                  <span className="game-over__stat-value">{playerLevel}</span>
                </div>
              )}
              {locationsCleared != null && (
                <div className="game-over__stat">
                  <span className="game-over__stat-label">Locations</span>
                  <span className="game-over__stat-value">{locationsCleared}</span>
                </div>
              )}
              {towerHeight != null && (
                <div className="game-over__stat game-over__stat--tower">
                  <span className="game-over__stat-label">Tower Height</span>
                  <span className="game-over__stat-value">{towerHeight}</span>
                </div>
              )}
              {ryo != null && (
                <div className="game-over__stat">
                  <span className="game-over__stat-label">Ryo</span>
                  <span className="game-over__stat-value">{ryo}</span>
                </div>
              )}
            </div>
          )}

          {/* T-044: story-run bonuses earned before death */}
          {storyLabels.length > 0 && (
            <div className="game-over__story" aria-label="Story bonuses this run">
              <p className="game-over__story-title">Story bonuses this run</p>
              <div className="game-over__story-chips">
                {storyLabels.map((label) => (
                  <span key={label} className="game-over__story-chip">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Retry Button */}
        <button type="button" onClick={onRetry} className="game-over__retry">
          <span className="game-over__retry-text">Try Again</span>
          <span className="sw-shortcut">Enter</span>
        </button>
      </div>
      </SceneBackdrop>
    </div>
  );
};

export default GameOver;
