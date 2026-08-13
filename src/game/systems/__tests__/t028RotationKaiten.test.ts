/**
 * T-028 AC: Rotation (kaiten) — require Byakugan, spend 1, plant self shield+reflect.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatActor, CombatRange, ModeRuntimeState } from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const kaiten = SKILLS.ROTATION;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [kaiten],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const byakuganOn = (charges: number) => ({
  instances: [
    {
      id: 'byakugan',
      family: MODE_FAMILY.HYUGA,
      charges,
      state: ModeRuntimeState.ON,
    },
  ],
});

describe('T-028 authoring', () => {
  it('declares SUPPORT + Byakugan requireOn consume 1', () => {
    expect(kaiten.cardRole).toBe(CardRole.SUPPORT);
    expect(kaiten.modeInteraction).toEqual(
      expect.objectContaining({
        modeId: 'byakugan',
        requireOn: true,
        consumeCharges: 1,
      }),
    );
    expect(kaiten.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'rotation_shield', stacks: 50, targetActor: 'self' }),
        expect.objectContaining({ id: 'rotation_reflect', stacks: 60, targetActor: 'self' }),
      ]),
    );
  });
});

describe('T-028 require on', () => {
  it('rejects when Byakugan is OFF and consumes nothing', () => {
    const start = baseState();
    const result = resolveSkill({ skill: kaiten }, start);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('mode-required');
    expect(result.state.pools).toEqual(start.pools);
    expect(result.state.marks).toHaveLength(0);
    expect(result.state.modes.instances).toHaveLength(0);
  });
});

describe('T-028 spend self marks', () => {
  it('spends 1 charge and plants player-targeted shield + reflect', () => {
    const result = resolveSkill({ skill: kaiten }, baseState({ modes: byakuganOn(4) }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.modes.instances.find((m) => m.id === 'byakugan')?.charges).toBe(3);
    const shield = result.state.marks.find((m) => m.id === 'rotation_shield');
    const reflect = result.state.marks.find((m) => m.id === 'rotation_reflect');
    expect(shield?.target).toBe(CombatActor.PLAYER);
    expect(shield?.owner).toBe(CombatActor.PLAYER);
    expect(shield?.stacks).toBe(50);
    expect(reflect?.target).toBe(CombatActor.PLAYER);
    expect(reflect?.stacks).toBe(60);
    expect(result.state.marks.every((m) => m.target === CombatActor.PLAYER)).toBe(true);

    const last = resolveSkill({ skill: kaiten }, baseState({ modes: byakuganOn(1) }));
    expect(last.ok).toBe(true);
    if (!last.ok) return;
    expect(last.state.modes.instances.find((m) => m.id === 'byakugan')?.state).toBe(
      ModeRuntimeState.COOLDOWN,
    );
  });
});
