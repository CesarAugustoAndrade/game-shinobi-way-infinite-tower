/**
 * T-090 AC: Lightning Ball — ATTACK 15 M/L + 45% Stun 1; Sharingan 3T +40% + 1 charge.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, EffectType, ModeRuntimeState, SkillTag } from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const ball = SKILLS.LIGHTNING_BALL;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [ball],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

function sharinganOn(id: 'sharingan_2' | 'sharingan_3', charges: number) {
  return {
    instances: [
      {
        id,
        family: MODE_FAMILY.SHARINGAN,
        charges,
        state: ModeRuntimeState.ON,
      },
    ],
  };
}

const hit = { rollHit: () => ({ hit: true, damage: ball.baseDamage }) };

function seqRng(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)]!;
}

function hasStun(buffs: { effect: { type: EffectType }; duration: number }[] | undefined): boolean {
  return (buffs ?? []).some((b) => b.effect.type === EffectType.STUN && b.duration === 1);
}

describe('T-090 authoring', () => {
  it('declares ATTACK 15 MEDIUM·LONG + 45% Stun 1 + Sharingan 3 enhance', () => {
    expect(ball.cardRole).toBe(CardRole.ATTACK);
    expect(ball.apCost).toBe(2);
    expect(ball.chakraCost).toBe(5);
    expect(ball.cooldown).toBe(3);
    expect(ball.baseDamage).toBe(15);
    expect(ball.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.MEDIUM, CombatRange.LONG]),
    );
    expect(ball.modeInteraction).toEqual(
      expect.objectContaining({
        modeId: 'sharingan_3',
        family: MODE_FAMILY.SHARINGAN,
        consumeCharges: 1,
        damageMultBonus: 0.4,
      }),
    );
    expect(ball.modeInteraction?.requireOn).toBeFalsy();
    expect(ball.modeInteraction?.grantRanges).toBeUndefined();
    expect(ball.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.LIGHTNING]));
    expect(ball.impactStun).toEqual({ chance: 0.45, duration: 1 });
  });
});

describe('T-090 base', () => {
  it('deals baseline 15 with no Mode and spends nothing', () => {
    const result = resolveSkill({ skill: ball }, baseState(), {
      ...hit,
      rng: seqRng([0.99]),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(15);
    expect(result.state.modes.instances).toHaveLength(0);
    expect(hasStun(result.state.enemyBuffs)).toBe(false);
  });
});

describe('T-090 sharingan3 enhance', () => {
  it('applies +40% and spends 1 Sharingan 3 charge', () => {
    const result = resolveSkill(
      { skill: ball },
      baseState({ modes: sharinganOn('sharingan_3', 3) }),
      { ...hit, rng: seqRng([0.99]) },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(Math.floor(15 * 1.4));
    const mode = result.state.modes.instances.find((m) => m.id === 'sharingan_3');
    expect(mode?.charges).toBe(2);
    expect(mode?.state).toBe(ModeRuntimeState.ON);
  });

  it('does not enhance on Sharingan 2 alone', () => {
    const result = resolveSkill(
      { skill: ball },
      baseState({ modes: sharinganOn('sharingan_2', 3) }),
      { ...hit, rng: seqRng([0.99]) },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(15);
    expect(result.state.modes.instances.find((m) => m.id === 'sharingan_2')?.charges).toBe(3);
  });

  it('plants Stun 1 when rng is under 0.45', () => {
    const result = resolveSkill({ skill: ball }, baseState(), {
      ...hit,
      rng: seqRng([0]),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(hasStun(result.state.enemyBuffs)).toBe(true);
  });
});
