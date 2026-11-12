/**
 * MODE cold activate: exact activation-cost pools → Mode ON, paid once;
 * activate fail rejects without soft-committing skill costs / readiness.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, ModeRuntimeState } from '../../types';
import { SKILLS } from '../../constants/skills';
import { MODE_DEFINITIONS } from '../../constants/modes';
import { emptyModeBoard } from '../CombatModeSystem';
import {
  resolveSkill,
  type ResolveSkillState,
} from '../ResolveSkillSystem';

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 3,
    marks: [],
    modes: emptyModeBoard(),
    skills: [],
    playerBuffs: [],
    enemyHp: 50,
    ...overrides,
  };
}

describe('MODE cold activate pay-once', () => {
  it('resolveSkill byakugan at exact activation cost → Mode ON, pools paid once', () => {
    const skill = { ...SKILLS.BYAKUGAN, readyOnTurn: 0 };
    const cost = MODE_DEFINITIONS.byakugan.activationCost;
    const ap = cost.ap ?? 0;
    const chakra = cost.chakra ?? 0;
    expect(skill.cardRole).toBe(CardRole.MODE);
    expect(skill.apCost).toBe(ap);
    expect(skill.chakraCost).toBe(chakra);

    const state = baseState({
      pools: { ap, chakra, hp: 40, maxHp: 40 },
      skills: [skill],
    });
    const before = structuredClone(state);

    const result = resolveSkill({ skill }, state);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.role).toBe(CardRole.MODE);
    expect(result.modeActivations).toBe(1);

    const on = result.state.modes.instances.find((m) => m.id === 'byakugan');
    expect(on?.state).toBe(ModeRuntimeState.ON);
    expect(on?.charges).toBe(MODE_DEFINITIONS.byakugan.maxCharges);

    // activateMode pays activationCost once; skill front-door debit is skipped.
    expect(result.state.pools.ap).toBe(0);
    expect(result.state.pools.chakra).toBe(0);
    expect(result.state.pools.hp).toBe(before.pools.hp);
    expect(state).toEqual(before);
  });

  it('resolveSkill shadow_clone at exact activation cost → Mode ON, pools paid once', () => {
    const skill = { ...SKILLS.SHADOW_CLONE, readyOnTurn: 0 };
    const cost = MODE_DEFINITIONS.shadow_clone.activationCost;
    const ap = cost.ap ?? 0;
    const chakra = cost.chakra ?? 0;

    const state = baseState({
      pools: { ap, chakra, hp: 40, maxHp: 40 },
      skills: [skill],
    });

    const result = resolveSkill({ skill }, state);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.modeActivations).toBe(1);
    expect(result.state.modes.instances.find((m) => m.id === 'shadow_clone')?.state).toBe(
      ModeRuntimeState.ON,
    );
    expect(result.state.pools.ap).toBe(0);
    expect(result.state.pools.chakra).toBe(0);
  });

  it('activate fail path does not soft-commit pools or readiness', () => {
    const skill = { ...SKILLS.BYAKUGAN, readyOnTurn: 0 };
    const cost = MODE_DEFINITIONS.byakugan.activationCost;
    const state = baseState({
      pools: {
        ap: cost.ap ?? 0,
        chakra: cost.chakra ?? 0,
        hp: 40,
        maxHp: 40,
      },
      modes: {
        instances: [
          {
            id: 'byakugan',
            family: MODE_DEFINITIONS.byakugan.family,
            stage: MODE_DEFINITIONS.byakugan.stage,
            charges: 2,
            cooldown: MODE_DEFINITIONS.byakugan.cooldown,
            state: ModeRuntimeState.ON,
          },
        ],
      },
      skills: [skill],
    });
    const before = structuredClone(state);

    const result = resolveSkill({ skill }, state);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('mode-family');
    expect(result.state).toEqual(before);
    expect(state).toEqual(before);
    expect(result.state.pools).toEqual(before.pools);
    expect(result.state.skills.find((s) => s.id === 'byakugan')?.readyOnTurn).toBe(0);
    expect(result.state.modes.instances.find((m) => m.id === 'byakugan')?.charges).toBe(2);
  });
});
