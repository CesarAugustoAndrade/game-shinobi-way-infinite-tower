/**
 * T-089 AC: Dragon Flame — ATTACK 17 M/L + Burn 5×3; Sharingan 2T +50% + 1 charge.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, EffectType, ModeRuntimeState, SkillTag } from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const flame = SKILLS.DRAGON_FLAME;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [flame],
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

const hit = { rollHit: () => ({ hit: true, damage: flame.baseDamage }) };

describe('T-089 authoring', () => {
  it('declares ATTACK 17 MEDIUM·LONG + Burn 5×3 + Sharingan 2 enhance', () => {
    expect(flame.cardRole).toBe(CardRole.ATTACK);
    expect(flame.apCost).toBe(3);
    expect(flame.chakraCost).toBe(6);
    expect(flame.cooldown).toBe(3);
    expect(flame.baseDamage).toBe(17);
    expect(flame.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.MEDIUM, CombatRange.LONG]),
    );
    expect(flame.modeInteraction).toEqual(
      expect.objectContaining({
        modeId: 'sharingan_2',
        family: MODE_FAMILY.SHARINGAN,
        consumeCharges: 1,
        damageMultBonus: 0.5,
      }),
    );
    expect(flame.modeInteraction?.requireOn).toBeFalsy();
    expect(flame.tags).toEqual(
      expect.arrayContaining([SkillTag.UCHIHA, SkillTag.NINJUTSU, SkillTag.FIRE]),
    );
    expect(flame.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: EffectType.BURN, value: 5, duration: 3, chance: 1 }),
      ]),
    );
  });
});

describe('T-089 base', () => {
  it('deals baseline 17 with no Mode and spends nothing', () => {
    const result = resolveSkill({ skill: flame }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(17);
    expect(result.state.modes.instances).toHaveLength(0);
  });
});

describe('T-089 sharingan enhance', () => {
  it('applies +50% and spends 1 Sharingan 2 charge', () => {
    const result = resolveSkill(
      { skill: flame },
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
      { skill: flame },
      baseState({ modes: sharinganOn('sharingan_3', 3) }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(17);
    expect(result.state.modes.instances.find((m) => m.id === 'sharingan_3')?.charges).toBe(3);
  });
});
