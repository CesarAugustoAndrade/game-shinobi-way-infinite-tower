/**
 * Combat Simulation Service
 *
 * Provides full auto-resolve combat when ENABLE_MANUAL_COMBAT is false
 * (batch simulation — distinct from the in-combat Auto-pass toggle).
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
  PrimaryAttributes,
  CombatModifierType,
} from '../types';
import {
  calculateDamage,
  checkGuts,
  resistStatus,
  calculateDotDamage,
  getPlayerFullStats,
  getEnemyFullStats,
  resolvePassiveDamageBonus,
} from './StatSystem';
import {
  generateId,
  applyMitigation as applyMitigationCalc,
  tickBuffDurations,
  getTerrainElementAmplification,
  applyTerrainHazard,
  getTerrainEvasionBonus,
  determineTurnOrder,
} from './CombatCalculationSystem';
import {
  processPassivesOnCombatStart,
  processPassivesOnHit,
  processPassivesOnTurnStart,
  shouldCounterAttack,
  checkExecuteThreshold,
  checkGutsPassive,
  getTotalDefenseBypass,
  getCritDefenseBypass,
  hasAllElementsPassive,
  getConvertToElementalPercent,
  getDamageReductionPercent,
  applyClanTraitToDamageContext,
} from './EquipmentPassiveSystem';
import { getEventFlagRunModifiers } from './EventSystem';
import { LaunchProperties } from '../../config/featureFlags';
import { TERRAIN_DEFINITIONS } from '../constants/terrain';
import {
  APPROACH_DEFINITIONS,
  calculateApproachSuccessChance,
} from '../constants/approaches';
import {
  applyEnemyDefenseBonus,
  applyLocationHazardsToPlayer,
  skillLocationDamageMult,
  type LocationTerrainMods,
} from './LocationTerrainSystem';
import { applyRoomCombatModifiers } from './RoomCombatModifierSystem';
import type { CombatModifiers } from './ApproachSystem';

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
  /** T-070: location terrain mods (parity with manual combat) */
  locationTerrainMods: LocationTerrainMods | null;
  turn: number;
  /** Opening ambush / FREE_FIRST window — cleared after first player skill */
  isFirstTurn: boolean;
  firstHitMultiplier: number;
  /** T-106: room AMBUSH enemy first-hit mult */
  enemyFirstHitMultiplier: number;
  /** T-106: room combat FOREST cover evasion */
  roomCombatEvasion: number;
  /** FREE_FIRST_SKILL artifact passive */
  skipFirstSkillCost: boolean;
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
 * Approach success roll using live `calculateApproachSuccessChance`
 * (parity with BattleSimulator).
 */
