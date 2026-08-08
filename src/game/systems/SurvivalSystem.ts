/**
 * =============================================================================
 * SURVIVAL SYSTEM - Lethal Damage & Guts Checks
 * =============================================================================
 *
 * Pure system for checking lethal damage and processing guts survival.
 * Zero React/DOM dependencies.
 *
 * Guts can come from either:
 * 1. Stat-based guts (gutsChance from stats, survives at 1 HP)
 * 2. Artifact guts (from equipment, may heal to a percentage)
 *
 * Priority: Stat-based guts is checked first. Artifact guts is only used
 * if stat-based fails AND artifact hasn't been used this combat.
 *
 * =============================================================================
 */

import { checkGuts } from './StatSystem';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Context for tracking guts state across turn phases.
 */
export interface GutsContext {
  /** Whether stat-based or artifact guts has been triggered this turn */
  triggered: boolean;
  /** Whether artifact guts specifically was triggered (for caller to update combatState) */
  artifactTriggered: boolean;
}

/**
 * Information about an entity's artifact guts passive.
 */
export interface ArtifactGutsInfo {
  hasGuts: boolean;
  healPercent: number;
  source: string;
}

/**
 * Result of checking for lethal damage with guts.
 */
export interface LethalCheckResult {
  /** Whether the entity survived */
  survived: boolean;
  /** New HP after guts (1 or healed amount) */
  newHp: number;
  /** Whether guts was triggered */
  gutsTriggered: boolean;
  /** Whether artifact guts specifically was triggered */
  artifactGutsTriggered: boolean;
  /** Log message if guts triggered */
  log?: string;
}

// ============================================================================
// LETHAL DAMAGE CHECK
// ============================================================================

/**
 * Check if damage would be lethal and process guts.
 * Guts can come from either:
 * 1. Stat-based guts (gutsChance from stats, survives at 1 HP)
 * 2. Artifact guts (from equipment, may heal to a percentage)
 *
 * Priority: Stat-based guts is checked first. Artifact guts is only used
 * if stat-based fails AND artifact hasn't been used this combat.
 *
 * @param currentHp - Current HP before damage
 * @param incomingDamage - Damage that would be dealt
 * @param gutsChance - Percentage chance for stat-based guts
 * @param gutsContext - Current guts state for this turn
 * @param artifactGuts - Artifact guts info (if player has artifact with guts)
 * @param artifactGutsUsed - Whether artifact guts was already used this combat
 * @param maxHp - Max HP for calculating artifact guts heal
 */
export function checkLethalDamage(
  currentHp: number,
  incomingDamage: number,
  gutsChance: number,
  gutsContext: GutsContext,
  artifactGuts?: ArtifactGutsInfo,
  artifactGutsUsed?: boolean,
  maxHp?: number
): LethalCheckResult {
  const hpAfterDamage = currentHp - incomingDamage;

  // Not lethal, no guts needed
  if (hpAfterDamage > 0) {
    return {
      survived: true,
      newHp: hpAfterDamage,
      gutsTriggered: gutsContext.triggered,
      artifactGutsTriggered: gutsContext.artifactTriggered
    };
  }

  // Already used guts this turn
  if (gutsContext.triggered) {
    return {
      survived: false,
      newHp: hpAfterDamage,
      gutsTriggered: true,
      artifactGutsTriggered: gutsContext.artifactTriggered
    };
  }

  // Try stat-based guts first
  const statGutsResult = checkGuts(hpAfterDamage, incomingDamage, gutsChance);
  if (statGutsResult.survived) {
    return {
      survived: true,
      newHp: 1,
      gutsTriggered: true,
      artifactGutsTriggered: gutsContext.artifactTriggered,
      log: `GUTS! You refuse to fall!`
    };
  }

  // Try artifact guts if available and not used this combat
  if (artifactGuts?.hasGuts && !artifactGutsUsed && maxHp) {
    const healAmount = Math.floor(maxHp * (artifactGuts.healPercent / 100));
    return {
      survived: true,
      newHp: Math.max(1, healAmount),
      gutsTriggered: true,
      artifactGutsTriggered: true,
      log: `${artifactGuts.source} triggers GUTS! Restored to ${healAmount} HP!`
    };
  }

  // All guts failed
  return {
    survived: false,
    newHp: hpAfterDamage,
    gutsTriggered: false,
    artifactGutsTriggered: false
  };
}
