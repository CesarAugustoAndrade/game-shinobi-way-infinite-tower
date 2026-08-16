/**
 * T-081 AC: 1000 Years SIDE — 9 CLOSE; independent 45% Stun 1 + 45% Confusion 1.
 *
 * On hit, resolve draws rng twice: confusion first, then stun (existing dispatch).
 * Threshold: rng() < 0.45 succeeds.
 */

import { describe, it, expect } from 'vitest';
import {
  AttackMethod,
  CardRole,
  CombatRange,
  EffectType,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const poke = SKILLS.THOUSAND_YEARS;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [poke],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: poke.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

function seqRng(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)]!;
}

function hasEffect(
  buffs: { effect: { type: EffectType }; duration: number }[] | undefined,
  type: EffectType,
  duration: number,
): boolean {
  return (buffs ?? []).some((b) => b.effect.type === type && b.duration === duration);
}

describe('T-081 authoring', () => {
  it('declares SIDE AP2 CP1 CD5 CLOSE 9 + dual 45%×1 and not STUN 100% / CONFUSION 0.6×2', () => {
    expect(poke.id).toBe('1000_years');
    expect(poke.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(poke.apCost).toBe(2);
    expect(poke.chakraCost).toBe(1);
    expect(poke.cooldown).toBe(5);
    expect(poke.hpCost).toBe(0);
    expect(poke.baseDamage).toBe(9);
    expect(poke.attackMethod).toBe(AttackMethod.MELEE);
    expect(poke.allowedRanges).toEqual([CombatRange.CLOSE]);
    expect(poke.tags).toEqual(expect.arrayContaining([SkillTag.TAIJUTSU, SkillTag.PHYSICAL]));
    expect(poke.impactStun).toEqual({ chance: 0.45, duration: 1 });
    expect(poke.controlConfusion).toEqual({ chance: 0.45, enemyDuration: 1 });
    expect(poke.effects?.some((e) => e.type === EffectType.STUN && e.chance === 1)).toBeFalsy();
    expect(
      poke.effects?.some((e) => e.type === EffectType.CONFUSION && e.chance === 0.6 && e.duration === 2),
    ).toBeFalsy();
  });
});

describe('T-081 damage', () => {
  it('deals 9 on hit and 0 with no control on miss', () => {
    const landed = resolveSkill({ skill: poke }, baseState(), {
      ...hit,
      rng: seqRng([0.99, 0.99]),
    });
    expect(landed.ok).toBe(true);
    if (!landed.ok) return;
    expect(landed.damageDealt).toBe(9);

    const whiff = resolveSkill({ skill: poke }, baseState(), {
      ...miss,
      rng: seqRng([0, 0]),
    });
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(hasEffect(whiff.state.enemyBuffs, EffectType.STUN, 1)).toBe(false);
    expect(hasEffect(whiff.state.enemyBuffs, EffectType.CONFUSION, 1)).toBe(false);

    const mid = resolveSkill(
      { skill: poke },
      baseState({ range: CombatRange.MEDIUM }),
      { ...hit, rng: seqRng([0, 0]) },
    );
    expect(mid.ok).toBe(false);
  });
});

describe('T-081 rolls', () => {
  it('applies Stun and Confusion independently after impact', () => {
    const confusionOnly = resolveSkill({ skill: poke }, baseState(), {
      ...hit,
      rng: seqRng([0, 0.45]),
    });
    expect(confusionOnly.ok).toBe(true);
    if (!confusionOnly.ok) return;
    expect(hasEffect(confusionOnly.state.enemyBuffs, EffectType.CONFUSION, 1)).toBe(true);
    expect(hasEffect(confusionOnly.state.enemyBuffs, EffectType.STUN, 1)).toBe(false);

    const stunOnly = resolveSkill({ skill: poke }, baseState(), {
      ...hit,
      rng: seqRng([0.45, 0]),
    });
    expect(stunOnly.ok).toBe(true);
    if (!stunOnly.ok) return;
    expect(hasEffect(stunOnly.state.enemyBuffs, EffectType.STUN, 1)).toBe(true);
    expect(hasEffect(stunOnly.state.enemyBuffs, EffectType.CONFUSION, 1)).toBe(false);

    const both = resolveSkill({ skill: poke }, baseState(), {
      ...hit,
      rng: seqRng([0, 0]),
    });
    expect(both.ok).toBe(true);
    if (!both.ok) return;
    expect(hasEffect(both.state.enemyBuffs, EffectType.STUN, 1)).toBe(true);
    expect(hasEffect(both.state.enemyBuffs, EffectType.CONFUSION, 1)).toBe(true);

    const neither = resolveSkill({ skill: poke }, baseState(), {
      ...hit,
      rng: seqRng([0.45, 0.45]),
    });
    expect(neither.ok).toBe(true);
    if (!neither.ok) return;
    expect(hasEffect(neither.state.enemyBuffs, EffectType.STUN, 1)).toBe(false);
    expect(hasEffect(neither.state.enemyBuffs, EffectType.CONFUSION, 1)).toBe(false);
  });
});
