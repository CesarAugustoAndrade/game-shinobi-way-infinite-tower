/**
 * T-092 AC: Water Clone — SIDE 11 C/M; on hit Shield 15; no clone charges.
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
  SkillTag,
} from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const clone = SKILLS.WATER_CLONE;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [clone],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

function clonesOn(charges: number) {
  return {
    instances: [
      {
        id: 'shadow_clone',
        family: MODE_FAMILY.CLONES,
        charges,
        state: ModeRuntimeState.ON,
      },
    ],
  };
}

const hit = { rollHit: () => ({ hit: true, damage: clone.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-092 authoring', () => {
  it('declares SIDE 11 CLOSE·MEDIUM + self Shield 15 and no clone Mode', () => {
    expect(clone.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(clone.apCost).toBe(2);
    expect(clone.chakraCost).toBe(6);
    expect(clone.cooldown).toBe(4);
    expect(clone.hpCost).toBe(0);
    expect(clone.baseDamage).toBe(11);
    expect(clone.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.CLOSE, CombatRange.MEDIUM]),
    );
    expect(clone.modeInteraction).toBeUndefined();
    expect(clone.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.WATER]));
    expect(clone.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'water_clone_shield',
          duration: 99,
          stacks: 15,
          family: MarkFamily.SHIELD,
          targetActor: 'self',
          requireHit: true,
        }),
      ]),
    );
    expect(
      clone.effects?.some(
        (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.STRENGTH && e.value === 0.4,
      ),
    ).toBeFalsy();
  });
});

describe('T-092 hit shield', () => {
  it('deals 11, plants Shield 15, and leaves clone charges at 3', () => {
    const result = resolveSkill(
      { skill: clone },
      baseState({ modes: clonesOn(3) }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(11);
    const shield = result.state.marks.find((m) => m.id === 'water_clone_shield');
    expect(shield?.target).toBe(CombatActor.PLAYER);
    expect(shield?.family).toBe(MarkFamily.SHIELD);
    expect(shield?.stacks).toBe(15);
    expect(shield?.duration).toBe(99);
    const mode = result.state.modes.instances.find((m) => m.id === 'shadow_clone');
    expect(mode?.charges).toBe(3);
    expect(mode?.state).toBe(ModeRuntimeState.ON);
  });
});

describe('T-092 miss', () => {
  it('plants no shield on 0 hits', () => {
    const result = resolveSkill({ skill: clone }, baseState(), miss);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(0);
    expect(result.damageDealt).toBe(0);
    expect(result.state.marks.some((m) => m.id === 'water_clone_shield')).toBe(false);
  });
});
