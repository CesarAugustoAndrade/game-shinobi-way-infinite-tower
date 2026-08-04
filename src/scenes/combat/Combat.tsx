import React, { useState, useCallback, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import {
  Player,
  Enemy,
  Skill,
  EffectType,
  DamageType,
  CharacterStats,
  Rarity,
  Posture,
  LogEntry,
} from '../../game/types';
import StatBar from '../../components/shared/StatBar';
import Tooltip from '../../components/shared/Tooltip';
import { CinematicViewscreen } from '../../components/layout/CinematicViewscreen';
import FloatingText, { FloatingTextItem, FloatingTextType } from '../../components/combat/FloatingText';
import { Hand, HAND_SHORTCUTS } from '../../components/combat/Hand';
import { PostureIndicator } from '../../components/combat/PostureIndicator';
import { FeatureFlags } from '../../config/featureFlags';
import { getApCost } from '../../game/constants/combatCards';
import { APPROACH_DEFINITIONS } from '../../game/constants/approaches';
import { ApproachResult } from '../../game/systems/ApproachSystem';
import { describePosture } from '../../game/systems/PostureSystem';
import { Hourglass } from 'lucide-react';
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
  ELEMENT_AFFINITY_ART,
  ELEMENT_COLORS,
} from '../../game/constants/enemyArchetypes';
import './Combat.css';

/** Fallback chakra aura when element color is missing/malformed (rust heat). */
const CHAKRA_AURA_FALLBACK = 'rgba(166, 93, 63, 0.65)';

/**
 * Convert a CSS hex color (#rgb / #rrggbb) to rgba(r, g, b, alpha).
 * Used to build the chakra aura drop-shadow color for enemy cutout sprites.
 */
