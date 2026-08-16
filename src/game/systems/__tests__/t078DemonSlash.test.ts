/**
 * T-078 AC: Demon Slash ATTACK — 15 CLOSE + Bleed 6×3 on hit.
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

const slash = SKILLS.DEMON_SLASH;

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

describe('T-078 authoring', () => {
  it('declares ATTACK AP3 CD2 CLOSE 15 + Bleed 6×3 and not AP2 / BLEED 15 / PIERCING', () => {
    expect(slash.cardRole).toBe(CardRole.ATTACK);
    expect(slash.apCost).toBe(3);
    expect(slash.chakraCost).toBe(0);
    expect(slash.cooldown).toBe(2);
    expect(slash.hpCost).toBe(0);
    expect(slash.baseDamage).toBe(15);
    expect(slash.allowedRanges).toEqual([CombatRange.CLOSE]);
    expect(slash.damageProperty).toBe(DamageProperty.NORMAL);
    expect(slash.tags).toEqual(expect.arrayContaining([SkillTag.WEAPON, SkillTag.PHYSICAL]));
    expect(slash.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'bleed',
          duration: 3,
          stacks: 6,
          family: MarkFamily.DOT,
          targetActor: 'enemy',
          perHit: true,
        }),
      ]),
    );
    expect(
      slash.effects?.some((e) => e.type === EffectType.BLEED && e.value === 15),
    ).toBeFalsy();
    expect(slash.modeInteraction).toBeUndefined();
    expect(slash.hitCount ?? 1).toBe(1);
  });
});

describe('T-078 hit', () => {
  it('deals 15 and plants enemy Bleed 6 duration 3', () => {
    const result = resolveSkill({ skill: slash }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(15);
    const bleed = result.state.marks.find((m) => m.id === 'bleed');
    expect(bleed?.target).toBe(CombatActor.ENEMY);
    expect(bleed?.duration).toBe(3);
    expect(bleed?.stacks).toBe(6);
    expect(bleed?.family).toBe(MarkFamily.DOT);

    const mid = resolveSkill(
      { skill: slash },
      baseState({ range: CombatRange.MEDIUM }),
      hit,
    );
    expect(mid.ok).toBe(false);
  });
});

describe('T-078 miss costs', () => {
  it('plants nothing, deals 0, and pays AP3', () => {
    const result = resolveSkill({ skill: slash }, baseState(), miss);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.marks.some((m) => m.id === 'bleed')).toBe(false);
    expect(result.state.pools.ap).toBe(3);
    expect(result.state.pools.chakra).toBe(20);
  });
});
