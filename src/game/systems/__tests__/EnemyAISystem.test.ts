/**
 * EnemyAISystem Unit Tests
 * Tests enemy AI skill selection logic
 */

import { describe, it, expect } from 'vitest';
import { selectEnemySkill, selectEnemySkillDecision } from '../EnemyAISystem';
import { calculateDerivedStats } from '../StatSystem';
import { EffectType, PrimaryStat } from '../../types';
import { createMockPlayer, createMockEnemy, createMockSkill, BASE_STATS } from './testFixtures';

describe('selectEnemySkill', () => {
  const playerStats = {
    primary: BASE_STATS,
    effectivePrimary: BASE_STATS,
    derived: calculateDerivedStats(BASE_STATS, {}),
  };

  const enemyStats = {
    primary: BASE_STATS,
    effectivePrimary: BASE_STATS,
    derived: calculateDerivedStats(BASE_STATS, {}),
  };

  it('returns a skill when called', () => {
    const basicAttack = createMockSkill({ id: 'basic', name: 'Basic Attack' });
    const enemy = createMockEnemy({ skills: [basicAttack] });
    const player = createMockPlayer();

    const context = { enemy, enemyStats, player, playerStats };
    const selectedSkill = selectEnemySkill(context);

    expect(selectedSkill).toBeDefined();
    expect(selectedSkill!.id).toBe('basic');
  });

  it('returns undefined (Guard) if all on cooldown', () => {
    const skill1 = createMockSkill({ id: 'skill1', currentCooldown: 3 });
    const skill2 = createMockSkill({ id: 'skill2', currentCooldown: 2 });
    const enemy = createMockEnemy({ skills: [skill1, skill2] });
    const player = createMockPlayer();

    const context = { enemy, enemyStats, player, playerStats };
    const selectedSkill = selectEnemySkill(context);

    // F2: Guard instead of spamming skills[0] while all CDs are up
    expect(selectedSkill).toBeUndefined();
  });

  it('prefers heal skills when enemy HP is low', () => {
    const attackSkill = createMockSkill({ id: 'attack', name: 'Attack', baseDamage: 12, scalingPerPoint: 4 });
    const healSkill = createMockSkill({
      id: 'heal',
      name: 'Heal',
      baseDamage: 0, scalingPerPoint: 0,
      effects: [{ type: EffectType.HEAL, value: 50, duration: 0, chance: 1 }],
    });

    // Enemy with 20% HP (low)
    const lowHpEnemy = createMockEnemy({
      skills: [attackSkill, healSkill],
      currentHp: Math.floor(enemyStats.derived.maxHp * 0.2),
    });
    const player = createMockPlayer();

    // Run multiple times to account for randomness
    let healSelected = 0;
    for (let i = 0; i < 20; i++) {
      const context = { enemy: lowHpEnemy, enemyStats, player, playerStats };
      const selectedSkill = selectEnemySkill(context);
      if (selectedSkill?.id === 'heal') healSelected++;
    }

    // Heal should be selected most of the time when HP is low
    expect(healSelected).toBeGreaterThan(10);
  });

  it('prefers debuffs against healthy players', () => {
    const attackSkill = createMockSkill({ id: 'attack', name: 'Attack', baseDamage: 9, scalingPerPoint: 3 });
    const debuffSkill = createMockSkill({
      id: 'debuff',
      name: 'Stun',
      baseDamage: 3, scalingPerPoint: 1,
      effects: [{ type: EffectType.STUN, duration: 1, chance: 1 }],
    });

    const enemy = createMockEnemy({
      skills: [attackSkill, debuffSkill],
      currentHp: enemyStats.derived.maxHp, // Full HP enemy
    });

    // Player with full HP
    const healthyPlayer = createMockPlayer({
      currentHp: playerStats.derived.maxHp,
    });

    // Run multiple times
    let debuffSelected = 0;
    for (let i = 0; i < 20; i++) {
      const context = { enemy, enemyStats, player: healthyPlayer, playerStats };
      const selectedSkill = selectEnemySkill(context);
      if (selectedSkill?.id === 'debuff') debuffSelected++;
    }

    // Debuff should be selected more often against healthy players
    expect(debuffSelected).toBeGreaterThan(5);
  });

  it('prefers high damage skills to finish low HP player', () => {
    const lowDamageSkill = createMockSkill({ id: 'low', name: 'Poke', baseDamage: 3, scalingPerPoint: 1 });
    const highDamageSkill = createMockSkill({ id: 'high', name: 'Nuke', baseDamage: 30, scalingPerPoint: 10 });

    const enemy = createMockEnemy({
      skills: [lowDamageSkill, highDamageSkill],
    });

    // Player with very low HP (15%)
    const lowHpPlayer = createMockPlayer({
      currentHp: Math.floor(playerStats.derived.maxHp * 0.15),
    });

    // Run multiple times
    let highDamageSelected = 0;
    for (let i = 0; i < 20; i++) {
      const context = { enemy, enemyStats, player: lowHpPlayer, playerStats };
      const selectedSkill = selectEnemySkill(context);
      if (selectedSkill?.id === 'high') highDamageSelected++;
    }

    // High damage should be preferred to finish off low HP player
    expect(highDamageSelected).toBeGreaterThan(10);
  });

  it('skips skills on cooldown', () => {
    const availableSkill = createMockSkill({ id: 'available', currentCooldown: 0 });
    const cooldownSkill = createMockSkill({ id: 'cooldown', currentCooldown: 3 });

    const enemy = createMockEnemy({
      skills: [cooldownSkill, availableSkill],
    });
    const player = createMockPlayer();

    const context = { enemy, enemyStats, player, playerStats };
    const selectedSkill = selectEnemySkill(context);

    // Should select the available skill
    expect(selectedSkill!.id).toBe('available');
  });

  it('includes randomness in selection', () => {
    const skill1 = createMockSkill({ id: 'skill1', baseDamage: 6, scalingPerPoint: 2 });
    const skill2 = createMockSkill({ id: 'skill2', baseDamage: 6, scalingPerPoint: 2 });

    const enemy = createMockEnemy({
      skills: [skill1, skill2],
    });
    const player = createMockPlayer();

    // Run many times and check both skills are selected sometimes
    const selections: Record<string, number> = { skill1: 0, skill2: 0 };
    for (let i = 0; i < 50; i++) {
      const context = { enemy, enemyStats, player, playerStats };
      const selectedSkill = selectEnemySkill(context);
      expect(selectedSkill).toBeDefined();
      selections[selectedSkill!.id]++;
    }

    // Both skills should be selected at least sometimes (randomness)
    expect(selections.skill1).toBeGreaterThan(0);
    expect(selections.skill2).toBeGreaterThan(0);
  });

  it('returns undefined skill when enemy has an empty skills array', () => {
    const enemy = createMockEnemy({ skills: [] });
    const player = createMockPlayer();
    const context = { enemy, enemyStats, player, playerStats };

    const decision = selectEnemySkillDecision(context);
    expect(decision.skill).toBeUndefined();
    expect(decision.reason).toMatch(/no skills/i);

    const selected = selectEnemySkill(context);
    expect(selected).toBeUndefined();
  });

  it('treats EffectType.DEBUFF as a debuff for AI scoring', () => {
    const attackSkill = createMockSkill({ id: 'attack', name: 'Attack', baseDamage: 9, scalingPerPoint: 3 });
    const debuffSkill = createMockSkill({
      id: 'stat-debuff',
      name: 'Weaken',
      baseDamage: 3, scalingPerPoint: 1,
      effects: [
        {
          type: EffectType.DEBUFF,
          value: 0.25,
          duration: 2,
          chance: 1,
          targetStat: PrimaryStat.STRENGTH,
        },
      ],
    });

    const enemy = createMockEnemy({
      skills: [attackSkill, debuffSkill],
      currentHp: enemyStats.derived.maxHp,
    });
    const healthyPlayer = createMockPlayer({
      currentHp: playerStats.derived.maxHp,
    });

    let debuffSelected = 0;
    for (let i = 0; i < 20; i++) {
      const selectedSkill = selectEnemySkill({
        enemy,
        enemyStats,
        player: healthyPlayer,
        playerStats,
      });
      if (selectedSkill?.id === 'stat-debuff') debuffSelected++;
    }

    // DEBUFF should score like other control effects vs healthy players
    expect(debuffSelected).toBeGreaterThan(5);
  });
});
