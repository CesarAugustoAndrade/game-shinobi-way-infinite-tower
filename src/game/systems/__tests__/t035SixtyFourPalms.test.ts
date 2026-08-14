/**
 * T-035 AC: 64 Palms — 8×3; Byakugan + ≥2 CP → +10%/stack cap 40%, 1 charge, impact consume.
 *
 * Scale is floor on total: Math.floor(8 * 3 * (1 + min(0.4, 0.1 * S))).
 * Penetration 30% is identity vs 0% def (same as T-022).
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatActor, CombatRange, MarkConsumeTiming, ModeRuntimeState } from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const palms = SKILLS.SIXTY_FOUR_PALMS;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 8, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [palms],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const byakuganOn = {
  instances: [
    {
      id: 'byakugan',
      family: MODE_FAMILY.HYUGA,
      charges: 4,
      state: ModeRuntimeState.ON,
    },
  ],
};

function cpMark(stacks: number) {
  return {
    id: 'chakra_point',
    sourceSkillId: 'air_palm',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 2,
    stacks,
    consume: MarkConsumeTiming.IMPACT,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: palms.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };
const baseline = palms.baseDamage * (palms.hitCount ?? 1);

describe('T-035 authoring', () => {
  it('declares ATTACK 8×3 CLOSE + Byakugan CP stack enhance', () => {
    expect(palms.cardRole).toBe(CardRole.ATTACK);
    expect(palms.hitCount).toBe(8);
    expect(palms.baseDamage).toBe(3);
    expect(palms.apCost).toBe(4);
    expect(palms.chakraCost).toBe(7);
    expect(palms.cooldown).toBe(5);
    expect(palms.penetration).toBe(0.3);
    expect(palms.allowedRanges).toEqual([CombatRange.CLOSE]);
    expect(palms.modeInteraction).toEqual(
      expect.objectContaining({
        modeId: 'byakugan',
        family: MODE_FAMILY.HYUGA,
        consumeCharges: 1,
        requireMarkId: 'chakra_point',
        minMarkStacks: 2,
        damagePerMarkStackBonus: 0.1,
        damageMarkStackCap: 0.4,
      }),
    );
    expect(palms.modeInteraction?.requireOn).toBeFalsy();
    expect(palms.modeInteraction?.damageMultBonus).toBeUndefined();
  });
});

describe('T-035 base', () => {
  it('deals 24 with no Mode or with only 1 CP and spends nothing', () => {
    const off = resolveSkill({ skill: palms }, baseState(), hit);
    expect(off.ok).toBe(true);
    if (!off.ok) return;
    expect(off.hitsLanded).toBe(8);
    expect(off.damageDealt).toBe(24);

    const one = resolveSkill(
      { skill: palms },
      baseState({ modes: byakuganOn, marks: [cpMark(1)] }),
      hit,
    );
    expect(one.ok).toBe(true);
    if (!one.ok) return;
    expect(one.damageDealt).toBe(baseline);
    expect(one.state.modes.instances.find((m) => m.id === 'byakugan')?.charges).toBe(4);
  });
});

describe('T-035 enhance', () => {
  it('applies +30% on 3 stacks, spends 1 charge, and clears CP', () => {
    const result = resolveSkill(
      { skill: palms },
      baseState({ modes: byakuganOn, marks: [cpMark(3)] }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(8);
    expect(result.damageDealt).toBe(Math.floor(24 * 1.3));
    expect(result.state.modes.instances.find((m) => m.id === 'byakugan')?.charges).toBe(3);
    expect(result.state.marks.find((m) => m.id === 'chakra_point')).toBeUndefined();
  });
});

describe('T-035 miss keep', () => {
  it('spends the charge at attempt but keeps CP on a full miss', () => {
    const result = resolveSkill(
      { skill: palms },
      baseState({ modes: byakuganOn, marks: [cpMark(3)] }),
      miss,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(0);
    expect(result.damageDealt).toBe(0);
    expect(result.state.marks.some((m) => m.id === 'chakra_point')).toBe(true);
    expect(result.state.modes.instances.find((m) => m.id === 'byakugan')?.charges).toBe(3);
  });
});
