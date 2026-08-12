/**
 * =============================================================================
 * ENEMY TURN SYSTEM - Enemy Turn Processing
 * =============================================================================
 *
 * This system handles all enemy turn processing including:
 * - DoT/Regen buff ticks
 * - Lethal damage and Guts checks
 * - Enemy action execution (attacks, confused, stunned)
 * - Resource recovery (cooldowns, chakra regen)
 * - Terrain hazard application
 *
 * ## ENEMY TURN ORDER
 *
 * 1. Phase 1: DoT/Regen on Enemy
 * 2. Phase 2: DoT/Regen on Player
 * 3. Phase 3: Death Checks (DoT)
 * 4. Phase 4: Enemy Action
 * 5. Phase 5: Resource Recovery
 * 6. Phase 6: Terrain Hazards
 *
 * =============================================================================
 */

import {
  Player,
  Enemy,
  Buff,
  CharacterStats,
  TerrainDefinition,
  EffectType,
  DamageType,
  CombatRange,
  RangeMoveDirection,
  RangeMoveTrigger,
} from '../types';
import {
  resistStatus,
  calculateDotDamage,
  calculateDamage,
} from './StatSystem';
import { planEnemyAction } from './EnemyAISystem';
import { combatLog } from '../utils/combatDebug';
import {
  generateId,
  tickBuffDurations,
  applyMitigation,
  applyTerrainHazard,
  getTerrainEvasionBonus,
} from './CombatCalculationSystem';
import {
  applyLocationHazardsToPlayer,
  applyRoomMovementCostToMaxAp,
  applyMovementPenaltyToMaxAp,
} from './LocationTerrainSystem';
import {
  shiftRange,
  collectRangeReactions,
  VOLUNTARY_MOVE_AP_COST,
} from './RangeSystem';
import { getApCost } from '../constants/combatCards';
import {
  shouldCounterAttack,
  checkGutsPassive,
  getDamageReductionPercent,
} from './EquipmentPassiveSystem';
import { postureDefenseMod } from './PostureSystem';
import {
  resolveSuccessfulHit,
  buildEnemyPreMitigationMults,
  buildPlayerDefensePostMults,
} from './SkillResolutionSystem';
import { chance } from '../utils/rng';
import type { CombatState, EnemyTurnResult } from './combat-types';
import { LaunchProperties } from '../../config/featureFlags';
import {
  checkLethalDamage,
  type GutsContext,
  type ArtifactGutsInfo,
  type LethalCheckResult,
} from './SurvivalSystem';

// Re-export for backward compat
export { checkLethalDamage } from './SurvivalSystem';
export type { GutsContext, ArtifactGutsInfo, LethalCheckResult } from './SurvivalSystem';

// ============================================================================
// INTERNAL TYPES
// ============================================================================

/**
 * Result of processing buff ticks (DoT/Regen/Chakra) on an entity.
 */
interface BuffTickResult {
  /** Updated HP after DoT damage and regen healing */
  newHp: number;
  /** Updated chakra after CHAKRA_REGEN / CHAKRA_DRAIN ticks */
  newChakra: number;
  /** Updated buff list with durations decremented */
  updatedBuffs: Buff[];
  /** Log messages from this phase */
  logs: string[];
}

/** Defensive combat-start buffs that must survive Phase 2 and expire after Phase 4 */
const DEFERRED_DURATION_TYPES: EffectType[] = [
  EffectType.INVULNERABILITY,
  EffectType.REFLECTION,
];

/**
 * Result of executing the enemy's action phase.
 */
interface EnemyActionResult {
  /** Updated player state */
  player: Player;
  /** Updated enemy state */
  enemy: Enemy;
  /** Log messages from this phase */
  logs: string[];
  /** Whether player was defeated */
  playerDefeated: boolean;
  /** Whether enemy was defeated (from confusion or reflection) */
  enemyDefeated: boolean;
  /** Updated guts context */
  gutsContext: GutsContext;
  /** F2: engagement band after optional enemy move */
  currentRange?: CombatRange;
  enemyCurrentAp?: number;
  enemyMoveUsedThisTurn?: boolean;
}

/**
 * Result of applying terrain hazards.
 */
interface TerrainHazardPhaseResult {
  /** Player HP after hazard */
  playerHp: number;
  /** Enemy HP after hazard */
  enemyHp: number;
  /** Log messages from hazards */
  logs: string[];
  /** Whether player was defeated */
  playerDefeated: boolean;
  /** Whether enemy was defeated */
  enemyDefeated: boolean;
  /** Updated guts context */
  gutsContext: GutsContext;
}

// ============================================================================
// BUFF TICK PROCESSING
// ============================================================================

