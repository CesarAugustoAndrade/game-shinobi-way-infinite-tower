/**
 * T-099 AC: Water Dragon ATTACK — 18 M/L; +20% Setup under own Hidden Mist (no consume).
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  MarkFamily,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const dragon = SKILLS.WATER_DRAGON;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [dragon],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const mist = {
  id: 'mist',
  sourceSkillId: 'hidden_mist',
  owner: CombatActor.PLAYER,
  target: CombatActor.ENEMY,
  duration: 2,
  stacks: 20,
  family: MarkFamily.STAT,
};

const hit = { rollHit: () => ({ hit: true, damage: dragon.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-099 authoring', () => {
  it('declares ATTACK AP3 CP6 CD4 18 MEDIUM·LONG + setupRead mist 0.2 no consume', () => {
    expect(dragon.id).toBe('water_dragon');
    expect(dragon.cardRole).toBe(CardRole.ATTACK);
    expect(dragon.apCost).toBe(3);
    expect(dragon.chakraCost).toBe(6);
    expect(dragon.cooldown).toBe(4);
    expect(dragon.hpCost).toBe(0);
    expect(dragon.baseDamage).toBe(18);
    expect(dragon.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.MEDIUM, CombatRange.LONG]),
    );
    expect(dragon.allowedRanges).not.toContain(CombatRange.CLOSE);
    expect(dragon.setupRead).toEqual({
      markId: 'mist',
      damageMultBonus: 0.2,
      consume: false,
    });
    expect(dragon.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.WATER]));
  });
});

describe('T-099 mist bonus', () => {
  it('from MEDIUM deals floor(18*1.2) and leaves mist on the board', () => {
    const result = resolveSkill({ skill: dragon }, baseState({ marks: [{ ...mist }] }), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(Math.floor(18 * 1.2));
    const remaining = result.state.marks.find((m) => m.id === 'mist');
    expect(remaining?.target).toBe(CombatActor.ENEMY);
    expect(remaining?.duration).toBe(2);
    expect(remaining?.stacks).toBe(20);

    const close = resolveSkill({ skill: dragon }, baseState({ range: CombatRange.CLOSE }), hit);
    expect(close.ok).toBe(false);
  });
});

describe('T-099 no mist', () => {
  it('deals baseline 18 without mist; miss deals 0 and does not invent mist', () => {
    const result = resolveSkill({ skill: dragon }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(18);

    const atLong = resolveSkill(
      { skill: dragon },
      baseState({ range: CombatRange.LONG }),
      hit,
    );
    expect(atLong.ok).toBe(true);
    if (!atLong.ok) return;
    expect(atLong.damageDealt).toBe(18);

    const whiff = resolveSkill({ skill: dragon }, baseState({ marks: [{ ...mist }] }), miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.marks.some((m) => m.id === 'mist')).toBe(true);
  });
});
