/**
 * T-056 AC: Explosive Tag — SIDE 11 CLOSE/MEDIUM; PUSH 1 on hit.
 */

import { describe, it, expect } from 'vitest';
import {
  AttackMethod,
  CardRole,
  CombatRange,
  ElementType,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const tag = SKILLS.EXPLOSIVE_TAG;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [tag],
    playerBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: false,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: tag.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-056 authoring', () => {
  it('declares SIDE AP1 CD2 11 at CLOSE/MEDIUM + PUSH requireHit', () => {
    expect(tag.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(tag.apCost).toBe(1);
    expect(tag.chakraCost).toBe(0);
    expect(tag.cooldown).toBe(2);
    expect(tag.hpCost).toBe(0);
    expect(tag.baseDamage).toBe(11);
    expect(tag.attackMethod).toBe(AttackMethod.RANGED);
    expect(tag.element).toBe(ElementType.FIRE);
    expect(tag.allowedRanges).toEqual([CombatRange.CLOSE, CombatRange.MEDIUM]);
    expect(tag.allowedRanges).not.toContain(CombatRange.LONG);
    expect(tag.tags).toEqual(expect.arrayContaining([SkillTag.TOOL, SkillTag.FIRE]));
    expect(tag.bandMove).toEqual({ kind: 'PUSH', steps: 1, requireHit: true });
  });
});

describe('T-056 push', () => {
  it('deals 11 from CLOSE, PUSHes to MEDIUM, and does not spend the manual move', () => {
    const result = resolveSkill({ skill: tag }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(11);
    expect(result.state.range).toBe(CombatRange.MEDIUM);
    expect(result.state.playerMoveUsedThisTurn).toBe(false);

    const long = resolveSkill(
      { skill: tag },
      baseState({ range: CombatRange.LONG }),
      hit,
    );
    expect(long.ok).toBe(false);
  });
});

describe('T-056 miss', () => {
  it('deals 0 from CLOSE and leaves the band unchanged', () => {
    const result = resolveSkill({ skill: tag }, baseState(), miss);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.range).toBe(CombatRange.CLOSE);
    expect(result.state.playerMoveUsedThisTurn).toBe(false);
  });
});
