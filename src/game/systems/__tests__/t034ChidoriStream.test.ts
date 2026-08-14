/**
 * T-034 AC: Chidori Stream — base 18; Sharingan 3T +40% + 1 charge.
 *
 * Enhance floor: Math.floor(baseDamage * 1.4) (T-018 convention).
 * Stun 60%×1 is authoring honesty; resolve does not roll effects here.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, EffectType, ModeRuntimeState } from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const stream = SKILLS.CHIDORI_STREAM;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [stream],
    playerBuffs: [],
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

const hit = { rollHit: () => ({ hit: true, damage: stream.baseDamage }) };

describe('T-034 authoring', () => {
  it('declares ATTACK 18 CLOSE + Sharingan 3 enhance and Stun 60%', () => {
    expect(stream.cardRole).toBe(CardRole.ATTACK);
    expect(stream.apCost).toBe(4);
    expect(stream.chakraCost).toBe(7);
    expect(stream.cooldown).toBe(4);
    expect(stream.baseDamage).toBe(18);
    expect(stream.allowedRanges).toEqual([CombatRange.CLOSE]);
    expect(stream.modeInteraction).toEqual(
      expect.objectContaining({
        modeId: 'sharingan_3',
        family: MODE_FAMILY.SHARINGAN,
        consumeCharges: 1,
        damageMultBonus: 0.4,
      }),
    );
    expect(stream.modeInteraction?.requireOn).toBeFalsy();
    expect(stream.modeInteraction?.grantRanges).toBeUndefined();
    expect(stream.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: EffectType.STUN, duration: 1, chance: 0.6 }),
      ]),
    );
  });
});

describe('T-034 base', () => {
  it('deals baseline 18 with no Mode and spends nothing', () => {
    const result = resolveSkill({ skill: stream }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(18);
    expect(result.state.modes.instances).toHaveLength(0);
  });
});

describe('T-034 sharingan enhance', () => {
  it('applies +40% and spends 1 Sharingan 3 charge', () => {
    const result = resolveSkill(
      { skill: stream },
      baseState({ modes: sharinganOn('sharingan_3', 3) }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(Math.floor(18 * 1.4));
    const mode = result.state.modes.instances.find((m) => m.id === 'sharingan_3');
    expect(mode?.charges).toBe(2);
    expect(mode?.state).toBe(ModeRuntimeState.ON);
  });

  it('does not enhance on Sharingan 2 alone', () => {
    const result = resolveSkill(
      { skill: stream },
      baseState({ modes: sharinganOn('sharingan_2', 3) }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(18);
    expect(result.state.modes.instances.find((m) => m.id === 'sharingan_2')?.charges).toBe(3);
  });
});
