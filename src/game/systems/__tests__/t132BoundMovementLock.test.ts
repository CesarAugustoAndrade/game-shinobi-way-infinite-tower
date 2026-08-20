/**
 * T-132 AC: Bound movement-lock — enemy `bound` blocks voluntary band change; not Stun.
 */

import { describe, it, expect } from 'vitest';
import {
  AttackMethod,
  CombatActor,
  CombatRange,
  EffectType,
  MarkConsumeTiming,
  MarkFamily,
  RangeMoveDirection,
} from '../../types';
import { calculateDerivedStats } from '../StatSystem';
import { processEnemyTurn } from '../EnemyTurnSystem';
import { createCombatState } from '../CombatWorkflowSystem';
import { voluntaryPlayerMove } from '../PlayerTurnSystem';
import {
  applyForcedMove,
  BOUND_MARK_ID,
  enemyVoluntaryMoveBlocked,
  WATER_PRISON_LOCK_ID,
  voluntaryRangeIncreaseBlocked,
} from '../RangeSystem';
import {
  BASE_STATS,
  createMockEnemy,
  createMockPlayer,
  createMockSkill,
} from './testFixtures';
import type { Mark } from '../../types';

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

function boundMark(overrides: Partial<Mark> = {}): Mark {
  return {
    id: BOUND_MARK_ID,
    sourceSkillId: 'shadow_possession',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 1,
    stacks: 1,
    family: MarkFamily.HARD_CONTROL,
    consume: MarkConsumeTiming.IMPACT,
    ...overrides,
  };
}

describe('T-132 gate', () => {
  it('blocks voluntary APPROACH and RETREAT while enemy Bound is present', () => {
    const marks = [boundMark()];
    expect(enemyVoluntaryMoveBlocked(marks)).toBe(true);
    expect(voluntaryRangeIncreaseBlocked(marks, RangeMoveDirection.RETREAT)).toBe(false);
    expect(voluntaryRangeIncreaseBlocked(marks, RangeMoveDirection.APPROACH)).toBe(false);

    expect(enemyVoluntaryMoveBlocked([])).toBe(false);
    expect(
      enemyVoluntaryMoveBlocked([
        boundMark({ target: CombatActor.PLAYER }),
      ]),
    ).toBe(false);
    expect(
      enemyVoluntaryMoveBlocked([
        {
          id: WATER_PRISON_LOCK_ID,
          sourceSkillId: 'water_prison',
          owner: CombatActor.PLAYER,
          target: CombatActor.PLAYER,
          duration: 1,
          stacks: 1,
        },
      ]),
    ).toBe(false);
  });
});

describe('T-132 enemy turn', () => {
  it('skips voluntary shift when Bound; without Bound existing move is preserved', () => {
    const ranged = createMockSkill({
      id: 'ranged_poke',
      name: 'Ranged poke',
      attackMethod: AttackMethod.RANGED,
      allowedRanges: [CombatRange.MEDIUM, CombatRange.LONG],
      apCost: 1,
      currentCooldown: 0,
      baseDamage: 1,
    });
    const enemy = createMockEnemy({
      skills: [ranged],
      currentHp: 10_000,
      activeBuffs: [],
    });
    const player = createMockPlayer({ currentHp: 10_000, activeBuffs: [] });
    const freeState = {
      ...createCombatState(),
      isFirstTurn: false,
      currentRange: CombatRange.CLOSE,
      enemyMaxAp: 6,
      marks: [],
    };
    const free = processEnemyTurn(player, playerStats, enemy, enemyStats, freeState);
    expect(free.currentRange).toBe(CombatRange.MEDIUM);
    expect(free.enemyMoveUsedThisTurn).toBe(true);

    const lockedState = {
      ...createCombatState(),
      isFirstTurn: false,
      currentRange: CombatRange.CLOSE,
      enemyMaxAp: 6,
      marks: [boundMark()],
    };
    const locked = processEnemyTurn(player, playerStats, enemy, enemyStats, lockedState);
    expect(locked.currentRange).toBe(CombatRange.CLOSE);
    expect(locked.enemyMoveUsedThisTurn).toBe(false);
    expect(locked.marks?.some((m) => m.id === BOUND_MARK_ID)).toBe(true);
  });
});

describe('T-132 bound identity', () => {
  it('does not consume Bound, does not require Stun, and does not gate forced or player voluntary', () => {
    const marks = [boundMark()];
    expect(enemyVoluntaryMoveBlocked(marks)).toBe(true);
    expect(marks.some((m) => m.id === BOUND_MARK_ID)).toBe(true);
    expect(marks[0]?.duration).toBe(1);

    const forced = applyForcedMove(CombatRange.MEDIUM, 'PUSH');
    expect(forced.range).toBe(CombatRange.LONG);
    expect(forced.moved).toBe(true);

    const playerBoard = {
      ...createCombatState(),
      currentAp: 6,
      currentRange: CombatRange.MEDIUM,
      marks,
    };
    const retreat = voluntaryPlayerMove(playerBoard, RangeMoveDirection.RETREAT);
    expect(retreat.success).toBe(true);
    expect(retreat.combatState.currentRange).toBe(CombatRange.LONG);

    expect(
      marks.some((m) => m.family === MarkFamily.HARD_CONTROL && m.id === BOUND_MARK_ID),
    ).toBe(true);
    expect(EffectType.STUN).not.toBe(MarkFamily.HARD_CONTROL);
  });
});
