import React, { useEffect, useCallback, useRef } from 'react';
import { Skull } from 'lucide-react';
import { Clan, Player } from '../../game/types';
import { getEventFlagRunModifiers } from '../../game/systems/EventSystem';
import { SceneBackdrop } from '../../components/layout/SceneBackdrop';
import { useFocusTrap } from '../../hooks/useFocusTrap';
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
  const rootRef = useRef<HTMLDivElement>(null);
  useFocusTrap(rootRef);
  /** Enter+click same tick double-fired onRetry → thrash MENU state. */
  const retryLockRef = useRef(false);

  const handleRetry = useCallback(() => {
    if (retryLockRef.current) return;
    retryLockRef.current = true;
    onRetry();
  }, [onRetry]);

  // Keyboard shortcut — Enter or Escape rises again (Esc parity Victory / continue-family)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return;
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      handleRetry();
    }
  }, [handleRetry]);

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
    <div ref={rootRef} className="game-over" role="dialog" aria-modal="true" aria-label="Fallen">
      <SceneBackdrop background={background} dim={0.2}>
        {/* Red death vignette — layered inside content (z-10), behind all real content */}
        <div className="game-over__death-vignette" aria-hidden="true" />
      <div className="game-over__content">
        {/* Death Icon */}
        <Skull size={64} className="game-over__icon" />

        {/* Title — epitaph, same chrome language as victory */}
        <h1 className="game-over__title">Fallen</h1>

        {/* Stats Panel */}
        <div className="game-over__panel">
          <p className="game-over__location">
            Cut down at {locationName}
            <span className={`game-over__danger ${getDangerModifier(dangerLevel)}`}>
              (Danger {dangerLevel})
            </span>
          </p>

          <p className="game-over__region">{regionName}</p>
          <p className="game-over__hint">
            The mist keeps what it takes. Approach harder. Rest when the path allows. Seek the region’s end.
          </p>

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
            <div className="game-over__story" aria-label="Path marks this run">
              <p className="game-over__story-title">Marks you carried</p>
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
        <button type="button" onClick={handleRetry} className="game-over__retry" autoFocus>
          <span className="game-over__retry-text">Rise Again</span>
          <span className="sw-shortcut">Enter</span>
          <span className="sw-shortcut">Esc</span>
        </button>
      </div>
      </SceneBackdrop>
    </div>
  );
};

export default GameOver;
