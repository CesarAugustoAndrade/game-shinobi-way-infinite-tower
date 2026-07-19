/**
 * =============================================================================
 * POSTURE SYSTEM - Stance modifiers for the AP combat economy (T-004)
 * =============================================================================
 *
 * Pure helpers describing the three combat postures. A posture does three
 * things in the deckbuilder model:
 *   1. Biases the weighted card draw (see DeckSystem / combatCards.weightFor).
 *   2. Applies a LIGHT outgoing-damage modifier (`postureDamageMod`, wired into
 *      PlayerTurnSystem.useSkill in F2).
 *   3. Applies a LIGHT incoming-damage modifier (`postureDefenseMod`, wired into
 *      EnemyTurnSystem in F2). It scales the post-mitigation damage the player
 *      takes so DEFENSIVE is a real trade-off rather than strictly worse. The
 *      base mitigation math (calculateDamage/applyMitigation) stays frozen; this
 *      is an external posture multiplier applied on top.
 *
 * The two modifiers are reciprocal and symmetric, so each posture is a genuine
 * trade-off (none is strictly dominant):
 *   - AGGRESSIVE: deal ×1.15, take ×1.15  (glass cannon)
 *   - BALANCED:   deal ×1.0,  take ×1.0   (neutral baseline)
 *   - DEFENSIVE:  deal ×0.85, take ×0.85  (tanky)
 *
 * Values are intentionally small ("bono leve") so the base damage math stays
 * dominant. They live here, alongside the system that consumes them, as the
 * single source of truth for posture tuning.
 *
 * =============================================================================
 */

import { ApproachType, Posture, Skill } from '../types';

// ============================================================================
// TUNING — light, reciprocal trade-offs. Balanced is the neutral baseline.
// ============================================================================

/** Outgoing damage you deal, per posture. Aggressive hits harder, Defensive softer. */
const POSTURE_DAMAGE_MOD: Record<Posture, number> = {
  [Posture.AGGRESSIVE]: 1.15, // +15% damage dealt
  [Posture.BALANCED]: 1.0, //   neutral
  [Posture.DEFENSIVE]: 0.85, // -15% damage dealt
};

/** Incoming damage you take, per posture. Defensive absorbs, Aggressive exposes. */
const POSTURE_DEFENSE_MOD: Record<Posture, number> = {
  [Posture.AGGRESSIVE]: 1.15, // +15% damage taken
  [Posture.BALANCED]: 1.0, //   neutral
  [Posture.DEFENSIVE]: 0.85, // -15% damage taken
};

/** Short label/identity for each posture (UI). */
const POSTURE_LABEL: Record<Posture, string> = {
  [Posture.AGGRESSIVE]: 'Aggressive',
  [Posture.BALANCED]: 'Balanced',
  [Posture.DEFENSIVE]: 'Defensive',
};

/** One-line description of what each posture biases the draw toward (UI). */
const POSTURE_DRAW_BIAS: Record<Posture, string> = {
  [Posture.AGGRESSIVE]: 'Favors attack cards',
  [Posture.BALANCED]: 'Even draw',
  [Posture.DEFENSIVE]: 'Favors guard cards',
};

// ============================================================================
// MODIFIERS
// ============================================================================

/**
 * Light outgoing-damage multiplier for the active posture.
 * @param posture - The active combat posture.
 * @returns A multiplier applied to the player's outgoing damage.
 */
export function postureDamageMod(posture: Posture): number {
  return POSTURE_DAMAGE_MOD[posture];
}

/**
 * Light incoming-damage multiplier for the active posture.
 * @param posture - The active combat posture.
 * @returns A multiplier applied to damage the player takes.
 */
export function postureDefenseMod(posture: Posture): number {
  return POSTURE_DEFENSE_MOD[posture];
}

/**
 * The posture a card shifts the player into when played, if any.
 * @param skill - The card being played.
 * @returns The target posture, or `undefined` if the card does not shift stance.
 */
export function stanceShiftFromSkill(skill: Skill): Posture | undefined {
  return skill.stanceShift;
}

// ============================================================================
// DISPLAY DESCRIPTOR
// ============================================================================

/** Human-readable profile of a posture for the combat UI. */
export interface PostureProfile {
  posture: Posture;
  label: string;
  /** Outgoing-damage multiplier (active in combat). */
  damageMod: number;
  /** Incoming-damage multiplier (UI/forward-looking). */
  defenseMod: number;
  /** What the posture biases the per-turn draw toward. */
  drawBias: string;
}

/**
 * Build the display profile for a posture: its label, both modifiers and the
 * draw-bias blurb. Used by the combat UI's posture control.
 *
 * @param posture - The posture to describe.
 * @returns A {@link PostureProfile} for rendering.
 */
export function describePosture(posture: Posture): PostureProfile {
  return {
    posture,
    label: POSTURE_LABEL[posture],
    damageMod: postureDamageMod(posture),
    defenseMod: postureDefenseMod(posture),
    drawBias: POSTURE_DRAW_BIAS[posture],
  };
}

// ============================================================================
// APPROACH → OPENING POSTURE (T-039)
// ============================================================================

/**
 * Opening combat posture after an approach attempt.
 * Success maps each approach to a stance identity; failure resets to Balanced
 * so failed setups do not soft-lock into a bad stance.
 */
export function openingPostureForApproach(
  approach: ApproachType,
  success: boolean,
): Posture {
  if (!success) {
    return Posture.BALANCED;
  }

  switch (approach) {
    case ApproachType.STEALTH_AMBUSH:
      return Posture.AGGRESSIVE;
    case ApproachType.GENJUTSU_SETUP:
      return Posture.DEFENSIVE;
    case ApproachType.ENVIRONMENTAL_TRAP:
      return Posture.DEFENSIVE;
    case ApproachType.FRONTAL_ASSAULT:
      return Posture.BALANCED;
    case ApproachType.SHADOW_BYPASS:
      // Bypass usually skips combat; if combat still starts, stay neutral.
      return Posture.BALANCED;
    default:
      return Posture.BALANCED;
  }
}

/** Short log line when combat opens in a non-balanced posture. */
export function openingPostureLog(posture: Posture, approach: ApproachType): string | null {
  if (posture === Posture.BALANCED) return null;
  if (approach === ApproachType.STEALTH_AMBUSH && posture === Posture.AGGRESSIVE) {
    return 'Ambush! You open in Aggressive posture.';
  }
  if (posture === Posture.AGGRESSIVE) {
    return `You open in Aggressive posture.`;
  }
  if (posture === Posture.DEFENSIVE) {
    return `You open in Defensive posture.`;
  }
  return null;
}
