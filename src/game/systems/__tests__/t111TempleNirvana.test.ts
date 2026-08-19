/**
 * T-111 AC: Temple of Nirvana SUPPORT — 80% Stun 2; no self-Stun on fail.
 *
 * Policy: rng() < 0.8 → enemy Stun 2 (0 succeeds, 0.8 / 0.99 fail). Fail: no self-Stun.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, EffectType, SkillTag } from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const temple = SKILLS.TEMPLE_NIRVANA;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [temple],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

function hasStun(
  buffs: { effect: { type: EffectType }; duration: number }[] | undefined,
  duration: number,
): boolean {
  return (buffs ?? []).some(
    (buff) => buff.effect.type === EffectType.STUN && buff.duration === duration,
  );
}

describe('T-111 authoring', () => {
  it('declares SUPPORT AP3 CP8 CD6 + 80% Stun 2 and not STUN chance 1.0', () => {
    expect(temple.id).toBe('temple_nirvana');
    expect(temple.cardRole).toBe(CardRole.SUPPORT);
    expect(temple.apCost).toBe(3);
    expect(temple.chakraCost).toBe(8);
    expect(temple.hpCost).toBe(0);
    expect(temple.cooldown).toBe(6);
    expect(temple.baseDamage).toBe(0);
    expect(temple.tags).toEqual(expect.arrayContaining([SkillTag.GENJUTSU, SkillTag.MENTAL]));
    expect(temple.controlStun).toEqual({ chance: 0.8, enemyDuration: 2 });
    expect(temple.controlStun?.failSelfDuration).toBeUndefined();
    expect(
      temple.effects?.some((e) => e.type === EffectType.STUN && e.chance === 1.0),
    ).toBeFalsy();
  });
});

describe('T-111 stun hit', () => {
  it('applies enemy Stun 2 on success and never damages', () => {
    const win = resolveSkill({ skill: temple }, baseState(), { rng: () => 0 });
    expect(win.ok).toBe(true);
    if (!win.ok) return;
    expect(win.damageDealt).toBe(0);
    expect(win.state.pools.ap).toBe(3);
    expect(win.state.pools.chakra).toBe(12);
    expect(hasStun(win.state.enemyBuffs, 2)).toBe(true);
    expect(hasStun(win.state.playerBuffs, 2)).toBe(false);
  });
});

describe('T-111 stun miss', () => {
  it('plants no Stun on fail and still deals 0', () => {
    const lose = resolveSkill({ skill: temple }, baseState(), { rng: () => 0.99 });
    expect(lose.ok).toBe(true);
    if (!lose.ok) return;
    expect(lose.damageDealt).toBe(0);
    expect(lose.state.pools.ap).toBe(3);
    expect(hasStun(lose.state.enemyBuffs, 2)).toBe(false);
    expect(hasStun(lose.state.playerBuffs, 2)).toBe(false);
    expect(hasStun(lose.state.enemyBuffs, 1)).toBe(false);
  });
});
