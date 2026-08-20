/**
 * T-146 probe — live Discover commit vs decorative unused pendingDiscover.
 */

import { CardRole, CombatRange } from '../game/types';
import { createCombatState } from '../game/systems/CombatWorkflowSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';
import { commitDiscoverOnCombatState } from '../hooks/discoverCommit';
import type { PendingDiscover } from '../game/systems/ResolveSkillSystem';

export interface DiscoverLiveProbe {
  commit: boolean;
  refuse: boolean;
  count: boolean;
  metrics: {
    handAfter: number;
    pendingAfterCommit: boolean;
    refused: boolean;
    candidateCount: number;
  };
}

function pending(): PendingDiscover {
  return {
    sourceId: 'rehearsal',
    candidates: ['fire_atk', 'wind_atk', 'earth_atk'].map((id) => ({
      skill: createMockSkill({ id, name: id, cardRole: CardRole.ATTACK }),
      disabled: false,
      reasons: [],
    })),
  };
}

export function runDiscoverLiveProbe(): DiscoverLiveProbe {
  const offer = pending();
  const base = {
    ...createCombatState(),
    currentRange: CombatRange.MEDIUM,
    hand: [createMockSkill({ id: 'in-hand', cardRole: CardRole.ATTACK })],
    playablePool: offer.candidates.map((entry) => entry.skill),
    pendingDiscover: offer,
  };
  const committed = commitDiscoverOnCombatState(base, 'fire_atk');
  const refused = commitDiscoverOnCombatState(base, 'missing');
  return {
    commit:
      !committed.refused &&
      committed.combatState.pendingDiscover === undefined &&
      committed.combatState.hand.some((card) => card.id === 'fire_atk'),
    refuse: refused.refused && (refused.combatState.pendingDiscover?.candidates.length ?? 0) === 3,
    count: offer.candidates.length === 3,
    metrics: {
      handAfter: committed.combatState.hand.length,
      pendingAfterCommit: committed.combatState.pendingDiscover !== undefined,
      refused: refused.refused,
      candidateCount: offer.candidates.length,
    },
  };
}

export function printDiscoverLiveProbe(probe: DiscoverLiveProbe): void {
  const m = probe.metrics;
  console.log('\n── T-146 Discover live probe ──');
  console.log(`  commit valid id + clear pending: ${probe.commit}`);
  console.log(`  refuse unknown id:               ${probe.refuse}`);
  console.log(`  three candidates:                ${probe.count}`);
  console.log('  ── balance vs unused pendingDiscover ──');
  console.log(`  hand size after commit: ${m.handAfter}  (was 1 + chosen)`);
  console.log(`  pending leftover:       ${m.pendingAfterCommit}  (must be false)`);
  console.log(`  candidates:             ${m.candidateCount}`);
  console.log('  ── equilibrium ──');
  console.log('  Player chooses 1 of up to 3. No auto-pick. CD candidates may enter disabled.');
}
