/**
 * T-137 probe — DoT Marks tick stacks on enemy opportunity vs unused decorative Marks.
 */

import {
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
} from '../game/types';
import { calculateDerivedStats } from '../game/systems/StatSystem';
import { processEnemyTurn } from '../game/systems/EnemyTurnSystem';
import { createCombatState } from '../game/systems/CombatWorkflowSystem';
import { tickDotMarksForActor } from '../game/systems/MarkSystem';
import type { Mark } from '../game/types';
import {
  BASE_STATS,
  createMockEnemy,
  createMockPlayer,
  createMockSkill,
} from '../game/systems/__tests__/testFixtures';

export interface DotMarksLiveProbe {
  pure: boolean;
  sum: boolean;
  live: boolean;
  metrics: {
    bleedTick: number;
    dualTick: number;
    liveHpDelta: number;
    liveBareDelta: number;
    durationAfter: number;
  };
}

function bleed(stacks: number, id = 'bleed'): Mark {
  return {
    id,
    sourceSkillId: 'kunai_slash',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 2,
    stacks,
    family: MarkFamily.DOT,
  };
}

export function runDotMarksLiveProbe(): DotMarksLiveProbe {
  const pure = tickDotMarksForActor([bleed(3)], CombatActor.ENEMY);
  const sum = tickDotMarksForActor([bleed(3), bleed(4, 'poison')], CombatActor.ENEMY);
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
  const stunBuff = {
    id: 'stun',
    name: 'Stun',
    duration: 2,
    source: 'test',
    effect: { type: EffectType.STUN, duration: 2, chance: 1 },
  };
  const enemyHp = 80;
  const enemy = createMockEnemy({
    currentHp: enemyHp,
    activeBuffs: [stunBuff],
    skills: [createMockSkill({ apCost: 1, currentCooldown: 0 })],
  });
  const player = createMockPlayer({ currentHp: 10_000, activeBuffs: [] });
  const combat = {
    ...createCombatState(),
    isFirstTurn: false,
    currentRange: CombatRange.CLOSE,
  };
  const armed = processEnemyTurn(player, playerStats, enemy, enemyStats, {
    ...combat,
    marks: [bleed(3)],
  });
  const bare = processEnemyTurn(player, playerStats, enemy, enemyStats, {
    ...combat,
    marks: [],
  });
  return {
    pure: pure.damage === 3 && pure.marks[0]?.duration === 2,
    sum: sum.damage === 7,
    live: armed.newEnemyHp === enemyHp - 3 && bare.newEnemyHp === enemyHp,
    metrics: {
      bleedTick: pure.damage,
      dualTick: sum.damage,
      liveHpDelta: enemyHp - armed.newEnemyHp,
      liveBareDelta: enemyHp - bare.newEnemyHp,
      durationAfter: armed.marks?.find((m) => m.id === 'bleed')?.duration ?? -1,
    },
  };
}

export function printDotMarksLiveProbe(probe: DotMarksLiveProbe): void {
  const m = probe.metrics;
  console.log('\n── T-137 DoT Marks live probe ──');
  console.log(`  bleed 3 tick, duration stays 2: ${probe.pure}`);
  console.log(`  two DoTs 3+4 = 7:               ${probe.sum}`);
  console.log(`  live stunned enemy HP −3:       ${probe.live}`);
  console.log('  ── balance vs decorative unused DoT Marks ──');
  console.log(`  tick dmg:        ${m.bleedTick}  (was 0 live)`);
  console.log(`  dual tick:       ${m.dualTick}`);
  console.log(`  live ΔHP armed:  ${m.liveHpDelta}  (was ${m.liveBareDelta})`);
  console.log(`  duration after:  ${m.durationAfter}  (clock owns decr; helper does not)`);
  console.log('  ── equilibrium ──');
  console.log('  Flat stacks per opportunity (kunai bleed 3×2 = 6 over two enemy turns). Honest vs buff BLEED. Not a % HP burn.');
}