/**
 * Process DoT, Regen, and Chakra buff effects on an entity.
 * Handles Bleed, Burn, Poison (damage), Regen (healing), CHAKRA_REGEN, CHAKRA_DRAIN.
 * For players, DoT damage is mitigated by shields.
 *
 * @param entityHp - Current HP of the entity
 * @param entityBuffs - Current buffs on the entity
 * @param entityStats - Calculated stats for DoT damage scaling
 * @param entityName - Name for log messages
 * @param isPlayer - Whether this is the player (enables shield mitigation)
 * @param maxHp - Max HP for capping regen healing (required for player)
 * @param tickDurations - When false, effects apply but durations are NOT decremented
 *   (used for the acting enemy so duration-1 STUN still blocks this action)
 * @param entityChakra - Current chakra (for CHAKRA_REGEN / CHAKRA_DRAIN)
 * @param maxChakra - Max chakra for capping regen
 * @param durationExceptTypes - Effect types to skip when decrementing durations
 *   (INVULNERABILITY/REFLECTION deferred until after Phase 4)
 */
export function processBuffTicks(
  entityHp: number,
  entityBuffs: Buff[],
  entityStats: CharacterStats,
  entityName: string,
  isPlayer: boolean,
  maxHp?: number,
  tickDurations: boolean = true,
  entityChakra: number = 0,
  maxChakra?: number,
  durationExceptTypes?: EffectType[]
): BuffTickResult {
  let newHp = entityHp;
  let newChakra = entityChakra;
  let updatedBuffs = [...entityBuffs];
  const logs: string[] = [];

  updatedBuffs.forEach(buff => {
    if (!buff?.effect) return; // Skip malformed buffs

    // Damage Over Time
    if ([EffectType.DOT, EffectType.BLEED, EffectType.BURN, EffectType.POISON].includes(buff.effect.type) && buff.effect.value) {
      const dotDmg = calculateDotDamage(buff.effect.value, buff.effect.damageType, buff.effect.damageProperty, entityStats.derived);

      if (isPlayer) {
        // Player DoT goes through shield mitigation
        const mitigation = applyMitigation(updatedBuffs, dotDmg, entityName);
        newHp -= mitigation.finalDamage;
        updatedBuffs = mitigation.updatedBuffs;

        const effectName = buff.effect.type.charAt(0) + buff.effect.type.slice(1).toLowerCase();
        if (mitigation.finalDamage > 0) {
          logs.push(`${effectName} deals ${mitigation.finalDamage} to ${entityName}${mitigation.messages.length > 0 ? ` [${mitigation.messages.join(', ')}]` : ''}`);
        } else if (dotDmg > 0) {
          logs.push(`${effectName} blocked by ${entityName}'s shield!`);
        }
      } else {
        // Enemy DoT is direct damage
        newHp -= dotDmg;
        const effectName = buff.effect.type.charAt(0) + buff.effect.type.slice(1).toLowerCase();
        logs.push(`${effectName} deals ${dotDmg} to ${entityName}`);
      }
    }

    // Regen (HP)
    if (buff.effect.type === EffectType.REGEN && buff.effect.value) {
      const healAmount = buff.effect.value;
      if (isPlayer && maxHp) {
        newHp = Math.min(maxHp, newHp + healAmount);
      } else {
        newHp += healAmount;
      }
      logs.push(`${entityName} regenerates ${healAmount} HP`);
    }

    // Chakra regen (self-buff tick)
    if (buff.effect.type === EffectType.CHAKRA_REGEN && buff.effect.value) {
      const regenAmount = buff.effect.value;
      if (maxChakra !== undefined) {
        newChakra = Math.min(maxChakra, newChakra + regenAmount);
      } else {
        newChakra += regenAmount;
      }
      logs.push(`${entityName} regenerates ${regenAmount} CP`);
    }

    // Chakra drain (debuff tick)
    if (buff.effect.type === EffectType.CHAKRA_DRAIN && buff.effect.value) {
      const drainAmount = Math.min(newChakra, buff.effect.value);
      if (drainAmount > 0) {
        newChakra -= drainAmount;
        logs.push(`${entityName} loses ${drainAmount} CP to Chakra Drain`);
      }
    }
  });

  // Tick down buff durations (optional — see stun duration-1 fix for acting enemy;
  // durationExceptTypes defers INVULNERABILITY/REFLECTION until after Phase 4)
  if (tickDurations) {
    updatedBuffs = tickBuffDurations(
      updatedBuffs,
      durationExceptTypes?.length ? { exceptTypes: durationExceptTypes } : undefined
    );
  }

  return { newHp, newChakra, updatedBuffs, logs };
}

// ============================================================================
// ENEMY ACTION EXECUTION
// ============================================================================

/**
 * Execute the enemy's action phase.
 * Handles stunned, confused, and normal attack states.
 *
 * @param player - Current player state
 * @param playerStats - Calculated player stats
 * @param enemy - Current enemy state
 * @param enemyStats - Calculated enemy stats
 * @param gutsContext - Current guts state
 * @param combatState - Optional combat state for terrain effects
 */
