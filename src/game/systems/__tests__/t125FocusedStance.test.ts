/**
 * T-125 AC: Focused Stance SUPPORT — Balanced shift; Focused 2 = +20 crit next ATTACK.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkConsumeTiming,
  MarkFamily,
  Posture,
  PrimaryStat,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { stanceShiftFromSkill } from '../PostureSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const stance = SKILLS.FOCUSED_STANCE;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [stance],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const nextAttack = createMockSkill({
  id: 'next_attack',
  cardRole: CardRole.ATTACK,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  hitCount: 1,
  attackMethod: AttackMethod.MELEE,
  allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
});

const nextSide = createMockSkill({
  id: 'next_side',
  cardRole: CardRole.SIDE_ATTACK,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  hitCount: 1,
  attackMethod: AttackMethod.MELEE,
  allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
});

const hit = { rollHit: () => ({ hit: true, damage: 10 }) };

describe('T-125 authoring', () => {
  it('declares SUPPORT ACTIVE AP1 CP3 CD5 Balanced + Focused 2, not TOGGLE', () => {
    expect(stance.id).toBe('focused_stance');
    expect(stance.cardRole).toBe(CardRole.SUPPORT);
    expect(stance.actionType).toBe(ActionType.ACTIVE);
    expect(stance.apCost).toBe(1);
    expect(stance.chakraCost).toBe(3);
    expect(stance.cooldown).toBe(5);
    expect(stance.hpCost).toBe(0);
    expect(stance.baseDamage).toBe(0);
    expect(stance.stanceShift).toBe(Posture.BALANCED);
    expect(stanceShiftFromSkill(stance)).toBe(Posture.BALANCED);
    expect(stance.isToggle).toBeFalsy();
    expect(stance.upkeepCost).toBeUndefined();
    expect(stance.modeInteraction).toBeUndefined();
    expect(stance.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'focused',
          duration: 2,
          stacks: 1,
          consume: MarkConsumeTiming.ATTEMPT,
          family: MarkFamily.STAT,
          targetActor: 'self',
        }),
      ]),
    );
    expect(
      stance.effects?.some(
        (e) =>
          e.type === EffectType.BUFF &&
          (e.targetStat === PrimaryStat.ACCURACY || e.targetStat === PrimaryStat.DEXTERITY),
      ),
    ).toBeFalsy();
  });
});

describe('T-125 plant', () => {
  it('plants self Focused 2 with no damage', () => {
    const result = resolveSkill({ skill: stance }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.pools.ap).toBe(5);
    expect(result.state.pools.chakra).toBe(17);
    const mark = result.state.marks.find((m) => m.id === 'focused');
    expect(mark?.target).toBe(CombatActor.PLAYER);
    expect(mark?.duration).toBe(2);
    expect(mark?.stacks).toBe(1);
    expect(mark?.consume).toBe(MarkConsumeTiming.ATTEMPT);
  });
});

describe('T-125 crit', () => {
  it('consumes Focused on ATTACK with +20 crit stacks; SIDE does not', () => {
    const planted = resolveSkill({ skill: stance }, baseState());
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;

    const armed = resolveSkill({ skill: nextAttack }, planted.state, hit);
    expect(armed.ok).toBe(true);
    if (!armed.ok) return;
    expect(armed.attemptSpent.some((m) => m.id === 'focused')).toBe(true);
    expect(armed.state.marks.some((m) => m.id === 'focused')).toBe(false);
    expect(armed.damageDealt).toBe(10);

    const side = resolveSkill({ skill: nextSide }, planted.state, hit);
    expect(side.ok).toBe(true);
    if (!side.ok) return;
    expect(side.state.marks.some((m) => m.id === 'focused')).toBe(true);
    expect(side.attemptSpent.some((m) => m.id === 'focused')).toBe(false);

    const clean = resolveSkill({ skill: nextAttack }, baseState({ skills: [nextAttack] }), hit);
    expect(clean.ok).toBe(true);
    if (!clean.ok) return;
    expect(clean.attemptSpent.some((m) => m.id === 'focused')).toBe(false);
    expect(clean.damageDealt).toBe(10);
  });
});
