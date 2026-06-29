/**
 * Combat Simulation Service
 *
 * Provides auto-combat functionality for when ENABLE_MANUAL_COMBAT is false.
 * Uses the same combat math as the BattleSimulator but works with actual game entities.
 */

import {
  Player,
  Enemy,
  Skill,
  Buff,
  DerivedStats,
  EffectType,
  ApproachType,
  CharacterStats,
  TerrainType,
  TerrainDefinition,
} from '../types';
import {
  calculateDamage,
  checkGuts,
  resistStatus,
  calculateDotDamage,
  getPlayerFullStats,
  getEnemyFullStats,
} from './StatSystem';
import {
  generateId,
  applyMitigation as applyMitigationCalc,
  tickBuffDurations,
  getTerrainElementAmplification,
  applyTerrainHazard,
} from './CombatCalculationSystem';
import {
  processPassivesOnCombatStart,
  processPassivesOnHit,
  processPassivesOnTurnStart,
  shouldCounterAttack,
  checkExecuteThreshold,
  checkGutsPassive,
} from './EquipmentPassiveSystem';
import { LaunchProperties } from '../../config/featureFlags';
import { TERRAIN_DEFINITIONS } from '../constants/terrain';

/**
 * Result of an auto-simulated combat
 */
export interface CombatSimulationResult {
  won: boolean;
  playerHpRemaining: number;
  playerChakraRemaining: number;
  turnsElapsed: number;
  damageDealt: number;
  damageReceived: number;
  critCount: number;
  gutsTriggered: number;
}

interface SimulationContext {
  player: Player;
  enemy: Enemy;
  playerStats: CharacterStats;
  enemyStats: CharacterStats;
  terrain: TerrainDefinition | null;
  turn: number;
  metrics: {
    damageDealt: number;
    damageReceived: number;
    crits: number;
    gutsTriggered: number;
  };
  artifactGutsUsed: boolean;
}

const MAX_TURNS = 100;

/**
 * Select best available skill for combat
 */
function selectSkill(
  skills: Skill[],
  currentChakra: number,
  currentHp: number
): Skill {
  // Filter available skills (off cooldown, can afford)
  const available = skills.filter(s =>
    s.currentCooldown === 0 &&
    currentChakra >= s.chakraCost &&
    currentHp > s.hpCost
  );

  if (available.length === 0) {
    // Find basic attack or first skill as fallback
    return skills.find(s => s.id === 'basic_atk') || skills[0];
  }

  // Prioritize by damage potential (damageMult * base scaling)
  const sorted = [...available].sort((a, b) => {
    const aValue = (a.damageMult || 0) * (a.chakraCost > 0 ? 1.2 : 1);
    const bValue = (b.damageMult || 0) * (b.chakraCost > 0 ? 1.2 : 1);
    return bValue - aValue;
  });

  return sorted[0];
}

/**
 * Apply mitigation (shields, invuln, curses, reflection)
 */
function applyMitigation(
  buffs: Buff[],
  damage: number
): { finalDamage: number; reflectedDamage: number; updatedBuffs: Buff[] } {
  const result = applyMitigationCalc(buffs, damage, 'target');
  return {
    finalDamage: result.finalDamage,
    reflectedDamage: result.reflectedDamage,
    updatedBuffs: result.updatedBuffs,
  };
}

/**
 * Process DoT and buff effects at turn start
 */
function processBuffEffects(
  buffs: Buff[],
  currentHp: number,
  maxHp: number,
  derived: DerivedStats
): { newHp: number; newBuffs: Buff[]; dotDamage: number } {
  let hp = currentHp;
  let dotDamage = 0;

  for (const buff of buffs) {
    if (!buff?.effect) continue;

    // DoT effects
    if ([EffectType.DOT, EffectType.BLEED, EffectType.BURN, EffectType.POISON].includes(buff.effect.type)) {
      if (buff.effect.value) {
        const dmg = calculateDotDamage(buff.effect.value, buff.effect.damageType, buff.effect.damageProperty, derived);
        hp -= dmg;
        dotDamage += dmg;
      }
    }

    // Regen
    if (buff.effect.type === EffectType.REGEN && buff.effect.value) {
      hp = Math.min(maxHp, hp + buff.effect.value);
    }
  }

  const newBuffs = tickBuffDurations(buffs);
  return { newHp: hp, newBuffs, dotDamage };
}

