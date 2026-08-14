/**
 * T-051 AC: Leaf Whirlwind — ATTACK 14 CLOSE; −1 SPD ×2 on hit.
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

const whirl = SKILLS.LEAF_WHIRLWIND;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [whirl],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: whirl.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-051 authoring', () => {
  it('declares ATTACK AP2 CD2 CLOSE 14 + spd_down 2 and no ACC % identity', () => {
    expect(whirl.cardRole).toBe(CardRole.ATTACK);
    expect(whirl.apCost).toBe(2);
    expect(whirl.chakraCost).toBe(0);
    expect(whirl.cooldown).toBe(2);
    expect(whirl.hpCost).toBe(0);
    expect(whirl.baseDamage).toBe(14);
    expect(whirl.allowedRanges).toEqual([CombatRange.CLOSE]);
    expect(whirl.tags).toEqual(expect.arrayContaining([SkillTag.TAIJUTSU, SkillTag.PHYSICAL]));
    expect(whirl.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'spd_down',
          duration: 2,
          stacks: 1,
          family: MarkFamily.STAT,
          targetActor: 'enemy',
          perHit: true,
        }),
      ]),
    );
    expect(
      whirl.effects?.some(
        (e) =>
          e.type === EffectType.DEBUFF &&
          e.targetStat === PrimaryStat.ACCURACY &&
          e.value === 0.15 &&
          e.chance === 0.3,
      ),
    ).toBeFalsy();
  });
});

describe('T-051 hit', () => {
  it('deals 14 and plants enemy −1 SPD duration 2', () => {
    const result = resolveSkill({ skill: whirl }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(14);
    const mark = result.state.marks.find((m) => m.id === 'spd_down');
    expect(mark?.target).toBe(CombatActor.ENEMY);
    expect(mark?.duration).toBe(2);
    expect(mark?.stacks).toBe(1);
    expect(mark?.family).toBe(MarkFamily.STAT);
  });
});

describe('T-051 miss', () => {
  it('plants nothing and deals 0', () => {
    const result = resolveSkill({ skill: whirl }, baseState(), miss);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.marks.some((m) => m.id === 'spd_down')).toBe(false);
  });
});
