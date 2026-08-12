/**
 * Minimal persistent HUD for cinematic exploration (T-022).
 * name/Lv · HP/CP compact · ryo · approach (A) · bag (I) · character sheet (C)
 * T-040: story-run flag chips (eventFlags → combat/loot mods, same as T-037 combat HUD)
 */

import React from 'react';
import { Player, RegionLootTheme, TreasureHunt, MAX_BAG_SLOTS, ApproachType } from '../../game/types';
import { Coins, Backpack, ScrollText, Crosshair, Map } from 'lucide-react';
import { APPROACH_DEFINITIONS } from '../../game/constants/approaches';
import { getApproachArt } from '../../game/constants/artRegistry';
import { getEventFlagRunModifiers } from '../../game/systems/EventSystem';
import './ExplorationHUD.css';

interface ExplorationHUDProps {
  player: Player;
  maxHp: number;
  maxChakra: number;
  onOpenBag: () => void;
  onOpenCharacter: () => void;
  /** Open preferred-approach picker (applies to all encounters) */
  onOpenApproach?: () => void;
  bagOpen?: boolean;
  characterOpen?: boolean;
  approachOpen?: boolean;
  /**
   * T-100: region lootTheme for cinematic chrome (sidebars often hidden).
   * Same Affinity / Focus / Ryo language as LocationPanel (T-099).
   */
  lootTheme?: RegionLootTheme | null;
  /** A4: optional location identity chip (name + danger) when inside a location */
  locationLabel?: string | null;
  dangerLevel?: number | null;
  /** Active treasure-map hunt progress shown below the top HUD strip. */
  treasureHunt?: TreasureHunt | null;
}

const ExplorationHUD: React.FC<ExplorationHUDProps> = ({
  player,
  maxHp,
  maxChakra,
  onOpenBag,
  onOpenCharacter,
  onOpenApproach,
  bagOpen = false,
  characterOpen = false,
  approachOpen = false,
  lootTheme: _lootTheme = null,
  locationLabel = null,
  dangerLevel = null,
  treasureHunt = null,
}) => {
  void _lootTheme;
  const hpPct = maxHp > 0 ? Math.min(100, (player.currentHp / maxHp) * 100) : 0;
  const cpPct = maxChakra > 0 ? Math.min(100, (player.currentChakra / maxChakra) * 100) : 0;
  const runFlagLabels = getEventFlagRunModifiers(player).activeLabels;
  const bagUsed = player.bag.filter((s) => s != null).length;
  const bagFull = bagUsed >= MAX_BAG_SLOTS;
  const preferred =
    player.preferredApproach ?? ApproachType.FRONTAL_ASSAULT;
  const approachDef = APPROACH_DEFINITIONS[preferred];
  const approachShort =
    approachDef?.name?.split(' ')[0] ?? 'Approach';

  return (
    <div className="explore-hud-stack">
      <div className="explore-hud" role="toolbar" aria-label="Exploration HUD">
      <div className="explore-hud__identity">
        <div className="explore-hud__identity-row">
          <span className="explore-hud__name">{player.clan}</span>
          <span className="explore-hud__level">LV.{player.level}</span>
          {locationLabel && (
            <span className="explore-hud__loc" title="Current location">
              {locationLabel}
              {dangerLevel != null && (
                <span className={`explore-hud__loc-d explore-hud__loc-d--d${dangerLevel}`}>
                  D{dangerLevel}
                </span>
              )}
            </span>
          )}
        </div>
        {/* XP Bar under name */}
        <div className="explore-hud__xp" title={`XP: ${player.exp}/${player.maxExp}`}>
          <div className="explore-hud__xp-track">
            <div
              className="explore-hud__fill explore-hud__fill--xp"
              style={{ width: `${player.maxExp > 0 ? Math.min(100, (player.exp / player.maxExp) * 100) : 0}%` }}
            />
          </div>
          <span className="explore-hud__xp-val">
            {player.exp}/{player.maxExp} XP
          </span>
        </div>
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

      <div className="explore-hud__ryo" title="Ryo">
        <Coins size={14} aria-hidden />
        <span>{player.ryo.toLocaleString()}</span>
      </div>

        <div className="explore-hud__actions">
        {onOpenApproach && (() => {
          const approachArt = getApproachArt(preferred);
          return (
          <button
            type="button"
            className={`explore-hud__btn explore-hud__btn--approach ${approachOpen ? 'explore-hud__btn--active' : ''}`}
            onClick={onOpenApproach}
            title={`Approach: ${approachDef?.name ?? 'Frontal Assault'} (A) — applies to all encounters`}
            aria-pressed={approachOpen}
            aria-label={`Set approach, currently ${approachDef?.name ?? 'Frontal Assault'}`}
          >
            {approachArt.src ? (
              <img
                src={approachArt.src}
                alt=""
                className="explore-hud__approach-icon"
                aria-hidden
                draggable={false}
              />
            ) : (
              <Crosshair size={16} aria-hidden />
            )}
            <span className="explore-hud__btn-label" aria-hidden="true">
              {approachShort}
            </span>
            <span className="explore-hud__btn-key">A</span>
          </button>
          );
        })()}
        <button
          type="button"
          className={`explore-hud__btn ${bagOpen ? 'explore-hud__btn--active' : ''} ${bagFull ? 'explore-hud__btn--warn' : ''}`}
          onClick={onOpenBag}
          title={`Bag ${bagUsed}/${MAX_BAG_SLOTS} (I)${bagFull ? ' — full' : ''}`}
          aria-pressed={bagOpen}
          aria-label={`Open bag, ${bagUsed} of ${MAX_BAG_SLOTS} slots used${bagFull ? ', full' : ''}`}
        >
          <Backpack size={16} aria-hidden />
          <span className="explore-hud__btn-count" aria-hidden="true">
            {bagUsed}/{MAX_BAG_SLOTS}
          </span>
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

      {treasureHunt?.isActive && (
        <div
          className="explore-hud__map-progress"
          role="status"
          title={`Map pieces: ${treasureHunt.collectedPieces}/${treasureHunt.requiredPieces}`}
          aria-label={`Map pieces collected: ${treasureHunt.collectedPieces} of ${treasureHunt.requiredPieces}`}
        >
          <Map size={14} aria-hidden />
          <span className="explore-hud__map-label">MAP PIECES</span>
          <div className="explore-hud__map-segments" aria-hidden="true">
            {Array.from({ length: treasureHunt.requiredPieces }).map((_, index) => (
              <span
                key={index}
                className={`explore-hud__map-segment ${
                  index < treasureHunt.collectedPieces
                    ? 'explore-hud__map-segment--filled'
                    : ''
                }`}
              />
            ))}
          </div>
          <span className="explore-hud__map-count">
            {treasureHunt.collectedPieces}/{treasureHunt.requiredPieces}
          </span>
        </div>
      )}
    </div>
  );
};

export default ExplorationHUD;
