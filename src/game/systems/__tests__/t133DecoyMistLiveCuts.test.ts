/**
 * T-133 AC: live outgoing chain includes Decoy and Mist; Smoke regression intact.
 */

import { describe, it, expect } from 'vitest';
import { CombatActor, MarkFamily } from '../../types';
import { applyOutgoingMarkCuts } from '../MarkSystem';
import type { Mark } from '../../types';

function mark(
  id: string,
  stacks: number,
  target: CombatActor = CombatActor.ENEMY,
): Mark {
  return {
    id,
    sourceSkillId: id,
    owner: CombatActor.PLAYER,
    target,
    duration: 1,
    stacks,
    family: MarkFamily.STAT,
  };
}

describe('T-133 decoy', () => {
  it('cuts 40 by decoy 20 and strips decoy', () => {
    const result = applyOutgoingMarkCuts(40, [mark('decoy', 20)]);
    expect(result.damage).toBe(20);
    expect(result.consumed).toBe(true);
    expect(result.marks.some((m) => m.id === 'decoy')).toBe(false);
  });
});

describe('T-133 mist', () => {
  it('cuts 40 by mist 20 and strips mist', () => {
    const result = applyOutgoingMarkCuts(40, [mark('mist', 20)]);
    expect(result.damage).toBe(20);
    expect(result.consumed).toBe(true);
    expect(result.marks.some((m) => m.id === 'mist')).toBe(false);
  });
});

describe('T-133 smoke regress', () => {
  it('smoke-only still cuts 40→15; empty marks passthrough', () => {
    const smoke = applyOutgoingMarkCuts(40, [mark('smoke', 25)]);
    expect(smoke.damage).toBe(15);
    expect(smoke.consumed).toBe(true);
    expect(smoke.marks.some((m) => m.id === 'smoke')).toBe(false);

    const empty = applyOutgoingMarkCuts(40, []);
    expect(empty.damage).toBe(40);
    expect(empty.consumed).toBe(false);
    expect(empty.marks).toHaveLength(0);
  });

  it('Mist then Decoy both cut on one hit (Fear→Smoke→Mist→Decoy→ReadWindow)', () => {
    const both = applyOutgoingMarkCuts(40, [mark('decoy', 20), mark('mist', 20)]);
    expect(both.damage).toBe(0);
    expect(both.consumed).toBe(true);
    expect(both.marks.some((m) => m.id === 'decoy' || m.id === 'mist')).toBe(false);
  });
});
