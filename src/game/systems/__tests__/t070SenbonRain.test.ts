/**
 * T-070 AC: Senbon Rain — SIDE 4×2 M/L; on hit Poison 3×2 once.
 */

import { describe, it, expect } from 'vitest';
import {
  AttackMethod,
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

const rain = SKILLS.SENBON_RAIN;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [rain],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: rain.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-070 authoring', () => {
  it('declares SIDE AP2 CP3 CD3 4×2 M/L + poison 3×2 and not POISON@0.2', () => {
    expect(rain.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(rain.apCost).toBe(2);
    expect(rain.chakraCost).toBe(3);
    expect(rain.cooldown).toBe(3);
    expect(rain.hpCost).toBe(0);
    expect(rain.baseDamage).toBe(2);
    expect(rain.hitCount).toBe(4);
    expect(rain.attackMethod).toBe(AttackMethod.RANGED);
    expect(rain.allowedRanges).toEqual([CombatRange.MEDIUM, CombatRange.LONG]);
    expect(rain.tags).toEqual(
      expect.arrayContaining([
        SkillTag.TOOL,
        SkillTag.WEAPON,
        SkillTag.PHYSICAL,
        SkillTag.MULTI_HIT,
      ]),
    );
    expect(rain.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'poison',
          duration: 2,
          stacks: 3,
          family: MarkFamily.DOT,
          targetActor: 'enemy',
          requireHit: true,
        }),
      ]),
    );
    expect(
      rain.effects?.some(
        (e) => e.type === EffectType.POISON && e.value === 5 && e.chance === 0.2,
      ),
    ).toBeFalsy();
  });
});

describe('T-070 poison', () => {
  it('plants enemy Poison 3×2 on any hit and plants nothing on miss', () => {
    let n = 0;
    const oneHit = {
      rollHit: () => {
        n += 1;
        return n === 1
          ? { hit: true, damage: rain.baseDamage }
          : { hit: false, damage: 0 };
      },
    };
    const result = resolveSkill({ skill: rain }, baseState(), oneHit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(1);
    expect(result.damageDealt).toBe(2);
    const poison = result.state.marks.find((m) => m.id === 'poison');
    expect(poison?.target).toBe(CombatActor.ENEMY);
    expect(poison?.duration).toBe(2);
    expect(poison?.stacks).toBe(3);
    expect(poison?.family).toBe(MarkFamily.DOT);

    const whiff = resolveSkill({ skill: rain }, baseState(), miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.hitsLanded).toBe(0);
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.marks.some((m) => m.id === 'poison')).toBe(false);

    const close = resolveSkill(
      { skill: rain },
      baseState({ range: CombatRange.CLOSE }),
      hit,
    );
    expect(close.ok).toBe(false);
  });
});

describe('T-070 once', () => {
  it('plants exactly one poison 3 when all four hits land', () => {
    const result = resolveSkill({ skill: rain }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(4);
    expect(result.damageDealt).toBe(8);
    const poisons = result.state.marks.filter((m) => m.id === 'poison');
    expect(poisons).toHaveLength(1);
    expect(poisons[0]?.stacks).toBe(3);
    expect(poisons[0]?.duration).toBe(2);
  });
});
