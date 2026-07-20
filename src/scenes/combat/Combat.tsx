import React, { useState, useCallback, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import {
  Player,
  Enemy,
  Skill,
  EffectType,
  DamageType,
  CharacterStats,
  Rarity,
  ActionType,
  Posture,
  LogEntry,
} from '../../game/types';
import StatBar from '../../components/shared/StatBar';
import Tooltip from '../../components/shared/Tooltip';
import { CinematicViewscreen } from '../../components/layout/CinematicViewscreen';
import PlayerHUD from '../../components/character/PlayerHUD';
import FloatingText, { FloatingTextItem, FloatingTextType } from '../../components/combat/FloatingText';
import GameLog from '../../components/combat/GameLog';
import { Hand, HAND_SHORTCUTS } from '../../components/combat/Hand';
import { PostureIndicator } from '../../components/combat/PostureIndicator';
import { FeatureFlags } from '../../config/featureFlags';
import { getApCost } from '../../game/constants/combatCards';
import { APPROACH_DEFINITIONS } from '../../game/constants/approaches';
import { ApproachResult } from '../../game/systems/ApproachSystem';
import { describePosture } from '../../game/systems/PostureSystem';
import { Hourglass, Zap, ZapOff } from 'lucide-react';
import { formatPercent } from '../../game/systems/StatSystem';
import {
  getEffectColor,
  getEffectIcon,
  getBuffDescription,
  getCategoryRanks,
  getRankColor,
  getDetailedEffectMechanics,
  getEffectTip,
  getEffectSeverity,
  getSeverityColor,
  isPositiveEffect,
} from '../../game/utils/tooltipFormatters';
import { getEnemyArt } from '../../game/constants/artRegistry';
import {
  ARCHETYPE_DESCRIPTIONS,
  ELEMENT_ICONS,
  ELEMENT_COLORS,
} from '../../game/constants/enemyArchetypes';
import './Combat.css';

/**
 * Convert a CSS hex color (#rrggbb) to rgba(r, g, b, alpha).
 * Used to build the chakra aura drop-shadow color for enemy sprites.
 */
const hexColorToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export interface CombatRef {
  spawnFloatingText: (target: 'enemy' | 'player', text: string, type: FloatingTextType) => void;
}

interface CombatProps {
  player: Player;
  playerStats: CharacterStats;
  enemy: Enemy;
  enemyStats: CharacterStats;
  turnState: 'PLAYER' | 'ENEMY_TURN';
  /** Cards available to play this turn (T-004 deckbuilder hand). */
  hand: Skill[];
  /** Action Points remaining this turn. */
  currentAp: number;
  /** Action Point budget for the turn. */
  maxAp: number;
  /**
   * T-075: natural AP budget before location movement_penalty.
   * When > maxAp, HUD shows terrain AP cut.
   */
  baseMaxAp?: number;
  /** Active combat posture. */
  posture: Posture;
  /** Switch the active posture (costs AP). */
  onChangePosture: (next: Posture) => void;
  onUseSkill: (skill: Skill) => void;
  onPassTurn: () => void;
  droppedSkill?: Skill | null;
  getDamageTypeColor: (dt: DamageType) => string;
  getRarityColor: (rarity: Rarity) => string;
  autoCombatEnabled?: boolean;
  onToggleAutoCombat?: () => void;
  autoPassTimeRemaining?: number | null;
  /**
   * Full path to the biome background image for the stage (Lámina 1).
   * (e.g. /assets/location_misty_covered_bridge.png).
   * Computed in App.tsx from the current location's biome slug.
   */
  background?: string;
  /** Recent combat log lines for the mini combat log overlay. */
  logs?: LogEntry[];
  /** T-054: approach used to open this fight (optional). */
  approachResult?: ApproachResult | null;
  /** T-071: location terrain effect labels for open banner */
  locationTerrainLines?: string[] | null;
  /** Damage-preview: still on ambush first strike */
  isFirstTurn?: boolean;
  firstHitMultiplier?: number;
  /** FREE_FIRST_SKILL: first accepted skill costs 0 chakra (from combatState) */
  skipFirstSkillCost?: boolean;
  /** Damage-preview: T-063 location terrain mods */
  locationTerrainMods?: import('../../game/systems/LocationTerrainSystem').LocationTerrainMods | null;
  /** Damage-preview: room terrain element amplification */
  roomTerrain?: import('../../game/types').TerrainDefinition | null;
  /** T-103: active room combat condition labels (Ambush, Sanctuary, …) */
  roomConditionNames?: string[] | null;
}

const Combat = forwardRef<CombatRef, CombatProps>(({
  player,
  playerStats,
  enemy,
  enemyStats,
  turnState,
  hand,
  currentAp,
  maxAp,
  baseMaxAp,
  posture,
  onChangePosture,
  onUseSkill: onUseSkillProp,
  onPassTurn: onPassTurnProp,
  getDamageTypeColor,
  autoCombatEnabled = false,
  onToggleAutoCombat,
  autoPassTimeRemaining,
  background,
  logs = [],
  approachResult = null,
  locationTerrainLines = null,
  isFirstTurn = false,
  firstHitMultiplier = 1,
  skipFirstSkillCost = false,
  locationTerrainMods = null,
  roomTerrain = null,
  roomConditionNames = null,
}, ref) => {
  // Floating text state
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
  const [hitFlash, setHitFlash] = useState(false);
  // T-054: show opening approach/posture banner until first action or timeout
  const [showOpenBanner, setShowOpenBanner] = useState(Boolean(approachResult));
  const enemyRef = useRef<HTMLDivElement>(null);
  const playerHudRef = useRef<HTMLDivElement>(null);
  const hitFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setShowOpenBanner(Boolean(approachResult));
  }, [approachResult, enemy?.name]);

  useEffect(() => {
    if (!showOpenBanner) return;
    const t = setTimeout(() => setShowOpenBanner(false), 4200);
    return () => clearTimeout(t);
  }, [showOpenBanner, approachResult]);

  const dismissOpenBanner = useCallback(() => setShowOpenBanner(false), []);

  const onUseSkill = useCallback(
    (skill: Skill) => {
      dismissOpenBanner();
      onUseSkillProp(skill);
    },
    [dismissOpenBanner, onUseSkillProp],
  );

  const onPassTurn = useCallback(() => {
    dismissOpenBanner();
    onPassTurnProp();
  }, [dismissOpenBanner, onPassTurnProp]);

  // Spawn floating text at target location; enemy hits also flash the cutout
  const spawnFloatingText = useCallback((
    target: 'enemy' | 'player',
    text: string,
    type: FloatingTextType
  ) => {
    const targetRef = target === 'enemy' ? enemyRef : playerHudRef;
    const rect = targetRef.current?.getBoundingClientRect();
    if (!rect) return;

    const id = `fct-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 60;
    const y = rect.top + rect.height * (target === 'enemy' ? 0.4 : 0.3);

    setFloatingTexts(prev => [...prev, { id, text, type, position: { x, y } }]);

    // Cheap hit juice: brief flash on the enemy sprite for damage/crit
    if (target === 'enemy' && (type === 'damage' || type === 'crit')) {
      setHitFlash(true);
      if (hitFlashTimer.current) clearTimeout(hitFlashTimer.current);
      hitFlashTimer.current = setTimeout(() => setHitFlash(false), 180);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (hitFlashTimer.current) clearTimeout(hitFlashTimer.current);
    };
  }, []);

  // Remove floating text after animation completes
  const removeFloatingText = useCallback((id: string) => {
    setFloatingTexts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Expose spawnFloatingText to parent via ref
  useImperativeHandle(ref, () => ({
    spawnFloatingText
  }), [spawnFloatingText]);

  // Resolve hand cards to their live skill objects (cooldowns/active state live
  // on player.skills; the hand only carries card identity).
  const handCards = hand
    .map((card) => player.skills.find((s) => s.id === card.id) ?? card)
    .slice(0, HAND_SHORTCUTS.length);

  // Helper to check if a card can be played this turn (resources + AP + state).
  // FREE_FIRST_SKILL: effective chakra cost is 0 while skipFirstSkillCost is set.
  const canUseSkill = useCallback((skill: Skill): boolean => {
    const effectiveChakraCost = skipFirstSkillCost ? 0 : skill.chakraCost;
    const hasResources =
      player.currentChakra >= effectiveChakraCost && player.currentHp > skill.hpCost;
    const noCooldown = skill.currentCooldown === 0;
    const isStunned = player.activeBuffs.some(b => b?.effect?.type === EffectType.STUN);
    const isSilenced = player.activeBuffs.some(b => b?.effect?.type === EffectType.SILENCE);
    // Silence blocks chakra-cost skills; allow free taijutsu and toggle deactivation
    const silencedBlocked = isSilenced && skill.chakraCost > 0 && !skill.isActive;
    const hasAp = currentAp >= getApCost(skill);

    return Boolean((hasResources || skill.isActive) && noCooldown && !isStunned && !silencedBlocked && hasAp);
  }, [player, currentAp, skipFirstSkillCost]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (turnState !== 'PLAYER') return;

      // Tab to toggle auto-pass (end turn after delay — not full auto-resolve combat)
      if (e.key === 'Tab') {
        e.preventDefault();
        onToggleAutoCombat?.();
        return;
      }

      // Space to pass turn
      if (e.code === 'Space') {
        e.preventDefault();
        onPassTurn();
        return;
      }

      // Z/X/C/V play the 4 hand slots
      const handKeyMap: Record<string, number> = {
        'KeyZ': 0, 'z': 0, 'Z': 0,
        'KeyX': 1, 'x': 1, 'X': 1,
        'KeyC': 2, 'c': 2, 'C': 2,
        'KeyV': 3, 'v': 3, 'V': 3,
      };

      const handIndex = handKeyMap[e.code] ?? handKeyMap[e.key];
      if (handIndex !== undefined) {
        const skill = handCards[handIndex];
        if (skill && canUseSkill(skill)) {
          e.preventDefault();
          onUseSkill(skill);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [turnState, handCards, canUseSkill, onUseSkill, onPassTurn, onToggleAutoCombat]);

  // ── Floating enemy info panel (T-014 v3) ─────────────────────────────────
  //
  // Row 1: target-icon + NAME + Lv.N badge
  // Row 2: tier tag + affinity badge
  // Row 3: PHYS / ELEM / MND defense columns
  // Row 4: STATUS EFFECTS (4 slots) + INFO (archetype description)
  // Row 5: HP label + numeric + bar
  //
  // Buff chips (previously top-right of stage) are now in the STATUS EFFECTS
  // section of this panel.

  const activeEffects = enemy.activeBuffs.filter(b => b?.effect);
  const elementColor = ELEMENT_COLORS[enemy.element] ?? '#a1a1aa';
  const elementIcon = ELEMENT_ICONS[enemy.element] ?? '◈';

  // ── Cutout + chakra aura (T-013) ─────────────────────────────────────────
  // Derive the transparent cutout sprite path from the portrait path.
  // Convention: /assets/enemy_<id>.png  →  /assets/enemy_cut_<id>.png
  // onError in CinematicViewscreen falls back to the portrait with mask.
  const enemyCutout = enemy.image?.startsWith('/assets/enemy_')
    ? enemy.image.replace('/assets/enemy_', '/assets/enemy_cut_')
    : undefined;

  // Chakra aura: elemental glow color at 65% opacity for the drop-shadow.
  const chakraAuraColor = hexColorToRgba(elementColor, 0.65);

  const archetypeDesc = enemy.archetype
    ? (ARCHETYPE_DESCRIPTIONS[enemy.archetype] ?? '')
    : '';

  const floatingPanel = (
    <div className="combat__ip">
      {/* Row 1: icon + name + level badge */}
      <div className="combat__ip-name-row">
        <span className="combat__ip-target-icon" aria-hidden="true">◎</span>
        <h2 className="combat__ip-name">{enemy.name}</h2>
        {enemy.dangerLevel != null && (
          <span className="combat__ip-level-badge">Lv. {enemy.dangerLevel}</span>
        )}
      </div>

      {/* Row 2: tier + affinity tags */}
      <div className="combat__ip-tags-row">
        <span className="combat__ip-tier-tag">{enemy.tier}</span>
        <span className="combat__ip-affinity-tag" style={{ color: elementColor }}>
          AFFINITY: {enemy.element} {elementIcon}
        </span>
      </div>

      {/* Divider */}
      <div className="combat__ip-divider" aria-hidden="true" />

      {/* Row 3: PHYS / ELEM / MND columns */}
      <Tooltip
        content={
          (() => {
            const ranks = getCategoryRanks(enemyStats.effectivePrimary);
            return (
              <div className="combat-tooltip">
                <div className="combat-tooltip__enemy-name">{enemy.name}</div>
                <div className="combat-tooltip__enemy-info">{enemy.tier} - {enemy.element} Affinity</div>

                <div className="combat-tooltip__section">
                  <div className="combat-tooltip__category">
                    <span className="combat-tooltip__category-label combat-tooltip__category-label--body">The Body</span>
                    <span className={`combat-tooltip__category-rank ${getRankColor(ranks.body)}`}>{ranks.body}</span>
                  </div>
                  <div className="combat-tooltip__stat-grid">
                    <div><span className="combat-tooltip__stat-abbr--str">STR</span> {enemyStats.effectivePrimary.strength}</div>
                    <div><span className="combat-tooltip__stat-abbr--wil">WIL</span> {enemyStats.effectivePrimary.willpower}</div>
                    <div><span className="combat-tooltip__stat-abbr--cha">CHA</span> {enemyStats.effectivePrimary.chakra}</div>
                  </div>
                  <div className="combat-tooltip__derived">
                    Phys Def: <span className="combat-tooltip__derived-value--phys">{enemyStats.derived.physicalDefenseFlat} + {formatPercent(enemyStats.derived.physicalDefensePercent)}</span>
                  </div>
                </div>

                <div className="combat-tooltip__section">
                  <div className="combat-tooltip__category">
                    <span className="combat-tooltip__category-label combat-tooltip__category-label--mind">The Mind</span>
                    <span className={`combat-tooltip__category-rank ${getRankColor(ranks.mind)}`}>{ranks.mind}</span>
                  </div>
                  <div className="combat-tooltip__stat-grid">
                    <div><span className="combat-tooltip__stat-abbr--spi">SPI</span> {enemyStats.effectivePrimary.spirit}</div>
                    <div><span className="combat-tooltip__stat-abbr--int">INT</span> {enemyStats.effectivePrimary.intelligence}</div>
                    <div><span className="combat-tooltip__stat-abbr--cal">CAL</span> {enemyStats.effectivePrimary.calmness}</div>
                  </div>
                  <div className="combat-tooltip__derived">
                    <div>Elem Def: <span className="combat-tooltip__derived-value--elem">{enemyStats.derived.elementalDefenseFlat} + {formatPercent(enemyStats.derived.elementalDefensePercent)}</span></div>
                    <div>Mind Def: <span className="combat-tooltip__derived-value--mind">{enemyStats.derived.mentalDefenseFlat} + {formatPercent(enemyStats.derived.mentalDefensePercent)}</span></div>
                  </div>
                </div>

                <div className="combat-tooltip__section">
                  <div className="combat-tooltip__category">
                    <span className="combat-tooltip__category-label combat-tooltip__category-label--technique">The Technique</span>
                    <span className={`combat-tooltip__category-rank ${getRankColor(ranks.technique)}`}>{ranks.technique}</span>
                  </div>
                  <div className="combat-tooltip__stat-grid">
                    <div><span className="combat-tooltip__stat-abbr--spd">SPD</span> {enemyStats.effectivePrimary.speed}</div>
                    <div><span className="combat-tooltip__stat-abbr--acc">ACC</span> {enemyStats.effectivePrimary.accuracy}</div>
                    <div><span className="combat-tooltip__stat-abbr--dex">DEX</span> {enemyStats.effectivePrimary.dexterity}</div>
                  </div>
                  <div className="combat-tooltip__derived">
                    <div>Evasion: <span className="combat-tooltip__derived-value--eva">{formatPercent(enemyStats.derived.evasion)}</span></div>
                    <div>Crit: <span className="combat-tooltip__derived-value--crit">{Math.round(enemyStats.derived.critChance)}%</span></div>
                  </div>
                </div>
              </div>
            );
          })()
        }
      >
        <div className="combat__ip-stats-row" role="button" aria-label="View enemy stats detail">
          <div className="combat__ip-stat combat__ip-stat--phys">
            <span className="combat__ip-stat-icon" aria-hidden="true">⚔</span>
            <div className="combat__ip-stat-body">
              <span className="combat__ip-stat-label">PHYS</span>
              <span className="combat__ip-stat-value">{enemyStats.derived.physicalDefenseFlat}<span className="combat__ip-stat-pct">+{Math.round(enemyStats.derived.physicalDefensePercent * 100)}%</span></span>
            </div>
          </div>
          <div className="combat__ip-stat combat__ip-stat--elem">
            <span className="combat__ip-stat-icon" aria-hidden="true">✦</span>
            <div className="combat__ip-stat-body">
              <span className="combat__ip-stat-label">ELEM</span>
              <span className="combat__ip-stat-value">{enemyStats.derived.elementalDefenseFlat}<span className="combat__ip-stat-pct">+{Math.round(enemyStats.derived.elementalDefensePercent * 100)}%</span></span>
            </div>
          </div>
          <div className="combat__ip-stat combat__ip-stat--mnd">
            <span className="combat__ip-stat-icon" aria-hidden="true">◎</span>
            <div className="combat__ip-stat-body">
              <span className="combat__ip-stat-label">MND</span>
              <span className="combat__ip-stat-value">{enemyStats.derived.mentalDefenseFlat}<span className="combat__ip-stat-pct">+{Math.round(enemyStats.derived.mentalDefensePercent * 100)}%</span></span>
            </div>
          </div>
        </div>
      </Tooltip>

      {/* Row 4: STATUS EFFECTS + INFO */}
      <div className="combat__ip-mid-row">
        {/* Status effects: 4 slots */}
        <div className="combat__ip-status">
          <span className="combat__ip-section-label">STATUSEFFECTS</span>
          <div className="combat__ip-status-slots">
            {Array.from({ length: 4 }).map((_, i) => {
              const buff = activeEffects[i];
              if (!buff) {
                return (
                  <div key={i} className="combat__ip-slot combat__ip-slot--empty" aria-label="Empty status slot">
                    <span className="combat__ip-slot-plus" aria-hidden="true">+</span>
                  </div>
                );
              }
              const isPositive = buff.effect ? isPositiveEffect(buff.effect.type) : false;
              const severity = getEffectSeverity(buff);
              const mechanics = getDetailedEffectMechanics(buff);
              const tip = buff.effect ? getEffectTip(buff.effect.type) : '';
              return (
                <Tooltip
                  key={buff.id}
                  content={
                    <div className="combat-tooltip">
                      <div className="combat-tooltip__buff-header">
                        <span className={`combat-tooltip__buff-icon ${buff.effect ? getEffectColor(buff.effect.type) : ''}`}>
                          {buff.effect ? getEffectIcon(buff.effect.type) : '???'}
                        </span>
                        <div>
                          <div className={`combat-tooltip__buff-name ${isPositive ? 'combat-tooltip__buff-name--positive' : getSeverityColor(severity)}`}>
                            {buff.name}
                          </div>
                          <div className="combat-tooltip__buff-type">
                            {isPositive ? 'Enemy Buff' : 'Your Debuff on Enemy'}
                          </div>
                        </div>
                      </div>
                      <div className="combat-tooltip__section">
                        <div className="combat-tooltip__buff-desc">{getBuffDescription(buff)}</div>
                      </div>
                      <div className="combat-tooltip__section">
                        <div className="combat-tooltip__section-title">Mechanics</div>
                        <div className="combat-tooltip__mechanics-list">
                          {mechanics.map((mechanic, mi) => (
                            <div key={mi} className="combat-tooltip__mechanic">
                              <span className="combat-tooltip__mechanic-bullet">-</span>
                              <span>{mechanic}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="combat-tooltip__section combat-tooltip__source-row">
                        <div>
                          <span className="combat-tooltip__source-label">Source: </span>
                          <span className="combat-tooltip__source-value">{buff.source || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="combat-tooltip__duration-label">Remaining: </span>
                          <span className={buff.duration <= 1 ? 'combat-tooltip__duration-value--expiring' : 'combat-tooltip__duration-value'}>
                            {buff.duration === -1 ? 'Permanent' : `${buff.duration} turn${buff.duration !== 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </div>
                      {tip && (
                        <div className="combat-tooltip__section">
                          <div className="combat-tooltip__tip">Tip: {tip}</div>
                        </div>
                      )}
                    </div>
                  }
                >
                  <div
                    className={`combat__ip-slot ${isPositive ? 'combat__ip-slot--positive' : 'combat__ip-slot--negative'}`}
                    aria-label={`${buff.name} (${buff.duration} turns)`}
                  >
                    <span className="combat__ip-slot-icon">
                      {buff.effect ? getEffectIcon(buff.effect.type) : '?'}
                    </span>
                    <span className="combat__ip-slot-duration">{buff.duration}</span>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Enemy info / archetype description */}
        <div className="combat__ip-info">
          <span className="combat__ip-section-label">INFO</span>
          <p className="combat__ip-info-text">
            {archetypeDesc || `${enemy.tier} threat.`}
          </p>
        </div>
      </div>

      {/* Row 5: HP */}
      <div className="combat__ip-hp-row">
        <div className="combat__ip-hp-header">
          <span className="combat__ip-hp-label">HP</span>
          <span className="combat__ip-hp-value">
            <span className="combat__ip-hp-current">{enemy.currentHp}</span>
            <span className="combat__ip-hp-sep"> / </span>
            <span className="combat__ip-hp-max">{enemyStats.derived.maxHp}</span>
          </span>
        </div>
        <StatBar
          current={enemy.currentHp}
          max={enemyStats.derived.maxHp}
          color="red"
          showValue={false}
        />
      </div>
    </div>
  );

  // T-054/T-071: open banner copy from approach + posture + location terrain
  const openBanner = (() => {
    if (!showOpenBanner || !approachResult) return null;
    const def = APPROACH_DEFINITIONS[approachResult.approach];
    const postureProfile = describePosture(posture);
    const effects: string[] = [];
    if (approachResult.success) {
      if (approachResult.guaranteedFirst || approachResult.initiativeBonus > 0) {
        effects.push('You seize the initiative');
      }
      if (approachResult.firstHitMultiplier > 1) {
        effects.push(`First hit ×${approachResult.firstHitMultiplier}`);
      }
      if (approachResult.enemyHpReduction > 0) {
        effects.push(`Enemy −${Math.round(approachResult.enemyHpReduction * 100)}% HP`);
      }
    } else if (turnState === 'ENEMY_TURN') {
      effects.push('Enemy acts first');
    }
    // T-071/T-079: location + room terrain lines (App merges; cap for clutter)
    const terrainLines = (locationTerrainLines ?? []).slice(0, 4);
    // T-103: room combat modifier identity (Ambush / Sanctuary / Forest / …)
    const conditionNames = (roomConditionNames ?? []).slice(0, 3);
    return {
      approachName: def?.name ?? String(approachResult.approach),
      success: approachResult.success,
      postureLabel: postureProfile.label,
      drawBias: postureProfile.drawBias,
      effects,
      terrainLines,
      conditionNames,
      description: approachResult.description,
    };
  })();

  return (
    <div className="combat">
      {openBanner && (
        <div
          className={`combat-open-banner ${openBanner.success ? 'combat-open-banner--success' : 'combat-open-banner--fail'}`}
          role="status"
          onClick={dismissOpenBanner}
        >
          <div className="combat-open-banner__row">
            <span className="combat-open-banner__approach">{openBanner.approachName}</span>
            <span className={`combat-open-banner__outcome ${openBanner.success ? 'combat-open-banner__outcome--ok' : 'combat-open-banner__outcome--bad'}`}>
              {openBanner.success ? 'Success' : 'Failed'}
            </span>
          </div>
          <div className="combat-open-banner__posture">
            Opens <strong>{openBanner.postureLabel}</strong>
            <span className="combat-open-banner__bias"> · {openBanner.drawBias}</span>
          </div>
          {openBanner.effects.length > 0 && (
            <div className="combat-open-banner__effects">
              {openBanner.effects.join(' · ')}
            </div>
          )}
          {openBanner.conditionNames.length > 0 && (
            <div className="combat-open-banner__condition">
              Room: {openBanner.conditionNames.join(' · ')}
            </div>
          )}
          {openBanner.terrainLines.length > 0 && (
            <div className="combat-open-banner__terrain">
              Terrain: {openBanner.terrainLines.join(' · ')}
            </div>
          )}
          <p className="combat-open-banner__hint">Tap to dismiss · auto-hides</p>
        </div>
      )}
      {/* ROW 1 (1fr): Stage — cinematic viewscreen with floating info panel */}
      <div className="combat__stage" ref={enemyRef}>
        <CinematicViewscreen
          enemyImage={
            enemy.image
            || getEnemyArt({
              name: enemy.name,
              archetype: enemy.archetype,
              isBoss: enemy.isBoss,
            }).src
          }
          enemyCutout={enemyCutout}
          backgroundImage={background}
          chakraAuraColor={chakraAuraColor}
          floatingPanel={floatingPanel}
          hitFlash={hitFlash}
        />
        {/* Mini combat log (recent lines + aria-live) — bottom-left of stage */}
        {logs.length > 0 && (
          <div className="combat__mini-log">
            <GameLog logs={logs} maxLines={4} compact />
          </div>
        )}
      </div>

      {/* ROW 2 (auto): Deck — 2 visual bands: command bar + hand (T-014 v4) */}
      <div className="combat__deck">
        {/* BAND 1: Command bar — compact HUD (left) + econ/turn controls (right) */}
        <div className="combat__command">
          <PlayerHUD
            ref={playerHudRef}
            player={player}
            playerStats={playerStats}
            compact
          />

          <div className="combat__econ-bar">
            {/* Action Points */}
            <div className="combat__ap" aria-label={`Action Points ${currentAp} of ${maxAp}`}>
              <span className="combat__ap-label">AP</span>
              <div className="combat__ap-pips">
                {Array.from({ length: Math.max(maxAp, currentAp) }).map((_, i) => (
                  <span
                    key={i}
                    className={`combat__ap-pip ${i < currentAp ? 'combat__ap-pip--full' : 'combat__ap-pip--spent'}`}
                  />
                ))}
              </div>
              <span className="combat__ap-value">{currentAp}/{maxAp}</span>
              {/* T-075: explain movement_penalty AP cut */}
              {typeof baseMaxAp === 'number' && baseMaxAp > maxAp && (
                <span className="combat__ap-terrain" title={`Natural budget ${baseMaxAp}`}>
                  Terrain −{baseMaxAp - maxAp}
                </span>
              )}
            </div>

            {/* Posture Control */}
            <PostureIndicator
              posture={posture}
              currentAp={currentAp}
              isPlayerTurn={turnState === 'PLAYER'}
              onChangePosture={onChangePosture}
            />

            {/* Passive Skills Summary */}
            {player.skills.filter(s => s.actionType === ActionType.PASSIVE).length > 0 && (
              <Tooltip
                content={
                  <div className="combat-tooltip">
                    <div className="combat-tooltip__passives-title">Active Passives</div>
                    {player.skills.filter(s => s.actionType === ActionType.PASSIVE).map(skill => (
                      <div key={skill.id} className="combat-tooltip__passive">
                        <span className="combat-tooltip__passive-name">{skill.name}</span> - {skill.description}
                      </div>
                    ))}
                  </div>
                }
              >
                <div className="combat__passives-summary">
                  {player.skills.filter(s => s.actionType === ActionType.PASSIVE).length} Passives
                </div>
              </Tooltip>
            )}

            {/* Keyboard whisper — cards already carry their Z/X/C/V badges */}
            <span className="combat__whisper" aria-hidden="true">
              SPACE end · TAB auto-end
            </span>

            {/* Auto-end turn toggle — countdown + pass (does NOT auto-play skills) */}
            <button
              type="button"
              onClick={onToggleAutoCombat}
              className={`combat__auto-btn ${autoCombatEnabled ? 'combat__auto-btn--active' : ''}`}
              title={autoCombatEnabled ? 'Auto-end enabled — ends your turn after a short delay' : 'Enable auto-end: automatically pass the turn (not full auto-combat)'}
              aria-label={autoCombatEnabled ? 'Disable auto-end' : 'Enable auto-end'}
            >
              {autoCombatEnabled ? <Zap size={14} /> : <ZapOff size={14} />}
              <span className="combat__auto-label">Auto-end</span>
              {autoCombatEnabled && autoPassTimeRemaining != null && turnState === 'PLAYER' && (
                <span className="combat__auto-timer">
                  {(autoPassTimeRemaining / 1000).toFixed(1)}s
                </span>
              )}
            </button>

            {/* Pass Turn Button */}
            <button
              type="button"
              onClick={onPassTurn}
              disabled={turnState === 'ENEMY_TURN'}
              className="combat__pass-btn"
            >
              <Hourglass size={14} />
              <span className="combat__pass-label">
                {turnState === 'ENEMY_TURN' ? 'Enemy Turn' : 'End Turn'}
              </span>
            </button>
          </div>
        </div>

        {/* BAND 2: Hand — full width, cards take the stage */}
        <Hand
          cards={handCards}
          player={player}
          playerStats={playerStats}
          enemy={enemy}
          enemyStats={enemyStats}
          posture={posture}
          isPlayerTurn={turnState === 'PLAYER'}
          canUseSkill={canUseSkill}
          onUseSkill={onUseSkill}
          getDamageTypeColor={getDamageTypeColor}
          isFirstTurn={isFirstTurn}
          firstHitMultiplier={firstHitMultiplier}
          locationTerrainMods={locationTerrainMods}
          roomTerrain={roomTerrain}
        />
      </div>

      {/* FLOATING TEXT OVERLAY — viewport-fixed, z-50, left as-is per T-013 plan */}
      {FeatureFlags.SHOW_FLOATING_TEXT && floatingTexts.map(ft => (
        <FloatingText
          key={ft.id}
          id={ft.id}
          value={ft.text}
          type={ft.type}
          position={ft.position}
          onComplete={removeFloatingText}
        />
      ))}
    </div>
  );
});

Combat.displayName = 'Combat';

export default Combat;
