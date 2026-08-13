/**
 * T-029 AC: Dynamic Entry — MEDIUM→CLOSE rush; Gate charges intact.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, ModeRuntimeState } from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const entry = SKILLS.DYNAMIC_ENTRY;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [entry],
    playerBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: false,
    ...overrides,
  };
}

const gateOn = {
  instances: [
    {
      id: 'gate_of_limit',
      family: MODE_FAMILY.GATES,
      charges: 3,
      state: ModeRuntimeState.ON,
    },
  ],
};

const hit = { rollHit: () => ({ hit: true, damage: entry.baseDamage }) };

describe('T-029 authoring', () => {
  it('declares SIDE + MEDIUM/CLOSE + approach', () => {
    expect(entry.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(entry.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.MEDIUM, CombatRange.CLOSE]),
    );
    expect(entry.allowedRanges).not.toContain(CombatRange.LONG);
    expect(entry.bandMove).toEqual({ kind: 'SELF_APPROACH', steps: 1 });
    expect(entry.modeInteraction).toBeUndefined();
  });
});

describe('T-029 rush no spend', () => {
  it('closes MEDIUM to CLOSE without spending Gate charges or voluntary move', () => {
    const result = resolveSkill(
      { skill: entry },
      baseState({ modes: gateOn }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.range).toBe(CombatRange.CLOSE);
    expect(result.state.playerMoveUsedThisTurn).toBe(false);
    expect(result.state.modes.instances.find((m) => m.id === 'gate_of_limit')?.charges).toBe(3);
  });
});

describe('T-029 close stay', () => {
  it('stays CLOSE when already CLOSE and still spends no charges', () => {
    const result = resolveSkill(
      { skill: entry },
      baseState({ range: CombatRange.CLOSE, modes: gateOn }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.range).toBe(CombatRange.CLOSE);
    expect(result.state.playerMoveUsedThisTurn).toBe(false);
    expect(result.state.modes.instances.find((m) => m.id === 'gate_of_limit')?.charges).toBe(3);
  });
});
