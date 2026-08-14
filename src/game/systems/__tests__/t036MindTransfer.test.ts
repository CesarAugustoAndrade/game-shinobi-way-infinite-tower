/**
 * T-036 AC: Mind Transfer — SUPPORT 70% Stun 2 / fail self-Stun 1. No damage.
 *
 * Threshold: rng() < 0.7 → success (0 succeeds, 0.99 fails).
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, EffectType } from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const transfer = SKILLS.MIND_TRANSFER;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [transfer],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 50,
    ...overrides,
  };
}

function hasStun(buffs: { effect: { type: EffectType }; duration: number }[] | undefined, duration: number): boolean {
  return (buffs ?? []).some(
    (buff) => buff.effect.type === EffectType.STUN && buff.duration === duration,
  );
}

describe('T-036 authoring', () => {
  it('declares SUPPORT 0 dmg + 70% Stun 2 / fail self-Stun 1', () => {
    expect(transfer.cardRole).toBe(CardRole.SUPPORT);
    expect(transfer.apCost).toBe(2);
    expect(transfer.chakraCost).toBe(7);
    expect(transfer.cooldown).toBe(6);
    expect(transfer.baseDamage).toBe(0);
    expect(transfer.controlStun).toEqual({
      chance: 0.7,
      enemyDuration: 2,
      failSelfDuration: 1,
    });
    expect(transfer.modeInteraction).toBeUndefined();
  });
});

describe('T-036 success', () => {
  it('applies enemy Stun 2 and deals no damage', () => {
    const state = baseState();
    const hp = state.enemyHp;
    const result = resolveSkill({ skill: transfer }, state, { rng: () => 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.enemyHp).toBe(hp);
    expect(hasStun(result.state.enemyBuffs, 2)).toBe(true);
    expect(hasStun(result.state.playerBuffs, 1)).toBe(false);
    expect(result.state.modes.instances).toHaveLength(0);
  });
});

describe('T-036 fail', () => {
  it('applies self-Stun 1 and no enemy Stun', () => {
    const state = baseState();
    const hp = state.enemyHp;
    const result = resolveSkill({ skill: transfer }, state, { rng: () => 0.99 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.enemyHp).toBe(hp);
    expect(hasStun(result.state.playerBuffs, 1)).toBe(true);
    expect(hasStun(result.state.enemyBuffs, 2)).toBe(false);
  });
});
