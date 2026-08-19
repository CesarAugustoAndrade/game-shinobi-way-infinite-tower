/**
 * T-108 AC: Summon Manda ATTACK — 25 C/M; Poison 6×3 on hit; HP 20 paid at attempt.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  DamageType,
  EffectType,
  MarkFamily,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const snake = SKILLS.SUMMON_MANDA;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [snake],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: snake.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-108 authoring', () => {
  it('declares ATTACK AP4 CP8 HP20 CD7 25 CLOSE·MEDIUM + Poison 6×3 requireHit', () => {
    expect(snake.id).toBe('summon_manda');
    expect(snake.cardRole).toBe(CardRole.ATTACK);
    expect(snake.apCost).toBe(4);
    expect(snake.chakraCost).toBe(8);
    expect(snake.hpCost).toBe(20);
    expect(snake.cooldown).toBe(7);
    expect(snake.baseDamage).toBe(25);
    expect(snake.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.CLOSE, CombatRange.MEDIUM]),
    );
    expect(snake.allowedRanges).not.toContain(CombatRange.LONG);
    expect(snake.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'poison',
          stacks: 6,
          duration: 3,
          family: MarkFamily.DOT,
          targetActor: 'enemy',
          requireHit: true,
        }),
      ]),
    );
    expect(snake.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.PHYSICAL]));
    expect(
      snake.effects?.some(
        (e) => e.type === EffectType.POISON && e.value === 15 && e.damageType === DamageType.TRUE,
      ),
    ).toBeFalsy();
  });
});

describe('T-108 hit', () => {
  it('pays HP 20 at attempt, deals 25, and plants Poison 6×3', () => {
    const result = resolveSkill({ skill: snake }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(25);
    expect(result.state.pools.hp).toBe(20);
    expect(result.state.pools.ap).toBe(2);
    expect(result.state.pools.chakra).toBe(12);
    const poison = result.state.marks.find((m) => m.id === 'poison');
    expect(poison?.target).toBe(CombatActor.ENEMY);
    expect(poison?.family).toBe(MarkFamily.DOT);
    expect(poison?.stacks).toBe(6);
    expect(poison?.duration).toBe(3);

    const atLong = resolveSkill({ skill: snake }, baseState({ range: CombatRange.LONG }), hit);
    expect(atLong.ok).toBe(false);
  });
});

describe('T-108 miss pay', () => {
  it('still pays HP 20 on 0 hits and plants no poison; insufficient HP consumes nothing', () => {
    const result = resolveSkill({ skill: snake }, baseState(), miss);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.pools.hp).toBe(20);
    expect(result.state.marks.some((m) => m.id === 'poison')).toBe(false);

    const broke = resolveSkill(
      { skill: snake },
      baseState({ pools: { ap: 6, chakra: 20, hp: 19, maxHp: 40 } }),
      hit,
    );
    expect(broke.ok).toBe(false);
    if (broke.ok) return;
    expect(broke.reason).toBe('hp');
    expect(broke.state.pools.hp).toBe(19);
    expect(broke.state.pools.ap).toBe(6);
    expect(broke.state.pools.chakra).toBe(20);
  });
});
