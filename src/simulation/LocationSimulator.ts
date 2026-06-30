/**
 * Location Simulator - Attrition-aware "clear a whole location" engine
 * =============================================================================
 *
 * WHY THIS EXISTS (T-006 Phase B.1)
 *
 * The real unit of difficulty in SHINOBI WAY is not a single full-HP 1v1 — it is
 * surviving an entire LOCATION: a sequence of rooms (combats, rests, events…)
 * whose length scales with the location's `dangerLevel`. The 1v1 sim
 * (`BattleSimulator`) reports ~100% win rates precisely because it ignores the
 * HP/chakra attrition that accumulates across a run. This simulator measures the
 * thing that actually matters: the **clear rate** of a location and how much HP
 * the player has left when they reach the exit.
 *
 * HOW IT REUSES THE REAL GAME
 *
 * - Rooms, activities and per-room enemies come from the REAL generator
 *   (`LocationSystem.generateBranchingFloorFromConfig`) and we drive the REAL
 *   navigation state machine (`moveToRoom` / `completeActivity` /
 *   `getCurrentActivity`). So the activity mix, the per-room enemy scaling, and
 *   the exit Guardian are exactly what a player faces in-game.
 * - Each combat is resolved by the REAL battle engine (`resolveBattle`, the seam
 *   extracted from `simulateBattle`), entered with the player's CURRENT HP/chakra
 *   rather than a fresh full pool. The base combat math is untouched.
 *
 * STATE CARRY-OVER MODEL (documented design decisions)
 *
 * - HP and chakra PERSIST across rooms — they are the attrition pools.
 * - Every combat is a FRESH encounter, mirroring the real game's `startCombat`
 *   (useCombat.ts): cooldowns reset to 0, toggles deactivated, combat buffs
 *   cleared, deck rebuilt, posture BALANCED, AP refilled. Only HP/chakra carry.
 * - REST heals `floor(maxHp × healPercent/100)` HP and
 *   `floor(maxChakra × chakraRestorePercent/100)` chakra (capped), exactly like
 *   `useActivityHandler` rest. The percentages come from the real room generator
 *   (30-50% HP, 40-60% chakra).
 * - combat, eliteChallenge and the exit Guardian are FOUGHT (mandatory attrition;
 *   eliteChallenge is gated by `config.fightEliteChallenges`, default on).
 * - merchant / event / treasure / training / scrollDiscovery / infoGathering are
 *   treated as NEUTRAL (marked complete, no effect). The instrument's focus is
 *   the combat-attrition + rest-recovery loop, not economy.
 * - Enemy scaling is driven by `effectiveFloor = dangerToFloor(dangerLevel,
 *   baseDifficulty)`, exactly as the live game (the room generator re-derives a
 *   floor-based danger from it). `locationsCleared` is 0 — the start-of-region
 *   baseline.
 *
 * Deterministic per seed: all randomness (floor generation + combat) draws from
 * the globally-installed seeded `Math.random` (see seededRandom.ts).
 */

import {
  Player,
  Enemy,
  BranchingFloor,
  BranchingRoom,
  RoomActivities,
} from '../game/types';
import {
  generateBranchingFloorFromConfig,
  getCurrentActivity,
  completeActivity,
  moveToRoom,
  getCurrentRoom,
  getChildRooms,
  getRoomById,
  generateChildrenForRoom,
  getArcNameFromFloor,
} from '../game/systems/LocationSystem';
import { dangerToFloor } from '../game/systems/ScalingSystem';
import { getStoryArcByName } from '../game/systems/EnemySystem';
import { getPlayerFullStats } from '../game/systems/StatSystem';
import { createSimPlayer, resolveBattle } from './BattleSimulator';
import { PlayerBuildConfig, SimulationConfig, DEFAULT_CONFIG } from './types';

// ============================================================================
// CONFIG & RESULT TYPES
// ============================================================================

