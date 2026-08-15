/**
 * T-059 AC: Sword Slash — ATTACK 10 CLOSE + Bleed 4×2 on hit.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const slash = SKILLS.SWORD_SLASH;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [slash],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: slash.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-059 authoring', () => {
  it('declares ATTACK AP2 CD1 CLOSE 10 + Bleed 4×2 and not BLEED 7@0.3', () => {
    expect(slash.cardRole).toBe(CardRole.ATTACK);
    expect(slash.apCost).toBe(2);
    expect(slash.chakraCost).toBe(0);
    expect(slash.cooldown).toBe(1);
    expect(slash.hpCost).toBe(0);
    expect(slash.baseDamage).toBe(10);
    expect(slash.allowedRanges).toEqual([CombatRange.CLOSE]);
    expect(slash.tags).toEqual(expect.arrayContaining([SkillTag.WEAPON, SkillTag.PHYSICAL]));
    expect(slash.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'bleed',
          duration: 2,
          stacks: 4,
          family: MarkFamily.DOT,
          targetActor: 'enemy',
          perHit: true,
        }),
      ]),
    );
    expect(
      slash.effects?.some((e) => e.type === EffectType.BLEED && e.value === 7 && e.chance === 0.3),
    ).toBeFalsy();
    expect(slash.modeInteraction).toBeUndefined();
    expect(slash.hitCount ?? 1).toBe(1);
  });
});

describe('T-059 hit', () => {
  it('deals 10 and plants enemy Bleed 4 duration 2', () => {
    const result = resolveSkill({ skill: slash }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(10);
    const bleed = result.state.marks.find((m) => m.id === 'bleed');
    expect(bleed?.target).toBe(CombatActor.ENEMY);
    expect(bleed?.duration).toBe(2);
    expect(bleed?.stacks).toBe(4);
    expect(bleed?.family).toBe(MarkFamily.DOT);

    const mid = resolveSkill(
      { skill: slash },
      baseState({ range: CombatRange.MEDIUM }),
      hit,
    );
    expect(mid.ok).toBe(false);
  });
});

describe('T-059 miss', () => {
  it('plants nothing and deals 0', () => {
    const result = resolveSkill({ skill: slash }, baseState(), miss);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.marks.some((m) => m.id === 'bleed')).toBe(false);
  });
});
