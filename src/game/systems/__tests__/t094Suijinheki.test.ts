/**
 * T-094 AC: Suijinheki SUPPORT — Shield 40 + +1 elemental def until next enemy response.
 *
 * +1 elemental defense is a STAT mark (stacks 1, duration 1). StatSystem does not
 * yet read marks into elementalDefenseFlat — that hook is deferred; the integer
 * contract lives on the mark so we do not keep SPIRIT % identity.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  PrimaryStat,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const wall = SKILLS.WATER_WALL;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [wall],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

describe('T-094 authoring', () => {
  it('declares SUPPORT AP1 CP6 CD4 + Shield 40/1 + flat elem def 1', () => {
    expect(wall.id).toBe('suijinheki');
    expect(wall.cardRole).toBe(CardRole.SUPPORT);
    expect(wall.apCost).toBe(1);
    expect(wall.chakraCost).toBe(6);
    expect(wall.cooldown).toBe(4);
    expect(wall.hpCost).toBe(0);
    expect(wall.baseDamage).toBe(0);
    expect(wall.stanceShift).toBeUndefined();
    expect(wall.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.WATER]));
    expect(wall.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'suijinheki_shield',
          duration: 1,
          stacks: 40,
          family: MarkFamily.SHIELD,
          targetActor: 'self',
        }),
        expect.objectContaining({
          id: 'suijinheki_elem_def',
          duration: 1,
          stacks: 1,
          family: MarkFamily.STAT,
          targetActor: 'self',
        }),
      ]),
    );
    expect(
      wall.effects?.some((e) => e.type === EffectType.SHIELD && e.value === 60),
    ).toBeFalsy();
    expect(
      wall.effects?.some(
        (e) =>
          e.type === EffectType.BUFF &&
          e.targetStat === PrimaryStat.SPIRIT &&
          e.value === 0.3,
      ),
    ).toBeFalsy();
  });
});

describe('T-094 shield', () => {
  it('plants self Shield 40 duration 1 with no damage', () => {
    const result = resolveSkill({ skill: wall }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    const shield = result.state.marks.find((m) => m.id === 'suijinheki_shield');
    expect(shield?.target).toBe(CombatActor.PLAYER);
    expect(shield?.family).toBe(MarkFamily.SHIELD);
    expect(shield?.stacks).toBe(40);
    expect(shield?.duration).toBe(1);
  });
});

describe('T-094 honest def', () => {
  it('plants +1 elemental STAT mark and no SPIRIT 0.3 buff', () => {
    const result = resolveSkill({ skill: wall }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const elem = result.state.marks.find((m) => m.id === 'suijinheki_elem_def');
    expect(elem?.target).toBe(CombatActor.PLAYER);
    expect(elem?.family).toBe(MarkFamily.STAT);
    expect(elem?.stacks).toBe(1);
    expect(elem?.duration).toBe(1);
    expect(
      result.state.playerBuffs.some(
        (b) =>
          b.effect.type === EffectType.BUFF &&
          b.effect.targetStat === PrimaryStat.SPIRIT &&
          b.effect.value === 0.3,
      ),
    ).toBe(false);
  });
});
