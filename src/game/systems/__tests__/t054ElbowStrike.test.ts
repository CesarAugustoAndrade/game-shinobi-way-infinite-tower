/**
 * T-054 AC: Elbow Strike — SIDE 8 CLOSE; Guard Break 2 → 15% pen next ATTACK.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatActor,
  CombatRange,
  DamageProperty,
  MarkConsumeTiming,
  MarkFamily,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const elbow = SKILLS.ELBOW_STRIKE;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [elbow],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: elbow.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

const smash = createMockSkill({
  id: 'smash',
  cardRole: CardRole.ATTACK,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 20,
  attackMethod: AttackMethod.MELEE,
  allowedRanges: [CombatRange.CLOSE],
  currentCooldown: 0,
});

const sideChip = createMockSkill({
  id: 'jab',
  cardRole: CardRole.SIDE_ATTACK,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 7,
  attackMethod: AttackMethod.MELEE,
  allowedRanges: [CombatRange.CLOSE],
  currentCooldown: 0,
});

describe('T-054 authoring', () => {
  it('declares SIDE AP1 CD1 CLOSE 8 + guard_break 2 and no PIERCING identity', () => {
    expect(elbow.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(elbow.apCost).toBe(1);
    expect(elbow.chakraCost).toBe(0);
    expect(elbow.cooldown).toBe(1);
    expect(elbow.hpCost).toBe(0);
    expect(elbow.baseDamage).toBe(8);
    expect(elbow.attackMethod).toBe(AttackMethod.MELEE);
    expect(elbow.allowedRanges).toEqual([CombatRange.CLOSE]);
    expect(elbow.damageProperty).toBe(DamageProperty.NORMAL);
    expect(elbow.tags).toEqual(expect.arrayContaining([SkillTag.TAIJUTSU, SkillTag.PHYSICAL]));
    expect(elbow.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'guard_break',
          duration: 2,
          stacks: 1,
          consume: MarkConsumeTiming.ATTEMPT,
          family: MarkFamily.STAT,
          targetActor: 'self',
          perHit: true,
        }),
      ]),
    );
  });
});

describe('T-054 plant', () => {
  it('deals 8 at CLOSE and plants own Guard Break 2', () => {
    const result = resolveSkill({ skill: elbow }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(8);
    const mark = result.state.marks.find((m) => m.id === 'guard_break');
    expect(mark?.duration).toBe(2);
    expect(mark?.target).toBe(CombatActor.PLAYER);
    expect(mark?.consume).toBe(MarkConsumeTiming.ATTEMPT);

    const mid = resolveSkill(
      { skill: elbow },
      baseState({ range: CombatRange.MEDIUM }),
      hit,
    );
    expect(mid.ok).toBe(false);
  });

  it('plants nothing on full miss', () => {
    const result = resolveSkill({ skill: elbow }, baseState(), miss);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.marks.some((m) => m.id === 'guard_break')).toBe(false);
  });
});

describe('T-054 payoff', () => {
  it('applies 15% pen on next ATTACK and consumes; SIDE does not', () => {
    const planted = resolveSkill({ skill: elbow }, baseState(), hit);
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;

    const sideAgain = resolveSkill(
      { skill: sideChip },
      { ...planted.state, skills: [sideChip], enemyDefensePercent: 0.4 },
      { rollHit: () => ({ hit: true, damage: sideChip.baseDamage }) },
    );
    expect(sideAgain.ok).toBe(true);
    if (!sideAgain.ok) return;
    expect(sideAgain.state.marks.some((m) => m.id === 'guard_break')).toBe(true);

    const boosted = resolveSkill(
      { skill: smash },
      { ...sideAgain.state, skills: [smash], enemyDefensePercent: 0.4 },
      { rollHit: () => ({ hit: true, damage: 20 }) },
    );
    expect(boosted.ok).toBe(true);
    if (!boosted.ok) return;
    expect(boosted.damageDealt).toBe(13);
    expect(boosted.state.marks.find((m) => m.id === 'guard_break')).toBeUndefined();

    const clean = resolveSkill(
      { skill: smash },
      baseState({ skills: [smash], enemyDefensePercent: 0.4 }),
      { rollHit: () => ({ hit: true, damage: 20 }) },
    );
    expect(clean.ok).toBe(true);
    if (!clean.ok) return;
    expect(clean.damageDealt).toBe(12);
  });

  it('consumes Guard Break on a missed ATTACK without applying pen', () => {
    const planted = resolveSkill({ skill: elbow }, baseState(), hit);
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;

    const whiff = resolveSkill(
      { skill: smash },
      { ...planted.state, skills: [smash], enemyDefensePercent: 0.4 },
      { rollHit: () => ({ hit: false, damage: 0 }) },
    );
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.marks.find((m) => m.id === 'guard_break')).toBeUndefined();
  });
});
