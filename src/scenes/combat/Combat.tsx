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
  CombatRange,
  RangeMoveDirection,
  ActionType,
  CardRole,
  ModeRuntimeState,
  type ActiveModeRuntime,
  type Mark,
} from '../../game/types';
import {
  canPlaySkill,
  getSkillBlockReason as getMachineBlockReason,
  type SkillPlayContext,
} from '../../game/systems/skillPlayability';
import { formatSkillBlockReason } from '../../game/systems/combatSkillViewModel';
import StatBar from '../../components/shared/StatBar';
import Tooltip from '../../components/shared/Tooltip';
import { CinematicViewscreen } from '../../components/layout/CinematicViewscreen';
import FloatingText, { FloatingTextItem, FloatingTextType } from '../../components/combat/FloatingText';
import CombatSenStrip from '../../components/combat/CombatSenStrip';
import { Hand, HAND_SHORTCUTS } from '../../components/combat/Hand';
import { CombatModesPanel } from '../../components/combat/CombatModesPanel';
import { TacticalSetupPanel } from '../../components/combat/TacticalSetupPanel';
import { PostureIndicator } from '../../components/combat/PostureIndicator';
import { RangeControlPanel } from '../../components/combat/RangeControlPanel';
import { FeatureFlags, LaunchProperties } from '../../config/featureFlags';
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
import { getEnemyArt, deriveEnemyCutoutPath } from '../../game/constants/artRegistry';
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

