/**
 * T-126 AC: Defensive Posture SUPPORT — Defensive shift + Shield 25; not toggle buffs.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
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
import { stanceShiftFromSkill } from '../PostureSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const posture = SKILLS.DEFENSIVE_POSTURE;
const brace = SKILLS.BRACE;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [posture],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

describe('T-126 authoring', () => {
  it('declares SUPPORT ACTIVE AP1 CP3 CD5 Defensive + Shield 25', () => {
    expect(posture.id).toBe('defensive_posture');
    expect(posture.cardRole).toBe(CardRole.SUPPORT);
    expect(posture.actionType).toBe(ActionType.ACTIVE);
    expect(posture.apCost).toBe(1);
    expect(posture.chakraCost).toBe(3);
    expect(posture.cooldown).toBe(5);
    expect(posture.hpCost).toBe(0);
    expect(posture.baseDamage).toBe(0);
    expect(posture.stanceShift).toBe(Posture.DEFENSIVE);
    expect(stanceShiftFromSkill(posture)).toBe(Posture.DEFENSIVE);
    expect(posture.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'defensive_shield',
          duration: 1,
          stacks: 25,
          family: MarkFamily.SHIELD,
          targetActor: 'self',
        }),
      ]),
    );
  });
});

describe('T-126 plant', () => {
  it('plants self Shield 25 duration 1 with no damage', () => {
    const result = resolveSkill({ skill: posture }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.pools.ap).toBe(5);
    expect(result.state.pools.chakra).toBe(17);
    const mark = result.state.marks.find((m) => m.id === 'defensive_shield');
    expect(mark?.target).toBe(CombatActor.PLAYER);
    expect(mark?.family).toBe(MarkFamily.SHIELD);
    expect(mark?.stacks).toBe(25);
    expect(mark?.duration).toBe(1);
    expect(result.state.marks.some((m) => m.id === 'brace_shield')).toBe(false);
    expect(brace.markEffects?.find((m) => m.id === 'brace_shield')?.stacks).toBe(20);
  });
});

describe('T-126 not-toggle', () => {
  it('is not TOGGLE/MODE with upkeep or permanent WIL/SPD percents', () => {
    expect(posture.actionType).not.toBe(ActionType.TOGGLE);
    expect(posture.isToggle).toBeFalsy();
    expect(posture.upkeepCost).toBeUndefined();
    expect(posture.modeInteraction).toBeUndefined();
    expect(
      posture.effects?.some(
        (e) =>
          (e.type === EffectType.BUFF &&
            e.targetStat === PrimaryStat.WILLPOWER &&
            e.value === 0.25) ||
          (e.type === EffectType.DEBUFF && e.targetStat === PrimaryStat.SPEED && e.value === 0.15),
      ),
    ).toBeFalsy();
  });
});
