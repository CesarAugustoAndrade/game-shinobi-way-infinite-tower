/**
 * T-031 AC: Hidden Lotus — Limit ON, +15%/charge, consume-all, self-Vulnerable.
 *
 * Scale is floor on total: Math.floor(6 * 5 * (1 + 0.15 * C)).
 * stacks 30 = +30% taken (plant only; enemy apply is OOS).
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatActor, CombatRange, MarkFamily, ModeRuntimeState } from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const lotus = SKILLS.HIDDEN_LOTUS;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 10, chakra: 20, hp: 80, maxHp: 80 },
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

describe('T-031 authoring', () => {
  it('declares ATTACK 5×6 Limit finisher + self Vulnerable', () => {
    expect(lotus.cardRole).toBe(CardRole.ATTACK);
    expect(lotus.hitCount).toBe(5);
    expect(lotus.baseDamage).toBe(6);
    expect(lotus.apCost).toBe(6);
    expect(lotus.hpCost).toBe(50);
    expect(lotus.cooldown).toBe(6);
    expect(lotus.modeInteraction).toEqual(
      expect.objectContaining({
        modeId: 'gate_of_limit',
        family: MODE_FAMILY.GATES,
        requireOn: true,
        consumeAllCharges: true,
        damagePerChargeBonus: 0.15,
      }),
    );
    expect(lotus.modeInteraction?.requireFamily).toBeUndefined();
    expect(lotus.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'vulnerable',
          duration: 2,
          stacks: 30,
          family: MarkFamily.STAT,
          targetActor: 'self',
        }),
      ]),
    );
  });
});

describe('T-031 require limit', () => {
  it('rejects without Gate of Limit and consumes nothing', () => {
    const empty = baseState();
    const off = resolveSkill({ skill: lotus }, empty, hit);
    expect(off.ok).toBe(false);
    if (off.ok) return;
    expect(off.reason).toBe('mode-required');
    expect(off.state.pools).toEqual(empty.pools);
    expect(off.state.modes.instances).toHaveLength(0);
    expect(off.state.marks).toHaveLength(0);

    const life = baseState({ modes: gatesOn('gate_of_life', 3) });
    const wrong = resolveSkill({ skill: lotus }, life, hit);
    expect(wrong.ok).toBe(false);
    if (wrong.ok) return;
    expect(wrong.reason).toBe('mode-required');
    expect(wrong.state.modes.instances.find((m) => m.id === 'gate_of_life')?.charges).toBe(3);
    expect(wrong.state.marks).toHaveLength(0);
  });
});

describe('T-031 scale close vulnerable', () => {
  it('scales on Limit C=3, closes Gate, plants self Vulnerable 2', () => {
    const result = resolveSkill(
      { skill: lotus },
      baseState({ modes: gatesOn('gate_of_limit', 3) }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(5);
    expect(result.damageDealt).toBe(scaledTotal(3));
    expect(result.state.modes.instances.find((m) => m.id === 'gate_of_limit')?.state).toBe(
      ModeRuntimeState.COOLDOWN,
    );
    expect(result.state.modes.instances.find((m) => m.id === 'gate_of_limit')?.charges).toBe(0);
    const vuln = result.state.marks.find((m) => m.id === 'vulnerable');
    expect(vuln?.target).toBe(CombatActor.PLAYER);
    expect(vuln?.duration).toBe(2);
    expect(vuln?.stacks).toBe(30);
  });

  it('plants self Vulnerable even when all hits miss', () => {
    const miss = { rollHit: () => ({ hit: false, damage: 0 }) };
    const result = resolveSkill(
      { skill: lotus },
      baseState({ modes: gatesOn('gate_of_limit', 2) }),
      miss,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(0);
    expect(result.damageDealt).toBe(0);
    expect(result.state.marks.find((m) => m.id === 'vulnerable')?.target).toBe(CombatActor.PLAYER);
    expect(result.state.modes.instances.find((m) => m.id === 'gate_of_limit')?.state).toBe(
      ModeRuntimeState.COOLDOWN,
    );
  });
});
