/**
 * T-068 AC: Basic Medical SUPPORT — heal 25 + one Poison or Bleed.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const medical = SKILLS.BASIC_MEDICAL;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 50, maxHp: 100 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [medical],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const poison = {
  id: 'poison',
  sourceSkillId: 'fixture',
  owner: CombatActor.ENEMY,
  target: CombatActor.PLAYER,
  duration: 3,
  stacks: 5,
  family: MarkFamily.DOT,
};

const bleed = {
  id: 'bleed',
  sourceSkillId: 'fixture',
  owner: CombatActor.ENEMY,
  target: CombatActor.PLAYER,
  duration: 2,
  stacks: 3,
  family: MarkFamily.DOT,
};

describe('T-068 authoring', () => {
  it('declares SUPPORT AP2 CP5 CD5 heal 25 + one poison/bleed and not HEAL 25 effects', () => {
    expect(medical.cardRole).toBe(CardRole.SUPPORT);
    expect(medical.apCost).toBe(2);
    expect(medical.chakraCost).toBe(5);
    expect(medical.cooldown).toBe(5);
    expect(medical.hpCost).toBe(0);
    expect(medical.baseDamage).toBe(0);
    expect(medical.supportHeal).toEqual({
      amount: 25,
      cleanseOneOf: ['poison', 'bleed'],
    });
    expect(
      medical.effects?.some((e) => e.type === EffectType.HEAL && e.value === 25),
    ).toBeFalsy();
  });
});

describe('T-068 heal cleanse', () => {
  it('heals 25 and strips the first poison/bleed mark only', () => {
    const result = resolveSkill(
      { skill: medical },
      baseState({ marks: [poison, bleed] }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.pools.hp).toBe(75);
    expect(result.state.marks.some((m) => m.id === 'poison')).toBe(false);
    expect(result.state.marks.some((m) => m.id === 'bleed')).toBe(true);
    expect(result.state.marks).toHaveLength(1);
  });
});

describe('T-068 heal only', () => {
  it('heals 25 and leaves marks unchanged when no DoT is present', () => {
    const other = {
      ...bleed,
      id: 'smoke',
      family: MarkFamily.STAT,
      target: CombatActor.ENEMY,
    };
    const result = resolveSkill({ skill: medical }, baseState({ marks: [other] }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.pools.hp).toBe(75);
    expect(result.state.marks).toHaveLength(1);
    expect(result.state.marks[0].id).toBe('smoke');
    expect(result.state.pools.ap).toBe(4);
    expect(result.state.pools.chakra).toBe(15);
    const used = result.state.skills.find((s) => s.id === medical.id);
    expect(used?.readyOnTurn).toBe(8);
  });
});
