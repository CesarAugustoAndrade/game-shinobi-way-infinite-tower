/**
 * T-135 probe — Shield Marks absorb before HP vs unused decorative Marks.
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
import { absorbWithShieldMarks } from '../game/systems/MarkSystem';
import type { CombatState } from '../game/systems/combat-types';
import type { Mark } from '../game/types';
import {
  BASE_STATS,
  createMockEnemy,
  createMockPlayer,
  createMockSkill,
} from '../game/systems/__tests__/testFixtures';

export interface ShieldMarksLiveProbe {
  absorb: boolean;
  deplete: boolean;
  live: boolean;
  metrics: {
    absorbRemainStacks: number;
    absorbRemainDmg: number;
    depleteDmg: number;
    liveBareLoss: number;
    liveShieldLoss: number;
  };
}

function shieldMark(stacks: number): Mark {
  return {
    id: 'mud_wall_shield',
    sourceSkillId: 'mud_wall',
    owner: CombatActor.PLAYER,
    target: CombatActor.PLAYER,
    duration: 99,
    stacks,
    family: MarkFamily.SHIELD,
  };
}

export function runShieldMarksLiveProbe(): ShieldMarksLiveProbe {
  const absorb = absorbWithShieldMarks(20, [shieldMark(35)]);
  const deplete = absorbWithShieldMarks(40, [shieldMark(35)]);

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
  const strike = createMockSkill({
    id: 'strike',
    attackMethod: AttackMethod.AUTO,
    allowedRanges: [CombatRange.CLOSE],
    apCost: 2,
    baseDamage: 20,
    scalingPerPoint: 0,
  });
  const playerHp = 400;
  const enemy = createMockEnemy({
    skills: [strike],
    currentHp: 10_000,
    preferredRange: CombatRange.CLOSE,
    activeBuffs: [],
  });
  const player = createMockPlayer({ currentHp: playerHp, activeBuffs: [] });
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
  const orig = Math.random;
  Math.random = () => 0.01;
  const bare = executeEnemyAction(player, playerStats, enemy, enemyStats, guts, {
    ...combat,
    marks: [],
  });
  const shielded = executeEnemyAction(player, playerStats, enemy, enemyStats, guts, {
    ...combat,
    marks: [shieldMark(35)],
  });
  Math.random = orig;
  const liveBareLoss = playerHp - bare.player.currentHp;
  const liveShieldLoss = playerHp - shielded.player.currentHp;
  return {
    absorb: absorb.damage === 0 && absorb.marks[0]?.stacks === 15,
    deplete: deplete.damage === 5 && deplete.marks.length === 0,
    live: liveBareLoss > liveShieldLoss,
    metrics: {
      absorbRemainStacks: absorb.marks[0]?.stacks ?? -1,
      absorbRemainDmg: absorb.damage,
      depleteDmg: deplete.damage,
      liveBareLoss,
      liveShieldLoss,
    },
  };
}

export function printShieldMarksLiveProbe(probe: ShieldMarksLiveProbe): void {
  const m = probe.metrics;
  console.log('\n── T-135 Shield Marks live probe ──');
  console.log(`  absorb 20 vs 35 → 0 dmg / 15 stacks: ${probe.absorb}`);
  console.log(`  deplete 40 vs 35 → 5 dmg / strip:    ${probe.deplete}`);
  console.log(`  live HP loss reduced vs control:     ${probe.live}`);
  console.log('  ── balance vs decorative unused Shield Marks ──');
  console.log(`  remain stacks / dmg: ${m.absorbRemainStacks} / ${m.absorbRemainDmg}  (was 35 stacks unused, 20 HP)`);
  console.log(`  overflow dmg:        ${m.depleteDmg}  (was 40 HP)`);
  console.log(`  live bare / shield:  ${m.liveBareLoss} / ${m.liveShieldLoss}  (was equal)`);
  console.log('  ── equilibrium ──');
  console.log('  Flat absorb-until-gone (Mud Wall 35). Honest vs buff SHIELD. Not % DR. Duration-99 breaks on stacks.');
}
