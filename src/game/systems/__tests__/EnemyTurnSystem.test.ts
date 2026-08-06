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
 *
 * Package 5: invuln survives first enemy hit; CHAKRA_REGEN/DRAIN ticks.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { processEnemyTurn, processBuffTicks, executeEnemyAction } from '../EnemyTurnSystem';
import { calculateDerivedStats } from '../StatSystem';
import { Player, Enemy, CharacterStats, EffectType, AttackMethod, PrimaryStat } from '../../types';
import {
  createMockPlayer,
  createMockEnemy,
  createMockSkill,
  createInvulnBuff,
  BASE_STATS,
} from './testFixtures';

afterEach(() => {
  vi.restoreAllMocks();
});

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
    const bigSkill = createMockSkill({ id: 'big', name: 'Big', cooldown: 3, currentCooldown: 0, baseDamage: 6, scalingPerPoint: 2 });
    const weakSkill = createMockSkill({ id: 'weak', name: 'Weak', cooldown: 0, currentCooldown: 1, baseDamage: 6, scalingPerPoint: 2 });

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
    const bigSkill = createMockSkill({ id: 'big', name: 'Big', cooldown: 3, currentCooldown: 0, baseDamage: 6, scalingPerPoint: 2 });
    // weak is available every turn after turn 1, so the enemy never has to fall
    // back to re-using bigSkill while it is cooling down.
    const weakSkill = createMockSkill({ id: 'weak', name: 'Weak', cooldown: 0, currentCooldown: 1, baseDamage: 6, scalingPerPoint: 2 });

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
    const bigSkill = createMockSkill({ id: 'big', cooldown: 3, currentCooldown: 0, baseDamage: 6, scalingPerPoint: 2 });
    const weakSkill = createMockSkill({ id: 'weak', cooldown: 0, currentCooldown: 1, baseDamage: 6, scalingPerPoint: 2 });
    const enemy = createMockEnemy({ skills: [bigSkill, weakSkill], currentHp: 10_000 });
    const player = createMockPlayer({ currentHp: 10_000 });

    const result = processEnemyTurn(player, playerStats, enemy, enemyStats);

    // Original enemy skill objects are untouched; new skills live in the result.
    expect(enemy.skills[0].currentCooldown).toBe(0);
    expect(result.enemySkills[0]).not.toBe(enemy.skills[0]);
  });
});

describe('processEnemyTurn — stun duration 1 (A-004)', () => {
  it('skips the enemy action when STUN duration is 1, then expires the stun', () => {
    const attack = createMockSkill({ id: 'atk', cooldown: 0, baseDamage: 12, scalingPerPoint: 4 });
    const playerHp = 10_000;
    const player = createMockPlayer({ currentHp: playerHp });
    const enemy = createMockEnemy({
      skills: [attack],
      currentHp: 10_000,
      activeBuffs: [
        {
          id: 'stun-1',
          name: EffectType.STUN,
          duration: 1,
          effect: { type: EffectType.STUN, duration: 1, chance: 1 },
          source: 'test',
        },
      ],
    });

    const result = processEnemyTurn(player, playerStats, enemy, enemyStats);

    // Enemy was stunned — did not deal attack damage to the player
    expect(result.logMessages.some(m => /STUNNED/i.test(m))).toBe(true);
    expect(result.newPlayerHp).toBe(playerHp);
    // Stun expires after the skipped action (duration 1)
    expect(result.newEnemyBuffs.some(b => b.effect.type === EffectType.STUN)).toBe(false);
  });
});

describe('processEnemyTurn — INVULNERABILITY survives first enemy hit (Package 5)', () => {
  it('blocks the first enemy attack with duration-1 invuln, then expires the buff', () => {
    // Low RNG → hit, no crit noise
    vi.spyOn(Math, 'random').mockReturnValue(0.05);

    const attack = createMockSkill({
      id: 'atk',
      name: 'Heavy Strike',
      cooldown: 0,
      baseDamage: 30, scalingPerPoint: 10,
      attackMethod: AttackMethod.AUTO, // skip hit RNG
    });
    const playerHp = 500;
    const player = createMockPlayer({
      currentHp: playerHp,
      activeBuffs: [createInvulnBuff(1)],
    });
    const enemy = createMockEnemy({
      skills: [attack],
      currentHp: 10_000,
    });

    const result = processEnemyTurn(player, playerStats, enemy, enemyStats);

    // Invuln blocked the hit — player HP unchanged by the attack
    expect(result.newPlayerHp).toBe(playerHp);
    expect(result.logMessages.some(m => /Invulnerable/i.test(m))).toBe(true);
    // Duration-1 invuln expires after Phase 4 (deferred tick)
    expect(result.newPlayerBuffs.some(b => b.effect?.type === EffectType.INVULNERABILITY)).toBe(
      false
    );
  });
});

