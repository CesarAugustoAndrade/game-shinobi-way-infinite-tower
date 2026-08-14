/**
 * T-032 AC: Great Fireball — base 17; Sharingan 2T +50% + 1 charge.
 *
 * Enhance floor: Math.floor(baseDamage * 1.5) (T-018 convention).
 * Burn 5×2 is authoring honesty; resolve does not tick DoT here.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, EffectType, ModeRuntimeState } from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const fireball = SKILLS.FIREBALL;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [fireball],
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

const hit = { rollHit: () => ({ hit: true, damage: fireball.baseDamage }) };

describe('T-032 authoring', () => {
  it('declares ATTACK 17 MEDIUM·LONG + Sharingan 2 enhance', () => {
    expect(fireball.cardRole).toBe(CardRole.ATTACK);
    expect(fireball.apCost).toBe(3);
    expect(fireball.chakraCost).toBe(6);
    expect(fireball.cooldown).toBe(3);
    expect(fireball.baseDamage).toBe(17);
    expect(fireball.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.MEDIUM, CombatRange.LONG]),
    );
    expect(fireball.modeInteraction).toEqual(
      expect.objectContaining({
        modeId: 'sharingan_2',
        family: MODE_FAMILY.SHARINGAN,
        consumeCharges: 1,
        damageMultBonus: 0.5,
      }),
    );
    expect(fireball.modeInteraction?.requireOn).toBeFalsy();
    expect(fireball.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: EffectType.BURN, value: 5, duration: 2 }),
      ]),
    );
  });
});

describe('T-032 base', () => {
  it('deals baseline 17 with no Mode and spends nothing', () => {
    const result = resolveSkill({ skill: fireball }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(17);
    expect(result.state.modes.instances).toHaveLength(0);
  });
});

describe('T-032 sharingan enhance', () => {
  it('applies +50% and spends 1 Sharingan 2 charge', () => {
    const result = resolveSkill(
      { skill: fireball },
      baseState({ modes: sharinganOn('sharingan_2', 3) }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(Math.floor(17 * 1.5));
    const mode = result.state.modes.instances.find((m) => m.id === 'sharingan_2');
    expect(mode?.charges).toBe(2);
    expect(mode?.state).toBe(ModeRuntimeState.ON);
  });

  it('does not enhance on Sharingan 3 alone', () => {
    const result = resolveSkill(
      { skill: fireball },
      baseState({ modes: sharinganOn('sharingan_3', 3) }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(17);
    expect(result.state.modes.instances.find((m) => m.id === 'sharingan_3')?.charges).toBe(3);
  });
});
