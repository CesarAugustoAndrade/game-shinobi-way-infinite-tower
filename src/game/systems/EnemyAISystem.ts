/**
 * =============================================================================
 * ENEMY AI SYSTEM - Strategic Skill Selection for Enemies
 * =============================================================================
 *
 * This system provides intelligent skill selection for enemies based on:
 * - Enemy's current HP (self-preservation)
 * - Player's current HP (finishing low HP players)
 * - Skill effects (debuffs, healing, damage)
 * - Cooldowns (only available skills)
 *
 * ## AI Priority Order:
 * 1. Self-heal when HP is below 30%
 * 2. Finish off low HP players (below 20%)
 * 3. Apply debuffs to healthy players (above 50%)
 * 4. Use high-damage skills strategically
 * 5. Add small randomness to prevent predictability
 *
 * =============================================================================
 */

import {
  Enemy,
  Player,
  Skill,
  CharacterStats,
  EffectType,
  CombatRange,
  RangeMoveDirection,
} from '../types';
import {
  skillAllowedAt,
  planMoveForSkill,
  preferredRangeForEnemy,
  directionToward,
  VOLUNTARY_MOVE_AP_COST,
} from './RangeSystem';
import { getApCost } from '../constants/combatCards';

/**
 * Context provided to the AI for decision making
 */
export interface AIContext {
  enemy: Enemy;
  enemyStats: CharacterStats;
  player: Player;
  playerStats: CharacterStats;
  /** F2: current engagement band */
  currentRange?: CombatRange;
  /** F2: enemy AP available this phase */
  enemyAp?: number;
}

/** Planned enemy action for one skill/turn (F2 range + AP). */
export interface EnemyActionPlan {
  skill: Skill | undefined;
  reason: string;
  /** Move before skill, if any */
  moveDirection: RangeMoveDirection | null;
  /** Use Guard (noop) instead of a skill */
  guard: boolean;
  /** AP spent on move + skill */
  apCost: number;
}

/**
 * A skill with its AI score and reasoning
 */
interface ScoredSkill {
  skill: Skill;
  score: number;
  reason: string;
}

/**
 * Result of enemy skill selection including AI reason (A-003 telegraph).
 * `skill` is undefined only when the enemy has no skills at all.
 */
export interface EnemySkillDecision {
  skill: Skill | undefined;
  reason: string;
}

/**
 * Check if a skill has a healing effect
 */
function hasHealEffect(skill: Skill): boolean {
  if (!skill.effects) return false;
  return skill.effects.some(e =>
    e.type === EffectType.HEAL ||
    e.type === EffectType.REGEN
  );
}

/**
 * Check if a skill has a debuff effect (stat debuff, stun, confusion, DoTs, etc.)
 */
function hasDebuffEffect(skill: Skill): boolean {
  if (!skill.effects) return false;
  return skill.effects.some(e =>
    e.type === EffectType.DEBUFF ||
    e.type === EffectType.STUN ||
    e.type === EffectType.CONFUSION ||
    e.type === EffectType.SILENCE ||
    e.type === EffectType.BLEED ||
    e.type === EffectType.BURN ||
    e.type === EffectType.POISON ||
    e.type === EffectType.CURSE
  );
}

/**
 * Check if a skill has a self-buff effect
 */
function hasSelfBuffEffect(skill: Skill): boolean {
  if (!skill.effects) return false;
  return skill.effects.some(e =>
    e.type === EffectType.BUFF ||
    e.type === EffectType.SHIELD ||
    e.type === EffectType.INVULNERABILITY ||
    e.type === EffectType.REFLECTION
  );
}

/**
 * Estimate the damage a skill would deal
 */
function estimateDamage(skill: Skill, enemyStats: CharacterStats): number {
  const scalingStatKey = skill.scalingStat.toLowerCase() as keyof typeof enemyStats.effectivePrimary;
  const scalingStat = enemyStats.effectivePrimary[scalingStatKey] || 10;
  return Math.floor(scalingStat * ((skill.baseDamage ?? 0) + (skill.scalingPerPoint ?? 0) * 3));
}

/**
 * Selects the best skill for an enemy, returning skill + AI reason.
 * Honors a telegraphed intended skill when it is still off cooldown (A-003).
 *
 * @param context - The AI decision context with enemy, player, and stats
 * @param options.honorIntent - When true (default), use enemy.intendedSkillId if available
 * @returns Selected skill and reason string for logging / telegraph
 */
export function selectEnemySkillDecision(
  context: AIContext,
  options: { honorIntent?: boolean } = {}
): EnemySkillDecision {
  const plan = planEnemyAction(context, options);
  return { skill: plan.skill, reason: plan.reason };
}

/**
 * F2 AI policy:
 * 1) Best valid skill in current band that is affordable (AP)
 * 2) Skill reachable with one band move + still affordable
 * 3) Move toward preferred range + Guard
 */
