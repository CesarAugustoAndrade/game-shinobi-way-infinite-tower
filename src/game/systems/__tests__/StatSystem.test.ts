/**
 * StatSystem Unit Tests
 * Tests critical stat calculation functions
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDerivedStats,
  calculateDotDamage,
  applyBuffsToPrimaryStats,
  checkGuts,
  calculateDamage,
  previewDamage,
  aggregateEquipmentBonuses,
  aggregatePassiveSkillBonuses,
  resolvePassiveDamageBonus,
  getPlayerFullStats,
  resistStatus,
  canLearnSkill,
} from '../StatSystem';
import { getElementEffectiveness } from '../../constants';
import { SKILLS } from '../../constants';
import { ElementType, EquipmentSlot, Clan, AttackMethod, SkillTier, ActionType } from '../../types';
import { STAT_FORMULAS, DamageType, DamageProperty } from '../../types';
import {
  BASE_STATS,
  HIGH_STATS,
  ZERO_STATS,
  createStatBuff,
  createStatDebuff,
  createMockSkill,
  createMockComponent,
  createMockPlayer,
} from './testFixtures';
import { PrimaryStat } from '../../types';

const F = STAT_FORMULAS;

describe('calculateDerivedStats', () => {
  describe('resource pools', () => {
    it('calculates maxHp correctly', () => {
      const derived = calculateDerivedStats(BASE_STATS, {});
      // Formula: HP_BASE + (willpower × HP_PER_WILLPOWER)
      // 50 + (10 × 12) = 170
      expect(derived.maxHp).toBe(F.HP_BASE + BASE_STATS.willpower * F.HP_PER_WILLPOWER);
    });

    it('calculates maxChakra correctly', () => {
      const derived = calculateDerivedStats(BASE_STATS, {});
      // Formula: CHAKRA_BASE + (chakra × CHAKRA_PER_CHAKRA)
      // 30 + (10 × 8) = 110
      expect(derived.maxChakra).toBe(F.CHAKRA_BASE + BASE_STATS.chakra * F.CHAKRA_PER_CHAKRA);
    });
  });

  describe('soft caps', () => {
    it('caps critChance at 75%', () => {
      // Need very high dex to hit cap: (75 - 8) / 0.5 = 134
      const maxCritStats = { ...HIGH_STATS, dexterity: 200 };
      const derived = calculateDerivedStats(maxCritStats, {});
      expect(derived.critChance).toBe(75);
    });

    it('caps percent defense at 75%', () => {
      const derived = calculateDerivedStats(HIGH_STATS, {});
      // All defense types should be capped
      expect(derived.physicalDefensePercent).toBeLessThanOrEqual(0.75);
      expect(derived.elementalDefensePercent).toBeLessThanOrEqual(0.75);
      expect(derived.mentalDefensePercent).toBeLessThanOrEqual(0.75);
    });
  });

  describe('edge cases', () => {
    it('handles zero stats without errors', () => {
      const derived = calculateDerivedStats(ZERO_STATS, {});
      expect(derived.maxHp).toBe(F.HP_BASE); // Base HP only
      expect(derived.maxChakra).toBe(F.CHAKRA_BASE); // Base chakra only
      expect(derived.critChance).toBe(F.BASE_CRIT_CHANCE); // Base crit only
    });
  });
});

describe('applyBuffsToPrimaryStats', () => {
  it('applies buff multipliers (+25%) to targeted stat', () => {
    // Buffs only affect their targetStat
    const buff = createStatBuff(0.25, 3, PrimaryStat.STRENGTH);
    const result = applyBuffsToPrimaryStats(BASE_STATS, [buff]);

    // Only strength should be increased by 25%
    expect(result.strength).toBe(Math.floor(BASE_STATS.strength * 1.25));
    // Other stats unchanged
    expect(result.willpower).toBe(BASE_STATS.willpower);
  });

  it('applies debuff multipliers (-25%) to targeted stat', () => {
    const debuff = createStatDebuff(0.25, 3, PrimaryStat.STRENGTH);
    const result = applyBuffsToPrimaryStats(BASE_STATS, [debuff]);

    // Only strength should be decreased by 25%
    expect(result.strength).toBe(Math.floor(BASE_STATS.strength * 0.75));
    // Other stats unchanged
    expect(result.willpower).toBe(BASE_STATS.willpower);
  });

  it('ignores buffs without targetStat', () => {
    // Generic buff without targetStat should not affect any stats
    const buff = createStatBuff(0.25);
    const result = applyBuffsToPrimaryStats(BASE_STATS, [buff]);

    // All stats should remain unchanged
    expect(result.strength).toBe(BASE_STATS.strength);
    expect(result.willpower).toBe(BASE_STATS.willpower);
  });
});

describe('calculateDotDamage', () => {
  it('calculates base DoT damage', () => {
    const derived = calculateDerivedStats(BASE_STATS, {});
    const dotDamage = calculateDotDamage(50, undefined, undefined, derived);

    // DoT should deal damage (exact formula may vary)
    expect(dotDamage).toBeGreaterThan(0);
  });

  it('applies reduced defense to DoT (50% effectiveness)', () => {
    const lowDefStats = calculateDerivedStats(BASE_STATS, {});
    const highDefStats = calculateDerivedStats(HIGH_STATS, {});

    const lowDefDot = calculateDotDamage(100, DamageType.PHYSICAL, DamageProperty.NORMAL, lowDefStats);
    const highDefDot = calculateDotDamage(100, DamageType.PHYSICAL, DamageProperty.NORMAL, highDefStats);

    // High defense should reduce DoT damage but less effectively than normal damage
    expect(highDefDot).toBeLessThan(lowDefDot);
    // But shouldn't be 0 (defense at 50% effectiveness for DoT)
    expect(highDefDot).toBeGreaterThan(0);
  });
});

describe('checkGuts', () => {
  it('survives lethal damage with 100% guts chance', () => {
    const result = checkGuts(50, 100, 1.0); // 100% guts chance

    expect(result.survived).toBe(true);
    expect(result.newHp).toBe(1);
  });

  it('dies to lethal damage with 0% guts chance', () => {
    const result = checkGuts(50, 100, 0); // 0% guts chance

    expect(result.survived).toBe(false);
    expect(result.newHp).toBeLessThanOrEqual(0);
  });

  it('takes normal damage when not lethal', () => {
    const result = checkGuts(100, 50, 0); // Non-lethal damage

    expect(result.survived).toBe(true);
    expect(result.newHp).toBe(50); // 100 - 50 = 50
  });
});

describe('getElementEffectiveness', () => {
  it('follows element cycle: Fire > Wind > Lightning > Earth > Water > Fire', () => {
    // Advantages (1.2x)
    expect(getElementEffectiveness(ElementType.FIRE, ElementType.WIND)).toBe(1.2);
    expect(getElementEffectiveness(ElementType.WIND, ElementType.LIGHTNING)).toBe(1.2);
    expect(getElementEffectiveness(ElementType.LIGHTNING, ElementType.EARTH)).toBe(1.2);
    expect(getElementEffectiveness(ElementType.EARTH, ElementType.WATER)).toBe(1.2);
    expect(getElementEffectiveness(ElementType.WATER, ElementType.FIRE)).toBe(1.2);

    // Resistances (0.8x) - reverse matchups
    expect(getElementEffectiveness(ElementType.WIND, ElementType.FIRE)).toBe(0.8);
    expect(getElementEffectiveness(ElementType.LIGHTNING, ElementType.WIND)).toBe(0.8);
    expect(getElementEffectiveness(ElementType.EARTH, ElementType.LIGHTNING)).toBe(0.8);
    expect(getElementEffectiveness(ElementType.WATER, ElementType.EARTH)).toBe(0.8);
    expect(getElementEffectiveness(ElementType.FIRE, ElementType.WATER)).toBe(0.8);

    // Neutral (1.0x)
    expect(getElementEffectiveness(ElementType.FIRE, ElementType.FIRE)).toBe(1.0);
    expect(getElementEffectiveness(ElementType.PHYSICAL, ElementType.FIRE)).toBe(1.0);
    expect(getElementEffectiveness(ElementType.MENTAL, ElementType.WATER)).toBe(1.0);
  });
});

// ============================================================================
// NEW TESTS: calculateDamage
// ============================================================================

describe('calculateDamage', () => {
  const attackerDerived = calculateDerivedStats(BASE_STATS, {});
  const defenderDerived = calculateDerivedStats(BASE_STATS, {});

  it('calculates base damage from scaling stat and damage mult', () => {
    const skill = createMockSkill({
      damageMult: 2.0,
      scalingStat: PrimaryStat.STRENGTH,
      attackMethod: AttackMethod.AUTO, // Auto-hit for predictable testing
    });

    const result = calculateDamage(
      BASE_STATS,
      attackerDerived,
      BASE_STATS,
      defenderDerived,
      skill,
      ElementType.PHYSICAL,
      ElementType.WATER
    );

    // Base damage: strength(10) * damageMult(2.0) = 20
    // Should have some damage after defense
    expect(result.rawDamage).toBeGreaterThan(0);
    expect(result.isMiss).toBe(false);
    expect(result.isEvaded).toBe(false);
  });

  it('applies element effectiveness multiplier', () => {
    const fireSkill = createMockSkill({
      damageMult: 2.0,
      scalingStat: PrimaryStat.SPIRIT,
      damageType: DamageType.ELEMENTAL,
      attackMethod: AttackMethod.AUTO,
      element: ElementType.FIRE,
    });

    // Fire vs Wind (super effective)
    const superEffective = calculateDamage(
      BASE_STATS, attackerDerived, BASE_STATS, defenderDerived,
      fireSkill, ElementType.FIRE, ElementType.WIND
    );

    // Fire vs Water (resisted)
    const resisted = calculateDamage(
      BASE_STATS, attackerDerived, BASE_STATS, defenderDerived,
      fireSkill, ElementType.FIRE, ElementType.WATER
    );

    expect(superEffective.elementMultiplier).toBe(1.2);
    expect(resisted.elementMultiplier).toBe(0.8);
  });

  it('TRUE damage bypasses all defense', () => {
    const trueSkill = createMockSkill({
      damageMult: 3.0,
      scalingStat: PrimaryStat.STRENGTH,
      damageType: DamageType.TRUE,
      attackMethod: AttackMethod.AUTO,
    });

    const result = calculateDamage(
      BASE_STATS, attackerDerived, HIGH_STATS, calculateDerivedStats(HIGH_STATS, {}),
      trueSkill, ElementType.PHYSICAL, ElementType.WATER
    );

    // TRUE damage should have 0 flat and percent reduction
    expect(result.flatReduction).toBe(0);
    expect(result.percentReduction).toBe(0);
    expect(result.finalDamage).toBe(result.rawDamage);
  });

  it('damageMult 0 utility/heal skills deal 0 damage (no min-1 chip)', () => {
    const healSkill = createMockSkill({
      damageMult: 0,
      scalingStat: PrimaryStat.INTELLIGENCE,
      damageType: DamageType.PHYSICAL,
      attackMethod: AttackMethod.AUTO,
    });

    const result = calculateDamage(
      BASE_STATS, attackerDerived, BASE_STATS, defenderDerived,
      healSkill, ElementType.PHYSICAL, ElementType.WATER
    );

    expect(result.rawDamage).toBe(0);
    expect(result.finalDamage).toBe(0);
  });

  it('PIERCING ignores flat defense', () => {
    const piercingSkill = createMockSkill({
      damageMult: 2.0,
      damageProperty: DamageProperty.PIERCING,
      attackMethod: AttackMethod.AUTO,
    });

    const result = calculateDamage(
      BASE_STATS, attackerDerived, BASE_STATS, defenderDerived,
      piercingSkill, ElementType.PHYSICAL, ElementType.WATER
    );

    expect(result.flatReduction).toBe(0);
    // Should still have percent reduction
    expect(result.percentReduction).toBeGreaterThanOrEqual(0);
  });

  it('defenseBypass removes flat and percent mitigation', () => {
    // Deterministic: AUTO never misses/evades; force no-crit via Math.random
    const skill = createMockSkill({
      damageMult: 5.0,
      scalingStat: PrimaryStat.STRENGTH,
      damageType: DamageType.PHYSICAL,
      attackMethod: AttackMethod.AUTO,
      critBonus: 0,
    });
    const tank = calculateDerivedStats(HIGH_STATS, {});
    const rng = Math.random;
    Math.random = () => 0.99; // never crit (critChance << 99%)

    try {
      const normal = calculateDamage(
        BASE_STATS, attackerDerived, HIGH_STATS, tank,
        skill, ElementType.PHYSICAL, ElementType.WATER
      );
      const pierced = calculateDamage(
        BASE_STATS, attackerDerived, HIGH_STATS, tank,
        skill, ElementType.PHYSICAL, ElementType.WATER,
        { defenseBypass: 100 }
      );

      expect(normal.isCrit).toBe(false);
      expect(pierced.isCrit).toBe(false);
      expect(pierced.finalDamage).toBeGreaterThan(normal.finalDamage);
      expect(pierced.flatReduction).toBe(0);
      expect(pierced.percentReduction).toBe(0);
    } finally {
      Math.random = rng;
    }
  });

  it('forceSuperEffective forces 1.2 element multiplier', () => {
    const fireSkill = createMockSkill({
      damageMult: 2.0,
      scalingStat: PrimaryStat.SPIRIT,
      damageType: DamageType.ELEMENTAL,
      attackMethod: AttackMethod.AUTO,
      element: ElementType.FIRE,
    });

    // Fire vs Fire is normally neutral; force SE overrides
    const forced = calculateDamage(
      BASE_STATS, attackerDerived, BASE_STATS, defenderDerived,
      fireSkill, ElementType.FIRE, ElementType.FIRE,
      { forceSuperEffective: true }
    );

    expect(forced.elementMultiplier).toBe(1.2);
  });

  it('forceHit always connects even when RNG would miss/evade', () => {
    const skill = createMockSkill({
      damageMult: 2.0,
      scalingStat: PrimaryStat.STRENGTH,
      attackMethod: AttackMethod.MELEE,
      critBonus: 0,
    });
    // High-evasion defender + RNG that always fails hit / always evades
    const slippery = calculateDerivedStats(
      { ...HIGH_STATS, speed: 50 },
      {}
    );
    const rng = Math.random;
    Math.random = () => 0.999; // fail hit chance and crit; pass evasion

    try {
      const natural = calculateDamage(
        BASE_STATS, attackerDerived, { ...HIGH_STATS, speed: 50 }, slippery,
        skill, ElementType.PHYSICAL, ElementType.WATER
      );
      const forced = calculateDamage(
        BASE_STATS, attackerDerived, { ...HIGH_STATS, speed: 50 }, slippery,
        skill, ElementType.PHYSICAL, ElementType.WATER,
        { forceHit: true, forceCrit: false }
      );

      expect(natural.isMiss || natural.isEvaded).toBe(true);
      expect(forced.isMiss).toBe(false);
      expect(forced.isEvaded).toBe(false);
      expect(forced.isCrit).toBe(false);
      expect(forced.finalDamage).toBeGreaterThan(0);
    } finally {
      Math.random = rng;
    }
  });

  it('forceCrit true always crits; forceCrit false never crits', () => {
    const skill = createMockSkill({
      damageMult: 2.0,
      scalingStat: PrimaryStat.STRENGTH,
      attackMethod: AttackMethod.AUTO,
      critBonus: 0,
    });

    const alwaysCrit = calculateDamage(
      BASE_STATS, attackerDerived, BASE_STATS, defenderDerived,
      skill, ElementType.PHYSICAL, ElementType.WATER,
      { forceCrit: true }
    );
    const neverCrit = calculateDamage(
      BASE_STATS, attackerDerived, BASE_STATS, defenderDerived,
      skill, ElementType.PHYSICAL, ElementType.WATER,
      { forceCrit: false }
    );

    expect(alwaysCrit.isCrit).toBe(true);
    expect(neverCrit.isCrit).toBe(false);
    expect(alwaysCrit.finalDamage).toBeGreaterThan(neverCrit.finalDamage);
  });

  it('previewDamage is stable (hit, non-crit) across repeated calls', () => {
    const skill = createMockSkill({
      damageMult: 2.0,
      scalingStat: PrimaryStat.STRENGTH,
      attackMethod: AttackMethod.MELEE,
      critBonus: 50, // high crit would otherwise flicker
    });

    const samples = Array.from({ length: 20 }, () =>
      previewDamage(
        BASE_STATS, attackerDerived, BASE_STATS, defenderDerived,
        skill, ElementType.PHYSICAL, ElementType.WATER,
        { damageBonus: 0.1 }
      )
    );

    const first = samples[0];
    for (const sample of samples) {
      expect(sample.isMiss).toBe(false);
      expect(sample.isEvaded).toBe(false);
      expect(sample.isCrit).toBe(false);
      expect(sample.finalDamage).toBe(first.finalDamage);
      expect(sample.rawDamage).toBe(first.rawDamage);
    }
  });

  it('previewDamage overrides call-site forceHit/forceCrit flags', () => {
    const skill = createMockSkill({
      damageMult: 2.0,
      scalingStat: PrimaryStat.STRENGTH,
      attackMethod: AttackMethod.AUTO,
    });

    const result = previewDamage(
      BASE_STATS, attackerDerived, BASE_STATS, defenderDerived,
      skill, ElementType.PHYSICAL, ElementType.WATER,
      { forceHit: false, forceCrit: true } // should be overridden
    );

    expect(result.isMiss).toBe(false);
    expect(result.isCrit).toBe(false);
  });
});

// ============================================================================
// NEW TESTS: aggregateEquipmentBonuses
// ============================================================================

describe('aggregateEquipmentBonuses', () => {
  it('combines stats from multiple equipment slots', () => {
    const equipment: Record<EquipmentSlot, any> = {
      [EquipmentSlot.SLOT_1]: null,
      [EquipmentSlot.SLOT_2]: createMockComponent(undefined, { strength: 10 }),
      [EquipmentSlot.SLOT_3]: createMockComponent(undefined, { strength: 5, speed: 8 }),
      [EquipmentSlot.SLOT_4]: null,
    };

    const bonuses = aggregateEquipmentBonuses(equipment);

    expect(bonuses.strength).toBe(15); // 10 + 5
    expect(bonuses.speed).toBe(8);
  });

  it('handles empty equipment', () => {
    const equipment: Record<EquipmentSlot, any> = {
      [EquipmentSlot.SLOT_1]: null,
      [EquipmentSlot.SLOT_2]: null,
      [EquipmentSlot.SLOT_3]: null,
      [EquipmentSlot.SLOT_4]: null,
    };

    const bonuses = aggregateEquipmentBonuses(equipment);

    expect(Object.keys(bonuses).length).toBe(0);
  });
});

// ============================================================================
// NEW TESTS: resistStatus
// ============================================================================

describe('resistStatus', () => {
  it('applies status with 100% chance and 0% resistance', () => {
    // Run multiple times to verify (since there's randomness)
    let applied = 0;
    for (let i = 0; i < 100; i++) {
      if (resistStatus(1.0, 0)) applied++;
    }
    expect(applied).toBe(100); // Should always apply
  });

  it('never applies status with 0% chance', () => {
    let applied = 0;
    for (let i = 0; i < 100; i++) {
      if (resistStatus(0, 0.5)) applied++;
    }
    expect(applied).toBe(0); // Should never apply
  });

  it('reduces effective chance based on resistance', () => {
    // 80% chance with 50% resistance = 40% effective chance
    // Statistical test: should apply roughly 40% of the time
    let applied = 0;
    const trials = 1000;
    for (let i = 0; i < trials; i++) {
      if (resistStatus(0.8, 0.5)) applied++;
    }
    // Allow for statistical variance (30-50% range)
    expect(applied).toBeGreaterThan(trials * 0.25);
    expect(applied).toBeLessThan(trials * 0.55);
  });
});

// ============================================================================
// NEW TESTS: canLearnSkill
// ============================================================================

describe('canLearnSkill', () => {
  it('allows learning skill with no requirements', () => {
    const skill = createMockSkill({ requirements: undefined });
    const result = canLearnSkill(skill, 10, 1, Clan.UZUMAKI);
    expect(result.canLearn).toBe(true);
  });

  it('blocks learning if intelligence too low', () => {
    const skill = createMockSkill({
      requirements: { intelligence: 20 },
    });
    const result = canLearnSkill(skill, 10, 1, Clan.UZUMAKI);
    expect(result.canLearn).toBe(false);
    expect(result.reason).toContain('Intelligence');
  });

  it('blocks learning if level too low', () => {
    const skill = createMockSkill({
      requirements: { level: 10 },
    });
    const result = canLearnSkill(skill, 20, 5, Clan.UZUMAKI);
    expect(result.canLearn).toBe(false);
    expect(result.reason).toContain('Level');
  });

  it('blocks learning if wrong clan', () => {
    const skill = createMockSkill({
      requirements: { clan: Clan.UCHIHA },
    });
    const result = canLearnSkill(skill, 20, 10, Clan.UZUMAKI);
    expect(result.canLearn).toBe(false);
    expect(result.reason).toContain('bloodline');
  });

  it('allows learning if all requirements met', () => {
    const skill = createMockSkill({
      requirements: { intelligence: 15, level: 5, clan: Clan.UCHIHA },
    });
    const result = canLearnSkill(skill, 20, 10, Clan.UCHIHA);
    expect(result.canLearn).toBe(true);
  });
});

// ============================================================================
// A-008: Equipment primary stats applied once in getPlayerFullStats
// ============================================================================

describe('getPlayerFullStats equipment primary single-count (A-008)', () => {
  it('applies equipment primary stats only once to derived maxHp', () => {
    const willpowerBonus = 20;
    const gear = createMockComponent(undefined, {
      willpower: willpowerBonus,
      flatHp: 50, // flat should still apply once
    });

    const player = createMockPlayer({
      primaryStats: { ...BASE_STATS },
      equipment: {
        [EquipmentSlot.SLOT_1]: null, // SLOT_1 multiplies by 1.5; use SLOT_2 for clean 1.0×
        [EquipmentSlot.SLOT_2]: gear,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
      skills: [],
      activeBuffs: [],
    });

    const { effectivePrimary, derived, equipmentBonuses } = getPlayerFullStats(player);

    // Equipment primary applied once on effectivePrimary
    expect(equipmentBonuses.willpower).toBe(willpowerBonus);
    expect(effectivePrimary.willpower).toBe(BASE_STATS.willpower + willpowerBonus);

    // Derived maxHp uses effective willpower once + flatHp once
    // Bug was: calculateDerivedStats re-added equipment willpower → +2× willpowerBonus
    const expectedMaxHp =
      F.HP_BASE +
      effectivePrimary.willpower * F.HP_PER_WILLPOWER +
      (equipmentBonuses.flatHp || 0);

    expect(derived.maxHp).toBe(expectedMaxHp);

    // Explicitly prove no double-count: wrong formula would be base + 2*gear willpower
    const doubleCountedMaxHp =
      F.HP_BASE +
      (BASE_STATS.willpower + willpowerBonus * 2) * F.HP_PER_WILLPOWER +
      (equipmentBonuses.flatHp || 0);
    expect(derived.maxHp).not.toBe(doubleCountedMaxHp);
    expect(derived.maxHp).toBeLessThan(doubleCountedMaxHp);
  });

  it('does not re-add primary equipment keys inside calculateDerivedStats', () => {
    // primary already includes +10 strength; equipmentBonuses still has strength: 10
    // (as getPlayerFullStats passes full equipment bag). Strength must not double.
    const withGear: typeof BASE_STATS = { ...BASE_STATS, strength: BASE_STATS.strength + 10 };
    const derived = calculateDerivedStats(withGear, { strength: 10, flatPhysicalDef: 5 });

    const expectedFlat =
      Math.floor(withGear.strength * F.FLAT_PHYS_DEF_PER_STR) + 5;
    expect(derived.physicalDefenseFlat).toBe(expectedFlat);

    // Double-count would use strength + 10 again from equipmentBonuses
    const wrongFlat =
      Math.floor((withGear.strength + 10) * F.FLAT_PHYS_DEF_PER_STR) + 5;
    expect(derived.physicalDefenseFlat).not.toBe(wrongFlat);
  });
});

// ============================================================================
// A-014: Passive damageBonus / defenseBonus in combat pipeline
// ============================================================================

describe('passive skill damageBonus and defenseBonus (A-014)', () => {
  it('aggregatePassiveSkillBonuses scopes FIRE_AFFINITY to Fire only', () => {
    const bonuses = aggregatePassiveSkillBonuses([SKILLS.FIRE_AFFINITY]);

    expect(bonuses.damageBonus).toBe(0);
    expect(bonuses.elementalDamageBonus[ElementType.FIRE]).toBe(0.15);
    expect(resolvePassiveDamageBonus(bonuses, ElementType.FIRE)).toBe(0.15);
    expect(resolvePassiveDamageBonus(bonuses, ElementType.WATER)).toBe(0);
    expect(resolvePassiveDamageBonus(bonuses, ElementType.PHYSICAL)).toBe(0);
  });

  it('applies global damageBonus to all elements (WEAPON_PROFICIENCY)', () => {
    const bonuses = aggregatePassiveSkillBonuses([SKILLS.WEAPON_PROFICIENCY]);

    expect(bonuses.damageBonus).toBe(0.1);
    expect(resolvePassiveDamageBonus(bonuses, ElementType.FIRE)).toBe(0.1);
    expect(resolvePassiveDamageBonus(bonuses, ElementType.PHYSICAL)).toBe(0.1);
  });

  it('damageBonus increases rawDamage from calculateDamage', () => {
    // Zero crit so RNG cannot inflate rawDamage (crit ×1.75 was flaking this test to 40).
    const attackerDerived = {
      ...calculateDerivedStats(BASE_STATS, {}),
      critChance: 0,
    };
    const defenderDerived = calculateDerivedStats(BASE_STATS, {});
    const skill = createMockSkill({
      damageMult: 2.0,
      scalingStat: PrimaryStat.STRENGTH,
      attackMethod: AttackMethod.AUTO,
      damageType: DamageType.TRUE, // no defense noise
      element: ElementType.PHYSICAL,
      critBonus: 0,
    });

    const baseline = calculateDamage(
      BASE_STATS,
      attackerDerived,
      BASE_STATS,
      defenderDerived,
      skill,
      ElementType.PHYSICAL,
      ElementType.WATER,
      { damageBonus: 0 }
    );

    const buffed = calculateDamage(
      BASE_STATS,
      attackerDerived,
      BASE_STATS,
      defenderDerived,
      skill,
      ElementType.PHYSICAL,
      ElementType.WATER,
      { damageBonus: 0.15 }
    );

    // raw before bonus = strength(10) * 2 = 20; with +15% → floor(20 * 1.15) = 23
    expect(baseline.rawDamage).toBe(20);
    expect(buffed.rawDamage).toBe(23);
    expect(buffed.isCrit).toBe(false);
    expect(buffed.finalDamage).toBeGreaterThan(baseline.finalDamage);
  });

  it('FIRE_AFFINITY only boosts Fire skills in full player pipeline', () => {
    const player = createMockPlayer({
      skills: [SKILLS.FIRE_AFFINITY],
      primaryStats: { ...BASE_STATS },
      activeBuffs: [],
    });
    const stats = getPlayerFullStats(player);
    const fireBonus = resolvePassiveDamageBonus(stats.passiveBonuses, ElementType.FIRE);
    const waterBonus = resolvePassiveDamageBonus(stats.passiveBonuses, ElementType.WATER);

    expect(fireBonus).toBe(0.15);
    expect(waterBonus).toBe(0);
  });

  it('defenseBonus raises percent defenses on getPlayerFullStats', () => {
    const without = getPlayerFullStats(
      createMockPlayer({ skills: [], primaryStats: { ...BASE_STATS }, activeBuffs: [] })
    );
    const withIronBody = getPlayerFullStats(
      createMockPlayer({
        skills: [SKILLS.IRON_BODY],
        primaryStats: { ...BASE_STATS },
        activeBuffs: [],
      })
    );

    expect(withIronBody.passiveBonuses.defenseBonus).toBe(0.05);
    expect(withIronBody.derived.physicalDefensePercent).toBeCloseTo(
      without.derived.physicalDefensePercent + 0.05,
      5
    );
    expect(withIronBody.derived.elementalDefensePercent).toBeCloseTo(
      without.derived.elementalDefensePercent + 0.05,
      5
    );
    expect(withIronBody.derived.mentalDefensePercent).toBeCloseTo(
      without.derived.mentalDefensePercent + 0.05,
      5
    );
  });

  it('defenseBonus reduces incoming damage via higher percent def', () => {
    // Deterministic: no crit RNG on either side of the comparison
    const attackerDerived = {
      ...calculateDerivedStats(BASE_STATS, {}),
      critChance: 0,
    };
    const normalDef = getPlayerFullStats(
      createMockPlayer({ skills: [], primaryStats: { ...BASE_STATS }, activeBuffs: [] })
    ).derived;
    const ironDef = getPlayerFullStats(
      createMockPlayer({
        skills: [SKILLS.IRON_BODY],
        primaryStats: { ...BASE_STATS },
        activeBuffs: [],
      })
    ).derived;

    const skill = createMockSkill({
      damageMult: 5.0,
      scalingStat: PrimaryStat.STRENGTH,
      attackMethod: AttackMethod.AUTO,
      damageType: DamageType.PHYSICAL,
      damageProperty: DamageProperty.PIERCING, // only % def applies
      element: ElementType.PHYSICAL,
      critBonus: 0,
    });

    const vsNormal = calculateDamage(
      BASE_STATS,
      attackerDerived,
      BASE_STATS,
      normalDef,
      skill,
      ElementType.PHYSICAL,
      ElementType.WATER
    );
    const vsIron = calculateDamage(
      BASE_STATS,
      attackerDerived,
      BASE_STATS,
      ironDef,
      skill,
      ElementType.PHYSICAL,
      ElementType.WATER
    );

    expect(vsNormal.isCrit).toBe(false);
    expect(vsIron.isCrit).toBe(false);
    expect(vsIron.finalDamage).toBeLessThan(vsNormal.finalDamage);
  });
});
