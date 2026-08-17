/**
 * T-103 AC: Water Vortex ATTACK — 20 M/L; PUSH 1; −2 SPD×2 on hit.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  PrimaryStat,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const vortex = SKILLS.WATER_VORTEX;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [vortex],
    playerBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: true,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: vortex.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-103 authoring', () => {
  it('declares ATTACK AP4 CP8 CD5 20 MEDIUM·LONG + PUSH requireHit + spd_down 2×2', () => {
    expect(vortex.id).toBe('water_vortex');
    expect(vortex.cardRole).toBe(CardRole.ATTACK);
    expect(vortex.apCost).toBe(4);
    expect(vortex.chakraCost).toBe(8);
    expect(vortex.cooldown).toBe(5);
    expect(vortex.hpCost).toBe(0);
    expect(vortex.baseDamage).toBe(20);
    expect(vortex.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.MEDIUM, CombatRange.LONG]),
    );
    expect(vortex.allowedRanges).not.toContain(CombatRange.CLOSE);
    expect(vortex.bandMove).toEqual({ kind: 'PUSH', steps: 1, requireHit: true });
    expect(vortex.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'spd_down',
          duration: 2,
          stacks: 2,
          family: MarkFamily.STAT,
          targetActor: 'enemy',
          requireHit: true,
        }),
      ]),
    );
    expect(vortex.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.WATER]));
    expect(
      vortex.effects?.some(
        (e) =>
          e.type === EffectType.DEBUFF &&
          e.targetStat === PrimaryStat.SPEED &&
          e.value === 0.4,
      ),
    ).toBeFalsy();
  });
});

describe('T-103 medium push', () => {
  it('from MEDIUM deals 20, PUSHes to LONG, plants −2 SPD, and does not spend the manual move', () => {
    const result = resolveSkill({ skill: vortex }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(20);
    expect(result.state.range).toBe(CombatRange.LONG);
    expect(result.state.playerMoveUsedThisTurn).toBe(true);
    const mark = result.state.marks.find((m) => m.id === 'spd_down');
    expect(mark?.target).toBe(CombatActor.ENEMY);
    expect(mark?.duration).toBe(2);
    expect(mark?.stacks).toBe(2);
    expect(mark?.family).toBe(MarkFamily.STAT);

    const close = resolveSkill({ skill: vortex }, baseState({ range: CombatRange.CLOSE }), hit);
    expect(close.ok).toBe(false);
  });
});

describe('T-103 long miss', () => {
  it('from LONG stays LONG and still plants SPD; miss plants nothing and does not PUSH', () => {
    const atLong = resolveSkill(
      { skill: vortex },
      baseState({ range: CombatRange.LONG }),
      hit,
    );
    expect(atLong.ok).toBe(true);
    if (!atLong.ok) return;
    expect(atLong.damageDealt).toBe(20);
    expect(atLong.state.range).toBe(CombatRange.LONG);
    expect(atLong.state.playerMoveUsedThisTurn).toBe(true);
    expect(atLong.state.marks.some((m) => m.id === 'spd_down' && m.stacks === 2)).toBe(true);

    const whiff = resolveSkill({ skill: vortex }, baseState(), miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.range).toBe(CombatRange.MEDIUM);
    expect(whiff.state.marks.some((m) => m.id === 'spd_down')).toBe(false);
    expect(whiff.state.playerMoveUsedThisTurn).toBe(true);
  });
});
