/**
 * T-083 AC: turnIndex advances at start-of-turn; createCombatState resets frontier.
 */

import { describe, it, expect } from 'vitest';
import {
  isSkillReadyOnTurn,
  markSkillUsedOnTurn,
  runTurnStartClock,
  type TurnClockInput,
} from '../TurnClockSystem';
import { applyEncounterReset, createCombatState } from '../CombatWorkflowSystem';
import { createMockSkill } from './testFixtures';

const clockInput = (turnIndex: number): TurnClockInput => ({
  turnIndex,
  chakra: 10,
  hp: 20,
  regen: { chakra: 0, hp: 0, maxChakra: 10, maxHp: 20 },
  modes: [],
  modeCosts: {},
  modeUpkeepPriority: [],
  marks: [],
  hand: [],
});

describe('T-083 AC1 turnIndex advances', () => {
  it('runTurnStartClock returns turnIndex === input.turnIndex + 1', () => {
    const input = clockInput(4);
    const result = runTurnStartClock(input);
    expect(result.turnIndex).toBe(input.turnIndex + 1);
    expect(result.turnIndex).toBe(5);
  });

  it('two consecutive runTurnStartClock calls do not leave T the same', () => {
    const first = runTurnStartClock(clockInput(1));
    const second = runTurnStartClock(clockInput(first.turnIndex));
    expect(first.turnIndex).toBe(2);
    expect(second.turnIndex).toBe(3);
    expect(second.turnIndex).not.toBe(first.turnIndex);
  });
});

describe('T-083 AC2 createCombatState leaves skills ready', () => {
  it('createCombatState leaves skills ready (readyOnTurn undefined or ≤ 1)', () => {
    const locked = markSkillUsedOnTurn(
      createMockSkill({ id: 'chidori', cooldown: 2, currentCooldown: 3 }),
      5,
    );
    expect(isSkillReadyOnTurn(locked.readyOnTurn, 1)).toBe(false);

    // createCombatState has no skill list; it still runs applyEncounterReset
    // on the default empty array so resetCombatFrontier stays on the path.
    // T-082 startCombat must pass player.skills through applyEncounterReset.
    const state = createCombatState();
    const resetSkills = applyEncounterReset([locked]);

    expect(
      state.playablePool.every(
        (skill) => skill.readyOnTurn === undefined || skill.readyOnTurn <= 1,
      ),
    ).toBe(true);
    expect(resetSkills).toHaveLength(1);
    expect(resetSkills[0].readyOnTurn === undefined || resetSkills[0].readyOnTurn <= 1).toBe(true);
    expect(resetSkills[0].currentCooldown).toBe(0);
    expect(isSkillReadyOnTurn(resetSkills[0].readyOnTurn, state.turnIndex ?? 1)).toBe(true);
  });
});
