/**
 * T-095 AC: Great Breakthrough ATTACK — 16 M/L; PUSH 1; +20% Setup if band changes.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, EffectType, PrimaryStat, SkillTag } from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const gust = SKILLS.GREAT_BREAKTHROUGH;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [gust],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: true,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: gust.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-095 authoring', () => {
  it('declares ATTACK AP3 CP5 CD3 16 MEDIUM·LONG + PUSH requireHit + Setup 0.2', () => {
    expect(gust.id).toBe('great_breakthrough');
    expect(gust.cardRole).toBe(CardRole.ATTACK);
    expect(gust.apCost).toBe(3);
    expect(gust.chakraCost).toBe(5);
    expect(gust.cooldown).toBe(3);
    expect(gust.hpCost).toBe(0);
    expect(gust.baseDamage).toBe(16);
    expect(gust.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.MEDIUM, CombatRange.LONG]),
    );
    expect(gust.allowedRanges).not.toContain(CombatRange.CLOSE);
    expect(gust.bandMove).toEqual({ kind: 'PUSH', steps: 1, requireHit: true });
    expect(gust.setupMultIfBandMoved).toBe(0.2);
    expect(gust.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.WIND]));
    expect(
      gust.effects?.some(
        (e) =>
          e.type === EffectType.DEBUFF &&
          e.targetStat === PrimaryStat.ACCURACY &&
          e.value === 0.25,
      ),
    ).toBeFalsy();
  });
});

describe('T-095 moved bonus', () => {
  it('from MEDIUM deals floor(16*1.2), PUSHes to LONG, and does not spend the manual move', () => {
    const result = resolveSkill({ skill: gust }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(Math.floor(16 * 1.2));
    expect(result.state.range).toBe(CombatRange.LONG);
    expect(result.state.playerMoveUsedThisTurn).toBe(true);

    const close = resolveSkill({ skill: gust }, baseState({ range: CombatRange.CLOSE }), hit);
    expect(close.ok).toBe(false);
  });
});

describe('T-095 long boundary', () => {
  it('from LONG deals baseline 16, stays LONG, and does not apply +20%', () => {
    const result = resolveSkill(
      { skill: gust },
      baseState({ range: CombatRange.LONG }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(16);
    expect(result.state.range).toBe(CombatRange.LONG);
    expect(result.state.playerMoveUsedThisTurn).toBe(true);

    const whiff = resolveSkill({ skill: gust }, baseState(), miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.range).toBe(CombatRange.MEDIUM);
    expect(whiff.state.playerMoveUsedThisTurn).toBe(true);
  });
});
