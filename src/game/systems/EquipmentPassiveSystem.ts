/**
 * =============================================================================
 * EQUIPMENT PASSIVE SYSTEM - Artifact Combat Effects
 * =============================================================================
 *
 * This system processes passive effects from equipped artifacts during combat.
 * Artifacts are the primary source of passive abilities in the game.
 *
 * ## TRIGGER CONDITIONS (6 Types)
 *
 * | Trigger        | When It Fires                    | Example Effects      |
 * |----------------|----------------------------------|---------------------|
 * | combat_start   | Battle begins                    | Shield, Invuln      |
 * | on_hit         | Player deals damage              | Bleed, Lifesteal    |
 * | on_crit        | Player lands critical hit        | Pierce, Burn        |
 * | turn_start     | Player's turn begins             | Regen, Chakra       |
 * | on_kill        | Player defeats enemy             | Cooldown reset      |
 * | below_half_hp  | Player HP drops below 50%        | Damage reduction    |
 *
 * ## PASSIVE EFFECT TYPES (20+)
 *
 * ### Combat Start Effects
 * - SHIELD_ON_START: Grant shield equal to % of max chakra
 * - INVULNERABLE_FIRST_TURN: 1 turn of complete immunity
 * - REFLECT: Return % of damage to attacker
 * - FREE_FIRST_SKILL: First skill costs no resources
 *
 * ### On Hit Effects
 * - BLEED: Apply physical DoT (piercing damage)
 * - BURN: Apply elemental DoT
 * - CHAKRA_DRAIN: Steal chakra from enemy
 * - LIFESTEAL: Heal % of damage dealt
 * - SEAL_CHANCE: % chance to stun enemy
 *
 * ### On Crit Effects
 * - PIERCE_DEFENSE: Ignore % of enemy defense
 * - BURN: Enhanced burn on critical hits
 *
 * ### Turn Start Effects
 * - REGEN: Heal % of max HP per turn
 * - CHAKRA_RESTORE: Flat chakra recovery
 *
 * ### On Kill Effects
 * - COOLDOWN_RESET_ON_KILL: Reset all skill cooldowns
 *
 * ### Conditional Effects
 * - DAMAGE_REDUCTION: Take less damage when wounded
 * - COUNTER_ATTACK: % chance to auto-attack when hit
 * - EXECUTE_THRESHOLD: Special effect below % HP
 * - GUTS: Survive lethal hit once
 *
 * ### Special Effects
 * - ALL_ELEMENTS: Attacks always super effective
 * - CLAN_TRAIT_*: Clan-specific bonuses
 *
 * =============================================================================
 */

import {
  Player,
  Enemy,
  Item,
  EquipmentSlot,
  PassiveEffect,
  PassiveEffectType,
  Buff,
  EffectType,
  DamageType,
  DamageProperty,
  DerivedStats,
  PrimaryAttributes,
} from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Get all equipped items with passives
 */
function getEquippedPassives(player: Player): { item: Item; passive: PassiveEffect }[] {
  const passives: { item: Item; passive: PassiveEffect }[] = [];

  for (const slot of Object.values(EquipmentSlot)) {
    const item = player.equipment[slot];
    if (item?.passive) {
      passives.push({ item, passive: item.passive });
    }
  }

  return passives;
}

/**
 * Result of processing passive effects
 */
export interface PassiveProcessResult {
  player: Player;
  enemy: Enemy;
  logs: string[];
  damageToEnemy: number;
  damageToPlayer: number;
  healToPlayer: number;
  chakraRestored: number;
  chakraDrained: number;
  skipFirstSkillCost: boolean;
  shouldCounter: boolean;
  defenseBypass: number; // Percentage of defense to ignore (0-100)
}

/**
 * Create a default result object
 */
function createDefaultResult(player: Player, enemy: Enemy): PassiveProcessResult {
  return {
    player: { ...player },
    enemy: { ...enemy },
    logs: [],
    damageToEnemy: 0,
    damageToPlayer: 0,
    healToPlayer: 0,
    chakraRestored: 0,
    chakraDrained: 0,
    skipFirstSkillCost: false,
    shouldCounter: false,
    defenseBypass: 0,
  };
}

