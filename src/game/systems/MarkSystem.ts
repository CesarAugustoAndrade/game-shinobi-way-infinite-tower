/**
 * MarkSystem — R0 Tactical Setup (T-004 / SOUL §9).
 *
 * Marks are a first-class board beside Buffs. They never mutate Room Terrain.
 * Attempt consume: own marks, on commit (even if the action misses).
 * Impact consume: marks on the target tagged IMPACT, only if ≥1 hit landed.
 */

import {
  CombatActor,
  CombatRange,
  Mark,
  MarkConsumeTiming,
  MarkFamily,
  RangeMoveDirection,
  TerrainDefinition,
} from '../types';
import { shiftRange } from './RangeSystem';

export const TRIPWIRE_MARK_ID = 'tripwire';
export const TRIPWIRE_DAMAGE = 8;
export const TRIPWIRE_STUN_CHANCE = 0.6;

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
  allow: (mark: Mark) => boolean = () => true,
): { marks: Mark[]; spent: Mark[] } {
  return spendMarks(
    setup,
    (mark) =>
      mark.owner === actor && mark.consume === MarkConsumeTiming.ATTEMPT && allow(mark),
  );
}

/**
 * Next enemy offensive under Read Window: subtract stacks (default 30) once, then strip.
 * Live EnemyTurn wiring is optional; this is the R0 contract (T-039).
 */
export function applyReadWindowOutgoing(
  damage: number,
  marks: readonly Mark[],
): { damage: number; marks: Mark[]; consumed: boolean } {
  const window = marks.find((mark) => mark.id === 'read_window' && mark.target === CombatActor.ENEMY);
  if (!window) {
    return { damage, marks: marks.map((mark) => ({ ...mark })), consumed: false };
  }
  const cut = window.stacks ?? 30;
  return {
    damage: Math.max(0, damage - cut),
    marks: marks
      .filter((mark) => !(mark.id === 'read_window' && mark.target === CombatActor.ENEMY))
      .map((mark) => ({ ...mark })),
    consumed: true,
  };
}

/**
 * First enemy offensive under Decoy: subtract stacks (default 20) once, then strip.
 * Live EnemyTurn wiring is optional; this is the R0 contract (T-074).
 */
export function applyDecoyOutgoing(
  damage: number,
  marks: readonly Mark[],
): { damage: number; marks: Mark[]; consumed: boolean } {
  const decoy = marks.find((mark) => mark.id === 'decoy' && mark.target === CombatActor.ENEMY);
  if (!decoy) {
    return { damage, marks: marks.map((mark) => ({ ...mark })), consumed: false };
  }
  const cut = decoy.stacks ?? 20;
  return {
    damage: Math.max(0, damage - cut),
    marks: marks
      .filter((mark) => !(mark.id === 'decoy' && mark.target === CombatActor.ENEMY))
      .map((mark) => ({ ...mark })),
    consumed: true,
  };
}

/**
 * First enemy offensive under Mist: subtract stacks (default 20) once, then strip.
 * Live EnemyTurn wiring is optional; this is the R0 contract (T-073).
 */
export function applyMistOutgoing(
  damage: number,
  marks: readonly Mark[],
): { damage: number; marks: Mark[]; consumed: boolean } {
  const mist = marks.find((mark) => mark.id === 'mist' && mark.target === CombatActor.ENEMY);
  if (!mist) {
    return { damage, marks: marks.map((mark) => ({ ...mark })), consumed: false };
  }
  const cut = mist.stacks ?? 20;
  return {
    damage: Math.max(0, damage - cut),
    marks: marks
      .filter((mark) => !(mark.id === 'mist' && mark.target === CombatActor.ENEMY))
      .map((mark) => ({ ...mark })),
    consumed: true,
  };
}

/**
 * First enemy offensive under Smoke: subtract stacks (default 25) once, then strip.
 * Live EnemyTurn wiring is optional; this is the R0 contract (T-038).
 */
