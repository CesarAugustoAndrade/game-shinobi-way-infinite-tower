/**
 * T-021 AC: Morning Peacock require Gate of Limit, +15%/charge, consume-all close.
 *
 * Scale is floor on **total** multi-hit damage (same as T-018):
 *   Math.floor(baseDamage * hitCount * (1 + 0.15 * C))
 */

import { describe, it, expect } from 'vitest';
import { CombatRange, ModeRuntimeState } from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const peacock = SKILLS.MORNING_PEACOCK;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [peacock],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

function gateOn(charges: number) {
  return {
    instances: [
      {
        id: 'gate_of_limit',
        family: MODE_FAMILY.GATES,
        charges,
        state: ModeRuntimeState.ON,
      },
    ],
  };
}

const alwaysHit = { rollHit: () => ({ hit: true, damage: peacock.baseDamage }) };

function scaledTotal(charges: number): number {
  const baseline = peacock.baseDamage * (peacock.hitCount ?? 1);
  return Math.floor(baseline * (1 + 0.15 * charges));
}

describe('T-021 require on', () => {
  it('rejects Peacock when Gate of Limit is OFF and consumes nothing', () => {
    const state = baseState();
    const before = structuredClone(state);
    const result = resolveSkill({ skill: peacock }, state, alwaysHit);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('mode-required');
    expect(result.state).toEqual(before);
    expect(state).toEqual(before);
  });
});

describe('T-021 scale close', () => {
  it('scales 6-hit total by 1+0.15*3 and closes Gate', () => {
    const result = resolveSkill({ skill: peacock }, baseState({ modes: gateOn(3) }), alwaysHit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(6);
    expect(result.damageDealt).toBe(scaledTotal(3));
    const gate = result.state.modes.instances.find((m) => m.id === 'gate_of_limit');
    expect(gate?.state).toBe(ModeRuntimeState.COOLDOWN);
    expect(gate?.charges).toBe(0);
  });
});

describe('T-021 four charges', () => {
  it('uses C=4 for the mult and closes Gate', () => {
    expect(peacock.hitCount).toBe(6);
    expect(peacock.modeInteraction).toEqual(
      expect.objectContaining({
        modeId: 'gate_of_limit',
        requireOn: true,
        consumeAllCharges: true,
        damagePerChargeBonus: 0.15,
      }),
    );
    const result = resolveSkill({ skill: peacock }, baseState({ modes: gateOn(4) }), alwaysHit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(6);
    expect(result.damageDealt).toBe(scaledTotal(4));
    expect(result.state.modes.instances.find((m) => m.id === 'gate_of_limit')?.state).toBe(
      ModeRuntimeState.COOLDOWN,
    );
  });
});
