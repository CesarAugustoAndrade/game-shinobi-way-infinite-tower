/**
 * T-041 AC: False Surroundings — 75% Confusion 2 + Read Mind 2 + MENTAL ATTACK +1.
 *
 * Threshold: rng() < 0.75 → Confusion. Read Mind always plants after pay.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
  CardRole,
  CombatActor,
  CombatRange,
  DamageType,
  EffectType,
  Posture,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { effectiveWeight } from '../DeckSystem';
import { consumeSupportWeightBonuses } from '../SupportWeightSystem';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const falseSurr = SKILLS.FALSE_SURROUNDINGS;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [falseSurr],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 50,
    pendingSupportWeights: [],
    ...overrides,
  };
}

function hasConfusion(buffs: { effect: { type: EffectType }; duration: number }[] | undefined): boolean {
  return (buffs ?? []).some((b) => b.effect.type === EffectType.CONFUSION && b.duration === 2);
}

describe('T-041 authoring', () => {
  it('declares SUPPORT 75% Confusion 2 + Read Mind 2', () => {
    expect(falseSurr.cardRole).toBe(CardRole.SUPPORT);
    expect(falseSurr.apCost).toBe(2);
    expect(falseSurr.chakraCost).toBe(8);
    expect(falseSurr.cooldown).toBe(5);
    expect(falseSurr.baseDamage).toBe(0);
    expect(falseSurr.controlConfusion).toEqual({ chance: 0.75, enemyDuration: 2 });
    expect(falseSurr.nextDrawMentalAttackBonus).toBe(1);
    expect(falseSurr.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'read_mind', duration: 2, targetActor: 'enemy' }),
      ]),
    );
    expect(
      falseSurr.effects?.some((e) => e.type === EffectType.CONFUSION && e.duration === 3 && e.chance === 0.8),
    ).toBeFalsy();
  });
});

describe('T-041 resolve', () => {
  it('plants Read Mind always; Confusion only on rng success', () => {
    const win = resolveSkill({ skill: falseSurr }, baseState(), { rng: () => 0 });
    expect(win.ok).toBe(true);
    if (!win.ok) return;
    expect(win.damageDealt).toBe(0);
    expect(hasConfusion(win.state.enemyBuffs)).toBe(true);
    expect(win.state.marks.find((m) => m.id === 'read_mind')?.duration).toBe(2);
    expect(win.state.marks.find((m) => m.id === 'read_mind')?.target).toBe(CombatActor.ENEMY);

    const lose = resolveSkill({ skill: falseSurr }, baseState(), { rng: () => 0.99 });
    expect(lose.ok).toBe(true);
    if (!lose.ok) return;
    expect(lose.damageDealt).toBe(0);
    expect(hasConfusion(lose.state.enemyBuffs)).toBe(false);
    expect(lose.state.marks.some((m) => m.id === 'read_mind')).toBe(true);
  });
});

describe('T-041 weight', () => {
  it('boosts MENTAL ATTACK +1 once and leaves physical ATTACK unchanged', () => {
    const result = resolveSkill({ skill: falseSurr }, baseState(), { rng: () => 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const first = consumeSupportWeightBonuses(result.state.pendingSupportWeights ?? []);
    expect(first.mentalAttackBonus).toBe(1);
    const ctx = { posture: Posture.BALANCED };
    const mental = createMockSkill({
      id: 'hell_viewing',
      cardRole: CardRole.ATTACK,
      actionType: ActionType.ACTIVE,
      damageType: DamageType.MENTAL,
      currentCooldown: 0,
    });
    const phys = createMockSkill({
      id: 'basic_atk',
      cardRole: CardRole.ATTACK,
      actionType: ActionType.ACTIVE,
      damageType: DamageType.PHYSICAL,
      currentCooldown: 0,
    });
    const mentalBase = effectiveWeight(mental, { ...ctx, supportMentalAttackBonus: 0 });
    const mentalBoost = effectiveWeight(mental, { ...ctx, supportMentalAttackBonus: first.mentalAttackBonus });
    expect(mentalBoost).toBe(mentalBase + 1);
    expect(effectiveWeight(phys, { ...ctx, supportMentalAttackBonus: first.mentalAttackBonus })).toBe(
      effectiveWeight(phys, { ...ctx, supportMentalAttackBonus: 0 }),
    );
    const second = consumeSupportWeightBonuses(first.bag);
    expect(second.mentalAttackBonus).toBe(0);
  });
});
