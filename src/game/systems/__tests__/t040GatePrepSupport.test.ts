/**
 * T-040 AC: Gate Prep SUPPORT — arm T-016 +3 weights and T-017 HP discount.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, EffectType, PrimaryStat } from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { GATE_PREP_TARGET_IDS } from '../SupportWeightSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const prep = SKILLS.GATE_PREP;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [prep],
    playerBuffs: [],
    enemyHp: 50,
    pendingSupportWeights: [],
    ...overrides,
  };
}

describe('T-040 authoring', () => {
  it('declares SUPPORT AP1 / HP15 / CD5 and no WIL % identity', () => {
    expect(prep.cardRole).toBe(CardRole.SUPPORT);
    expect(prep.apCost).toBe(1);
    expect(prep.hpCost).toBe(15);
    expect(prep.chakraCost).toBe(0);
    expect(prep.cooldown).toBe(5);
    expect(prep.baseDamage).toBe(0);
    expect(
      prep.effects?.some(
        (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.WILLPOWER && e.value === 0.5,
      ),
    ).toBeFalsy();
  });
});

describe('T-040 arm', () => {
  it('pays 15 HP and arms Gate +3 weights plus HP discount', () => {
    const result = resolveSkill({ skill: prep }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.pools.hp).toBe(25);
    expect(result.state.pendingGateHpDiscount).toBe(true);
    const bag = result.state.pendingSupportWeights ?? [];
    expect(GATE_PREP_TARGET_IDS).toEqual(['gate_of_life', 'gate_of_limit']);
    expect(bag).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ skillId: 'gate_of_life', delta: 3 }),
        expect.objectContaining({ skillId: 'gate_of_limit', delta: 3 }),
      ]),
    );
  });
});

describe('T-040 reject', () => {
  it('rejects HP below 15 without arming bag or discount', () => {
    const start = baseState({ pools: { ap: 6, chakra: 20, hp: 10, maxHp: 40 } });
    const result = resolveSkill({ skill: prep }, start);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).not.toBe('incomplete-authoring');
    expect(result.reason).toBe('hp');
    expect(result.state.pools.hp).toBe(10);
    expect(result.state.pendingSupportWeights ?? []).toHaveLength(0);
    expect(result.state.pendingGateHpDiscount).toBeFalsy();
  });
});
