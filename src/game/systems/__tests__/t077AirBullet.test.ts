/**
 * T-077 AC: Air Bullet SIDE — 13 M/L; PUSH 1 + −1 ACC on hit.
 */

import { describe, it, expect } from 'vitest';
import {
  AttackMethod,
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

const bullet = SKILLS.AIR_BULLET;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [bullet],
    playerBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: false,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: bullet.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-077 authoring', () => {
  it('declares SIDE AP2 CP5 CD2 13 M/L + PUSH + −1 ACC and not WIL −0.15', () => {
    expect(bullet.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(bullet.apCost).toBe(2);
    expect(bullet.chakraCost).toBe(5);
    expect(bullet.cooldown).toBe(2);
    expect(bullet.hpCost).toBe(0);
    expect(bullet.baseDamage).toBe(13);
    expect(bullet.attackMethod).toBe(AttackMethod.RANGED);
    expect(bullet.allowedRanges).toEqual([CombatRange.MEDIUM, CombatRange.LONG]);
    expect(bullet.allowedRanges).not.toContain(CombatRange.CLOSE);
    expect(bullet.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.WIND]));
    expect(bullet.bandMove).toEqual({ kind: 'PUSH', steps: 1, requireHit: true });
    expect(bullet.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'air_acc_down',
          duration: 1,
          stacks: 1,
          family: MarkFamily.STAT,
          targetActor: 'enemy',
          requireHit: true,
        }),
      ]),
    );
    expect(
      bullet.effects?.some(
        (e) =>
          e.type === EffectType.DEBUFF &&
          e.targetStat === PrimaryStat.WILLPOWER &&
          e.value === 0.15,
      ),
    ).toBeFalsy();
  });
});

describe('T-077 hit', () => {
  it('deals 13 from MEDIUM, PUSHes to LONG, plants −1 ACC, and does not spend the manual move', () => {
    const result = resolveSkill({ skill: bullet }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(13);
    expect(result.state.range).toBe(CombatRange.LONG);
    expect(result.state.playerMoveUsedThisTurn).toBe(false);
    const mark = result.state.marks.find((m) => m.id === 'air_acc_down');
    expect(mark?.target).toBe(CombatActor.ENEMY);
    expect(mark?.family).toBe(MarkFamily.STAT);
    expect(mark?.stacks).toBe(1);
    expect(mark?.duration).toBe(1);
  });
});

describe('T-077 miss', () => {
  it('deals 0 from MEDIUM, leaves the band unchanged, and plants no ACC mark', () => {
    const result = resolveSkill({ skill: bullet }, baseState(), miss);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.range).toBe(CombatRange.MEDIUM);
    expect(result.state.marks.some((m) => m.id === 'air_acc_down')).toBe(false);
    expect(result.state.playerMoveUsedThisTurn).toBe(false);
  });
});
