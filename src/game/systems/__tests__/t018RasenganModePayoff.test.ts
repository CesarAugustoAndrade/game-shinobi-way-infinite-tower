/**
 * T-018 AC: Rasengan clones ON +50% damage + 1 charge at attempt.
 */

import { describe, it, expect } from 'vitest';
import { CombatRange, ModeRuntimeState } from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const rasengan = SKILLS.RASENGAN;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [rasengan],
    playerBuffs: [],
    enemyHp: 50,
    ...overrides,
  };
}

const alwaysHit = { rollHit: () => ({ hit: true, damage: rasengan.baseDamage }) };

const clonesOn = {
  instances: [
    {
      id: 'shadow_clone',
      family: MODE_FAMILY.CLONES,
      charges: 3,
      state: ModeRuntimeState.ON,
    },
  ],
};

describe('T-018 authoring', () => {
  it('declares ATTACK + clones consume 1 and +50% when ON', () => {
    expect(rasengan.cardRole).toBe('ATTACK');
    expect(rasengan.modeInteraction).toEqual(
      expect.objectContaining({
        modeId: 'shadow_clone',
        family: MODE_FAMILY.CLONES,
        consumeCharges: 1,
        damageMultBonus: 0.5,
      }),
    );
  });
});

describe('T-018 on enhance', () => {
  it('deals 1.5× base and spends 1 clone charge without intent.enhanced', () => {
    const result = resolveSkill({ skill: rasengan }, baseState({ modes: clonesOn }), alwaysHit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(Math.floor(rasengan.baseDamage * 1.5));
    expect(result.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges).toBe(2);
  });
});

describe('T-018 off base', () => {
  it('deals base damage with no Mode board', () => {
    const result = resolveSkill({ skill: rasengan }, baseState(), alwaysHit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(rasengan.baseDamage);
    expect(result.state.modes.instances).toHaveLength(0);
  });
});
