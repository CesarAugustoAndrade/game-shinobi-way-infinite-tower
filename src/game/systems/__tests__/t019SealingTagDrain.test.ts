/**
 * T-019 AC: Sealing Tag drains one enemy Mode charge or Silence 1 (xor).
 */

import { describe, it, expect } from 'vitest';
import { CombatRange, EffectType, ModeRuntimeState } from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

function skill() {
  const row = Object.values(SKILLS).find((entry) => entry.id === 'sealing_tag_chakra_lock');
  if (!row) throw new Error('missing sealing_tag_chakra_lock');
  return row;
}

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  const sealing = skill();
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [sealing],
    playerBuffs: [],
    enemyHp: 50,
    enemyModes: emptyModeBoard(),
    enemyBuffs: [],
    ...overrides,
  };
}

const clonesOn = (charges: number) => ({
  instances: [
    {
      id: 'shadow_clone',
      family: 'CLONES',
      charges,
      state: ModeRuntimeState.ON,
    },
  ],
});

function hasSilence(state: ResolveSkillState): boolean {
  return (state.enemyBuffs ?? []).some((buff) => buff.effect.type === EffectType.SILENCE);
}

describe('T-019 drain', () => {
  it('drains 1 charge from the first ON enemy Mode and applies no Silence', () => {
    const result = resolveSkill({ skill: skill() }, baseState({ enemyModes: clonesOn(3) }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.enemyModes?.instances.find((m) => m.id === 'shadow_clone')?.charges).toBe(2);
    expect(hasSilence(result.state)).toBe(false);
    expect(result.state.modes.instances).toHaveLength(0);
  });

  it('ends an enemy Mode when the last charge is drained', () => {
    const result = resolveSkill({ skill: skill() }, baseState({ enemyModes: clonesOn(1) }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ended = result.state.enemyModes?.instances.find((m) => m.id === 'shadow_clone');
    expect(ended?.state).toBe(ModeRuntimeState.COOLDOWN);
    expect(ended?.charges).toBe(0);
    expect(hasSilence(result.state)).toBe(false);
  });
});

describe('T-019 silence', () => {
  it('applies Silence 1 when no enemy Mode is ON', () => {
    const result = resolveSkill({ skill: skill() }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(hasSilence(result.state)).toBe(true);
    const silence = result.state.enemyBuffs?.find((buff) => buff.effect.type === EffectType.SILENCE);
    expect(silence?.duration).toBe(1);
    expect(result.state.enemyModes?.instances ?? []).toHaveLength(0);
  });
});

describe('T-019 no double', () => {
  it('does not keep a packaged always-on Silence effect on the skill row', () => {
    expect(skill().effects?.some((effect) => effect.type === EffectType.SILENCE)).toBeFalsy();
    const result = resolveSkill({ skill: skill() }, baseState({ enemyModes: clonesOn(3) }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(hasSilence(result.state)).toBe(false);
  });
});
