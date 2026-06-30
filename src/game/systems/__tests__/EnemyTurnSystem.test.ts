/**
 * EnemyTurnSystem Unit Tests
 *
 * Regression coverage for the enemy skill-cooldown decrement.
 *
 * Bug history: `processEnemyTurn` only decremented the PLAYER's skill cooldowns
 * (Phase 5 / processPostTurnResources). Enemy skills were set to `cooldown + 1`
 * on use but never decremented, and `EnemyTurnResult` did not carry them back to
 * the caller at all. Consequence: enemy cooldown skills stayed locked forever,
 * the AI ran out of available skills, and fell back to spamming `skills[0]`.
 *
 * These tests assert that an enemy cooldown skill counts down toward 0 across
 * consecutive enemy turns (when the decremented skills are fed back like the
 * real caller does) and becomes available again after `cooldown` turns.
 */

import { describe, it, expect } from 'vitest';
import { processEnemyTurn } from '../EnemyTurnSystem';
import { calculateDerivedStats } from '../StatSystem';
import { Player, Enemy, CharacterStats } from '../../types';
import { createMockPlayer, createMockEnemy, createMockSkill, BASE_STATS } from './testFixtures';

const playerStats: CharacterStats = {
  primary: BASE_STATS,
  effectivePrimary: BASE_STATS,
  derived: calculateDerivedStats(BASE_STATS, {}),
};

const enemyStats: CharacterStats = {
  primary: BASE_STATS,
  effectivePrimary: BASE_STATS,
  derived: calculateDerivedStats(BASE_STATS, {}),
};

/**
 * Runs one enemy turn and folds the result back into player/enemy exactly the
 * way the real caller (useCombat.ts) does — including persisting enemy skills.
 * This is what makes the cooldown decrement actually carry across turns.
 */
function advanceEnemyTurn(player: Player, enemy: Enemy) {
  const result = processEnemyTurn(player, playerStats, enemy, enemyStats);
  return {
    result,
    player: {
      ...player,
      currentHp: result.newPlayerHp,
      activeBuffs: result.newPlayerBuffs,
      skills: result.playerSkills,
    },
    enemy: {
      ...enemy,
      currentHp: result.newEnemyHp,
      activeBuffs: result.newEnemyBuffs,
      skills: result.enemySkills,
    },
  };
}

const cooldownOf = (enemy: Enemy, id: string) =>
  enemy.skills.find(s => s.id === id)!.currentCooldown;

describe('processEnemyTurn — enemy skill cooldowns', () => {
  it('returns the enemy skills in the result so the caller can persist them', () => {
    const enemy = createMockEnemy({
      skills: [createMockSkill({ id: 'atk', cooldown: 0 })],
      currentHp: 10_000,
    });
    const player = createMockPlayer({ currentHp: 10_000 });

    const result = processEnemyTurn(player, playerStats, enemy, enemyStats);

    expect(result.enemySkills).toBeDefined();
    expect(result.enemySkills).toHaveLength(1);
    expect(result.enemySkills[0].id).toBe('atk');
  });

  it('decrements a used cooldown skill to its cooldown value on the turn it is used (not cooldown+1)', () => {
    // bigSkill is the only available skill on turn 1 (weak starts on cooldown),
    // so the enemy is forced to use it and put it on cooldown.
    const bigSkill = createMockSkill({ id: 'big', name: 'Big', cooldown: 3, currentCooldown: 0, damageMult: 1.0 });
    const weakSkill = createMockSkill({ id: 'weak', name: 'Weak', cooldown: 0, currentCooldown: 1, damageMult: 1.0 });

    const enemy = createMockEnemy({ skills: [bigSkill, weakSkill], currentHp: 10_000 });
    const player = createMockPlayer({ currentHp: 10_000 });

    const { enemy: afterTurn1, result } = advanceEnemyTurn(player, enemy);

    // The enemy used the cooldown skill this turn.
    expect(result.logMessages.some(m => m.includes('Big'))).toBe(true);

    // Used skill is set to cooldown+1 (=4) on use, then Phase 5 decrements to
    // exactly `cooldown` (=3). The bug would leave it at 4 (or 0 if never persisted).
    expect(cooldownOf(afterTurn1, 'big')).toBe(bigSkill.cooldown);
    expect(cooldownOf(afterTurn1, 'big')).not.toBe(bigSkill.cooldown + 1);
  });

  it('counts a used cooldown skill down to 0 and makes it available again (never stuck forever)', () => {
    const bigSkill = createMockSkill({ id: 'big', name: 'Big', cooldown: 3, currentCooldown: 0, damageMult: 1.0 });
    // weak is available every turn after turn 1, so the enemy never has to fall
    // back to re-using bigSkill while it is cooling down.
    const weakSkill = createMockSkill({ id: 'weak', name: 'Weak', cooldown: 0, currentCooldown: 1, damageMult: 1.0 });

    let player: Player = createMockPlayer({ currentHp: 10_000 });
    let enemy: Enemy = createMockEnemy({ skills: [bigSkill, weakSkill], currentHp: 10_000 });

    // Turn 1: enemy uses bigSkill → on cooldown at value `cooldown` (3).
    ({ player, enemy } = advanceEnemyTurn(player, enemy));
    const observed: number[] = [cooldownOf(enemy, 'big')];

    // Subsequent turns: bigSkill is on cooldown, enemy uses weak, bigSkill ticks down.
    for (let i = 0; i < bigSkill.cooldown; i++) {
      ({ player, enemy } = advanceEnemyTurn(player, enemy));
      observed.push(cooldownOf(enemy, 'big'));
    }

    // Strictly decreasing toward 0: [3, 2, 1, 0]
    expect(observed).toEqual([3, 2, 1, 0]);

    // It is available again (currentCooldown <= 0) — not stuck on cooldown forever.
    expect(cooldownOf(enemy, 'big')).toBeLessThanOrEqual(0);
  });

  it('does not mutate the input enemy skills (immutable update)', () => {
    const bigSkill = createMockSkill({ id: 'big', cooldown: 3, currentCooldown: 0, damageMult: 1.0 });
    const weakSkill = createMockSkill({ id: 'weak', cooldown: 0, currentCooldown: 1, damageMult: 1.0 });
    const enemy = createMockEnemy({ skills: [bigSkill, weakSkill], currentHp: 10_000 });
    const player = createMockPlayer({ currentHp: 10_000 });

    const result = processEnemyTurn(player, playerStats, enemy, enemyStats);

    // Original enemy skill objects are untouched; new skills live in the result.
    expect(enemy.skills[0].currentCooldown).toBe(0);
    expect(result.enemySkills[0]).not.toBe(enemy.skills[0]);
  });
});
