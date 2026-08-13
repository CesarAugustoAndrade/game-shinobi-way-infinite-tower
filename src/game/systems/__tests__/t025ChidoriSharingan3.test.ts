/**
 * T-025 AC: Chidori + Sharingan 3 — 2 charges at attempt and MEDIUM grant.
 */

import { describe, it, expect } from 'vitest';
import { CombatRange, ModeRuntimeState } from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const chidori = SKILLS.CHIDORI;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [chidori],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

function sharinganOn(charges: number) {
  return {
    instances: [
      {
        id: 'sharingan_3',
        family: MODE_FAMILY.SHARINGAN,
        charges,
        state: ModeRuntimeState.ON,
      },
    ],
  };
}

const hit = { rollHit: () => ({ hit: true, damage: chidori.baseDamage }) };

describe('T-025 authoring', () => {
  it('declares ATTACK + Sharingan 3 consume 2', () => {
    expect(chidori.cardRole).toBe('ATTACK');
    expect(chidori.modeInteraction).toEqual(
      expect.objectContaining({
        modeId: 'sharingan_3',
        consumeCharges: 2,
        grantRanges: [CombatRange.MEDIUM],
      }),
    );
  });
});

describe('T-025 on medium spend', () => {
  it('resolves at MEDIUM and spends 2 charges', () => {
    const result = resolveSkill(
      { skill: chidori },
      baseState({ range: CombatRange.MEDIUM, modes: sharinganOn(3) }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.modes.instances.find((m) => m.id === 'sharingan_3')?.charges).toBe(1);
  });
});

describe('T-025 off and short charges', () => {
  it('rejects MEDIUM without Mode or with 1 charge, and plays CLOSE without spend', () => {
    const off = resolveSkill(
      { skill: chidori },
      baseState({ range: CombatRange.MEDIUM }),
      hit,
    );
    expect(off.ok).toBe(false);
    if (!off.ok) expect(off.reason).toBe('range');

    const short = resolveSkill(
      { skill: chidori },
      baseState({ range: CombatRange.MEDIUM, modes: sharinganOn(1) }),
      hit,
    );
    expect(short.ok).toBe(false);
    if (!short.ok) expect(short.reason).toBe('range');
    expect(short.state.modes.instances.find((m) => m.id === 'sharingan_3')?.charges).toBe(1);

    const close = resolveSkill({ skill: chidori }, baseState(), hit);
    expect(close.ok).toBe(true);
    if (!close.ok) return;
    expect(close.state.modes.instances).toHaveLength(0);
  });
});