export function executeEnemyAction(
  player: Player,
  playerStats: CharacterStats,
  enemy: Enemy,
  enemyStats: CharacterStats,
  gutsContext: GutsContext,
  combatState?: CombatState
): EnemyActionResult {
  let updatedPlayer = { ...player };
  let updatedEnemy = { ...enemy };
  const logs: string[] = [];
  let playerDefeated = false;
  let enemyDefeated = false;
  const updatedGutsContext = { ...gutsContext };

  // Check for stun
  const isStunned = enemy.activeBuffs.some(b => b?.effect?.type === EffectType.STUN);
  if (isStunned) {
    logs.push(`${enemy.name} is STUNNED and cannot act!`);
    return {
      player: updatedPlayer,
      enemy: updatedEnemy,
      logs,
      playerDefeated: false,
      enemyDefeated: false,
      gutsContext: updatedGutsContext
    };
  }

  // Check for confusion (50% chance to hit self)
  const isConfused = enemy.activeBuffs.some(b => b?.effect?.type === EffectType.CONFUSION);
  if (isConfused && chance(0.5)) {
    const selfDamage = Math.floor(enemyStats.effectivePrimary.strength * 0.5);
    updatedEnemy.currentHp -= selfDamage;
    logs.push(`${enemy.name} is CONFUSED and hits itself for ${selfDamage}!`);

    if (updatedEnemy.currentHp <= 0) {
      return {
        player: updatedPlayer,
        enemy: updatedEnemy,
        logs,
        playerDefeated: false,
        enemyDefeated: true,
        gutsContext: updatedGutsContext
      };
    }

    return {
      player: updatedPlayer,
      enemy: updatedEnemy,
      logs,
      playerDefeated: false,
      enemyDefeated: false,
      gutsContext: updatedGutsContext
    };
  }

  // F2: refill enemy AP for this phase (same terrain pipeline as player)
  let range = combatState?.currentRange ?? CombatRange.MEDIUM;
  let enemyAp =
    combatState?.enemyMaxAp && combatState.enemyMaxAp > 0
      ? combatState.enemyMaxAp
      : enemyStats.derived.actionPointsPerTurn;
  // Apply terrain to enemy AP budget once if not already set on state
  if (combatState && (!combatState.enemyMaxAp || combatState.enemyMaxAp <= 0)) {
    let budget = enemyStats.derived.actionPointsPerTurn;
    budget = applyRoomMovementCostToMaxAp(budget, combatState.terrain);
    budget = applyMovementPenaltyToMaxAp(budget, combatState.locationTerrainMods);
    enemyAp = budget;
  }

  // F2 AI: in-band skill → move+skill → move preferred + Guard
  const plan = planEnemyAction({
    enemy,
    enemyStats,
    player,
    playerStats,
    currentRange: range,
    enemyAp,
  });

  let enemyMoveUsed = false;
  if (plan.moveDirection) {
    const { range: next, moved } = shiftRange(range, plan.moveDirection);
    if (moved) {
      range = next;
      enemyAp = Math.max(0, enemyAp - VOLUNTARY_MOVE_AP_COST);
      enemyMoveUsed = true;
      logs.push(
        `${enemy.name} ${plan.moveDirection === RangeMoveDirection.APPROACH ? 'closes in' : 'backs off'} → ${range}.`
      );
      void collectRangeReactions(RangeMoveTrigger.VOLUNTARY, true, false);
    }
  }

  if (plan.guard || !plan.skill) {
    logs.push(`${enemy.name} takes a Guard stance.`);
    return {
      player: updatedPlayer,
      enemy: updatedEnemy,
      logs,
      playerDefeated: false,
      enemyDefeated: false,
      gutsContext: updatedGutsContext,
      currentRange: range,
      enemyCurrentAp: enemyAp,
      enemyMoveUsedThisTurn: enemyMoveUsed,
    };
  }

  const selectedSkill = plan.skill;
  const skillAp = getApCost(selectedSkill);
  if (enemyAp < skillAp) {
    logs.push(`${enemy.name} lacks AP for ${selectedSkill.name} — Guards.`);
    return {
      player: updatedPlayer,
      enemy: updatedEnemy,
      logs,
      playerDefeated: false,
      enemyDefeated: false,
      gutsContext: updatedGutsContext,
      currentRange: range,
      enemyCurrentAp: enemyAp,
      enemyMoveUsedThisTurn: enemyMoveUsed,
    };
  }
  enemyAp -= skillAp;

  // Clear spent intent; next telegraph is set after the turn
  updatedEnemy.intendedSkillId = undefined;
  updatedEnemy.intendedSkillName = undefined;
  updatedEnemy.intentReason = undefined;

  // T-066/T-077/T-103: location evasion + TerrainDefinition + room combat FOREST cover
  const locEvasion = combatState?.locationTerrainMods?.evasionBonus ?? 0;
  const roomEvasion = getTerrainEvasionBonus(combatState?.terrain ?? null);
  const roomModEvasion = combatState?.roomCombatEvasion ?? 0;
  const totalEvasionBonus = locEvasion + roomEvasion + roomModEvasion;
  const defenderDerived =
    totalEvasionBonus !== 0
      ? {
          ...playerStats.derived,
          evasion: Math.min(0.75, playerStats.derived.evasion + totalEvasionBonus),
        }
      : playerStats.derived;

  // Calculate damage
  const damageResult = calculateDamage(
    enemyStats.effectivePrimary,
    enemyStats.derived,
    playerStats.effectivePrimary,
    defenderDerived,
    selectedSkill,
    enemy.element,
    player.element
  );

  if (damageResult.isMiss) {
    logs.push(`${enemy.name} uses ${selectedSkill.name} but MISSES!`);
  } else if (damageResult.isEvaded) {
    logs.push(`${enemy.name} uses ${selectedSkill.name} but you EVADE!`);
  } else {
    // T-105: room AMBUSH enemy first-strike mult on first combat turn
    let ambushMult = 1;
    if (
      combatState?.isFirstTurn
      && (combatState.enemyFirstHitMultiplier ?? 1) > 1
    ) {
      ambushMult = combatState.enemyFirstHitMultiplier;
      logs.push(`Ambush strike! (×${ambushMult.toFixed(2)})`);
    }

    // T-064: location enemy_attack_bonus (fraction) from terrainEffects
    const atkBonus = combatState?.locationTerrainMods?.enemyAttackBonus ?? 0;

    // Pre-mitigation: launch mult → ambush → attack bonus (shared factory)
    const preMitigationMultipliers = buildEnemyPreMitigationMults({
      enemyDamageMultiplier: LaunchProperties.ENEMY_DAMAGE_MULTIPLIER,
      ambushMult,
      enemyAttackBonus: atkBonus !== 0 ? atkBonus : undefined,
    });

    // Post-mitigation: artifact DR then posture defense (T-004)
    const drPercent = getDamageReductionPercent(player, playerStats.derived.maxHp);
    const postureMod = combatState ? postureDefenseMod(combatState.posture) : 1;
    const postMitigationMultipliers = buildPlayerDefensePostMults({
      damageReductionPercent: drPercent !== 0 ? drPercent : undefined,
      postureDefenseMod: postureMod,
    });

    // Shared hit pipeline: pre-mult → mitigation → post-mult
    const hit = resolveSuccessfulHit({
      rawDamage: damageResult.finalDamage,
      preMitigationMultipliers,
      defenderBuffs: updatedPlayer.activeBuffs,
      defenderLabel: 'You',
      postMitigationMultipliers,
    });
    updatedPlayer.activeBuffs = hit.updatedDefenderBuffs;
    const incomingDamage = hit.finalDamage;

    // Check lethal damage
    const artifactGuts = checkGutsPassive(player);
    const lethalCheck = checkLethalDamage(
      updatedPlayer.currentHp,
      incomingDamage,
      playerStats.derived.gutsChance,
      updatedGutsContext,
      artifactGuts,
      combatState?.artifactGutsUsed,
      playerStats.derived.maxHp
    );

    updatedPlayer.currentHp = lethalCheck.newHp;
    updatedGutsContext.triggered = lethalCheck.gutsTriggered;
    updatedGutsContext.artifactTriggered = lethalCheck.artifactGutsTriggered;

    // Build log message
    let logMsg = `${enemy.name} uses ${selectedSkill.name} for ${incomingDamage} damage`;
    if (hit.messages.length > 0) {
      logMsg += ` [${hit.messages.join(', ')}]`;
    }
    if (damageResult.isCrit) logMsg += " CRITICAL!";
    if (damageResult.elementMultiplier > 1) logMsg += " SUPER EFFECTIVE!";
    else if (damageResult.elementMultiplier < 1) logMsg += " Resisted.";
    logs.push(logMsg);

    // Handle reflection damage to enemy
    if (hit.reflectedDamage > 0) {
      updatedEnemy.currentHp -= hit.reflectedDamage;
      logs.push(`Reflection deals ${hit.reflectedDamage} to ${enemy.name}!`);

      if (updatedEnemy.currentHp <= 0) {
        return {
          player: updatedPlayer,
          enemy: updatedEnemy,
          logs,
          playerDefeated: false,
          enemyDefeated: true,
          gutsContext: updatedGutsContext
        };
      }
    }

    // Add guts log if triggered
    if (lethalCheck.log) {
      logs.push(lethalCheck.log);
    }

    // Check player death
    if (!lethalCheck.survived) {
      return {
        player: updatedPlayer,
        enemy: updatedEnemy,
        logs,
        playerDefeated: true,
        enemyDefeated: false,
        gutsContext: updatedGutsContext
      };
    }

    // Apply enemy skill effects (mirror player: HEAL/self-buffs on enemy, debuffs on player)
    if (selectedSkill.effects) {
      selectedSkill.effects.forEach(eff => {
        // Instant HEAL on self (not a lingering buff)
        if (eff.type === EffectType.HEAL) {
          const healAmount = Math.floor(eff.value || 0);
          if (healAmount > 0) {
            const cap = enemyStats.derived.maxHp;
            const healed = Math.min(healAmount, Math.max(0, cap - updatedEnemy.currentHp));
            if (healed > 0) {
              updatedEnemy.currentHp += healed;
              logs.push(`${enemy.name} HEAL +${healed} HP!`);
            }
          }
          const desc = (selectedSkill.description || '').toLowerCase();
          if (desc.includes('poison') || desc.includes('bleed')) {
            updatedEnemy.activeBuffs = updatedEnemy.activeBuffs.filter(
              b => b?.effect?.type !== EffectType.BLEED && b?.effect?.type !== EffectType.POISON
            );
          }
          return;
        }

        const isSelfBuff = [
          EffectType.BUFF,
          EffectType.SHIELD,
          EffectType.REFLECTION,
          EffectType.REGEN,
          EffectType.INVULNERABILITY,
          EffectType.CHAKRA_REGEN,
        ].includes(eff.type);

        if (isSelfBuff) {
          updatedEnemy.activeBuffs.push({
            id: generateId(),
            name: eff.type,
            duration: eff.duration,
            effect: eff,
            source: selectedSkill.name,
          });
        } else {
          // Debuff on player with resistance check
          const resisted = !resistStatus(eff.chance, playerStats.derived.statusResistance);
          if (!resisted) {
            updatedPlayer.activeBuffs.push({
              id: generateId(),
              name: eff.type,
              duration: eff.duration,
              effect: eff,
              source: selectedSkill.name,
            });
          }
        }
      });
    }

    // Counter: shouldCounterAttack already rolls RNG once — do not re-roll (was p^2).
    const counterCheck = shouldCounterAttack(player);
    if (counterCheck.shouldCounter) {
      const counterDamage = Math.floor(playerStats.effectivePrimary.strength * 0.3);
      updatedEnemy.currentHp -= counterDamage;
      logs.push(`${counterCheck.source}: Counter attack deals ${counterDamage} to ${enemy.name}!`);

      if (updatedEnemy.currentHp <= 0) {
        return {
          player: updatedPlayer,
          enemy: updatedEnemy,
          logs,
          playerDefeated: false,
          enemyDefeated: true,
          gutsContext: updatedGutsContext
        };
      }
    }
  }

  // Update enemy skill cooldowns
  updatedEnemy.skills = updatedEnemy.skills.map(s =>
    s.id === selectedSkill.id ? { ...s, currentCooldown: s.cooldown + 1 } : s
  );

  return {
    player: updatedPlayer,
    enemy: updatedEnemy,
    logs,
    playerDefeated,
    enemyDefeated,
    gutsContext: updatedGutsContext,
    currentRange: range,
    enemyCurrentAp: enemyAp,
    enemyMoveUsedThisTurn: enemyMoveUsed,
  };
}

