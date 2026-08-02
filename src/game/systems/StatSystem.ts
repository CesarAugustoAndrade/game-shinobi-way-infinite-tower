/**
 * =============================================================================
 * STAT SYSTEM - Core Character Statistics Engine
 * =============================================================================
 *
 * This system handles all character stat calculations, from base attributes
 * through equipment and buffs to final derived combat values.
 *
 * ## STAT CALCULATION PIPELINE
 * The order of stat application is critical:
 * 1. Base Primary Stats (from clan + level ups)
 * 2. Equipment Bonuses (flat additions from gear)
 * 3. Passive Skill Bonuses (from PASSIVE action type skills)
 * 4. Buff Modifiers (multiplicative, applied last)
 * 5. Derived Stats (calculated from modified primary stats)
 *
 * ## PRIMARY STATS (9 Core Attributes)
 * Organized into 3 categories:
 *
 * ### BODY (Physical)
 * - WILLPOWER: HP pool, HP regen, Guts survival chance
 * - CHAKRA: Chakra pool size
 * - STRENGTH: Physical damage, Physical defense (flat + %)
 *
 * ### MIND (Mental)
 * - SPIRIT: Elemental defense (flat + %)
 * - INTELLIGENCE: Chakra regen, skill requirements
 * - CALMNESS: Mental defense, Status resistance
 *
 * ### TECHNIQUE (Combat Skills)
 * - SPEED: Melee hit rate, Evasion, Initiative
 * - ACCURACY: Ranged hit rate, Ranged crit damage
 * - DEXTERITY: Critical hit chance
 *
 * ## DEFENSE SYSTEM
 * Defense has two components that work together:
 * - FLAT Defense: Subtracts fixed damage (capped at 60% of incoming damage)
 * - PERCENT Defense: Reduces remaining damage by % (soft-capped at 75%)
 *
 * Percent defense uses diminishing returns formula:
 *   percentDef = stat / (stat + SOFT_CAP)
 * This prevents infinite stacking while rewarding investment.
 *
 * ## DAMAGE PROPERTIES
 * Skills can have different penetration behaviors:
 * - NORMAL: Both flat and % defense apply
 * - PIERCING: Ignores flat defense, only % applies
 * - ARMOR_BREAK: Ignores % defense, only flat applies
 * - TRUE damage (DamageType.TRUE): Bypasses ALL defense
 *
 * =============================================================================
 */

import {
  PrimaryAttributes,
  DerivedStats,
  CharacterStats,
  DamageType,
  DamageProperty,
  AttackMethod,
  Skill,
  Player,
  Enemy,
  DamageResult,
  ItemStatBonus,
  Item,
  ItemSlot,
  EquipmentSlot,
  Buff,
  EffectType,
  PrimaryStat,
  ElementType,
  STAT_FORMULAS,
  ActionType,
  PassiveBonuses
} from '../types';
import { ELEMENTAL_CYCLE } from '../constants';
import { BALANCE } from '../config';
import { LaunchProperties } from '../../config/featureFlags';
import { percentChance, chance } from '../utils/rng';

// ============================================================================
// PASSIVE SKILL BONUS AGGREGATOR
// ============================================================================

/**
 * Nature elements that can receive element-scoped damage bonuses
 * (e.g. FIRE_AFFINITY only buffs Fire skills).
 */
const NATURE_ELEMENTS: ReadonlySet<ElementType> = new Set([
  ElementType.FIRE,
  ElementType.WIND,
  ElementType.LIGHTNING,
  ElementType.EARTH,
  ElementType.WATER,
]);

// Re-export for callers that imported PassiveBonuses from StatSystem
export type { PassiveBonuses };

/**
 * Collects and sums all passive skill bonuses from a player's skill list.
 * Only processes skills with ActionType.PASSIVE and a valid passiveEffect.
 *
 * damageBonus is global unless the passive skill is itself a nature element
 * (FIRE/WIND/LIGHTNING/EARTH/WATER), in which case it is stored under
 * elementalDamageBonus for that element (e.g. FIRE_AFFINITY → Fire only).
 * Explicit `damageBonusElement` on the effect overrides that default.
 *
 * @param skills - Array of all player skills (active and passive)
 * @returns Aggregated PassiveBonuses object with summed values
 */
export function aggregatePassiveSkillBonuses(skills: Skill[]): PassiveBonuses {
  const bonuses: PassiveBonuses = {
    statBonus: {},
    damageBonus: 0,
    elementalDamageBonus: {},
    defenseBonus: 0,
    hpRegen: 0,
    chakraRegen: 0
  };

  if (!skills || !Array.isArray(skills)) return bonuses;

  skills.forEach(skill => {
    // Only process PASSIVE action type skills
    if (skill.actionType !== ActionType.PASSIVE) return;
    if (!skill.passiveEffect) return;

    const effect = skill.passiveEffect;

    // Aggregate stat bonuses
    if (effect.statBonus) {
      Object.entries(effect.statBonus).forEach(([key, value]) => {
        if (value !== undefined) {
          const statKey = key as keyof PrimaryAttributes;
          bonuses.statBonus[statKey] = (bonuses.statBonus[statKey] || 0) + value;
        }
      });
    }

    // Aggregate damage bonus (global or element-scoped)
    if (effect.damageBonus) {
      const elementFilter =
        effect.damageBonusElement ??
        (NATURE_ELEMENTS.has(skill.element) ? skill.element : undefined);

      if (elementFilter) {
        bonuses.elementalDamageBonus[elementFilter] =
          (bonuses.elementalDamageBonus[elementFilter] || 0) + effect.damageBonus;
      } else {
        bonuses.damageBonus += effect.damageBonus;
      }
    }

    // Aggregate defense bonus
    if (effect.defenseBonus) {
      bonuses.defenseBonus += effect.defenseBonus;
    }

    // Aggregate regen bonuses
    if (effect.regenBonus) {
      if (effect.regenBonus.hp) {
        bonuses.hpRegen += effect.regenBonus.hp;
      }
      if (effect.regenBonus.chakra) {
        bonuses.chakraRegen += effect.regenBonus.chakra;
      }
    }
  });

  return bonuses;
}