const hexColorToRgba = (hex: string, alpha: number): string => {
  if (!hex || typeof hex !== 'string') return CHAKRA_AURA_FALLBACK.replace('0.65', String(alpha));
  const raw = hex.trim().startsWith('#') ? hex.trim().slice(1) : hex.trim();
  const full =
    raw.length === 3
      ? raw.split('').map((c) => c + c).join('')
      : raw;
  if (full.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(full)) {
    return `rgba(166, 93, 63, ${alpha})`;
  }
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Derive transparent cutout path from a portrait URL.
 *   /assets/enemy_foo.png  → /assets/enemy_cut_foo.png
 *   /assets/enemy_foo.jpg  → /assets/enemy_cut_foo.png  (cutouts are always PNG)
 *   /assets/enemy_cut_x.*  → same path, extension normalized to .png
 *   /assets/icons/…        → undefined (no cutout rewrite)
 * Query strings are stripped. onError in CinematicViewscreen falls back to portrait.
 */
const deriveEnemyCutout = (portraitSrc?: string): string | undefined => {
  if (!portraitSrc) return undefined;
  const path = portraitSrc.split('?')[0];
  // Already a cutout asset — keep it (normalize to .png)
  if (/^\/assets\/enemy_cut_.+\.(png|jpe?g|webp)$/i.test(path)) {
    return path.replace(/\.(jpe?g|webp)$/i, '.png');
  }
  // Portrait plate: enemy_<id>.(png|jpg|jpeg|webp) → enemy_cut_<id>.png
  const m = path.match(/^\/assets\/enemy_(?!cut_)(.+)\.(png|jpe?g|webp)$/i);
  if (!m) return undefined;
  return `/assets/enemy_cut_${m[1]}.png`;
};

export interface FloatingTextOptions {
  /** Damage channel for float color (Physical / Elemental / Mental / True). */
  damageType?: string;
  /** Element glow for themed hits. */
  element?: string;
}

export interface CombatRef {
  spawnFloatingText: (
    target: 'enemy' | 'player',
    text: string,
    type: FloatingTextType,
    options?: FloatingTextOptions,
  ) => void;
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
   * (e.g. /assets/location_mist_covered_bridge.png).
   * Computed in App.tsx via resolveLaminaPaths(biome).
   */
  background?: string;
  /**
   * Optional Lámina 2 middleground — `/assets/lamina_mid_<biomeSlug>.png`.
   * Passed from App; CinematicViewscreen hides the layer if the asset is missing.
   */
  midgroundImage?: string;
  /**
   * Optional Lámina 3 foreground — `/assets/lamina_fg_<biomeSlug>.png`.
   * Passed from App; CinematicViewscreen hides the layer if the asset is missing.
   */
  foregroundImage?: string;
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
  midgroundImage,
  foregroundImage,
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
  /** Anchor for player-side floating text (HP/CP live on ExplorationHUD). */
  const playerFloatRef = useRef<HTMLDivElement>(null);
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
    type: FloatingTextType,
    options?: FloatingTextOptions,
  ) => {
    const targetRef = target === 'enemy' ? enemyRef : playerFloatRef;
    const rect = targetRef.current?.getBoundingClientRect();
    if (!rect) return;

    const id = `fct-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 60;
    const y = rect.top + rect.height * (target === 'enemy' ? 0.4 : 0.3);

    setFloatingTexts((prev) => [
      ...prev,
      {
        id,
        text,
        type,
        position: { x, y },
        damageType: options?.damageType,
        element: options?.element,
      },
    ]);

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

  // Helper to check if player is stunned / silenced (TASK-R12 + WAVE12 feedback)
  const isStunned = player.activeBuffs.some(b => b?.effect?.type === EffectType.STUN);
  const isSilencedStatus = player.activeBuffs.some(b => b?.effect?.type === EffectType.SILENCE);

  // Helper to check if a card can be played this turn (resources + AP + state).
  // FREE_FIRST_SKILL: effective chakra cost is 0 while skipFirstSkillCost is set.
  const canUseSkill = useCallback((skill: Skill): boolean => {
    const effectiveChakraCost = skipFirstSkillCost ? 0 : skill.chakraCost;
    const hasResources =
      player.currentChakra >= effectiveChakraCost && player.currentHp > skill.hpCost;
    const noCooldown = skill.currentCooldown === 0;
    const isPlayerStunned = player.activeBuffs.some(b => b?.effect?.type === EffectType.STUN);
    const isSilenced = player.activeBuffs.some(b => b?.effect?.type === EffectType.SILENCE);
    // Silence blocks chakra-cost skills; allow free taijutsu and toggle deactivation
    const silencedBlocked = isSilenced && skill.chakraCost > 0 && !skill.isActive;
    const hasAp = currentAp >= getApCost(skill);

    return Boolean((hasResources || skill.isActive) && noCooldown && !isPlayerStunned && !silencedBlocked && hasAp);
  }, [player, currentAp, skipFirstSkillCost]);

  /** R1 Confuso: explain greyed hand cards (AP / chakra / silence / stun). */
  const getSkillBlockReason = useCallback((skill: Skill): string | null => {
    if (canUseSkill(skill)) return null;
    if (player.activeBuffs.some(b => b?.effect?.type === EffectType.STUN)) {
      return 'Stunned — end turn';
    }
    if (
      player.activeBuffs.some(b => b?.effect?.type === EffectType.SILENCE) &&
      skill.chakraCost > 0 &&
      !skill.isActive
    ) {
      return 'Silenced — chakra jutsu blocked';
    }
    if (skill.currentCooldown > 0) {
      return `On cooldown (${skill.currentCooldown})`;
    }
    const ap = getApCost(skill);
    if (currentAp < ap) {
      return `Need ${ap} AP (have ${currentAp})`;
    }
    const chakraCost = skipFirstSkillCost ? 0 : skill.chakraCost;
    if (player.currentChakra < chakraCost) {
      return `Need ${chakraCost} chakra`;
    }
    if (skill.hpCost > 0 && player.currentHp <= skill.hpCost) {
      return `Need more HP (costs ${skill.hpCost})`;
    }
    return 'Cannot play this card';
  }, [canUseSkill, player, currentAp, skipFirstSkillCost]);

  /** Hand empty on player turn — surface End Turn so the player is never stuck. */
  const handEmptyNeedsPass = turnState === 'PLAYER' && handCards.length === 0;
  /** Every drawn card is unplayable (silence/AP/chakra) while the player can still pass. */
  const allCardsBlocked =
    turnState === 'PLAYER' &&
    handCards.length > 0 &&
    handCards.every((s) => !canUseSkill(s));
  const needsPassHighlight = handEmptyNeedsPass || allCardsBlocked || isStunned;

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
  const elementArtSrc = ELEMENT_AFFINITY_ART[enemy.element];

  // ── Portrait + cutout + chakra aura (T-013) ──────────────────────────────
  // Resolve display portrait once (explicit enemy.image, else art registry).
  // Cutout rewrite is generic: enemy_<id>.(png|jpg) → enemy_cut_<id>.png.
  // Prefer cutouts when a plate path is available — if enemy.image is an
  // icons/*.jpg residual, still attempt cutout from the painted registry plate.
  // onError in CinematicViewscreen falls back to the portrait with mask.
  const resolvedArt = getEnemyArt({
    name: enemy.name,
    archetype: enemy.archetype,
    isBoss: enemy.isBoss,
  });
  const enemyPortrait = enemy.image || resolvedArt.src;
  const enemyCutout =
    deriveEnemyCutout(enemyPortrait) ?? deriveEnemyCutout(resolvedArt.src);

  // Chakra aura: elemental glow at 65% opacity for cutout drop-shadow.
  const chakraAuraColor = hexColorToRgba(elementColor, 0.65);

  const archetypeDesc = enemy.archetype
    ? (ARCHETYPE_DESCRIPTIONS[enemy.archetype] ?? '')
    : '';

  const floatingPanel = (
    <div className="combat__ip">
      {/* Row 1: reticle + name + level badge */}
      <div className="combat__ip-name-row">
        <span className="combat__ip-target-icon" aria-hidden="true" title="Target">
          <img
            className="combat__ip-target-reticle-img"
            src="/assets/icons/ui/target_reticle.jpg"
            alt=""
            width={16}
            height={16}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.hidden = false;
            }}
          />
          <span className="combat__ip-target-reticle" hidden />
        </span>
        <h2 className="combat__ip-name">{enemy.name}</h2>
        {enemy.dangerLevel != null && (
          <span className="combat__ip-level-badge" title="Location danger scale (1–7)">
            Danger {enemy.dangerLevel}
          </span>
        )}
      </div>

      {/* Row 2: tier + affinity tags */}
      <div className="combat__ip-tags-row">
        <span className="combat__ip-tier-tag">{enemy.tier}</span>
        <span className="combat__ip-affinity-tag" style={{ color: elementColor }}>
          AFFINITY: {enemy.element}{' '}
          {elementArtSrc ? (
            <img
              className="combat__ip-affinity-icon"
              src={elementArtSrc}
              alt=""
              width={14}
              height={14}
              aria-hidden="true"
              title={enemy.element}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            elementIcon
          )}
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
            <img
              className="combat__ip-stat-icon"
              src="/assets/icons/ui/phys_def.jpg"
              alt=""
              width={16}
              height={16}
              aria-hidden="true"
              title="Physical"
            />
            <div className="combat__ip-stat-body">
              <span className="combat__ip-stat-label">PHYS</span>
              <span className="combat__ip-stat-value">{enemyStats.derived.physicalDefenseFlat}<span className="combat__ip-stat-pct">+{Math.round(enemyStats.derived.physicalDefensePercent * 100)}%</span></span>
            </div>
          </div>
          <div className="combat__ip-stat combat__ip-stat--elem">
            <img
              className="combat__ip-stat-icon"
              src="/assets/icons/ui/elem_def.jpg"
              alt=""
              width={16}
              height={16}
              aria-hidden="true"
              title="Elemental"
            />
            <div className="combat__ip-stat-body">
              <span className="combat__ip-stat-label">ELEM</span>
              <span className="combat__ip-stat-value">{enemyStats.derived.elementalDefenseFlat}<span className="combat__ip-stat-pct">+{Math.round(enemyStats.derived.elementalDefensePercent * 100)}%</span></span>
            </div>
          </div>
          <div className="combat__ip-stat combat__ip-stat--mnd">
            <img
              className="combat__ip-stat-icon"
              src="/assets/icons/ui/mind_def.jpg"
              alt=""
              width={16}
              height={16}
              aria-hidden="true"
              title="Mental"
            />
            <div className="combat__ip-stat-body">
              <span className="combat__ip-stat-label">MND</span>
              <span className="combat__ip-stat-value">{enemyStats.derived.mentalDefenseFlat}<span className="combat__ip-stat-pct">+{Math.round(enemyStats.derived.mentalDefensePercent * 100)}%</span></span>
            </div>
          </div>
        </div>
      </Tooltip>

      {/* Row 4: SEALS (status) + INFO — shinobi readable, not debug slots */}
      <div className="combat__ip-mid-row">
        {/* Status seals: 4 slots */}
        <div className="combat__ip-status">
          <span className="combat__ip-section-label">Seals</span>
          <div className="combat__ip-status-slots">
            {Array.from({ length: 4 }).map((_, i) => {
              const buff = activeEffects[i];
              if (!buff) {
                return (
                  <div key={i} className="combat__ip-slot combat__ip-slot--empty" aria-label="Empty seal slot">
                    <img
                      className="combat__ip-slot-empty-img"
                      src="/assets/icons/ui/status_slot_empty.jpg"
                      alt=""
                      width={28}
                      height={28}
                      aria-hidden="true"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.hidden = false;
                      }}
                    />
                    <span className="combat__ip-slot-mark" hidden aria-hidden="true" />
                  </div>
                );
              }
              const isPositive = buff.effect ? isPositiveEffect(buff.effect.type) : false;
              const severity = getEffectSeverity(buff);
              const mechanics = getDetailedEffectMechanics(buff);
              const tip = buff.effect ? getEffectTip(buff.effect.type) : '';
              const durationLabel =
                buff.duration === -1
                  ? 'lingers'
                  : `${buff.duration} turn${buff.duration !== 1 ? 's' : ''}`;
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
                            {isPositive ? 'Foe blessing' : 'Ailment on foe'}
                          </div>
                        </div>
                      </div>
                      <div className="combat-tooltip__section">
                        <div className="combat-tooltip__buff-desc">{getBuffDescription(buff)}</div>
                      </div>
                      <div className="combat-tooltip__section">
                        <div className="combat-tooltip__section-title">What it does</div>
                        <div className="combat-tooltip__mechanics-list">
                          {mechanics.map((mechanic, mi) => (
                            <div key={mi} className="combat-tooltip__mechanic">
                              <span className="combat-tooltip__mechanic-bullet">–</span>
                              <span>{mechanic}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="combat-tooltip__section combat-tooltip__source-row">
                        <div>
                          <span className="combat-tooltip__source-label">From </span>
                          <span className="combat-tooltip__source-value">{buff.source || 'the field'}</span>
                        </div>
                        <div>
                          <span className="combat-tooltip__duration-label">Left </span>
                          <span className={buff.duration <= 1 && buff.duration !== -1 ? 'combat-tooltip__duration-value--expiring' : 'combat-tooltip__duration-value'}>
                            {durationLabel}
                          </span>
                        </div>
                      </div>
                      {tip && (
                        <div className="combat-tooltip__section">
                          <div className="combat-tooltip__tip">{tip}</div>
                        </div>
                      )}
                    </div>
                  }
                >
                  <div
                    className={`combat__ip-slot ${isPositive ? 'combat__ip-slot--positive' : 'combat__ip-slot--negative'}${buff.duration <= 1 && buff.duration !== -1 ? ' combat__ip-slot--expiring' : ''}`}
                    aria-label={`${buff.name} (${durationLabel})`}
                  >
                    <span className="combat__ip-slot-icon">
                      {buff.effect ? getEffectIcon(buff.effect.type) : '?'}
                    </span>
                    <span className="combat__ip-slot-duration">
                      {buff.duration === -1 ? '∞' : `${buff.duration}t`}
                    </span>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Enemy info / archetype description */}
        <div className="combat__ip-info">
          <span className="combat__ip-section-label">Read</span>
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
            <span className="combat__ip-hp-sep">/</span>
            <span className="combat__ip-hp-max">{enemyStats.derived.maxHp}</span>
          </span>
        </div>
        <div className="combat__ip-hp-bar">
          <StatBar
            current={enemy.currentHp}
            max={enemyStats.derived.maxHp}
            color="red"
            showValue={false}
          />
        </div>
      </div>

      {/* Row 6: A-003 telegraph — next enemy skill (legible risk before you play) */}
      {enemy.intendedSkillName && (
        <div
          className="combat__ip-telegraph"
          role="status"
          aria-live="polite"
          title={enemy.intentReason ? `AI: ${enemy.intentReason}` : 'Enemy next action'}
        >
          <span className="combat__ip-telegraph-label">Next</span>
          <span className="combat__ip-telegraph-skill">{enemy.intendedSkillName}</span>
        </div>
      )}
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
    <div
      className="combat"
      style={background ? {
        /* Bright full-bleed biome — no dark gradient crushing the plate */
        backgroundImage: `url("${background}")`,
      } : undefined}
    >
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

      {/* TASK-R12: Stunned player turn banner & explicit action button */}
      {isStunned && turnState === 'PLAYER' && (
        <div className="combat-stunned-banner" role="alert">
          <div className="combat-stunned-banner__content">
            <span className="combat-stunned-banner__title">⚡ STUNNED!</span>
            <span className="combat-stunned-banner__desc">You are incapacitated this turn and cannot play cards.</span>
          </div>
          <button
            type="button"
            onClick={onPassTurn}
            className="combat-stunned-banner__action-btn"
          >
            <Hourglass size={16} />
            <span>STUNNED - PASS TURN</span>
          </button>
        </div>
      )}

      {/* WAVE12: Silence feedback — free taijutsu still playable; chakra jutsu blocked */}
      {!isStunned && isSilencedStatus && turnState === 'PLAYER' && (
        <div className="combat-silence-banner" role="status">
          <div className="combat-silence-banner__content">
            <span className="combat-silence-banner__title">🔇 SILENCED</span>
            <span className="combat-silence-banner__desc">
              Chakra jutsu blocked. Free taijutsu still playable — or end turn (Space).
            </span>
          </div>
        </div>
      )}

      {/* WAVE12: Empty hand / no playable cards — explicit pass CTA (anti soft-lock) */}
      {!isStunned && turnState === 'PLAYER' && (handEmptyNeedsPass || allCardsBlocked) && (
        <div className="combat-pass-nudge" role="status">
          <span className="combat-pass-nudge__text">
            {handEmptyNeedsPass
              ? 'No cards left — end your turn (Space).'
              : 'No playable cards — end your turn (Space).'}
          </span>
          <button
            type="button"
            onClick={onPassTurn}
            className="combat-pass-nudge__btn"
          >
            <Hourglass size={14} />
            <span>End Turn</span>
          </button>
        </div>
      )}

      {/* ROW 1 (1fr): Stage — bright biome + enemy + floating info panel only */}
      <div className="combat__stage" ref={enemyRef}>
        <CinematicViewscreen
          enemyImage={enemyPortrait}
          enemyCutout={enemyCutout}
          midgroundImage={midgroundImage}
          foregroundImage={foregroundImage}
          chakraAuraColor={chakraAuraColor}
          floatingPanel={floatingPanel}
          hitFlash={hitFlash}
          intentLabel={enemy.intendedSkillName}
        />
      </div>

      {/* ROW 2: AP + stance + End Turn over hand — no dark plates / no player HUD */}
      <div className="combat__deck" ref={playerFloatRef}>
        <div className="combat__command">
          <div className="combat__econ-bar">
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
              {typeof baseMaxAp === 'number' && baseMaxAp > maxAp && (
                <span className="combat__ap-terrain" title={`Natural budget ${baseMaxAp}`}>
                  Terrain −{baseMaxAp - maxAp}
                </span>
              )}
            </div>

            <PostureIndicator
              posture={posture}
              currentAp={currentAp}
              isPlayerTurn={turnState === 'PLAYER'}
              onChangePosture={onChangePosture}
            />

            <button
              type="button"
              onClick={onPassTurn}
              disabled={turnState === 'ENEMY_TURN'}
              className={[
                'combat__pass-btn',
                isStunned && turnState === 'PLAYER' ? 'combat__pass-btn--stunned' : '',
                needsPassHighlight && !isStunned ? 'combat__pass-btn--nudge' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <Hourglass size={14} />
              <span className="combat__pass-label">
                {turnState === 'ENEMY_TURN'
                  ? 'Enemy Turn'
                  : isStunned
                    ? 'STUNNED - PASS TURN'
                    : handEmptyNeedsPass || allCardsBlocked
                      ? 'End Turn (no plays)'
                      : 'End Turn'}
              </span>
            </button>
          </div>
        </div>

        <Hand
          cards={handCards}
          player={player}
          playerStats={playerStats}
          enemy={enemy}
          enemyStats={enemyStats}
          posture={posture}
          isPlayerTurn={turnState === 'PLAYER'}
          canUseSkill={canUseSkill}
          getSkillBlockReason={getSkillBlockReason}
          onUseSkill={onUseSkill}
          getDamageTypeColor={getDamageTypeColor}
          isFirstTurn={isFirstTurn}
          firstHitMultiplier={firstHitMultiplier}
          locationTerrainMods={locationTerrainMods}
          roomTerrain={roomTerrain}
          skipFirstSkillCost={skipFirstSkillCost}
        />
      </div>

      {/* FLOATING TEXT OVERLAY — viewport-fixed; color by damage type / status (A7b) */}
      {FeatureFlags.SHOW_FLOATING_TEXT && floatingTexts.map(ft => (
        <FloatingText
          key={ft.id}
          id={ft.id}
          value={ft.text}
          type={ft.type}
          position={ft.position}
          onComplete={removeFloatingText}
          damageType={ft.damageType}
          element={ft.element}
        />
      ))}
    </div>
  );
});

Combat.displayName = 'Combat';

export default Combat;
