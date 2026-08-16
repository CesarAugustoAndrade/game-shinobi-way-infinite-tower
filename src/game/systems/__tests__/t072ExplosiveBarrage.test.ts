/**
 * T-072 AC: Explosive Barrage — SIDE 3×5 M/L; Exposed 2 → next ranged ATTACK ×1.15.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  ElementType,
  MarkConsumeTiming,
  PrimaryStat,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const barrage = SKILLS.EXPLOSIVE_BARRAGE;

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

const rangedAttack = createMockSkill({
  id: 'fire_atk',
  cardRole: CardRole.ATTACK,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  attackMethod: AttackMethod.RANGED,
  allowedRanges: [CombatRange.MEDIUM, CombatRange.LONG],
  currentCooldown: 0,
});

const meleeAttack = createMockSkill({
  id: 'smash',
  cardRole: CardRole.ATTACK,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  attackMethod: AttackMethod.MELEE,
  allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM],
  currentCooldown: 0,
});

describe('T-072 authoring', () => {
  it('declares SIDE AP2 CP3 CD4 3×5 M/L + exposed 2 and not SPEED −0.2 / single 13', () => {
    expect(barrage.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(barrage.apCost).toBe(2);
    expect(barrage.chakraCost).toBe(3);
    expect(barrage.cooldown).toBe(4);
    expect(barrage.hpCost).toBe(0);
    expect(barrage.baseDamage).toBe(5);
    expect(barrage.hitCount).toBe(3);
    expect(barrage.element).toBe(ElementType.FIRE);
    expect(barrage.attackMethod).toBe(AttackMethod.RANGED);
    expect(barrage.allowedRanges).toEqual([CombatRange.MEDIUM, CombatRange.LONG]);
    expect(barrage.tags).toEqual(
      expect.arrayContaining([SkillTag.TOOL, SkillTag.FIRE, SkillTag.MULTI_HIT]),
    );
    expect(barrage.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'exposed',
          duration: 2,
          stacks: 1,
          consume: MarkConsumeTiming.ATTEMPT,
          targetActor: 'self',
          requireHit: true,
        }),
      ]),
    );
    expect(
      barrage.effects?.some(
        (e) =>
          e.type === EffectType.DEBUFF &&
          e.targetStat === PrimaryStat.SPEED &&
          e.value === 0.2,
      ),
    ).toBeFalsy();
  });
});

describe('T-072 multi plant', () => {
  it('lands 3 hits for 15 and plants Exposed once; miss plants nothing; CLOSE rejects', () => {
    const result = resolveSkill({ skill: barrage }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(3);
    expect(result.damageDealt).toBe(15);
    const mark = result.state.marks.find((m) => m.id === 'exposed');
    expect(mark?.duration).toBe(2);
    expect(mark?.stacks).toBe(1);
    expect(mark?.target).toBe(CombatActor.PLAYER);
    expect(mark?.consume).toBe(MarkConsumeTiming.ATTEMPT);

    const whiff = resolveSkill({ skill: barrage }, baseState(), miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.hitsLanded).toBe(0);
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.marks.some((m) => m.id === 'exposed')).toBe(false);

    const close = resolveSkill(
      { skill: barrage },
      baseState({ range: CombatRange.CLOSE }),
      hit,
    );
    expect(close.ok).toBe(false);
  });
});

describe('T-072 exposed', () => {
  it('gives RANGED ATTACK ×1.15, MELEE stays 10 and still consumes, SIDE does not consume', () => {
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
    expect(sideAgain.state.marks.some((m) => m.id === 'exposed')).toBe(true);

    const melee = resolveSkill(
      { skill: meleeAttack },
      { ...sideAgain.state, range: CombatRange.MEDIUM, skills: [meleeAttack] },
      { rollHit: () => ({ hit: true, damage: 10 }) },
    );
    expect(melee.ok).toBe(true);
    if (!melee.ok) return;
    expect(melee.damageDealt).toBe(10);
    expect(melee.state.marks.find((m) => m.id === 'exposed')).toBeUndefined();

    const plantedAgain = resolveSkill({ skill: barrage }, baseState(), hit);
    expect(plantedAgain.ok).toBe(true);
    if (!plantedAgain.ok) return;
    const ranged = resolveSkill(
      { skill: rangedAttack },
      { ...plantedAgain.state, skills: [rangedAttack] },
      { rollHit: () => ({ hit: true, damage: 10 }) },
    );
    expect(ranged.ok).toBe(true);
    if (!ranged.ok) return;
    expect(ranged.damageDealt).toBe(11);
    expect(ranged.state.marks.find((m) => m.id === 'exposed')).toBeUndefined();
  });
});
