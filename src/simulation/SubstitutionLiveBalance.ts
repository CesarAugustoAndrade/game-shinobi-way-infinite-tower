/**
 * T-143 probe — live Substitution nullifies first enemy hit + retreat vs decorative unused mark.
 */

import { AttackMethod, CombatActor, CombatRange, MarkFamily, Posture } from '../game/types';
import { calculateDerivedStats } from '../game/systems/StatSystem';
import { executeEnemyAction } from '../game/systems/EnemyTurnSystem';
import { SUBSTITUTION_MARK_ID } from '../game/systems/MarkSystem';
import type { CombatState } from '../game/systems/combat-types';
import type { Mark } from '../game/types';
import { BASE_STATS, createMockEnemy, createMockPlayer, createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface SubstitutionLiveProbe {
  live: boolean;
  absent: boolean;
  once: boolean;
  metrics: {
    hpBareLoss: number;
    hpArmedLoss: number;
    hpSecondLoss: number;
    rangeArmed: CombatRange | undefined;
    leftoverAfterFirst: boolean;
  };
}

function substitutionMark(): Mark {
  return {
    id: SUBSTITUTION_MARK_ID,
    sourceSkillId: 'kawarimi',
    owner: CombatActor.PLAYER,
    target: CombatActor.PLAYER,
    duration: 2,
    stacks: 1,
    family: MarkFamily.STAT,
  };
}

const stats = {
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

function enemy() {
  const strike = createMockSkill({
    id: 'strike',
    name: 'Strike',
    attackMethod: AttackMethod.AUTO,
    allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
    apCost: 2,
    baseDamage: 20,
    scalingPerPoint: 0,
  });
  return createMockEnemy({
    skills: [strike],
    currentHp: 10_000,
    preferredRange: CombatRange.CLOSE,
    activeBuffs: [],
  });
}

export function runSubstitutionLiveProbe(): SubstitutionLiveProbe {
  const rng = Math.random;
  Math.random = () => 0.01;
  try {
    const playerHp = 400;
    const player = () => createMockPlayer({ currentHp: playerHp, activeBuffs: [] });
    const bare = executeEnemyAction(player(), stats, enemy(), stats, guts, { ...close, marks: [] });
    const armed = executeEnemyAction(
      player(),
      stats,
      enemy(),
      stats,
      guts,
      { ...close, marks: [substitutionMark()] },
    );
    const second = executeEnemyAction(
      armed.player,
      stats,
      enemy(),
      stats,
      guts,
      {
        ...close,
        currentRange: armed.currentRange ?? CombatRange.MEDIUM,
        marks: armed.marks ?? [],
      },
    );
    const hpBareLoss = playerHp - bare.player.currentHp;
    const hpArmedLoss = playerHp - armed.player.currentHp;
    const hpSecondLoss = armed.player.currentHp - second.player.currentHp;
    return {
      live:
        hpArmedLoss === 0 &&
        armed.currentRange === CombatRange.MEDIUM &&
        !(armed.marks ?? []).some((m) => m.id === SUBSTITUTION_MARK_ID),
      absent: hpBareLoss > 0 && bare.currentRange === CombatRange.CLOSE,
      once: hpSecondLoss > 0,
      metrics: {
        hpBareLoss,
        hpArmedLoss,
        hpSecondLoss,
        rangeArmed: armed.currentRange,
        leftoverAfterFirst: (armed.marks ?? []).some((m) => m.id === SUBSTITUTION_MARK_ID),
      },
    };
  } finally {
    Math.random = rng;
  }
}

export function printSubstitutionLiveProbe(probe: SubstitutionLiveProbe): void {
  const m = probe.metrics;
  console.log('\n── T-143 Substitution live probe ──');
  console.log(`  first hit ignored + retreat: ${probe.live}`);
  console.log(`  absent takes damage:         ${probe.absent}`);
  console.log(`  second hit not ignored:      ${probe.once}`);
  console.log('  ── balance vs decorative unused Substitution ──');
  console.log(`  HP loss bare / armed / 2nd: ${m.hpBareLoss} / ${m.hpArmedLoss} / ${m.hpSecondLoss}  (armed was ${m.hpBareLoss})`);
  console.log(`  range after armed:          ${m.rangeArmed}  (CLOSE → MEDIUM)`);
  console.log(`  leftover after first:       ${m.leftoverAfterFirst}`);
  console.log('  ── equilibrium ──');
  console.log('  One ignored hit + forced retreat 1. Not Shield. Manual move unused. Second hit full.');
}
