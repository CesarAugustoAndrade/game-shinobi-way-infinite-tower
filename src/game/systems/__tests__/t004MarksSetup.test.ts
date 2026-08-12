/**
 * T-004 AC tests: Marks / Tactical Setup consume + multi-hit + duration/terrain.
 */

import { describe, it, expect } from 'vitest';
import {
  CombatActor,
  Mark,
  MarkConsumeTiming,
  MarkFamily,
} from '../../types';
import {
  addMark,
  applyCardResolveConsumes,
  clearMarks,
  consumeOnAttempt,
  consumeOnImpact,
  listMarks,
  resolveHardControlSkips,
  resolveMultiHit,
  tickMarkDurations,
} from '../MarkSystem';
import { createMockTerrain } from './testFixtures';

const mark = (overrides: Partial<Mark> & Pick<Mark, 'id'>): Mark => ({
  sourceSkillId: 'src',
  owner: CombatActor.PLAYER,
  target: CombatActor.ENEMY,
  duration: 2,
  stacks: 1,
  ...overrides,
});

describe('T-004 attempt impact consume', () => {
  it('spends own attempt-mark on commit even when every hit misses', () => {
    const setup = [
      mark({ id: 'focus', owner: CombatActor.PLAYER, consume: MarkConsumeTiming.ATTEMPT }),
      mark({ id: 'brand', owner: CombatActor.PLAYER, target: CombatActor.ENEMY, consume: MarkConsumeTiming.IMPACT }),
    ];
    const multi = resolveMultiHit({ hitCount: 2 }, () => ({ hit: false, damage: 0 }));
    expect(multi.hitsLanded).toBe(0);
    const result = applyCardResolveConsumes(setup, CombatActor.PLAYER, CombatActor.ENEMY, multi);
    expect(result.attemptSpent.map((m) => m.id)).toEqual(['focus']);
    expect(result.impactSpent).toEqual([]);
    expect(listMarks(result.marks, { id: 'focus' })).toEqual([]);
    expect(listMarks(result.marks, { id: 'brand' })).toHaveLength(1);
  });

  it('spends enemy impact-mark only when ≥1 hit lands; miss preserves it', () => {
    const setup = [
      mark({ id: 'brand', consume: MarkConsumeTiming.IMPACT }),
    ];
    const miss = consumeOnImpact(setup, CombatActor.ENEMY, 0);
    expect(miss.spent).toEqual([]);
    expect(miss.marks).toHaveLength(1);

    const hit = consumeOnImpact(setup, CombatActor.ENEMY, 1);
    expect(hit.spent.map((m) => m.id)).toEqual(['brand']);
    expect(hit.marks).toEqual([]);
  });

  it('does not spend read-only marks', () => {
    const setup = [mark({ id: 'read', consume: MarkConsumeTiming.NONE })];
    expect(consumeOnAttempt(setup, CombatActor.PLAYER).spent).toEqual([]);
    expect(consumeOnImpact(setup, CombatActor.ENEMY, 2).spent).toEqual([]);
  });
});

describe('T-004 multi-hit partial', () => {
  it('hitCount=3 with 1 success fires once-per-card consume once; 0 hits does not', () => {
    let rolls = 0;
    const sequence = [false, true, false];
    const partial = resolveMultiHit({ hitCount: 3 }, () => {
      const hit = sequence[rolls] ?? false;
      rolls += 1;
      return { hit, damage: hit ? 10 : 0 };
    });
    expect(partial.rollCount).toBe(3);
    expect(rolls).toBe(3);
    expect(partial.hitsLanded).toBe(1);
    expect(partial.fireOncePerCard).toBe(true);
    expect(partial.perHitProcs).toBe(1);
    expect(partial.drainHealFromTotal).toBe(10);

    const setup = [mark({ id: 'brand', consume: MarkConsumeTiming.IMPACT })];
    const consumed = applyCardResolveConsumes(setup, CombatActor.PLAYER, CombatActor.ENEMY, partial);
    expect(consumed.impactSpent).toHaveLength(1);

    const none = resolveMultiHit({ hitCount: 3 }, () => ({ hit: false }));
    expect(none.hitsLanded).toBe(0);
    expect(none.fireOncePerCard).toBe(false);
    const noImpact = applyCardResolveConsumes(setup, CombatActor.PLAYER, CombatActor.ENEMY, none);
    expect(noImpact.impactSpent).toHaveLength(0);
  });
});

describe('T-004 duration and terrain isolation', () => {
  it('ticks duration to 0 and drops the mark from setup', () => {
    const one = mark({ id: 'fade', duration: 1 });
    const after = tickMarkDurations([one]);
    expect(after).toEqual([]);
    const two = tickMarkDurations([mark({ id: 'linger', duration: 2 })]);
    expect(two[0]?.duration).toBe(1);
  });

  it('addMark never mutates a provided TerrainDefinition', () => {
    const terrain = createMockTerrain({ name: 'Bridge' });
    const frozen = JSON.parse(JSON.stringify(terrain));
    const result = addMark([], mark({ id: 'seal', family: MarkFamily.DOT }), terrain);
    expect(result.terrain).toBe(terrain);
    expect(terrain).toEqual(frozen);
    expect(result.marks).toHaveLength(1);
  });

  it('clears the board and merges STAT stacks without touching terrain', () => {
    const first = addMark([], mark({ id: 'str', family: MarkFamily.STAT, stacks: 2 }));
    const second = addMark(first.marks, mark({ id: 'str', family: MarkFamily.STAT, stacks: 3 }));
    expect(second.marks).toHaveLength(1);
    expect(second.marks[0].stacks).toBe(5);
    expect(clearMarks(second.marks)).toEqual([]);
    expect(resolveHardControlSkips([
      mark({ id: 'stun-a', family: MarkFamily.HARD_CONTROL, stacks: 1 }),
      mark({ id: 'stun-b', family: MarkFamily.HARD_CONTROL, stacks: 1 }),
    ])).toBe(1);
  });
});
