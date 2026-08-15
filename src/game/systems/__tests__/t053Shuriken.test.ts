/**
 * T-053 AC: Shuriken — SIDE 11 MEDIUM/LONG; Aim 2 → +1 ACC next ATTACK.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatActor,
  CombatRange,
  MarkConsumeTiming,
  MarkFamily,
  PrimaryStat,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const shuriken = SKILLS.SHURIKEN;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [shuriken],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: shuriken.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

const accAttack = createMockSkill({
  id: 'aimed_shot',
  cardRole: CardRole.ATTACK,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  scalingPerPoint: 4,
  scalingStat: PrimaryStat.ACCURACY,
  attackMethod: AttackMethod.RANGED,
  allowedRanges: [CombatRange.MEDIUM, CombatRange.LONG],
  currentCooldown: 0,
});

const sideChip = createMockSkill({
  id: 'tool_chip',
  cardRole: CardRole.SIDE_ATTACK,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 7,
  attackMethod: AttackMethod.RANGED,
  allowedRanges: [CombatRange.MEDIUM, CombatRange.LONG],
  currentCooldown: 0,
});

describe('T-053 authoring', () => {
  it('declares SIDE AP1 CD1 11 at MEDIUM/LONG + aim 2 +1 ACC', () => {
    expect(shuriken.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(shuriken.apCost).toBe(1);
    expect(shuriken.chakraCost).toBe(0);
    expect(shuriken.cooldown).toBe(1);
    expect(shuriken.hpCost).toBe(0);
    expect(shuriken.baseDamage).toBe(11);
    expect(shuriken.attackMethod).toBe(AttackMethod.RANGED);
    expect(shuriken.allowedRanges).toEqual([CombatRange.MEDIUM, CombatRange.LONG]);
    expect(shuriken.allowedRanges).not.toContain(CombatRange.CLOSE);
    expect(shuriken.tags).toEqual(
      expect.arrayContaining([SkillTag.TOOL, SkillTag.WEAPON, SkillTag.PHYSICAL]),
    );
    expect(shuriken.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'aim',
          duration: 2,
          stacks: 1,
          consume: MarkConsumeTiming.ATTEMPT,
          family: MarkFamily.STAT,
          targetActor: 'self',
          perHit: true,
        }),
      ]),
    );
    expect(shuriken.critBonus).toBeUndefined();
  });
});

describe('T-053 plant', () => {
  it('deals 11 at MEDIUM and plants own Aim 2', () => {
    const result = resolveSkill({ skill: shuriken }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(11);
    const mark = result.state.marks.find((m) => m.id === 'aim');
    expect(mark?.duration).toBe(2);
    expect(mark?.target).toBe(CombatActor.PLAYER);
    expect(mark?.consume).toBe(MarkConsumeTiming.ATTEMPT);

    const close = resolveSkill(
      { skill: shuriken },
      baseState({ range: CombatRange.CLOSE }),
      hit,
    );
    expect(close.ok).toBe(false);
  });

  it('plants nothing on full miss', () => {
    const result = resolveSkill({ skill: shuriken }, baseState(), miss);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.marks.some((m) => m.id === 'aim')).toBe(false);
  });
});

describe('T-053 payoff', () => {
  it('adds scalingPerPoint on an ACC ATTACK and consumes Aim; SIDE does not', () => {
    const planted = resolveSkill({ skill: shuriken }, baseState(), hit);
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;

    const sideAgain = resolveSkill(
      { skill: sideChip },
      { ...planted.state, skills: [sideChip] },
      { rollHit: () => ({ hit: true, damage: sideChip.baseDamage }) },
    );
    expect(sideAgain.ok).toBe(true);
    if (!sideAgain.ok) return;
    expect(sideAgain.damageDealt).toBe(sideChip.baseDamage);
    expect(sideAgain.state.marks.some((m) => m.id === 'aim')).toBe(true);

    const boosted = resolveSkill(
      { skill: accAttack },
      { ...sideAgain.state, skills: [accAttack] },
      { rollHit: () => ({ hit: true, damage: 10 }) },
    );
    expect(boosted.ok).toBe(true);
    if (!boosted.ok) return;
    expect(boosted.damageDealt).toBe(10 + 4);
    expect(boosted.state.marks.find((m) => m.id === 'aim')).toBeUndefined();

    const clean = resolveSkill(
      { skill: accAttack },
      baseState({ skills: [accAttack] }),
      { rollHit: () => ({ hit: true, damage: 10 }) },
    );
    expect(clean.ok).toBe(true);
    if (!clean.ok) return;
    expect(clean.damageDealt).toBe(10);
  });

  it('consumes Aim on a missed ATTACK without applying bonus', () => {
    const planted = resolveSkill({ skill: shuriken }, baseState(), hit);
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;

    const whiff = resolveSkill(
      { skill: accAttack },
      { ...planted.state, skills: [accAttack] },
      { rollHit: () => ({ hit: false, damage: 0 }) },
    );
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.marks.find((m) => m.id === 'aim')).toBeUndefined();
  });
});
