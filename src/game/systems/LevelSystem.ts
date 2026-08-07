/**
 * Level System — Pure level-up and stat-assignment logic (F1)
 * ============================================================================
 * - Each level grants exactly 1 unspentStatPoint (no CLAN_GROWTH).
 * - Full HP/Chakra heal only via finalizeLevelUpResources after all points spent.
 * - Shared by live game (App) and Campaign Simulator.
 */

import { Player, PrimaryAttributes, PrimaryStat } from '../types';
import { getPlayerFullStats } from './StatSystem';

const PRIMARY_KEYS: (keyof PrimaryAttributes)[] = [
  'willpower',
  'chakra',
  'strength',
  'spirit',
  'intelligence',
  'calmness',
  'speed',
  'accuracy',
  'dexterity',
];

/**
 * Apply pending level-ups: grant unspent points only. No auto-stat growth, no heal.
 */
export function applyLevelUp(player: Player): Player {
  let p = { ...player, primaryStats: { ...player.primaryStats } };
  let levelsGained = 0;

  while (p.exp >= p.maxExp) {
    const newLevel = p.level + 1;
    levelsGained += 1;
    p = {
      ...p,
      exp: p.exp - p.maxExp,
      level: newLevel,
      maxExp: newLevel * 100,
      unspentStatPoints: (p.unspentStatPoints ?? 0) + 1,
    };
  }

  if (levelsGained > 0) {
    const stats = getPlayerFullStats(p);
    p = {
      ...p,
      currentHp: stats.derived.maxHp,
      currentChakra: stats.derived.maxChakra,
    };
  }

  return levelsGained > 0 ? p : player;
}

/**
 * Spend unspent points into primaries. Allocation values are points to add
 * (non-negative). Total allocation must equal unspentStatPoints.
 * Returns null if invalid.
 */
export function assignStatPoints(
  player: Player,
  allocation: Partial<PrimaryAttributes>
): Player | null {
  const unspent = player.unspentStatPoints ?? 0;
  let total = 0;
  for (const key of PRIMARY_KEYS) {
    const v = allocation[key] ?? 0;
    if (v < 0 || !Number.isFinite(v) || !Number.isInteger(v)) return null;
    total += v;
  }
  if (total !== unspent) return null;

  const primaryStats = { ...player.primaryStats };
  for (const key of PRIMARY_KEYS) {
    const add = allocation[key] ?? 0;
    primaryStats[key] = Math.max(1, primaryStats[key] + add);
  }

  return {
    ...player,
    primaryStats,
    unspentStatPoints: 0,
  };
}

/**
 * After all unspent points are spent: refill HP and Chakra to new maxima.
 */
export function finalizeLevelUpResources(player: Player): Player {
  if ((player.unspentStatPoints ?? 0) > 0) {
    return player;
  }
  const stats = getPlayerFullStats(player);
  return {
    ...player,
    currentHp: stats.derived.maxHp,
    currentChakra: stats.derived.maxChakra,
  };
}

/**
 * Sim/auto policy: dump all unspent points into clan affinity stats (first two
 * highest among starting affinities), then remainder into willpower.
 */
export function autoAssignUnspentStatPoints(player: Player): Player {
  let p = player;
  while ((p.unspentStatPoints ?? 0) > 0) {
    const points = p.unspentStatPoints;
    // Prefer willpower for survivability in sims
    const alloc: Partial<PrimaryAttributes> = { willpower: points };
    const next = assignStatPoints(p, alloc);
    if (!next) break;
    p = finalizeLevelUpResources(next);
  }
  return p;
}

export function primaryStatKey(stat: PrimaryStat): keyof PrimaryAttributes {
  return stat.toLowerCase() as keyof PrimaryAttributes;
}
