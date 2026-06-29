/**
 * Battle Simulator - Core automated battle engine
 * Runs battles without React dependencies for pure simulation
 */

import {
  Player,
  Enemy,
  Skill,
  Buff,
  PrimaryAttributes,
  DerivedStats,
  ElementType,
  EffectType,
  Clan,
  EquipmentSlot,
  ApproachType,
  TreasureQuality,
  DEFAULT_MERCHANT_SLOTS,
  CharacterStats,
  TerrainType,
  TerrainDefinition,
} from '../game/types';
import {
  calculateDerivedStats,
  calculateDamage,
  checkGuts,
  resistStatus,
  calculateDotDamage,
  getPlayerFullStats,
  getEnemyFullStats
} from '../game/systems/StatSystem';
import { SKILLS } from '../game/constants';
import {
  BattleResult,
  SimulationConfig,
  PlayerBuildConfig,
  SimCombatant,
  TurnLog,
  DEFAULT_CONFIG
} from './types';
import { EnemyArchetype, generateSimEnemy } from './EnemyArchetypes';
import { createBuildFromConfig } from './BuildGenerator';
import { selectBestSkill } from './SkillSelectionAI';
import {
  generateId,
  applyMitigation as applyMitigationCalc,
  tickBuffDurations,
  getTerrainElementAmplification,
  applyTerrainHazard,
} from '../game/systems/CombatCalculationSystem';
import {
  processPassivesOnCombatStart,
  processPassivesOnHit,
  processPassivesOnTurnStart,
  shouldCounterAttack,
  checkExecuteThreshold,
  checkGutsPassive,
} from '../game/systems/EquipmentPassiveSystem';
import { LaunchProperties } from '../config/featureFlags';
import { BIOME_TERRAINS, TERRAIN_DEFINITIONS } from '../game/constants/terrain';
import { getStoryArcForFloor } from '../game/entities/Enemy';

/**
 * Calculate approach success based on player stats and approach type
 * Returns true if approach succeeds, false otherwise
 */
function calculateApproachSuccess(
  approach: ApproachType,
  playerStats: { primary: PrimaryAttributes; derived: DerivedStats }
): boolean {
  if (approach === ApproachType.FRONTAL_ASSAULT) {
    return true; // Always succeeds (no stealth needed)
  }

  let baseChance = 50;
  let scalingStat = 0;

  switch (approach) {
    case ApproachType.STEALTH_AMBUSH:
      // Speed-based stealth
      scalingStat = playerStats.primary.speed;
      baseChance = 40 + scalingStat * 1.5; // 40% base + 1.5% per speed
      break;
    case ApproachType.GENJUTSU_SETUP:
      // Intelligence-based mental setup
      scalingStat = playerStats.primary.intelligence;
      baseChance = 35 + scalingStat * 2; // 35% base + 2% per intelligence
      break;
    case ApproachType.ENVIRONMENTAL_TRAP:
      // Dexterity-based trap setup
      scalingStat = playerStats.primary.dexterity;
      baseChance = 45 + scalingStat * 1.2; // 45% base + 1.2% per dexterity
      break;
    case ApproachType.SHADOW_BYPASS:
      // Very hard - requires high calmness
      scalingStat = playerStats.primary.calmness;
      baseChance = 20 + scalingStat * 1.5; // 20% base + 1.5% per calmness
      break;
  }

  // Cap at 95%
  const successChance = Math.min(95, baseChance);
  return Math.random() * 100 < successChance;
}

// ============================================================================
// COMBAT HELPERS
// ============================================================================

// generateId imported from CombatCalculationSystem

/**
 * Create a simulation-ready player from build config
 */
export function createSimPlayer(config: PlayerBuildConfig): Player {
  const { stats, skills, element } = createBuildFromConfig(config);
  const derived = calculateDerivedStats(stats, {});

  return {
    clan: config.clan,
    level: config.level,
    exp: 0,
    maxExp: 100,
    primaryStats: stats,
    currentHp: derived.maxHp,
    currentChakra: derived.maxChakra,
    element,
    ryo: 0,
    equipment: {
      [EquipmentSlot.SLOT_1]: null,
      [EquipmentSlot.SLOT_2]: null,
      [EquipmentSlot.SLOT_3]: null,
      [EquipmentSlot.SLOT_4]: null
    },
    skills: skills.map(s => ({ ...s, currentCooldown: 0 })),
    activeBuffs: [],
    bag: Array(12).fill(null), // 12 fixed slots
    treasureQuality: TreasureQuality.BROKEN,
    merchantSlots: DEFAULT_MERCHANT_SLOTS,
    locationsCleared: 0,
  };
}

