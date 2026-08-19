/**
 * T-115 AC: Shinra Tensei ATTACK — 23 ANY; PUSH toward LONG; 70% Stun 1 on hit.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatRange,
  DamageType,
  EffectType,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const push = SKILLS.SHINRA_TENSEI;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [push],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: true,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: push.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

function hasStun(
  buffs: { effect: { type: EffectType }; duration: number }[] | undefined,
  duration = 1,
): boolean {
  return (buffs ?? []).some(
    (buff) => buff.effect.type === EffectType.STUN && buff.duration === duration,
  );
}

describe('T-115 authoring', () => {
  it('declares ATTACK AP4 CP13 CD5 23 ANY + PUSH requireHit + 70% Stun 1', () => {
    expect(push.id).toBe('shinra_tensei');
    expect(push.cardRole).toBe(CardRole.ATTACK);
    expect(push.apCost).toBe(4);
    expect(push.chakraCost).toBe(13);
    expect(push.hpCost).toBe(0);
    expect(push.cooldown).toBe(5);
    expect(push.baseDamage).toBe(23);
    expect(push.damageType).toBe(DamageType.ELEMENTAL);
    expect(push.bandMove).toEqual({ kind: 'PUSH', steps: 1, requireHit: true });
    expect(push.impactStun).toEqual({ chance: 0.7, duration: 1 });
    expect(push.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.WIND]));
    expect(push.damageType).not.toBe(DamageType.TRUE);
    expect(
      push.effects?.some((e) => e.type === EffectType.STUN && e.chance === 0.5),
    ).toBeFalsy();
  });
});

describe('T-115 hit', () => {
  it('from MEDIUM deals 23, PUSHes to LONG, and plants Stun 1 on rng success', () => {
    const result = resolveSkill({ skill: push }, baseState(), { ...hit, rng: () => 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(23);
    expect(result.state.range).toBe(CombatRange.LONG);
    expect(result.state.playerMoveUsedThisTurn).toBe(true);
    expect(hasStun(result.state.enemyBuffs, 1)).toBe(true);

    const fromClose = resolveSkill(
      { skill: push },
      baseState({ range: CombatRange.CLOSE }),
      { ...hit, rng: () => 0 },
    );
    expect(fromClose.ok).toBe(true);
    if (!fromClose.ok) return;
    expect(fromClose.state.range).toBe(CombatRange.MEDIUM);
    expect(hasStun(fromClose.state.enemyBuffs, 1)).toBe(true);
  });
});

describe('T-115 miss or long', () => {
  it('miss does not PUSH or Stun; hit from LONG stays LONG and may Stun', () => {
    const whiff = resolveSkill({ skill: push }, baseState(), { ...miss, rng: () => 0 });
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.range).toBe(CombatRange.MEDIUM);
    expect(hasStun(whiff.state.enemyBuffs, 1)).toBe(false);
    expect(whiff.state.playerMoveUsedThisTurn).toBe(true);

    const atLong = resolveSkill(
      { skill: push },
      baseState({ range: CombatRange.LONG }),
      { ...hit, rng: () => 0 },
    );
    expect(atLong.ok).toBe(true);
    if (!atLong.ok) return;
    expect(atLong.damageDealt).toBe(23);
    expect(atLong.state.range).toBe(CombatRange.LONG);
    expect(hasStun(atLong.state.enemyBuffs, 1)).toBe(true);

    const failStun = resolveSkill({ skill: push }, baseState(), { ...hit, rng: () => 0.7 });
    expect(failStun.ok).toBe(true);
    if (!failStun.ok) return;
    expect(failStun.state.range).toBe(CombatRange.LONG);
    expect(hasStun(failStun.state.enemyBuffs, 1)).toBe(false);
  });
});
