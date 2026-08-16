/**
 * T-076 AC: Sand Shield SUPPORT — Shield 45 absorb until depleted.
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

const shield = SKILLS.SAND_SHIELD;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [shield],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

describe('T-076 authoring', () => {
  it('declares SUPPORT AP1 CP5 CD3 + self Shield 45 and not SHIELD 80×2', () => {
    expect(shield.cardRole).toBe(CardRole.SUPPORT);
    expect(shield.apCost).toBe(1);
    expect(shield.chakraCost).toBe(5);
    expect(shield.cooldown).toBe(3);
    expect(shield.hpCost).toBe(0);
    expect(shield.baseDamage).toBe(0);
    expect(shield.stanceShift).toBeUndefined();
    expect(shield.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.EARTH]));
    expect(shield.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'sand_shield',
          duration: 99,
          stacks: 45,
          family: MarkFamily.SHIELD,
          targetActor: 'self',
        }),
      ]),
    );
    expect(
      shield.effects?.some((e) => e.type === EffectType.SHIELD && e.value === 80 && e.duration === 2),
    ).toBeFalsy();
  });
});

describe('T-076 plant', () => {
  it('plants self Shield 45 with no damage', () => {
    const result = resolveSkill({ skill: shield }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    const mark = result.state.marks.find((m) => m.id === 'sand_shield');
    expect(mark?.target).toBe(CombatActor.PLAYER);
    expect(mark?.family).toBe(MarkFamily.SHIELD);
    expect(mark?.stacks).toBe(45);
    expect(mark?.duration).toBe(99);
    expect(result.state.marks.some((m) => m.target === CombatActor.ENEMY)).toBe(false);
  });
});

describe('T-076 costs', () => {
  it('pays AP1 CP5 and sets readyOnTurn to T+CD+1', () => {
    const result = resolveSkill({ skill: shield }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.pools.ap).toBe(5);
    expect(result.state.pools.chakra).toBe(15);
    const used = result.state.skills.find((s) => s.id === shield.id);
    expect(used?.readyOnTurn).toBe(6);
  });
});