/**
 * Execute a skill attack
 */
function executeAttack(
  ctx: SimulationContext,
  skill: Skill,
  isPlayer: boolean
): void {
  const attacker = isPlayer ? ctx.player : ctx.enemy;
  const defender = isPlayer ? ctx.enemy : ctx.player;
  const attackerStats = isPlayer ? ctx.playerStats : ctx.enemyStats;
  const defenderStats = isPlayer ? ctx.enemyStats : ctx.playerStats;

  // Deduct costs
  if (isPlayer) {
    ctx.player.currentHp -= skill.hpCost;
    ctx.player.currentChakra -= skill.chakraCost;
  }

  // Calculate damage
  const result = calculateDamage(
    attacker.primaryStats,
    attackerStats.derived,
    defender.primaryStats,
    defenderStats.derived,
    skill,
    attacker.element,
    defender.element
  );

  // Skip if missed or evaded
  if (result.isMiss || result.isEvaded) {
    return;
  }

  // Track crits
  if (result.isCrit) {
    ctx.metrics.crits++;
  }

  let damage = result.finalDamage;

  // Apply terrain element amplification for player
  if (isPlayer && ctx.terrain) {
    const terrainAmp = getTerrainElementAmplification(ctx.terrain, ctx.player.element);
    if (terrainAmp > 1.0) {
      damage = Math.floor(damage * terrainAmp);
    }
  }

  // Apply LaunchProperties Multipliers
  if (isPlayer) {
    damage = Math.floor(damage * LaunchProperties.PLAYER_DAMAGE_MULTIPLIER);
  } else {
    damage = Math.floor(damage * LaunchProperties.ENEMY_DAMAGE_MULTIPLIER);
  }

  // Apply execute threshold for player
  if (isPlayer) {
    const enemyMaxHp = ctx.enemyStats.derived.maxHp;
    if (checkExecuteThreshold(ctx.player, ctx.enemy, enemyMaxHp)) {
      damage = ctx.enemy.currentHp;
    }
  }

  // Apply mitigation
  const mitigation = applyMitigation(defender.activeBuffs, damage);
  damage = mitigation.finalDamage;

  if (isPlayer) {
    ctx.enemy.activeBuffs = mitigation.updatedBuffs;
    ctx.enemy.currentHp -= damage;
    ctx.metrics.damageDealt += damage;

    // Process passives on hit
    const onHitResult = processPassivesOnHit(ctx.player, ctx.enemy, damage, result.isCrit);
    
    // Apply lifesteal
    if (onHitResult.healToPlayer > 0) {
      ctx.player.currentHp = Math.min(ctx.playerStats.derived.maxHp, ctx.player.currentHp + onHitResult.healToPlayer);
    }
    // Apply chakra restore
    if (onHitResult.chakraRestored > 0) {
      ctx.player.currentChakra = Math.min(ctx.playerStats.derived.maxChakra, ctx.player.currentChakra + onHitResult.chakraRestored);
    }
    // Apply passive debuffs to enemy
    const newPassiveDebuffs = onHitResult.enemy.activeBuffs.filter(
      b => !ctx.enemy.activeBuffs.some(existing => existing.id === b.id)
    );
    ctx.enemy.activeBuffs = [...ctx.enemy.activeBuffs, ...newPassiveDebuffs];

    // Handle reflection
    if (mitigation.reflectedDamage > 0) {
      ctx.player.currentHp -= mitigation.reflectedDamage;
      ctx.metrics.damageReceived += mitigation.reflectedDamage;
    }
  } else {
    ctx.player.activeBuffs = mitigation.updatedBuffs;

    // Check guts
    const hpBefore = ctx.player.currentHp;
    const hpAfterDamage = hpBefore - damage;
    if (hpAfterDamage <= 0) {
      const statGutsResult = checkGuts(hpBefore, damage, ctx.playerStats.derived.gutsChance);
      if (statGutsResult.survived) {
        ctx.player.currentHp = 1;
        ctx.metrics.gutsTriggered++;
      } else {
        const artifactGuts = checkGutsPassive(ctx.player);
        if (artifactGuts.hasGuts && !ctx.artifactGutsUsed) {
          const healAmount = Math.floor(ctx.playerStats.derived.maxHp * (artifactGuts.healPercent / 100));
          ctx.player.currentHp = Math.max(1, healAmount);
          ctx.artifactGutsUsed = true;
          ctx.metrics.gutsTriggered++;
        } else {
          ctx.player.currentHp = 0;
        }
      }
    } else {
      ctx.player.currentHp = hpAfterDamage;
    }
    ctx.metrics.damageReceived += damage;

    // Check counter attack if player survived
    if (ctx.player.currentHp > 0) {
      const counterCheck = shouldCounterAttack(ctx.player);
      if (counterCheck.shouldCounter && Math.random() < counterCheck.chance / 100) {
        const counterDamage = Math.floor(ctx.playerStats.effectivePrimary.strength * 0.3);
        ctx.enemy.currentHp -= counterDamage;
        ctx.metrics.damageDealt += counterDamage;
      }
    }

    // Handle reflection
    if (mitigation.reflectedDamage > 0) {
      ctx.enemy.currentHp -= mitigation.reflectedDamage;
      ctx.metrics.damageDealt += mitigation.reflectedDamage;
    }
  }

  // Apply skill effects
  if (skill.effects) {
    for (const effect of skill.effects) {
      const isSelfBuff = [
        EffectType.BUFF, EffectType.SHIELD, EffectType.REFLECTION,
        EffectType.REGEN, EffectType.INVULNERABILITY, EffectType.HEAL
      ].includes(effect.type);

      if (isSelfBuff) {
        const buff: Buff = {
          id: generateId(),
          name: effect.type,
          duration: effect.duration,
          effect,
          source: skill.name,
        };
        if (isPlayer) {
          ctx.player.activeBuffs.push(buff);
        } else {
          ctx.enemy.activeBuffs.push(buff);
        }
      } else {
        const targetResist = isPlayer
          ? ctx.enemyStats.derived.statusResistance
          : ctx.playerStats.derived.statusResistance;

        if (resistStatus(effect.chance, targetResist)) {
          const buff: Buff = {
            id: generateId(),
            name: effect.type,
            duration: effect.duration,
            effect,
            source: skill.name,
          };
          if (isPlayer) {
            ctx.enemy.activeBuffs.push(buff);
          } else {
            ctx.player.activeBuffs.push(buff);
          }
        }
      }
    }
  }

  // Update cooldowns
  if (isPlayer) {
    ctx.player.skills = ctx.player.skills.map(s =>
      s.id === skill.id ? { ...s, currentCooldown: s.cooldown + 1 } : s
    );
  } else {
    ctx.enemy.skills = ctx.enemy.skills.map(s =>
      s.id === skill.id ? { ...s, currentCooldown: s.cooldown + 1 } : s
    );
  }
}