// ============================================================================
// POST-TURN RESOURCE PROCESSING
// ============================================================================

/**
 * Process post-turn resource recovery.
 * - Reduces all skill cooldowns by 1
 * - Restores chakra based on chakraRegen stat
 *
 * @param skills - Player's skill list
 * @param currentChakra - Current chakra
 * @param maxChakra - Maximum chakra
 * @param chakraRegen - Chakra regeneration per turn
 */
export function processPostTurnResources(
  skills: Player['skills'],
  currentChakra: number,
  maxChakra: number,
  chakraRegen: number
): { skills: Player['skills']; newChakra: number } {
  // Reduce cooldowns
  const updatedSkills = skills.map(s => ({
    ...s,
    currentCooldown: Math.max(0, s.currentCooldown - 1)
  }));

  // Chakra regen
  const newChakra = Math.min(maxChakra, currentChakra + chakraRegen);

  return { skills: updatedSkills, newChakra };
}

// ============================================================================
// TERRAIN HAZARD PROCESSING
// ============================================================================

/**
 * Apply terrain hazards to both combatants.
 * Terrain has a 30% chance per turn to deal damage to both player and enemy.
 *
 * @param playerHp - Current player HP
 * @param enemyHp - Current enemy HP
 * @param player - Player for terrain effect calculation
 * @param enemy - Enemy for terrain effect calculation
 * @param terrain - Terrain definition
 * @param playerStats - Player stats for guts check
 * @param gutsContext - Current guts state for this turn
 * @param artifactGutsUsed - Whether artifact guts was already used this combat
 */
