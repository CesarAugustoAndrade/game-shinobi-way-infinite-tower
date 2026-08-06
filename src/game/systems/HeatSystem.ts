/**
 * HeatSystem — pure visit HEAT helpers (F3)
 *
 * HEAT is greed/alert on the current location visit only.
 * - Clamp 0..100
 * - No auto-increment by room visit, combat turn, or time
 * - Ordinary enemy stats are never buffed by heat
 * - hunterArmed latches at 100 and never clears during the visit
 *
 * Zero React/DOM.
 */

import { ApproachType, HeatTier } from '../types';

export const HEAT_MIN = 0;
export const HEAT_MAX = 100;

/** EXIT probability bonus (absolute fraction) when hunterArmed after min rooms. */
export const HUNTER_EXIT_CHANCE_BONUS = 0.4;

/** Elite ambush chain chances by heat band (post-result, pre-pay). */
export const ELITE_CHAIN_CHANCE = {
  QUIET_OR_SUSPICIOUS: 0, // 0–49
  ALERT: 0.25,            // 50–74
  HUNTED: 0.5,            // 75–99
  ARMED: 0,               // 100 — threat reserved for Hunter
} as const;

export interface HeatApplyResult {
  heat: number;
  hunterArmed: boolean;
  /** True only on the transition that first reaches 100 this apply. */
  newlyArmed: boolean;
  previousHeat: number;
  tier: HeatTier;
}

/** Clamp heat to 0..100. */
export function clampHeat(value: number): number {
  if (!Number.isFinite(value)) return HEAT_MIN;
  return Math.max(HEAT_MIN, Math.min(HEAT_MAX, Math.round(value)));
}

/** Tier from heat value (boundaries inclusive on upper end per plan). */
export function tierFromHeat(heat: number): HeatTier {
  const h = clampHeat(heat);
  if (h <= 24) return HeatTier.QUIET;
  if (h <= 49) return HeatTier.SUSPICIOUS;
  if (h <= 74) return HeatTier.ALERT;
  return HeatTier.HUNTED;
}

/** Human label for UI. */
export function formatHeatTier(tier: HeatTier): string {
  switch (tier) {
    case HeatTier.QUIET:
      return 'Quiet';
    case HeatTier.SUSPICIOUS:
      return 'Suspicious';
    case HeatTier.ALERT:
      return 'Alert';
    case HeatTier.HUNTED:
      return 'Hunted';
    default:
      return String(tier);
  }
}

/**
 * Apply an authored heat delta. Latch hunterArmed when heat hits 100.
 * Once armed, hunterArmed stays true even if later deltas lower heat.
 */
export function applyHeatDelta(
  currentHeat: number,
  delta: number,
  hunterArmed: boolean = false,
): HeatApplyResult {
  const previousHeat = clampHeat(currentHeat);
  const heat = clampHeat(previousHeat + (Number.isFinite(delta) ? delta : 0));
  const newlyArmed = !hunterArmed && heat >= HEAT_MAX;
  const armed = hunterArmed || heat >= HEAT_MAX;
  return {
    heat,
    hunterArmed: armed,
    newlyArmed,
    previousHeat,
    tier: tierFromHeat(heat),
  };
}

/** Initial visit heat state (new floor). */
export function initialHeatState(): { heat: number; hunterArmed: boolean } {
  return { heat: 0, hunterArmed: false };
}

/**
 * PP penalty applied after normal approach chance, before clamp.
 * Heat 0–24: no penalty. Bands 25–49 / 50–74 / 75–100 use plan table.
 */
export function approachHeatPenaltyPp(approach: ApproachType, heat: number): number {
  const h = clampHeat(heat);
  if (h < 25) return 0;

  type Band = 'low' | 'mid' | 'high';
  const band: Band = h <= 49 ? 'low' : h <= 74 ? 'mid' : 'high';

  const table: Record<ApproachType, Record<Band, number>> = {
    [ApproachType.IRON_GUARD]: { low: 0, mid: -5, high: -15 },
    [ApproachType.FRONTAL_ASSAULT]: { low: 0, mid: -10, high: -20 },
    [ApproachType.ENVIRONMENTAL_TRAP]: { low: -5, mid: -15, high: -30 },
    [ApproachType.GENJUTSU_SETUP]: { low: -5, mid: -20, high: -35 },
    [ApproachType.STEALTH_AMBUSH]: { low: -10, mid: -25, high: -45 },
    [ApproachType.SHADOW_BYPASS]: { low: -15, mid: -30, high: -50 },
  };

  return table[approach]?.[band] ?? 0;
}

/**
 * Fail heat deltas (success paths add 0).
 * Frontal never fails in practice; still documented as +5 if used.
 */
export function approachFailHeatDelta(approach: ApproachType): number {
  switch (approach) {
    case ApproachType.FRONTAL_ASSAULT:
    case ApproachType.IRON_GUARD:
      return 5;
    case ApproachType.ENVIRONMENTAL_TRAP:
    case ApproachType.GENJUTSU_SETUP:
      return 10;
    case ApproachType.STEALTH_AMBUSH:
      return 15;
    case ApproachType.SHADOW_BYPASS:
      return 20;
    default:
      return 0;
  }
}

/** Chance [0..1] to roll a heat-triggered elite ambush after a Normal win. */
export function eliteChainChance(heat: number): number {
  const h = clampHeat(heat);
  if (h >= 100) return ELITE_CHAIN_CHANCE.ARMED;
  if (h >= 75) return ELITE_CHAIN_CHANCE.HUNTED;
  if (h >= 50) return ELITE_CHAIN_CHANCE.ALERT;
  return ELITE_CHAIN_CHANCE.QUIET_OR_SUSPICIOUS;
}

/**
 * Roll elite chain (caller supplies RNG 0..1 exclusive upper).
 * Returns true if ambush triggers.
 */
export function rollEliteChain(heat: number, rng01: number = Math.random()): boolean {
  const p = eliteChainChance(heat);
  if (p <= 0) return false;
  return rng01 < p;
}

/**
 * Enemy exclusions for heat elite chain (not authored Elite Challenge activity).
 */
export function isHeatChainEligibleEnemy(enemy: {
  tier?: string;
  isBoss?: boolean;
  isHunter?: boolean;
}): boolean {
  if (!enemy) return false;
  if (enemy.isBoss) return false;
  if (enemy.isHunter) return false;
  const tier = (enemy.tier || '').toLowerCase();
  if (tier === 'guardian' || tier.includes('guardian')) return false;
  if (tier.includes('hunter')) return false;
  if (tier.includes('kage')) return false;
  // Authored elite challenge still excluded by caller via pendingArtifact / activity type
  return true;
}
