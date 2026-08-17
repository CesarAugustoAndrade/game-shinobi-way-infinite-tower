/**
 * T-100 AC: Sand Coffin SIDE — 15 M/L; 70% Stun 1 + Coffined 2 on hit.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  DamageProperty,
  EffectType,
  MarkFamily,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const coffin = SKILLS.SAND_COFFIN;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [coffin],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: coffin.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

function hasStun(buffs: { effect: { type: EffectType }; duration: number }[] | undefined): boolean {
  return (buffs ?? []).some((b) => b.effect.type === EffectType.STUN && b.duration === 1);
}

describe('T-100 authoring', () => {
  it('declares SIDE AP2 CP7 CD5 15 MEDIUM·LONG + 70% Stun + coffined 2 requireHit', () => {
    expect(coffin.id).toBe('sand_coffin');
    expect(coffin.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(coffin.apCost).toBe(2);
    expect(coffin.chakraCost).toBe(7);
    expect(coffin.cooldown).toBe(5);
    expect(coffin.hpCost).toBe(0);
    expect(coffin.baseDamage).toBe(15);
    expect(coffin.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.MEDIUM, CombatRange.LONG]),
    );
    expect(coffin.allowedRanges).not.toContain(CombatRange.CLOSE);
    expect(coffin.impactStun).toEqual({ chance: 0.7, duration: 1 });
    expect(coffin.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'coffined',
          duration: 2,
          stacks: 1,
          family: MarkFamily.HARD_CONTROL,
          targetActor: 'enemy',
          requireHit: true,
        }),
      ]),
    );
    expect(coffin.damageProperty).toBe(DamageProperty.NORMAL);
    expect(coffin.damageProperty).not.toBe(DamageProperty.ARMOR_BREAK);
    expect(coffin.tags).toEqual(
      expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.EARTH, SkillTag.MARK]),
    );
    expect(
      coffin.effects?.some((e) => e.type === EffectType.STUN && e.chance === 0.7),
    ).toBeFalsy();
  });
});

describe('T-100 impact', () => {
  it('from MEDIUM deals 15, plants coffined 2, and stuns when rng < 0.7', () => {
    const stunned = resolveSkill({ skill: coffin }, baseState(), { ...hit, rng: () => 0 });
    expect(stunned.ok).toBe(true);
    if (!stunned.ok) return;
    expect(stunned.damageDealt).toBe(15);
    expect(hasStun(stunned.state.enemyBuffs)).toBe(true);
    const mark = stunned.state.marks.find((m) => m.id === 'coffined');
    expect(mark?.target).toBe(CombatActor.ENEMY);
    expect(mark?.duration).toBe(2);
    expect(mark?.stacks).toBe(1);
    expect(mark?.family).toBe(MarkFamily.HARD_CONTROL);

    const failStun = resolveSkill({ skill: coffin }, baseState(), { ...hit, rng: () => 0.7 });
    expect(failStun.ok).toBe(true);
    if (!failStun.ok) return;
    expect(failStun.damageDealt).toBe(15);
    expect(hasStun(failStun.state.enemyBuffs)).toBe(false);
    expect(failStun.state.marks.some((m) => m.id === 'coffined')).toBe(true);

    const close = resolveSkill({ skill: coffin }, baseState({ range: CombatRange.CLOSE }), hit);
    expect(close.ok).toBe(false);
  });
});

describe('T-100 miss', () => {
  it('deals 0 and plants neither coffined nor stun', () => {
    const result = resolveSkill({ skill: coffin }, baseState(), { ...miss, rng: () => 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(0);
    expect(result.damageDealt).toBe(0);
    expect(result.state.marks.some((m) => m.id === 'coffined')).toBe(false);
    expect(hasStun(result.state.enemyBuffs)).toBe(false);

    const atLong = resolveSkill(
      { skill: coffin },
      baseState({ range: CombatRange.LONG }),
      { ...hit, rng: () => 0.99 },
    );
    expect(atLong.ok).toBe(true);
    if (!atLong.ok) return;
    expect(atLong.damageDealt).toBe(15);
    expect(atLong.state.marks.some((m) => m.id === 'coffined')).toBe(true);
    expect(hasStun(atLong.state.enemyBuffs)).toBe(false);
  });
});
