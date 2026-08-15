/**
 * T-066 AC: Flash Bomb SUPPORT — enemy Blinded 1 (−2 ACC).
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  PrimaryStat,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const flash = SKILLS.FLASH_BOMB;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [flash],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

describe('T-066 authoring', () => {
  it('declares SUPPORT AP1 CP0 CD4 + enemy blinded 1/2 and not ACC −0.4@0.5', () => {
    expect(flash.cardRole).toBe(CardRole.SUPPORT);
    expect(flash.apCost).toBe(1);
    expect(flash.chakraCost).toBe(0);
    expect(flash.cooldown).toBe(4);
    expect(flash.hpCost).toBe(0);
    expect(flash.baseDamage).toBe(0);
    expect(flash.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'blinded',
          duration: 1,
          stacks: 2,
          family: MarkFamily.STAT,
          targetActor: 'enemy',
        }),
      ]),
    );
    expect(
      flash.effects?.some(
        (e) =>
          e.type === EffectType.DEBUFF &&
          e.targetStat === PrimaryStat.ACCURACY &&
          e.value === 0.4 &&
          e.chance === 0.5,
      ),
    ).toBeFalsy();
  });
});

describe('T-066 plant', () => {
  it('plants enemy blinded duration 1 stacks 2 with no damage', () => {
    const result = resolveSkill({ skill: flash }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    const mark = result.state.marks.find((m) => m.id === 'blinded');
    expect(mark?.target).toBe(CombatActor.ENEMY);
    expect(mark?.family).toBe(MarkFamily.STAT);
    expect(mark?.stacks).toBe(2);
    expect(mark?.duration).toBe(1);
    expect(result.state.marks.some((m) => m.id === 'brace_shield')).toBe(false);
    expect(result.state.marks.some((m) => m.id === 'smoke')).toBe(false);
  });
});

describe('T-066 costs', () => {
  it('pays AP1, leaves CP, and sets readyOnTurn to T+CD+1', () => {
    const result = resolveSkill({ skill: flash }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.pools.ap).toBe(5);
    expect(result.state.pools.chakra).toBe(20);
    const used = result.state.skills.find((s) => s.id === flash.id);
    expect(used?.readyOnTurn).toBe(7);
  });
});