function rollApproachSuccess(
  approach: ApproachType,
  playerStats: { primary: PrimaryAttributes; derived: DerivedStats },
  terrainStealthBonus: number = 0
): boolean {
  if (approach === ApproachType.FRONTAL_ASSAULT) {
    return true;
  }

  const stats: Record<string, number> = {
    speed: playerStats.primary.speed,
    dexterity: playerStats.primary.dexterity,
    intelligence: playerStats.primary.intelligence,
    calmness: playerStats.primary.calmness,
    accuracy: playerStats.primary.accuracy,
    willpower: playerStats.primary.willpower,
    strength: playerStats.primary.strength,
    spirit: playerStats.primary.spirit,
    chakra: playerStats.primary.chakra,
  };

  const successChance = calculateApproachSuccessChance(
    approach,
    stats,
    terrainStealthBonus
  );
  return Math.random() * 100 < successChance;
}

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

  // Deduct costs (FREE_FIRST_SKILL skips chakra on first player skill)
  if (isPlayer) {
    const skipCost = ctx.skipFirstSkillCost && ctx.isFirstTurn;
    ctx.player.currentHp -= skill.hpCost;
    if (!skipCost) {
      ctx.player.currentChakra -= skill.chakraCost;
    }
  }

  // Calculate damage (player attacks get passive damage + artifact offensive modifiers + clan traits T-031)
  let atkDerived = attackerStats.derived;
  let defPrimary = isPlayer ? defender.primaryStats : defenderStats.effectivePrimary;
  let defDerived = isPlayer ? defenderStats.derived : defenderStats.derived;
  const roomEvasion = getTerrainEvasionBonus(ctx.terrain);
  if (isPlayer) {
    const clanCtx = applyClanTraitToDamageContext(
      ctx.player,
      attackerStats.derived,
      defender.primaryStats,
      defenderStats.derived,
    );
    atkDerived = clanCtx.attackerDerived;
    defPrimary = clanCtx.defenderPrimary;
    // T-077: room evasion helps enemy dodge player hits in auto combat
    defDerived =
      roomEvasion !== 0
        ? {
            ...clanCtx.defenderDerived,
            evasion: Math.min(0.75, clanCtx.defenderDerived.evasion + roomEvasion),
          }
        : clanCtx.defenderDerived;
  } else {
    // T-072/T-077/T-106: location + terrain + room combat FOREST cover
    const locEvasion = ctx.locationTerrainMods?.evasionBonus ?? 0;
    const totalEvasion = locEvasion + roomEvasion + (ctx.roomCombatEvasion ?? 0);
    if (totalEvasion !== 0) {
      defDerived = {
        ...defenderStats.derived,
        evasion: Math.min(0.75, defenderStats.derived.evasion + totalEvasion),
      };
    }
  }
  const result = calculateDamage(
    isPlayer ? attackerStats.effectivePrimary : attacker.primaryStats,
    atkDerived,
    defPrimary,
    defDerived,
    skill,
    attacker.element,
    defender.element,
    isPlayer
      ? {
          damageBonus:
            resolvePassiveDamageBonus(attackerStats.passiveBonuses, skill.element)
            + getEventFlagRunModifiers(ctx.player).damageBonus,
          defenseBypass: getTotalDefenseBypass(ctx.player),
          critDefenseBypass: getCritDefenseBypass(ctx.player),
          forceSuperEffective: hasAllElementsPassive(ctx.player),
          convertToElementalPercent: getConvertToElementalPercent(ctx.player),
        }
      : {}
  );

  // Skip if missed or evaded (still consume FREE_FIRST / opening window for player)
  if (result.isMiss || result.isEvaded) {
    if (isPlayer) {
      ctx.isFirstTurn = false;
    }
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

  // T-070: location terrain mods (parity with PlayerTurnSystem / EnemyTurnSystem)
  if (isPlayer && ctx.locationTerrainMods) {
    const locMult = skillLocationDamageMult(skill, ctx.locationTerrainMods);
    if (locMult !== 1) {
      damage = Math.floor(damage * locMult);
    }
    damage = applyEnemyDefenseBonus(damage, ctx.locationTerrainMods);
  } else if (!isPlayer && ctx.locationTerrainMods) {
    const atkBonus = ctx.locationTerrainMods.enemyAttackBonus;
    if (atkBonus !== 0) {
      damage = Math.floor(damage * (1 + atkBonus));
    }
  }

  // Apply LaunchProperties Multipliers
  if (isPlayer) {
    damage = Math.floor(damage * LaunchProperties.PLAYER_DAMAGE_MULTIPLIER);
  } else {
    damage = Math.floor(damage * LaunchProperties.ENEMY_DAMAGE_MULTIPLIER);
  }

  // Opening ambush first-hit mult (STEALTH_AMBUSH success → 2.0× from APPROACH_DEFINITIONS)
  if (isPlayer && ctx.isFirstTurn && ctx.firstHitMultiplier > 1.0) {
    damage = Math.floor(damage * ctx.firstHitMultiplier);
  }
  // T-106: room AMBUSH enemy first-strike
  if (!isPlayer && ctx.isFirstTurn && ctx.enemyFirstHitMultiplier > 1.0) {
    damage = Math.floor(damage * ctx.enemyFirstHitMultiplier);
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

    // Artifact DAMAGE_REDUCTION (incl. below_half_hp)
    const drPercent = getDamageReductionPercent(ctx.player, ctx.playerStats.derived.maxHp);
    if (drPercent !== 0 && damage > 0) {
      damage = Math.max(0, Math.floor(damage * (1 - drPercent / 100)));
    }

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

    // Counter: shouldCounterAttack already rolls once — do not re-roll (A-017)
    if (ctx.player.currentHp > 0) {
      const counterCheck = shouldCounterAttack(ctx.player);
      if (counterCheck.shouldCounter) {
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
      // Instant HEAL: restore HP immediately (not a lingering buff). Parity with PlayerTurnSystem / A-004.
      if (effect.type === EffectType.HEAL) {
        const healAmount = Math.floor(effect.value || 0);
        if (healAmount > 0) {
          if (isPlayer) {
            ctx.player.currentHp = Math.min(
              ctx.playerStats.derived.maxHp,
              ctx.player.currentHp + healAmount
            );
          } else {
            ctx.enemy.currentHp = Math.min(
              ctx.enemyStats.derived.maxHp,
              ctx.enemy.currentHp + healAmount
            );
          }
        }
        // Medical jutsu that mention poison/bleed also cleanse those DoTs.
        const desc = (skill.description || '').toLowerCase();
        if (desc.includes('poison') || desc.includes('bleed')) {
          if (isPlayer) {
            ctx.player.activeBuffs = ctx.player.activeBuffs.filter(
              b => b?.effect?.type !== EffectType.BLEED && b?.effect?.type !== EffectType.POISON
            );
          } else {
            ctx.enemy.activeBuffs = ctx.enemy.activeBuffs.filter(
              b => b?.effect?.type !== EffectType.BLEED && b?.effect?.type !== EffectType.POISON
            );
          }
        }
        continue;
      }

      const isSelfBuff = [
        EffectType.BUFF, EffectType.SHIELD, EffectType.REFLECTION,
        EffectType.REGEN, EffectType.INVULNERABILITY,
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
    // Opening window consumed after first player skill (ambush mult + FREE_FIRST)
    ctx.isFirstTurn = false;
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
  terrain?: TerrainType,
  /** T-070: location terrain effects for auto-combat parity */
  locationTerrainMods?: LocationTerrainMods | null,
  /** T-106: room combat activity modifiers (AMBUSH / SANCTUARY / …) */
  roomCombatModifiers?: CombatModifierType[] | null,
): CombatSimulationResult {
  // Get full stats
  const playerFullStats = getPlayerFullStats(player);
  const enemyFullStats = getEnemyFullStats(enemy);

  // Clone player and enemy for mutable simulation state
  let clonedPlayer = {
    ...player,
    skills: player.skills.map(s => ({ ...s, currentCooldown: 0 })),
    activeBuffs: [...player.activeBuffs]
  };

  const clonedEnemy = {
    ...enemy,
    skills: enemy.skills.map(s => ({ ...s, currentCooldown: 0 })),
    activeBuffs: [...enemy.activeBuffs]
  };

  // Process passives on combat start (SHIELD_ON_START uses max chakra — A-017).
  // Replace activeBuffs with passive result (no double-append — result already includes prior buffs).
  // Apply currentHp from result (e.g. Uzumaki combat-start heal).
  const combatStartResult = processPassivesOnCombatStart(clonedPlayer, clonedEnemy, {
    maxHp: playerFullStats.derived.maxHp,
    maxChakra: playerFullStats.derived.maxChakra,
  });
  clonedPlayer.activeBuffs = combatStartResult.player.activeBuffs;
  clonedPlayer.currentHp = combatStartResult.player.currentHp;
  clonedEnemy.activeBuffs = combatStartResult.enemy.activeBuffs;
  const skipFirstSkillCost = combatStartResult.skipFirstSkillCost;

  const terrainDef = terrain ? TERRAIN_DEFINITIONS[terrain] : null;

  // Approach success + effects from shared APPROACH_DEFINITIONS (parity with BattleSimulator)
  const approachSucceeded = approach
    ? rollApproachSuccess(
        approach,
        { primary: playerFullStats.primary, derived: playerFullStats.derived },
        terrainDef?.effects.stealthModifier ?? 0
      )
    : false;

  const approachDef = approach ? APPROACH_DEFINITIONS[approach] : null;
  const approachEffects = approachDef
    ? (approachSucceeded ? approachDef.successEffects : (approachDef.failureEffects ?? approachDef.successEffects))
    : null;

  let firstHitMult =
    approachSucceeded && approachEffects
      ? (approachEffects.firstHitMultiplier ?? 1.0)
      : 1.0;

  // T-106: room combat modifiers parity with manual startCombat
  const approachMods: CombatModifiers = {
    playerGoesFirst: approachSucceeded && (approachEffects?.guaranteedFirst ?? false),
    playerInitiativeBonus: approachEffects?.initiativeBonus ?? 0,
    firstHitMultiplier: firstHitMult,
    playerBuffs: [],
    enemyDebuffs: [],
    xpMultiplier: 1,
  };
  const roomApplied = applyRoomCombatModifiers(
    roomCombatModifiers,
    approachMods,
    clonedPlayer,
    playerFullStats.derived.maxHp,
  );
  clonedPlayer = roomApplied.player;
  firstHitMult = roomApplied.modifiers.firstHitMultiplier;
  const enemyFirstHitMult = roomApplied.enemyFirstHitMultiplier;
  const roomCombatEvasion = roomApplied.playerEvasionBonus;
  // Merge room-mod buffs (e.g. Corrupted poison) onto player
  if (roomApplied.modifiers.playerBuffs.length > 0) {
    clonedPlayer = {
      ...clonedPlayer,
      activeBuffs: [...clonedPlayer.activeBuffs, ...roomApplied.modifiers.playerBuffs],
    };
  }

  // Turn order (failure can apply negative initiativeBonus)
  const whoFirst = determineTurnOrder(playerFullStats, enemyFullStats, {
    isFirstTurn: true,
    playerGoesFirst: roomApplied.modifiers.playerGoesFirst,
    playerInitiativeBonus: roomApplied.modifiers.playerInitiativeBonus,
    terrain: terrainDef,
  });
  const playerGoesFirst = whoFirst === 'player';

  // Apply approach buffs/debuffs on success OR failure penalties
  if (approachEffects) {
    const sourceName = approachDef?.name ?? 'Approach';
    for (const eff of approachEffects.enemyDebuffs ?? []) {
      if (Math.random() > (eff.chance ?? 1)) continue;
      clonedEnemy.activeBuffs.push({
        id: generateId(),
        name: eff.type,
        duration: eff.duration,
        effect: {
          type: eff.type,
          value: eff.value,
          duration: eff.duration,
          targetStat: eff.targetStat,
          chance: eff.chance,
        },
        source: sourceName,
      });
    }
    for (const eff of approachEffects.playerBuffs ?? []) {
      if (Math.random() > (eff.chance ?? 1)) continue;
      clonedPlayer.activeBuffs.push({
        id: generateId(),
        name: eff.type,
        duration: eff.duration,
        effect: {
          type: eff.type,
          value: eff.value,
          duration: eff.duration,
          targetStat: eff.targetStat,
          chance: eff.chance,
        },
        source: sourceName,
      });
    }
    if (!approachSucceeded && (approachEffects.hpCost ?? 0) > 0) {
      clonedPlayer.currentHp = Math.max(1, clonedPlayer.currentHp - (approachEffects.hpCost ?? 0));
    }
    const hpReduction = approachSucceeded ? (approachEffects.enemyHpReduction ?? 0) : 0;
    if (hpReduction > 0) {
      clonedEnemy.currentHp = Math.floor(clonedEnemy.currentHp * (1 - hpReduction));
    }
  }

  // Initialize context
  const ctx: SimulationContext = {
    player: clonedPlayer,
    enemy: clonedEnemy,
    playerStats: playerFullStats,
    enemyStats: enemyFullStats,
    terrain: terrainDef,
    locationTerrainMods: locationTerrainMods ?? null,
    turn: 0,
    isFirstTurn: true,
    firstHitMultiplier: firstHitMult,
    enemyFirstHitMultiplier: enemyFirstHitMult,
    roomCombatEvasion,
    skipFirstSkillCost,
    metrics: {
      damageDealt: 0,
      damageReceived: 0,
      crits: 0,
      gutsTriggered: 0,
    },
    artifactGutsUsed: false,
  };

  // Battle loop
  while (ctx.turn < MAX_TURNS) {
    ctx.turn++;

    // Process passives on turn start (player only) — REGEN % of maxHp (A-017)
    const turnStartResult = processPassivesOnTurnStart(
      ctx.player,
      ctx.enemy,
      ctx.playerStats.derived.maxHp
    );
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

    // T-070: location poison/fall/chakra hazards
    if (ctx.locationTerrainMods) {
      const locHaz = applyLocationHazardsToPlayer(
        ctx.player,
        ctx.playerStats.derived.maxHp,
        ctx.playerStats.derived.maxChakra,
        ctx.locationTerrainMods,
      );
      if (locHaz.logs.length > 0) {
        const hpLost = Math.max(0, ctx.player.currentHp - locHaz.player.currentHp);
        ctx.metrics.damageReceived += hpLost;
        ctx.player = locHaz.player;
        if (ctx.player.currentHp <= 0) break;
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
