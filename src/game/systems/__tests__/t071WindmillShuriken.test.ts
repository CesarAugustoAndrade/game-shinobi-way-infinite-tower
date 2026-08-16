/**
 * T-071 AC: Windmill Shuriken — SIDE 12 M/L; PULL 1 on hit.
 */

import { describe, it, expect } from 'vitest';
import {
  AttackMethod,
  CardRole,
  CombatRange,
  DamageProperty,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const mill = SKILLS.WINDMILL_SHURIKEN;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.LONG,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [mill],
    playerBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: false,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: mill.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-071 authoring', () => {
  it('declares SIDE AP2 CP0 CD3 12 M/L + PULL requireHit and not PIERCING/pen 0.2', () => {
    expect(mill.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(mill.apCost).toBe(2);
    expect(mill.chakraCost).toBe(0);
    expect(mill.cooldown).toBe(3);
    expect(mill.hpCost).toBe(0);
    expect(mill.baseDamage).toBe(12);
    expect(mill.attackMethod).toBe(AttackMethod.RANGED);
    expect(mill.allowedRanges).toEqual([CombatRange.MEDIUM, CombatRange.LONG]);
    expect(mill.allowedRanges).not.toContain(CombatRange.CLOSE);
    expect(mill.tags).toEqual(
      expect.arrayContaining([SkillTag.TOOL, SkillTag.WEAPON, SkillTag.PHYSICAL]),
    );
    expect(mill.bandMove).toEqual({ kind: 'PULL', steps: 1, requireHit: true });
    expect(mill.damageProperty).not.toBe(DamageProperty.PIERCING);
    expect(mill.penetration ?? 0).toBe(0);
  });
});

describe('T-071 pull', () => {
  it('deals 12 from LONG, PULLs to MEDIUM, and does not spend the manual move', () => {
    const result = resolveSkill({ skill: mill }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(12);
    expect(result.state.range).toBe(CombatRange.MEDIUM);
    expect(result.state.playerMoveUsedThisTurn).toBe(false);

    const close = resolveSkill(
      { skill: mill },
      baseState({ range: CombatRange.CLOSE }),
      hit,
    );
    expect(close.ok).toBe(false);
  });
});

describe('T-071 edge', () => {
  it('leaves LONG on miss and stays CLOSE when already CLOSE (via MEDIUM then CLOSE)', () => {
    const whiff = resolveSkill({ skill: mill }, baseState(), miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.range).toBe(CombatRange.LONG);
    expect(whiff.state.playerMoveUsedThisTurn).toBe(false);

    const mid = resolveSkill(
      { skill: mill },
      baseState({ range: CombatRange.MEDIUM }),
      hit,
    );
    expect(mid.ok).toBe(true);
    if (!mid.ok) return;
    expect(mid.state.range).toBe(CombatRange.CLOSE);

    const atClose = resolveSkill(
      { skill: mill },
      {
        ...mid.state,
        skills: [mill],
        playerMoveUsedThisTurn: false,
      },
      hit,
    );
    expect(atClose.ok).toBe(false);
  });
});
