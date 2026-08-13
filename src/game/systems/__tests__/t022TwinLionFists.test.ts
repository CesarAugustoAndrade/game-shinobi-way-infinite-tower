/**
 * T-022 AC: Twin Lion Byakugan+CP → +50% / consume on hit; miss keeps CP; base without setup.
 *
 * Scale is floor on **total** (same as T-018): Math.floor(base * hitCount * 1.5).
 * Penetration 30% is wired vs 0% def (identity) so AC1 stays 1.5×.
 */

import { describe, it, expect } from 'vitest';
import { CombatActor, CombatRange, MarkConsumeTiming, ModeRuntimeState } from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const lions = SKILLS.TWIN_LION_FISTS;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [lions],
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
      charges: 3,
      state: ModeRuntimeState.ON,
    },
  ],
};

const cpMark = {
  id: 'chakra_point',
  sourceSkillId: 'air_palm',
  owner: CombatActor.PLAYER,
  target: CombatActor.ENEMY,
  duration: 2,
  stacks: 1,
  consume: MarkConsumeTiming.IMPACT,
};

const alwaysHit = { rollHit: () => ({ hit: true, damage: lions.baseDamage }) };
const alwaysMiss = { rollHit: () => ({ hit: false, damage: 0 }) };
const baseline = lions.baseDamage * (lions.hitCount ?? 1);

describe('T-022 enhance', () => {
  it('deals 1.5× base, consumes CP, and does not spend Byakugan', () => {
    expect(lions.hitCount).toBe(2);
    expect(lions.penetration).toBe(0.3);
    expect(lions.markEffects).toBeUndefined();
    expect(lions.modeInteraction).toEqual(
      expect.objectContaining({
        modeId: 'byakugan',
        requireMarkId: 'chakra_point',
        damageMultBonus: 0.5,
      }),
    );
    expect(lions.modeInteraction?.requireOn).toBeUndefined();

    const result = resolveSkill(
      { skill: lions },
      baseState({ modes: byakuganOn, marks: [cpMark] }),
      alwaysHit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(2);
    expect(result.damageDealt).toBe(Math.floor(baseline * 1.5));
    expect(result.state.marks.find((m) => m.id === 'chakra_point')).toBeUndefined();
    expect(result.state.modes.instances.find((m) => m.id === 'byakugan')?.charges).toBe(3);
  });
});

describe('T-022 miss keep', () => {
  it('keeps CP on a full miss and deals 0', () => {
    const result = resolveSkill(
      { skill: lions },
      baseState({ modes: byakuganOn, marks: [cpMark] }),
      alwaysMiss,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(0);
    expect(result.damageDealt).toBe(0);
    expect(result.state.marks.some((m) => m.id === 'chakra_point')).toBe(true);
  });
});

describe('T-022 base', () => {
  it('plays at base without Byakugan and without CP', () => {
    const noMode = resolveSkill({ skill: lions }, baseState({ marks: [cpMark] }), alwaysHit);
    expect(noMode.ok).toBe(true);
    if (!noMode.ok) return;
    expect(noMode.damageDealt).toBe(baseline);
    expect(noMode.state.marks.some((m) => m.id === 'chakra_point')).toBe(false);

    const noCp = resolveSkill({ skill: lions }, baseState({ modes: byakuganOn }), alwaysHit);
    expect(noCp.ok).toBe(true);
    if (!noCp.ok) return;
    expect(noCp.damageDealt).toBe(baseline);
    expect(noCp.state.modes.instances.find((m) => m.id === 'byakugan')?.charges).toBe(3);
  });
});
