/**
 * T-064 AC: Mud Wall SUPPORT — Shield 35 absorb + Defensive stanceShift.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  Posture,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const wall = SKILLS.MUD_WALL;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [wall],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

describe('T-064 authoring', () => {
  it('declares SUPPORT AP1 CP4 CD4 + self Shield 35 and not SHIELD 40×3', () => {
    expect(wall.cardRole).toBe(CardRole.SUPPORT);
    expect(wall.apCost).toBe(1);
    expect(wall.chakraCost).toBe(4);
    expect(wall.cooldown).toBe(4);
    expect(wall.hpCost).toBe(0);
    expect(wall.baseDamage).toBe(0);
    expect(wall.stanceShift).toBe(Posture.DEFENSIVE);
    expect(wall.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.EARTH]));
    expect(wall.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'mud_wall_shield',
          duration: 99,
          stacks: 35,
          family: MarkFamily.SHIELD,
          targetActor: 'self',
        }),
      ]),
    );
    expect(
      wall.effects?.some((e) => e.type === EffectType.SHIELD && e.value === 40 && e.duration === 3),
    ).toBeFalsy();
  });
});

describe('T-064 plant', () => {
  it('plants self Shield 35 with no damage', () => {
    const result = resolveSkill({ skill: wall }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    const mark = result.state.marks.find((m) => m.id === 'mud_wall_shield');
    expect(mark?.target).toBe(CombatActor.PLAYER);
    expect(mark?.family).toBe(MarkFamily.SHIELD);
    expect(mark?.stacks).toBe(35);
    expect(mark?.duration).toBe(99);
    expect(result.state.marks.some((m) => m.target === CombatActor.ENEMY)).toBe(false);
  });
});

describe('T-064 costs', () => {
  it('pays AP1 CP4 and sets readyOnTurn to T+CD+1', () => {
    const result = resolveSkill({ skill: wall }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.pools.ap).toBe(5);
    expect(result.state.pools.chakra).toBe(16);
    const used = result.state.skills.find((s) => s.id === wall.id);
    expect(used?.readyOnTurn).toBe(7);
  });
});
