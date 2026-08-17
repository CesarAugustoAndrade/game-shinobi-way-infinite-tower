/**
 * T-104 AC: Ice Mirrors ATTACK — 4×4 ANY; 40% Stun 1 if ≥2 hits land.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatRange,
  DamageProperty,
  EffectType,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const mirrors = SKILLS.ICE_MIRRORS;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [mirrors],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

function nHits(land: number) {
  let n = 0;
  return {
    rollHit: () => {
      n += 1;
      return n <= land
        ? { hit: true, damage: mirrors.baseDamage }
        : { hit: false, damage: 0 };
    },
  };
}

function hasStun(buffs: { effect: { type: EffectType }; duration: number }[] | undefined): boolean {
  return (buffs ?? []).some((b) => b.effect.type === EffectType.STUN && b.duration === 1);
}

describe('T-104 authoring', () => {
  it('declares ATTACK AP3 CP7 CD4 4×4 ANY + impactStun 0.4 minHits 2', () => {
    expect(mirrors.id).toBe('ice_mirrors');
    expect(mirrors.cardRole).toBe(CardRole.ATTACK);
    expect(mirrors.apCost).toBe(3);
    expect(mirrors.chakraCost).toBe(7);
    expect(mirrors.cooldown).toBe(4);
    expect(mirrors.hpCost).toBe(0);
    expect(mirrors.baseDamage).toBe(4);
    expect(mirrors.hitCount).toBe(4);
    expect(mirrors.allowedRanges).toBeUndefined();
    expect(mirrors.impactStun).toEqual({ chance: 0.4, duration: 1, minHitsLanded: 2 });
    expect(mirrors.damageProperty).toBe(DamageProperty.NORMAL);
    expect(mirrors.damageProperty).not.toBe(DamageProperty.PIERCING);
    expect(mirrors.tags).toEqual(
      expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.WATER, SkillTag.MULTI_HIT]),
    );
    expect(
      mirrors.effects?.some((e) => e.type === EffectType.STUN && e.chance === 0.5),
    ).toBeFalsy();
  });
});

describe('T-104 multi stun', () => {
  it('with ≥2 hits deals 8 and stuns when rng < 0.4; CLOSE/MEDIUM/LONG all legal', () => {
    const stunned = resolveSkill({ skill: mirrors }, baseState(), {
      ...nHits(2),
      rng: () => 0,
    });
    expect(stunned.ok).toBe(true);
    if (!stunned.ok) return;
    expect(stunned.hitsLanded).toBe(2);
    expect(stunned.damageDealt).toBe(8);
    expect(hasStun(stunned.state.enemyBuffs)).toBe(true);

    const fail = resolveSkill({ skill: mirrors }, baseState(), {
      ...nHits(4),
      rng: () => 0.4,
    });
    expect(fail.ok).toBe(true);
    if (!fail.ok) return;
    expect(fail.hitsLanded).toBe(4);
    expect(fail.damageDealt).toBe(16);
    expect(hasStun(fail.state.enemyBuffs)).toBe(false);

    const atLong = resolveSkill(
      { skill: mirrors },
      baseState({ range: CombatRange.LONG }),
      { ...nHits(2), rng: () => 0 },
    );
    expect(atLong.ok).toBe(true);
  });
});

describe('T-104 threshold', () => {
  it('exactly 1 hit deals 4 and never stuns; 0 hits deal 0 and plant nothing', () => {
    const one = resolveSkill({ skill: mirrors }, baseState(), {
      ...nHits(1),
      rng: () => 0,
    });
    expect(one.ok).toBe(true);
    if (!one.ok) return;
    expect(one.hitsLanded).toBe(1);
    expect(one.damageDealt).toBe(4);
    expect(hasStun(one.state.enemyBuffs)).toBe(false);

    const whiff = resolveSkill({ skill: mirrors }, baseState(), {
      ...nHits(0),
      rng: () => 0,
    });
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.hitsLanded).toBe(0);
    expect(whiff.damageDealt).toBe(0);
    expect(hasStun(whiff.state.enemyBuffs)).toBe(false);
  });
});
