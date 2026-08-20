/**
 * T-140 AC: allowlisted STAT Marks fold into integer primaries; unknown STAT ignored.
 */

import { describe, expect, it } from 'vitest';
import { CombatActor, MarkFamily } from '../../types';
import {
  applyStatMarksToPrimaryStats,
  primaryDeltasFromStatMarks,
} from '../MarkSystem';
import { getEnemyFullStats } from '../StatSystem';
import type { Mark } from '../../types';
import { BASE_STATS, createMockEnemy } from './testFixtures';

function statMark(id: string, stacks: number, target = CombatActor.ENEMY): Mark {
  return {
    id,
    sourceSkillId: id,
    owner: CombatActor.PLAYER,
    target,
    duration: 2,
    stacks,
    family: MarkFamily.STAT,
  };
}

describe('T-140 spd', () => {
  it('enemy-targeted spd_down stacks 1 yields speed −1 and respects floor 1', () => {
    const deltas = primaryDeltasFromStatMarks([statMark('spd_down', 1)], CombatActor.ENEMY);
    expect(deltas.speed).toBe(-1);
    const applied = applyStatMarksToPrimaryStats(BASE_STATS, [statMark('spd_down', 1)], CombatActor.ENEMY);
    expect(applied.speed).toBe(BASE_STATS.speed - 1);
    const floored = applyStatMarksToPrimaryStats(
      { ...BASE_STATS, speed: 1 },
      [statMark('spd_down', 5)],
      CombatActor.ENEMY,
    );
    expect(floored.speed).toBe(1);
    expect(applyStatMarksToPrimaryStats(BASE_STATS, [], CombatActor.ENEMY).speed).toBe(BASE_STATS.speed);
  });
});

describe('T-140 acc', () => {
  it('blinded stacks 2 yields accuracy −2', () => {
    const applied = applyStatMarksToPrimaryStats(
      BASE_STATS,
      [statMark('blinded', 2)],
      CombatActor.ENEMY,
    );
    expect(applied.accuracy).toBe(BASE_STATS.accuracy - 2);
    expect(primaryDeltasFromStatMarks([statMark('air_acc_down', 1)], CombatActor.ENEMY).accuracy).toBe(-1);
  });
});

describe('T-140 allowlist', () => {
  it('aim STAT mark does not change primaries', () => {
    const applied = applyStatMarksToPrimaryStats(
      BASE_STATS,
      [statMark('aim', 3)],
      CombatActor.ENEMY,
    );
    expect(applied).toEqual(BASE_STATS);
    expect(primaryDeltasFromStatMarks([statMark('aim', 3)], CombatActor.ENEMY)).toEqual({});
  });
});

describe('T-140 live', () => {
  it('getEnemyFullStats with spd_down lowers effectivePrimary.speed by 1 vs bare', () => {
    const enemy = createMockEnemy({ primaryStats: { ...BASE_STATS }, activeBuffs: [] });
    const bare = getEnemyFullStats(enemy);
    const armed = getEnemyFullStats(enemy, [statMark('spd_down', 1)]);
    expect(armed.effectivePrimary.speed).toBe(bare.effectivePrimary.speed - 1);
    expect(armed.primary.speed).toBe(bare.primary.speed);
  });
});