/**
 * Process passive effects at combat start
 * @param maxResources - Prefer maxChakra for SHIELD_ON_START % (A-017). Falls back to current if omitted.
 */
export function processPassivesOnCombatStart(
  player: Player,
  enemy: Enemy,
  maxResources?: { maxHp?: number; maxChakra?: number }
): PassiveProcessResult {
  const result = createDefaultResult(player, enemy);
  const passives = getEquippedPassives(player);

  for (const { item, passive } of passives) {
    if (passive.triggerCondition && passive.triggerCondition !== 'combat_start') continue;

    switch (passive.type) {
      case PassiveEffectType.SHIELD_ON_START: {
        // Grant shield equal to % of max chakra (not current — A-017)
        const maxChakra = maxResources?.maxChakra ?? player.currentChakra;
        const shieldValue = Math.floor(maxChakra * (passive.value || 50) / 100);
        const shieldBuff: Buff = {
          id: generateId(),
          name: EffectType.SHIELD,
          duration: 99, // Lasts until broken
          effect: { type: EffectType.SHIELD, value: shieldValue, duration: 99, chance: 1 },
          source: item.name,
        };
        result.player.activeBuffs = [...result.player.activeBuffs, shieldBuff];
        result.logs.push(`${item.name} grants ${shieldValue} Shield!`);
        break;
      }

      case PassiveEffectType.INVULNERABLE_FIRST_TURN: {
        const invulnBuff: Buff = {
          id: generateId(),
          name: EffectType.INVULNERABILITY,
          duration: 1,
          effect: { type: EffectType.INVULNERABILITY, duration: 1, chance: 1 },
          source: item.name,
        };
        result.player.activeBuffs = [...result.player.activeBuffs, invulnBuff];
        result.logs.push(`${item.name} grants Invulnerability for the first turn!`);
        break;
      }

      case PassiveEffectType.REFLECT: {
        // First attack reflection (100% reflect buff for first hit)
        const reflectBuff: Buff = {
          id: generateId(),
          name: EffectType.REFLECTION,
          duration: 1,
          effect: { type: EffectType.REFLECTION, value: (passive.value || 100) / 100, duration: 1, chance: 1 },
          source: item.name,
        };
        result.player.activeBuffs = [...result.player.activeBuffs, reflectBuff];
        result.logs.push(`${item.name} activates damage reflection!`);
        break;
      }

      case PassiveEffectType.FREE_FIRST_SKILL: {
        result.skipFirstSkillCost = true;
        result.logs.push(`${item.name}: First skill is free!`);
        break;
      }
    }
  }

  // T-031: clan trait combat-start (logs + Uzumaki vitality heal)
  const clanMods = getClanTraitCombatModifiers(player);
  if (clanMods.logs.length > 0) {
    result.logs.push(...clanMods.logs);
  }
  if (clanMods.combatStartHealPercent > 0) {
    const maxHp = maxResources?.maxHp ?? player.currentHp;
    const heal = Math.floor(maxHp * (clanMods.combatStartHealPercent / 100));
    if (heal > 0) {
      result.healToPlayer += heal;
      result.player = {
        ...result.player,
        currentHp: Math.min(maxHp, result.player.currentHp + heal),
      };
      result.logs.push(`Uzumaki Vitality restores ${heal} HP!`);
    }
  }

  return result;
}

/**
 * Process passive effects when the player hits an enemy
 */
