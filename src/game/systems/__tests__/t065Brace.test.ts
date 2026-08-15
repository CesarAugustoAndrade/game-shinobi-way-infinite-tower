/**
 * T-065 AC: Brace SUPPORT — Shield 20 until next enemy response + Defensive.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  Posture,
  PrimaryStat,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const brace = SKILLS.BRACE;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [brace],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

describe('T-065 authoring', () => {
  it('declares SUPPORT AP1 CP0 CD3 + self Shield 20/1 and not WIL +0.3', () => {
    expect(brace.cardRole).toBe(CardRole.SUPPORT);
    expect(brace.apCost).toBe(1);
    expect(brace.chakraCost).toBe(0);
    expect(brace.cooldown).toBe(3);
    expect(brace.hpCost).toBe(0);
    expect(brace.baseDamage).toBe(0);
    expect(brace.stanceShift).toBe(Posture.DEFENSIVE);
    expect(brace.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'brace_shield',
          duration: 1,
          stacks: 20,
          family: MarkFamily.SHIELD,
          targetActor: 'self',
        }),
      ]),
    );
    expect(
      brace.effects?.some(
        (e) =>
          e.type === EffectType.BUFF &&
          e.targetStat === PrimaryStat.WILLPOWER &&
          e.value === 0.3,
      ),
    ).toBeFalsy();
  });
});

describe('T-065 plant', () => {
  it('plants self Shield 20 duration 1 with no damage', () => {
    const result = resolveSkill({ skill: brace }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    const mark = result.state.marks.find((m) => m.id === 'brace_shield');
    expect(mark?.target).toBe(CombatActor.PLAYER);
    expect(mark?.family).toBe(MarkFamily.SHIELD);
    expect(mark?.stacks).toBe(20);
    expect(mark?.duration).toBe(1);
    expect(result.state.marks.some((m) => m.id === 'mud_wall_shield')).toBe(false);
  });
});

describe('T-065 costs', () => {
  it('pays AP1, leaves CP, and sets readyOnTurn to T+CD+1', () => {
    const result = resolveSkill({ skill: brace }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.pools.ap).toBe(5);
    expect(result.state.pools.chakra).toBe(20);
    const used = result.state.skills.find((s) => s.id === brace.id);
    expect(used?.readyOnTurn).toBe(6);
  });
});
