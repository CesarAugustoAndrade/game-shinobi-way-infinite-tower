/**
 * T-084 probe — live enemy ON_MOVE tripwire + Fear once-cut vs uncut outgoing.
 */

import {
  AttackMethod,
  CombatActor,
  CombatRange,
  CombatTrigger,
  MarkConsumeTiming,
  MarkFamily,
  Posture,
} from '../game/types';
import { calculateDerivedStats } from '../game/systems/StatSystem';
import { executeEnemyAction } from '../game/systems/EnemyTurnSystem';
import {
  applyFearOutgoing,
  TRIPWIRE_DAMAGE,
  TRIPWIRE_MARK_ID,
} from '../game/systems/MarkSystem';
import type { CombatState } from '../game/systems/combat-types';
import { BASE_STATS, createMockEnemy, createMockPlayer, createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface LiveReactionsProbe {
  tripwireFires: boolean;
  fearOnce: boolean;
  metrics: {
    tripwireChip: number;
    expectedChip: number;
    cleanOutgoing: number;
    fearedOutgoing: number;
    expectedFeared: number;
    fearCutPct: number;
    fearConsumed: boolean;
    secondHitEqualsClean: boolean;
  };
}

const stats = {
  primary: BASE_STATS,
  effectivePrimary: BASE_STATS,
  derived: calculateDerivedStats(BASE_STATS, {}),
};

const combat = (overrides: Partial<CombatState> = {}): CombatState => ({
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
  ...overrides,
});

export function runLiveReactionsProbe(): LiveReactionsProbe {
  const rng = Math.random;
  Math.random = () => 0.99;
  try {
    const melee = createMockSkill({
      id: 'melee',
      name: 'Close Cut',
      attackMethod: AttackMethod.MELEE,
      allowedRanges: [CombatRange.CLOSE],
      apCost: 2,
    });
    const startHp = 80;
    const trip = executeEnemyAction(
      createMockPlayer({ currentHp: 10_000 }),
      stats,
      createMockEnemy({
        skills: [melee],
        currentHp: startHp,
        archetype: 'TANK',
        preferredRange: CombatRange.CLOSE,
      }),
      stats,
      { triggered: false, artifactTriggered: false },
      combat({
        currentRange: CombatRange.LONG,
        marks: [
          {
            id: TRIPWIRE_MARK_ID,
            sourceSkillId: 'tripwire_perimeter',
            owner: CombatActor.PLAYER,
            target: CombatActor.ENEMY,
            duration: 2,
            stacks: 1,
            family: MarkFamily.STAT,
            consume: MarkConsumeTiming.NONE,
            trigger: CombatTrigger.ON_MOVE,
          },
        ],
      }),
    );
    const tripwireChip = startHp - trip.enemy.currentHp;

    const strike = createMockSkill({
      id: 'strike',
      name: 'Strike',
      attackMethod: AttackMethod.AUTO,
      allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
      apCost: 2,
      baseDamage: 20,
      scalingPerPoint: 0,
    });
    const playerHp = 400;
    const fearMark = {
      id: 'fear',
      sourceSkillId: 'hell_viewing',
      owner: CombatActor.PLAYER,
      target: CombatActor.ENEMY,
      duration: 1,
      stacks: 20,
      family: MarkFamily.STAT,
      consume: MarkConsumeTiming.NONE,
    };
    const close = combat({ currentRange: CombatRange.CLOSE, isFirstTurn: false });
    const enemy = () =>
      createMockEnemy({
        skills: [strike],
        currentHp: 10_000,
        preferredRange: CombatRange.CLOSE,
      });
    const player = () => createMockPlayer({ currentHp: playerHp, activeBuffs: [] });
    const guts = { triggered: false, artifactTriggered: false };
    const clean = executeEnemyAction(player(), stats, enemy(), stats, guts, { ...close, marks: [] });
    const feared = executeEnemyAction(player(), stats, enemy(), stats, guts, {
      ...close,
      marks: [fearMark],
    });
    const cleanOutgoing = playerHp - clean.player.currentHp;
    const fearedOutgoing = playerHp - feared.player.currentHp;
    const expectedFeared = applyFearOutgoing(cleanOutgoing, [fearMark]).damage;
    const second = executeEnemyAction(player(), stats, enemy(), stats, guts, {
      ...close,
      marks: feared.marks ?? [],
    });
    const secondOutgoing = playerHp - second.player.currentHp;

    return {
      tripwireFires:
        trip.enemyMoveUsedThisTurn === true &&
        tripwireChip === TRIPWIRE_DAMAGE &&
        trip.marks?.some((mark) => mark.id === TRIPWIRE_MARK_ID) !== true,
      fearOnce:
        cleanOutgoing > 0 &&
        fearedOutgoing === expectedFeared &&
        feared.marks?.some((mark) => mark.id === 'fear') !== true &&
        secondOutgoing === cleanOutgoing,
      metrics: {
        tripwireChip,
        expectedChip: TRIPWIRE_DAMAGE,
        cleanOutgoing,
        fearedOutgoing,
        expectedFeared,
        fearCutPct: cleanOutgoing > 0 ? Math.round((1 - fearedOutgoing / cleanOutgoing) * 100) : 0,
        fearConsumed: feared.marks?.some((mark) => mark.id === 'fear') !== true,
        secondHitEqualsClean: secondOutgoing === cleanOutgoing,
      },
    };
  } finally {
    Math.random = rng;
  }
}

export function printLiveReactionsProbe(probe: LiveReactionsProbe): void {
  const m = probe.metrics;
  console.log('\n── T-084 live ON_MOVE / Fear outgoing probe ──');
  console.log(`  tripwire live fire:     ${probe.tripwireFires}  (chip ${m.tripwireChip} / expected ${m.expectedChip})`);
  console.log(`  fear once-cut:          ${probe.fearOnce}  (${m.cleanOutgoing} → ${m.fearedOutgoing}, −${m.fearCutPct}%)`);
  console.log('  ── balance vs uncut / no-trip ──');
  console.log(`  tripwire chip:          ${m.tripwireChip}  (was 0 if live move ignored ON_MOVE)`);
  console.log(`  clean outgoing:         ${m.cleanOutgoing}`);
  console.log(`  feared outgoing:        ${m.fearedOutgoing}  (expected ${m.expectedFeared})`);
  console.log(`  fear consumed:          ${m.fearConsumed}  (second hit clean: ${m.secondHitEqualsClean})`);
}
