/**
 * T-020 AC: Uzumaki Barrage clones ON +2 hits + 1 charge.
 */

import { describe, it, expect } from 'vitest';
import { CombatRange, ModeRuntimeState } from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

function barrage() {
  const row = Object.values(SKILLS).find((entry) => entry.id === 'uzumaki_barrage');
  if (!row) throw new Error('missing uzumaki_barrage');
  return row;
}

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  const skill = barrage();
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 50,
    ...overrides,
  };
}

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

function countingHit() {
  let rolls = 0;
  return {
    ports: {
      rollHit: () => {
        rolls += 1;
        return { hit: true, damage: barrage().baseDamage };
      },
    },
    count: () => rolls,
  };
}

describe('T-020 authoring', () => {
  it('keeps base hitCount 3 and declares bonusHits 2 on clones', () => {
    const skill = barrage();
    expect(skill.hitCount).toBe(3);
    expect(skill.modeInteraction).toEqual(
      expect.objectContaining({
        modeId: 'shadow_clone',
        consumeCharges: 1,
        bonusHits: 2,
      }),
    );
  });
});

describe('T-020 on plus hits', () => {
  it('rolls 5 times and spends 1 clone charge', () => {
    const hits = countingHit();
    const result = resolveSkill({ skill: barrage() }, baseState({ modes: clonesOn }), hits.ports);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(hits.count()).toBe(5);
    expect(result.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges).toBe(2);
  });
});

describe('T-020 off base', () => {
  it('rolls 3 times with no Mode board', () => {
    const hits = countingHit();
    const result = resolveSkill({ skill: barrage() }, baseState(), hits.ports);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(hits.count()).toBe(3);
    expect(result.state.modes.instances).toHaveLength(0);
  });
});
