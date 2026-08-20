/**
 * T-140 probe — allowlisted STAT Marks fold into live primaries vs decorative unused Marks.
 */

import { CombatActor, MarkFamily } from '../game/types';
import {
  applyStatMarksToPrimaryStats,
  primaryDeltasFromStatMarks,
} from '../game/systems/MarkSystem';
import { getEnemyFullStats } from '../game/systems/StatSystem';
import type { Mark } from '../game/types';
import { BASE_STATS, createMockEnemy } from '../game/systems/__tests__/testFixtures';

export interface StatMarksLiveProbe {
  spd: boolean;
  acc: boolean;
  allowlist: boolean;
  live: boolean;
  metrics: {
    spdDelta: number;
    accDelta: number;
    aimDelta: number;
    liveSpeedBare: number;
    liveSpeedArmed: number;
  };
}

function statMark(id: string, stacks: number): Mark {
  return {
    id,
    sourceSkillId: id,
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 2,
    stacks,
    family: MarkFamily.STAT,
  };
}

export function runStatMarksLiveProbe(): StatMarksLiveProbe {
  const spdApplied = applyStatMarksToPrimaryStats(
    BASE_STATS,
    [statMark('spd_down', 1)],
    CombatActor.ENEMY,
  );
  const accApplied = applyStatMarksToPrimaryStats(
    BASE_STATS,
    [statMark('blinded', 2)],
    CombatActor.ENEMY,
  );
  const aimApplied = applyStatMarksToPrimaryStats(
    BASE_STATS,
    [statMark('aim', 3)],
    CombatActor.ENEMY,
  );
  const enemy = createMockEnemy({ primaryStats: { ...BASE_STATS }, activeBuffs: [] });
  const bare = getEnemyFullStats(enemy);
  const armed = getEnemyFullStats(enemy, [statMark('spd_down', 1)]);
  const spdDelta = spdApplied.speed - BASE_STATS.speed;
  const accDelta = accApplied.accuracy - BASE_STATS.accuracy;
  const aimDelta = aimApplied.accuracy - BASE_STATS.accuracy;
  return {
    spd: spdDelta === -1 && primaryDeltasFromStatMarks([statMark('spd_down', 1)], CombatActor.ENEMY).speed === -1,
    acc: accDelta === -2,
    allowlist: aimDelta === 0,
    live: armed.effectivePrimary.speed === bare.effectivePrimary.speed - 1,
    metrics: {
      spdDelta,
      accDelta,
      aimDelta,
      liveSpeedBare: bare.effectivePrimary.speed,
      liveSpeedArmed: armed.effectivePrimary.speed,
    },
  };
}

export function printStatMarksLiveProbe(probe: StatMarksLiveProbe): void {
  const m = probe.metrics;
  console.log('\n── T-140 STAT Marks live probe ──');
  console.log(`  spd_down 1 → speed −1:     ${probe.spd}`);
  console.log(`  blinded 2 → accuracy −2:   ${probe.acc}`);
  console.log(`  aim STAT ignored:          ${probe.allowlist}`);
  console.log(`  live getEnemyFullStats −1: ${probe.live}`);
  console.log('  ── balance vs decorative unused STAT Marks ──');
  console.log(`  speed Δ:     ${m.spdDelta}  (was 0 live)`);
  console.log(`  accuracy Δ:  ${m.accDelta}  (was 0 live)`);
  console.log(`  aim Δ:       ${m.aimDelta}  (must stay 0)`);
  console.log(`  live speed:  ${m.liveSpeedBare} → ${m.liveSpeedArmed}`);
  console.log('  ── equilibrium ──');
  console.log('  Integer points only (leaf_whirlwind −1 SPD, flash_bomb −2 ACC). Floor 1. Not % ACC/SPD. aim/cloaked/decoy stay non-primary.');
}