/** @see deriveEnemyCutoutPath — shared cutout rewrite for combat stage sprites. */
const deriveEnemyCutout = deriveEnemyCutoutPath;

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
  /** F2 engagement band */
  currentRange?: CombatRange | null;
  /** F2 voluntary move */
  onMoveInRange?: (direction: RangeMoveDirection) => void;
  playerMoveUsedThisTurn?: boolean;
  droppedSkill?: Skill | null;
  getDamageTypeColor: (dt: DamageType) => string;
  getRarityColor: (rarity: Rarity) => string;
  autoCombatEnabled?: boolean;
  onToggleAutoCombat?: () => void;
  autoPassTimeRemaining?: number | null;
  /**
   * Full path to the biome background image for the stage (Lámina 1).
   * (e.g. /assets/locations/location_mist_covered_bridge.png).
   * Computed in App.tsx via resolveLaminaPaths(biome).
   */
  background?: string;
  /**
   * Optional Lámina 2 middleground — `/assets/lamina/lamina_mid_<biomeSlug>.png`.
   * Passed from App; CinematicViewscreen hides the layer if the asset is missing.
   */
  midgroundImage?: string;
  /**
   * Optional Lámina 3 foreground — `/assets/lamina/lamina_fg_<biomeSlug>.png`.
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
  /** Room AMBUSH enemy first-strike mult (SEN strip badge) */
  enemyFirstHitMultiplier?: number;
  /** Resolved opening initiative from determineTurnOrder */
  openingInitHolder?: 'player' | 'enemy' | null;
  /** FREE_FIRST_SKILL: first accepted skill costs 0 chakra (from combatState) */
  skipFirstSkillCost?: boolean;
  /** Damage-preview: T-063 location terrain mods */
  locationTerrainMods?: import('../../game/systems/LocationTerrainSystem').LocationTerrainMods | null;
  /** Damage-preview: room terrain element amplification */
  roomTerrain?: import('../../game/types').TerrainDefinition | null;
  /** T-103: active room combat condition labels (Ambush, Sanctuary, …) */
  roomConditionNames?: string[] | null;
  /** Live Modes board (`combatState.activeModes`). */
  activeModes?: ActiveModeRuntime[];
  /** Live Marks board (`combatState.marks`). */
  marks?: Mark[];
  /** Skill Config upkeep order. Falls back to `player.skillConfig`. */
  modeUpkeepPriority?: readonly string[];
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
  currentRange = null,
  onMoveInRange,
  playerMoveUsedThisTurn = false,
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
  enemyFirstHitMultiplier = 1,
  openingInitHolder = null,
  skipFirstSkillCost = false,
  locationTerrainMods = null,
  roomTerrain = null,
  roomConditionNames = null,
  activeModes = [],
  marks = [],
  modeUpkeepPriority,
}, ref) => {
  // Floating text state
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
  const [hitFlash, setHitFlash] = useState(false);
  /** Stage edge flash on crit / miss for readable hit outcome */
  const [hitSignal, setHitSignal] = useState<'crit' | 'miss' | null>(null);
  // T-054: show opening approach/posture banner until first action or timeout
  const [showOpenBanner, setShowOpenBanner] = useState(Boolean(approachResult));
  const enemyRef = useRef<HTMLDivElement>(null);
  /** Anchor for player-side floating text (HP/CP live on ExplorationHUD). */
  const playerFloatRef = useRef<HTMLDivElement>(null);
  const hitFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hitSignalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Stage edge signal for crit / miss (readable without reading the float)
    if (type === 'crit' || type === 'miss') {
      setHitSignal(type === 'crit' ? 'crit' : 'miss');
      if (hitSignalTimer.current) clearTimeout(hitSignalTimer.current);
      hitSignalTimer.current = setTimeout(() => setHitSignal(null), 160);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (hitFlashTimer.current) clearTimeout(hitFlashTimer.current);
      if (hitSignalTimer.current) clearTimeout(hitSignalTimer.current);
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

  const resolvedUpkeepPriority =
    modeUpkeepPriority ?? player.skillConfig?.modeUpkeepPriority ?? [];

  /** Assemble pure playability context from live combat fields. */
  const buildSkillPlayContext = useCallback(
    (skill: Skill): SkillPlayContext => {
      const isModeSkill =
        skill.cardRole === CardRole.MODE ||
        skill.actionType === ActionType.TOGGLE ||
        Boolean(skill.isToggle);
      const modeAlreadyOn =
        Boolean(skill.isActive) ||
        (isModeSkill &&
          activeModes.some(
            (mode) =>
              (mode.id === skill.id || mode.id === skill.modeInteraction?.modeId) &&
              (mode.state === ModeRuntimeState.ON || mode.state === undefined),
          ));
      return {
        skill,
        currentChakra: player.currentChakra,
        currentHp: player.currentHp,
        maxHp: playerStats.derived.maxHp,
        currentAp,
        currentRange: currentRange ?? undefined,
        activeBuffs: player.activeBuffs,
        skipFirstSkillCost,
        modeAlreadyOn,
        modeActivation: isModeSkill && !modeAlreadyOn,
      };
    },
    [player, playerStats.derived.maxHp, currentAp, currentRange, skipFirstSkillCost, activeModes],
  );

  /** Card playability — single path through skillPlayability (incl. Mode ON range skip). */
  const canUseSkill = useCallback(
    (skill: Skill): boolean => canPlaySkill(buildSkillPlayContext(skill)),
    [buildSkillPlayContext],
  );

  /** R1 Confuso: explain greyed hand cards (AP / chakra / silence / stun / range). */
  const getSkillBlockReason = useCallback(
    (skill: Skill): string | null => {
      const ctx = buildSkillPlayContext(skill);
      const reason = getMachineBlockReason(ctx);
      return formatSkillBlockReason(reason, ctx);
    },
    [buildSkillPlayContext],
  );

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

      // Shortcuts A, S, D, F, G for range and stance
      const apCost = 1;
      const moveAvailable = !playerMoveUsedThisTurn && currentAp >= apCost;

      // A: Back Off (Retreat)
      if (e.code === 'KeyA' || e.key === 'a' || e.key === 'A') {
        if (onMoveInRange && currentRange && moveAvailable && currentRange !== CombatRange.LONG) {
          e.preventDefault();
          onMoveInRange(RangeMoveDirection.RETREAT);
          return;
        }
      }

      // S: Close In (Approach)
      if (e.code === 'KeyS' || e.key === 's' || e.key === 'S') {
        if (onMoveInRange && currentRange && moveAvailable && currentRange !== CombatRange.CLOSE) {
          e.preventDefault();
          onMoveInRange(RangeMoveDirection.APPROACH);
          return;
        }
      }

      // D: Aggressive Stance
      if (e.code === 'KeyD' || e.key === 'd' || e.key === 'D') {
        if (onChangePosture && posture !== Posture.AGGRESSIVE && currentAp >= LaunchProperties.POSTURE_SWITCH_AP_COST) {
          e.preventDefault();
          onChangePosture(Posture.AGGRESSIVE);
          return;
        }
      }

      // F: Balanced Stance
      if (e.code === 'KeyF' || e.key === 'f' || e.key === 'F') {
        if (onChangePosture && posture !== Posture.BALANCED && currentAp >= LaunchProperties.POSTURE_SWITCH_AP_COST) {
          e.preventDefault();
          onChangePosture(Posture.BALANCED);
          return;
        }
      }

      // G: Defensive Stance
      if (e.code === 'KeyG' || e.key === 'g' || e.key === 'G') {
        if (onChangePosture && posture !== Posture.DEFENSIVE && currentAp >= LaunchProperties.POSTURE_SWITCH_AP_COST) {
          e.preventDefault();
          onChangePosture(Posture.DEFENSIVE);
          return;
        }
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
  }, [
    turnState, handCards, canUseSkill, onUseSkill, onPassTurn, onToggleAutoCombat,
    onMoveInRange, onChangePosture, currentRange, playerMoveUsedThisTurn, currentAp, posture,
  ]);

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
      {/* Name */}
      <div className="combat__ip-name-row">
        <h2 className="combat__ip-name">{enemy.name}</h2>
      </div>

      {/* HP */}
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

      {/* Next Attack */}
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
    // Always show resolved SEN (not only approach bonus flags)
    const senHolder =
      openingInitHolder ?? (turnState === 'PLAYER' ? 'player' : 'enemy');
    effects.push(senHolder === 'player' ? 'SEN · You open' : 'SEN · Enemy opens');
    if (approachResult.success) {
      if (approachResult.firstHitMultiplier > 1) {
        effects.push(`First hit ×${approachResult.firstHitMultiplier}`);
      }
      if (approachResult.enemyHpReduction > 0) {
        effects.push(`Enemy −${Math.round(approachResult.enemyHpReduction * 100)}% HP`);
      }
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

  const combatSignalClass =
    hitSignal === 'crit'
      ? 'combat--hit-crit'
      : hitSignal === 'miss'
        ? 'combat--hit-miss'
        : '';

  return (
    <div
      className={['combat', combatSignalClass].filter(Boolean).join(' ')}
      style={background ? {
        /* Bright full-bleed biome — no dark gradient crushing the plate */
        backgroundImage: `url("${background}")`,
      } : undefined}
    >
      {/* SEN tempo — always visible: init at open, then whose turn */}
      <div className="combat__sen-slot">
        <CombatSenStrip
          turnState={turnState}
          openingInitHolder={openingInitHolder}
          isFirstTurn={isFirstTurn}
          firstHitMultiplier={firstHitMultiplier}
          enemyFirstHitMultiplier={enemyFirstHitMultiplier}
        />
      </div>

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
          <div className="combat__board">
            <CombatModesPanel
              modes={activeModes}
              upkeepPriority={resolvedUpkeepPriority}
            />
            <TacticalSetupPanel marks={marks} />
          </div>
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

            {/* F2: range band + move controls */}
            {currentRange && (
              <RangeControlPanel
                currentRange={currentRange}
                turnState={turnState}
                playerMoveUsedThisTurn={playerMoveUsedThisTurn}
                currentAp={currentAp}
                onMoveInRange={onMoveInRange}
              />
            )}

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
          mainAttackId={player.skillConfig?.mainAttackId ?? null}
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
