/**
 * skillPlayability — pure skill playability gates shared by UI and sims.
 *
 * Mirrors the resource / status / range checks in PlayerTurnSystem.useSkill
 * and Combat.tsx canUseSkill, without React or combat state objects.
 * Zero DOM. Callers assemble SkillPlayContext from player + combat fields.
 */

import {
  ActiveModeRuntime,
  Buff,
  CombatActor,
  CombatRange,
  EffectType,
  Mark,
  ModeRuntimeState,
  Skill,
} from '../types';
import { getApCost } from '../constants/combatCards';
import { canActivateModeAt, skillAllowedAt } from './RangeSystem';
import { canAffordHpCost } from './StatSystem';
import { isSkillReadyOnTurn } from './TurnClockSystem';

// ============================================================================
// TYPES
// ============================================================================

export interface SkillPlayContext {
  skill: Skill;
  currentChakra: number;
  currentHp: number;
  maxHp: number;
  /** When undefined, AP check is skipped (e.g. pre-deck contexts). */
  currentAp?: number;
  /** When undefined, range check is skipped. */
  currentRange?: CombatRange;
  activeBuffs: Buff[];
  /** FREE_FIRST_SKILL: treat chakra cost as 0 for affordability (not AP/HP/CD). */
  skipFirstSkillCost?: boolean;
  /** Range check uses Mode activation rules (any band if allowedRanges omitted). */
  modeActivation?: boolean;
  /** Mode already ON: band changes do not force Mode off / block for range. */
  modeAlreadyOn?: boolean;
  /** Extra bands granted while a Mode payoff is live (Chidori + Sharingan 3). */
  grantedRanges?: readonly CombatRange[];
  /**
   * Combat turn index. When set, cooldown uses `readyOnTurn` (T-145).
   * When omitted, legacy `currentCooldown > 0` still blocks.
   */
  turnIndex?: number;
  /** Live Modes board. When undefined, requireOn gate is skipped. */
  activeModes?: readonly ActiveModeRuntime[];
  /** Live Marks board. When undefined, requireMarkHard gate is skipped. */
  marks?: readonly Mark[];
}

/**
 * Machine-readable block reason for greying cards / AI filters.
 * `null` means the skill is playable under the given context.
 */
export type SkillBlockReason =
  | 'cooldown'
  | 'stun'
  | 'silence'
  | 'chakra'
  | 'hp'
  | 'ap'
  | 'range'
  | 'mode-required'
  | 'mark-required'
  | null;

// ============================================================================
// HELPERS (mirror ResolveSkillSystem validateIntent)
// ============================================================================

function isModeOn(mode: ActiveModeRuntime): boolean {
  return mode.state === ModeRuntimeState.ON || mode.state === undefined;
}

/** Fixed modeId, else the ON instance matching requireFamily / family. */
function bindLiveModeId(
  modes: readonly ActiveModeRuntime[],
  mi: NonNullable<Skill['modeInteraction']>,
): string | undefined {
  if (mi.modeId) return mi.modeId;
  const family = mi.requireFamily ?? mi.family;
  if (!family) return undefined;
  return modes.find((mode) => mode.family === family && isModeOn(mode))?.id;
}

function modeChargesOnBoard(modes: readonly ActiveModeRuntime[], modeId: string): number {
  const current = modes.find((mode) => mode.id === modeId && isModeOn(mode));
  return current?.charges ?? 0;
}

function hasEnemyMark(marks: readonly Mark[], markId: string): boolean {
  return marks.some((mark) => mark.id === markId && mark.target === CombatActor.ENEMY);
}

// ============================================================================
// PLAYABILITY
// ============================================================================

