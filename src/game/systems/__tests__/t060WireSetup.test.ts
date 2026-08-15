/**
 * T-060 AC: Wire Trap SUPPORT — plant enemy trap; next ATTACK +20% + Bleed 5×2 consume.
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
  PrimaryStat,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const trap = SKILLS.WIRE_SETUP;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [trap],
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

const hit = (skill: { baseDamage: number }) => ({
  rollHit: () => ({ hit: true, damage: skill.baseDamage }),
});
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-060 authoring', () => {
  it('declares SUPPORT AP1 CP1 CD4 + enemy wire_trap 2 IMPACT', () => {
    expect(trap.cardRole).toBe(CardRole.SUPPORT);
    expect(trap.apCost).toBe(1);
    expect(trap.chakraCost).toBe(1);
    expect(trap.cooldown).toBe(4);
    expect(trap.hpCost).toBe(0);
    expect(trap.baseDamage).toBe(0);
    expect(trap.tags).toEqual(
      expect.arrayContaining([SkillTag.TOOL, SkillTag.WEAPON, SkillTag.MARK]),
    );
    expect(trap.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'wire_trap',
          duration: 2,
          stacks: 1,
          consume: MarkConsumeTiming.IMPACT,
          family: MarkFamily.STAT,
          targetActor: 'enemy',
        }),
      ]),
    );
    expect(
      trap.effects?.some(
        (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.STRENGTH && e.value === 0.2,
      ),
    ).toBeFalsy();
    expect(
      trap.effects?.some((e) => e.type === EffectType.BLEED && e.chance === 0.4),
    ).toBeFalsy();
    expect(trap.stanceShift).toBeUndefined();
  });
});

describe('T-060 plant', () => {
  it('plants enemy Wire Trap 2 with no bleed and no damage', () => {
    const result = resolveSkill({ skill: trap }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    const mark = result.state.marks.find((m) => m.id === 'wire_trap');
    expect(mark?.target).toBe(CombatActor.ENEMY);
    expect(mark?.duration).toBe(2);
    expect(mark?.stacks).toBe(1);
    expect(result.state.marks.some((m) => m.id === 'bleed')).toBe(false);
  });
});

describe('T-060 payoff', () => {
  it('boosts ATTACK 10→12, plants Bleed 5×2, and consumes the trap', () => {
    const planted = resolveSkill({ skill: trap }, baseState());
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    const armed = resolveSkill({ skill: nextAttack }, planted.state, hit(nextAttack));
    expect(armed.ok).toBe(true);
    if (!armed.ok) return;
    expect(armed.damageDealt).toBe(12);
    expect(armed.state.marks.some((m) => m.id === 'wire_trap')).toBe(false);
    const bleed = armed.state.marks.find((m) => m.id === 'bleed');
    expect(bleed?.target).toBe(CombatActor.ENEMY);
    expect(bleed?.stacks).toBe(5);
    expect(bleed?.duration).toBe(2);
    expect(bleed?.family).toBe(MarkFamily.DOT);
  });

  it('leaves the trap and plants no bleed on a full ATTACK miss', () => {
    const planted = resolveSkill({ skill: trap }, baseState());
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    const whiff = resolveSkill({ skill: nextAttack }, planted.state, miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.marks.some((m) => m.id === 'wire_trap')).toBe(true);
    expect(whiff.state.marks.some((m) => m.id === 'bleed')).toBe(false);
  });

  it('does not trigger on a SIDE hit', () => {
    const planted = resolveSkill({ skill: trap }, baseState());
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    const side = resolveSkill({ skill: nextSide }, planted.state, hit(nextSide));
    expect(side.ok).toBe(true);
    if (!side.ok) return;
    expect(side.damageDealt).toBe(10);
    expect(side.state.marks.some((m) => m.id === 'wire_trap')).toBe(true);
    expect(side.state.marks.some((m) => m.id === 'bleed')).toBe(false);
  });
});