export interface LocationRunConfig {
  /** Region-wide base difficulty modifier (0-100). Drives effectiveFloor. */
  baseDifficulty: number;
  /** Player level used to build the clan stats. */
  playerLevel: number;
  /** Per-battle turn cap (stalemate guard). */
  maxTurnsPerBattle: number;
  /** Hard cap on rooms traversed per run (infinite-loop guard). */
  maxRoomsPerRun: number;
  /** Whether the (optional, in-game escapable) eliteChallenge rooms are fought. */
  fightEliteChallenges: boolean;
}

export const DEFAULT_LOCATION_CONFIG: LocationRunConfig = {
  baseDifficulty: 40,
  playerLevel: 10,
  maxTurnsPerBattle: 100,
  maxRoomsPerRun: 40,
  fightEliteChallenges: true,
};

/**
 * How a single location run terminated.
 * - 'cleared'    : the player beat the EXIT room. This is the ONLY outcome that
 *                  counts toward clearRate.
 * - 'died'       : the player lost a battle (HP hit 0, or a turn-cap stalemate).
 * - 'incomplete' : a SAFETY VALVE fired (room cap reached, or navigation hit a
 *                  dead-end) — the run never reached the exit and never died.
 *                  Deliberately NOT a clear: counting it would inflate clearRate
 *                  and bias the B.2 health tuning that calibrates against it.
 */
export type LocationRunOutcome = 'cleared' | 'died' | 'incomplete';

export interface LocationRunResult {
  /** How the run terminated. Only 'cleared' counts toward clearRate. */
  outcome: LocationRunOutcome;
  /** Number of rooms fully cleared before the run ended. */
  roomsSurvived: number;
  /** 1-based index of the room where the player DIED, or null otherwise. */
  deathRoom: number | null;
  /** HP fraction (0-1) remaining when the run ended (0 on death). */
  hpPctRemaining: number;
  /** Number of combat encounters resolved during the run. */
  combats: number;
}

