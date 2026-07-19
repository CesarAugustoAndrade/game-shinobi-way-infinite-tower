/**
 * EquipmentPassiveSystem Unit Tests
 * Tests equipment passive trigger processing and effect application
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  processPassivesOnCombatStart,
  processPassivesOnHit,
  processPassivesOnTurnStart,
  shouldCounterAttack,
  checkExecuteThreshold,
  checkGutsPassive,
  getTotalDefenseBypass,
  hasAllElementsPassive,
  getDamageReductionPercent,
  getCritDefenseBypass,
  getConvertToElementalPercent,
  getClanTraitPassives,
  getClanTraitCombatModifiers,
  applyClanTraitToDamageContext,
} from '../EquipmentPassiveSystem';
import { EquipmentSlot, PassiveEffectType, EffectType } from '../../types';
import { createMockPlayer, createMockEnemy, createMockArtifact } from './testFixtures';

describe('processPassivesOnCombatStart', () => {
  it('returns default result when no passives equipped', () => {
    const player = createMockPlayer();
    const enemy = createMockEnemy();

    const result = processPassivesOnCombatStart(player, enemy);

    expect(result.player).toBeDefined();
    expect(result.enemy).toBeDefined();
    expect(result.logs.length).toBe(0);
    expect(result.skipFirstSkillCost).toBe(false);
  });

  it('grants shield from SHIELD_ON_START as % of maxChakra (not current) — A-017', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.SHIELD_ON_START,
      value: 50, // 50% of max chakra
      triggerCondition: 'combat_start',
    };

    const player = createMockPlayer({
      currentChakra: 20, // low current must not shrink the shield
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy();

    const result = processPassivesOnCombatStart(player, enemy, { maxChakra: 100 });

    expect(result.player.activeBuffs.length).toBeGreaterThan(0);
    const shieldBuff = result.player.activeBuffs.find(b => b.effect.type === EffectType.SHIELD);
    expect(shieldBuff).toBeDefined();
    expect(shieldBuff!.effect.value).toBe(50); // 50% of max 100, not of current 20
  });

  it('grants invulnerability from INVULNERABLE_FIRST_TURN', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.INVULNERABLE_FIRST_TURN,
      triggerCondition: 'combat_start',
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy();

    const result = processPassivesOnCombatStart(player, enemy);

    const invulnBuff = result.player.activeBuffs.find(b => b.effect.type === EffectType.INVULNERABILITY);
    expect(invulnBuff).toBeDefined();
    expect(invulnBuff!.duration).toBe(1);
  });

  it('sets skipFirstSkillCost from FREE_FIRST_SKILL', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.FREE_FIRST_SKILL,
      triggerCondition: 'combat_start',
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy();

    const result = processPassivesOnCombatStart(player, enemy);

    expect(result.skipFirstSkillCost).toBe(true);
  });
});

describe('processPassivesOnHit', () => {
  it('applies BLEED debuff to enemy on hit', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.BLEED,
      value: 5,
      duration: 3,
      triggerCondition: 'on_hit',
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy();

    const result = processPassivesOnHit(player, enemy, 50, false);

    const bleedBuff = result.enemy.activeBuffs.find(b => b.effect.type === EffectType.BLEED);
    expect(bleedBuff).toBeDefined();
  });

  it('calculates LIFESTEAL based on damage dealt', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.LIFESTEAL,
      value: 20, // 20% lifesteal
      triggerCondition: 'on_hit',
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy();

    const result = processPassivesOnHit(player, enemy, 100, false);

    expect(result.healToPlayer).toBe(20); // 20% of 100 damage
  });

  it('activates PIERCE_DEFENSE on critical hit', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.PIERCE_DEFENSE,
      value: 50, // 50% pierce
      triggerCondition: 'on_crit',
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy();

    // Without crit - no defense bypass
    const normalResult = processPassivesOnHit(player, enemy, 50, false);
    expect(normalResult.defenseBypass).toBe(0);

    // With crit - defense bypass activates
    const critResult = processPassivesOnHit(player, enemy, 50, true);
    expect(critResult.defenseBypass).toBe(50);
  });

  it('CHAKRA_DRAIN mutates enemy chakra on hit (Package 5)', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.CHAKRA_DRAIN,
      value: 10,
      triggerCondition: 'on_hit',
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy({ currentChakra: 80 });

    const result = processPassivesOnHit(player, enemy, 50, false);

    expect(result.enemy.currentChakra).toBe(70);
    expect(result.chakraDrained).toBe(10);
    expect(result.chakraRestored).toBe(10);
    // Original enemy must remain immutable
    expect(enemy.currentChakra).toBe(80);
  });
});

describe('checkExecuteThreshold', () => {
  it('returns false when enemy above threshold', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.EXECUTE_THRESHOLD,
      value: 20, // 20% threshold
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy({ currentHp: 80 });

    expect(checkExecuteThreshold(player, enemy, 100)).toBe(false);
  });

  it('returns true when enemy below threshold', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.EXECUTE_THRESHOLD,
      value: 20, // 20% threshold
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy({ currentHp: 15 });

    expect(checkExecuteThreshold(player, enemy, 100)).toBe(true);
  });

  it('returns false when no EXECUTE_THRESHOLD passive', () => {
    const player = createMockPlayer();
    const enemy = createMockEnemy({ currentHp: 10 });

    expect(checkExecuteThreshold(player, enemy, 100)).toBe(false);
  });
});

describe('processPassivesOnTurnStart — REGEN maxHp (A-017)', () => {
  it('heals % of maxHp, not currentHp', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.REGEN,
      value: 10, // 10% of max
      triggerCondition: 'turn_start',
    };

    const player = createMockPlayer({
      currentHp: 50, // wounded — old bug would heal 5 instead of 10
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy();

    const result = processPassivesOnTurnStart(player, enemy, 100);

    expect(result.healToPlayer).toBe(10); // 10% of max 100, not of current 50
  });
});

describe('shouldCounterAttack — single RNG roll (A-017)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns shouldCounter true on a successful single roll', () => {
    const artifact = createMockArtifact();
    artifact.name = 'Counter Gear';
    artifact.passive = {
      type: PassiveEffectType.COUNTER_ATTACK,
      value: 25,
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.10); // 10 < 25 → counter

    const result = shouldCounterAttack(player);
    expect(result.shouldCounter).toBe(true);
    expect(result.chance).toBe(25);
    expect(result.source).toBe('Counter Gear');
  });

  it('returns shouldCounter false on a failed single roll (callers must not re-roll)', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.COUNTER_ATTACK,
      value: 25,
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.50); // 50 >= 25 → no counter

    const result = shouldCounterAttack(player);
    expect(result.shouldCounter).toBe(false);
    expect(result.chance).toBe(25);
  });
});

describe('checkGutsPassive', () => {
  it('returns hasGuts: false when no GUTS passive', () => {
    const player = createMockPlayer();

    const result = checkGutsPassive(player);

    expect(result.hasGuts).toBe(false);
    expect(result.healPercent).toBe(0);
  });

  it('returns guts info when GUTS passive equipped', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.GUTS,
      value: 25, // Heal 25% on trigger
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });

    const result = checkGutsPassive(player);

    expect(result.hasGuts).toBe(true);
    expect(result.healPercent).toBe(25);
  });
});

describe('getTotalDefenseBypass', () => {
  it('returns 0 when no bypass passives', () => {
    const player = createMockPlayer();
    expect(getTotalDefenseBypass(player)).toBe(0);
  });

  it('sums bypass from multiple items', () => {
    const artifact1 = createMockArtifact();
    artifact1.passive = {
      type: PassiveEffectType.PIERCE_DEFENSE,
      value: 20, // Non-conditional pierce
    };

    const artifact2 = createMockArtifact();
    artifact2.passive = {
      type: PassiveEffectType.PIERCE_DEFENSE,
      value: 30,
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact1,
        [EquipmentSlot.SLOT_2]: artifact2,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });

    expect(getTotalDefenseBypass(player)).toBe(50);
  });

  it('caps at 100%', () => {
    const artifact1 = createMockArtifact();
    artifact1.passive = { type: PassiveEffectType.PIERCE_DEFENSE, value: 60 };

    const artifact2 = createMockArtifact();
    artifact2.passive = { type: PassiveEffectType.PIERCE_DEFENSE, value: 60 };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact1,
        [EquipmentSlot.SLOT_2]: artifact2,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });

    expect(getTotalDefenseBypass(player)).toBe(100);
  });
});

describe('hasAllElementsPassive', () => {
  it('returns false when no ALL_ELEMENTS passive', () => {
    const player = createMockPlayer();
    expect(hasAllElementsPassive(player)).toBe(false);
  });

  it('returns true when ALL_ELEMENTS passive equipped', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.ALL_ELEMENTS,
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });

    expect(hasAllElementsPassive(player)).toBe(true);
  });
});

describe('getDamageReductionPercent', () => {
  it('returns 0 with no DR passives', () => {
    const player = createMockPlayer({ currentHp: 50 });
    expect(getDamageReductionPercent(player, 100)).toBe(0);
  });

  it('applies unconditional DAMAGE_REDUCTION', () => {
    const artifact = createMockArtifact();
    artifact.passive = { type: PassiveEffectType.DAMAGE_REDUCTION, value: 13 };

    const player = createMockPlayer({
      currentHp: 100,
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });

    expect(getDamageReductionPercent(player, 100)).toBe(13);
  });

  it('applies below_half_hp DR only when wounded', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.DAMAGE_REDUCTION,
      value: 10,
      triggerCondition: 'below_half_hp',
    };

    const healthy = createMockPlayer({
      currentHp: 80,
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const wounded = { ...healthy, currentHp: 40 };

    expect(getDamageReductionPercent(healthy, 100)).toBe(0);
    expect(getDamageReductionPercent(wounded, 100)).toBe(10);
  });

  it('allows negative DR (damage amp)', () => {
    const artifact = createMockArtifact();
    artifact.passive = { type: PassiveEffectType.DAMAGE_REDUCTION, value: -20 };

    const player = createMockPlayer({
      currentHp: 100,
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });

    expect(getDamageReductionPercent(player, 100)).toBe(-20);
  });
});

describe('getCritDefenseBypass', () => {
  it('sums on_crit PIERCE_DEFENSE only', () => {
    const critPierce = createMockArtifact();
    critPierce.passive = {
      type: PassiveEffectType.PIERCE_DEFENSE,
      value: 65,
      triggerCondition: 'on_crit',
    };
    const permanent = createMockArtifact();
    permanent.passive = { type: PassiveEffectType.PIERCE_DEFENSE, value: 20 };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: critPierce,
        [EquipmentSlot.SLOT_2]: permanent,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });

    expect(getCritDefenseBypass(player)).toBe(65);
    expect(getTotalDefenseBypass(player)).toBe(20);
  });
});

describe('getConvertToElementalPercent', () => {
  it('returns convert percent from artifact', () => {
    const artifact = createMockArtifact();
    artifact.passive = { type: PassiveEffectType.CONVERT_TO_ELEMENTAL, value: 35 };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });

    expect(getConvertToElementalPercent(player)).toBe(35);
  });
});

describe('clan trait passives (T-031)', () => {
  function equipTrait(type: PassiveEffectType) {
    const artifact = createMockArtifact();
    artifact.name = `Trait ${type}`;
    artifact.passive = { type };
    return createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
  }

  it('getClanTraitPassives returns equipped clan traits', () => {
    const player = equipTrait(PassiveEffectType.CLAN_TRAIT_UCHIHA);
    expect(getClanTraitPassives(player)).toContain(PassiveEffectType.CLAN_TRAIT_UCHIHA);
  });

  it('UCHIHA raises crit chance/damage modifiers', () => {
    const player = equipTrait(PassiveEffectType.CLAN_TRAIT_UCHIHA);
    const mods = getClanTraitCombatModifiers(player);
    expect(mods.critChanceBonus).toBe(12);
    expect(mods.critDamageBonus).toBeCloseTo(0.25);
  });

  it('HYUGA drains chakra on hit via processPassivesOnHit', () => {
    const player = equipTrait(PassiveEffectType.CLAN_TRAIT_HYUGA);
    const enemy = createMockEnemy({ currentChakra: 40 });
    const result = processPassivesOnHit(player, enemy, 50, false);
    expect(result.chakraDrained).toBe(10);
    expect(result.enemy.currentChakra).toBe(30);
    expect(result.player.currentChakra).toBe(player.currentChakra + 10);
  });

  it('UZUMAKI heals currentHp on combat start (Package 5 merge target)', () => {
    const player = equipTrait(PassiveEffectType.CLAN_TRAIT_UZUMAKI);
    // Wound the player so heal has room
    player.currentHp = 100;
    const enemy = createMockEnemy();
    const maxHp = 200;

    const result = processPassivesOnCombatStart(player, enemy, { maxHp });

    // 10% of maxHp = 20
    expect(result.player.currentHp).toBe(120);
    expect(result.healToPlayer).toBe(20);
    expect(result.logs.some(m => /Uzumaki Vitality/i.test(m))).toBe(true);
  });

  it('NARA reduces enemy speed/evasion in damage context', () => {
    const player = equipTrait(PassiveEffectType.CLAN_TRAIT_NARA);
    const enemy = createMockEnemy();
    const speed = enemy.primaryStats.speed;
    // Minimal derived shape for clan trait application (only fields we touch)
    const derived = {
      critChance: 15,
      critDamageMelee: 1.5,
      critDamageRanged: 1.5,
      evasion: 20,
    } as import('../../types').DerivedStats;
    const ctx = applyClanTraitToDamageContext(
      player,
      derived,
      enemy.primaryStats,
      derived,
    );
    expect(ctx.defenderPrimary.speed).toBe(Math.floor(speed * 0.8));
    expect(ctx.defenderDerived.evasion).toBe(Math.floor(20 * 0.75));
  });

  it('UZUMAKI heals at combat start', () => {
    const player = equipTrait(PassiveEffectType.CLAN_TRAIT_UZUMAKI);
    player.currentHp = 50;
    const enemy = createMockEnemy();
    const result = processPassivesOnCombatStart(player, enemy, { maxHp: 100, maxChakra: 50 });
    expect(result.healToPlayer).toBe(10);
    expect(result.player.currentHp).toBe(60);
    expect(result.logs.some((l) => l.toLowerCase().includes('uzumaki') || l.toLowerCase().includes('vitality'))).toBe(true);
  });
});
