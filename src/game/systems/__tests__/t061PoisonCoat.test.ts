/**
 * T-061 AC: Poison Coat SUPPORT — plant self coated; next Offensive Poison 5×3 consume.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkConsumeTiming,
  MarkFamily,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const coat = SKILLS.POISON_COAT;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [coat],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const nextAttack = createMockSkill({
  id: 'next_attack',
  cardRole: CardRole.ATTACK,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  hitCount: 1,
  attackMethod: AttackMethod.MELEE,
  allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
});

const nextSide = createMockSkill({
  id: 'next_side',
  cardRole: CardRole.SIDE_ATTACK,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  hitCount: 1,
  attackMethod: AttackMethod.MELEE,
  allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
});

const nextSupport = createMockSkill({
  id: 'next_support',
  cardRole: CardRole.SUPPORT,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 0,
  allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
});

const hit = (skill: { baseDamage: number }) => ({
  rollHit: () => ({ hit: true, damage: skill.baseDamage }),
});
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-061 authoring', () => {
  it('declares SUPPORT AP1 CP1 CD4 + self coated 2 IMPACT', () => {
    expect(coat.cardRole).toBe(CardRole.SUPPORT);
    expect(coat.apCost).toBe(1);
    expect(coat.chakraCost).toBe(1);
    expect(coat.cooldown).toBe(4);
    expect(coat.hpCost).toBe(0);
    expect(coat.baseDamage).toBe(0);
    expect(coat.tags).toEqual(expect.arrayContaining([SkillTag.TOOL, SkillTag.MARK]));
    expect(coat.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'coated',
          duration: 2,
          stacks: 1,
          consume: MarkConsumeTiming.IMPACT,
          family: MarkFamily.STAT,
          targetActor: 'self',
        }),
      ]),
    );
    expect(
      coat.effects?.some((e) => e.type === EffectType.POISON && e.value === 8 && e.duration === 3),
    ).toBeFalsy();
  });
});

describe('T-061 plant', () => {
  it('plants self Coated 2 with no enemy poison and no damage', () => {
    const result = resolveSkill({ skill: coat }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    const mark = result.state.marks.find((m) => m.id === 'coated');
    expect(mark?.target).toBe(CombatActor.PLAYER);
    expect(mark?.duration).toBe(2);
    expect(mark?.stacks).toBe(1);
    expect(result.state.marks.some((m) => m.id === 'poison')).toBe(false);
  });
});

describe('T-061 payoff', () => {
  it('plants Poison 5×3 and consumes the coat on a SIDE hit', () => {
    const planted = resolveSkill({ skill: coat }, baseState());
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    const armed = resolveSkill({ skill: nextSide }, planted.state, hit(nextSide));
    expect(armed.ok).toBe(true);
    if (!armed.ok) return;
    expect(armed.damageDealt).toBe(10);
    expect(armed.state.marks.some((m) => m.id === 'coated')).toBe(false);
    const poison = armed.state.marks.find((m) => m.id === 'poison');
    expect(poison?.target).toBe(CombatActor.ENEMY);
    expect(poison?.stacks).toBe(5);
    expect(poison?.duration).toBe(3);
    expect(poison?.family).toBe(MarkFamily.DOT);
  });

  it('plants Poison 5×3 and consumes the coat on an ATTACK hit', () => {
    const planted = resolveSkill({ skill: coat }, baseState());
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    const armed = resolveSkill({ skill: nextAttack }, planted.state, hit(nextAttack));
    expect(armed.ok).toBe(true);
    if (!armed.ok) return;
    expect(armed.damageDealt).toBe(10);
    expect(armed.state.marks.some((m) => m.id === 'coated')).toBe(false);
    const poison = armed.state.marks.find((m) => m.id === 'poison');
    expect(poison?.stacks).toBe(5);
    expect(poison?.duration).toBe(3);
  });

  it('leaves the coat and plants no poison on a full SIDE miss', () => {
    const planted = resolveSkill({ skill: coat }, baseState());
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    const whiff = resolveSkill({ skill: nextSide }, planted.state, miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.marks.some((m) => m.id === 'coated')).toBe(true);
    expect(whiff.state.marks.some((m) => m.id === 'poison')).toBe(false);
  });

  it('does not consume Coated on a SUPPORT play', () => {
    const planted = resolveSkill({ skill: coat }, baseState());
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    const support = resolveSkill({ skill: nextSupport }, planted.state);
    expect(support.ok).toBe(true);
    if (!support.ok) return;
    expect(support.damageDealt).toBe(0);
    expect(support.state.marks.some((m) => m.id === 'coated')).toBe(true);
    expect(support.state.marks.some((m) => m.id === 'poison')).toBe(false);
  });
});
