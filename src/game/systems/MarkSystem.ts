/**
 * MarkSystem — R0 Tactical Setup (T-004 / SOUL §9).
 *
 * Marks are a first-class board beside Buffs. They never mutate Room Terrain.
 * Attempt consume: own marks, on commit (even if the action misses).
 * Impact consume: marks on the target tagged IMPACT, only if ≥1 hit landed.
 */

import {
  CombatActor,
  Mark,
  MarkConsumeTiming,
  MarkFamily,
  TerrainDefinition,
} from '../types';

export type TacticalSetup = readonly Mark[];

export function listMarks(
  setup: TacticalSetup,
  filter: { owner?: CombatActor; target?: CombatActor; id?: string } = {},
): Mark[] {
  return setup.filter((mark) => {
    if (filter.owner !== undefined && mark.owner !== filter.owner) return false;
    if (filter.target !== undefined && mark.target !== filter.target) return false;
    if (filter.id !== undefined && mark.id !== filter.id) return false;
    return true;
  });
}

export function clearMarks(_setup: TacticalSetup = []): Mark[] {
  return [];
}

function cloneMark(mark: Mark): Mark {
  return { ...mark };
}

/**
 * Add a mark. STAT same-id instances merge stacks (additive integers).
 * DOT / SHIELD / HARD_CONTROL coexist as separate instances.
 * `terrain` is returned unchanged — never written.
 */
export function addMark(
  setup: TacticalSetup,
  incoming: Mark,
  terrain?: TerrainDefinition,
): { marks: Mark[]; terrain?: TerrainDefinition } {
  const next = incoming.family === MarkFamily.STAT
    ? mergeStatMark(setup, incoming)
    : [...setup.map(cloneMark), cloneMark(incoming)];
  return { marks: next, terrain };
}

function mergeStatMark(setup: TacticalSetup, incoming: Mark): Mark[] {
  const idx = setup.findIndex(
    (mark) =>
      mark.id === incoming.id &&
      mark.owner === incoming.owner &&
      mark.target === incoming.target &&
      mark.family === MarkFamily.STAT,
  );
  if (idx < 0) {
    return [...setup.map(cloneMark), cloneMark(incoming)];
  }
  return setup.map((mark, i) =>
    i === idx
      ? { ...mark, stacks: mark.stacks + incoming.stacks, duration: Math.max(mark.duration, incoming.duration) }
      : cloneMark(mark),
  );
}

function spendMarks(
  setup: TacticalSetup,
  predicate: (mark: Mark) => boolean,
): { marks: Mark[]; spent: Mark[] } {
  const spent: Mark[] = [];
  const marks: Mark[] = [];
  for (const mark of setup) {
    if (!predicate(mark)) {
      marks.push(cloneMark(mark));
      continue;
    }
    const nextStacks = mark.stacks - 1;
    spent.push(cloneMark(mark));
    if (nextStacks > 0) {
      marks.push({ ...mark, stacks: nextStacks });
    }
  }
  return { marks, spent };
}

/** Own ATTEMPT marks spent when the actor commits, even if every hit later misses. */
export function consumeOnAttempt(
  setup: TacticalSetup,
  actor: CombatActor,
): { marks: Mark[]; spent: Mark[] } {
  return spendMarks(
    setup,
    (mark) => mark.owner === actor && mark.consume === MarkConsumeTiming.ATTEMPT,
  );
}

/** IMPACT marks on the target spent only when ≥1 hit landed. */
export function consumeOnImpact(
  setup: TacticalSetup,
  target: CombatActor,
  hitsLanded: number,
): { marks: Mark[]; spent: Mark[] } {
  if (hitsLanded < 1) {
    return { marks: setup.map(cloneMark), spent: [] };
  }
  return spendMarks(
    setup,
    (mark) => mark.target === target && mark.consume === MarkConsumeTiming.IMPACT,
  );
}

/** Clock phase 04: duration −1; at 0 the mark no longer affects actions. */
export function tickMarkDurations(setup: TacticalSetup): Mark[] {
  return setup
    .map((mark) => ({ ...mark, duration: mark.duration - 1 }))
    .filter((mark) => mark.duration > 0);
}

/**
 * Stub: two HARD_CONTROL Stun-1 instances collapse to one skipped action.
 * Turn systems may call this; they still own skip application.
 */
export function resolveHardControlSkips(setup: TacticalSetup): number {
  const control = setup.filter((mark) => mark.family === MarkFamily.HARD_CONTROL);
  if (control.length === 0) return 0;
  const totalStacks = control.reduce((sum, mark) => sum + mark.stacks, 0);
  return Math.min(1, totalStacks);
}

export interface HitRoll {
  hit: boolean;
  crit?: boolean;
  damage?: number;
}

export interface MultiHitCardIntent {
  hitCount?: number;
  /** When true, once-per-card procs fire per successful hit instead of once if ≥1 hit. */
  perHit?: boolean;
}

export interface MultiHitResult {
  rolls: HitRoll[];
  hitsLanded: number;
  totalDamage: number;
  fireOncePerCard: boolean;
  perHitProcs: number;
  drainHealFromTotal: number;
  rollCount: number;
}

/**
 * N independent hit rolls. Default: once-per-card procs / impact consume if ≥1 hit.
 * DRAIN/heal-from-damage uses total post-mitigation damage (sum of roll.damage).
 */
export function resolveMultiHit(
  intent: MultiHitCardIntent,
  rollHit: () => HitRoll,
): MultiHitResult {
  const n = Math.max(1, intent.hitCount ?? 1);
  const rolls: HitRoll[] = [];
  for (let i = 0; i < n; i++) {
    rolls.push(rollHit());
  }
  const hitsLanded = rolls.filter((roll) => roll.hit).length;
  const totalDamage = rolls.reduce((sum, roll) => sum + (roll.hit ? (roll.damage ?? 0) : 0), 0);
  const fireOncePerCard = intent.perHit ? hitsLanded > 0 : hitsLanded > 0;
  const perHitProcs = intent.perHit ? hitsLanded : hitsLanded > 0 ? 1 : 0;
  return {
    rolls,
    hitsLanded,
    totalDamage,
    fireOncePerCard,
    perHitProcs,
    drainHealFromTotal: totalDamage,
    rollCount: rolls.length,
  };
}

export function applyCardResolveConsumes(
  setup: TacticalSetup,
  actor: CombatActor,
  target: CombatActor,
  multi: MultiHitResult,
): { marks: Mark[]; attemptSpent: Mark[]; impactSpent: Mark[] } {
  const afterAttempt = consumeOnAttempt(setup, actor);
  const afterImpact = consumeOnImpact(afterAttempt.marks, target, multi.hitsLanded);
  return {
    marks: afterImpact.marks,
    attemptSpent: afterAttempt.spent,
    impactSpent: afterImpact.spent,
  };
}
