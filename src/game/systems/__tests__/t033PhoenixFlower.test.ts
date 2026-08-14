/**
 * T-033 AC: Phoenix Flower — 3×5; Sharingan 2T +40% + 1 charge.
 *
 * Enhance floor on total: Math.floor(3 * 5 * 1.4) (T-021 / T-018 convention).
 * Burn 4×2 is authoring honesty; resolve does not tick DoT here.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, EffectType, ModeRuntimeState } from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const phoenix = SKILLS.PHOENIX_FLOWER;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [phoenix],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

function sharingan2On(charges: number) {
  return {
    instances: [
      {
        id: 'sharingan_2',
        family: MODE_FAMILY.SHARINGAN,
        charges,
        state: ModeRuntimeState.ON,
      },
    ],
  };
}

const hit = { rollHit: () => ({ hit: true, damage: phoenix.baseDamage }) };

describe('T-033 authoring', () => {
  it('declares ATTACK 3×5 MEDIUM·LONG + Sharingan 2 enhance', () => {
    expect(phoenix.cardRole).toBe(CardRole.ATTACK);
    expect(phoenix.hitCount).toBe(3);
    expect(phoenix.baseDamage).toBe(5);
    expect(phoenix.apCost).toBe(2);
    expect(phoenix.chakraCost).toBe(5);
    expect(phoenix.cooldown).toBe(2);
    expect(phoenix.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.MEDIUM, CombatRange.LONG]),
    );
    expect(phoenix.modeInteraction).toEqual(
      expect.objectContaining({
        modeId: 'sharingan_2',
        family: MODE_FAMILY.SHARINGAN,
        consumeCharges: 1,
        damageMultBonus: 0.4,
      }),
    );
    expect(phoenix.modeInteraction?.requireOn).toBeFalsy();
    expect(phoenix.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: EffectType.BURN, value: 4, duration: 2 }),
      ]),
    );
  });
});

describe('T-033 base multi', () => {
  it('lands 3 hits for baseline 15 with no Mode and spends nothing', () => {
    const result = resolveSkill({ skill: phoenix }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(3);
    expect(result.damageDealt).toBe(15);
    expect(result.state.modes.instances).toHaveLength(0);
  });
});

describe('T-033 sharingan enhance', () => {
  it('applies +40% on the 3-hit total and spends 1 Sharingan 2 charge', () => {
    const result = resolveSkill(
      { skill: phoenix },
      baseState({ modes: sharingan2On(3) }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(3);
    expect(result.damageDealt).toBe(Math.floor(15 * 1.4));
    const mode = result.state.modes.instances.find((m) => m.id === 'sharingan_2');
    expect(mode?.charges).toBe(2);
    expect(mode?.state).toBe(ModeRuntimeState.ON);
  });
});
