/**
 * T-016 AC: next-draw support weight bag (Drill Main +2, Gate Prep +3).
 */

import { describe, it, expect } from 'vitest';
import { ActionType, CardRole, CombatRange, Posture } from '../../types';
import { effectiveWeight } from '../DeckSystem';
import {
  applySupportWeightOnPlay,
  consumeSupportWeightBonuses,
  enqueueSupportWeightBonuses,
  GATE_PREP_TARGET_IDS,
} from '../SupportWeightSystem';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const drill = createMockSkill({
  id: 'chakra_control_drill',
  name: 'Chakra Control Drill',
  cardRole: CardRole.SUPPORT,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  hpCost: 0,
  cooldown: 3,
  currentCooldown: 0,
  baseDamage: 0,
});

const rasengan = createMockSkill({
  id: 'rasengan',
  name: 'Rasengan',
  currentCooldown: 0,
});

describe('T-016 drill main', () => {
  it('enqueues Main +2 once; second consume is empty; effectiveWeight +2', () => {
    const entries = applySupportWeightOnPlay(drill, { mainAttackId: 'rasengan' });
    const bag = enqueueSupportWeightBonuses([], entries);
    const first = consumeSupportWeightBonuses(bag);
    expect(first.bonuses.rasengan).toBe(2);
    expect(first.bag).toEqual([]);

    const second = consumeSupportWeightBonuses(first.bag);
    expect(second.bonuses.rasengan).toBeUndefined();
    expect(Object.keys(second.bonuses)).toHaveLength(0);

    const ctx = { posture: Posture.BALANCED };
    const base = effectiveWeight(rasengan, { ...ctx, supportBonuses: {} });
    const boosted = effectiveWeight(rasengan, { ...ctx, supportBonuses: first.bonuses });
    expect(boosted).toBe(base + 2);
  });

  it('does not change Drill baseWeight', () => {
    const before = drill.baseWeight;
    applySupportWeightOnPlay(drill, { mainAttackId: 'rasengan' });
    expect(drill.baseWeight).toBe(before);
  });
});

describe('T-016 gate prep', () => {
  it('enqueues +3 for gate_of_life and gate_of_limit', () => {
    const entries = applySupportWeightOnPlay({ id: 'gate_prep' });
    const { bonuses } = consumeSupportWeightBonuses(enqueueSupportWeightBonuses([], entries));
    expect(GATE_PREP_TARGET_IDS).toEqual(['gate_of_life', 'gate_of_limit']);
    expect(bonuses.gate_of_life).toBe(3);
    expect(bonuses.gate_of_limit).toBe(3);
  });
});

describe('T-016 no main', () => {
  it('enqueues nothing when Main is null or empty', () => {
    expect(applySupportWeightOnPlay(drill, { mainAttackId: null })).toEqual([]);
    expect(applySupportWeightOnPlay(drill, { mainAttackId: '' })).toEqual([]);
    expect(applySupportWeightOnPlay({ id: 'wire_kunai_reel' }, { mainAttackId: 'rasengan' })).toEqual(
      [],
    );
  });
});

describe('T-016 resolve hook', () => {
  it('enqueues Drill Main +2 onto resolveSkill state', () => {
    const state: ResolveSkillState = {
      pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
      range: CombatRange.CLOSE,
      turnIndex: 2,
      marks: [],
      modes: emptyModeBoard(),
      skills: [drill],
      playerBuffs: [],
      enemyHp: 50,
      pendingSupportWeights: [],
    };
    const result = resolveSkill(
      {
        skill: drill,
        weightContext: { posture: Posture.BALANCED, mainAttackId: 'rasengan' },
      },
      state,
    );
    expect(result.ok).toBe(true);
    const { bonuses } = consumeSupportWeightBonuses(result.state.pendingSupportWeights ?? []);
    expect(bonuses.rasengan).toBe(2);
  });
});
