/**
 * T-030 AC: Primary Lotus — any GATES ON, +15%/charge, consume-all close.
 *
 * Scale is floor on total: Math.floor(7 * 3 * (1 + 0.15 * C)).
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, ModeRuntimeState } from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const lotus = SKILLS.PRIMARY_LOTUS;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 10, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [lotus],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

function gatesOn(id: 'gate_of_life' | 'gate_of_limit', charges: number) {
  return {
    instances: [
      {
        id,
        family: MODE_FAMILY.GATES,
        charges,
        state: ModeRuntimeState.ON,
      },
    ],
  };
}

const hit = { rollHit: () => ({ hit: true, damage: lotus.baseDamage }) };

function scaledTotal(charges: number): number {
  const baseline = lotus.baseDamage * (lotus.hitCount ?? 1);
  return Math.floor(baseline * (1 + 0.15 * charges));
}

describe('T-030 authoring', () => {
  it('declares ATTACK 3×7 GATES finisher', () => {
    expect(lotus.cardRole).toBe(CardRole.ATTACK);
    expect(lotus.hitCount).toBe(3);
    expect(lotus.baseDamage).toBe(7);
    expect(lotus.apCost).toBe(5);
    expect(lotus.hpCost).toBe(15);
    expect(lotus.cooldown).toBe(5);
    expect(lotus.modeInteraction).toEqual(
      expect.objectContaining({
        family: MODE_FAMILY.GATES,
        requireFamily: MODE_FAMILY.GATES,
        requireOn: true,
        consumeAllCharges: true,
        damagePerChargeBonus: 0.15,
      }),
    );
    expect(lotus.modeInteraction?.modeId).toBeUndefined();
  });
});

describe('T-030 require gates', () => {
  it('rejects without a GATES Mode and consumes nothing', () => {
    const empty = baseState();
    const off = resolveSkill({ skill: lotus }, empty, hit);
    expect(off.ok).toBe(false);
    if (off.ok) return;
    expect(off.reason).toBe('mode-required');
    expect(off.state.pools).toEqual(empty.pools);
    expect(off.state.modes.instances).toHaveLength(0);

    const hyuga = baseState({
      modes: {
        instances: [
          { id: 'byakugan', family: MODE_FAMILY.HYUGA, charges: 4, state: ModeRuntimeState.ON },
        ],
      },
    });
    const wrong = resolveSkill({ skill: lotus }, hyuga, hit);
    expect(wrong.ok).toBe(false);
    if (wrong.ok) return;
    expect(wrong.reason).toBe('mode-required');
    expect(wrong.state.modes.instances.find((m) => m.id === 'byakugan')?.charges).toBe(4);
  });
});

describe('T-030 scale close', () => {
  it('scales on Life C=3 and Limit C=2 then closes that Gate', () => {
    const life = resolveSkill(
      { skill: lotus },
      baseState({ modes: gatesOn('gate_of_life', 3) }),
      hit,
    );
    expect(life.ok).toBe(true);
    if (!life.ok) return;
    expect(life.hitsLanded).toBe(3);
    expect(life.damageDealt).toBe(scaledTotal(3));
    expect(life.state.modes.instances.find((m) => m.id === 'gate_of_life')?.state).toBe(
      ModeRuntimeState.COOLDOWN,
    );
    expect(life.state.modes.instances.find((m) => m.id === 'gate_of_life')?.charges).toBe(0);

    const limit = resolveSkill(
      { skill: lotus },
      baseState({ modes: gatesOn('gate_of_limit', 2) }),
      hit,
    );
    expect(limit.ok).toBe(true);
    if (!limit.ok) return;
    expect(limit.damageDealt).toBe(scaledTotal(2));
    expect(limit.state.modes.instances.find((m) => m.id === 'gate_of_limit')?.state).toBe(
      ModeRuntimeState.COOLDOWN,
    );
  });
});