describe('processBuffTicks — CHAKRA_REGEN / CHAKRA_DRAIN (Package 5)', () => {
  it('restores chakra from CHAKRA_REGEN self-buff', () => {
    const buffs = [
      {
        id: 'cr',
        name: EffectType.CHAKRA_REGEN,
        duration: 1,
        effect: { type: EffectType.CHAKRA_REGEN, value: 15, duration: 1, chance: 1 },
        source: 'Focused Breathing',
      },
    ];
    const result = processBuffTicks(
      100,
      buffs,
      playerStats,
      'You',
      true,
      200,
      true,
      40,
      100
    );

    expect(result.newChakra).toBe(55); // 40 + 15
    expect(result.logs.some(m => /regenerates 15 CP/i.test(m))).toBe(true);
  });

  it('drains chakra from CHAKRA_DRAIN debuff', () => {
    const buffs = [
      {
        id: 'cd',
        name: EffectType.CHAKRA_DRAIN,
        duration: 2,
        effect: { type: EffectType.CHAKRA_DRAIN, value: 20, duration: 2, chance: 1 },
        source: 'Gentle Fist',
      },
    ];
    const result = processBuffTicks(
      100,
      buffs,
      enemyStats,
      'Enemy',
      false,
      undefined,
      true,
      50,
      100
    );

    expect(result.newChakra).toBe(30); // 50 - 20
    expect(result.logs.some(m => /loses 20 CP/i.test(m))).toBe(true);
  });
});

describe('executeEnemyAction — HEAL + self-buffs on enemy (Package 3)', () => {
  const gutsContext = { triggered: false, artifactTriggered: false };
  const enemyStatsLocal: CharacterStats = {
    primary: BASE_STATS,
    effectivePrimary: BASE_STATS,
    derived: calculateDerivedStats(BASE_STATS, {}),
  };

  it('applies HEAL as instant enemy HP restore (not a lingering buff)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05);

    const healSkill = createMockSkill({
      id: 'enemy-heal',
      name: 'Recovery',
      baseDamage: 1, scalingPerPoint: 0,
      attackMethod: AttackMethod.AUTO,
      scalingStat: PrimaryStat.STRENGTH,
      effects: [{ type: EffectType.HEAL, value: 40, duration: 0, chance: 1 }],
    });
    const maxHp = enemyStatsLocal.derived.maxHp;
    const enemy = createMockEnemy({
      skills: [healSkill],
      currentHp: maxHp - 50,
      activeBuffs: [],
    });
    const player = createMockPlayer({ currentHp: 10_000, activeBuffs: [] });

    const result = executeEnemyAction(
      player,
      playerStats,
      enemy,
      enemyStatsLocal,
      gutsContext
    );

    expect(result.enemy.currentHp).toBe(maxHp - 50 + 40);
    expect(result.logs.some(m => /HEAL \+40 HP/i.test(m))).toBe(true);
    expect(result.enemy.activeBuffs.some(b => b.effect?.type === EffectType.HEAL)).toBe(false);
  });

  it('applies SHIELD / BUFF / REGEN self-buffs to the enemy, not the player', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05);

    const selfBuffSkill = createMockSkill({
      id: 'enemy-buff',
      name: 'Iron Guard',
      baseDamage: 1, scalingPerPoint: 0,
      attackMethod: AttackMethod.AUTO,
      effects: [
        { type: EffectType.SHIELD, value: 30, duration: 2, chance: 1 },
        { type: EffectType.BUFF, value: 0.2, duration: 2, chance: 1, targetStat: PrimaryStat.STRENGTH },
        { type: EffectType.REGEN, value: 5, duration: 2, chance: 1 },
      ],
    });
    const enemy = createMockEnemy({
      skills: [selfBuffSkill],
      currentHp: 10_000,
      activeBuffs: [],
    });
    const player = createMockPlayer({ currentHp: 10_000, activeBuffs: [] });

    const result = executeEnemyAction(
      player,
      playerStats,
      enemy,
      enemyStatsLocal,
      gutsContext
    );

    const enemyTypes = result.enemy.activeBuffs.map(b => b.effect.type);
    expect(enemyTypes).toContain(EffectType.SHIELD);
    expect(enemyTypes).toContain(EffectType.BUFF);
    expect(enemyTypes).toContain(EffectType.REGEN);

    const playerTypes = result.player.activeBuffs.map(b => b.effect.type);
    expect(playerTypes).not.toContain(EffectType.SHIELD);
    expect(playerTypes).not.toContain(EffectType.BUFF);
    expect(playerTypes).not.toContain(EffectType.REGEN);
  });

  it('still applies debuffs to the player (not the enemy)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05);

    const debuffSkill = createMockSkill({
      id: 'enemy-stun',
      name: 'Stun Jutsu',
      baseDamage: 3, scalingPerPoint: 1,
      attackMethod: AttackMethod.AUTO,
      effects: [{ type: EffectType.STUN, duration: 1, chance: 1 }],
    });
    const enemy = createMockEnemy({
      skills: [debuffSkill],
      currentHp: 10_000,
      activeBuffs: [],
    });
    const player = createMockPlayer({ currentHp: 10_000, activeBuffs: [] });

    const result = executeEnemyAction(
      player,
      playerStats,
      enemy,
      enemyStatsLocal,
      gutsContext
    );

    expect(result.player.activeBuffs.some(b => b.effect.type === EffectType.STUN)).toBe(true);
    expect(result.enemy.activeBuffs.some(b => b.effect.type === EffectType.STUN)).toBe(false);
  });
});