export function planEnemyAction(
  context: AIContext,
  options: { honorIntent?: boolean } = {}
): EnemyActionPlan {
  const { enemy, enemyStats, player, playerStats } = context;
  const honorIntent = options.honorIntent !== false;
  const range = context.currentRange ?? CombatRange.MEDIUM;
  const enemyAp =
    context.enemyAp ??
    enemyStats.derived.actionPointsPerTurn ??
    3;

  if (!enemy.skills || enemy.skills.length === 0) {
    return {
      skill: undefined,
      reason: 'no skills available',
      moveDirection: null,
      guard: true,
      apCost: 0,
    };
  }

  const availableSkills = enemy.skills.filter(s => (s.currentCooldown || 0) <= 0);
  if (availableSkills.length === 0) {
    // All on CD → Guard (no spam skills[0] while OOR/unaffordable)
    const preferred = preferredRangeForEnemy(enemy);
    const dir = directionToward(range, preferred);
    const moveCost = dir ? VOLUNTARY_MOVE_AP_COST : 0;
    return {
      skill: undefined,
      reason: 'all skills on cooldown — Guard',
      moveDirection: dir && enemyAp >= moveCost ? dir : null,
      guard: true,
      apCost: dir && enemyAp >= moveCost ? moveCost : 0,
    };
  }

  const canAfford = (skill: Skill, needMove: boolean) => {
    const skillAp = getApCost(skill);
    const total = skillAp + (needMove ? VOLUNTARY_MOVE_AP_COST : 0);
    return enemyAp >= total;
  };

  // Honor telegraph when in-range and affordable
  if (honorIntent && enemy.intendedSkillId) {
    const intended = availableSkills.find(s => s.id === enemy.intendedSkillId);
    if (intended && skillAllowedAt(intended, range) && canAfford(intended, false)) {
      return {
        skill: intended,
        reason: enemy.intentReason || 'telegraphed',
        moveDirection: null,
        guard: false,
        apCost: getApCost(intended),
      };
    }
  }

  // Score skills (same priorities as before) among those that can be cast this phase
  const candidates: { skill: Skill; score: number; reason: string; needMove: boolean; direction: RangeMoveDirection | null }[] = [];

  for (const skill of availableSkills) {
    const plan = planMoveForSkill(range, skill);
    const needMove = plan.needMove;
    // If skill not reachable with 0 or 1 move, skip
    if (!skillAllowedAt(skill, plan.afterRange)) continue;
    if (!canAfford(skill, needMove)) continue;

    let score = 50;
    let reason = 'default';
    const enemyHpPercent = enemy.currentHp / enemyStats.derived.maxHp;
    const playerHpPercent = player.currentHp / playerStats.derived.maxHp;

    if (hasHealEffect(skill) && enemyHpPercent < 0.3) {
      score += 60;
      reason = 'self-heal at low HP';
    }
    if (hasSelfBuffEffect(skill) && enemyHpPercent > 0.4) {
      score += 25;
      reason = 'self-buff while healthy';
    }
    const estimatedDmg = estimateDamage(skill, enemyStats);
    if (playerHpPercent < 0.2 && estimatedDmg >= player.currentHp) {
      score += 50;
      reason = 'finish low HP player';
    }
    if (
      playerHpPercent < 0.5 &&
      playerHpPercent >= 0.2 &&
      (skill.baseDamage ?? 0) + (skill.scalingPerPoint ?? 0) * 3 > 1.5
    ) {
      score += 20;
      reason = 'high damage on wounded player';
    }
    if (hasDebuffEffect(skill) && playerHpPercent > 0.5) {
      score += 30;
      reason = 'debuff healthy player';
    }
    if (skill.cooldown >= 3) {
      score += 10;
      reason = reason === 'default' ? 'use powerful cooldown skill' : reason;
    }
    if (skill.element === enemy.element) score += 5;
    // Prefer no-move when equal
    if (!needMove) score += 8;
    score += Math.random() * 15;

    candidates.push({
      skill,
      score,
      reason,
      needMove,
      direction: plan.direction,
    });
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    const moveAp = best.needMove ? VOLUNTARY_MOVE_AP_COST : 0;
    return {
      skill: best.skill,
      reason: best.reason,
      moveDirection: best.needMove ? best.direction : null,
      guard: false,
      apCost: getApCost(best.skill) + moveAp,
    };
  }

  // No affordable in-range skill → move preferred + Guard
  const preferred = preferredRangeForEnemy(enemy);
  const dir = directionToward(range, preferred);
  const moveCost = dir ? VOLUNTARY_MOVE_AP_COST : 0;
  return {
    skill: undefined,
    reason: 'no affordable in-range skill — move + Guard',
    moveDirection: dir && enemyAp >= moveCost ? dir : null,
    guard: true,
    apCost: dir && enemyAp >= moveCost ? moveCost : 0,
  };
}

/**
 * Selects the best skill for an enemy to use based on the current combat state.
 *
 * @param context - The AI decision context with enemy, player, and stats
 * @returns The selected skill to use, or undefined when the enemy has no skills
 */
export function selectEnemySkill(context: AIContext): Skill | undefined {
  return selectEnemySkillDecision(context).skill;
}