/**
 * Resolves the total passive damage multiplier bonus for a given attack element.
 * Combines global damageBonus with any matching elementalDamageBonus.
 *
 * @param passiveBonuses - Aggregated passive skill bonuses
 * @param skillElement - Element of the skill being used
 * @returns Combined damage bonus fraction (0.15 = +15%)
 */
export function resolvePassiveDamageBonus(
  passiveBonuses: PassiveBonuses | undefined,
  skillElement: ElementType
): number {
  if (!passiveBonuses) return 0;
  const elemental = passiveBonuses.elementalDamageBonus[skillElement] || 0;
  return passiveBonuses.damageBonus + elemental;
}

// ============================================================================
// PASSIVE STAT APPLICATOR
// ============================================================================

/**
 * Applies passive skill stat bonuses to primary attributes.
 * Creates a new object (immutable pattern) with bonuses added.
 *
 * @param baseStats - Current primary attributes before passive bonuses
 * @param passiveBonuses - Aggregated bonuses from passive skills
 * @returns New PrimaryAttributes object with bonuses applied
 */
export function applyPassiveBonusesToStats(
  baseStats: PrimaryAttributes,
  passiveBonuses: PassiveBonuses
): PrimaryAttributes {
  const modified = { ...baseStats };

  if (!passiveBonuses.statBonus) return modified;

  Object.entries(passiveBonuses.statBonus).forEach(([key, value]) => {
    if (value !== undefined) {
      const statKey = key as keyof PrimaryAttributes;
      if (statKey in modified) {
        modified[statKey] += value;
      }
    }
  });

  return modified;
}

// ============================================================================
// DERIVED STATS CALCULATOR
// ============================================================================

/**
 * Converts Primary Attributes into all Derived Combat Stats.
 * This is the core stat calculation function that generates all combat-relevant values.
 *
 * ## DERIVED STAT FORMULAS
 *
 * ### Resource Pools
 * - maxHp = 100 + (willpower × 12) + flatHp
 * - maxChakra = 50 + (chakra × 8) + flatChakra
 * - hpRegen = floor(maxHp × 1% × (willpower / 20))
 * - chakraRegen = floor(intelligence × 2)
 *
 * ### Defense (3 types, each has flat + %)
 * - Physical: strength → flat + % (protects vs DamageType.PHYSICAL)
 * - Elemental: spirit → flat + % (protects vs DamageType.ELEMENTAL)
 * - Mental: calmness → flat + % (protects vs DamageType.MENTAL)
 *
 * Flat Defense: stat × multiplier (linear scaling)
 * Percent Defense: stat / (stat + SOFT_CAP) (diminishing returns, max 75%)
 *
 * ### Hit Rates (base 85%, modified by target speed in combat)
 * - Melee: 85% + (speed × 0.3) - (defender_speed × 0.5)
 * - Ranged: 85% + (accuracy × 0.3) - (defender_speed × 0.5)
 * - Final hit chance clamped to 30-98% range
 *
 * ### Evasion (diminishing returns)
 * - evasion = speed / (speed + 100)
 *
 * ### Critical Hits
 * - critChance = 15% + (dexterity × 0.5) + equipment (max 75%)
 * - critDamageMelee = 1.5× base
 * - critDamageRanged = 1.5× + (accuracy × 0.05)
 * - Super effective hits: +20% crit chance bonus
 *
 * ### Combat Stats
 * - statusResistance = calmness / (calmness + 50)
 * - gutsChance = willpower / (willpower + 30) (survive lethal hit at 1 HP)
 * - initiative = 10 + (speed × 0.5)
 *
 * @param primary - Modified primary attributes (after equipment/passives/buffs).
 *   Primary-stat equipment bonuses must already be folded into this object
 *   (via applyEquipmentToPrimaryStats) — they are NOT re-applied here.
 * @param equipmentBonuses - Direct derived bonuses from equipment only
 *   (flatHp, flatChakra, flat/percent def, critChance, critDamage).
 *   Primary keys on this object are ignored to avoid double-counting.
 * @returns Complete DerivedStats object ready for combat
 */
