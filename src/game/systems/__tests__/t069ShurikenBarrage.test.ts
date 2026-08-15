/**
 * T-069 AC: Shuriken Barrage — SIDE 3×3 M/L; on hit next ATTACK +10% Setup.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatActor,
  CombatRange,
  MarkConsumeTiming,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const barrage = SKILLS.SHURIKEN_BARRAGE;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [barrage],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: barrage.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

const nextAttack = createMockSkill({
  id: 'smash',
  cardRole: CardRole.ATTACK,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  attackMethod: AttackMethod.MELEE,
  allowedRanges: [CombatRange.CLOSE],
  currentCooldown: 0,
});

describe('T-069 authoring', () => {
  it('declares SIDE AP2 CP1 CD2 3×3 M/L + barrage_setup, not a single 6', () => {
    expect(barrage.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(barrage.apCost).toBe(2);
    expect(barrage.chakraCost).toBe(1);
    expect(barrage.cooldown).toBe(2);
    expect(barrage.hpCost).toBe(0);
    expect(barrage.baseDamage).toBe(3);
    expect(barrage.hitCount).toBe(3);
    expect(barrage.baseDamage).not.toBe(6);
    expect(barrage.attackMethod).toBe(AttackMethod.RANGED);
    expect(barrage.allowedRanges).toEqual([CombatRange.MEDIUM, CombatRange.LONG]);
    expect(barrage.tags).toEqual(
      expect.arrayContaining([
        SkillTag.TOOL,
        SkillTag.WEAPON,
        SkillTag.PHYSICAL,
        SkillTag.MULTI_HIT,
      ]),
    );
    expect(barrage.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'barrage_setup',
          duration: 2,
          stacks: 1,
          consume: MarkConsumeTiming.ATTEMPT,
          targetActor: 'self',
          requireHit: true,
        }),
      ]),
    );
  });
});

describe('T-069 multi plant', () => {
  it('lands 3 hits for 9 and plants setup once; miss plants nothing; CLOSE rejects', () => {
    const result = resolveSkill({ skill: barrage }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(3);
    expect(result.damageDealt).toBe(9);
    const mark = result.state.marks.find((m) => m.id === 'barrage_setup');
    expect(mark?.duration).toBe(2);
    expect(mark?.stacks).toBe(1);
    expect(mark?.target).toBe(CombatActor.PLAYER);
    expect(mark?.consume).toBe(MarkConsumeTiming.ATTEMPT);

    const whiff = resolveSkill({ skill: barrage }, baseState(), miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.hitsLanded).toBe(0);
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.marks.some((m) => m.id === 'barrage_setup')).toBe(false);

    const close = resolveSkill(
      { skill: barrage },
      baseState({ range: CombatRange.CLOSE }),
      hit,
    );
    expect(close.ok).toBe(false);
  });
});

describe('T-069 setup', () => {
  it('multiplies the next ATTACK by 1.1 and consumes; SIDE does not consume', () => {
    const planted = resolveSkill({ skill: barrage }, baseState(), hit);
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;

    const slash = SKILLS.KUNAI_SLASH;
    const sideAgain = resolveSkill(
      { skill: slash },
      { ...planted.state, range: CombatRange.CLOSE, skills: [slash] },
      { rollHit: () => ({ hit: true, damage: slash.baseDamage }) },
    );
    expect(sideAgain.ok).toBe(true);
    if (!sideAgain.ok) return;
    expect(sideAgain.state.marks.some((m) => m.id === 'barrage_setup')).toBe(true);

    const boosted = resolveSkill(
      { skill: nextAttack },
      { ...sideAgain.state, range: CombatRange.CLOSE, skills: [nextAttack] },
      { rollHit: () => ({ hit: true, damage: 10 }) },
    );
    expect(boosted.ok).toBe(true);
    if (!boosted.ok) return;
    expect(boosted.damageDealt).toBe(11);
    expect(boosted.state.marks.find((m) => m.id === 'barrage_setup')).toBeUndefined();
  });
});
