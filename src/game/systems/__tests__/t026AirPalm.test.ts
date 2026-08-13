/**
 * T-026 AC: Air Palm SIDE — CP per hit, PUSH 1, no Byakugan spend.
 *
 * STAT merge: 2 landed hits → one `chakra_point` with stacks 2.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatRange,
  MarkConsumeTiming,
  MarkFamily,
  ModeRuntimeState,
} from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const airPalm = SKILLS.AIR_PALM;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [airPalm],
    playerBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: false,
    ...overrides,
  };
}

const byakuganOn = {
  instances: [
    {
      id: 'byakugan',
      family: MODE_FAMILY.HYUGA,
      charges: 4,
      state: ModeRuntimeState.ON,
    },
  ],
};

const hit = { rollHit: () => ({ hit: true, damage: airPalm.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-026 authoring', () => {
  it('declares SIDE + chakra_point per hit + PUSH', () => {
    expect(airPalm.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(airPalm.modeInteraction).toBeUndefined();
    expect(airPalm.bandMove).toEqual({ kind: 'PUSH', steps: 1 });
    expect(airPalm.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'chakra_point',
          duration: 2,
          consume: MarkConsumeTiming.IMPACT,
          perHit: true,
          family: MarkFamily.STAT,
        }),
      ]),
    );
  });
});

describe('T-026 hit push no spend', () => {
  it('plants CP, PUSHes one band, and leaves Byakugan charges', () => {
    const result = resolveSkill(
      { skill: airPalm },
      baseState({ modes: byakuganOn }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const cp = result.state.marks.find((m) => m.id === 'chakra_point');
    expect(cp?.stacks).toBe(1);
    expect(cp?.duration).toBe(2);
    expect(result.state.range).toBe(CombatRange.LONG);
    expect(result.state.playerMoveUsedThisTurn).toBe(false);
    expect(result.state.modes.instances.find((m) => m.id === 'byakugan')?.charges).toBe(4);
  });
});

describe('T-026 miss and multi', () => {
  it('plants no CP on a full miss and stacks two landed hits', () => {
    const missed = resolveSkill({ skill: airPalm }, baseState({ modes: byakuganOn }), miss);
    expect(missed.ok).toBe(true);
    if (!missed.ok) return;
    expect(missed.state.marks.some((m) => m.id === 'chakra_point')).toBe(false);
    expect(missed.state.range).toBe(CombatRange.LONG);
    expect(missed.state.modes.instances.find((m) => m.id === 'byakugan')?.charges).toBe(4);

    const multi = { ...airPalm, hitCount: 2 };
    const stacked = resolveSkill({ skill: multi }, baseState(), {
      rollHit: () => ({ hit: true, damage: airPalm.baseDamage }),
    });
    expect(stacked.ok).toBe(true);
    if (!stacked.ok) return;
    const cp = stacked.state.marks.find((m) => m.id === 'chakra_point');
    expect(cp?.stacks).toBe(2);
    expect(stacked.state.marks.filter((m) => m.id === 'chakra_point')).toHaveLength(1);
  });
});
