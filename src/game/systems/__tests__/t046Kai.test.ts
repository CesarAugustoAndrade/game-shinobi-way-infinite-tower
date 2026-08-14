/**
 * T-046 AC: Kai — SUPPORT cleanse Confusion/Silence + one hostile MENTAL mark; refund 3 CP if any.
 *
 * Allowlist: mental_bind / fear on PLAYER, or family HARD_CONTROL. Enemy marks stay.
 * Pay 3 then refund 3 when something was removed.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  PrimaryStat,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const kai = SKILLS.KAI;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 10, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [kai],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const confusion = {
  id: 'confusion-player',
  name: 'Confusion',
  duration: 2,
  effect: { type: EffectType.CONFUSION, duration: 2, chance: 1 },
  source: 'false_surroundings',
};

const silence = {
  id: 'silence-player',
  name: 'Silence',
  duration: 1,
  effect: { type: EffectType.SILENCE, duration: 1, chance: 1 },
  source: 'sealing_tag',
};

const mentalBind = {
  id: 'mental_bind',
  sourceSkillId: 'fixture',
  owner: CombatActor.ENEMY,
  target: CombatActor.PLAYER,
  duration: 2,
  stacks: 1,
  family: MarkFamily.HARD_CONTROL,
};

const enemyCp = {
  id: 'chakra_point',
  sourceSkillId: 'air_palm',
  owner: CombatActor.PLAYER,
  target: CombatActor.ENEMY,
  duration: 2,
  stacks: 2,
};

describe('T-046 authoring', () => {
  it('declares SUPPORT cleanse + refund and drops CALMNESS +0.5×3', () => {
    expect(kai.cardRole).toBe(CardRole.SUPPORT);
    expect(kai.apCost).toBe(1);
    expect(kai.chakraCost).toBe(3);
    expect(kai.cooldown).toBe(2);
    expect(kai.hpCost).toBe(0);
    expect(kai.baseDamage).toBe(0);
    expect(kai.supportCleanse).toEqual({
      confusion: true,
      silence: true,
      oneHostileMentalMark: true,
      refundChakra: 3,
    });
    expect(
      kai.effects?.some(
        (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.CALMNESS && e.value === 0.5,
      ),
    ).toBeFalsy();
  });
});

describe('T-046 cleanse refund', () => {
  it('strips Confusion, Silence, and one player mental mark then refunds 3 CP', () => {
    const result = resolveSkill(
      { skill: kai },
      baseState({
        playerBuffs: [confusion, silence],
        marks: [enemyCp, mentalBind],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.pools.chakra).toBe(10);
    expect(result.state.playerBuffs.some((b) => b.effect.type === EffectType.CONFUSION)).toBe(false);
    expect(result.state.playerBuffs.some((b) => b.effect.type === EffectType.SILENCE)).toBe(false);
    expect(result.state.marks.some((m) => m.id === 'mental_bind')).toBe(false);
    expect(result.state.marks.find((m) => m.id === 'chakra_point')?.stacks).toBe(2);
  });
});

describe('T-046 empty', () => {
  it('pays full cost and refunds nothing when there is nothing to cleanse', () => {
    const clean = baseState({ marks: [enemyCp], playerBuffs: [] });
    const result = resolveSkill({ skill: kai }, clean);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.pools.chakra).toBe(7);
    expect(result.state.marks).toHaveLength(1);
    expect(result.state.marks[0].id).toBe('chakra_point');
    expect(result.state.playerBuffs).toHaveLength(0);
  });
});
