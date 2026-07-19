/**
 * Character sheet overlay for cinematic exploration (T-022).
 * Primary + derived stats + active buffs. ESC / backdrop / X close.
 */

import React, { useEffect } from 'react';
import { Player, CharacterStats } from '../../game/types';
import PrimaryStatsPanel from '../character/PrimaryStatsPanel';
import DerivedStatsPanel from '../character/DerivedStatsPanel';
import {
  getBuffDescription,
  getEffectIcon,
  getEffectColor,
} from '../../game/utils/tooltipFormatters';
import { X } from 'lucide-react';
import './exploreOverlays.css';

interface CharacterSheetOverlayProps {
  player: Player;
  playerStats: CharacterStats;
  onClose: () => void;
}

const CharacterSheetOverlay: React.FC<CharacterSheetOverlayProps> = ({
  player,
  playerStats,
  onClose,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div className="explore-overlay" role="dialog" aria-modal="true" aria-label="Character sheet">
      <button
        type="button"
        className="explore-overlay__backdrop"
        aria-label="Close character sheet"
        onClick={onClose}
      />
      <div className="explore-overlay__panel explore-overlay__panel--sheet">
        <header className="explore-overlay__header">
          <h2 className="explore-overlay__title">
            📜 {player.clan} · Lv.{player.level}
          </h2>
          <span className="explore-overlay__hint">
            <kbd>C</kbd> toggle · <kbd>Esc</kbd> close
          </span>
          <button type="button" className="explore-overlay__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="explore-overlay__body">
          <PrimaryStatsPanel player={player} effectivePrimary={playerStats.effectivePrimary} />
          <DerivedStatsPanel derived={playerStats.derived} />

          <section className="explore-overlay__buffs">
            <h3 className="explore-overlay__section-title">Active Buffs</h3>
            {player.activeBuffs.length === 0 ? (
              <p className="explore-overlay__empty">No active buffs</p>
            ) : (
              <ul className="explore-overlay__buff-list">
                {player.activeBuffs.map((buff, idx) => (
                  <li key={buff.id || idx} className="explore-overlay__buff">
                    <span className={getEffectColor(buff.effect.type)} aria-hidden>
                      {getEffectIcon(buff.effect.type)}
                    </span>
                    <span className="explore-overlay__buff-text">{getBuffDescription(buff)}</span>
                    <span className="explore-overlay__buff-dur">{buff.duration}t</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheetOverlay;
