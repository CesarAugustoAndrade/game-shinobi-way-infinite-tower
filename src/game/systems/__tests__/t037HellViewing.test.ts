/**
 * T-037 AC: Hell Viewing — ATTACK 18 mental + Fear 1 (−20% next enemy action).
 *
 * Fear stacks 20 = 20%. applyFearOutgoing is the consume contract (not player ATTEMPT).
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatActor, CombatRange, EffectType, MarkFamily } from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { applyFearOutgoing } from '../MarkSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const hell = SKILLS.HELL_VIEWING;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [hell],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: hell.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-037 authoring', () => {
  it('declares ATTACK 18 + Fear 20% and no STR −30% identity', () => {
    expect(hell.cardRole).toBe(CardRole.ATTACK);
    expect(hell.apCost).toBe(2);
    expect(hell.chakraCost).toBe(6);
    expect(hell.cooldown).toBe(4);
    expect(hell.baseDamage).toBe(18);
    expect(hell.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'fear',
          duration: 1,
          stacks: 20,
          family: MarkFamily.STAT,
          targetActor: 'enemy',
        }),
      ]),
    );
    expect(hell.effects?.some((e) => e.type === EffectType.DEBUFF && e.value === 0.3)).toBeFalsy();
  });
});

describe('T-037 fear plant', () => {
  it('deals 18 and plants enemy Fear 1 on hit; miss plants nothing', () => {
    const landed = resolveSkill({ skill: hell }, baseState(), hit);
    expect(landed.ok).toBe(true);
    if (!landed.ok) return;
    expect(landed.damageDealt).toBe(18);
    const fear = landed.state.marks.find((m) => m.id === 'fear');
    expect(fear?.target).toBe(CombatActor.ENEMY);
    expect(fear?.duration).toBe(1);
    expect(fear?.stacks).toBe(20);

    const whiff = resolveSkill({ skill: hell }, baseState(), miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.marks.some((m) => m.id === 'fear')).toBe(false);
  });
});

describe('T-037 fear mult', () => {
  it('applies ×0.8 once and consumes Fear', () => {
    const planted = resolveSkill({ skill: hell }, baseState(), hit);
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    const feared = applyFearOutgoing(100, planted.state.marks);
    expect(feared.damage).toBe(Math.floor(100 * 0.8));
    expect(feared.consumed).toBe(true);
    expect(feared.marks.some((m) => m.id === 'fear')).toBe(false);

    const clean = applyFearOutgoing(100, []);
    expect(clean.damage).toBe(100);
    expect(clean.consumed).toBe(false);
  });
});
