/**
 * Campaign victory screen (T-023). Provisional after Wave with only region 1.
 */

import React, { useEffect, useCallback } from 'react';
import { SceneBackdrop } from '../../components/layout/SceneBackdrop';
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
  onMenu,
  onStartInfinite,
  background,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onMenu();
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
    <div className="victory">
      <SceneBackdrop background={background} dim={0.3}>
        <div className="victory__panel">
          <p className="victory__eyebrow">
            {provisional ? 'Provisional Clear' : 'Campaign Complete'}
          </p>
          <h1 className="victory__title">Victory</h1>
          <p className="victory__sub">
            {clan} cleared <strong>{lastRegionName}</strong>
            {provisional
              ? ' — more regions await in future patches.'
              : ' — the tower still rises. Infinite Ascent awaits.'}
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

          <div className="victory__actions">
            {infiniteUnlocked && onStartInfinite && (
              <button type="button" className="victory__btn victory__btn--infinite" onClick={onStartInfinite}>
                Infinite Ascent
                <span className="victory__key">I</span>
              </button>
            )}
            <button type="button" className="victory__btn" onClick={onMenu}>
              Return to Menu
              <span className="victory__key">Enter</span>
            </button>
          </div>
        </div>
      </SceneBackdrop>
    </div>
  );
};

export default Victory;
