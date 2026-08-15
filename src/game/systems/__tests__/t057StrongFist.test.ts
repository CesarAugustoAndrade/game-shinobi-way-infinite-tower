/**
 * T-057 AC: Strong Fist — ATTACK 2×5 CLOSE; independent rolls.
 */

import { describe, it, expect } from 'vitest';
import {
  AttackMethod,
  CardRole,
  CombatRange,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const fist = SKILLS.STRONG_FIST;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [fist],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: fist.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-057 authoring', () => {
  it('declares ATTACK AP2 CD1 CLOSE 2×5 and not a single 10', () => {
    expect(fist.cardRole).toBe(CardRole.ATTACK);
    expect(fist.apCost).toBe(2);
    expect(fist.chakraCost).toBe(0);
    expect(fist.cooldown).toBe(1);
    expect(fist.hpCost).toBe(0);
    expect(fist.hitCount).toBe(2);
    expect(fist.baseDamage).toBe(5);
    expect(fist.baseDamage).not.toBe(10);
    expect(fist.attackMethod).toBe(AttackMethod.MELEE);
    expect(fist.allowedRanges).toEqual([CombatRange.CLOSE]);
    expect(fist.tags).toEqual(
      expect.arrayContaining([SkillTag.TAIJUTSU, SkillTag.PHYSICAL, SkillTag.MULTI_HIT]),
    );
    expect(fist.modeInteraction).toBeUndefined();
    expect(fist.bandMove).toBeUndefined();
  });
});

describe('T-057 full', () => {
  it('lands 2 hits for 10 and rejects MEDIUM', () => {
    const result = resolveSkill({ skill: fist }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(2);
    expect(result.damageDealt).toBe(10);

    const mid = resolveSkill(
      { skill: fist },
      baseState({ range: CombatRange.MEDIUM }),
      hit,
    );
    expect(mid.ok).toBe(false);
  });
});

describe('T-057 miss', () => {
  it('lands 0 hits and deals 0', () => {
    const result = resolveSkill({ skill: fist }, baseState(), miss);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(0);
    expect(result.damageDealt).toBe(0);
  });

  it('lands 1 hit for 5 when the second roll misses', () => {
    let n = 0;
    const mixed = {
      rollHit: () => {
        n += 1;
        return n === 1
          ? { hit: true, damage: fist.baseDamage }
          : { hit: false, damage: 0 };
      },
    };
    const result = resolveSkill({ skill: fist }, baseState(), mixed);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(1);
    expect(result.damageDealt).toBe(5);
    expect(n).toBe(2);
  });
});