/**
 * Execute player turn
 */
function executePlayerTurn(ctx: SimulationContext): void {
  // Check stun
  if (ctx.player.activeBuffs.some(b => b?.effect?.type === EffectType.STUN)) {
    return;
  }

  const skill = selectSkill(
    ctx.player.skills,
    ctx.player.currentChakra,
    ctx.player.currentHp
  );

  if (skill) {
    executeAttack(ctx, skill, true);
  }
}

/**
 * Execute enemy turn
 */
function executeEnemyTurn(ctx: SimulationContext): void {
  // Check stun
  if (ctx.enemy.activeBuffs.some(b => b?.effect?.type === EffectType.STUN)) {
    return;
  }

  // Check confusion
  if (ctx.enemy.activeBuffs.some(b => b?.effect?.type === EffectType.CONFUSION)) {
    if (Math.random() < 0.5) {
      const selfDmg = Math.floor(ctx.enemy.primaryStats.strength * 0.5);
      ctx.enemy.currentHp -= selfDmg;
      return;
    }
  }

  const skill = selectSkill(
    ctx.enemy.skills,
    ctx.enemy.currentChakra,
    ctx.enemy.currentHp
  );

  if (skill) {
    executeAttack(ctx, skill, false);
  }
}

/**
 * Simulate a combat between the current player and an enemy.
 * Uses the same combat calculations as the real combat system.
 */
