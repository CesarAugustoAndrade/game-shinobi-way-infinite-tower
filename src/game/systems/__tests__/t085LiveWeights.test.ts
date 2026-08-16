/**
 * T-085 AC: CombatState persists pendingSupportWeights; upkeep draw consumes them live.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, Posture, SkillTag } from '../../types';
import { createCombatState } from '../CombatWorkflowSystem';
import { buildUpkeepWeightContext, processUpkeep } from '../PlayerTurnSystem';
import { effectiveWeight } from '../DeckSystem';
import { calculateDerivedStats } from '../StatSystem';
import { createMockPlayer, createMockSkill, BASE_STATS } from './testFixtures';
import type { CombatState } from '../combat-types';

const makeStats = (stats = BASE_STATS) => ({
  primary: { ...stats },
  effectivePrimary: { ...stats },
  derived: calculateDerivedStats(stats, {}),
});

function combatWithBag(overrides: Partial<CombatState> = {}): CombatState {
  return {
    ...createCombatState(),
    posture: Posture.BALANCED,
    ...overrides,
  };
}

describe('T-085 CombatState defaults', () => {
  it('createCombatState seeds an empty support bag and no Discover offer', () => {
    const state = createCombatState();
    expect(state.pendingSupportWeights).toEqual([]);
    expect(state.pendingDiscover).toBeUndefined();
  });
});

describe('T-085 live support weights', () => {
  it('AC1: a pending support weight raises upkeep-draw effectiveWeight', () => {
    const rasengan = createMockSkill({
      id: 'rasengan',
      name: 'Rasengan',
      cardRole: CardRole.ATTACK,
      currentCooldown: 0,
    });
    const chidori = createMockSkill({
      id: 'chidori',
      name: 'Chidori',
      cardRole: CardRole.ATTACK,
      currentCooldown: 0,
    });
    const player = createMockPlayer({
      skills: [rasengan, chidori],
      currentChakra: 80,
      currentHp: 150,
    });
    const combatState = combatWithBag({
      playablePool: [rasengan, chidori],
      pendingSupportWeights: [{ skillId: 'rasengan', delta: 2 }],
    });

    const ctx = buildUpkeepWeightContext(player, combatState);
    const base = effectiveWeight(rasengan, { ...ctx, supportBonuses: {} });
    const live = effectiveWeight(rasengan, ctx);

    expect(ctx.supportBonuses?.rasengan).toBe(2);
    expect(live).toBe(base + 2);
    expect(effectiveWeight(chidori, ctx)).toBe(
      effectiveWeight(chidori, { ...ctx, supportBonuses: {} }),
    );

    const result = processUpkeep(player, makeStats(), combatState);
    expect(result.hand.length).toBeGreaterThan(0);
  });

  it('feeds role / tag / mental consume results into WeightContext', () => {
    const player = createMockPlayer();
    const ctx = buildUpkeepWeightContext(
      player,
      combatWithBag({
        pendingSupportWeights: [
          { role: CardRole.SIDE_ATTACK, delta: 1 },
          { kind: 'tag', tag: SkillTag.TOOL, delta: 1 },
          { kind: 'mental-attack', delta: 3 },
        ],
      }),
    );

    expect(ctx.supportRoleBonuses?.[CardRole.SIDE_ATTACK]).toBe(1);
    expect(ctx.supportTagBonuses?.[SkillTag.TOOL]).toBe(1);
    expect(ctx.supportMentalAttackBonus).toBe(3);
  });
});
