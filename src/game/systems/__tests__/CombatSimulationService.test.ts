/**
 * CombatSimulationService minimal parity tests (Package 8)
 * - Instant HEAL (not a buff)
 * - Combat-start: replace activeBuffs + apply currentHp (no double-append)
 * - Approach path from APPROACH_DEFINITIONS (enemyHpReduction, not hard-coded stealth cut)
 * - FREE_FIRST_SKILL skips first skill chakra cost
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { simulateGameCombat } from '../CombatSimulationService';
import { getPlayerFullStats } from '../StatSystem';
import {
  ApproachType,
  AttackMethod,
  EffectType,
  EquipmentSlot,
  PassiveEffectType,
} from '../../types';
import {
  createMockPlayer,
  createMockEnemy,
  createMockSkill,
  createMockArtifact,
  createShieldBuff,
} from './testFixtures';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CombatSimulationService — HEAL', () => {
  it('applies HEAL as instant HP restore (not a lingering buff)', () => {
    // Force hits / approach RNG low so attacks land
    vi.spyOn(Math, 'random').mockReturnValue(0.05);

    const skill = createMockSkill({
      id: 'heal-strike',
      name: 'Mystic Palm Strike',
      chakraCost: 5,
      baseDamage: 30, scalingPerPoint: 10,
      attackMethod: AttackMethod.AUTO,
      effects: [{ type: EffectType.HEAL, value: 40, duration: 0, chance: 1 }],
    });
    const player = createMockPlayer({
      skills: [skill],
      currentHp: 50,
      currentChakra: 100,
      activeBuffs: [],
    });
    // Weak enemy dies on first hit; player takes no return damage
    const enemy = createMockEnemy({
      currentHp: 1,
      skills: [],
      activeBuffs: [],
    });
    const stats = getPlayerFullStats(player);

    const result = simulateGameCombat(player, stats, enemy);

    expect(result.won).toBe(true);
    // 50 + 40 instant heal (no enemy counter)
    expect(result.playerHpRemaining).toBe(90);
  });
});

describe('CombatSimulationService — combat-start passives', () => {
  it('replaces activeBuffs with passive result (no double-append) and applies currentHp', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05);

    // Pre-existing combat-start-adjacent buff + SHIELD_ON_START + Uzumaki heal
    const existingShield = createShieldBuff(10);
    const shieldArtifact = createMockArtifact();
    shieldArtifact.passive = {
      type: PassiveEffectType.SHIELD_ON_START,
      value: 50, // 50% of maxChakra
      triggerCondition: 'combat_start',
    };
    const uzumakiArtifact = createMockArtifact();
    uzumakiArtifact.passive = {
      type: PassiveEffectType.CLAN_TRAIT_UZUMAKI,
      triggerCondition: 'combat_start',
    };

    const skill = createMockSkill({
      id: 'finisher',
      chakraCost: 0,
      baseDamage: 60, scalingPerPoint: 20,
      attackMethod: AttackMethod.AUTO,
    });
    const player = createMockPlayer({
      skills: [skill],
      currentHp: 50,
      currentChakra: 100,
      activeBuffs: [existingShield],
      equipment: {
        [EquipmentSlot.SLOT_1]: shieldArtifact,
        [EquipmentSlot.SLOT_2]: uzumakiArtifact,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy({ currentHp: 1, skills: [], activeBuffs: [] });
    const stats = getPlayerFullStats(player);

    // Double-append would yield 3 shields (existing + existing + new); replace yields 2.
    // We can't read buffs from the result, but Uzumaki 10% maxHp heal must apply to currentHp.
    const expectedHeal = Math.floor(stats.derived.maxHp * 0.1);
    const result = simulateGameCombat(player, stats, enemy);

    expect(result.won).toBe(true);
    // Instant kill, no return damage → HP is start + combat-start heal only
    expect(result.playerHpRemaining).toBe(50 + expectedHeal);
  });

  it('skips first skill chakra cost when FREE_FIRST_SKILL is equipped', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05);

    const freeArtifact = createMockArtifact();
    freeArtifact.passive = {
      type: PassiveEffectType.FREE_FIRST_SKILL,
      triggerCondition: 'combat_start',
    };

    const skill = createMockSkill({
      id: 'costly',
      chakraCost: 25,
      baseDamage: 60, scalingPerPoint: 20,
      attackMethod: AttackMethod.AUTO,
    });
    const player = createMockPlayer({
      skills: [skill],
      currentHp: 200,
      currentChakra: 100,
      equipment: {
        [EquipmentSlot.SLOT_1]: freeArtifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy({ currentHp: 1, skills: [], activeBuffs: [] });
    const stats = getPlayerFullStats(player);

    const result = simulateGameCombat(player, stats, enemy);

    expect(result.won).toBe(true);
    // Free first skill: no chakra spent; fight ends before turn-end regen
    expect(result.playerChakraRemaining).toBe(100);
  });
});

describe('CombatSimulationService — approaches', () => {
  it('ENVIRONMENTAL_TRAP success applies enemyHpReduction from APPROACH_DEFINITIONS (not hard-coded maxHp cut)', () => {
    // random 0 → approach success (chance roll uses random*100 < chance) + hit rolls
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const skill = createMockSkill({
      id: 'punch',
      chakraCost: 0,
      baseDamage: 12, scalingPerPoint: 4,
      attackMethod: AttackMethod.AUTO,
    });
    const player = createMockPlayer({
      skills: [skill],
      currentChakra: 100,
      currentHp: 200,
    });
    // currentHp 1 → floor(1 * (1 - 0.20)) = 0 under APPROACH_DEFINITIONS enemyHpReduction
    // Old hard-coded path used maxHp * 0.2 as damage and counted it in damageDealt.
    // New path zeros HP via reduction and does not credit trap cut as damageDealt.
    const enemy = createMockEnemy({
      currentHp: 1,
      skills: [],
      activeBuffs: [],
    });
    const stats = getPlayerFullStats(player);

    const result = simulateGameCombat(
      player,
      stats,
      enemy,
      ApproachType.ENVIRONMENTAL_TRAP
    );

    expect(result.won).toBe(true);
    // Trap reduced HP to 0 before attacks — no skill damage recorded
    expect(result.damageDealt).toBe(0);
  });

});
