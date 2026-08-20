/**
 * T-142 AC: live enemy opportunity fires C4 35 TRUE once and consumes.
 */

import { describe, expect, it } from 'vitest';
import { CombatActor, CombatRange, EffectType, MarkFamily } from '../../types';
import { calculateDerivedStats } from '../StatSystem';
import { processEnemyTurn } from '../EnemyTurnSystem';
import { createCombatState } from '../CombatWorkflowSystem';
import { C4_MARK_ID, C4_TRUE_DAMAGE } from '../MarkSystem';
import type { Mark } from '../../types';
import { BASE_STATS, createMockEnemy, createMockPlayer, createMockSkill } from './testFixtures';

function c4Mark(): Mark {
  return {
    id: C4_MARK_ID,
    sourceSkillId: 'c4_karura',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 1,
    stacks: C4_TRUE_DAMAGE,
    family: MarkFamily.STAT,
  };
}

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

const stunBuff = {
  id: 'stun',
  name: 'Stun',
  duration: 2,
  source: 'test',
  effect: { type: EffectType.STUN, duration: 2, chance: 1 },
};

function stunnedEnemy(hp: number) {
  return createMockEnemy({
    currentHp: hp,
    activeBuffs: [stunBuff],
    skills: [createMockSkill({ apCost: 1, currentCooldown: 0 })],
  });
}

describe('T-142 live', () => {
  it('enemy-turn with c4 reduces enemy HP by 35 and strips the mark', () => {
    const enemyHp = 80;
    const player = createMockPlayer({ currentHp: 10_000, activeBuffs: [] });
    const combat = {
      ...createCombatState(),
      isFirstTurn: false,
      currentRange: CombatRange.CLOSE,
      marks: [c4Mark()],
    };
    const armed = processEnemyTurn(
      player,
      playerStats,
      stunnedEnemy(enemyHp),
      enemyStats,
      combat,
    );
    expect(armed.newEnemyHp).toBe(enemyHp - C4_TRUE_DAMAGE);
    expect(armed.marks?.some((m) => m.id === C4_MARK_ID)).toBe(false);
    expect(armed.logMessages.some((line) => /C4 detonates/i.test(line))).toBe(true);
  });
});

describe('T-142 absent', () => {
  it('enemy-turn without c4 does not apply the 35 package', () => {
    const enemyHp = 80;
    const player = createMockPlayer({ currentHp: 10_000, activeBuffs: [] });
    const combat = {
      ...createCombatState(),
      isFirstTurn: false,
      currentRange: CombatRange.CLOSE,
      marks: [],
    };
    const bare = processEnemyTurn(
      player,
      playerStats,
      stunnedEnemy(enemyHp),
      enemyStats,
      combat,
    );
    expect(bare.newEnemyHp).toBe(enemyHp);
    expect(bare.marks ?? []).toEqual([]);
  });
});

describe('T-142 once', () => {
  it('second opportunity on a stripped board does not apply another 35', () => {
    const enemyHp = 80;
    const player = createMockPlayer({ currentHp: 10_000, activeBuffs: [] });
    const combat = {
      ...createCombatState(),
      isFirstTurn: false,
      currentRange: CombatRange.CLOSE,
      marks: [c4Mark()],
    };
    const first = processEnemyTurn(
      player,
      playerStats,
      stunnedEnemy(enemyHp),
      enemyStats,
      combat,
    );
    expect(first.newEnemyHp).toBe(enemyHp - C4_TRUE_DAMAGE);
    const second = processEnemyTurn(
      player,
      playerStats,
      stunnedEnemy(first.newEnemyHp),
      enemyStats,
      { ...combat, marks: first.marks ?? [] },
    );
    expect(second.newEnemyHp).toBe(first.newEnemyHp);
    expect(second.marks?.some((m) => m.id === C4_MARK_ID)).toBe(false);
  });
});
