/**
 * T-027 AC: Mode family auto-route — Gate/Curse ascent vs Sharingan lateral; no downgrade.
 */

import { describe, it, expect } from 'vitest';
import { CombatRange, ModeRuntimeState } from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const curse2 = SKILLS.CURSE_MARK_2;
const curse1 = SKILLS.CURSE_MARK_1;
const sharingan3 = SKILLS.SHARINGAN_3TOMOE;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 10, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [curse2, curse1, sharingan3],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

function onMode(id: string, family: string, charges: number, stage?: number) {
  return {
    instances: [
      {
        id,
        family,
        charges,
        stage,
        state: ModeRuntimeState.ON,
      },
    ],
  };
}

describe('T-027 ascent', () => {
  it('ascends Curse I→II: +1 charge, only stage II ON', () => {
    const result = resolveSkill(
      { skill: curse2 },
      baseState({ modes: onMode('curse_mark_1', MODE_FAMILY.CURSE, 2, 1) }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const next = result.state.modes.instances.find((m) => m.id === 'curse_mark_2');
    expect(next?.state).toBe(ModeRuntimeState.ON);
    expect(next?.charges).toBe(3);
    expect(
      result.state.modes.instances.some(
        (m) => m.id === 'curse_mark_1' && m.state === ModeRuntimeState.ON,
      ),
    ).toBe(false);
    expect(result.state.pools.ap).toBe(7);
    expect(result.state.pools.hp).toBe(27);
  });
});

describe('T-027 lateral', () => {
  it('laterals Sharingan 2→3: transfer charges, prior COOLDOWN', () => {
    const result = resolveSkill(
      { skill: sharingan3 },
      baseState({ modes: onMode('sharingan_2', MODE_FAMILY.SHARINGAN, 2, 2) }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.modes.instances.find((m) => m.id === 'sharingan_3')?.charges).toBe(2);
    expect(result.state.modes.instances.find((m) => m.id === 'sharingan_3')?.state).toBe(
      ModeRuntimeState.ON,
    );
    expect(result.state.modes.instances.find((m) => m.id === 'sharingan_2')?.state).toBe(
      ModeRuntimeState.COOLDOWN,
    );
    expect(result.state.pools.ap).toBe(7);
    expect(result.state.pools.chakra).toBe(14);
  });
});

describe('T-027 no downgrade', () => {
  it('rejects lower-stage MODE and clones board/pools', () => {
    const start = baseState({ modes: onMode('curse_mark_2', MODE_FAMILY.CURSE, 3, 2) });
    const result = resolveSkill({ skill: curse1 }, start);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('mode-family');
    expect(result.state.pools).toEqual(start.pools);
    expect(result.state.modes.instances.find((m) => m.id === 'curse_mark_2')?.charges).toBe(3);
    expect(result.state.modes.instances.some((m) => m.id === 'curse_mark_1')).toBe(false);
  });
});
