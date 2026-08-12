/**
 * =============================================================================
 * COMBAT CARDS - Card categorization, AP costs & posture draw weights (T-004)
 * =============================================================================
 *
 * Pure, side-effect-free helpers that classify a `Skill` for the deckbuilder
 * combat economy. These are the foundation the DeckSystem (a later phase) will
 * consume to build draw piles and weight the per-turn hand by posture.
 *
 * Design notes:
 * - No React, no mutation, no `Math.random` — every function is deterministic.
 * - Balance dials (the offensive damage threshold, base weight) live here in
 *   `constants/`; the posture multipliers live in `LaunchProperties`.
 * - PASSIVE skills are always active and never enter the deck; helpers still
 *   accept them and return sensible, non-blocking values.
 *
 * =============================================================================
 */

import { ActionType, EffectType, PrimaryStat, Skill } from '../types';

// ============================================================================
// CARD CATEGORY
// ============================================================================

/**
 * The three draw-weighting buckets a card can fall into.
 * - `offensive`: the card's primary purpose is dealing damage.
 * - `defensive`: the card protects or restores the player (shield/heal/etc.).
 * - `utility`: setup, buffs, debuffs, control and resource manipulation.
 */
export type CardCategory = 'offensive' | 'utility' | 'defensive';

/**
 * Expected damage at ref stat 3: baseDamage + scalingPerPoint×3.
 * Offensive if above this floor; low-chip defensive techniques stay defensive.
 */
export const CARD_OFFENSIVE_DAMAGE_THRESHOLD = 6;

/** @deprecated T-003 draw uses skill.baseWeight default 2 via DeckSystem.effectiveWeight. */
export const CARD_BASE_WEIGHT = 1.0;

/** Effect types that directly prevent or recover damage → defensive. */
const DEFENSIVE_EFFECT_TYPES: ReadonlySet<EffectType> = new Set([
  EffectType.SHIELD,
  EffectType.INVULNERABILITY,
  EffectType.REFLECTION,
  EffectType.HEAL,
  EffectType.REGEN,
]);

/** Primary stats whose self-BUFF signals a defensive intent (survival stats). */
const DEFENSIVE_BUFF_STATS: ReadonlySet<PrimaryStat> = new Set([
  PrimaryStat.WILLPOWER,
  PrimaryStat.CALMNESS,
]);

/**
 * Classify a skill into an offensive / defensive / utility card bucket.
 *
 * Resolution order (first match wins):
 *   1. Deals meaningful damage          → `offensive`
 *   2. Applies a shield/heal/reflect/etc → `defensive`
 *   3. Buffs a survival stat (WIL/CAL)   → `defensive`
 *   4. Anything else (buffs, debuffs,
 *      control, resource manipulation)   → `utility`
 *
 * @param skill - The skill to categorize.
 * @returns The card category used for draw weighting.
 */
export function getCardCategory(skill: Skill): CardCategory {
  if (((skill.baseDamage ?? 0) + (skill.scalingPerPoint ?? 0) * 3) > CARD_OFFENSIVE_DAMAGE_THRESHOLD) {
    return 'offensive';
  }

  const effects = skill.effects ?? [];

  const hasDefensiveEffect = effects.some((effect) =>
    DEFENSIVE_EFFECT_TYPES.has(effect.type)
  );
  if (hasDefensiveEffect) {
    return 'defensive';
  }

  const hasDefensiveBuff = effects.some(
    (effect) =>
      effect.type === EffectType.BUFF &&
      effect.targetStat !== undefined &&
      DEFENSIVE_BUFF_STATS.has(effect.targetStat)
  );
  if (hasDefensiveBuff) {
    return 'defensive';
  }

  return 'utility';
}

// ============================================================================
// ACTION POINT COST
// ============================================================================

/**
 * Derive the default Action Point cost for a card from its `ActionType`.
 * Used only as a safety fallback when `Skill.apCost` is not set.
 * Catalog skills should author `apCost` explicitly.
 *
 * - ACTIVE  → 2
 * - TOGGLE  → 2
 * - PASSIVE → 0
 */
export function getDefaultApCost(skill: Skill): number {
  switch (skill.actionType) {
    case ActionType.ACTIVE:
      return 2;
    case ActionType.TOGGLE:
      return 2;
    case ActionType.PASSIVE:
      return 0;
    default:
      return 2;
  }
}

/**
 * The effective AP cost of a card: an explicit `Skill.apCost` when provided,
 * otherwise the `ActionType`-derived default.
 *
 * @param skill - The skill to price.
 * @returns The AP cost to play this card.
 */
export function getApCost(skill: Skill): number {
  return skill.apCost ?? getDefaultApCost(skill);
}


