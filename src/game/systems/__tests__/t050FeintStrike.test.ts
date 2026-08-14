/**
 * T-050 AC: Feint Strike — SIDE 7 AUTO CLOSE; Feint 2 → +15 next ATTACK.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatActor,
  CombatRange,
  MarkConsumeTiming,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const feint = SKILLS.FEINT_STRIKE;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [feint],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: feint.baseDamage }) };

const nextAttack = createMockSkill({
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

describe('T-050 authoring', () => {
  it('declares SIDE AP1 CD2 CLOSE AUTO 7 + feint 2', () => {
    expect(feint.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(feint.apCost).toBe(1);
    expect(feint.cooldown).toBe(2);
    expect(feint.baseDamage).toBe(7);
    expect(feint.attackMethod).toBe(AttackMethod.AUTO);
    expect(feint.allowedRanges).toEqual([CombatRange.CLOSE]);
    expect(feint.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'feint',
          duration: 2,
          stacks: 1,
          consume: MarkConsumeTiming.ATTEMPT,
          targetActor: 'self',
        }),
      ]),
    );
  });
});

describe('T-050 plant', () => {
  it('deals 7 and plants own Feint 2', () => {
    const result = resolveSkill({ skill: feint }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(7);
    const mark = result.state.marks.find((m) => m.id === 'feint');
    expect(mark?.duration).toBe(2);
    expect(mark?.target).toBe(CombatActor.PLAYER);
    expect(mark?.consume).toBe(MarkConsumeTiming.ATTEMPT);
  });
});

describe('T-050 payoff', () => {
  it('adds +15 to the next ATTACK and consumes Feint; SIDE does not consume', () => {
    const planted = resolveSkill({ skill: feint }, baseState(), hit);
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;

    const slash = SKILLS.KUNAI_SLASH;
    const sideAgain = resolveSkill({ skill: slash }, { ...planted.state, skills: [slash] }, {
      rollHit: () => ({ hit: true, damage: slash.baseDamage }),
    });
    expect(sideAgain.ok).toBe(true);
    if (!sideAgain.ok) return;
    expect(sideAgain.state.marks.some((m) => m.id === 'feint')).toBe(true);

    const boosted = resolveSkill(
      { skill: nextAttack },
      { ...sideAgain.state, skills: [nextAttack] },
      { rollHit: () => ({ hit: true, damage: 10 }) },
    );
    expect(boosted.ok).toBe(true);
    if (!boosted.ok) return;
    expect(boosted.damageDealt).toBe(25);
    expect(boosted.state.marks.find((m) => m.id === 'feint')).toBeUndefined();

    const clean = resolveSkill(
      { skill: nextAttack },
      baseState({ skills: [nextAttack] }),
      { rollHit: () => ({ hit: true, damage: 10 }) },
    );
    expect(clean.ok).toBe(true);
    if (!clean.ok) return;
    expect(clean.damageDealt).toBe(10);
  });
});
