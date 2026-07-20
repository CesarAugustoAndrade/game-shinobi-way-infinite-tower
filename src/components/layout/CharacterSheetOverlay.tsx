/**
 * Character sheet overlay for cinematic exploration (T-022).
 * Primary + derived stats + active buffs + story-run bonuses (T-042).
 * ESC / backdrop / X close.
 */

import React, { useEffect } from 'react';
import { Player, CharacterStats, RegionLootTheme } from '../../game/types';
import PrimaryStatsPanel from '../character/PrimaryStatsPanel';
import DerivedStatsPanel from '../character/DerivedStatsPanel';
import {
  getBuffDescription,
  getEffectIcon,
  getEffectColor,
} from '../../game/utils/tooltipFormatters';
import { getEventFlagRunModifiers } from '../../game/systems/EventSystem';
import { X } from 'lucide-react';
import './exploreOverlays.css';

interface CharacterSheetOverlayProps {
  player: Player;
  playerStats: CharacterStats;
  onClose: () => void;
  /**
   * T-101: region lootTheme for Affinity/Focus/Ryo + Focus stat marks on primary panel.
   */
  lootTheme?: RegionLootTheme | null;
}

const CharacterSheetOverlay: React.FC<CharacterSheetOverlayProps> = ({
  player,
  playerStats,
  onClose,
  lootTheme = null,
}) => {
  const flagMods = getEventFlagRunModifiers(player);
  const runFlagLabels = flagMods.activeLabels;

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
          {/* T-101: current region theme (matches LocationPanel / ExplorationHUD) */}
          {lootTheme && (
            <section className="explore-overlay__region" aria-label="Region theme">
              <h3 className="explore-overlay__section-title">Region Theme</h3>
              <div className="explore-overlay__region-chips">
                {lootTheme.primaryElement && (
                  <span className="explore-overlay__region-chip explore-overlay__region-chip--affinity">
                    Affinity {lootTheme.primaryElement}
                  </span>
                )}
                {lootTheme.equipmentFocus?.length > 0 && (
                  <span className="explore-overlay__region-chip explore-overlay__region-chip--focus">
                    Focus{' '}
                    {lootTheme.equipmentFocus
                      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                      .join(' · ')}
                  </span>
                )}
                {lootTheme.goldMultiplier !== 1 && (
                  <span className="explore-overlay__region-chip explore-overlay__region-chip--gold">
                    Ryo ×{lootTheme.goldMultiplier}
                  </span>
                )}
              </div>
            </section>
          )}

          <PrimaryStatsPanel
            player={player}
            effectivePrimary={playerStats.effectivePrimary}
            equipmentFocus={lootTheme?.equipmentFocus}
          />
          <DerivedStatsPanel derived={playerStats.derived} />

          {/* T-042: story-run bonuses from eventFlags (same source as HUD chips) */}
          <section className="explore-overlay__story" aria-label="Story bonuses this run">
            <h3 className="explore-overlay__section-title">Story Bonuses</h3>
            {runFlagLabels.length === 0 ? (
              <p className="explore-overlay__empty">No story bonuses yet — your event choices will appear here.</p>
            ) : (
              <>
                <ul className="explore-overlay__story-list">
                  {runFlagLabels.map((label) => (
                    <li key={label} className="explore-overlay__story-chip">
                      {label}
                    </li>
                  ))}
                </ul>
                {(flagMods.damageBonus > 0 || flagMods.ryoMultiplier !== 1) && (
                  <p className="explore-overlay__story-summary">
                    {flagMods.damageBonus > 0 && (
                      <span>+{Math.round(flagMods.damageBonus * 100)}% combat damage</span>
                    )}
                    {flagMods.damageBonus > 0 && flagMods.ryoMultiplier !== 1 && <span> · </span>}
                    {flagMods.ryoMultiplier !== 1 && (
                      <span>×{flagMods.ryoMultiplier.toFixed(2)} Ryō from victories</span>
                    )}
                  </p>
                )}
              </>
            )}
          </section>

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
