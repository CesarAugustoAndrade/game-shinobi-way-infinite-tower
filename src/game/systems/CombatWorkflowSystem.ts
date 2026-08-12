/**
 * =============================================================================
 * COMBAT WORKFLOW SYSTEM - Turn-Based Combat State Orchestration
 * =============================================================================
 *
 * This system handles the flow of turn-based combat, orchestrating state
 * changes across player and enemy turns. It uses pure calculation functions
 * from CombatCalculationSystem for the actual math.
 *
 * ## Architecture (Sprint B — single hit path)
 *
 * Layered modules; consumers should import hit-core through this barrel or the
 * pure systems directly:
 *
 * - **combat-types.ts**:
 *   Shared type definitions (CombatState, CombatResult, etc.)
 *   Prevents circular imports between turn systems
 *
 * - **SurvivalSystem.ts**:
 *   Lethal damage + guts (`checkLethalDamage`, GutsContext types)
 *
 * - **SkillResolutionSystem.ts** (+ **skillPlayability.ts**):
 *   Shared hit pipeline after calculateDamage
 *   (`applyDamageMultipliers` → `resolveMitigatedHit` → `resolveSuccessfulHit`)
 *   and pure playability gates (`canPlaySkill` / `getSkillBlockReason`)
 *
 * - **CombatWorkflowSystem.ts** (this file):
 *   Combat state initialization and re-exports from all combat modules
 *
 * - **PlayerTurnSystem.ts** / **EnemyTurnSystem.ts**:
 *   Live turn orchestration (`useSkill`, `processEnemyTurn`, upkeep, approach)
 *
 * - **CombatSimulationService** / **BattleSimulator**:
 *   Auto and balance paths — Sprint B goal is that both call
 *   SurvivalSystem.checkLethalDamage + SkillResolutionSystem.resolveSuccessfulHit
 *   for the hit core (see docs/combat-single-path.md). Simulation should call
 *   SkillResolution, not re-implement multipliers/mitigation.
 *
 * ## Combat Turn Order
 *
 * ### Player Turn (useSkill):
 * 1. Resource validation (chakra, HP costs)
 * 2. Stun check (prevents action if stunned)
 * 3. Damage calculation (via StatSystem.calculateDamage)
 * 4. First hit multiplier from approach (if first turn)
 * 5. Terrain element amplification
 * 6. Damage mitigation on enemy (via CombatCalculationSystem.applyMitigation)
 * 7. Effect application with resistance checks
 * 8. Cooldown update
 *
 * ### Enemy Turn (processEnemyTurn):
 * 1. Process DoT effects on enemy (Bleed, Burn, Poison)
 * 2. Process Regen effects on enemy
 * 3. Process DoT effects on player (with shield mitigation)
 * 4. Process Regen effects on player
 * 5. Check for DoT deaths (enemy first, then player)
 * 6. Guts check for player if lethal
 * 7. Enemy action (stunned, confused, or attack)
 * 8. Damage mitigation on player
 * 9. Apply enemy skill effects to player
 * 10. Player cooldown reduction
 * 11. Player chakra regeneration
 * 12. Apply terrain hazards to both combatants
 * 13. Final death checks
 *
 * =============================================================================
 */

import { CombatRange, Posture, TerrainDefinition } from '../types';
import { CombatModifiers } from './ApproachSystem';

// Re-export types from combat-types.ts (single source of truth)
export type { CombatState, CombatResult, UpkeepResult, EnemyTurnResult } from './combat-types';
import type { CombatState } from './combat-types';

// Sprint B hit core — Survival (guts/lethal) + SkillResolution (shared hit pipeline)
export { checkLethalDamage } from './SurvivalSystem';
export type { GutsContext, LethalCheckResult, ArtifactGutsInfo } from './SurvivalSystem';
export {
  applyDamageMultipliers,
  applyPostMitigationMultipliers,
  applyEnemyDefenseBonusToDamage,
  buildPlayerPreMitigationMults,
  buildEnemyPreMitigationMults,
  buildPlayerDefensePostMults,
  resolveMitigatedHit,
  resolveSuccessfulHit,
} from './SkillResolutionSystem';
export type {
  MitigatedHitInput,
  MitigatedHitResult,
  ResolveSuccessfulHitParams,
} from './SkillResolutionSystem';
export { canPlaySkill, getSkillBlockReason } from './skillPlayability';
export type { SkillPlayContext, SkillBlockReason } from './skillPlayability';

// Re-export from PlayerTurnSystem
export { useSkill, processUpkeep, applyApproachEffects } from './PlayerTurnSystem';

// Re-export from EnemyTurnSystem
export { processEnemyTurn } from './EnemyTurnSystem';

// Re-export the deckbuilder/posture economy (T-004)
export { buildDeck, drawHand, drawNewTurnHand, reshuffle } from './DeckSystem';
export {
  postureDamageMod,
  postureDefenseMod,
  stanceShiftFromSkill,
  describePosture,
} from './PostureSystem';
export type { PostureProfile } from './PostureSystem';

// ============================================================================
// COMBAT STATE INITIALIZATION
// ============================================================================

/**
 * Create initial combat state with approach modifiers.
 * Called at the start of each combat encounter.
 *
 * @param modifiers - Combat modifiers from the selected approach
 * @param terrain - Terrain definition for this combat (optional)
 * @returns Initial combat state
 */
export function createCombatState(
  modifiers?: CombatModifiers,
  terrain?: TerrainDefinition,
  /** T-063: location terrain effect mods */
  locationTerrainMods?: import('./LocationTerrainSystem').LocationTerrainMods | null,
  /** T-103: residual room combat modifier combat fields */
  roomCombatExtras?: {
    roomCombatEvasion?: number;
    fallDamageOnMiss?: number;
    roomConditionNames?: string[];
    enemyFirstHitMultiplier?: number;
  } | null,
): CombatState {
  return {
    isFirstTurn: true,
    firstHitMultiplier: modifiers?.firstHitMultiplier || 1.0,
    playerGoesFirst: modifiers?.playerGoesFirst || false,
    playerInitiativeBonus: modifiers?.playerInitiativeBonus || 0,
    xpMultiplier: modifiers?.xpMultiplier || 1.0,
    terrain: terrain || null,
    approachApplied: false,
    skipFirstSkillCost: false,
    artifactGutsUsed: false,
    locationTerrainMods: locationTerrainMods ?? null,
    roomCombatEvasion: roomCombatExtras?.roomCombatEvasion ?? 0,
    fallDamageOnMiss: roomCombatExtras?.fallDamageOnMiss ?? 0,
    roomConditionNames: roomCombatExtras?.roomConditionNames ?? [],
    enemyFirstHitMultiplier: roomCombatExtras?.enemyFirstHitMultiplier ?? 1,
    openingInitHolder: undefined,
    // Deckbuilder/AP economy (T-004)
    currentAp: 0,
    maxAp: 0,
    posture: Posture.BALANCED,
    hand: [],
    deck: [],
    discard: [],
    // F2 distance — seeded by startCombat via resolveInitialRange
    currentRange: CombatRange.MEDIUM,
    playerMoveUsedThisTurn: false,
    enemyMoveUsedThisTurn: false,
    enemyCurrentAp: 0,
    enemyMaxAp: 0,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Signal to pass the turn.
 * This is just a signal function - the actual turn passing is handled in the component.
 */
export const passTurn = (): void => {
  // This is just a signal, the actual turn passing is handled in the component
};
