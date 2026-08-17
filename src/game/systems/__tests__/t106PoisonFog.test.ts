/**
 * T-106 AC: Poison Fog SIDE — 9 M/L; Poison 6×3; +1 duration if enemy Mist.
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

const fog = SKILLS.POISON_FOG;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [fog],
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

const hit = { rollHit: () => ({ hit: true, damage: fog.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-106 authoring', () => {
  it('declares SIDE AP2 CP5 CD3 9 MEDIUM·LONG + Poison 6×3 mist +1', () => {
    expect(fog.id).toBe('poison_fog');
    expect(fog.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(fog.apCost).toBe(2);
    expect(fog.chakraCost).toBe(5);
    expect(fog.hpCost).toBe(0);
    expect(fog.cooldown).toBe(3);
    expect(fog.baseDamage).toBe(9);
    expect(fog.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.MEDIUM, CombatRange.LONG]),
    );
    expect(fog.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'poison',
          stacks: 6,
          duration: 3,
          family: MarkFamily.DOT,
          requireHit: true,
          durationBonusIfEnemyMark: { markId: 'mist', bonus: 1 },
        }),
      ]),
    );
    expect(fog.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.FIRE]));
    expect(
      fog.effects?.some(
        (e) => e.type === EffectType.POISON && e.value === 18 && e.damageType === DamageType.TRUE,
      ),
    ).toBeFalsy();
  });
});

describe('T-106 base poison', () => {
  it('on hit without mist deals 9 and plants Poison 6×3', () => {
    const result = resolveSkill({ skill: fog }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(9);
    const poison = result.state.marks.find((m) => m.id === 'poison');
    expect(poison?.stacks).toBe(6);
    expect(poison?.duration).toBe(3);
    expect(poison?.target).toBe(CombatActor.ENEMY);
  });
});

describe('T-106 mist miss', () => {
  it('mist hit plants Poison 6×4 and keeps mist; miss plants nothing', () => {
    const withMist = resolveSkill({ skill: fog }, baseState({ marks: [mist] }), hit);
    expect(withMist.ok).toBe(true);
    if (!withMist.ok) return;
    expect(withMist.damageDealt).toBe(9);
    const poison = withMist.state.marks.find((m) => m.id === 'poison');
    expect(poison?.stacks).toBe(6);
    expect(poison?.duration).toBe(4);
    expect(withMist.state.marks.some((m) => m.id === 'mist')).toBe(true);

    const whiff = resolveSkill({ skill: fog }, baseState({ marks: [mist] }), miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.marks.some((m) => m.id === 'poison')).toBe(false);
    expect(whiff.state.marks.some((m) => m.id === 'mist')).toBe(true);
  });
});