/**
 * Convert Player/Enemy to SimCombatant
 */
function toSimCombatant(entity: Player | Enemy, derived: DerivedStats): SimCombatant {
  return {
    name: 'name' in entity ? entity.name : (entity as Player).clan,
    primaryStats: entity.primaryStats,
    currentHp: entity.currentHp,
    maxHp: derived.maxHp,
    currentChakra: entity.currentChakra,
    maxChakra: derived.maxChakra,
    element: entity.element,
    skills: entity.skills,
    activeBuffs: entity.activeBuffs
  };
}

/**
 * Apply mitigation (shields, invuln, curses, reflection)
 * Wrapper around shared CombatCalculationSystem.applyMitigation
 */
function applyMitigation(
  buffs: Buff[],
  damage: number,
  targetName: string = 'target'
): { finalDamage: number; reflectedDamage: number; updatedBuffs: Buff[] } {
  const result = applyMitigationCalc(buffs, damage, targetName);
  // Drop messages for simulation (not needed for metrics)
  return {
    finalDamage: result.finalDamage,
    reflectedDamage: result.reflectedDamage,
    updatedBuffs: result.updatedBuffs
  };
}

/**
 * Process buff durations and effects
 */
function processBuffs(
  buffs: Buff[],
  currentHp: number,
  maxHp: number,
  derived: DerivedStats
): { newHp: number; newBuffs: Buff[]; dotDamage: number } {
  let hp = currentHp;
  let dotDamage = 0;

  // Process effects
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

  // Decrement durations using shared function
  const newBuffs = tickBuffDurations(buffs);

  return { newHp: hp, newBuffs, dotDamage };
}

// ============================================================================
// BATTLE SIMULATION
// ============================================================================

export interface BattleContext {
  player: Player;
  enemy: Enemy;
  playerDerived: DerivedStats;
  enemyDerived: DerivedStats;
  playerStats: CharacterStats;
  enemyStats: CharacterStats;
  terrain: TerrainDefinition | null;
  turn: number;
  isFirstTurn: boolean;
  firstHitMultiplier: number;
  approachSucceeded: boolean;  // Track actual approach success
  logs: TurnLog[];
  metrics: {
    totalDamageDealt: number;
    totalDamageReceived: number;
    totalAttacks: number;
    crits: number;
    misses: number;
    evasions: number;
    gutsTriggered: number;
    chakraUsed: number;
    skillsUsed: Record<string, number>;
  };
  artifactGutsUsed: boolean;
}

/**
 * Execute a single player turn
 */
function executePlayerTurn(ctx: BattleContext): boolean {
  const { player, enemy, playerDerived, enemyDerived } = ctx;

  // Check stun
  if (player.activeBuffs.some(b => b?.effect?.type === EffectType.STUN)) {
    ctx.logs.push({
      turn: ctx.turn,
      actor: 'player',
      action: 'Stunned!',
      damage: 0,
      isCrit: false,
      isMiss: false,
      isEvaded: false,
      playerHp: player.currentHp,
      enemyHp: enemy.currentHp
    });
    return false;
  }

  // Select skill
  const simPlayer = toSimCombatant(player, playerDerived);
  const simEnemy = toSimCombatant(enemy, enemyDerived);

  const skill = selectBestSkill(
    player.skills,
    simPlayer,
    playerDerived,
    simEnemy,
    enemyDerived,
    ctx.isFirstTurn,
    ctx.firstHitMultiplier
  );

  // Check resources
  if (player.currentChakra < skill.chakraCost || player.currentHp <= skill.hpCost) {
    // Find a skill we can afford
    const affordableSkill = player.skills.find(s =>
      s.currentCooldown === 0 &&
      player.currentChakra >= s.chakraCost &&
      player.currentHp > s.hpCost
    );

    // Fallback to basic attack or first available skill
    const fallbackSkill = affordableSkill ||
      player.skills.find(s => s.id === 'basic_atk') ||
      player.skills[0];

    if (!fallbackSkill) {
      // No skills available at all - skip turn
      ctx.logs.push({
        turn: ctx.turn,
        actor: 'player',
        action: 'No skills available',
        damage: 0,
        isCrit: false,
        isMiss: false,
        isEvaded: false,
        playerHp: player.currentHp,
        enemyHp: ctx.enemy.currentHp
      });
      return false;
    }

    return executeSkill(ctx, fallbackSkill, true);
  }

  return executeSkill(ctx, skill, true);
}