export function processPassivesOnHit(
  player: Player,
  enemy: Enemy,
  damageDealt: number,
  wasCrit: boolean
): PassiveProcessResult {
  const result = createDefaultResult(player, enemy);
  const passives = getEquippedPassives(player);

  for (const { item, passive } of passives) {
    // Handle on_hit triggers
    if (passive.triggerCondition === 'on_hit' || !passive.triggerCondition) {
      switch (passive.type) {
        case PassiveEffectType.CLAN_TRAIT_HYUGA: {
          // Handled in aggregate chakra drain below (one drain total for all Hyuga traits)
          break;
        }
        case PassiveEffectType.BLEED: {
          // Apply bleed DoT to enemy
          const bleedBuff: Buff = {
            id: generateId(),
            name: EffectType.BLEED,
            duration: passive.duration || 3,
            effect: {
              type: EffectType.BLEED,
              value: passive.value || 5,
              duration: passive.duration || 3,
              chance: 1,
              damageType: DamageType.PHYSICAL,
              damageProperty: DamageProperty.PIERCING,
            },
            source: item.name,
          };
          result.enemy.activeBuffs = [...result.enemy.activeBuffs, bleedBuff];
          result.logs.push(`${item.name} applies Bleed!`);
          break;
        }

        case PassiveEffectType.BURN: {
          // Apply burn on hit (not crit-triggered burns, those are handled separately)
          const burnBuff: Buff = {
            id: generateId(),
            name: EffectType.BURN,
            duration: passive.duration || 3,
            effect: {
              type: EffectType.BURN,
              value: passive.value || 8,
              duration: passive.duration || 3,
              chance: 1,
              damageType: DamageType.ELEMENTAL,
            },
            source: item.name,
          };
          result.enemy.activeBuffs = [...result.enemy.activeBuffs, burnBuff];
          result.logs.push(`${item.name} applies Burn!`);
          break;
        }

        case PassiveEffectType.CHAKRA_DRAIN: {
          const drainAmount = Math.min(result.enemy.currentChakra, passive.value || 10);
          if (drainAmount > 0) {
            result.enemy = {
              ...result.enemy,
              currentChakra: result.enemy.currentChakra - drainAmount,
            };
            result.chakraDrained += drainAmount;
            result.chakraRestored += drainAmount;
            result.logs.push(`${item.name} drains ${drainAmount} Chakra!`);
          }
          break;
        }

        case PassiveEffectType.LIFESTEAL: {
          const healAmount = Math.floor(damageDealt * (passive.value || 15) / 100);
          result.healToPlayer = healAmount;
          result.logs.push(`${item.name}: Lifesteal heals ${healAmount} HP!`);
          break;
        }

        case PassiveEffectType.SEAL_CHANCE: {
          if (Math.random() * 100 < (passive.value || 10)) {
            const sealBuff: Buff = {
              id: generateId(),
              name: EffectType.STUN,
              duration: passive.duration || 1,
              effect: { type: EffectType.STUN, duration: passive.duration || 1, chance: 1 },
              source: item.name,
            };
            result.enemy.activeBuffs = [...result.enemy.activeBuffs, sealBuff];
            result.logs.push(`${item.name} Seals the enemy!`);
          }
          break;
        }
      }
    }

    // Handle on_crit triggers
    if (passive.triggerCondition === 'on_crit' && wasCrit) {
      switch (passive.type) {
        case PassiveEffectType.PIERCE_DEFENSE: {
          result.defenseBypass = Math.max(result.defenseBypass, passive.value || 100);
          result.logs.push(`${item.name}: Critical hit ignores ${passive.value || 100}% defense!`);
          break;
        }

        case PassiveEffectType.BURN: {
          const burnBuff: Buff = {
            id: generateId(),
            name: EffectType.BURN,
            duration: passive.duration || 3,
            effect: {
              type: EffectType.BURN,
              value: passive.value || 15,
              duration: passive.duration || 3,
              chance: 1,
              damageType: DamageType.ELEMENTAL,
            },
            source: item.name,
          };
          result.enemy.activeBuffs = [...result.enemy.activeBuffs, burnBuff];
          result.logs.push(`${item.name} applies massive Burn!`);
          break;
        }
      }
    }
  }

  // Check for permanent defense pierce (non-conditional)
  for (const { item, passive } of passives) {
    if (passive.type === PassiveEffectType.PIERCE_DEFENSE && !passive.triggerCondition) {
      result.defenseBypass = Math.max(result.defenseBypass, passive.value || 25);
    }
  }

  // T-031: Hyuga clan trait — tenketsu chakra drain on hit
  const clanMods = getClanTraitCombatModifiers(player);
  if (clanMods.chakraDrainOnHit > 0) {
    const drain = Math.min(result.enemy.currentChakra, clanMods.chakraDrainOnHit);
    if (drain > 0) {
      result.enemy = {
        ...result.enemy,
        currentChakra: result.enemy.currentChakra - drain,
      };
      result.chakraDrained += drain;
      result.chakraRestored += drain;
      result.player = {
        ...result.player,
        currentChakra: result.player.currentChakra + drain,
      };
      result.logs.push(`Byakugan Awakening disrupts tenketsu: drains ${drain} chakra!`);
    }
  }

  return result;
}

