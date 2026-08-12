/**
 * skillPlayability — pure skill playability gates shared by UI and sims.
 *
 * Mirrors the resource / status / range checks in PlayerTurnSystem.useSkill
 * and Combat.tsx canUseSkill, without React or combat state objects.
 * Zero DOM. Callers assemble SkillPlayContext from player + combat fields.
 */

import { Buff, CombatRange, EffectType, Skill } from '../types';
import { getApCost } from '../constants/combatCards';
import { canActivateModeAt, skillAllowedAt } from './RangeSystem';
import { canAffordHpCost } from './StatSystem';

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
  | null;

// ============================================================================
// PLAYABILITY
// ============================================================================

/**
 * First failing gate for playing `ctx.skill`, or null if playable.
 *
 * Check order (stable for UI tooltips / sims):
 * stun → silence → cooldown → range (skip if Mode already ON) → ap → chakra → hp
 * Mode activation uses canActivateModeAt. FREE_FIRST waives chakra only.
 *
 * Gates mirror useSkill:
 * - cooldown > 0
 * - STUN buff present
 * - SILENCE && skill.chakraCost > 0 (base cost; free-first does not bypass silence)
 * - effective chakra (0 when skipFirstSkillCost)
 * - canAffordHpCost(skill, currentHp, maxHp)
 * - AP when currentAp is defined
 * - skillAllowedAt when currentRange is defined
 */
export function getSkillBlockReason(ctx: SkillPlayContext): SkillBlockReason {
  const { skill, activeBuffs } = ctx;

  if (activeBuffs.some((b) => b?.effect?.type === EffectType.STUN)) {
    return 'stun';
  }

  // Silence keys off base chakraCost — FREE_FIRST does not waive the silence gate.
  if (
    activeBuffs.some((b) => b?.effect?.type === EffectType.SILENCE) &&
    skill.chakraCost > 0
  ) {
    return 'silence';
  }

  if (skill.currentCooldown > 0) {
    return 'cooldown';
  }

  if (ctx.currentRange !== undefined && !ctx.modeAlreadyOn) {
    const inRange = ctx.modeActivation
      ? canActivateModeAt(skill.allowedRanges, ctx.currentRange)
      : skillAllowedAt(skill, ctx.currentRange);
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