/**
 * Execute a skill
 */
function executeSkill(ctx: BattleContext, skill: Skill, isPlayer: boolean): boolean {
  const attacker = isPlayer ? ctx.player : ctx.enemy;
  const defender = isPlayer ? ctx.enemy : ctx.player;
  const attackerStats = isPlayer ? ctx.playerStats : ctx.enemyStats;
  const defenderStats = isPlayer ? ctx.enemyStats : ctx.playerStats;

  // Deduct costs
  if (isPlayer) {
    ctx.player.currentHp -= skill.hpCost;
    ctx.player.currentChakra -= skill.chakraCost;
    ctx.metrics.chakraUsed += skill.chakraCost;
  }

  // Track skill usage
  ctx.metrics.skillsUsed[skill.id] = (ctx.metrics.skillsUsed[skill.id] || 0) + 1;
  ctx.metrics.totalAttacks++;

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

  let damage = result.finalDamage;

  // Track miss/evade
  if (result.isMiss) {
    ctx.metrics.misses++;
    ctx.logs.push({
      turn: ctx.turn,
      actor: isPlayer ? 'player' : 'enemy',
      action: `${skill.name} MISSED`,
      damage: 0,
      isCrit: false,
      isMiss: true,
      isEvaded: false,
      playerHp: ctx.player.currentHp,
      enemyHp: ctx.enemy.currentHp
    });
    return false;
  }

  if (result.isEvaded) {
    ctx.metrics.evasions++;
    ctx.logs.push({
      turn: ctx.turn,
      actor: isPlayer ? 'player' : 'enemy',
      action: `${skill.name} EVADED`,
      damage: 0,
      isCrit: false,
      isMiss: false,
      isEvaded: true,
      playerHp: ctx.player.currentHp,
      enemyHp: ctx.enemy.currentHp
    });
    return false;
  }

  // Track crits
  if (result.isCrit) {
    ctx.metrics.crits++;
  }

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

  // Apply first hit multiplier
  if (ctx.isFirstTurn && isPlayer && ctx.firstHitMultiplier > 1.0) {
    damage = Math.floor(damage * ctx.firstHitMultiplier);
  }

  // Apply execute threshold for player
  if (isPlayer) {
    const enemyMaxHp = ctx.enemyStats.derived.maxHp;
    if (checkExecuteThreshold(ctx.player, ctx.enemy, enemyMaxHp)) {
      damage = ctx.enemy.currentHp;
    }
  }

  // Apply mitigation
  const defenderName = 'name' in defender ? defender.name : defender.clan;
  const mitigation = applyMitigation(defender.activeBuffs, damage, defenderName);
  damage = mitigation.finalDamage;

  if (isPlayer) {
    ctx.enemy.activeBuffs = mitigation.updatedBuffs;
    ctx.enemy.currentHp -= damage;
    ctx.metrics.totalDamageDealt += damage;

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
      ctx.metrics.totalDamageReceived += mitigation.reflectedDamage;
    }
  } else {
    ctx.player.activeBuffs = mitigation.updatedBuffs;

    // Check guts
    const hpBeforeDamage = ctx.player.currentHp;
    const hpAfterDamage = hpBeforeDamage - damage;
    if (hpAfterDamage <= 0) {
      const statGutsResult = checkGuts(hpBeforeDamage, damage, ctx.playerStats.derived.gutsChance);
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
    ctx.metrics.totalDamageReceived += damage;

    // Check counter attack if player survived
    if (ctx.player.currentHp > 0) {
      const counterCheck = shouldCounterAttack(ctx.player);
      if (counterCheck.shouldCounter && Math.random() < counterCheck.chance / 100) {
        const counterDamage = Math.floor(ctx.playerStats.effectivePrimary.strength * 0.3);
        ctx.enemy.currentHp -= counterDamage;
        ctx.metrics.totalDamageDealt += counterDamage;
      }
    }

    // Handle reflection
    if (mitigation.reflectedDamage > 0) {
      ctx.enemy.currentHp -= mitigation.reflectedDamage;
      ctx.metrics.totalDamageDealt += mitigation.reflectedDamage;
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
        // Apply to attacker
        const buff: Buff = {
          id: generateId(),
          name: effect.type,
          duration: effect.duration,
          effect,
          source: skill.name
        };
        if (isPlayer) {
          ctx.player.activeBuffs.push(buff);
        } else {
          ctx.enemy.activeBuffs.push(buff);
        }
      } else {
        // Apply to defender with resistance check
        const targetResist = isPlayer
          ? ctx.enemyStats.derived.statusResistance
          : ctx.playerStats.derived.statusResistance;

        if (resistStatus(effect.chance, targetResist)) {
          const buff: Buff = {
            id: generateId(),
            name: effect.type,
            duration: effect.duration,
            effect,
            source: skill.name
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

  ctx.logs.push({
    turn: ctx.turn,
    actor: isPlayer ? 'player' : 'enemy',
    action: skill.name,
    damage,
    isCrit: result.isCrit,
    isMiss: false,
    isEvaded: false,
    playerHp: ctx.player.currentHp,
    enemyHp: ctx.enemy.currentHp
  });

  // Update cooldowns
  if (isPlayer) {
    ctx.player.skills = ctx.player.skills.map(s =>
      s.id === skill.id ? { ...s, currentCooldown: s.cooldown + 1 } : s
    );
  }

  return true;
}

/**
 * Execute enemy turn with intelligent AI (same logic as player)
 */
function executeEnemyTurn(ctx: BattleContext, useSmartAI: boolean = true): void {
  const { enemy, enemyDerived, player, playerDerived } = ctx;

  // Check stun
  if (enemy.activeBuffs.some(b => b?.effect?.type === EffectType.STUN)) {
    ctx.logs.push({
      turn: ctx.turn,
      actor: 'enemy',
      action: 'Stunned!',
      damage: 0,
      isCrit: false,
      isMiss: false,
      isEvaded: false,
      playerHp: ctx.player.currentHp,
      enemyHp: ctx.enemy.currentHp
    });
    return;
  }

  // Check confusion
  if (enemy.activeBuffs.some(b => b?.effect?.type === EffectType.CONFUSION)) {
    if (Math.random() < 0.5) {
      const selfDmg = Math.floor(enemy.primaryStats.strength * 0.5);
      ctx.enemy.currentHp -= selfDmg;
      ctx.logs.push({
        turn: ctx.turn,
        actor: 'enemy',
        action: 'Hurt itself in confusion',
        damage: selfDmg,
        isCrit: false,
        isMiss: false,
        isEvaded: false,
        playerHp: ctx.player.currentHp,
        enemyHp: ctx.enemy.currentHp
      });
      return;
    }
  }

  let skill: Skill;

  if (useSmartAI) {
    // Use intelligent skill selection (same as player)
    const simEnemy = toSimCombatant(enemy, enemyDerived);
    const simPlayer = toSimCombatant(player, playerDerived);

    skill = selectBestSkill(
      enemy.skills,
      simEnemy,
      enemyDerived,
      simPlayer,
      playerDerived,
      false, // Not first turn for enemy
      1.0    // No first hit multiplier
    );
  } else {
    // Legacy random skill selection
    const availableSkills = enemy.skills.filter(s => s.currentCooldown === 0);
    skill = availableSkills.length > 0
      ? availableSkills[Math.floor(Math.random() * availableSkills.length)]
      : enemy.skills[0];
  }

  // Fallback if no skill found
  if (!skill && enemy.skills.length > 0) {
    skill = enemy.skills[0];
  }

  if (skill) {
    executeSkill(ctx, skill, false);

    // Update cooldowns (Only set the used skill's cooldown - main round loop decrements it)
    ctx.enemy.skills = ctx.enemy.skills.map(s =>
      s.id === skill.id ? { ...s, currentCooldown: s.cooldown + 1 } : s
    );
  }
}

/**
 * Helper to get a random terrain type appropriate for a given floor.
 */
export function getRandomTerrainForFloor(floor: number): TerrainType {
  const arc = getStoryArcForFloor(floor);
  const terrains = BIOME_TERRAINS[arc.name] || BIOME_TERRAINS.ACADEMY_ARC;
  return terrains[Math.floor(Math.random() * terrains.length)];
}

/**
 * Run a single battle simulation
 */
export function simulateBattle(
  playerConfig: PlayerBuildConfig,
  enemyArchetype: EnemyArchetype,
  config: SimulationConfig = DEFAULT_CONFIG,
  battleId: number = 0,
  approach: ApproachType | null = null,
  terrain?: TerrainType
): BattleResult {
  // Create combatants
  const player = createSimPlayer(playerConfig);
  const enemy = generateSimEnemy(enemyArchetype, config.floorNumber, config.difficulty);

  // Calculate derived stats
  const playerStats = getPlayerFullStats(player);
  const enemyStats = getEnemyFullStats(enemy);

  // Get/Determine terrain
  const selectedTerrain = terrain || (config.floorNumber ? getRandomTerrainForFloor(config.floorNumber) : undefined);
  const terrainDef = selectedTerrain ? TERRAIN_DEFINITIONS[selectedTerrain] : null;

  // Calculate approach success (only if approach is used)
  const approachSucceeded = approach
    ? calculateApproachSuccess(approach, { primary: playerStats.primary, derived: playerStats.derived })
    : false;

  // Process passives on combat start
  const combatStartResult = processPassivesOnCombatStart(player, enemy);
  player.activeBuffs = [...player.activeBuffs, ...combatStartResult.player.activeBuffs];
  enemy.activeBuffs = [...enemy.activeBuffs, ...combatStartResult.enemy.activeBuffs];

  // Initialize battle context
  const ctx: BattleContext = {
    player: { ...player },
    enemy: { ...enemy },
    playerDerived: playerStats.derived,
    enemyDerived: enemyStats.derived,
    playerStats,
    enemyStats,
    terrain: terrainDef,
    turn: 0,
    isFirstTurn: true,
    // Only apply first hit multiplier if approach succeeded
    firstHitMultiplier: (approach === ApproachType.STEALTH_AMBUSH && approachSucceeded) ? 2.5 : 1.0,
    approachSucceeded,
    logs: [],
    metrics: {
      totalDamageDealt: 0,
      totalDamageReceived: 0,
      totalAttacks: 0,
      crits: 0,
      misses: 0,
      evasions: 0,
      gutsTriggered: 0,
      chakraUsed: 0,
      skillsUsed: {}
    },
    artifactGutsUsed: false
  };

  // Determine who goes first
  const playerInit = playerStats.derived.initiative +
    ((approach === ApproachType.STEALTH_AMBUSH && approachSucceeded) ? 100 : 0) +
    (terrainDef ? terrainDef.effects.initiativeModifier : 0);
  const enemyInit = enemyStats.derived.initiative;
  let playerGoesFirst = playerInit + Math.random() * 10 >= enemyInit + Math.random() * 10;

  // Only guarantee first if approach succeeded
  if (approachSucceeded && (approach === ApproachType.STEALTH_AMBUSH || approach === ApproachType.GENJUTSU_SETUP)) {
    playerGoesFirst = true;
  }

  // Apply approach effects only if succeeded
  if (approachSucceeded && approach === ApproachType.GENJUTSU_SETUP) {
    ctx.enemy.activeBuffs.push({
      id: generateId(),
      name: 'Confusion',
      duration: 3,
      effect: { type: EffectType.CONFUSION, duration: 3, chance: 1 },
      source: 'Genjutsu Setup'
    });
  }

  if (approachSucceeded && approach === ApproachType.ENVIRONMENTAL_TRAP) {
    ctx.enemy.currentHp = Math.floor(ctx.enemy.currentHp * 0.8); // 20% HP reduction
  }

  // Battle loop
  while (ctx.turn < config.maxTurnsPerBattle) {
    ctx.turn++;

    // Process passives on turn start (player only)
    const turnStartResult = processPassivesOnTurnStart(ctx.player, ctx.enemy);
    if (turnStartResult.healToPlayer > 0) {
      ctx.player.currentHp = Math.min(ctx.playerStats.derived.maxHp, ctx.player.currentHp + turnStartResult.healToPlayer);
    }
    if (turnStartResult.chakraRestored > 0) {
      ctx.player.currentChakra = Math.min(ctx.playerStats.derived.maxChakra, ctx.player.currentChakra + turnStartResult.chakraRestored);
    }

    // Process DoTs and buffs at start of turn
    const enemyBuffResult = processBuffs(
      ctx.enemy.activeBuffs,
      ctx.enemy.currentHp,
      enemyStats.derived.maxHp,
      ctx.enemyDerived
    );
    ctx.enemy.currentHp = enemyBuffResult.newHp;
    ctx.enemy.activeBuffs = enemyBuffResult.newBuffs;

    if (ctx.enemy.currentHp <= 0) {
      break; // Enemy died from DoT
    }

    const playerBuffResult = processBuffs(
      ctx.player.activeBuffs,
      ctx.player.currentHp,
      playerStats.derived.maxHp,
      ctx.playerDerived
    );
    ctx.player.currentHp = playerBuffResult.newHp;
    ctx.player.activeBuffs = playerBuffResult.newBuffs;
    ctx.metrics.totalDamageReceived += playerBuffResult.dotDamage;

    // Check player guts from DoT
    if (ctx.player.currentHp <= 0) {
      const statGutsResult = checkGuts(ctx.player.currentHp, 0, ctx.playerDerived.gutsChance);
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

    // Regenerate resources
    ctx.player.currentChakra = Math.min(
      playerStats.derived.maxChakra,
      ctx.player.currentChakra + playerStats.derived.chakraRegen
    );

    // Reduce cooldowns
    ctx.player.skills = ctx.player.skills.map(s => ({
      ...s,
      currentCooldown: Math.max(0, s.currentCooldown - 1)
    }));
    ctx.enemy.skills = ctx.enemy.skills.map(s => ({
      ...s,
      currentCooldown: Math.max(0, s.currentCooldown - 1)
    }));

    // Apply terrain hazard at end of round
    if (ctx.terrain?.effects.hazard) {
      const hazard = ctx.terrain.effects.hazard;
      
      // Player hazard
      if (hazard.affectsPlayer) {
        const hazardRes = applyTerrainHazard(ctx.player, ctx.terrain, 'player');
        if (hazardRes.log) {
          ctx.metrics.totalDamageReceived += Math.max(0, ctx.player.currentHp - hazardRes.newHp);
          ctx.player.currentHp = hazardRes.newHp;
          ctx.logs.push({
            turn: ctx.turn,
            actor: 'environment',
            action: `Hazard: ${hazard.type}`,
            damage: hazard.value,
            isCrit: false,
            isMiss: false,
            isEvaded: false,
            playerHp: ctx.player.currentHp,
            enemyHp: ctx.enemy.currentHp
          });
          if (ctx.player.currentHp <= 0) break;
        }
      }

      // Enemy hazard
      if (hazard.affectsEnemy && ctx.enemy.currentHp > 0) {
        const hazardRes = applyTerrainHazard(ctx.enemy, ctx.terrain, ctx.enemy.name);
        if (hazardRes.log) {
          ctx.enemy.currentHp = hazardRes.newHp;
          ctx.logs.push({
            turn: ctx.turn,
            actor: 'environment',
            action: `Hazard: ${hazard.type}`,
            damage: hazard.value,
            isCrit: false,
            isMiss: false,
            isEvaded: false,
            playerHp: ctx.player.currentHp,
            enemyHp: ctx.enemy.currentHp
          });
          if (ctx.enemy.currentHp <= 0) break;
        }
      }
    }

    ctx.isFirstTurn = false;
  }

  // Determine winner
  const won = ctx.enemy.currentHp <= 0;

  return {
    battleId,
    won,
    turns: ctx.turn,
    totalDamageDealt: ctx.metrics.totalDamageDealt,
    totalDamageReceived: ctx.metrics.totalDamageReceived,
    totalAttacks: ctx.metrics.totalAttacks,
    critCount: ctx.metrics.crits,
    missCount: ctx.metrics.misses,
    evasionCount: ctx.metrics.evasions,
    gutsTriggersPlayer: ctx.metrics.gutsTriggered,
    playerFinalHp: ctx.player.currentHp,
    enemyFinalHp: ctx.enemy.currentHp,
    totalChakraUsed: ctx.metrics.chakraUsed,
    skillsUsed: ctx.metrics.skillsUsed,
    approachUsed: approach,
    approachSucceeded: ctx.approachSucceeded
  };
}

/**
 * Run multiple battles and return all results
 */
export function runBattles(
  playerConfig: PlayerBuildConfig,
  enemyArchetype: EnemyArchetype,
  config: SimulationConfig = DEFAULT_CONFIG,
  approach: ApproachType | null = null
): BattleResult[] {
  const results: BattleResult[] = [];

  for (let i = 0; i < config.battlesPerConfig; i++) {
    const result = simulateBattle(playerConfig, enemyArchetype, config, i, approach);
    results.push(result);
  }

  return results;
}