export function simulateGameCombat(
  player: Player,
  playerStats: CharacterStats,
  enemy: Enemy,
  approach?: ApproachType,
  terrain?: TerrainType
): CombatSimulationResult {
  // Get full stats
  const playerFullStats = getPlayerFullStats(player);
  const enemyFullStats = getEnemyFullStats(enemy);

  // Clone player and enemy for mutable simulation state
  const clonedPlayer = {
    ...player,
    skills: player.skills.map(s => ({ ...s, currentCooldown: 0 })),
    activeBuffs: [...player.activeBuffs]
  };

  // Process passives on combat start
  const clonedEnemy = {
    ...enemy,
    skills: enemy.skills.map(s => ({ ...s, currentCooldown: 0 })),
    activeBuffs: [...enemy.activeBuffs]
  };

  // Process passives on combat start
  const combatStartResult = processPassivesOnCombatStart(clonedPlayer, clonedEnemy);
  clonedPlayer.activeBuffs = [...clonedPlayer.activeBuffs, ...combatStartResult.player.activeBuffs];
  clonedEnemy.activeBuffs = [...clonedEnemy.activeBuffs, ...combatStartResult.enemy.activeBuffs];

  const terrainDef = terrain ? TERRAIN_DEFINITIONS[terrain] : null;

  // Initialize context
  const ctx: SimulationContext = {
    player: clonedPlayer,
    enemy: clonedEnemy,
    playerStats: playerFullStats,
    enemyStats: enemyFullStats,
    terrain: terrainDef,
    turn: 0,
    metrics: {
      damageDealt: 0,
      damageReceived: 0,
      crits: 0,
      gutsTriggered: 0,
    },
    artifactGutsUsed: false,
  };

  // Determine turn order (player usually goes first in auto-combat)
  const playerInit = playerFullStats.derived.initiative + (terrainDef ? terrainDef.effects.initiativeModifier : 0);
  const enemyInit = enemyFullStats.derived.initiative;
  let playerGoesFirst = playerInit >= enemyInit;

  // Apply approach bonuses if specified
  if (approach === ApproachType.STEALTH_AMBUSH) {
    playerGoesFirst = true;
    // Deal 25% of enemy HP as bonus damage on first hit
    const bonusDamage = Math.floor(ctx.enemyStats.derived.maxHp * 0.25);
    ctx.enemy.currentHp -= bonusDamage;
    ctx.metrics.damageDealt += bonusDamage;
  } else if (approach === ApproachType.ENVIRONMENTAL_TRAP) {
    // Enemy takes 20% HP damage from trap
    const trapDamage = Math.floor(ctx.enemyStats.derived.maxHp * 0.2);
    ctx.enemy.currentHp -= trapDamage;
    ctx.metrics.damageDealt += trapDamage;
  } else if (approach === ApproachType.GENJUTSU_SETUP) {
    // Enemy starts confused
    ctx.enemy.activeBuffs.push({
      id: generateId(),
      name: 'Confusion',
      duration: 2,
      effect: { type: EffectType.CONFUSION, duration: 2, chance: 1 },
      source: 'Genjutsu Setup',
    });
  }

  // Battle loop
  while (ctx.turn < MAX_TURNS) {
    ctx.turn++;

    // Process passives on turn start (player only)
    const turnStartResult = processPassivesOnTurnStart(ctx.player, ctx.enemy);
    if (turnStartResult.healToPlayer > 0) {
      ctx.player.currentHp = Math.min(ctx.playerStats.derived.maxHp, ctx.player.currentHp + turnStartResult.healToPlayer);
    }
    if (turnStartResult.chakraRestored > 0) {
      ctx.player.currentChakra = Math.min(ctx.playerStats.derived.maxChakra, ctx.player.currentChakra + turnStartResult.chakraRestored);
    }

    // Process DoTs at turn start
    const enemyBuffResult = processBuffEffects(
      ctx.enemy.activeBuffs,
      ctx.enemy.currentHp,
      ctx.enemyStats.derived.maxHp,
      ctx.enemyStats.derived
    );
    ctx.enemy.currentHp = enemyBuffResult.newHp;
    ctx.enemy.activeBuffs = enemyBuffResult.newBuffs;

    if (ctx.enemy.currentHp <= 0) break;

    const playerBuffResult = processBuffEffects(
      ctx.player.activeBuffs,
      ctx.player.currentHp,
      ctx.playerStats.derived.maxHp,
      ctx.playerStats.derived
    );
    ctx.player.currentHp = playerBuffResult.newHp;
    ctx.player.activeBuffs = playerBuffResult.newBuffs;
    ctx.metrics.damageReceived += playerBuffResult.dotDamage;

    // Check player guts from DoT
    if (ctx.player.currentHp <= 0) {
      const statGutsResult = checkGuts(ctx.player.currentHp, 0, ctx.playerStats.derived.gutsChance);
      if (statGutsResult.survived) {
        ctx.player.currentHp = 1;
        ctx.metrics.gutsTriggered++;
      } else {
        const artifactGuts = checkGutsPassive(ctx.player);
        if (artifactGuts.hasGuts && !ctx.artifactGutsUsed) {
          const healAmount = Math.floor(ctx.playerStats.derived.maxHp * (artifactGuts.healPercent / 100));
          ctx.player.currentHp = Math.max(1, healAmount);
          ctx.artifactGutsUsed = true;
          ctx.metrics.gutsTriggered++;
        } else {
          break;
        }
      }
    }

    // Execute turns
    if (playerGoesFirst) {
      executePlayerTurn(ctx);
      if (ctx.enemy.currentHp <= 0) break;
      executeEnemyTurn(ctx);
      if (ctx.player.currentHp <= 0) break;
    } else {
      executeEnemyTurn(ctx);
      if (ctx.player.currentHp <= 0) break;
      executePlayerTurn(ctx);
      if (ctx.enemy.currentHp <= 0) break;
    }

    // Regenerate chakra
    ctx.player.currentChakra = Math.min(
      ctx.playerStats.derived.maxChakra,
      ctx.player.currentChakra + ctx.playerStats.derived.chakraRegen
    );

    // Reduce cooldowns
    ctx.player.skills = ctx.player.skills.map(s => ({
      ...s,
      currentCooldown: Math.max(0, s.currentCooldown - 1),
    }));
    ctx.enemy.skills = ctx.enemy.skills.map(s => ({
      ...s,
      currentCooldown: Math.max(0, s.currentCooldown - 1),
    }));

    // Apply terrain hazard at end of round
    if (ctx.terrain?.effects.hazard) {
      const hazard = ctx.terrain.effects.hazard;
      
      // Player hazard
      if (hazard.affectsPlayer) {
        const hazardRes = applyTerrainHazard(ctx.player, ctx.terrain, 'player');
        if (hazardRes.log) {
          ctx.metrics.damageReceived += Math.max(0, ctx.player.currentHp - hazardRes.newHp);
          ctx.player.currentHp = hazardRes.newHp;
          if (ctx.player.currentHp <= 0) break;
        }
      }

      // Enemy hazard
      if (hazard.affectsEnemy && ctx.enemy.currentHp > 0) {
        const hazardRes = applyTerrainHazard(ctx.enemy, ctx.terrain, ctx.enemy.name);
        if (hazardRes.log) {
          ctx.enemy.currentHp = hazardRes.newHp;
          if (ctx.enemy.currentHp <= 0) break;
        }
      }
    }
  }

  const won = ctx.enemy.currentHp <= 0;

  return {
    won,
    playerHpRemaining: Math.max(0, ctx.player.currentHp),
    playerChakraRemaining: Math.max(0, ctx.player.currentChakra),
    turnsElapsed: ctx.turn,
    damageDealt: ctx.metrics.damageDealt,
    damageReceived: ctx.metrics.damageReceived,
    critCount: ctx.metrics.crits,
    gutsTriggered: ctx.metrics.gutsTriggered,
  };
}
