/**
 * T-052 AC: Rising Wind — SIDE 8 CLOSE; Launched 2 → +20% next MELEE ATTACK.
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
  PrimaryStat,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const rising = SKILLS.RISING_WIND;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [rising],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: rising.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

const nextMelee = createMockSkill({
  id: 'smash',
  cardRole: CardRole.ATTACK,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  attackMethod: AttackMethod.MELEE,
  allowedRanges: [CombatRange.CLOSE],
  currentCooldown: 0,
});

const nextRanged = createMockSkill({
  id: 'kunai_shot',
  cardRole: CardRole.ATTACK,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  attackMethod: AttackMethod.RANGED,
  allowedRanges: [CombatRange.MEDIUM],
  currentCooldown: 0,
});

describe('T-052 authoring', () => {
  it('declares SIDE AP1 CD2 CLOSE 8 + launched 2 and no STR +25% identity', () => {
    expect(rising.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(rising.apCost).toBe(1);
    expect(rising.chakraCost).toBe(0);
    expect(rising.cooldown).toBe(2);
    expect(rising.hpCost).toBe(0);
    expect(rising.baseDamage).toBe(8);
    expect(rising.attackMethod).toBe(AttackMethod.MELEE);
    expect(rising.allowedRanges).toEqual([CombatRange.CLOSE]);
    expect(rising.tags).toEqual(expect.arrayContaining([SkillTag.TAIJUTSU, SkillTag.PHYSICAL]));
    expect(rising.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'launched',
          duration: 2,
          stacks: 1,
          consume: MarkConsumeTiming.ATTEMPT,
          targetActor: 'self',
        }),
      ]),
    );
    expect(
      rising.effects?.some(
        (e) =>
          e.type === EffectType.BUFF &&
          e.targetStat === PrimaryStat.STRENGTH &&
          e.value === 0.25 &&
          e.duration === 1,
      ),
    ).toBeFalsy();
  });
});

describe('T-052 plant', () => {
  it('deals 8 and plants own Launched 2', () => {
    const result = resolveSkill({ skill: rising }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(8);
    const mark = result.state.marks.find((m) => m.id === 'launched');
    expect(mark?.duration).toBe(2);
    expect(mark?.target).toBe(CombatActor.PLAYER);
    expect(mark?.consume).toBe(MarkConsumeTiming.ATTEMPT);
  });

  it('plants nothing on full miss', () => {
    const result = resolveSkill({ skill: rising }, baseState(), miss);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.marks.some((m) => m.id === 'launched')).toBe(false);
  });
});

describe('T-052 payoff', () => {
  it('multiplies next MELEE ATTACK by 1.2 and consumes Launched; SIDE and ranged do not', () => {
    const planted = resolveSkill({ skill: rising }, baseState(), hit);
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;

    const slash = SKILLS.KUNAI_SLASH;
    const sideAgain = resolveSkill({ skill: slash }, { ...planted.state, skills: [slash] }, {
      rollHit: () => ({ hit: true, damage: slash.baseDamage }),
    });
    expect(sideAgain.ok).toBe(true);
    if (!sideAgain.ok) return;
    expect(sideAgain.state.marks.some((m) => m.id === 'launched')).toBe(true);

    const ranged = resolveSkill(
      { skill: nextRanged },
      { ...sideAgain.state, skills: [nextRanged], range: CombatRange.MEDIUM },
      { rollHit: () => ({ hit: true, damage: 10 }) },
    );
    expect(ranged.ok).toBe(true);
    if (!ranged.ok) return;
    expect(ranged.damageDealt).toBe(10);
    expect(ranged.state.marks.some((m) => m.id === 'launched')).toBe(true);

    const boosted = resolveSkill(
      { skill: nextMelee },
      { ...ranged.state, skills: [nextMelee], range: CombatRange.CLOSE },
      { rollHit: () => ({ hit: true, damage: 10 }) },
    );
    expect(boosted.ok).toBe(true);
    if (!boosted.ok) return;
    expect(boosted.damageDealt).toBe(12);
    expect(boosted.state.marks.find((m) => m.id === 'launched')).toBeUndefined();

    const clean = resolveSkill(
      { skill: nextMelee },
      baseState({ skills: [nextMelee] }),
      { rollHit: () => ({ hit: true, damage: 10 }) },
    );
    expect(clean.ok).toBe(true);
    if (!clean.ok) return;
    expect(clean.damageDealt).toBe(10);
  });

  it('consumes Launched on a missed MELEE ATTACK without applying bonus', () => {
    const planted = resolveSkill({ skill: rising }, baseState(), hit);
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;

    const whiff = resolveSkill(
      { skill: nextMelee },
      { ...planted.state, skills: [nextMelee] },
      { rollHit: () => ({ hit: false, damage: 0 }) },
    );
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.marks.find((m) => m.id === 'launched')).toBeUndefined();
  });
});