/**
 * Process passive effects at the start of player's turn
 * @param maxHp - Prefer derived max HP for REGEN % (A-017). Falls back to currentHp if omitted.
 */
export function processPassivesOnTurnStart(
  player: Player,
  enemy: Enemy,
  maxHp?: number
): PassiveProcessResult {
  const result = createDefaultResult(player, enemy);
  const passives = getEquippedPassives(player);

  for (const { item, passive } of passives) {
    if (passive.triggerCondition !== 'turn_start') continue;

    switch (passive.type) {
      case PassiveEffectType.REGEN: {
        // % of max HP, not current (A-017 regression: currentHp under-heals wounded players)
        const baseHp = maxHp ?? player.currentHp;
        const healAmount = Math.floor(baseHp * (passive.value || 5) / 100);
        result.healToPlayer += healAmount;
        result.logs.push(`${item.name} regenerates ${healAmount} HP!`);
        break;
      }

      case PassiveEffectType.CHAKRA_RESTORE: {
        result.chakraRestored += passive.value || 10;
        result.logs.push(`${item.name} restores ${passive.value || 10} Chakra!`);
        break;
      }
    }
  }

  return result;
}

/**
 * Process passive effects on kill
 */
export function processPassivesOnKill(
  player: Player,
  enemy: Enemy
): PassiveProcessResult {
  const result = createDefaultResult(player, enemy);
  const passives = getEquippedPassives(player);

  for (const { item, passive } of passives) {
    if (passive.triggerCondition !== 'on_kill' && passive.type !== PassiveEffectType.COOLDOWN_RESET_ON_KILL) continue;

    switch (passive.type) {
      case PassiveEffectType.COOLDOWN_RESET_ON_KILL: {
        // Reset all skill cooldowns
        result.player.skills = result.player.skills.map(skill => ({
          ...skill,
          currentCooldown: 0,
        }));
        result.logs.push(`${item.name}: All cooldowns reset!`);
        break;
      }
    }
  }

  return result;
}

/**
 * Process passive effects when player is below half HP
 */
export function processPassivesBelowHalfHp(
  player: Player,
  enemy: Enemy,
  maxHp: number
): PassiveProcessResult {
  const result = createDefaultResult(player, enemy);

  // Only trigger if below 50% HP
  if (player.currentHp > maxHp / 2) return result;

  const passives = getEquippedPassives(player);

  for (const { item, passive } of passives) {
    if (passive.triggerCondition !== 'below_half_hp') continue;

    switch (passive.type) {
      case PassiveEffectType.DAMAGE_REDUCTION: {
        result.logs.push(`${item.name}: Taking ${passive.value || 15}% less damage while wounded!`);
        break;
      }
    }
  }

  return result;
}

/**
 * Total damage reduction % from equipped artifacts.
 * Unconditional DAMAGE_REDUCTION always applies; below_half_hp only when HP ≤ 50%.
 * Negative values amplify damage taken. Positive reduction is capped at 75%.
 */
export function getDamageReductionPercent(player: Player, maxHp: number): number {
  let total = 0;
  const passives = getEquippedPassives(player);
  const belowHalf = player.currentHp <= maxHp / 2;

  for (const { passive } of passives) {
    if (passive.type !== PassiveEffectType.DAMAGE_REDUCTION) continue;

    if (passive.triggerCondition === 'below_half_hp') {
      if (belowHalf) total += passive.value || 0;
    } else if (!passive.triggerCondition) {
      total += passive.value || 0;
    }
  }

  // Cap beneficial DR; leave negative (damage amp) uncapped beyond a soft floor
  if (total > 0) return Math.min(75, total);
  return total;
}

