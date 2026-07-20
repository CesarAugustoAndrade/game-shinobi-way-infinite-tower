/**
 * Minimal persistent HUD for cinematic exploration (T-022).
 * name/Lv · HP/CP compact · ryo · bag (I) · character sheet (C)
 * T-040: story-run flag chips (eventFlags → combat/loot mods, same as T-037 combat HUD)
 */

import React from 'react';
import { Player, RegionLootTheme } from '../../game/types';
import { Coins, Backpack, ScrollText } from 'lucide-react';
import { getEventFlagRunModifiers } from '../../game/systems/EventSystem';
import './ExplorationHUD.css';

interface ExplorationHUDProps {
  player: Player;
  maxHp: number;
  maxChakra: number;
  onOpenBag: () => void;
  onOpenCharacter: () => void;
  bagOpen?: boolean;
  characterOpen?: boolean;
  /**
   * T-100: region lootTheme for cinematic chrome (sidebars often hidden).
   * Same Affinity / Focus / Ryo language as LocationPanel (T-099).
   */
  lootTheme?: RegionLootTheme | null;
}

const ExplorationHUD: React.FC<ExplorationHUDProps> = ({
  player,
  maxHp,
  maxChakra,
  onOpenBag,
  onOpenCharacter,
  bagOpen = false,
  characterOpen = false,
  lootTheme = null,
}) => {
  const hpPct = maxHp > 0 ? Math.min(100, (player.currentHp / maxHp) * 100) : 0;
  const cpPct = maxChakra > 0 ? Math.min(100, (player.currentChakra / maxChakra) * 100) : 0;
  const runFlagLabels = getEventFlagRunModifiers(player).activeLabels;

  return (
    <div className="explore-hud" role="toolbar" aria-label="Exploration HUD">
      <div className="explore-hud__identity">
        <span className="explore-hud__name">{player.clan}</span>
        <span className="explore-hud__level">Lv.{player.level}</span>
      </div>

      <div className="explore-hud__bars">
        <div className="explore-hud__bar explore-hud__bar--hp" title={`HP ${player.currentHp}/${maxHp}`}>
          <span className="explore-hud__bar-label">HP</span>
          <div className="explore-hud__bar-track">
            <div className="explore-hud__bar-fill explore-hud__bar-fill--hp" style={{ width: `${hpPct}%` }} />
          </div>
          <span className="explore-hud__bar-val">
            {Math.floor(player.currentHp)}/{maxHp}
          </span>
        </div>
        <div className="explore-hud__bar explore-hud__bar--cp" title={`CP ${player.currentChakra}/${maxChakra}`}>
          <span className="explore-hud__bar-label">CP</span>
          <div className="explore-hud__bar-track">
            <div className="explore-hud__bar-fill explore-hud__bar-fill--cp" style={{ width: `${cpPct}%` }} />
          </div>
          <span className="explore-hud__bar-val">
            {Math.floor(player.currentChakra)}/{maxChakra}
          </span>
        </div>
      </div>

      {/* T-040: narrative run bonuses (same source as combat PlayerHUD chips) */}
      {runFlagLabels.length > 0 && (
        <div
          className="explore-hud__run-flags"
          title="Bonuses from story choices this run"
          aria-label={`Story bonuses: ${runFlagLabels.join(', ')}`}
        >
          {runFlagLabels.map((label) => (
            <span key={label} className="explore-hud__run-flag">
              {label}
            </span>
          ))}
        </div>
      )}

      {/* T-100: region theme (persistent when left sidebar hidden) */}
      {lootTheme && (
        <div
          className="explore-hud__theme"
          title="Region theme — Affinity / Focus / Ryo"
          aria-label="Region theme"
        >
          {lootTheme.primaryElement && (
            <span className="explore-hud__theme-chip explore-hud__theme-chip--affinity">
              {lootTheme.primaryElement}
            </span>
          )}
          {lootTheme.equipmentFocus?.length > 0 && (
            <span className="explore-hud__theme-chip explore-hud__theme-chip--focus">
              Focus{' '}
              {lootTheme.equipmentFocus
                .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                .join(' · ')}
            </span>
          )}
          {lootTheme.goldMultiplier !== 1 && (
            <span className="explore-hud__theme-chip explore-hud__theme-chip--gold">
              Ryo ×{lootTheme.goldMultiplier}
            </span>
          )}
        </div>
      )}

      <div className="explore-hud__ryo" title="Ryo">
        <Coins size={14} aria-hidden />
        <span>{player.ryo.toLocaleString()}</span>
      </div>

      <div className="explore-hud__actions">
        <button
          type="button"
          className={`explore-hud__btn ${bagOpen ? 'explore-hud__btn--active' : ''}`}
          onClick={onOpenBag}
          title="Bag (I)"
          aria-pressed={bagOpen}
          aria-label="Open bag"
        >
          <Backpack size={16} aria-hidden />
          <span className="explore-hud__btn-key">I</span>
        </button>
        <button
          type="button"
          className={`explore-hud__btn ${characterOpen ? 'explore-hud__btn--active' : ''}`}
          onClick={onOpenCharacter}
          title="Character sheet (C)"
          aria-pressed={characterOpen}
          aria-label="Open character sheet"
        >
          <ScrollText size={16} aria-hidden />
          <span className="explore-hud__btn-key">C</span>
        </button>
      </div>
    </div>
  );
};

export default ExplorationHUD;
