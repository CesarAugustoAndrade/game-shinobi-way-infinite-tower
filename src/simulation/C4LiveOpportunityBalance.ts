/**
 * T-142 probe — live enemy opportunity detonates C4 35 TRUE once vs decorative unused mark.
 */

import { CombatActor, CombatRange, EffectType, MarkFamily } from '../game/types';
import { calculateDerivedStats } from '../game/systems/StatSystem';
import { processEnemyTurn } from '../game/systems/EnemyTurnSystem';
import { createCombatState } from '../game/systems/CombatWorkflowSystem';
import { C4_MARK_ID, C4_TRUE_DAMAGE } from '../game/systems/MarkSystem';
import type { Mark } from '../game/types';
import { BASE_STATS, createMockEnemy, createMockPlayer, createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface C4LiveOpportunityProbe {
  live: boolean;
  absent: boolean;
  once: boolean;
  metrics: {
    hpBare: number;
    hpArmed: number;
    hpSecond: number;
    truePayload: number;
    leftoverC4: boolean;
    leftoverAfterSecond: boolean;
  };
}

function c4Mark(): Mark {
  return {
    id: C4_MARK_ID,
    sourceSkillId: 'c4_karura',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 1,
    stacks: C4_TRUE_DAMAGE,
    family: MarkFamily.STAT,
  };
}

const stats = {
  primary: BASE_STATS,
  effectivePrimary: BASE_STATS,
  derived: calculateDerivedStats(BASE_STATS, {}),
};

const stunBuff = {
  id: 'stun',
  name: 'Stun',
  duration: 2,
  source: 'test',
  effect: { type: EffectType.STUN, duration: 2, chance: 1 },
};

export function runC4LiveOpportunityProbe(): C4LiveOpportunityProbe {
  const enemyHp = 80;
  const player = createMockPlayer({ currentHp: 10_000, activeBuffs: [] });
  const enemy = () =>
    createMockEnemy({
      currentHp: enemyHp,
      activeBuffs: [stunBuff],
      skills: [createMockSkill({ apCost: 1, currentCooldown: 0 })],
    });
  const base = {
    ...createCombatState(),
    isFirstTurn: false,
    currentRange: CombatRange.CLOSE,
  };
  const armed = processEnemyTurn(player, stats, enemy(), stats, { ...base, marks: [c4Mark()] });
  const bare = processEnemyTurn(player, stats, enemy(), stats, { ...base, marks: [] });
  const second = processEnemyTurn(
    player,
    stats,
    createMockEnemy({
      currentHp: armed.newEnemyHp,
      activeBuffs: [stunBuff],
      skills: [createMockSkill({ apCost: 1, currentCooldown: 0 })],
    }),
    stats,
    { ...base, marks: armed.marks ?? [] },
  );
  return {
    live: armed.newEnemyHp === enemyHp - C4_TRUE_DAMAGE && !(armed.marks ?? []).some((m) => m.id === C4_MARK_ID),
    absent: bare.newEnemyHp === enemyHp,
    once: second.newEnemyHp === armed.newEnemyHp,
    metrics: {
      hpBare: bare.newEnemyHp,
      hpArmed: armed.newEnemyHp,
      hpSecond: second.newEnemyHp,
      truePayload: C4_TRUE_DAMAGE,
      leftoverC4: (armed.marks ?? []).some((m) => m.id === C4_MARK_ID),
      leftoverAfterSecond: (second.marks ?? []).some((m) => m.id === C4_MARK_ID),
    },
  };
}

export function printC4LiveOpportunityProbe(probe: C4LiveOpportunityProbe): void {
  const m = probe.metrics;
  console.log('\n── T-142 C4 live opportunity probe ──');
  console.log(`  live fire HP −35 + consume: ${probe.live}`);
  console.log(`  absent noop:                ${probe.absent}`);
  console.log(`  second opportunity no 35:   ${probe.once}`);
  console.log('  ── balance vs decorative unused C4 ──');
  console.log(`  HP bare / armed / second: ${m.hpBare} / ${m.hpArmed} / ${m.hpSecond}  (was ${m.hpBare} live)`);
  console.log(`  TRUE payload:             ${m.truePayload}  (catalog 35, not CESAR ×2)`);
  console.log(`  leftover C4 after fire:   ${m.leftoverC4}`);
  console.log('  ── equilibrium ──');
  console.log('  Delayed 35 TRUE once at enemy opportunity start. Stun does not cancel. Shield/DoT paths unchanged.');
}
