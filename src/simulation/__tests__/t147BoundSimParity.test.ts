/**
 * T-147 AC: BattleSimulator honors enemyVoluntaryMoveBlocked before shift.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  CombatActor,
  CombatRange,
  MarkFamily,
  RangeMoveDirection,
} from '../../game/types';
import { BOUND_MARK_ID } from '../../game/systems/RangeSystem';
import { applySimEnemyVoluntaryMove } from '../BattleSimulator';
import type { Mark } from '../../game/types';

function boundMark(): Mark {
  return {
    id: BOUND_MARK_ID,
    sourceSkillId: 'shadow_possession',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 1,
    stacks: 1,
    family: MarkFamily.HARD_CONTROL,
  };
}

describe('T-147 blocked', () => {
  it('does not voluntary-shift range while enemy Bound is present', () => {
    const result = applySimEnemyVoluntaryMove(
      CombatRange.CLOSE,
      RangeMoveDirection.RETREAT,
      [boundMark()],
    );
    expect(result.moved).toBe(false);
    expect(result.range).toBe(CombatRange.CLOSE);
  });
});

describe('T-147 free', () => {
  it('voluntary RETREAT from CLOSE succeeds without Bound', () => {
    const result = applySimEnemyVoluntaryMove(
      CombatRange.CLOSE,
      RangeMoveDirection.RETREAT,
      [],
    );
    expect(result.moved).toBe(true);
    expect(result.range).toBe(CombatRange.MEDIUM);
  });
});

describe('T-147 wired', () => {
  it('BattleSimulator source calls enemyVoluntaryMoveBlocked before shift', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, '../BattleSimulator.ts'), 'utf8');
    expect(src).toContain('enemyVoluntaryMoveBlocked');
    const gateIdx = src.indexOf('enemyVoluntaryMoveBlocked');
    const shiftIdx = src.indexOf('shiftRange(currentRange, moveDirection)');
    expect(gateIdx).toBeGreaterThan(-1);
    expect(shiftIdx).toBeGreaterThan(gateIdx);
  });
});
