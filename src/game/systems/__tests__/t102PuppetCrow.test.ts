/**
 * T-102 AC: Puppet Crow ATTACK — 22 M/L; Poison 4×2 + Bleed 4×2 on hit.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  DamageType,
  EffectType,
  MarkFamily,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const crow = SKILLS.PUPPET_CROW;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [crow],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: crow.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-102 authoring', () => {
  it('declares ATTACK AP3 CP6 CD4 22 MEDIUM·LONG + poison 4×2 + bleed 4×2 requireHit', () => {
    expect(crow.id).toBe('puppet_crow');
    expect(crow.cardRole).toBe(CardRole.ATTACK);
    expect(crow.apCost).toBe(3);
    expect(crow.chakraCost).toBe(6);
    expect(crow.cooldown).toBe(4);
    expect(crow.hpCost).toBe(0);
    expect(crow.baseDamage).toBe(22);
    expect(crow.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.MEDIUM, CombatRange.LONG]),
    );
    expect(crow.allowedRanges).not.toContain(CombatRange.CLOSE);
    expect(crow.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'poison',
          duration: 2,
          stacks: 4,
          family: MarkFamily.DOT,
          targetActor: 'enemy',
          requireHit: true,
        }),
        expect.objectContaining({
          id: 'bleed',
          duration: 2,
          stacks: 4,
          family: MarkFamily.DOT,
          targetActor: 'enemy',
          requireHit: true,
        }),
      ]),
    );
    expect(crow.tags).toEqual(expect.arrayContaining([SkillTag.WEAPON, SkillTag.PHYSICAL]));
    expect(
      crow.effects?.some(
        (e) => e.type === EffectType.POISON && e.value === 10 && e.damageType === DamageType.TRUE,
      ),
    ).toBeFalsy();
    expect(
      crow.effects?.some((e) => e.type === EffectType.BLEED && e.value === 10 && e.duration === 3),
    ).toBeFalsy();
  });
});

describe('T-102 impact', () => {
  it('from MEDIUM deals 22 and plants poison 4×2 + bleed 4×2 once', () => {
    const result = resolveSkill({ skill: crow }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(22);
    const poison = result.state.marks.find((m) => m.id === 'poison');
    expect(poison?.target).toBe(CombatActor.ENEMY);
    expect(poison?.duration).toBe(2);
    expect(poison?.stacks).toBe(4);
    expect(poison?.family).toBe(MarkFamily.DOT);
    const bleed = result.state.marks.find((m) => m.id === 'bleed');
    expect(bleed?.target).toBe(CombatActor.ENEMY);
    expect(bleed?.duration).toBe(2);
    expect(bleed?.stacks).toBe(4);
    expect(bleed?.family).toBe(MarkFamily.DOT);
    expect(result.state.marks.filter((m) => m.id === 'poison')).toHaveLength(1);
    expect(result.state.marks.filter((m) => m.id === 'bleed')).toHaveLength(1);

    const close = resolveSkill({ skill: crow }, baseState({ range: CombatRange.CLOSE }), hit);
    expect(close.ok).toBe(false);
  });
});

describe('T-102 miss', () => {
  it('deals 0 and plants neither poison nor bleed', () => {
    const result = resolveSkill({ skill: crow }, baseState(), miss);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(0);
    expect(result.damageDealt).toBe(0);
    expect(result.state.marks.some((m) => m.id === 'poison')).toBe(false);
    expect(result.state.marks.some((m) => m.id === 'bleed')).toBe(false);

    const atLong = resolveSkill({ skill: crow }, baseState({ range: CombatRange.LONG }), hit);
    expect(atLong.ok).toBe(true);
    if (!atLong.ok) return;
    expect(atLong.damageDealt).toBe(22);
    expect(atLong.state.marks.some((m) => m.id === 'poison')).toBe(true);
    expect(atLong.state.marks.some((m) => m.id === 'bleed')).toBe(true);
  });
});
