/**
 * T-093 AC: Earth Decapitation — SIDE 13 C/M; PULL to CLOSE; 50% Stun 1.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, EffectType, SkillTag } from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const decap = SKILLS.EARTH_DECAPITATION;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [decap],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: true,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: decap.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

function hasStun(buffs: { effect: { type: EffectType }; duration: number }[] | undefined): boolean {
  return (buffs ?? []).some((b) => b.effect.type === EffectType.STUN && b.duration === 1);
}

describe('T-093 authoring', () => {
  it('declares SIDE 13 CLOSE·MEDIUM + PULL requireHit + 50% Stun 1', () => {
    expect(decap.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(decap.apCost).toBe(2);
    expect(decap.chakraCost).toBe(5);
    expect(decap.cooldown).toBe(3);
    expect(decap.hpCost).toBe(0);
    expect(decap.baseDamage).toBe(13);
    expect(decap.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.CLOSE, CombatRange.MEDIUM]),
    );
    expect(decap.allowedRanges).not.toContain(CombatRange.LONG);
    expect(decap.bandMove).toEqual({ kind: 'PULL', steps: 1, requireHit: true });
    expect(decap.impactStun).toEqual({ chance: 0.5, duration: 1 });
    expect(decap.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.EARTH]));
    expect(decap.effects?.some((e) => e.type === EffectType.STUN && e.chance === 0.6)).toBeFalsy();
  });
});

describe('T-093 pull', () => {
  it('deals 13 from MEDIUM, PULLs to CLOSE, and does not spend the manual move', () => {
    const result = resolveSkill({ skill: decap }, baseState(), {
      ...hit,
      rng: () => 0.99,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(13);
    expect(result.state.range).toBe(CombatRange.CLOSE);
    expect(result.state.playerMoveUsedThisTurn).toBe(true);

    const atClose = resolveSkill(
      { skill: decap },
      baseState({ range: CombatRange.CLOSE }),
      { ...hit, rng: () => 0.99 },
    );
    expect(atClose.ok).toBe(true);
    if (!atClose.ok) return;
    expect(atClose.state.range).toBe(CombatRange.CLOSE);
    expect(atClose.state.playerMoveUsedThisTurn).toBe(true);

    const long = resolveSkill(
      { skill: decap },
      baseState({ range: CombatRange.LONG }),
      hit,
    );
    expect(long.ok).toBe(false);
  });
});

describe('T-093 stun', () => {
  it('plants Stun 1 when rng < 0.5 and none when rng >= 0.5; miss plants nothing', () => {
    const stunned = resolveSkill({ skill: decap }, baseState(), { ...hit, rng: () => 0 });
    expect(stunned.ok).toBe(true);
    if (!stunned.ok) return;
    expect(hasStun(stunned.state.enemyBuffs)).toBe(true);

    const fail = resolveSkill({ skill: decap }, baseState(), { ...hit, rng: () => 0.5 });
    expect(fail.ok).toBe(true);
    if (!fail.ok) return;
    expect(hasStun(fail.state.enemyBuffs)).toBe(false);

    const whiff = resolveSkill({ skill: decap }, baseState(), { ...miss, rng: () => 0 });
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.state.range).toBe(CombatRange.MEDIUM);
    expect(hasStun(whiff.state.enemyBuffs)).toBe(false);
    expect(whiff.state.playerMoveUsedThisTurn).toBe(true);
  });
});
