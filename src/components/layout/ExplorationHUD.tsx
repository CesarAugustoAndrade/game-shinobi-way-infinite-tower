/**
 * Minimal persistent HUD for cinematic exploration (T-022).
 * name/Lv · HP/CP compact · ryo · main attack (M) · approach (A) · bag (I) · character sheet (C)
 * T-040: story-run flag chips (eventFlags → combat/loot mods, same as T-037 combat HUD)
 */

import React, { useEffect, useRef } from 'react';
import {
  Player,
  RegionLootTheme,
  TreasureHunt,
  MAX_BAG_SLOTS,
  ApproachType,
  ApproachOption,
  CardRole,
} from '../../game/types';
import { Coins, Backpack, ScrollText, Crosshair, Map, Swords } from 'lucide-react';
import {
  APPROACH_DEFINITIONS,
  getApproachBenefitTags,
  getApproachFailureTags,
} from '../../game/constants/approaches';
import { getApproachArt, getSkillArt } from '../../game/constants/artRegistry';
import { getEventFlagRunModifiers } from '../../game/systems/EventSystem';
import ArtIcon from '../shared/ArtIcon';
import Tooltip from '../shared/Tooltip';
import './ExplorationHUD.css';

function approachReqLine(def: ApproachOption): string | null {
  const req = def.requirements;
  const parts: string[] = [];
  if (req.minStats && req.minStats.length > 0) {
    for (const gate of req.minStats) {
      parts.push(`${gate.stat} ${gate.value}+`);
    }
  } else if (req.minStat) {
    parts.push(`${req.minStat.stat} ${req.minStat.value}+`);
  }
  if (req.requiredSkill) parts.push(req.requiredSkill);
  return parts.length > 0 ? `Needs ${parts.join(', ')}` : null;
}

function ApproachTip({ type }: { type: ApproachType }) {
  const def = APPROACH_DEFINITIONS[type];
  const win = getApproachBenefitTags(type);
  const fail = getApproachFailureTags(type);
  const cp = def.successEffects.chakraCost;
  const hp = def.successEffects.hpCost;
  const need = approachReqLine(def);
  return (
    <div className="explore-hud__tip">
      <div className="explore-hud__tip-name">{def.name}</div>
      <p className="explore-hud__tip-body">{def.description}</p>
      {need && <p className="explore-hud__tip-need">{need}</p>}
      {(cp > 0 || hp > 0) && (
        <p className="explore-hud__tip-cost">
          {cp > 0 ? `${cp} CP` : ''}
          {cp > 0 && hp > 0 ? ' · ' : ''}
          {hp > 0 ? `${hp} HP` : ''}
        </p>
      )}
      <p className="explore-hud__tip-row">
        <span className="explore-hud__tip-k">Win</span> {win.join(' · ')}
      </p>
      {fail.length > 0 && (
        <p className="explore-hud__tip-row explore-hud__tip-row--fail">
          <span className="explore-hud__tip-k">Fail</span> {fail.join(' · ')}
        </p>
      )}
    </div>
  );
}

interface ExplorationHUDProps {
  player: Player;
  maxHp: number;
  maxChakra: number;
  onOpenBag: () => void;
  onOpenCharacter: () => void;
  /** Set preferred approach for all encounters. */
  onChangeApproach?: (approach: ApproachType) => void;
  onToggleApproachMenu?: () => void;
  onCloseApproachMenu?: () => void;
  /** Designate Main Attack (out of combat). */
  onChangeMainAttack?: (skillId: string) => void;
  onToggleMainMenu?: () => void;
  onCloseMainMenu?: () => void;
  bagOpen?: boolean;
  characterOpen?: boolean;
  approachMenuOpen?: boolean;
  mainMenuOpen?: boolean;
  /** Combat lock — Main cannot be rewritten in COMBAT. */
  mainLocked?: boolean;
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
  onChangeApproach,
  onToggleApproachMenu,
  onCloseApproachMenu,
  onChangeMainAttack,
  onToggleMainMenu,
  onCloseMainMenu,
  bagOpen = false,
  characterOpen = false,
  approachMenuOpen = false,
  mainMenuOpen = false,
  mainLocked = false,
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
  const attackSkills = player.skills
    .filter((skill) => skill.cardRole === CardRole.ATTACK)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
  const mainId = player.skillConfig?.mainAttackId ?? null;
  const mainSkill =
    attackSkills.find((skill) => skill.id === mainId) ??
    player.skills.find((skill) => skill.id === mainId) ??
    null;
  const mainName = mainSkill?.name ?? (mainId || '—');
  const mainArt = mainSkill ? getSkillArt(mainSkill) : mainId ? getSkillArt(mainId) : null;
  const canEditMain = Boolean(onChangeMainAttack) && !mainLocked && attackSkills.length > 0;
  const mainMenuRef = useRef<HTMLDivElement>(null);
  const approachMenuRef = useRef<HTMLDivElement>(null);
  const approachList = Object.values(APPROACH_DEFINITIONS);

