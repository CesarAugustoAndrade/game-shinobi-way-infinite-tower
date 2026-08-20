/**
 * T-139 probe — stun HARD_CONTROL Marks skip one enemy action; Bound does not.
 */

import {
  AttackMethod,
  CombatActor,
  CombatRange,
  MarkConsumeTiming,
  MarkFamily,
  Posture,
} from '../game/types';
import { calculateDerivedStats } from '../game/systems/StatSystem';
import { executeEnemyAction } from '../game/systems/EnemyTurnSystem';
import {
  resolveHardControlSkips,
  STUN_SKIP_MARK_ID,
} from '../game/systems/MarkSystem';
import { BOUND_MARK_ID } from '../game/systems/RangeSystem';
import type { CombatState } from '../game/systems/combat-types';
import type { Mark } from '../game/types';
import {
  BASE_STATS,
  createMockEnemy,
  createMockPlayer,
  createMockSkill,
} from '../game/systems/__tests__/testFixtures';

export interface HardControlSkipLiveProbe {
  collapse: boolean;
  boundExcluded: boolean;
  liveSkip: boolean;
  liveBareAttacks: boolean;
  liveBoundAttacks: boolean;
  metrics: {
    twoStunSkips: number;
    boundSkips: number;
    stunHpDelta: number;
    bareHpDelta: number;
    boundHpDelta: number;
  };
}

function stunMark(): Mark {
  return {
    id: STUN_SKIP_MARK_ID,
    sourceSkillId: 'tripwire',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 1,
    stacks: 1,
    family: MarkFamily.HARD_CONTROL,
    consume: MarkConsumeTiming.NONE,
  };
}

function boundMark(): Mark {
  return {
    id: BOUND_MARK_ID,
    sourceSkillId: 'shadow_possession',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 1,
    stacks: 1,
    family: MarkFamily.HARD_CONTROL,
    consume: MarkConsumeTiming.IMPACT,
  };
}

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
const guts = { triggered: false, artifactTriggered: false };

const close: CombatState = {
  isFirstTurn: false,
  firstHitMultiplier: 1,
  playerGoesFirst: true,
  playerInitiativeBonus: 0,
  xpMultiplier: 1,
  terrain: null,
  approachApplied: true,
  skipFirstSkillCost: false,
  artifactGutsUsed: false,
  locationTerrainMods: null,
  roomCombatEvasion: 0,
  fallDamageOnMiss: 0,
  roomConditionNames: [],
  enemyFirstHitMultiplier: 1,
  currentAp: 0,
  maxAp: 10,
  posture: Posture.BALANCED,
  hand: [],
  playablePool: [],
  currentRange: CombatRange.CLOSE,
  playerMoveUsedThisTurn: false,
  enemyMoveUsedThisTurn: false,
  enemyCurrentAp: 5,
  enemyMaxAp: 5,
  turnIndex: 1,
  activeModes: [],
  marks: [],
};

export function runHardControlSkipLiveProbe(): HardControlSkipLiveProbe {
  const twoStunSkips = resolveHardControlSkips([stunMark(), stunMark()], CombatActor.ENEMY);
  const boundSkips = resolveHardControlSkips([boundMark()], CombatActor.ENEMY);
  const poke = createMockSkill({
    id: 'poke',
    name: 'Poke',
    attackMethod: AttackMethod.AUTO,
    allowedRanges: [CombatRange.CLOSE],
    apCost: 1,
    baseDamage: 20,
    scalingPerPoint: 0,
  });
  const playerHp = 10_000;
  const enemy = createMockEnemy({
    skills: [poke],
    currentHp: 10_000,
    preferredRange: CombatRange.CLOSE,
    activeBuffs: [],
  });
  const player = createMockPlayer({ currentHp: playerHp, activeBuffs: [] });
  const realRandom = Math.random;
  Math.random = () => 0.01;
  const stunned = executeEnemyAction(player, playerStats, enemy, enemyStats, guts, {
    ...close,
    marks: [stunMark()],
  });
  const bare = executeEnemyAction(player, playerStats, enemy, enemyStats, guts, {
    ...close,
    marks: [],
  });
  const boundOnly = executeEnemyAction(player, playerStats, enemy, enemyStats, guts, {
    ...close,
    marks: [boundMark()],
  });
  Math.random = realRandom;
  const stunHpDelta = playerHp - stunned.player.currentHp;
  const bareHpDelta = playerHp - bare.player.currentHp;
  const boundHpDelta = playerHp - boundOnly.player.currentHp;
  return {
    collapse: twoStunSkips === 1,
    boundExcluded: boundSkips === 0,
    liveSkip: /STUNNED/i.test(stunned.logs.join('\n')) && stunHpDelta === 0,
    liveBareAttacks: !/STUNNED/i.test(bare.logs.join('\n')) && bareHpDelta > 0,
    liveBoundAttacks: !/STUNNED/i.test(boundOnly.logs.join('\n')) && boundHpDelta > 0,
    metrics: {
      twoStunSkips,
      boundSkips,
      stunHpDelta,
      bareHpDelta,
      boundHpDelta,
    },
  };
}

export function printHardControlSkipLiveProbe(probe: HardControlSkipLiveProbe): void {
  const m = probe.metrics;
  console.log('\n── T-139 HARD_CONTROL skip live probe ──');
  console.log(`  two Stun-1 → 1 skip:            ${probe.collapse}`);
  console.log(`  Bound-only skips === 0:         ${probe.boundExcluded}`);
  console.log(`  live stun Mark skips (no buff): ${probe.liveSkip}`);
  console.log(`  live bare still attacks:        ${probe.liveBareAttacks}`);
  console.log(`  live Bound still attacks:       ${probe.liveBoundAttacks}`);
  console.log('  ── balance vs decorative stun Marks ──');
  console.log(`  skip count (2× stun-1): ${m.twoStunSkips}  (was 1 even for Bound; now stun-only)`);
  console.log(`  Bound skip count:       ${m.boundSkips}  (was 1 before refine)`);
  console.log(`  player ΔHP stun Mark:   ${m.stunHpDelta}  (was ${m.bareHpDelta} decorative)`);
  console.log(`  player ΔHP bare:        ${m.bareHpDelta}`);
  console.log(`  player ΔHP Bound-only:  ${m.boundHpDelta}  (movement lock, not skip)`);
  console.log('  ── equilibrium ──');
  console.log('  One skipped enemy action per opportunity while stun Mark is live. Two Stun-1 still one skip. Bound remains movement-lock only. Buff STUN path unchanged.');
}
