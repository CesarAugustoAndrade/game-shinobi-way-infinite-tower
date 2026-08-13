/**
 * CombatMetrics — R0 SOUL §15 balance hooks (T-009).
 * Counters stay 0 until a fixture/sim increments them.
 */

import type { ResolveSkillResult } from './ResolveSkillSystem';
import { CardRole } from '../types';

export interface SoulMetricBag {
  setupCompletion: number;
  deathDuringSetup: number;
  enhancedVsBase: number;
  modeLifetime: number;
  deadCardRate: number;
  weightInfluence: number;
  rangeReactions: number;
  payoffShare: number;
  upkeepFailure: number;
}

export function emptySoulMetrics(): SoulMetricBag {
  return {
    setupCompletion: 0,
    deathDuringSetup: 0,
    enhancedVsBase: 0,
    modeLifetime: 0,
    deadCardRate: 0,
    weightInfluence: 0,
    rangeReactions: 0,
    payoffShare: 0,
    upkeepFailure: 0,
  };
}

export function recordSoulMetric(
  bag: SoulMetricBag,
  key: keyof SoulMetricBag,
  delta: number = 1,
): SoulMetricBag {
  return { ...bag, [key]: bag[key] + delta };
}

/** Once-per-card artifact procs when ≥1 hit (SOUL multi-hit). */
export function artifactsOncePerCard(hitsLanded: number): boolean {
  return hitsLanded >= 1;
}

export function applyResolveToMetrics(
  bag: SoulMetricBag,
  result: ResolveSkillResult,
): SoulMetricBag {
  if (!result.ok) {
    return recordSoulMetric(bag, 'deadCardRate', 1);
  }
  let next = bag;
  if (result.role === CardRole.SUPPORT && result.state.marks.length > 0) {
    next = recordSoulMetric(next, 'setupCompletion', 1);
  }
  if (result.role === CardRole.ATTACK && result.hitsLanded >= 1) {
    next = recordSoulMetric(next, 'payoffShare', result.damageDealt);
  }
  if (result.reactions.length > 0) {
    next = recordSoulMetric(next, 'rangeReactions', result.reactions.length);
  }
  if (result.modeActivations > 0) {
    next = recordSoulMetric(next, 'modeLifetime', 1);
  }
  return next;
}
