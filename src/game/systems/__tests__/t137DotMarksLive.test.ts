/**
 * T-137 AC: MarkFamily.DOT ticks stacks on affected actor opportunity; duration owned by clock.
 */

import { describe, it, expect } from 'vitest';
import {
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
} from '../../types';
import { calculateDerivedStats } from '../StatSystem';
import { processEnemyTurn } from '../EnemyTurnSystem';
import { createCombatState } from '../CombatWorkflowSystem';
import { tickDotMarksForActor } from '../MarkSystem';
import type { Mark } from '../../types';
import { BASE_STATS, createMockEnemy, createMockPlayer, createMockSkill } from './testFixtures';

function bleed(stacks: number, duration = 2, id = 'bleed'): Mark {
  return {
    id,
    sourceSkillId: 'kunai_slash',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration,
    stacks,
    family: MarkFamily.DOT,
  };
}

describe('T-137 pure', () => {
  it('enemy bleed stacks 3 deals 3 once and does not decrement duration', () => {
    const marks = [bleed(3, 2)];
    const result = tickDotMarksForActor(marks, CombatActor.ENEMY);
    expect(result.damage).toBe(3);
    expect(result.marks[0]?.duration).toBe(2);
    expect(result.marks[0]?.stacks).toBe(3);
    expect(tickDotMarksForActor([], CombatActor.ENEMY).damage).toBe(0);
  });
});

describe('T-137 sum', () => {
  it('two DoT marks on the same target sum damage', () => {
    const result = tickDotMarksForActor(
      [bleed(3), bleed(4, 2, 'poison')],
      CombatActor.ENEMY,
    );
    expect(result.damage).toBe(7);
    expect(result.marks).toHaveLength(2);
    expect(result.marks.every((m) => m.duration === 2)).toBe(true);
  });
});

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

describe('T-137 live', () => {
  it('enemy-turn opportunity reduces enemy HP by bleed tick; without Mark no package', () => {
    const enemyHp = 80;
    const stunned = createMockEnemy({
      currentHp: enemyHp,
      activeBuffs: [stunBuff],
      skills: [createMockSkill({ apCost: 1, currentCooldown: 0 })],
    });
    const player = createMockPlayer({ currentHp: 10_000, activeBuffs: [] });
    const combat = {
      ...createCombatState(),
      isFirstTurn: false,
      currentRange: CombatRange.CLOSE,
      marks: [bleed(3)],
    };
    const armed = processEnemyTurn(player, playerStats, stunned, enemyStats, combat);
    expect(armed.newEnemyHp).toBe(enemyHp - 3);
    expect(armed.marks?.find((m) => m.id === 'bleed')?.duration).toBe(2);

    const bare = processEnemyTurn(
      player,
      playerStats,
      stunned,
      enemyStats,
      { ...combat, marks: [] },
    );
    expect(bare.newEnemyHp).toBe(enemyHp);
  });
});
