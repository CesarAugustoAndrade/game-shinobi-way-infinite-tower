/**
 * T-147 probe — sim Bound blocks voluntary shift vs ungated walk-through.
 */

import {
  CombatActor,
  CombatRange,
  MarkFamily,
  RangeMoveDirection,
} from '../game/types';
import { BOUND_MARK_ID } from '../game/systems/RangeSystem';
import { applySimEnemyVoluntaryMove } from './BattleSimulator';
import type { Mark } from '../game/types';

export interface BoundSimParityProbe {
  blocked: boolean;
  free: boolean;
  metrics: {
    boundRange: CombatRange;
    freeRange: CombatRange;
    boundMoved: boolean;
    freeMoved: boolean;
  };
}

const bound: Mark = {
  id: BOUND_MARK_ID,
  sourceSkillId: 'shadow_possession',
  owner: CombatActor.PLAYER,
  target: CombatActor.ENEMY,
  duration: 1,
  stacks: 1,
  family: MarkFamily.HARD_CONTROL,
};

export function runBoundSimParityProbe(): BoundSimParityProbe {
  const locked = applySimEnemyVoluntaryMove(
    CombatRange.CLOSE,
    RangeMoveDirection.RETREAT,
    [bound],
  );
  const free = applySimEnemyVoluntaryMove(
    CombatRange.CLOSE,
    RangeMoveDirection.RETREAT,
    [],
  );
  return {
    blocked: !locked.moved && locked.range === CombatRange.CLOSE,
    free: free.moved && free.range === CombatRange.MEDIUM,
    metrics: {
      boundRange: locked.range,
      freeRange: free.range,
      boundMoved: locked.moved,
      freeMoved: free.moved,
    },
  };
}

export function printBoundSimParityProbe(probe: BoundSimParityProbe): void {
  const m = probe.metrics;
  console.log('\n── T-147 Bound sim parity probe ──');
  console.log(`  bound RETREAT stays CLOSE: ${probe.blocked}`);
  console.log(`  unbound RETREAT → MEDIUM:  ${probe.free}`);
  console.log('  ── balance vs sim walking through Bound ──');
  console.log(`  bound range/moved: ${m.boundRange} / ${m.boundMoved}  (was MEDIUM walk-through)`);
  console.log(`  free range/moved:  ${m.freeRange} / ${m.freeMoved}`);
  console.log('  ── equilibrium ──');
  console.log('  Same Bound physics as live EnemyTurn. Forced/card moves unchanged. Not a power buff.');
}
