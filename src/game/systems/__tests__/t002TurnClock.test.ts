/**
 * T-002 AC tests: turn clock phases, readyOnTurn CD, encounter reset.
 */

import { describe, it, expect } from 'vitest';
import {
  CombatActor,
  Mark,
} from '../../types';
import {
  TURN_PHASE_ORDER,
  TurnPhase,
  applyTicksRegen,
  computeReadyOnTurn,
  decrementSupportAndMarkDurations,
  isSkillReadyOnTurn,
  markSkillUsedOnTurn,
  resetCombatFrontier,
  resolveModeUpkeep,
  runTurnStartClock,
  virtualDiscardHand,
} from '../TurnClockSystem';
import { createMockSkill } from './testFixtures';

describe('T-002 phase order', () => {
  it('exports SOUL turn phases in fixed order', () => {
    expect(TURN_PHASE_ORDER).toEqual([
      TurnPhase.MODE_UPKEEP,
      TurnPhase.TICKS_REGEN,
      TurnPhase.SNAPSHOT_DRAW,
      TurnPhase.DURATION_DECREMENT,
      TurnPhase.ACTIONS,
      TurnPhase.VIRTUAL_DISCARD,
    ]);
  });

  it('runTurnStartClock records phases 1–4 in order', () => {
    const result = runTurnStartClock({
      turnIndex: 1,
      chakra: 10,
      hp: 20,
      regen: { chakra: 0, hp: 0, maxChakra: 10, maxHp: 20 },
      modes: [],
      modeCosts: {},
      modeUpkeepPriority: [],
      marks: [],
      hand: [],
    });
    expect(result.phasesRun).toEqual([
      TurnPhase.MODE_UPKEEP,
      TurnPhase.TICKS_REGEN,
      TurnPhase.SNAPSHOT_DRAW,
      TurnPhase.DURATION_DECREMENT,
    ]);
  });
});

describe('T-002 cooldown 2', () => {
  it('blocks T+1 and T+2 and is ready on T+3 (readyOnTurn = T+N+1)', () => {
    const T = 5;
    const used = markSkillUsedOnTurn(createMockSkill({ id: 'chidori', cooldown: 2 }), T);
    expect(used.readyOnTurn).toBe(computeReadyOnTurn(T, 2));
    expect(used.readyOnTurn).toBe(8);
    expect(isSkillReadyOnTurn(used.readyOnTurn, T)).toBe(false);
    expect(isSkillReadyOnTurn(used.readyOnTurn, T + 1)).toBe(false);
    expect(isSkillReadyOnTurn(used.readyOnTurn, T + 2)).toBe(false);
    expect(isSkillReadyOnTurn(used.readyOnTurn, T + 3)).toBe(true);
  });

  it('treats omit/0 readyOnTurn as playable', () => {
    expect(isSkillReadyOnTurn(undefined, 1)).toBe(true);
    expect(isSkillReadyOnTurn(0, 1)).toBe(true);
  });
});

describe('T-002 upkeep before regen', () => {
  it('turns Mode off when current CP cannot pay, even if same-turn regen would cover it', () => {
    const mode = { id: 'sage', family: 'sage', charges: 3, cooldown: 1 };
    const upkeep = resolveModeUpkeep(
      [mode],
      { sage: { chakra: 5 } },
      ['sage'],
      { chakra: 3, hp: 20 },
      4,
    );
    expect(upkeep.endedModes).toEqual([
      { id: 'sage', reason: 'upkeep-fail', readyOnTurn: computeReadyOnTurn(4, 1) },
    ]);
    expect(upkeep.remainingModes).toEqual([]);
    expect(upkeep.chakra).toBe(3);

    const afterRegen = applyTicksRegen(
      { chakra: upkeep.chakra, hp: upkeep.hp },
      { chakra: 4, hp: 0, maxChakra: 20, maxHp: 20 },
    );
    expect(afterRegen.chakra).toBe(7);
    expect(upkeep.remainingModes).toHaveLength(0);
  });

  it('runTurnStartClock does not spend same-turn regen to keep a Mode on', () => {
    const result = runTurnStartClock({
      turnIndex: 2,
      chakra: 3,
      hp: 20,
      regen: { chakra: 4, hp: 0, maxChakra: 20, maxHp: 20 },
      modes: [{ id: 'sage', family: 'sage', charges: 2 }],
      modeCosts: { sage: { chakra: 5 } },
      modeUpkeepPriority: ['sage'],
      marks: [],
      hand: [],
    });
    expect(result.endedModes.map((ended) => ended.id)).toEqual(['sage']);
    expect(result.modes).toEqual([]);
    expect(result.chakra).toBe(7);
  });

  it('pays later modes after an earlier upkeep fail', () => {
    const result = resolveModeUpkeep(
      [
        { id: 'first', family: 'a', charges: 1 },
        { id: 'second', family: 'b', charges: 1 },
      ],
      { first: { chakra: 10 }, second: { chakra: 2 } },
      ['first', 'second'],
      { chakra: 3, hp: 10 },
      1,
    );
    expect(result.endedModes.map((ended) => ended.id)).toEqual(['first']);
    expect(result.remainingModes.map((mode) => mode.id)).toEqual(['second']);
    expect(result.chakra).toBe(1);
  });

  it('ends a Mode instead of paying HP below 1', () => {
    const result = resolveModeUpkeep(
      [{ id: 'blood', family: 'blood', charges: 1 }],
      { blood: { hp: 5 } },
      ['blood'],
      { chakra: 10, hp: 5 },
      1,
    );
    expect(result.endedModes[0]?.id).toBe('blood');
    expect(result.hp).toBe(5);
    expect(result.remainingModes).toEqual([]);
  });
});

describe('T-002 encounter reset', () => {
  it('clears skill readiness locks and empties Modes/Marks', () => {
    const locked = markSkillUsedOnTurn(createMockSkill({ id: 'rasengan', cooldown: 2, currentCooldown: 3 }), 3);
    const mark: Mark = {
      id: 'curse',
      sourceSkillId: 'curse-seal',
      owner: CombatActor.PLAYER,
      target: CombatActor.ENEMY,
      duration: 2,
      stacks: 1,
    };
    const reset = resetCombatFrontier({
      skills: [locked],
      modes: [{ id: 'sage', family: 'sage', charges: 2 }],
      marks: [mark],
    });
    expect(reset.skills[0].currentCooldown).toBe(0);
    expect(reset.skills[0].readyOnTurn).toBe(0);
    expect(isSkillReadyOnTurn(reset.skills[0].readyOnTurn, 1)).toBe(true);
    expect(reset.modes).toEqual([]);
    expect(reset.marks).toEqual([]);
  });
});

describe('T-002 helpers', () => {
  it('decrements mark/support durations and drops expired', () => {
    const mark: Mark = {
      id: 'm',
      sourceSkillId: 's',
      owner: CombatActor.PLAYER,
      target: CombatActor.ENEMY,
      duration: 1,
      stacks: 1,
    };
    const next = decrementSupportAndMarkDurations([mark], [{ id: 'buff', duration: 2 }]);
    expect(next.marks).toEqual([]);
    expect(next.supports).toEqual([{ id: 'buff', duration: 1 }]);
  });

  it('virtual-discards the hand without inventing a deck', () => {
    const card = createMockSkill({ id: 'kunai' });
    const result = virtualDiscardHand([card]);
    expect(result.hand).toEqual([]);
    expect(result.discarded).toEqual([card]);
  });
});