export interface LocationAggregate {
  buildName: string;
  dangerLevel: number;
  runs: number;
  /** Fraction of runs that cleared the location — EXIT-room victories only (0-1). */
  clearRate: number;
  /**
   * Fraction of runs that ended via a safety valve (room cap / navigation
   * dead-end) without clearing or dying (0-1). Surfaced for transparency: a
   * non-trivial value means the instrument is bailing out instead of measuring a
   * real clear, and would otherwise have silently inflated clearRate.
   */
  incompleteRate: number;
  /** Average rooms survived across all runs. */
  avgRoomsSurvived: number;
  /** Average HP fraction remaining, over CLEARED runs only (0-1). */
  avgHpPctRemainingOnClear: number;
  /** Average combats fought per run. */
  avgCombats: number;
  /** Most common failure room across failed runs (null if none failed). */
  mostCommonDeathRoom: number | null;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Prepare the persistent player for a FRESH combat encounter (mirrors the real
 * game's startCombat): clear combat buffs, reset cooldowns, deactivate toggles.
 * HP/chakra are preserved — they are the attrition pools that carry over.
 */
function prepareForCombat(player: Player): Player {
  return {
    ...player,
    activeBuffs: [],
    skills: player.skills.map(s => ({ ...s, currentCooldown: 0, isActive: false })),
  };
}

/**
 * Pick the next room to move into. Deterministic: if the floor's exit room has
 * been generated, navigate toward it (walk up the exit's parent chain to the
 * child of `current` that leads there); otherwise take the first child.
 */
function pickNextRoom(
  floor: BranchingFloor,
  current: BranchingRoom,
  children: BranchingRoom[]
): BranchingRoom {
  if (floor.exitRoomId) {
    let node: BranchingRoom | undefined = getRoomById(floor, floor.exitRoomId);
    while (node && node.parentId && node.parentId !== current.id) {
      node = getRoomById(floor, node.parentId);
    }
    if (node && node.parentId === current.id) {
      const childTowardExit = children.find(c => c.id === node!.id);
      if (childTowardExit) return childTowardExit;
    }
  }
  return children[0];
}

// ============================================================================
// SINGLE RUN
// ============================================================================

/**
 * Simulate a single location clear attempt with state carry-over.
 *
 * @param build - Player build config (clan/stats/skills).
 * @param dangerLevel - Location danger level (1-7) — sets length & enemy scaling.
 * @param config - Location run config.
 * @param runId - Run index (only used to vary battle ids; does not affect RNG).
 */
export function simulateLocationRun(
  build: PlayerBuildConfig,
  dangerLevel: number,
  config: LocationRunConfig = DEFAULT_LOCATION_CONFIG,
  runId: number = 0
): LocationRunResult {
  // Build the player ONCE; HP/chakra carry across rooms from here on.
  let player = createSimPlayer({ ...build, level: config.playerLevel });
  const derived = getPlayerFullStats(player).derived;
  const maxHp = derived.maxHp;
  const maxChakra = derived.maxChakra;

  const effectiveFloor = dangerToFloor(dangerLevel, config.baseDifficulty);
  // Arc is cosmetic only (enemy NAME pools/theming, never stats). Reuse the real
  // game's mapping so the two never drift (LocationSystem.getArcNameFromFloor).
  const arc = getStoryArcByName(getArcNameFromFloor(effectiveFloor));

  // Per-battle config (floorNumber only feeds the terrain fallback, which we
  // bypass by passing each room's real terrain; difficulty feeds nothing here
  // because room enemies are pre-generated by the floor generator).
  const battleConfig: SimulationConfig = {
    ...DEFAULT_CONFIG,
    maxTurnsPerBattle: config.maxTurnsPerBattle,
    playerLevel: config.playerLevel,
    floorNumber: effectiveFloor,
    difficulty: config.baseDifficulty,
  };

  let floor = generateBranchingFloorFromConfig({
    floor: effectiveFloor,
    arc: arc.name,
    biome: arc.biome,
    dangerLevel: dangerLevel as 1 | 2 | 3 | 4 | 5 | 6 | 7,
    wealthLevel: 4,
    roomGenerationMode: 'dynamic',
    targetRoomCount: 10,
    difficulty: config.baseDifficulty,
    initialIntel: 0,
    player,
  });

  let current = getCurrentRoom(floor);
  let combats = 0;
  let roomIndex = 0;
  let battleSeq = 0;

  while (current) {
    roomIndex++;

    // ── Process every activity in this room, in order ──
    let activityKey: keyof RoomActivities | null;
    while ((activityKey = getCurrentActivity(current)) !== null) {
      const acts = current.activities;
      let died = false;

      if (activityKey === 'combat' || activityKey === 'eliteChallenge') {
        const skipOptionalElite =
          activityKey === 'eliteChallenge' && !config.fightEliteChallenges;
        if (!skipOptionalElite) {
          const enemy: Enemy =
            activityKey === 'combat' ? acts.combat!.enemy : acts.eliteChallenge!.enemy;

          const res = resolveBattle(
            prepareForCombat(player),
            enemy,
            battleConfig,
            runId * 10000 + battleSeq++,
            null,
            current.terrain
          );
          combats++;

          if (!res.result.won) {
            died = true; // death, or rare turn-cap stalemate → run ends here
          } else {
            player = {
              ...player,
              currentHp: res.result.playerFinalHp,
              currentChakra: res.playerFinalChakra,
            };
          }
        }
      } else if (activityKey === 'rest') {
        const rest = acts.rest!;
        const hpHeal = Math.floor(maxHp * (rest.healPercent / 100));
        const chakraHeal = Math.floor(maxChakra * (rest.chakraRestorePercent / 100));
        player = {
          ...player,
          currentHp: Math.min(maxHp, player.currentHp + hpHeal),
          currentChakra: Math.min(maxChakra, player.currentChakra + chakraHeal),
        };
      }
      // All other activities are neutral: just mark them complete.

      if (died) {
        return {
          outcome: 'died',
          roomsSurvived: roomIndex - 1,
          deathRoom: roomIndex,
          hpPctRemaining: 0,
          combats,
        };
      }

      floor = completeActivity(floor, current.id, activityKey);
      const refreshed = getCurrentRoom(floor);
      if (!refreshed) break;
      current = refreshed;
    }

    // ── Room cleared. Exit room? Location is done — a TRUE clear. ──
    if (current.isExit) {
      return {
        outcome: 'cleared',
        roomsSurvived: roomIndex,
        deathRoom: null,
        hpPctRemaining: Math.max(0, Math.min(1, player.currentHp / maxHp)),
        combats,
      };
    }

    // ── Move forward to a child room (generating children if needed). ──
    let children = getChildRooms(floor, current.id);
    if (children.length === 0) {
      floor = generateChildrenForRoom(floor, current.id, player);
      children = getChildRooms(floor, current.id);
    }
    if (children.length === 0) break; // safety: nowhere to go

    const next = pickNextRoom(floor, current, children);
    floor = moveToRoom(floor, next.id, player);
    const moved = getCurrentRoom(floor);
    if (!moved || moved.id === current.id) break; // safety: could not move
    current = moved;

    if (roomIndex >= config.maxRoomsPerRun) {
      // Safety valve (effectively never hit: exit prob caps at 80% and ramps).
      // Surviving this many rooms WITHOUT beating the exit is NOT a real clear —
      // mark it 'incomplete' so it cannot inflate clearRate (B.2 tunes on that).
      return {
        outcome: 'incomplete',
        roomsSurvived: roomIndex,
        deathRoom: null,
        hpPctRemaining: Math.max(0, Math.min(1, player.currentHp / maxHp)),
        combats,
      };
    }
  }

  // Navigation dead-end (no children / could not move) without dying and without
  // reaching the exit. This is a safety-valve termination, NOT a clear — marked
  // 'incomplete' so clearRate counts only genuine exit-room victories.
  return {
    outcome: 'incomplete',
    roomsSurvived: roomIndex,
    deathRoom: null,
    hpPctRemaining: Math.max(0, Math.min(1, player.currentHp / maxHp)),
    combats,
  };
}

// ============================================================================
// AGGREGATION
// ============================================================================

/**
 * Run N location attempts for one build at one danger level and aggregate.
 */
export function simulateLocationRuns(
  build: PlayerBuildConfig,
  dangerLevel: number,
  n: number,
  config: LocationRunConfig = DEFAULT_LOCATION_CONFIG
): LocationAggregate {
  const runs: LocationRunResult[] = [];
  for (let i = 0; i < n; i++) {
    runs.push(simulateLocationRun(build, dangerLevel, config, i));
  }

  const cleared = runs.filter(r => r.outcome === 'cleared');
  const died = runs.filter(r => r.outcome === 'died');
  const incomplete = runs.filter(r => r.outcome === 'incomplete');

  const avg = (vals: number[]): number =>
    vals.length === 0 ? 0 : vals.reduce((a, b) => a + b, 0) / vals.length;

  // Mode of the failure room — over DEATHS only. Incomplete runs never set a
  // deathRoom, so they must not pollute this stat with a phantom "room 0".
  let mostCommonDeathRoom: number | null = null;
  if (died.length > 0) {
    const counts = new Map<number, number>();
    for (const r of died) {
      const room = r.deathRoom ?? 0;
      counts.set(room, (counts.get(room) ?? 0) + 1);
    }
    let bestRoom = Infinity;
    let bestCount = -1;
    for (const [room, count] of counts) {
      if (count > bestCount || (count === bestCount && room < bestRoom)) {
        bestRoom = room;
        bestCount = count;
      }
    }
    mostCommonDeathRoom = bestRoom;
  }

  return {
    buildName: build.name,
    dangerLevel,
    runs: n,
    clearRate: n === 0 ? 0 : cleared.length / n,
    incompleteRate: n === 0 ? 0 : incomplete.length / n,
    avgRoomsSurvived: avg(runs.map(r => r.roomsSurvived)),
    avgHpPctRemainingOnClear: avg(cleared.map(r => r.hpPctRemaining)),
    avgCombats: avg(runs.map(r => r.combats)),
    mostCommonDeathRoom,
  };
}

// ============================================================================
// REPORTER (Location Clear section)
// ============================================================================

function pctCell(value: number): string {
  return (value * 100).toFixed(0) + '%';
}

/**
 * Print the "Location Clear" report: clear-rate and HP%-remaining matrices
 * (build rows × dangerLevel columns), plus the per-cell health summary.
 *
 * HEALTH METRIC (target, documented — NOT enforced here; that is Phase B.2):
 * a location should be clearable but risky — roughly clearRate 50-85% with
 * meaningful HP lost — never a trivial 100% nor an impossible 0%.
 */
export function printLocationReport(
  aggregates: LocationAggregate[],
  meta: { seed: number; runsPerCell: number; config: LocationRunConfig }
): void {
  const dangerLevels = [...new Set(aggregates.map(a => a.dangerLevel))].sort((a, b) => a - b);
  const buildNames = [...new Set(aggregates.map(a => a.buildName))];

  const cell = (build: string, danger: number): LocationAggregate | undefined =>
    aggregates.find(a => a.buildName === build && a.dangerLevel === danger);

  const line = '='.repeat(72);
  console.log('\n' + line);
  console.log('LOCATION CLEAR  (attrition: full location run per build × dangerLevel)');
  console.log(line);
  console.log(`  Seed: ${meta.seed}   Runs/cell: ${meta.runsPerCell}   baseDifficulty: ${meta.config.baseDifficulty}`);
  console.log(`  Player level: ${meta.config.playerLevel}   Fight elite challenges: ${meta.config.fightEliteChallenges}`);
  console.log('  Health target (B.2 will tune): clearRate ~50-85% with meaningful HP lost.');

  const buildCol = 20;
  const statCol = 8;

  const header = (label: string): string => {
    let h = label.padEnd(buildCol);
    for (const d of dangerLevels) h += ('D' + d).padStart(statCol);
    return h;
  };

  // ── Matrix 1: clear rate ──
  console.log('\nCLEAR RATE (% of runs that cleared the location):');
  console.log(header('BUILD'));
  console.log('-'.repeat(buildCol + statCol * dangerLevels.length));
  for (const build of buildNames) {
    let row = build.slice(0, buildCol - 1).padEnd(buildCol);
    for (const d of dangerLevels) {
      const c = cell(build, d);
      row += (c ? pctCell(c.clearRate) : '-').padStart(statCol);
    }
    console.log(row);
  }

  // ── Matrix 2: HP% remaining on clear ──
  console.log('\nAVG HP% REMAINING ON CLEAR (how risky a successful clear is):');
  console.log(header('BUILD'));
  console.log('-'.repeat(buildCol + statCol * dangerLevels.length));
  for (const build of buildNames) {
    let row = build.slice(0, buildCol - 1).padEnd(buildCol);
    for (const d of dangerLevels) {
      const c = cell(build, d);
      row += (c && c.clearRate > 0 ? pctCell(c.avgHpPctRemainingOnClear) : '-').padStart(statCol);
    }
    console.log(row);
  }

  // ── Per-cell detail (rooms survived, combats, common death room) ──
  console.log('\nDETAIL (avg rooms survived / avg combats / most common death room):');
  for (const build of buildNames) {
    console.log(`  ${build}:`);
    for (const d of dangerLevels) {
      const c = cell(build, d);
      if (!c) continue;
      const death = c.mostCommonDeathRoom === null ? 'none' : `room ${c.mostCommonDeathRoom}`;
      console.log(
        `    D${d}: clear ${pctCell(c.clearRate).padStart(4)} | ` +
        `rooms ${c.avgRoomsSurvived.toFixed(1).padStart(4)} | ` +
        `combats ${c.avgCombats.toFixed(1).padStart(4)} | ` +
        `hp@clear ${(c.avgHpPctRemainingOnClear * 100).toFixed(0).padStart(3)}% | ` +
        `incomplete ${pctCell(c.incompleteRate).padStart(4)} | ` +
        `deaths ${death}`
      );
    }
  }

  console.log('\n' + line);
  console.log('END LOCATION CLEAR');
  console.log(line + '\n');
}
