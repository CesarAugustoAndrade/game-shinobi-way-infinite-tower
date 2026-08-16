/**
 * T-085 probe — live upkeep draw consumes pendingSupportWeights once.
 */

import { CardRole, Posture } from '../game/types';
import { createCombatState } from '../game/systems/CombatWorkflowSystem';
import { buildUpkeepWeightContext, processUpkeep } from '../game/systems/PlayerTurnSystem';
import { effectiveWeight } from '../game/systems/DeckSystem';
import { calculateDerivedStats } from '../game/systems/StatSystem';
import { BASE_STATS, createMockPlayer, createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface LiveWeightsProbe {
  firstDrawBoosted: boolean;
  secondEmpty: boolean;
  metrics: {
    baseWeight: number;
    boostedWeight: number;
    secondWeight: number;
    delta: number;
    leftoverBag: number;
  };
}

export function runLiveWeightsProbe(): LiveWeightsProbe {
  const rasengan = createMockSkill({
    id: 'rasengan',
    name: 'Rasengan',
    cardRole: CardRole.ATTACK,
    currentCooldown: 0,
  });
  const filler = createMockSkill({
    id: 'chidori',
    name: 'Chidori',
    cardRole: CardRole.ATTACK,
    currentCooldown: 0,
  });
  const player = createMockPlayer({
    skills: [rasengan, filler],
    currentChakra: 80,
    currentHp: 150,
  });
  const combat = {
    ...createCombatState(),
    posture: Posture.BALANCED,
    playablePool: [rasengan, filler],
    pendingSupportWeights: [{ skillId: 'rasengan', delta: 2 }],
  };
  const ctx = buildUpkeepWeightContext(player, combat);
  const baseWeight = effectiveWeight(rasengan, { ...ctx, supportBonuses: {} });
  const boostedWeight = effectiveWeight(rasengan, ctx);
  const upkeep = processUpkeep(player, {
    primary: { ...BASE_STATS },
    effectivePrimary: { ...BASE_STATS },
    derived: calculateDerivedStats(BASE_STATS, {}),
  }, combat);
  const second = buildUpkeepWeightContext(player, {
    ...combat,
    pendingSupportWeights: upkeep.pendingSupportWeights,
  });
  const secondWeight = effectiveWeight(rasengan, second);
  return {
    firstDrawBoosted: boostedWeight === baseWeight + 2,
    secondEmpty:
      (upkeep.pendingSupportWeights ?? []).length === 0 && secondWeight === baseWeight,
    metrics: {
      baseWeight,
      boostedWeight,
      secondWeight,
      delta: boostedWeight - baseWeight,
      leftoverBag: (upkeep.pendingSupportWeights ?? []).length,
    },
  };
}

export function printLiveWeightsProbe(probe: LiveWeightsProbe): void {
  const m = probe.metrics;
  console.log('\n── T-085 live support-weight consume probe ──');
  console.log(`  first draw +2:          ${probe.firstDrawBoosted}  (${m.baseWeight} → ${m.boostedWeight})`);
  console.log(`  second consume empty:   ${probe.secondEmpty}  (bag ${m.leftoverBag}, weight ${m.secondWeight})`);
  console.log('  ── balance vs sticky bag ──');
  console.log(`  weight delta:           ${m.delta}  (sticky bag would re-apply +2 every upkeep)`);
  console.log(`  leftover bag:           ${m.leftoverBag}  (was same bag if processUpkeep did not write back)`);
}
