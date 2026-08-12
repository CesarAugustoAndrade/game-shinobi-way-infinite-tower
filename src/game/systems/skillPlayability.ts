/**
 * skillPlayability — pure skill playability gates shared by UI and sims.
 *
 * Mirrors the resource / status / range checks in PlayerTurnSystem.useSkill
 * and Combat.tsx canUseSkill, without React or combat state objects.
 * Zero DOM. Callers assemble SkillPlayContext from player + combat fields.
 */

import { Buff, CombatRange, EffectType, Skill } from '../types';
import { getApCost } from '../constants/combatCards';
import { skillAllowedAt } from './RangeSystem';
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
  /** FREE_FIRST_SKILL: treat chakra cost as 0 for affordability. */
  skipFirstSkillCost?: boolean;
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
 * stun → silence → cooldown → range → ap → chakra → hp
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

  if (ctx.currentRange !== undefined && !skillAllowedAt(skill, ctx.currentRange)) {
    return 'range';
  }

  if (ctx.currentAp !== undefined && ctx.currentAp < getApCost(skill)) {
    return 'ap';
  }

  const effectiveChakraCost = ctx.skipFirstSkillCost ? 0 : skill.chakraCost;
  if (ctx.currentChakra < effectiveChakraCost) {
    return 'chakra';
  }

  if (!canAffordHpCost(skill, ctx.currentHp, ctx.maxHp)) {
    return 'hp';
  }

  return null;
}

/** True when no block reason applies. */
export function canPlaySkill(ctx: SkillPlayContext): boolean {
  return getSkillBlockReason(ctx) === null;
}