/**
 * Crit-only defense pierce % from PIERCE_DEFENSE passives with on_crit trigger.
 */
export function getCritDefenseBypass(player: Player): number {
  let total = 0;
  const passives = getEquippedPassives(player);

  for (const { passive } of passives) {
    if (passive.type === PassiveEffectType.PIERCE_DEFENSE && passive.triggerCondition === 'on_crit') {
      total += passive.value || 0;
    }
  }

  return Math.min(total, 100);
}

/**
 * CONVERT_TO_ELEMENTAL: % of Physical damage recalculated against elemental defense.
 */
export function getConvertToElementalPercent(player: Player): number {
  let total = 0;
  const passives = getEquippedPassives(player);

  for (const { passive } of passives) {
    if (passive.type === PassiveEffectType.CONVERT_TO_ELEMENTAL && !passive.triggerCondition) {
      total += passive.value || 0;
    }
  }

  return Math.min(total, 100);
}

/**
 * Check if player should counter-attack when hit.
 * Performs a SINGLE RNG roll against the passive chance.
 * Callers must NOT re-roll — use `shouldCounter` as the final decision (A-017).
 */
export function shouldCounterAttack(player: Player): { shouldCounter: boolean; chance: number; source: string } {
  const passives = getEquippedPassives(player);

  for (const { item, passive } of passives) {
    if (passive.type === PassiveEffectType.COUNTER_ATTACK) {
      const chance = passive.value || 25;
      // Single roll only — EnemyTurnSystem / sims must not re-check chance.
      if (Math.random() * 100 < chance) {
        return { shouldCounter: true, chance, source: item.name };
      }
      // First COUNTER_ATTACK passive fails the roll → no counter this hit
      return { shouldCounter: false, chance, source: item.name };
    }
  }

  return { shouldCounter: false, chance: 0, source: '' };
}

/**
 * Check if enemy is below execute threshold
 */
