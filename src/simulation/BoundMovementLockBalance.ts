/**
 * T-132 probe — Bound blocks enemy voluntary band change; vs ungated shift and Water Prison retreat-only.
 */

import {
  AttackMethod,
  CombatActor,
  CombatRange,
  MarkConsumeTiming,
  MarkFamily,
  RangeMoveDirection,
} from '../game/types';
import { calculateDerivedStats } from '../game/systems/StatSystem';
import { processEnemyTurn } from '../game/systems/EnemyTurnSystem';
import { createCombatState } from '../game/systems/CombatWorkflowSystem';
import {
  applyForcedMove,
  BOUND_MARK_ID,
  enemyVoluntaryMoveBlocked,
  WATER_PRISON_LOCK_ID,
  voluntaryRangeIncreaseBlocked,
} from '../game/systems/RangeSystem';
import {
  BASE_STATS,
  createMockEnemy,
  createMockPlayer,
  createMockSkill,
} from '../game/systems/__tests__/testFixtures';
import type { Mark } from '../game/types';

export interface BoundMovementLockProbe {
  gate: boolean;
  enemyTurn: boolean;
  identity: boolean;
  metrics: {
    freeRange: CombatRange | undefined;
    lockedRange: CombatRange | undefined;
    boundAfterLock: boolean;
    waterPrisonRetreat: boolean;
    waterPrisonApproach: boolean;
    forcedPush: CombatRange;
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
  consume: MarkConsumeTiming.IMPACT,
};

const prison: Mark = {
  id: WATER_PRISON_LOCK_ID,
  sourceSkillId: 'water_prison',
  owner: CombatActor.PLAYER,
  target: CombatActor.PLAYER,
  duration: 1,
  stacks: 1,
};

export function runBoundMovementLockProbe(): BoundMovementLockProbe {
  const playerStats = {
    primary: BASE_STATS,
    effectivePrimary: BASE_STATS,
    derived: calculateDerivedStats(BASE_STATS, {}),
  };
  const enemyStats = {
    primary: BASE_STATS,
    effectivePrimary: BASE_STATS,
    derived: calculateDerivedStats(BASE_STATS, {}),
  };
  const ranged = createMockSkill({
    id: 'ranged_poke',
    attackMethod: AttackMethod.RANGED,
    allowedRanges: [CombatRange.MEDIUM, CombatRange.LONG],
    apCost: 1,
    currentCooldown: 0,
    baseDamage: 1,
  });
  const enemy = createMockEnemy({
    skills: [ranged],
    currentHp: 10_000,
    activeBuffs: [],
  });
  const player = createMockPlayer({ currentHp: 10_000, activeBuffs: [] });
  const free = processEnemyTurn(player, playerStats, enemy, enemyStats, {
    ...createCombatState(),
    isFirstTurn: false,
    currentRange: CombatRange.CLOSE,
    enemyMaxAp: 6,
    marks: [],
  });
  const locked = processEnemyTurn(player, playerStats, enemy, enemyStats, {
    ...createCombatState(),
    isFirstTurn: false,
    currentRange: CombatRange.CLOSE,
    enemyMaxAp: 6,
    marks: [bound],
  });
  const forced = applyForcedMove(CombatRange.MEDIUM, 'PUSH');
  return {
    gate:
      enemyVoluntaryMoveBlocked([bound]) === true &&
      enemyVoluntaryMoveBlocked([]) === false &&
      enemyVoluntaryMoveBlocked([prison]) === false,
    enemyTurn:
      free.currentRange === CombatRange.MEDIUM &&
      locked.currentRange === CombatRange.CLOSE &&
      locked.enemyMoveUsedThisTurn === false,
    identity:
      locked.marks?.some((m) => m.id === BOUND_MARK_ID) === true &&
      forced.range === CombatRange.LONG &&
      voluntaryRangeIncreaseBlocked([prison], RangeMoveDirection.RETREAT) === true &&
      voluntaryRangeIncreaseBlocked([prison], RangeMoveDirection.APPROACH) === false,
    metrics: {
      freeRange: free.currentRange,
      lockedRange: locked.currentRange,
      boundAfterLock: locked.marks?.some((m) => m.id === BOUND_MARK_ID) === true,
      waterPrisonRetreat: voluntaryRangeIncreaseBlocked([prison], RangeMoveDirection.RETREAT),
      waterPrisonApproach: voluntaryRangeIncreaseBlocked([prison], RangeMoveDirection.APPROACH),
      forcedPush: forced.range,
    },
  };
}

export function printBoundMovementLockProbe(probe: BoundMovementLockProbe): void {
  const m = probe.metrics;
  console.log('\n── T-132 Bound movement-lock probe ──');
  console.log(`  gate enemy bound / empty / prison:     ${probe.gate}`);
  console.log(`  enemy turn free MEDIUM / locked CLOSE: ${probe.enemyTurn}`);
  console.log(`  identity leftover Bound + forced PUSH: ${probe.identity}`);
  console.log('  ── balance vs ungated voluntary shift ──');
  console.log(`  free CLOSE→:            ${m.freeRange}  (was MEDIUM, still)`);
  console.log(`  bound CLOSE→:           ${m.lockedRange}  (was MEDIUM ungated)`);
  console.log(`  Bound leftover:         ${m.boundAfterLock}  (must stay; IMPACT consume is ATTACK)`);
  console.log(`  Water Prison R/A:       ${m.waterPrisonRetreat} / ${m.waterPrisonApproach}  (RETREAT-only)`);
  console.log(`  forced PUSH MEDIUM:     ${m.forcedPush}  (must stay LONG)`);
  console.log('  ── equilibrium ──');
  console.log('  Completes T-128 Bound “impide movimiento”. Stronger as a setup lock (enemy stuck for ATTACK ×1.2), not a Stun skip. Forced/card movement still escapes. Water Prison retreat-only unchanged.');
}