  useEffect(() => {
    if (!mainMenuOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!mainMenuRef.current?.contains(event.target as Node)) {
        onCloseMainMenu?.();
      }
    };
    window.addEventListener('pointerdown', onPointer);
    return () => window.removeEventListener('pointerdown', onPointer);
  }, [mainMenuOpen, onCloseMainMenu]);

  useEffect(() => {
    if (!approachMenuOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!approachMenuRef.current?.contains(event.target as Node)) {
        onCloseApproachMenu?.();
      }
    };
    window.addEventListener('pointerdown', onPointer);
    return () => window.removeEventListener('pointerdown', onPointer);
  }, [approachMenuOpen, onCloseApproachMenu]);

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
        {onChangeMainAttack && (
          <div className="explore-hud__main" ref={mainMenuRef}>
            <button
              type="button"
              className={`explore-hud__btn explore-hud__btn--main ${mainMenuOpen ? 'explore-hud__btn--active' : ''}`}
              onClick={() => {
                if (!canEditMain) return;
                onToggleMainMenu?.();
              }}
              disabled={!canEditMain}
              title={
                mainLocked
                  ? `Main Attack: ${mainName} — locked in combat`
                  : attackSkills.length === 0
                    ? 'No ATTACK skills in loadout'
                    : `Main Attack: ${mainName} (M)`
              }
              aria-haspopup="listbox"
              aria-expanded={mainMenuOpen}
              aria-label={`Main Attack, currently ${mainName}`}
            >
              {mainArt ? (
                <ArtIcon art={mainArt} size="sm" className="explore-hud__main-icon" title={mainName} />
              ) : (
                <Swords size={16} aria-hidden />
              )}
              <span className="explore-hud__btn-label" aria-hidden="true">
                {mainSkill?.name ?? 'MAIN'}
              </span>
              <span className="explore-hud__btn-key">M</span>
            </button>
            {mainMenuOpen && canEditMain && (
              <ul className="explore-hud__main-menu" role="listbox" aria-label="Choose Main Attack">
                {attackSkills.map((skill) => {
                  const selected = skill.id === mainId;
                  const art = getSkillArt(skill);
                  return (
                    <li key={skill.id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={`explore-hud__main-option ${selected ? 'explore-hud__main-option--current' : ''}`}
                        onClick={() => {
                          onChangeMainAttack(skill.id);
                          onCloseMainMenu?.();
                        }}
                      >
                        <ArtIcon art={art} size="sm" className="explore-hud__main-icon" title={skill.name} />
                        <span className="explore-hud__main-option-name">{skill.name}</span>
                        {selected && <span className="explore-hud__main-option-mark">MAIN</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
        {onChangeApproach && (
          <div className="explore-hud__approach" ref={approachMenuRef}>
            <button
              type="button"
              className={`explore-hud__btn explore-hud__btn--approach ${approachMenuOpen ? 'explore-hud__btn--active' : ''}`}
              onClick={() => onToggleApproachMenu?.()}
              title={`Approach: ${approachDef?.name ?? 'Frontal Assault'} (A)`}
              aria-haspopup="listbox"
              aria-expanded={approachMenuOpen}
              aria-label={`Approach, currently ${approachDef?.name ?? 'Frontal Assault'}`}
            >
              {(() => {
                const approachArt = getApproachArt(preferred);
                return approachArt.src ? (
                  <img
                    src={approachArt.src}
                    alt=""
                    className="explore-hud__approach-icon"
                    aria-hidden
                    draggable={false}
                  />
                ) : (
                  <Crosshair size={16} aria-hidden />
                );
              })()}
              <span className="explore-hud__btn-label" aria-hidden="true">
                {approachShort}
              </span>
              <span className="explore-hud__btn-key">A</span>
            </button>
            {approachMenuOpen && (
              <ul className="explore-hud__main-menu" role="listbox" aria-label="Choose approach">
                {approachList.map((def) => {
                  const selected = def.type === preferred;
                  const art = getApproachArt(def.type);
                  return (
                    <li key={def.type} role="presentation">
                      <Tooltip
                        content={<ApproachTip type={def.type} />}
                        position="left"
                        className="explore-hud__tip-host"
                      >
                        <button
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className={`explore-hud__main-option ${selected ? 'explore-hud__main-option--current' : ''}`}
                          onClick={() => {
                            onChangeApproach(def.type);
                            onCloseApproachMenu?.();
                          }}
                        >
                          {art.src ? (
                            <img
                              src={art.src}
                              alt=""
                              className="explore-hud__approach-icon"
                              aria-hidden
                              draggable={false}
                            />
                          ) : (
                            <Crosshair size={14} aria-hidden />
                          )}
                          <span className="explore-hud__main-option-name">{def.name}</span>
                          {selected && <span className="explore-hud__main-option-mark">ON</span>}
                        </button>
                      </Tooltip>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
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
