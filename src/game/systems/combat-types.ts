/**
 * =============================================================================
 * COMBAT TYPES - Shared Type Definitions for Combat System
 * =============================================================================
 *
 * This file contains all shared type definitions used across the combat system.
 * Extracted to prevent circular imports between:
 * - CombatWorkflowSystem.ts (orchestration and re-exports)
 * - PlayerTurnSystem.ts (player turn processing)
 * - EnemyTurnSystem.ts (enemy turn processing)
 *
 * =============================================================================
 */

import { Buff, Player, Posture, Skill, TerrainDefinition } from '../types';

// ============================================================================
// COMBAT STATE
// ============================================================================

/**
 * Combat state with approach modifiers and terrain effects.
 * Tracks approach bonuses and terrain effects for the current combat.
 */
export interface CombatState {
  isFirstTurn: boolean;
  firstHitMultiplier: number;
  playerGoesFirst: boolean;
  playerInitiativeBonus: number;
  xpMultiplier: number;
  terrain: TerrainDefinition | null;
  approachApplied: boolean;
  /** From FREE_FIRST_SKILL artifact passive - first skill costs no resources */
  skipFirstSkillCost: boolean;
  /** Tracks if artifact GUTS passive has been used this combat (one-time) */
  artifactGutsUsed: boolean;

  // ──────────────────────────────────────────────────────────────────────────
  // DECKBUILDER / AP ECONOMY (T-004)
  // Populated with safe defaults today; the combat flow does not consume these
  // yet. Wired up in a later phase (deck/hand draw, AP spend, posture biasing).
  // ──────────────────────────────────────────────────────────────────────────
  /** Action Points available this turn */
  currentAp: number;
  /** Action Points budget restored each player turn */
  maxAp: number;
  /** Active combat posture (biases the weighted card draw) */
  posture: Posture;
  /** Cards drawn for the player to play this turn */
  hand: Skill[];
  /** Remaining draw pile */
  deck: Skill[];
  /** Played/discarded cards awaiting reshuffle */
  discard: Skill[];
}

// ============================================================================
// RESULT TYPES
// ============================================================================

/**
 * Result of a player skill use, containing all state changes.
 */
export interface CombatResult {
  /** Total damage dealt to the enemy (after mitigation) */
  damageDealt: number;
  /** Enemy's HP after this action */
  newEnemyHp: number;
  /** Player's HP after this action (may decrease from HP costs or reflection) */
  newPlayerHp: number;
  /** Player's chakra after paying skill cost */
  newPlayerChakra: number;
  /** Enemy's updated buff list */
  newEnemyBuffs: Buff[];
  /** Player's updated buff list (may include new self-buffs) */
  newPlayerBuffs: Buff[];
  /** Combat log message describing what happened */
  logMessage: string;
  /** Log type for UI styling */
  logType: 'info' | 'combat' | 'gain' | 'danger';
  /** Updated skill list with cooldowns applied */
  skillsUpdate?: Skill[];
  /** True if enemy HP reached 0 */
  enemyDefeated: boolean;
  /** True if player HP reached 0 (can happen from reflection damage) */
  playerDefeated?: boolean;
  /** Action Points this card cost (0 if the action was rejected). T-004 */
  apCost: number;
  /** New posture if the card shifted the player's stance on play. T-004 */
  newPosture?: Posture;
}

/**
 * Result of processing the upkeep phase.
 * T-004: also restores the AP budget and deals a fresh, posture-weighted hand
 * for the new player turn.
 */
export interface UpkeepResult {
  player: Player;
  logs: string[];
  togglesDeactivated: string[];
  /** Action Points available for the new turn (= maxAp). */
  currentAp: number;
  /** Action Point budget for the new turn (player's actionPointsPerTurn). */
  maxAp: number;
  /** Freshly drawn hand for the new turn. */
  hand: Skill[];
  /** Remaining draw pile after the new-turn draw. */
  deck: Skill[];
  /** Discard pile after folding in the previous hand (and any reshuffle). */
  discard: Skill[];
}

/**
 * Result of processing the enemy's turn.
 */
export interface EnemyTurnResult {
  /** Player's HP after enemy turn (may be reduced by attack, DoT, or hazard) */
  newPlayerHp: number;
  /** Player's updated buff list (duration decremented, expired removed) */
  newPlayerBuffs: Buff[];
  /** Enemy's HP after enemy turn (may be reduced by DoT, confusion, or hazard) */
  newEnemyHp: number;
  /** Enemy's updated buff list (duration decremented, expired removed) */
  newEnemyBuffs: Buff[];
  /** All combat log messages from this turn */
  logMessages: string[];
  /** True if player was defeated this turn */
  playerDefeated: boolean;
  /** True if enemy was defeated this turn (from DoT, confusion, or hazard) */
  enemyDefeated: boolean;
  /** Updated player skills with cooldowns reduced */
  playerSkills: Skill[];
  /**
   * Updated enemy skills (cooldown set on use, then decremented this turn).
   * The caller MUST persist these onto the enemy so cooldowns advance between
   * turns instead of being stuck at cooldown+1 forever.
   */
  enemySkills: Skill[];
  /** True if artifact GUTS passive was triggered this turn (caller should update combatState) */
  artifactGutsTriggered?: boolean;
}
