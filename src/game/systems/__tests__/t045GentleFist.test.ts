/**
 * T-045 AC: Gentle Fist — ATTACK 12 CLOSE; Byakugan +40%/1 charge; ≤2 CP +10% + drain 4.
 *
 * Charge at attempt. CP consume only on ≥1 hit, independent of Mode.
 * Order: Mode then CP. floor(12 * 1.4) = 16; floor(12 * 1.2) = 14.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkConsumeTiming,
  ModeRuntimeState,
} from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const fist = SKILLS.GENTLE_FIST;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [fist],
    playerBuffs: [],
    enemyHp: 80,
    enemyChakra: 20,
    ...overrides,
  };
}

const byakuganOn = {
  instances: [
    { id: 'byakugan', family: MODE_FAMILY.HYUGA, charges: 3, state: ModeRuntimeState.ON },
  ],
};

const cpStacks = (stacks: number) => [
  {
    id: 'chakra_point',
    sourceSkillId: 'air_palm',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 2,
    stacks,
    consume: MarkConsumeTiming.IMPACT,
  },
];

const hit = { rollHit: () => ({ hit: true, damage: fist.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-045 authoring', () => {
  it('declares ATTACK 12 CLOSE + Byakugan +40% + partial CP impact', () => {
    expect(fist.cardRole).toBe(CardRole.ATTACK);
    expect(fist.apCost).toBe(2);
    expect(fist.chakraCost).toBe(4);
    expect(fist.cooldown).toBe(2);
    expect(fist.hpCost).toBe(0);
    expect(fist.baseDamage).toBe(12);
    expect(fist.allowedRanges).toEqual([CombatRange.CLOSE]);
    expect(fist.modeInteraction).toEqual(
      expect.objectContaining({
        modeId: 'byakugan',
        family: MODE_FAMILY.HYUGA,
        consumeCharges: 1,
        damageMultBonus: 0.4,
      }),
    );
    expect(fist.modeInteraction?.requireOn).toBeUndefined();
    expect(fist.modeInteraction?.consumeAllMatchingMarks).toBeUndefined();
    expect(fist.impactMarkConsume).toEqual({
      markId: 'chakra_point',
      maxStacks: 2,
      damageMultPerStack: 0.1,
      drainChakraPerStack: 4,
    });
    expect(fist.effects?.some((e) => e.type === EffectType.CHAKRA_DRAIN && e.value === 20)).toBeFalsy();
  });
});

describe('T-045 mode', () => {
  it('spends 1 Byakugan charge at attempt and deals floor(12 * 1.4)', () => {
    const result = resolveSkill({ skill: fist }, baseState({ modes: byakuganOn }), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(16);
    expect(result.state.modes.instances.find((m) => m.id === 'byakugan')?.charges).toBe(2);

    const base = resolveSkill({ skill: fist }, baseState(), hit);
    expect(base.ok).toBe(true);
    if (!base.ok) return;
    expect(base.damageDealt).toBe(12);
    expect(base.state.modes.instances).toHaveLength(0);

    const whiff = resolveSkill({ skill: fist }, baseState({ modes: byakuganOn }), miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.modes.instances.find((m) => m.id === 'byakugan')?.charges).toBe(2);
  });
});

describe('T-045 cp impact', () => {
  it('consumes at most 2 CP on hit with +10% each and drain 4; miss keeps stacks', () => {
    const landed = resolveSkill(
      { skill: fist },
      baseState({ marks: cpStacks(3), enemyChakra: 20 }),
      hit,
    );
    expect(landed.ok).toBe(true);
    if (!landed.ok) return;
    expect(landed.damageDealt).toBe(14);
    expect(landed.state.marks.find((m) => m.id === 'chakra_point')?.stacks).toBe(1);
    expect(landed.state.enemyChakra).toBe(12);

    const whiff = resolveSkill(
      { skill: fist },
      baseState({ marks: cpStacks(3), enemyChakra: 20 }),
      miss,
    );
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.marks.find((m) => m.id === 'chakra_point')?.stacks).toBe(3);
    expect(whiff.state.enemyChakra).toBe(20);

    const combo = resolveSkill(
      { skill: fist },
      baseState({ modes: byakuganOn, marks: cpStacks(2) }),
      hit,
    );
    expect(combo.ok).toBe(true);
    if (!combo.ok) return;
    expect(combo.damageDealt).toBe(20);
  });
});
