/**
 * =============================================================================
 * SKILL RESOLUTION SYSTEM — Shared combat hit pipeline (Sprint B)
 * =============================================================================
 *
 * Pure functions for the post-calculateDamage hit path shared by live combat
 * and auto-combat. No React/DOM; no turn orchestration.
 *
 * After calculateDamage (StatSystem), callers apply side-specific multipliers then:
 *   applyDamageMultipliers → applyMitigation → applyPostMitigationMultipliers
 *
 * ## Suggested player pre-mitigation stack
 * (order matters for logging; product is commutative for mults):
 *   firstHit, terrainAmp, locationSkillMult (then location enemyDef is additive
 *   via applyEnemyDefenseBonusToDamage), LaunchProperties.PLAYER_DAMAGE_MULTIPLIER,
 *   postureDamageMod, stanceBonusDamageMult
 *
 * ## Enemy stack
 *   LaunchProperties.ENEMY_DAMAGE_MULTIPLIER, ambushMult, (1 + enemyAttackBonus)
 *
 * ## Post player-as-defender
 *   (1 - drPercent/100) if any, postureDefenseMod
 *
 * =============================================================================
 */

import type { Buff } from '../types';
import { applyMitigation } from './CombatCalculationSystem';
import {
  applyEnemyDefenseBonus,
  type LocationTerrainMods,
} from './LocationTerrainSystem';

// ============================================================================
// DAMAGE MULTIPLIERS
// ============================================================================

/**
 * Multiply base damage by a list of multipliers.
 * Floors after each mult, skips exact 1.0 entries, never returns below 0.
 */
export function applyDamageMultipliers(baseDamage: number, multipliers: number[]): number {
  let dmg = baseDamage;
  for (const m of multipliers) {
    if (m === 1.0) continue;
    dmg = Math.floor(dmg * m);
  }
  return Math.max(0, dmg);
}

/**
 * Same rules as applyDamageMultipliers (post-mitigation stage).
 */
export function applyPostMitigationMultipliers(
  damage: number,
  multipliers: number[],
): number {
  return applyDamageMultipliers(damage, multipliers);
}

/**
 * Apply location enemy_defense_bonus as damage reduction for player → enemy hits.
 * Reuses LocationTerrainSystem.applyEnemyDefenseBonus (×(1 - bonus), floor).
 */
export function applyEnemyDefenseBonusToDamage(
  damage: number,
  locationTerrainMods: LocationTerrainMods | null | undefined,
): number {
  return applyEnemyDefenseBonus(damage, locationTerrainMods);
}

// ============================================================================
// MITIGATED HIT
// ============================================================================

export interface MitigatedHitInput {
  damage: number;
  defenderBuffs: Buff[];
  /** For mitigation messages ('You', enemy.name) */
  defenderLabel: string;
}

export interface MitigatedHitResult {
  finalDamage: number;
  reflectedDamage: number;
  updatedDefenderBuffs: Buff[];
  messages: string[];
}

/**
 * Wrap CombatCalculationSystem.applyMitigation into the shared hit result shape.
 */
export function resolveMitigatedHit(input: MitigatedHitInput): MitigatedHitResult {
  const result = applyMitigation(
    input.defenderBuffs,
    input.damage,
    input.defenderLabel,
  );
  return {
    finalDamage: result.finalDamage,
    reflectedDamage: result.reflectedDamage,
    updatedDefenderBuffs: result.updatedBuffs,
    messages: result.messages,
  };
}

// ============================================================================
// FULL SUCCESSFUL HIT
// ============================================================================

/** Full hit after a successful (non-miss/non-evade) damage roll */
export interface ResolveSuccessfulHitParams {
  /** damageResult.finalDamage from calculateDamage */
  rawDamage: number;
  preMitigationMultipliers?: number[];
  defenderBuffs: Buff[];
  defenderLabel: string;
  postMitigationMultipliers?: number[];
}

/**
 * Pre-mult → mitigation → post-mult pipeline for a hit that already connected.
 * Callers own side-specific multiplier lists (see file header JSDoc).
 */
export function resolveSuccessfulHit(
  params: ResolveSuccessfulHitParams,
): MitigatedHitResult {
  const dmg = applyDamageMultipliers(
    params.rawDamage,
    params.preMitigationMultipliers ?? [],
  );
  const mit = resolveMitigatedHit({
    damage: dmg,
    defenderBuffs: params.defenderBuffs,
    defenderLabel: params.defenderLabel,
  });
  const finalDamage = applyPostMitigationMultipliers(
    mit.finalDamage,
    params.postMitigationMultipliers ?? [],
  );
  return { ...mit, finalDamage };
}