export function applySmokeOutgoing(
  damage: number,
  marks: readonly Mark[],
): { damage: number; marks: Mark[]; consumed: boolean } {
  const smoke = marks.find((mark) => mark.id === 'smoke' && mark.target === CombatActor.ENEMY);
  if (!smoke) {
    return { damage, marks: marks.map((mark) => ({ ...mark })), consumed: false };
  }
  const cut = smoke.stacks ?? 25;
  return {
    damage: Math.max(0, damage - cut),
    marks: marks
      .filter((mark) => !(mark.id === 'smoke' && mark.target === CombatActor.ENEMY))
      .map((mark) => ({ ...mark })),
    consumed: true,
  };
}

/**
 * Next enemy offensive under Fear: ×(1 − stacks/100) once, then strip the mark.
 * Live EnemyTurn wiring is optional; this is the R0 contract (T-037).
 */
export function applyFearOutgoing(
  damage: number,
  marks: readonly Mark[],
): { damage: number; marks: Mark[]; consumed: boolean } {
  const fear = marks.find((mark) => mark.id === 'fear' && mark.target === CombatActor.ENEMY);
  if (!fear) {
    return { damage, marks: marks.map((mark) => ({ ...mark })), consumed: false };
  }
  const pct = (fear.stacks ?? 20) / 100;
  return {
    damage: Math.floor(damage * (1 - pct)),
    marks: marks
      .filter((mark) => !(mark.id === 'fear' && mark.target === CombatActor.ENEMY))
      .map((mark) => ({ ...mark })),
    consumed: true,
  };
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

export type TripwireMover = 'enemy' | 'player';

export interface TripwireFireInput {
  marks: TacticalSetup;
  moved: boolean;
  mover: TripwireMover;
  enemyHp: number;
  rng?: () => number;
}

export interface TripwireFireResult {
  marks: Mark[];
  enemyHp: number;
  damageDealt: number;
  stunned: boolean;
  fired: boolean;
}

function cloneSetup(setup: TacticalSetup): Mark[] {
  return setup.map(cloneMark);
}

function tripwireStunMark(sourceSkillId: string): Mark {
  return {
    id: 'stun',
    sourceSkillId,
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 1,
    stacks: 1,
    family: MarkFamily.HARD_CONTROL,
    consume: MarkConsumeTiming.NONE,
  };
}

/**
 * First real enemy band change consumes one `tripwire` mark: 8 chip + 60% Stun 1.
 * Player moves and non-moves leave marks and HP unchanged.
 */
export function fireTripwireOnEnemyMove(input: TripwireFireInput): TripwireFireResult {
  const marks = cloneSetup(input.marks);
  if (!input.moved || input.mover !== 'enemy') {
    return { marks, enemyHp: input.enemyHp, damageDealt: 0, stunned: false, fired: false };
  }
  const idx = marks.findIndex((mark) => mark.id === TRIPWIRE_MARK_ID);
  if (idx < 0) {
    return { marks, enemyHp: input.enemyHp, damageDealt: 0, stunned: false, fired: false };
  }
  const tripwire = marks[idx];
  const remaining = marks.filter((_, i) => i !== idx);
  const stunned = (input.rng?.() ?? 1) < TRIPWIRE_STUN_CHANCE;
  const nextMarks = stunned
    ? addMark(remaining, tripwireStunMark(tripwire.sourceSkillId)).marks
    : remaining;
  const enemyHp = Math.max(0, input.enemyHp - TRIPWIRE_DAMAGE);
  return {
    marks: nextMarks,
    enemyHp,
    damageDealt: TRIPWIRE_DAMAGE,
    stunned,
    fired: true,
  };
}

/** Thin test/sim surface: shift enemy band, then fire tripwire if the band changed. */
export function applyEnemyBandChange(
  input: { marks: TacticalSetup; range: CombatRange; enemyHp: number },
  direction: RangeMoveDirection,
  rng?: () => number,
): TripwireFireResult & { range: CombatRange; moved: boolean } {
  const shifted = shiftRange(input.range, direction);
  const fired = fireTripwireOnEnemyMove({
    marks: input.marks,
    moved: shifted.moved,
    mover: 'enemy',
    enemyHp: input.enemyHp,
    rng,
  });
  return { ...fired, range: shifted.range, moved: shifted.moved };
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