export function applyTerrainHazardsPhase(
  playerHp: number,
  enemyHp: number,
  player: Player,
  enemy: Enemy,
  terrain: TerrainDefinition,
  playerStats: CharacterStats,
  gutsContext: GutsContext,
  artifactGutsUsed?: boolean
): TerrainHazardPhaseResult {
  let newPlayerHp = playerHp;
  let newEnemyHp = enemyHp;
  const logs: string[] = [];
  let playerDefeated = false;
  let enemyDefeated = false;
  const updatedGutsContext = { ...gutsContext };

  // Apply player hazard
  const playerHazard = applyTerrainHazard({ ...player, currentHp: playerHp }, terrain, 'You');
  if (playerHazard.log) {
    newPlayerHp = playerHazard.newHp;
    logs.push(playerHazard.log);
  }

  // Apply enemy hazard
  const enemyHazard = applyTerrainHazard({ ...enemy, currentHp: enemyHp }, terrain, enemy.name);
  if (enemyHazard.log) {
    newEnemyHp = enemyHazard.newHp;
    logs.push(enemyHazard.log);
  }

  // Check for deaths from hazards
  if (newEnemyHp <= 0) {
    enemyDefeated = true;
  }

  // Player died from hazard — SurvivalSystem (stat guts + artifact guts)
  if (newPlayerHp <= 0 && !enemyDefeated) {
    const artifactGuts = checkGutsPassive(player);
    const lethalCheck = checkLethalDamage(
      newPlayerHp,
      0, // HP already reduced by hazard
      playerStats.derived.gutsChance,
      updatedGutsContext,
      artifactGuts,
      artifactGutsUsed,
      playerStats.derived.maxHp
    );

    if (!lethalCheck.survived) {
      playerDefeated = true;
    } else {
      newPlayerHp = lethalCheck.newHp;
      updatedGutsContext.triggered = lethalCheck.gutsTriggered;
      updatedGutsContext.artifactTriggered = lethalCheck.artifactGutsTriggered;
      if (lethalCheck.log) {
        logs.push(lethalCheck.log);
      }
    }
  }

  return {
    playerHp: newPlayerHp,
    enemyHp: newEnemyHp,
    logs,
    playerDefeated,
    enemyDefeated,
    gutsContext: updatedGutsContext
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Helper to construct the EnemyTurnResult return object.
 */
function buildTurnResult(
  player: Player,
  enemy: Enemy,
  logs: string[],
  playerDefeated: boolean,
  enemyDefeated: boolean,
  artifactGutsTriggered?: boolean,
  f2?: {
    currentRange?: CombatRange;
    enemyCurrentAp?: number;
    enemyMoveUsedThisTurn?: boolean;
  }
): EnemyTurnResult {
  return {
    newPlayerHp: player.currentHp,
    newPlayerChakra: player.currentChakra,
    newPlayerBuffs: player.activeBuffs,
    newEnemyHp: enemy.currentHp,
    newEnemyChakra: enemy.currentChakra,
    newEnemyBuffs: enemy.activeBuffs,
    logMessages: logs,
    playerDefeated,
    enemyDefeated,
    playerSkills: player.skills,
    enemySkills: enemy.skills,
    artifactGutsTriggered,
    intendedSkillId: enemy.intendedSkillId,
    intendedSkillName: enemy.intendedSkillName,
    intentReason: enemy.intentReason,
    currentRange: f2?.currentRange,
    enemyCurrentAp: f2?.enemyCurrentAp,
    enemyMoveUsedThisTurn: f2?.enemyMoveUsedThisTurn,
  };
}

/**
 * Tick deferred defensive buffs (INVULNERABILITY / REFLECTION) after the
 * enemy's action opportunity so duration-1 combat-start shields still block
 * the first enemy hit.
 */
function tickDeferredDefensiveBuffs(player: Player): Player {
  return {
    ...player,
    activeBuffs: tickBuffDurations(player.activeBuffs, {
      onlyTypes: DEFERRED_DURATION_TYPES,
    }),
  };
}

interface DoTDeathCheckResult {
  player: Player;
  playerDefeated: boolean;
  enemyDefeated: boolean;
  gutsContext: GutsContext;
  logs: string[];
}

/**
 * Checks if DoT effects caused lethal damage and processes guts for player survival.
 */
function checkDoTDeaths(
  player: Player,
  playerStats: CharacterStats,
  enemyHp: number,
  gutsContext: GutsContext,
  combatState?: CombatState,
  existingLogs: string[] = []
): DoTDeathCheckResult {
  let updatedPlayer = { ...player };
  const logs = [...existingLogs];
  let playerDefeated = false;
  let enemyDefeated = false;
  const updatedGutsContext = { ...gutsContext };

  // Enemy died from DoT
  if (enemyHp <= 0) {
    enemyDefeated = true;
    return {
      player: updatedPlayer,
      playerDefeated,
      enemyDefeated,
      gutsContext: updatedGutsContext,
      logs
    };
  }

  // Player died from DoT - check guts
  if (updatedPlayer.currentHp <= 0) {
    const artifactGuts = checkGutsPassive(updatedPlayer);
    const lethalCheck = checkLethalDamage(
      updatedPlayer.currentHp,
      0, // No additional damage, just checking current HP
      playerStats.derived.gutsChance,
      updatedGutsContext,
      artifactGuts,
      combatState?.artifactGutsUsed,
      playerStats.derived.maxHp
    );

    if (!lethalCheck.survived) {
      playerDefeated = true;
    } else {
      updatedPlayer.currentHp = lethalCheck.newHp;
      updatedGutsContext.triggered = lethalCheck.gutsTriggered;
      updatedGutsContext.artifactTriggered = lethalCheck.artifactGutsTriggered;
      if (lethalCheck.log) {
        logs.push(lethalCheck.log);
      }
    }
  }

  return {
    player: updatedPlayer,
    playerDefeated,
    enemyDefeated,
    gutsContext: updatedGutsContext,
    logs
  };
}

// ============================================================================
// ENEMY TURN ORCHESTRATOR
// ============================================================================

/**
 * Processes the enemy's turn in combat.
 * This is the main orchestrator function that coordinates all phases
 * of enemy turn processing in the correct order.
 *
 * ## Turn Processing Order (Critical for correct behavior!)
 *
 * ### Phase 1: DoT/Regen on Enemy (no duration tick yet)
 * - Process all DoT effects (Bleed, Burn, Poison) dealing damage
 * - Process Regen effects healing the enemy
 * - Durations are NOT decremented here so duration-1 STUN still blocks Phase 4
 *
 * ### Phase 2: DoT/Regen/Chakra on Player
 * - Process all DoT effects on player
 * - DoT damage goes through shield mitigation (can be absorbed)
 * - Process Regen / CHAKRA_REGEN / CHAKRA_DRAIN effects
 * - Decrement player buff durations EXCEPT INVULNERABILITY/REFLECTION
 *   (deferred so duration-1 combat-start shields still block Phase 4)
 *
 * ### Phase 3: Death Checks (DoT)
 * - Check if enemy died from DoT → early return with victory
 * - Check if player died from DoT → Guts check → defeat or survive at 1 HP
 * - Early exits still tick deferred INVULNERABILITY/REFLECTION
 *
 * ### Phase 4: Enemy Action
 * - If STUNNED: Skip action, log message
 * - If CONFUSED (50% chance): Enemy hits itself for 50% strength damage
 * - Otherwise: Select random skill and attack player
 *   - Calculate damage using StatSystem
 *   - Apply mitigation (player shields, reflection)
 *   - Guts check on lethal damage
 *   - Apply skill effects with status resistance
 *
 * ### Phase 4b: Tick deferred durations
 * - Enemy buff durations (after action opportunity so STUN duration 1 skips once)
 * - Player INVULNERABILITY/REFLECTION durations (after first enemy hit)
 *
 * ### Phase 5: Resource Recovery
 * - Reduce all player skill cooldowns by 1
 * - Reduce all enemy skill cooldowns by 1
 * - Restore chakra based on chakraRegen stat
 *
 * ### Phase 6: Terrain Hazards
 * - 30% chance per turn to trigger hazard
 * - Deals fixed damage to both player and enemy
 * - Final death checks with Guts for player
 *
 * @param player - Current player state
 * @param playerStats - Calculated player stats
 * @param enemy - Current enemy state
 * @param enemyStats - Calculated enemy stats
 * @param combatState - Optional combat state for terrain effects
 * @returns EnemyTurnResult with all state changes
 */
export function processEnemyTurn(
  player: Player,
  playerStats: CharacterStats,
  enemy: Enemy,
  enemyStats: CharacterStats,
  combatState?: CombatState
): EnemyTurnResult {
  combatLog('turn', `=== ENEMY TURN START: ${enemy.name} ===`, {
    enemyHp: enemy.currentHp,
    playerHp: player.currentHp
  });

  let updatedPlayer = { ...player };
  let updatedEnemy = { ...enemy };
  const logs: string[] = [];

  // Initialize guts tracking context
  let gutsContext: GutsContext = { triggered: false, artifactTriggered: false };

  // ============================================
  // Phase 1: Process DoT/Regen on Enemy (defer duration tick)
  // ============================================
  // Do not tick enemy durations before the action check: STUN duration 1 must
  // still be present so the enemy skips this turn (A-004).
  const enemyTickResult = processBuffTicks(
    updatedEnemy.currentHp,
    updatedEnemy.activeBuffs,
    enemyStats,
    enemy.name,
    false,
    undefined,
    false, // tickDurations deferred to Phase 4b
    updatedEnemy.currentChakra,
    enemyStats.derived.maxChakra
  );
  updatedEnemy.currentHp = enemyTickResult.newHp;
  updatedEnemy.currentChakra = enemyTickResult.newChakra;
  updatedEnemy.activeBuffs = enemyTickResult.updatedBuffs;
  logs.push(...enemyTickResult.logs);

  // ============================================
  // Phase 2: Process DoT/Regen on Player
  // ============================================
  // Do NOT expire INVULNERABILITY/REFLECTION here — they must survive to block
  // the Phase 4 enemy hit (duration-1 combat-start invuln/reflect).
  const playerTickResult = processBuffTicks(
    updatedPlayer.currentHp,
    updatedPlayer.activeBuffs,
    playerStats,
    'You',
    true,
    playerStats.derived.maxHp,
    true,
    updatedPlayer.currentChakra,
    playerStats.derived.maxChakra,
    DEFERRED_DURATION_TYPES
  );
  updatedPlayer.currentHp = playerTickResult.newHp;
  updatedPlayer.currentChakra = playerTickResult.newChakra;
  updatedPlayer.activeBuffs = playerTickResult.updatedBuffs;
  logs.push(...playerTickResult.logs);

  // ============================================
  // Phase 3: Check DoT Deaths
  // ============================================
  const dotDeath = checkDoTDeaths(
    updatedPlayer,
    playerStats,
    updatedEnemy.currentHp,
    gutsContext,
    combatState,
    logs
  );
  updatedPlayer = dotDeath.player;
  gutsContext = dotDeath.gutsContext;
  logs.length = 0;
  logs.push(...dotDeath.logs);

  if (dotDeath.enemyDefeated || dotDeath.playerDefeated) {
    // Still tick enemy buffs so DoTs/status expire correctly on early exit
    updatedEnemy.activeBuffs = tickBuffDurations(updatedEnemy.activeBuffs);
    // Deferred defensive buffs also expire on early exit after Phase 2
    updatedPlayer = tickDeferredDefensiveBuffs(updatedPlayer);
    return buildTurnResult(
      updatedPlayer,
      updatedEnemy,
      logs,
      dotDeath.playerDefeated,
      dotDeath.enemyDefeated,
      gutsContext.artifactTriggered
    );
  }

  // ============================================
  // Phase 4: Execute Enemy Action
  // ============================================
  const actionResult = executeEnemyAction(
    updatedPlayer,
    playerStats,
    updatedEnemy,
    enemyStats,
    gutsContext,
    combatState
  );

  updatedPlayer = actionResult.player;
  updatedEnemy = actionResult.enemy;
  logs.push(...actionResult.logs);
  gutsContext = actionResult.gutsContext;
  const f2State = {
    currentRange: actionResult.currentRange,
    enemyCurrentAp: actionResult.enemyCurrentAp,
    enemyMoveUsedThisTurn: actionResult.enemyMoveUsedThisTurn,
  };

  // ============================================
  // Phase 4b: Tick enemy buff durations (after action opportunity)
  // + deferred player INVULNERABILITY/REFLECTION (after first enemy hit)
  // ============================================
  updatedEnemy.activeBuffs = tickBuffDurations(updatedEnemy.activeBuffs);
  updatedPlayer = tickDeferredDefensiveBuffs(updatedPlayer);

  // Check for defeats from enemy action
  if (actionResult.playerDefeated || actionResult.enemyDefeated) {
    return buildTurnResult(
      updatedPlayer,
      updatedEnemy,
      logs,
      actionResult.playerDefeated,
      actionResult.enemyDefeated,
      gutsContext.artifactTriggered,
      f2State
    );
  }

  // ============================================
  // Phase 5: Resource Recovery
  // ============================================
  const resources = processPostTurnResources(
    updatedPlayer.skills,
    updatedPlayer.currentChakra,
    playerStats.derived.maxChakra,
    playerStats.derived.chakraRegen
  );
  updatedPlayer.skills = resources.skills;
  updatedPlayer.currentChakra = resources.newChakra;

  // Reduce enemy skill cooldowns by 1 (mirrors the player's recovery above).
  // Without this, a skill used by the enemy stays at cooldown+1 forever, the AI
  // eventually finds no available skills, and falls back to spamming skills[0].
  // The decremented skills are propagated to the caller via EnemyTurnResult.enemySkills.
  updatedEnemy.skills = updatedEnemy.skills.map(s => ({
    ...s,
    currentCooldown: Math.max(0, s.currentCooldown - 1),
  }));

  // A-003 / F2: telegraph next skill at post-move band (honorIntent false)
  {
    const nextPlan = planEnemyAction(
      {
        enemy: updatedEnemy,
        enemyStats,
        player: updatedPlayer,
        playerStats,
        currentRange: f2State.currentRange ?? combatState?.currentRange,
        enemyAp: enemyStats.derived.actionPointsPerTurn,
      },
      { honorIntent: false }
    );
    if (nextPlan.skill) {
      updatedEnemy = {
        ...updatedEnemy,
        intendedSkillId: nextPlan.skill.id,
        intendedSkillName: nextPlan.skill.name,
        intentReason: nextPlan.reason,
      };
      logs.push(`${updatedEnemy.name} readies ${nextPlan.skill.name} next...`);
    } else if (nextPlan.guard) {
      updatedEnemy = {
        ...updatedEnemy,
        intendedSkillId: undefined,
        intendedSkillName: 'Guard',
        intentReason: nextPlan.reason,
      };
      logs.push(`${updatedEnemy.name} readies Guard next...`);
    }
  }

  // ============================================
  // Phase 6: Terrain Hazards (room + location)
  // ============================================
  if (combatState?.terrain) {
    const hazardResult = applyTerrainHazardsPhase(
      updatedPlayer.currentHp,
      updatedEnemy.currentHp,
      updatedPlayer,
      updatedEnemy,
      combatState.terrain,
      playerStats,
      gutsContext,
      combatState.artifactGutsUsed
    );

    updatedPlayer.currentHp = hazardResult.playerHp;
    updatedEnemy.currentHp = hazardResult.enemyHp;
    logs.push(...hazardResult.logs);
    gutsContext = hazardResult.gutsContext;

    // Check for hazard defeats
    if (hazardResult.enemyDefeated || hazardResult.playerDefeated) {
      return buildTurnResult(
        updatedPlayer,
        updatedEnemy,
        logs,
        hazardResult.playerDefeated,
        hazardResult.enemyDefeated,
        gutsContext.artifactTriggered
      );
    }
  }

  // T-066: location poison/fall/chakra hazards after room terrain
  if (combatState?.locationTerrainMods) {
    const locHaz = applyLocationHazardsToPlayer(
      updatedPlayer,
      playerStats.derived.maxHp,
      playerStats.derived.maxChakra,
      combatState.locationTerrainMods,
    );
    if (locHaz.logs.length > 0) {
      updatedPlayer = locHaz.player;
      logs.push(...locHaz.logs);
    }
  }

  // ============================================
  // Final Result
  // ============================================
  const finalResult = buildTurnResult(
    updatedPlayer,
    updatedEnemy,
    logs,
    false,
    false,
    gutsContext.artifactTriggered,
    f2State
  );

  combatLog('turn', `=== ENEMY TURN END ===`, {
    playerHpAfter: finalResult.newPlayerHp,
    enemyHpAfter: finalResult.newEnemyHp,
    playerDefeated: false,
    enemyDefeated: false
  });

  return finalResult;
}