export function calculateDerivedStats(
  primary: PrimaryAttributes,
  equipmentBonuses: ItemStatBonus = {}
): DerivedStats {
  const F = STAT_FORMULAS;

  // Use primary as-is. Equipment primaries are applied once upstream
  // (getPlayerFullStats → applyEquipmentToPrimaryStats) so re-adding them
  // here would double-count willpower/strength/etc. into maxHp and defenses.
  const effective = primary;

  // ─────────────────────────────────────────────────────────────────────────
  // RESOURCE POOLS - HP and Chakra capacity
  // ─────────────────────────────────────────────────────────────────────────
  const maxHp = F.HP_BASE + (effective.willpower * F.HP_PER_WILLPOWER) + (equipmentBonuses.flatHp || 0);
  const maxChakra = F.CHAKRA_BASE + (effective.chakra * F.CHAKRA_PER_CHAKRA) + (equipmentBonuses.flatChakra || 0);

  // ─────────────────────────────────────────────────────────────────────────
  // REGENERATION - Per-turn resource recovery
  // HP regen scales with both max HP AND willpower (double scaling)
  // Chakra regen is purely intelligence-based
  // ─────────────────────────────────────────────────────────────────────────
  const hpRegen = Math.floor(maxHp * F.HP_REGEN_PERCENT * (effective.willpower / BALANCE.HP_REGEN_WILLPOWER_DIVISOR));
  const chakraRegen = Math.floor(effective.intelligence * F.CHAKRA_REGEN_PER_INT);

  // ─────────────────────────────────────────────────────────────────────────
  // FLAT DEFENSE - Linear scaling, subtracts fixed damage amount
  // Applied FIRST in damage calculation, capped at 60% of incoming damage
  // ─────────────────────────────────────────────────────────────────────────
  const physicalDefenseFlat = Math.floor(effective.strength * F.FLAT_PHYS_DEF_PER_STR) + (equipmentBonuses.flatPhysicalDef || 0);
  const elementalDefenseFlat = Math.floor(effective.spirit * F.FLAT_ELEM_DEF_PER_SPIRIT) + (equipmentBonuses.flatElementalDef || 0);
  const mentalDefenseFlat = Math.floor(effective.calmness * F.FLAT_MENTAL_DEF_PER_CALM) + (equipmentBonuses.flatMentalDef || 0);

  // ─────────────────────────────────────────────────────────────────────────
  // PERCENT DEFENSE - Diminishing returns formula: stat / (stat + SOFT_CAP)
  // Applied SECOND after flat reduction, hard-capped at 75%
  // Example: 50 strength with SOFT_CAP=100 → 50/(50+100) = 33% reduction
  // ─────────────────────────────────────────────────────────────────────────
  const physicalDefensePercent = Math.min(0.75,
    (effective.strength / (effective.strength + F.PHYSICAL_DEF_SOFT_CAP)) + (equipmentBonuses.percentPhysicalDef || 0)
  );
  const elementalDefensePercent = Math.min(0.75,
    (effective.spirit / (effective.spirit + F.ELEMENTAL_DEF_SOFT_CAP)) + (equipmentBonuses.percentElementalDef || 0)
  );
  const mentalDefensePercent = Math.min(0.75,
    (effective.calmness / (effective.calmness + F.MENTAL_DEF_SOFT_CAP)) + (equipmentBonuses.percentMentalDef || 0)
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STATUS & SURVIVAL - Crowd control resistance and death prevention
  // Both use diminishing returns formulas
  // ─────────────────────────────────────────────────────────────────────────
  const statusResistance = effective.calmness / (effective.calmness + F.STATUS_RESIST_SOFT_CAP);
  const gutsChance = effective.willpower / (effective.willpower + F.GUTS_SOFT_CAP);

  // ─────────────────────────────────────────────────────────────────────────
  // HIT RATES - Base accuracy before defender's evasion is applied
  // In combat, defender's speed reduces these values
  // ─────────────────────────────────────────────────────────────────────────
  const meleeHitRate = F.BASE_HIT_CHANCE + (effective.speed * BALANCE.HIT_RATE_SCALING);
  const rangedHitRate = F.BASE_HIT_CHANCE + (effective.accuracy * BALANCE.HIT_RATE_SCALING);

  // ─────────────────────────────────────────────────────────────────────────
  // EVASION - Chance to completely avoid attacks (separate from miss)
  // Uses diminishing returns, checked AFTER hit roll succeeds
  // ─────────────────────────────────────────────────────────────────────────
  const evasion = effective.speed / (effective.speed + F.EVASION_SOFT_CAP);

  // ─────────────────────────────────────────────────────────────────────────
  // CRITICAL HITS - Chance and multiplier for bonus damage
  // Ranged attacks get bonus crit damage from accuracy
  // ─────────────────────────────────────────────────────────────────────────
  const critChance = Math.min(75, F.BASE_CRIT_CHANCE + (effective.dexterity * F.CRIT_PER_DEX) + (equipmentBonuses.critChance || 0));
  const critDamageMelee = F.BASE_CRIT_MULT + (equipmentBonuses.critDamage || 0);
  const critDamageRanged = F.BASE_CRIT_MULT + (effective.accuracy * F.RANGED_CRIT_BONUS_PER_ACC) + (equipmentBonuses.critDamage || 0);

  // ─────────────────────────────────────────────────────────────────────────
  // INITIATIVE - Determines turn order in combat (higher = acts first)
  // ─────────────────────────────────────────────────────────────────────────
  const initiative = F.INIT_BASE + (effective.speed * F.INIT_PER_SPEED);

  // ─────────────────────────────────────────────────────────────────────────
  // ACTION POINTS - Per-turn AP budget for the deckbuilder economy (T-004)
  // Faster shinobi play more cards per turn. Purely additive: this value is
  // not yet consumed by the combat flow (wired up in a later phase).
  // ─────────────────────────────────────────────────────────────────────────
  const actionPointsPerTurn = LaunchProperties.AP_BASE + Math.floor(effective.speed / LaunchProperties.AP_PER_SPEED_DIV);

  return {
    maxHp,
    currentHp: maxHp,
    maxChakra,
    currentChakra: maxChakra,
    hpRegen,
    chakraRegen,
    physicalDefenseFlat,
    elementalDefenseFlat,
    mentalDefenseFlat,
    physicalDefensePercent,
    elementalDefensePercent,
    mentalDefensePercent,
    statusResistance,
    gutsChance,
    meleeHitRate,
    rangedHitRate,
    evasion,
    critChance,
    critDamageMelee,
    critDamageRanged,
    initiative,
    actionPointsPerTurn
  };
}

// ============================================================================
// EQUIPMENT BONUS AGGREGATOR
// Combines all equipped items into a single bonus object
// ============================================================================
export function aggregateEquipmentBonuses(equipment: Record<EquipmentSlot, Item | null>): ItemStatBonus {
  const bonuses: ItemStatBonus = {};

  Object.entries(equipment).forEach(([slot, item]) => {
    if (!item || !item.stats) return;

    // PRIMARY slot (SLOT_1) gets 50% stat bonus
    const multiplier = slot === EquipmentSlot.SLOT_1 ? BALANCE.PRIMARY_SLOT_MULTIPLIER : 1.0;

    const stats = item.stats;
    (Object.keys(stats) as Array<keyof ItemStatBonus>).forEach(key => {
      const value = stats[key];
      if (value !== undefined) {
        bonuses[key] = (bonuses[key] || 0) + Math.floor(value * multiplier);
      }
    });
  });

  return bonuses;
}

// ============================================================================
// EQUIPMENT BONUS APPLICATOR
// Applies equipment bonuses to primary attributes
// ============================================================================
export function applyEquipmentToPrimaryStats(
  baseStats: PrimaryAttributes,
  equipmentBonuses: ItemStatBonus
): PrimaryAttributes {
  return {
    willpower: baseStats.willpower + (equipmentBonuses.willpower || 0),
    chakra: baseStats.chakra + (equipmentBonuses.chakra || 0),
    strength: baseStats.strength + (equipmentBonuses.strength || 0),
    spirit: baseStats.spirit + (equipmentBonuses.spirit || 0),
    intelligence: baseStats.intelligence + (equipmentBonuses.intelligence || 0),
    calmness: baseStats.calmness + (equipmentBonuses.calmness || 0),
    speed: baseStats.speed + (equipmentBonuses.speed || 0),
    accuracy: baseStats.accuracy + (equipmentBonuses.accuracy || 0),
    dexterity: baseStats.dexterity + (equipmentBonuses.dexterity || 0),
  };
}

// ============================================================================
// BUFF MODIFIER CALCULATOR
// Applies active buff/debuff modifiers to primary stats
// ============================================================================
export function applyBuffsToPrimaryStats(
  baseStats: PrimaryAttributes,
  buffs: Buff[]
): PrimaryAttributes {
  const modified = { ...baseStats };

  // Safely handle undefined or malformed buffs
  if (!buffs || !Array.isArray(buffs)) return modified;

  buffs.forEach(buff => {
    // Skip undefined or malformed buffs
    if (!buff || !buff.effect) return;

    if (buff.effect.type === EffectType.BUFF || buff.effect.type === EffectType.DEBUFF) {
      const targetStat = buff.effect.targetStat;
      const value = buff.effect.value || 0;

      if (targetStat) {
        const statKey = targetStat.toLowerCase() as keyof PrimaryAttributes;
        if (statKey in modified) {
          const multiplier = buff.effect.type === EffectType.BUFF ? (1 + value) : (1 - value);
          modified[statKey] = Math.floor(modified[statKey] * multiplier);
        }
      }
    }
  });

  return modified;
}

// ============================================================================
// FULL CHARACTER STATS CALCULATOR
// Gets the complete stat picture for a player
// Calculation order: Base -> Equipment -> Passive Skills -> Buffs
// ============================================================================
export function getPlayerFullStats(player: Player): {
  primary: PrimaryAttributes;
  effectivePrimary: PrimaryAttributes;
  derived: DerivedStats;
  equipmentBonuses: ItemStatBonus;
  passiveBonuses: PassiveBonuses;
} {
  // 1. Equipment bonuses
  const equipmentBonuses = aggregateEquipmentBonuses(player.equipment);

  // 2. Passive skill bonuses
  const passiveBonuses = aggregatePassiveSkillBonuses(player.skills);

  // 3. Apply bonuses in order: Base -> Equipment -> Passive -> Buffs
  const withEquipment = applyEquipmentToPrimaryStats(player.primaryStats, equipmentBonuses);
  const withPassives = applyPassiveBonusesToStats(withEquipment, passiveBonuses);
  const effectivePrimary = applyBuffsToPrimaryStats(withPassives, player.activeBuffs);

  // 4. Calculate derived stats (equipment primaries already in effectivePrimary;
  //    only flat/percent derived gear bonuses are applied inside)
  const derived = calculateDerivedStats(effectivePrimary, equipmentBonuses);

  // 5. Apply passive regen bonuses to derived stats
  derived.chakraRegen += passiveBonuses.chakraRegen;
  derived.hpRegen += passiveBonuses.hpRegen;

  // 6. Apply passive defenseBonus to all percent defenses (soft-capped at 75%)
  if (passiveBonuses.defenseBonus > 0) {
    derived.physicalDefensePercent = Math.min(
      0.75,
      derived.physicalDefensePercent + passiveBonuses.defenseBonus
    );
    derived.elementalDefensePercent = Math.min(
      0.75,
      derived.elementalDefensePercent + passiveBonuses.defenseBonus
    );
    derived.mentalDefensePercent = Math.min(
      0.75,
      derived.mentalDefensePercent + passiveBonuses.defenseBonus
    );
  }

  return {
    primary: player.primaryStats,
    effectivePrimary,
    derived,
    equipmentBonuses,
    passiveBonuses
  };
}

// ============================================================================
// ENEMY STATS CALCULATOR
// ============================================================================
export function getEnemyFullStats(enemy: Enemy): {
  primary: PrimaryAttributes;
  effectivePrimary: PrimaryAttributes;
  derived: DerivedStats;
} {
  const buffedPrimary = applyBuffsToPrimaryStats(enemy.primaryStats, enemy.activeBuffs);
  const derived = calculateDerivedStats(buffedPrimary, {});

  return {
    primary: enemy.primaryStats,
    effectivePrimary: buffedPrimary,
    derived
  };
}

// ============================================================================
// EFFECTIVE ATK HELPER
// ============================================================================

/**
 * Compute the player's effective primary attack stat for power-curve tracking.
 *
 * Maps the player's element to the relevant attack formula (from CLAUDE.md):
 *   Physical  → strength × 2 + dexterity × 0.5
 *   Elemental → spirit × 2 + intelligence × 0.5
 *   Mental    → intelligence × 1.5 + calmness × 1
 *
 * Calls `getPlayerFullStats` internally so equipment and passive bonuses are
 * already applied to the stats used in the formula.
 */
export function getEffectiveAtk(player: Player): number {
  const p = getPlayerFullStats(player).effectivePrimary;
  switch (player.element) {
    case ElementType.FIRE:
    case ElementType.LIGHTNING:
    case ElementType.WATER:
    case ElementType.EARTH:
    case ElementType.WIND:
      return p.spirit * 2 + p.intelligence * 0.5;
    case ElementType.MENTAL:
      return p.intelligence * 1.5 + p.calmness * 1;
    case ElementType.PHYSICAL:
    default:
      return p.strength * 2 + p.dexterity * 0.5;
  }
}

// ============================================================================
// DAMAGE CALCULATOR - THE CORE COMBAT MATH
// ============================================================================

/**
 * Optional modifiers for calculateDamage.
 * damageBonus is the passive-skill multiplier (global + element-scoped).
 * Other fields wire equipped artifact passives into real damage.
 */
export interface CalculateDamageOptions {
  /** Passive skill damage bonus fraction (0.15 = +15%) */
  damageBonus?: number;
  /** Artifact: permanent % of defense ignored (0-100) */
  defenseBypass?: number;
  /** Artifact: extra % defense ignored on crits (0-100) */
  critDefenseBypass?: number;
  /** Artifact: treat matchup as always super-effective (ALL_ELEMENTS) */
  forceSuperEffective?: boolean;
  /** Artifact: % of PHYSICAL damage resolved against elemental defense (0-100) */
  convertToElementalPercent?: number;
  /**
   * Skip hit/miss and evasion rolls (always connect).
   * Used by UI damage previews so tooltips do not flicker between hit/miss.
   */
  forceHit?: boolean;
  /**
   * Override crit roll: `true` always crits, `false` never crits.
   * `undefined` keeps normal RNG. Previews use `false` for stable non-crit numbers.
   */
  forceCrit?: boolean;
}

/**
 * Apply flat + % defense for a raw damage slice, respecting damage property.
 */
function applyDefenseSlice(
  raw: number,
  flatDef: number,
  percentDef: number,
  damageProperty: DamageProperty | undefined
): { after: number; flatReduction: number; percentReduction: number } {
  let damageAfterDefense = raw;
  let flatReduction = 0;
  let percentReduction = 0;

  if (damageProperty === DamageProperty.PIERCING) {
    flatReduction = 0;
    percentReduction = Math.floor(damageAfterDefense * percentDef);
    damageAfterDefense -= percentReduction;
  } else if (damageProperty === DamageProperty.ARMOR_BREAK) {
    flatReduction = Math.min(flatDef, damageAfterDefense * BALANCE.FLAT_DEFENSE_MAX_REDUCTION);
    damageAfterDefense -= flatReduction;
    percentReduction = 0;
  } else {
    // NORMAL (default): flat then %
    flatReduction = Math.min(flatDef, damageAfterDefense * BALANCE.FLAT_DEFENSE_MAX_REDUCTION);
    damageAfterDefense -= flatReduction;
    percentReduction = Math.floor(damageAfterDefense * percentDef);
    damageAfterDefense -= percentReduction;
  }

  return { after: damageAfterDefense, flatReduction, percentReduction };
}

/**
 * The core damage calculation function used for all combat attacks.
 * Handles the complete damage pipeline from raw damage to final result.
 *
 * ## DAMAGE CALCULATION PIPELINE
 * 1. Hit/Miss + Evasion
 * 2. Base damage (scalingStat × damageMult) + passive damageBonus
 * 3. Elemental effectiveness (ALL_ELEMENTS can force SE)
 * 4. Critical hit (+ critDefenseBypass when crit)
 * 5. Defense (pierce / convert-to-elemental / property)
 *
 * @param options - Optional modifiers. Also accepts a bare number as legacy damageBonus.
 */
export function calculateDamage(
  attackerPrimary: PrimaryAttributes,
  attackerDerived: DerivedStats,
  defenderPrimary: PrimaryAttributes,
  defenderDerived: DerivedStats,
  skill: Skill,
  attackerElement: ElementType,
  defenderElement: ElementType,
  options: CalculateDamageOptions | number = {}
): DamageResult {
  // Accept legacy bare-number damageBonus for convenience
  const opts: CalculateDamageOptions =
    typeof options === 'number' ? { damageBonus: options } : options;
  const damageBonus = opts.damageBonus ?? 0;
  const result: DamageResult = {
    rawDamage: 0,
    flatReduction: 0,
    percentReduction: 0,
    finalDamage: 0,
    isCrit: false,
    isMiss: false,
    isEvaded: false,
    elementMultiplier: 1.0,
    gutsTriggered: false
  };

  // ========================================
  // STEP 1: HIT/MISS CHECK
  // ========================================
  // forceHit skips both miss and evasion so previews / tests stay deterministic.
  if (!opts.forceHit && skill.attackMethod !== AttackMethod.AUTO) {
    let hitChance: number;

    if (skill.attackMethod === AttackMethod.MELEE) {
      hitChance = attackerDerived.meleeHitRate - (defenderPrimary.speed * BALANCE.EVASION_SCALING);
    } else {
      hitChance = attackerDerived.rangedHitRate - (defenderPrimary.speed * BALANCE.EVASION_SCALING);
    }

    hitChance = Math.max(30, Math.min(98, hitChance)); // Clamp 30-98%

    if (!percentChance(hitChance)) {
      result.isMiss = true;
      return result;
    }

    if (chance(defenderDerived.evasion)) {
      result.isEvaded = true;
      return result;
    }
  }

  // ========================================
  // STEP 2: BASE DAMAGE CALCULATION
  // ========================================
  const scalingStatKey = skill.scalingStat.toLowerCase() as keyof PrimaryAttributes;
  const scalingValue = attackerPrimary[scalingStatKey] || 10;
  result.rawDamage = Math.floor(scalingValue * skill.damageMult);

  // ========================================
  // STEP 2b: PASSIVE DAMAGE BONUS
  // ========================================
  if (damageBonus > 0) {
    result.rawDamage = Math.floor(result.rawDamage * (1 + damageBonus));
  }

  // ========================================
  // STEP 3: ELEMENTAL EFFECTIVENESS
  // ========================================
  if (opts.forceSuperEffective) {
    result.elementMultiplier = 1.2;
  } else if (skill.element !== ElementType.PHYSICAL && skill.element !== ElementType.MENTAL) {
    if (ELEMENTAL_CYCLE[skill.element] === defenderElement) {
      result.elementMultiplier = 1.2; // Super effective
    } else if (ELEMENTAL_CYCLE[defenderElement] === skill.element) {
      result.elementMultiplier = 0.8; // Resisted
    }
  }
  result.rawDamage = Math.floor(result.rawDamage * result.elementMultiplier);

  // ========================================
  // STEP 4: CRITICAL HIT
  // ========================================
  let effectiveCritChance = attackerDerived.critChance + (skill.critBonus || 0);

  if (result.elementMultiplier > 1.0) {
    effectiveCritChance += 10;
  }

  effectiveCritChance = Math.min(95, effectiveCritChance);

  const doesCrit =
    opts.forceCrit === true
      ? true
      : opts.forceCrit === false
        ? false
        : percentChance(effectiveCritChance);

  if (doesCrit) {
    result.isCrit = true;
    const critMult = skill.attackMethod === AttackMethod.RANGED
      ? attackerDerived.critDamageRanged
      : attackerDerived.critDamageMelee;
    result.rawDamage = Math.floor(result.rawDamage * critMult);
  }

  // ========================================
  // STEP 5: DEFENSE APPLICATION
  // ========================================
  const bypassPct = Math.min(
    100,
    (opts.defenseBypass || 0) + (result.isCrit ? (opts.critDefenseBypass || 0) : 0)
  ) / 100;
  const defMult = 1 - bypassPct;

  const scaledDef = (type: DamageType): { flat: number; percent: number } => {
    if (type === DamageType.TRUE) return { flat: 0, percent: 0 };
    let flat = 0;
    let percent = 0;
    if (type === DamageType.PHYSICAL) {
      flat = defenderDerived.physicalDefenseFlat;
      percent = defenderDerived.physicalDefensePercent;
    } else if (type === DamageType.ELEMENTAL) {
      flat = defenderDerived.elementalDefenseFlat;
      percent = defenderDerived.elementalDefensePercent;
    } else if (type === DamageType.MENTAL) {
      flat = defenderDerived.mentalDefenseFlat;
      percent = defenderDerived.mentalDefensePercent;
    }
    if (skill.penetration) {
      percent = percent * (1 - skill.penetration);
    }
    return { flat: flat * defMult, percent: percent * defMult };
  };

  const convertPct = Math.min(100, Math.max(0, opts.convertToElementalPercent || 0));
  const canConvert = convertPct > 0 && skill.damageType === DamageType.PHYSICAL;

  // Min-1 chip only when the skill actually dealt damage. Utility/heal kits with
  // damageMult 0 must not poke the enemy for 1 (was Math.max(1, 0) → 1).
  const floorDamage = (afterDefense: number): number => {
    const floored = Math.floor(afterDefense);
    if (result.rawDamage <= 0) return 0;
    return Math.max(1, floored);
  };

  if (skill.damageType === DamageType.TRUE) {
    result.flatReduction = 0;
    result.percentReduction = 0;
    result.finalDamage = floorDamage(result.rawDamage);
    return result;
  }

  if (canConvert) {
    const ratio = convertPct / 100;
    const physRaw = result.rawDamage * (1 - ratio);
    const elemRaw = result.rawDamage * ratio;
    const physDef = scaledDef(DamageType.PHYSICAL);
    const elemDef = scaledDef(DamageType.ELEMENTAL);
    const physSlice = applyDefenseSlice(physRaw, physDef.flat, physDef.percent, skill.damageProperty);
    const elemSlice = applyDefenseSlice(elemRaw, elemDef.flat, elemDef.percent, skill.damageProperty);
    result.flatReduction = physSlice.flatReduction + elemSlice.flatReduction;
    result.percentReduction = physSlice.percentReduction + elemSlice.percentReduction;
    result.finalDamage = floorDamage(physSlice.after + elemSlice.after);
    return result;
  }

  const damageType = skill.damageType || DamageType.PHYSICAL;
  const { flat: flatDef, percent: percentDef } = scaledDef(damageType);
  const slice = applyDefenseSlice(result.rawDamage, flatDef, percentDef, skill.damageProperty);
  result.flatReduction = slice.flatReduction;
  result.percentReduction = slice.percentReduction;
  result.finalDamage = floorDamage(slice.after);

  return result;
}

/**
 * Deterministic damage preview for UI tooltips / AI evaluation.
 * Always hits and never crits so numbers stay stable across re-renders
 * (avoids hit/miss and CRIT flicker while hovering a skill card).
 *
 * Same signature as {@link calculateDamage}; merges `forceHit: true` and
 * `forceCrit: false` into options (call-site flags for those keys are overridden).
 */
export function previewDamage(
  attackerPrimary: PrimaryAttributes,
  attackerDerived: DerivedStats,
  defenderPrimary: PrimaryAttributes,
  defenderDerived: DerivedStats,
  skill: Skill,
  attackerElement: ElementType,
  defenderElement: ElementType,
  options: CalculateDamageOptions | number = {}
): DamageResult {
  const opts: CalculateDamageOptions =
    typeof options === 'number' ? { damageBonus: options } : { ...options };
  return calculateDamage(
    attackerPrimary,
    attackerDerived,
    defenderPrimary,
    defenderDerived,
    skill,
    attackerElement,
    defenderElement,
    { ...opts, forceHit: true, forceCrit: false }
  );
}

// ============================================================================
// GUTS CHECK - Survival mechanic
// ============================================================================

/**
 * Checks if a character survives a lethal hit through the "Guts" mechanic.
 * Guts is a last-stand ability that gives a chance to survive at 1 HP.
 *
 * This mechanic is inspired by fighting games where characters can survive
 * a killing blow with a small amount of health remaining.
 *
 * ## Guts Chance Formula
 * gutsChance = willpower / (willpower + GUTS_SOFT_CAP)
 * - Uses diminishing returns (same formula as other survival stats)
 * - Higher willpower = higher survival chance
 * - Typical range: 0-30% for normal characters
 *
 * ## When Guts Triggers
 * - Only checked when damage would reduce HP to 0 or below
 * - On success: HP set to 1, character survives
 * - On failure: HP set to 0, character dies
 *
 * @param currentHp - Character's current HP before damage
 * @param incomingDamage - Amount of damage being dealt
 * @param gutsChance - Probability of triggering Guts (0.0 to 1.0)
 * @returns Object with survival status and new HP value
 */
export function checkGuts(
  currentHp: number,
  incomingDamage: number,
  gutsChance: number
): { survived: boolean; newHp: number } {
  const potentialHp = currentHp - incomingDamage;

  if (potentialHp <= 0) {
    // Death territory - check for Guts
    if (chance(gutsChance)) {
      return { survived: true, newHp: 1 };
    }
    return { survived: false, newHp: 0 };
  }

  return { survived: true, newHp: potentialHp };
}

// ============================================================================
// STATUS RESISTANCE CHECK
// ============================================================================

/**
 * Determines if a status effect successfully applies to a target.
 * Uses the target's status resistance to reduce the application chance.
 *
 * ## Status Resistance Formula
 * effectiveChance = baseChance × (1 - statusResistance)
 *
 * Example: 80% stun chance vs 50% resistance = 80% × 0.5 = 40% effective chance
 *
 * @param statusChance - Base chance of the status effect (0.0 to 1.0)
 * @param statusResistance - Target's resistance stat (0.0 to 1.0)
 * @returns true if status effect applies, false if resisted
 */
export function resistStatus(
  statusChance: number,
  statusResistance: number
): boolean {
  const effectiveChance = statusChance * (1 - statusResistance);
  return chance(effectiveChance);
}

// ============================================================================
// SKILL REQUIREMENT CHECK
// ============================================================================
/**
 * Check whether a player may learn a skill.
 *
 * - Open learn: any skill without `requirements.clan` is available to all clans.
 * - Clan hard-gate: if `requirements.clan` is set, only that clan may learn it.
 * - Stats: `requirements.stats` (any PrimaryStat) plus legacy `intelligence`.
 *
 * @param skill - Skill to learn
 * @param primaryStats - Player effective primary stats (or a partial with at least intelligence for legacy callers)
 * @param playerLevel - Player level
 * @param playerClan - Player clan string
 */
export function canLearnSkill(
  skill: Skill,
  primaryStats: Partial<PrimaryAttributes> | number,
  playerLevel: number,
  playerClan: string
): { canLearn: boolean; reason?: string } {
  // Legacy overload: second arg was playerIntelligence: number
  const stats: Record<string, number> =
    typeof primaryStats === 'number'
      ? { Intelligence: primaryStats, intelligence: primaryStats }
      : Object.fromEntries(
          Object.entries(primaryStats as object).filter(
            ([, v]) => typeof v === 'number',
          ) as [string, number][],
        );

  const getStat = (name: string): number => {
    const direct = stats[name];
    if (typeof direct === 'number') return direct;
    // Case-insensitive / enum-value lookup
    const hit = Object.entries(stats).find(
      ([k]) => k.toLowerCase() === name.toLowerCase()
    );
    return typeof hit?.[1] === 'number' ? hit[1] : 0;
  };

  if (!skill.requirements) {
    return { canLearn: true };
  }

  const req = skill.requirements;

  if (req.stats) {
    for (const [statKey, min] of Object.entries(req.stats)) {
      if (min === undefined) continue;
      const have = getStat(statKey);
      if (have < min) {
        return {
          canLearn: false,
          reason: `Requires ${min} ${statKey} (you have ${Math.floor(have)})`,
        };
      }
    }
  }

  // Legacy intelligence field (catalog migration)
  if (req.intelligence !== undefined) {
    const have = getStat('Intelligence') || getStat('intelligence');
    if (have < req.intelligence) {
      return {
        canLearn: false,
        reason: `Requires ${req.intelligence} Intelligence (you have ${Math.floor(have)})`,
      };
    }
  }

  if (req.level && playerLevel < req.level) {
    return {
      canLearn: false,
      reason: `Requires Level ${req.level}`,
    };
  }

  if (req.clan && req.clan !== playerClan) {
    return {
      canLearn: false,
      reason: `Requires ${req.clan} bloodline`,
    };
  }

  return { canLearn: true };
}

// ============================================================================
// DOT DAMAGE CALCULATOR
// ============================================================================

/**
 * Calculates damage from Damage-over-Time effects (Bleed, Burn, Poison).
 * DoT damage has special interactions with defense - it's only partially mitigated.
 *
 * ## DoT Defense Interaction
 * DoT effects receive REDUCED defense mitigation compared to direct attacks:
 * - Flat defense: Applied at 50% efficiency (half reduction)
 * - Percent defense: Applied at 50% efficiency
 * - Minimum damage: 1 (DoTs always deal at least 1 damage)
 *
 * ## DoT Types by Damage Type
 * - PHYSICAL DoTs (Bleed): Mitigated by physical defense
 * - ELEMENTAL DoTs (Burn): Mitigated by elemental defense
 * - TRUE DoTs (Poison, Amaterasu): Bypass ALL defense
 *
 * ## DoT Damage Properties
 * - NORMAL: Both flat and % defense apply (at 50% each)
 * - PIERCING: Only % defense applies (at 50%)
 * - TRUE: No defense applies
 *
 * @param dotValue - Base damage per tick of the DoT effect
 * @param dotDamageType - Type of damage (defaults to PHYSICAL)
 * @param dotDamageProperty - Damage property (defaults to NORMAL)
 * @param defenderDerived - Defender's calculated stats for defense values
 * @returns Final DoT damage after defense reduction
 */
export function calculateDotDamage(
  dotValue: number,
  dotDamageType: DamageType | undefined,
  dotDamageProperty: DamageProperty | undefined,
  defenderDerived: DerivedStats
): number {
  const type = dotDamageType || DamageType.PHYSICAL;
  const property = dotDamageProperty || DamageProperty.NORMAL;

  // TRUE damage DoTs (like Poison or Amaterasu) bypass defense
  if (type === DamageType.TRUE) {
    return dotValue;
  }

  // Get appropriate defense
  let flatDef = 0;
  let percentDef = 0;

  if (type === DamageType.PHYSICAL) {
    flatDef = defenderDerived.physicalDefenseFlat;
    percentDef = defenderDerived.physicalDefensePercent;
  } else if (type === DamageType.ELEMENTAL) {
    flatDef = defenderDerived.elementalDefenseFlat;
    percentDef = defenderDerived.elementalDefensePercent;
  }

  // Apply damage property
  let damage = dotValue;

  if (property === DamageProperty.NORMAL) {
    const flatRed = Math.min(flatDef * BALANCE.DOT_FLAT_DEFENSE_MULT, damage * BALANCE.DOT_FLAT_CAP);
    damage -= flatRed;
    damage -= Math.floor(damage * percentDef * BALANCE.DOT_PERCENT_DEFENSE_MULT);
  } else if (property === DamageProperty.PIERCING) {
    damage -= Math.floor(damage * percentDef * BALANCE.DOT_PERCENT_DEFENSE_MULT);
  }

  return Math.max(1, Math.floor(damage));
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================
export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatStat(value: number): string {
  return Math.floor(value).toString();
}

export function getDefenseBreakdown(derived: DerivedStats): {
  physical: { flat: number; percent: string };
  elemental: { flat: number; percent: string };
  mental: { flat: number; percent: string };
} {
  return {
    physical: {
      flat: derived.physicalDefenseFlat,
      percent: formatPercent(derived.physicalDefensePercent)
    },
    elemental: {
      flat: derived.elementalDefenseFlat,
      percent: formatPercent(derived.elementalDefensePercent)
    },
    mental: {
      flat: derived.mentalDefenseFlat,
      percent: formatPercent(derived.mentalDefensePercent)
    }
  };
}