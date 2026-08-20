/**
 * T-131 AC: C4 Karura ATTACK — plant C4 1 → 35 TRUE at next enemy opportunity; not instant 17.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  DamageType,
  MarkFamily,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import {
  C4_MARK_ID,
  C4_TRUE_DAMAGE,
  resolveC4AtEnemyOpportunity,
  stripC4,
} from '../MarkSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const c4 = SKILLS.C4_KARURA;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [c4],
    playerBuffs: [],
    enemyHp: 80,
    pendingSupportWeights: [],
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: 0 }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-131 authoring', () => {
  it('declares ATTACK AP5 CP18 CD6 C4 1 / 35 TRUE and not instant baseDamage 17', () => {
    expect(c4.id).toBe('c4_karura');
    expect(c4.cardRole).toBe(CardRole.ATTACK);
    expect(c4.apCost).toBe(5);
    expect(c4.chakraCost).toBe(18);
    expect(c4.hpCost).toBe(0);
    expect(c4.cooldown).toBe(6);
    expect(c4.baseDamage).toBe(0);
    expect(c4.baseDamage).not.toBe(17);
    expect(c4.scalingPerPoint).toBe(0);
    expect(c4.damageType).toBe(DamageType.TRUE);
    expect(c4.modeInteraction).toBeUndefined();
    expect(c4.tags).toEqual(
      expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.EARTH, SkillTag.MARK]),
    );
    expect(c4.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: C4_MARK_ID,
          duration: 1,
          stacks: 35,
          family: MarkFamily.STAT,
          targetActor: 'enemy',
        }),
      ]),
    );
  });
});

describe('T-131 plant', () => {
  it('plants enemy C4 duration 1 stacks 35 and deals 0 on cast', () => {
    const result = resolveSkill({ skill: c4 }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.pools.ap).toBe(1);
    expect(result.state.pools.chakra).toBe(2);
    expect(result.state.enemyHp).toBe(80);
    const mark = result.state.marks.find((m) => m.id === C4_MARK_ID);
    expect(mark?.target).toBe(CombatActor.ENEMY);
    expect(mark?.duration).toBe(1);
    expect(mark?.stacks).toBe(35);
    expect(mark?.family).toBe(MarkFamily.STAT);
    const used = result.state.skills.find((s) => s.id === c4.id);
    expect(used?.readyOnTurn).toBe(9);

    const missed = resolveSkill({ skill: c4 }, baseState(), miss);
    expect(missed.ok).toBe(true);
    if (!missed.ok) return;
    expect(missed.damageDealt).toBe(0);
    expect(missed.state.marks.some((m) => m.id === C4_MARK_ID)).toBe(true);
  });
});

describe('T-131 opportunity', () => {
  it('fires 35 TRUE and consumes; unarmed 0; strip removes without firing', () => {
    const planted = resolveSkill({ skill: c4 }, baseState(), hit);
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;

    const fired = resolveC4AtEnemyOpportunity(planted.state.marks);
    expect(fired.trueDamage).toBe(C4_TRUE_DAMAGE);
    expect(fired.fired).toBe(true);
    expect(fired.marks.some((m) => m.id === C4_MARK_ID)).toBe(false);

    const bare = resolveC4AtEnemyOpportunity([]);
    expect(bare.trueDamage).toBe(0);
    expect(bare.fired).toBe(false);

    const stripped = stripC4(planted.state.marks);
    expect(stripped.stripped).toBe(true);
    expect(stripped.marks.some((m) => m.id === C4_MARK_ID)).toBe(false);
    const afterStrip = resolveC4AtEnemyOpportunity(stripped.marks);
    expect(afterStrip.trueDamage).toBe(0);
    expect(afterStrip.fired).toBe(false);

    const emptyStrip = stripC4([]);
    expect(emptyStrip.stripped).toBe(false);
  });
});
