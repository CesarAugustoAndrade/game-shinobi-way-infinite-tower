/**
 * T-039 AC: Sharingan Predict — require Sharingan ON, Read Window −30, restore 1 no overcap.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  ModeRuntimeState,
  PrimaryStat,
} from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { applyReadWindowOutgoing } from '../MarkSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const predict = SKILLS.SHARINGAN_PREDICT;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [predict],
    playerBuffs: [],
    enemyHp: 50,
    ...overrides,
  };
}

function sharinganOn(id: 'sharingan_2' | 'sharingan_3', charges: number) {
  return {
    instances: [
      {
        id,
        family: MODE_FAMILY.SHARINGAN,
        charges,
        state: ModeRuntimeState.ON,
      },
    ],
  };
}

describe('T-039 authoring', () => {
  it('declares SUPPORT require Sharingan + restore 1 + Read Window −30', () => {
    expect(predict.cardRole).toBe(CardRole.SUPPORT);
    expect(predict.apCost).toBe(1);
    expect(predict.chakraCost).toBe(3);
    expect(predict.cooldown).toBe(3);
    expect(predict.baseDamage).toBe(0);
    expect(predict.modeInteraction).toEqual(
      expect.objectContaining({
        family: MODE_FAMILY.SHARINGAN,
        requireFamily: MODE_FAMILY.SHARINGAN,
        requireOn: true,
        restoreCharges: 1,
      }),
    );
    expect(predict.modeInteraction?.consumeCharges).toBeUndefined();
    expect(predict.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'read_window',
          duration: 1,
          stacks: 30,
          family: MarkFamily.STAT,
          targetActor: 'enemy',
        }),
      ]),
    );
    expect(
      predict.effects?.some(
        (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.SPEED && e.value === 0.25,
      ),
    ).toBeFalsy();
  });
});

describe('T-039 require', () => {
  it('rejects without Sharingan and consumes nothing', () => {
    const start = baseState();
    const result = resolveSkill({ skill: predict }, start);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('mode-required');
    expect(result.state.pools).toEqual(start.pools);
    expect(result.state.marks).toHaveLength(0);
    expect(result.state.modes.instances).toHaveLength(0);
  });
});

describe('T-039 restore cap', () => {
  it('restores 1 charge, plants Read Window, and does not overcap', () => {
    const low = resolveSkill(
      { skill: predict },
      baseState({ modes: sharinganOn('sharingan_2', 1) }),
    );
    expect(low.ok).toBe(true);
    if (!low.ok) return;
    expect(low.damageDealt).toBe(0);
    expect(low.state.modes.instances.find((m) => m.id === 'sharingan_2')?.charges).toBe(2);
    const window = low.state.marks.find((m) => m.id === 'read_window');
    expect(window?.duration).toBe(1);
    expect(window?.stacks).toBe(30);
    expect(window?.target).toBe(CombatActor.ENEMY);

    const full = resolveSkill(
      { skill: predict },
      baseState({ modes: sharinganOn('sharingan_2', 3) }),
    );
    expect(full.ok).toBe(true);
    if (!full.ok) return;
    expect(full.state.modes.instances.find((m) => m.id === 'sharingan_2')?.charges).toBe(3);
    expect(full.state.marks.some((m) => m.id === 'read_window')).toBe(true);

    const three = resolveSkill(
      { skill: predict },
      baseState({ modes: sharinganOn('sharingan_3', 1) }),
    );
    expect(three.ok).toBe(true);
    if (!three.ok) return;
    expect(three.state.modes.instances.find((m) => m.id === 'sharingan_3')?.charges).toBe(2);

    const cut = applyReadWindowOutgoing(40, low.state.marks);
    expect(cut.damage).toBe(10);
    expect(cut.consumed).toBe(true);
  });
});