export function checkExecuteThreshold(player: Player, enemy: Enemy, maxEnemyHp: number): boolean {
  const passives = getEquippedPassives(player);

  for (const { passive } of passives) {
    if (passive.type === PassiveEffectType.EXECUTE_THRESHOLD) {
      const threshold = (passive.value || 20) / 100;
      if (enemy.currentHp / maxEnemyHp <= threshold) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check for GUTS passive (survive lethal blow)
 */
export function checkGutsPassive(player: Player): { hasGuts: boolean; healPercent: number; source: string } {
  const passives = getEquippedPassives(player);

  for (const { item, passive } of passives) {
    if (passive.type === PassiveEffectType.GUTS) {
      return {
        hasGuts: true,
        healPercent: passive.value || 25,
        source: item.name,
      };
    }
  }

  return { hasGuts: false, healPercent: 0, source: '' };
}

/**
 * Get total defense bypass from all equipment
 */
export function getTotalDefenseBypass(player: Player): number {
  let totalBypass = 0;
  const passives = getEquippedPassives(player);

  for (const { passive } of passives) {
    if (passive.type === PassiveEffectType.PIERCE_DEFENSE && !passive.triggerCondition) {
      totalBypass += passive.value || 0;
    }
  }

  return Math.min(totalBypass, 100); // Cap at 100%
}

/**
 * Check if player has ALL_ELEMENTS passive (always super effective)
 */
export function hasAllElementsPassive(player: Player): boolean {
  const passives = getEquippedPassives(player);
  return passives.some(({ passive }) => passive.type === PassiveEffectType.ALL_ELEMENTS);
}

/**
 * Get any clan trait passives
 */
export function getClanTraitPassives(player: Player): PassiveEffectType[] {
  const passives = getEquippedPassives(player);
  const traits: PassiveEffectType[] = [];

  for (const { passive } of passives) {
    if ([
      PassiveEffectType.CLAN_TRAIT_UCHIHA,
      PassiveEffectType.CLAN_TRAIT_UZUMAKI,
      PassiveEffectType.CLAN_TRAIT_HYUGA,
      PassiveEffectType.CLAN_TRAIT_NARA,
    ].includes(passive.type)) {
      traits.push(passive.type);
    }
  }

  return traits;
}

/** Combat modifiers derived from equipped CLAN_TRAIT_* artifacts (T-031). */
export interface ClanTraitCombatModifiers {
  /** Added to crit chance (percentage points, pre-cap). */
  critChanceBonus: number;
  /** Added to crit damage multipliers (e.g. 0.25 → +25% crit mult). */
  critDamageBonus: number;
  /** Multiplier applied to enemy SPEED for hit/evasion checks. */
  enemySpeedMult: number;
  /** Multiplier applied to enemy evasion derived stat. */
  enemyEvasionMult: number;
  /** Flat chakra stolen from enemy on each successful hit. */
  chakraDrainOnHit: number;
  /** % of max HP healed once at combat start. */
  combatStartHealPercent: number;
  logs: string[];
}

/**
 * Pure aggregation of clan-trait combat effects from equipped artifacts.
 * Used by damage pipeline + combat start/on-hit passive processors.
 */
export function getClanTraitCombatModifiers(player: Player): ClanTraitCombatModifiers {
  const mods: ClanTraitCombatModifiers = {
    critChanceBonus: 0,
    critDamageBonus: 0,
    enemySpeedMult: 1,
    enemyEvasionMult: 1,
    chakraDrainOnHit: 0,
    combatStartHealPercent: 0,
    logs: [],
  };

  for (const trait of getClanTraitPassives(player)) {
    switch (trait) {
      case PassiveEffectType.CLAN_TRAIT_UCHIHA:
        mods.critChanceBonus += 12;
        mods.critDamageBonus += 0.25;
        mods.logs.push('Sharingan Implant: critical focus sharpened!');
        break;
      case PassiveEffectType.CLAN_TRAIT_HYUGA:
        mods.chakraDrainOnHit += 10;
        mods.logs.push('Byakugan Awakening: tenketsu disruption armed!');
        break;
      case PassiveEffectType.CLAN_TRAIT_NARA:
        mods.enemySpeedMult *= 0.8;
        mods.enemyEvasionMult *= 0.75;
        mods.logs.push('Shadow Mastery: enemy movement is bound!');
        break;
      case PassiveEffectType.CLAN_TRAIT_UZUMAKI:
        mods.combatStartHealPercent += 10;
        mods.logs.push('Uzumaki Vitality: life force surges!');
        break;
      default:
        break;
    }
  }

  return mods;
}

/**
 * Apply clan trait modifiers to attacker derived stats and defender primary/derived
 * for a single damage calculation (T-031).
 */
export function applyClanTraitToDamageContext(
  player: Player,
  attackerDerived: DerivedStats,
  defenderPrimary: PrimaryAttributes,
  defenderDerived: DerivedStats,
): {
  attackerDerived: DerivedStats;
  defenderPrimary: PrimaryAttributes;
  defenderDerived: DerivedStats;
  mods: ClanTraitCombatModifiers;
} {
  const mods = getClanTraitCombatModifiers(player);
  return {
    mods,
    attackerDerived: {
      ...attackerDerived,
      critChance: Math.min(75, attackerDerived.critChance + mods.critChanceBonus),
      critDamageMelee: attackerDerived.critDamageMelee + mods.critDamageBonus,
      critDamageRanged: attackerDerived.critDamageRanged + mods.critDamageBonus,
    },
    defenderPrimary: {
      ...defenderPrimary,
      speed: Math.max(1, Math.floor(defenderPrimary.speed * mods.enemySpeedMult)),
    },
    defenderDerived: {
      ...defenderDerived,
      evasion: Math.max(0, Math.floor(defenderDerived.evasion * mods.enemyEvasionMult)),
    },
  };
}
