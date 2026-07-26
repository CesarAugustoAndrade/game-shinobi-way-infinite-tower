/**
 * Campaign victory screen (T-023). Provisional after Wave with only region 1.
 * T-044: story-run bonus chips from eventFlags.
 */

import React, { useEffect, useRef } from 'react';
import { Player } from '../../game/types';
import { getEventFlagRunModifiers } from '../../game/systems/EventSystem';
import { SceneBackdrop } from '../../components/layout/SceneBackdrop';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './Victory.css';

interface VictoryProps {
  clan: string;
  level: number;
  ryo: number;
  locationsCleared: number;
  regionsCompleted: number;
  lastRegionName: string;
  provisional?: boolean;
  /** T-027: infinite mode unlocked after full campaign */
  infiniteUnlocked?: boolean;
  /** T-044: optional player for story chips */
  player?: Player | null;
  onMenu: () => void;
  onStartInfinite?: () => void;
  background?: string;
}

const Victory: React.FC<VictoryProps> = ({
  clan,
  level,
  ryo,
  locationsCleared,
  regionsCompleted,
  lastRegionName,
  provisional = false,
  infiniteUnlocked = false,
  player,
  onMenu,
  onStartInfinite,
  background,
}) => {
  const storyLabels = player ? getEventFlagRunModifiers(player).activeLabels : [];
  const rootRef = useRef<HTMLDivElement>(null);
  useFocusTrap(rootRef);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Escape → Gate (parity CharacterSelect / GameGuide; cancel before Infinite)
      if (e.key === 'Escape' && !e.repeat) {
        e.preventDefault();
        onMenu();
        return;
      }
      // Let focused CTA (Return / Infinite) use native activation — do not
      // force onMenu when Infinite Ascent is focused.
      if (e.repeat) return;
      if (e.key === 'Enter') {
        if (e.target instanceof HTMLElement && e.target.closest('button, a[href], [role="button"]')) {
          return;
        }
        e.preventDefault();
        onMenu();
        return;
      }
      if ((e.key === 'i' || e.key === 'I') && infiniteUnlocked && onStartInfinite) {
        e.preventDefault();
        onStartInfinite();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onMenu, infiniteUnlocked, onStartInfinite]);

  return (
    <div ref={rootRef} className="victory" role="dialog" aria-modal="true" aria-label="Victory">
      <SceneBackdrop background={background} dim={0.3}>
        <div className="victory__panel">
          <p className="victory__eyebrow">
            {provisional ? 'The path seals behind you' : 'The campaign is written'}
          </p>
          <h1 className="victory__title">Victory</h1>
          <p className="victory__sub">
            {clan} walked out of <strong>{lastRegionName}</strong>
            {provisional
              ? ' — Wave Country falls silent. The sealed road still climbs.'
              : ' — the tower still rises. Infinite Ascent waits.'}
          </p>

          <ul className="victory__stats">
            <li>
              <span>Level</span>
              <span>{level}</span>
            </li>
            <li>
              <span>Ryo</span>
              <span>{ryo.toLocaleString()}</span>
            </li>
            <li>
              <span>Locations cleared</span>
              <span>{locationsCleared}</span>
            </li>
            <li>
              <span>Regions completed</span>
              <span>{regionsCompleted}</span>
            </li>
          </ul>

          {storyLabels.length > 0 && (
            <div className="victory__story" aria-label="Path marks this run">
              <p className="victory__story-title">Marks you kept</p>
              <div className="victory__story-chips">
                {storyLabels.map((label) => (
                  <span key={label} className="victory__story-chip">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="victory__actions">
            {infiniteUnlocked && onStartInfinite && (
              <button type="button" className="victory__btn victory__btn--infinite" onClick={onStartInfinite}>
                Infinite Ascent
                <span className="victory__key">I</span>
              </button>
            )}
            <button type="button" className="victory__btn" onClick={onMenu} autoFocus>
              Return to the Gate
              <span className="victory__key">Enter</span>
              <span className="victory__key">Esc</span>
            </button>
          </div>
        </div>
      </SceneBackdrop>
    </div>
  );
};

export default Victory;
