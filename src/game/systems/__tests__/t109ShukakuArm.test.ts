/**
 * T-109 AC: Shukaku Arm ATTACK — 27 C/M; self Shield 30 on resolve even on miss.
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

const arm = SKILLS.SHUKAKU_ARM;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [arm],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: arm.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-109 authoring', () => {
  it('declares ATTACK AP4 CP8 CD6 27 CLOSE·MEDIUM + self Shield 30 without requireHit', () => {
    expect(arm.id).toBe('shukaku_arm');
    expect(arm.cardRole).toBe(CardRole.ATTACK);
    expect(arm.apCost).toBe(4);
    expect(arm.chakraCost).toBe(8);
    expect(arm.hpCost).toBe(0);
    expect(arm.cooldown).toBe(6);
    expect(arm.baseDamage).toBe(27);
    expect(arm.damageProperty).toBe(DamageProperty.NORMAL);
    expect(arm.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.CLOSE, CombatRange.MEDIUM]),
    );
    expect(arm.allowedRanges).not.toContain(CombatRange.LONG);
    expect(arm.modeInteraction).toBeUndefined();
    expect(arm.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'shukaku_arm_shield',
          stacks: 30,
          duration: 99,
          family: MarkFamily.SHIELD,
          targetActor: 'self',
        }),
      ]),
    );
    expect(arm.markEffects?.some((m) => m.id === 'shukaku_arm_shield' && m.requireHit === true)).toBe(
      false,
    );
    expect(arm.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.EARTH]));
    expect(arm.damageProperty).not.toBe(DamageProperty.ARMOR_BREAK);
    expect(
      arm.effects?.some((e) => e.type === EffectType.SHIELD && e.value === 100 && e.duration === 2),
    ).toBeFalsy();
  });
});

describe('T-109 hit', () => {
  it('deals 27 and plants self Shield 30', () => {
    const result = resolveSkill({ skill: arm }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(27);
    const shield = result.state.marks.find((m) => m.id === 'shukaku_arm_shield');
    expect(shield?.target).toBe(CombatActor.PLAYER);
    expect(shield?.family).toBe(MarkFamily.SHIELD);
    expect(shield?.stacks).toBe(30);

    const atLong = resolveSkill({ skill: arm }, baseState({ range: CombatRange.LONG }), hit);
    expect(atLong.ok).toBe(false);
  });
});

describe('T-109 miss shield', () => {
  it('plants Shield 30 on 0 hits with no enemy damage', () => {
    const result = resolveSkill({ skill: arm }, baseState(), miss);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    const shield = result.state.marks.find((m) => m.id === 'shukaku_arm_shield');
    expect(shield?.target).toBe(CombatActor.PLAYER);
    expect(shield?.family).toBe(MarkFamily.SHIELD);
    expect(shield?.stacks).toBe(30);
  });
});
