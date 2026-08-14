/**
 * T-048 AC: Kunai Slash — SIDE 8 CLOSE + Bleed 3×2 on hit.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const slash = SKILLS.KUNAI_SLASH;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [slash],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: slash.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-048 authoring', () => {
  it('declares SIDE AP1 CD1 CLOSE 8 + Bleed 3×2', () => {
    expect(slash.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(slash.apCost).toBe(1);
    expect(slash.chakraCost).toBe(0);
    expect(slash.cooldown).toBe(1);
    expect(slash.hpCost).toBe(0);
    expect(slash.baseDamage).toBe(8);
    expect(slash.allowedRanges).toEqual([CombatRange.CLOSE]);
    expect(slash.tags).toEqual(expect.arrayContaining([SkillTag.TOOL, SkillTag.WEAPON, SkillTag.PHYSICAL]));
    expect(slash.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'bleed',
          duration: 2,
          stacks: 3,
          family: MarkFamily.DOT,
          targetActor: 'enemy',
          perHit: true,
        }),
      ]),
    );
    expect(
      slash.effects?.some((e) => e.type === EffectType.BLEED && e.value === 5 && e.chance === 0.25),
    ).toBeFalsy();
  });
});

describe('T-048 hit', () => {
  it('deals 8 and plants enemy Bleed 3 duration 2', () => {
    const result = resolveSkill({ skill: slash }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(8);
    const bleed = result.state.marks.find((m) => m.id === 'bleed');
    expect(bleed?.target).toBe(CombatActor.ENEMY);
    expect(bleed?.duration).toBe(2);
    expect(bleed?.stacks).toBe(3);
    expect(bleed?.family).toBe(MarkFamily.DOT);
  });
});

describe('T-048 miss', () => {
  it('plants nothing and deals 0', () => {
    const result = resolveSkill({ skill: slash }, baseState(), miss);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.marks.some((m) => m.id === 'bleed')).toBe(false);
  });
});
