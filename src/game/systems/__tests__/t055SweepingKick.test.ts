/**
 * T-055 AC: Sweeping Kick — SIDE 7 CLOSE; 40% Stun 1 on impact.
 *
 * Threshold: rng() < 0.4 → stun (0 succeeds, 0.4 fails).
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

const kick = SKILLS.SWEEPING_KICK;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [kick],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: kick.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

function hasStun(
  buffs: { effect: { type: EffectType }; duration: number }[] | undefined,
  duration: number,
): boolean {
  return (buffs ?? []).some(
    (buff) => buff.effect.type === EffectType.STUN && buff.duration === duration,
  );
}

describe('T-055 authoring', () => {
  it('declares SIDE AP1 CD2 CLOSE 7 + impactStun 40% / 1', () => {
    expect(kick.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(kick.apCost).toBe(1);
    expect(kick.chakraCost).toBe(0);
    expect(kick.cooldown).toBe(2);
    expect(kick.hpCost).toBe(0);
    expect(kick.baseDamage).toBe(7);
    expect(kick.attackMethod).toBe(AttackMethod.MELEE);
    expect(kick.allowedRanges).toEqual([CombatRange.CLOSE]);
    expect(kick.tags).toEqual(expect.arrayContaining([SkillTag.TAIJUTSU, SkillTag.PHYSICAL]));
    expect(kick.impactStun).toEqual({ chance: 0.4, duration: 1 });
    expect(kick.controlStun).toBeUndefined();
    expect(kick.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: EffectType.STUN, duration: 1, chance: 0.4 }),
      ]),
    );
  });
});

describe('T-055 stun', () => {
  it('deals 7 and plants enemy Stun 1 when rng < 0.4', () => {
    const result = resolveSkill({ skill: kick }, baseState(), { ...hit, rng: () => 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(7);
    expect(hasStun(result.state.enemyBuffs, 1)).toBe(true);
    expect(hasStun(result.state.playerBuffs, 1)).toBe(false);
  });

  it('deals 7 and plants no Stun when rng >= 0.4', () => {
    const result = resolveSkill({ skill: kick }, baseState(), { ...hit, rng: () => 0.4 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(7);
    expect(hasStun(result.state.enemyBuffs, 1)).toBe(false);
    expect(hasStun(result.state.playerBuffs, 1)).toBe(false);
  });
});

describe('T-055 miss', () => {
  it('deals 0 and plants no Stun on miss even when rng would succeed', () => {
    const result = resolveSkill({ skill: kick }, baseState(), { ...miss, rng: () => 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(hasStun(result.state.enemyBuffs, 1)).toBe(false);

    const mid = resolveSkill(
      { skill: kick },
      baseState({ range: CombatRange.MEDIUM }),
      { ...hit, rng: () => 0 },
    );
    expect(mid.ok).toBe(false);
  });
});
