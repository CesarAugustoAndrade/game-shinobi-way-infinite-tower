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

// ============================================================================
// MULTIPLIER LIST BUILDERS
// ============================================================================

/** Push mult only when defined and not identity (1.0). applyDamageMultipliers also skips 1.0. */
function pushNonIdentity(out: number[], m: number | undefined): void {
  if (m !== undefined && m !== 1.0) out.push(m);
}

/**
 * Build player → enemy pre-mitigation mult list (canonical order).
 *
 * Suggested stack (product is commutative; order kept for logging parity):
 *   firstHit (if isFirstTurn), terrainAmp, locationSkillMult,
 *   playerDamageMultiplier, postureMod, stanceMult
 *
 * Location enemy_defense_bonus stays outside this list
 * (`applyEnemyDefenseBonusToDamage` after early mults).
 *
 * @example
 * ```ts
 * const pre = buildPlayerPreMitigationMults({
 *   isFirstTurn: combatState.isFirstTurn,
 *   firstHitMultiplier: combatState.firstHitMultiplier,
 *   terrainAmp: getTerrainElementAmplification(terrain, player.element),
 *   locationSkillMult: skillLocationDamageMult(skill, mods),
 *   playerDamageMultiplier: LaunchProperties.PLAYER_DAMAGE_MULTIPLIER,
 *   postureMod: postureDamageMod(posture),
 *   stanceMult: stanceBonusDamageMult(skill, posture),
 * });
 * resolveSuccessfulHit({ rawDamage, preMitigationMultipliers: pre, ... });
 * ```
 */
export function buildPlayerPreMitigationMults(opts: {
  firstHitMultiplier?: number;
  isFirstTurn?: boolean;
  terrainAmp?: number;
  locationSkillMult?: number;
  playerDamageMultiplier?: number;
  postureMod?: number;
  stanceMult?: number;
}): number[] {
  const mults: number[] = [];
  if (opts.isFirstTurn) {
    pushNonIdentity(mults, opts.firstHitMultiplier);
  }
  pushNonIdentity(mults, opts.terrainAmp);
  pushNonIdentity(mults, opts.locationSkillMult);
  pushNonIdentity(mults, opts.playerDamageMultiplier);
  pushNonIdentity(mults, opts.postureMod);
  pushNonIdentity(mults, opts.stanceMult);
  return mults;
}

/**
 * Build enemy → player pre-mitigation mult list (canonical order):
 *   enemyDamageMultiplier, ambushMult, (1 + enemyAttackBonus)
 *
 * `enemyAttackBonus` is a fraction (e.g. 0.15 → ×1.15). Zero / omit → skip.
 *
 * @example
 * ```ts
 * const pre = buildEnemyPreMitigationMults({
 *   enemyDamageMultiplier: LaunchProperties.ENEMY_DAMAGE_MULTIPLIER,
 *   ambushMult: combatState.isFirstTurn ? combatState.enemyFirstHitMultiplier : 1,
 *   enemyAttackBonus: combatState.locationTerrainMods?.enemyAttackBonus,
 * });
 * ```
 */
export function buildEnemyPreMitigationMults(opts: {
  enemyDamageMultiplier?: number;
  ambushMult?: number;
  /** Fraction → mult of (1 + bonus). */
  enemyAttackBonus?: number;
}): number[] {
  const mults: number[] = [];
  pushNonIdentity(mults, opts.enemyDamageMultiplier);
  pushNonIdentity(mults, opts.ambushMult);
  if (opts.enemyAttackBonus !== undefined && opts.enemyAttackBonus !== 0) {
    pushNonIdentity(mults, 1 + opts.enemyAttackBonus);
  }
  return mults;
}

/**
 * Build player-as-defender post-mitigation mult list:
 *   (1 - damageReductionPercent/100), postureDefenseMod
 *
 * @example
 * ```ts
 * const post = buildPlayerDefensePostMults({
 *   damageReductionPercent: getDamageReductionPercent(player, maxHp),
 *   postureDefenseMod: postureDefenseMod(posture),
 * });
 * resolveSuccessfulHit({ ..., postMitigationMultipliers: post });
 * ```
 */
export function buildPlayerDefensePostMults(opts: {
  damageReductionPercent?: number;
  postureDefenseMod?: number;
}): number[] {
  const mults: number[] = [];
  if (
    opts.damageReductionPercent !== undefined
    && opts.damageReductionPercent !== 0
  ) {
    pushNonIdentity(mults, 1 - opts.damageReductionPercent / 100);
  }
  pushNonIdentity(mults, opts.postureDefenseMod);
  return mults;
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