/**
 * First failing gate for playing `ctx.skill`, or null if playable.
 *
 * Check order (stable for UI tooltips / sims):
 * stun → silence → cooldown → range (skip if Mode already ON) → ap → chakra → hp
 * → mode-required → mark-required
 * Mode activation uses canActivateModeAt. FREE_FIRST waives chakra only.
 *
 * Gates mirror useSkill / validateIntent:
 * - cooldown: readyOnTurn vs turnIndex when provided, else currentCooldown > 0
 * - STUN buff present
 * - SILENCE && skill.chakraCost > 0 (base cost; free-first does not bypass silence)
 * - effective chakra (0 when skipFirstSkillCost)
 * - canAffordHpCost(skill, currentHp, maxHp)
 * - AP when currentAp is defined
 * - skillAllowedAt when currentRange is defined
 * - requireOn: Mode ON + charges (consumeAllCharges → ≥1, else consumeCharges ?? 1)
 * - requireMarkHard + requireMarkId: enemy mark present
 */
export function getSkillBlockReason(ctx: SkillPlayContext): SkillBlockReason {
  const { skill, activeBuffs } = ctx;

  if (activeBuffs.some((b) => b?.effect?.type === EffectType.STUN)) {
    return 'stun';
  }

  // Silence keys off base chakraCost — FREE_FIRST does not waive the silence gate.
  // Kai (supportCleanse.silence) must remain playable so Release can strip Silence.
  if (
    activeBuffs.some((b) => b?.effect?.type === EffectType.SILENCE) &&
    skill.chakraCost > 0 &&
    !skill.supportCleanse?.silence
  ) {
    return 'silence';
  }

  if (ctx.turnIndex !== undefined) {
    if (!isSkillReadyOnTurn(skill.readyOnTurn, ctx.turnIndex)) {
      return 'cooldown';
    }
  } else if (skill.currentCooldown > 0) {
    return 'cooldown';
  }

  if (ctx.currentRange !== undefined && !ctx.modeAlreadyOn) {
    const inRange = ctx.modeActivation
      ? canActivateModeAt(skill.allowedRanges, ctx.currentRange)
      : skillAllowedAt(skill, ctx.currentRange, ctx.grantedRanges);
    if (!inRange) return 'range';
  }

  if (ctx.currentAp !== undefined && ctx.currentAp < getApCost(skill)) {
    return 'ap';
  }

  if (ctx.currentChakra < effectiveChakraCost(skill, ctx.skipFirstSkillCost)) {
    return 'chakra';
  }

  if (!canAffordHpCost(skill, ctx.currentHp, ctx.maxHp)) {
    return 'hp';
  }

  const mi = skill.modeInteraction;
  if (mi?.requireOn && ctx.activeModes !== undefined) {
    const boundId = bindLiveModeId(ctx.activeModes, mi);
    const charges = boundId ? modeChargesOnBoard(ctx.activeModes, boundId) : 0;
    const need = mi.consumeAllCharges ? 1 : (mi.consumeCharges ?? 1);
    if (!boundId || charges < need) {
      return 'mode-required';
    }
  }

  if (
    mi?.requireMarkHard &&
    mi.requireMarkId &&
    ctx.marks !== undefined &&
    !hasEnemyMark(ctx.marks, mi.requireMarkId)
  ) {
    return 'mark-required';
  }

  return null;
}

/** FREE_FIRST waives chakra only — never AP, HP, CD, Mode upkeep, or charges. */
export function effectiveChakraCost(skill: Skill, skipFirstSkillCost?: boolean): number {
  return skipFirstSkillCost ? 0 : skill.chakraCost;
}

/** True when no block reason applies. */
export function canPlaySkill(ctx: SkillPlayContext): boolean {
  return getSkillBlockReason(ctx) === null;
}

/** Hand slot stays occupied when disabled (no auto-drop). */
export function snapshotHandSlot(ctx: SkillPlayContext): {
  skill: Skill;
  disabled: boolean;
  reason: SkillBlockReason;
} {
  const reason = getSkillBlockReason(ctx);
  return { skill: ctx.skill, disabled: reason !== null, reason };
}
