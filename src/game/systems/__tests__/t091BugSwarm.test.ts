/**
 * T-091 AC: Bug Swarm — SIDE 8 M/L; on hit drain 6 CP + Poison 3×3.
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

const swarm = SKILLS.BUG_SWARM;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [swarm],
    playerBuffs: [],
    enemyHp: 80,
    enemyChakra: 20,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: swarm.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-091 authoring', () => {
  it('declares SIDE 8 MEDIUM·LONG + drain 6 + Poison 3×3', () => {
    expect(swarm.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(swarm.apCost).toBe(2);
    expect(swarm.chakraCost).toBe(6);
    expect(swarm.cooldown).toBe(4);
    expect(swarm.hpCost).toBe(0);
    expect(swarm.baseDamage).toBe(8);
    expect(swarm.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.MEDIUM, CombatRange.LONG]),
    );
    expect(swarm.impactChakraDrain).toBe(6);
    expect(swarm.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'poison',
          duration: 3,
          stacks: 3,
          family: MarkFamily.DOT,
          targetActor: 'enemy',
          requireHit: true,
        }),
      ]),
    );
    expect(swarm.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.PHYSICAL]));
    expect(swarm.modeInteraction).toBeUndefined();
    expect(
      swarm.effects?.some((e) => e.type === EffectType.CHAKRA_DRAIN && e.value === 25),
    ).toBeFalsy();
    expect(
      swarm.effects?.some((e) => e.type === EffectType.POISON && e.value === 8),
    ).toBeFalsy();
  });
});

describe('T-091 impact', () => {
  it('deals 8, drains 6 CP, and plants Poison 3×3 once', () => {
    const result = resolveSkill({ skill: swarm }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(8);
    expect(result.state.enemyChakra).toBe(14);
    const poison = result.state.marks.find((m) => m.id === 'poison');
    expect(poison?.target).toBe(CombatActor.ENEMY);
    expect(poison?.duration).toBe(3);
    expect(poison?.stacks).toBe(3);
    expect(poison?.family).toBe(MarkFamily.DOT);
    expect(result.state.marks.filter((m) => m.id === 'poison')).toHaveLength(1);
  });
});

describe('T-091 miss', () => {
  it('commits nothing of the impact package on 0 hits', () => {
    const result = resolveSkill({ skill: swarm }, baseState(), miss);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(0);
    expect(result.damageDealt).toBe(0);
    expect(result.state.enemyChakra).toBe(20);
    expect(result.state.marks.some((m) => m.id === 'poison')).toBe(false);
  });
});
