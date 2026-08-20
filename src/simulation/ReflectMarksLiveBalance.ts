/**
 * T-134 probe — Mark reflect percent + live EnemyTurn thorns vs unused decorative marks.
 */

import {
  AttackMethod,
  CombatActor,
  CombatRange,
  MarkFamily,
  Posture,
} from '../game/types';
import { calculateDerivedStats } from '../game/systems/StatSystem';
import { executeEnemyAction } from '../game/systems/EnemyTurnSystem';
import {
  COUNTER_REFLECT_MARK_ID,
  reflectPercentFromMarks,
  ROTATION_REFLECT_MARK_ID,
} from '../game/systems/MarkSystem';
import type { CombatState } from '../game/systems/combat-types';
import type { Mark } from '../game/types';
import { BASE_STATS, createMockEnemy, createMockPlayer, createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface ReflectMarksLiveProbe {
  percent: boolean;
  rotation: boolean;
  live: boolean;
  metrics: {
    counterPercent: number;
    rotationPercent: number;
    emptyPercent: number;
    liveReflected: number;
    liveBareReflected: number;
  };
}

function selfMark(id: string, stacks: number): Mark {
  return {
    id,
    sourceSkillId: id,
    owner: CombatActor.PLAYER,
    target: CombatActor.PLAYER,
    duration: 1,
    stacks,
    family: MarkFamily.STAT,
  };
}

export function runReflectMarksLiveProbe(): ReflectMarksLiveProbe {
  const counter = reflectPercentFromMarks([selfMark(COUNTER_REFLECT_MARK_ID, 30)]);
  const rotation = reflectPercentFromMarks([selfMark(ROTATION_REFLECT_MARK_ID, 60)]);
  const empty = reflectPercentFromMarks([]);

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
  const melee = createMockSkill({
    id: 'melee',
    attackMethod: AttackMethod.MELEE,
    allowedRanges: [CombatRange.CLOSE],
    apCost: 2,
    baseDamage: 40,
    scalingPerPoint: 0,
  });
  const enemyHp = 10_000;
  const enemy = createMockEnemy({
    skills: [melee],
    currentHp: enemyHp,
    preferredRange: CombatRange.CLOSE,
    activeBuffs: [],
  });
  const player = createMockPlayer({ currentHp: 10_000, activeBuffs: [] });
  const combat = {
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
    marks: [] as Mark[],
  } satisfies CombatState;
  const guts = { triggered: false, artifactTriggered: false };
  const origRandom = Math.random;
  Math.random = () => 0.01;
  const bare = executeEnemyAction(player, playerStats, enemy, enemyStats, guts, {
    ...combat,
    marks: [],
  });
  const armed = executeEnemyAction(player, playerStats, enemy, enemyStats, guts, {
    ...combat,
    marks: [selfMark(COUNTER_REFLECT_MARK_ID, 30)],
  });
  Math.random = origRandom;
  const liveReflected = enemyHp - armed.enemy.currentHp;
  const liveBare = enemyHp - bare.enemy.currentHp;
  return {
    percent: counter.percent === 0.3 && empty.percent === 0,
    rotation: rotation.percent === 0.6,
    live:
      liveReflected > 0 &&
      liveBare === 0 &&
      armed.marks?.some((m) => m.id === COUNTER_REFLECT_MARK_ID) === false,
    metrics: {
      counterPercent: counter.percent,
      rotationPercent: rotation.percent,
      emptyPercent: empty.percent,
      liveReflected,
      liveBareReflected: liveBare,
    },
  };
}

export function printReflectMarksLiveProbe(probe: ReflectMarksLiveProbe): void {
  const m = probe.metrics;
  console.log('\n── T-134 Reflect Marks live probe ──');
  console.log(`  counter 30 → 0.3:     ${probe.percent}`);
  console.log(`  rotation 60 → 0.6:    ${probe.rotation}`);
  console.log(`  live MELEE thorns:    ${probe.live}`);
  console.log('  ── balance vs decorative unused Marks ──');
  console.log(`  counter percent:  ${m.counterPercent}  (was 0 live)`);
  console.log(`  rotation percent: ${m.rotationPercent}  (was 0 live)`);
  console.log(`  empty percent:    ${m.emptyPercent}`);
  console.log(`  live reflected:   ${m.liveReflected}  (was ${m.liveBareReflected})`);
  console.log('  ── equilibrium ──');
  console.log('  One-shot 30%/60% thorns on first qualifying hit. Completes Counter/Rotation honesty. Not a lasting DR aura.');
}
