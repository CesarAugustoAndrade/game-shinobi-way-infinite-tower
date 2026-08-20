/**
 * MarkSystem — R0 Tactical Setup (T-004 / SOUL §9).
 *
 * Marks are a first-class board beside Buffs. They never mutate Room Terrain.
 * Attempt consume: own marks, on commit (even if the action misses).
 * Impact consume: marks on the target tagged IMPACT, only if ≥1 hit landed.
 */

import {
  AttackMethod,
  CardRole,
  CombatActor,
  CombatRange,
  CombatTrigger,
  Mark,
  MarkConsumeTiming,
  MarkFamily,
  PrimaryAttributes,
  RangeMoveDirection,
  TerrainDefinition,
} from '../types';
import { applyForcedMove, shiftRange } from './RangeSystem';

export const TRIPWIRE_MARK_ID = 'tripwire';
export const TRIPWIRE_DAMAGE = 8;
export const TRIPWIRE_STUN_CHANCE = 0.6;
export const SUBSTITUTION_MARK_ID = 'substitution';
export const REANIMATION_MARK_ID = 'reanimation';
export const REANIMATION_SHIELD_MARK_ID = 'reanimation_shield';
export const REANIMATION_SHIELD_STACKS = 40;
export const C4_MARK_ID = 'c4';
export const C4_TRUE_DAMAGE = 35;
export const COUNTER_REFLECT_MARK_ID = 'counter_reflect';
export const ROTATION_REFLECT_MARK_ID = 'rotation_reflect';
/** Tripwire / HARD_CONTROL skip allowlist. Bound is HARD_CONTROL but not a skip (T-139). */
export const STUN_SKIP_MARK_ID = 'stun';
/** Temp buff id so EnemyTurn can drop it from lasting player buffs (T-134). */
export const MARK_REFLECT_BUFF_ID = 'mark_reflect';

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
 * Live EnemyTurn applies this on a successful hit (T-084).
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
 * Live EnemyTurn fires this via `applyOutgoingMarkCuts` (T-133).
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
 * First enemy hit under Substitution: nullify damage, signal retreat 1 toward LONG, then strip.
 * Live EnemyTurn wiring is optional (same bar as T-074 Decoy); this is the R0 contract (T-129).
 * `damage <= 0` does not consume (first hit, not first incoming 0).
 */
export function applySubstitutionIncoming(
  damage: number,
  marks: readonly Mark[],
  range?: CombatRange,
): {
  damage: number;
  marks: Mark[];
  consumed: boolean;
  retreatSteps: number;
  range: CombatRange | undefined;
} {
  const substitution = marks.find(
    (mark) => mark.id === SUBSTITUTION_MARK_ID && mark.target === CombatActor.PLAYER,
  );
  if (!substitution || damage <= 0) {
    return {
      damage,
      marks: marks.map((mark) => ({ ...mark })),
      consumed: false,
      retreatSteps: 0,
      range,
    };
  }
  return {
    damage: 0,
    marks: marks
      .filter(
        (mark) => !(mark.id === SUBSTITUTION_MARK_ID && mark.target === CombatActor.PLAYER),
      )
      .map((mark) => ({ ...mark })),
    consumed: true,
    retreatSteps: 1,
    range: range !== undefined ? applyForcedMove(range, 'PUSH').range : range,
  };
}

/**
 * First lethal source under Reanimation: HP → 1, plant Shield 40, then strip.
 * Guaranteed (no guts rng). Live EnemyTurn wiring is optional (T-074 bar); this is the R0 contract (T-130).
 * Non-lethal or unarmed: passthrough, do not consume.
 */
export function applyReanimationLethal(
  currentHp: number,
  incomingDamage: number,
  marks: readonly Mark[],
): {
  newHp: number;
  marks: Mark[];
  consumed: boolean;
  grantShield: number;
  survived: boolean;
} {
  const reanimation = marks.find(
    (mark) => mark.id === REANIMATION_MARK_ID && mark.target === CombatActor.PLAYER,
  );
  const hpAfter = currentHp - incomingDamage;
  const lethal = incomingDamage > 0 && hpAfter <= 0;
  if (!reanimation || !lethal) {
    return {
      newHp: hpAfter,
      marks: marks.map((mark) => ({ ...mark })),
      consumed: false,
      grantShield: 0,
      survived: hpAfter > 0,
    };
  }
  const stripped = marks
    .filter(
      (mark) => !(mark.id === REANIMATION_MARK_ID && mark.target === CombatActor.PLAYER),
    )
    .map((mark) => ({ ...mark }));
  const { marks: withShield } = addMark(stripped, {
    id: REANIMATION_SHIELD_MARK_ID,
    sourceSkillId: 'edo_tensei',
    owner: CombatActor.PLAYER,
    target: CombatActor.PLAYER,
    duration: 99,
    stacks: REANIMATION_SHIELD_STACKS,
    family: MarkFamily.SHIELD,
  });
  return {
    newHp: 1,
    marks: withShield,
    consumed: true,
    grantShield: REANIMATION_SHIELD_STACKS,
    survived: true,
  };
}

/**
 * ATTACK role +1 while a self Reanimation mark is armed (continuous, not a next-draw bag).
 * Merge into WeightContext.supportRoleBonuses at draw. Live upkeep feed is optional.
 */
export function reanimationRoleBonuses(
  marks: readonly Mark[],
): Readonly<Partial<Record<CardRole, number>>> {
  const armed = marks.some(
    (mark) => mark.id === REANIMATION_MARK_ID && mark.target === CombatActor.PLAYER,
  );
  return armed ? { [CardRole.ATTACK]: 1 } : {};
}

function isEnemyC4(mark: Mark): boolean {
  return mark.id === C4_MARK_ID && mark.target === CombatActor.ENEMY;
}

/**
 * Next enemy opportunity under C4: deal 35 TRUE once, then strip.
 * Live `processEnemyTurn` calls this at opportunity start (T-142).
 */
export function resolveC4AtEnemyOpportunity(
  marks: readonly Mark[],
): { trueDamage: number; marks: Mark[]; fired: boolean } {
  const c4 = marks.find(isEnemyC4);
  if (!c4) {
    return {
      trueDamage: 0,
      marks: marks.map((mark) => ({ ...mark })),
      fired: false,
    };
  }
  return {
    trueDamage: C4_TRUE_DAMAGE,
    marks: marks.filter((mark) => !isEnemyC4(mark)).map((mark) => ({ ...mark })),
    fired: true,
  };
}

/**
 * Strip enemy C4 without firing the TRUE payload (Seal/Medical/Kai cleanse sibling).
 */
export function stripC4(
  marks: readonly Mark[],
): { marks: Mark[]; stripped: boolean } {
  const armed = marks.some(isEnemyC4);
  if (!armed) {
    return { marks: marks.map((mark) => ({ ...mark })), stripped: false };
  }
  return {
    marks: marks.filter((mark) => !isEnemyC4(mark)).map((mark) => ({ ...mark })),
    stripped: true,
  };
}

/**
 * First enemy offensive under Mist: subtract stacks (default 20) once, then strip.
 * Live EnemyTurn fires this via `applyOutgoingMarkCuts` (T-133).
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
 * Live EnemyTurn applies this on a successful hit (T-084).
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
 * Live EnemyTurn applies this on a successful hit (T-084).
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

/**
 * Fear → Smoke → Mist → Decoy → Read Window on one outgoing enemy hit.
 * Each helper still consume-once; sequential independent cuts (T-133).
 */
export function applyOutgoingMarkCuts(
  damage: number,
  marks: readonly Mark[],
): { damage: number; marks: Mark[]; consumed: boolean } {
  const fear = applyFearOutgoing(damage, marks);
  const smoke = applySmokeOutgoing(fear.damage, fear.marks);
  const mist = applyMistOutgoing(smoke.damage, smoke.marks);
  const decoy = applyDecoyOutgoing(mist.damage, mist.marks);
  const window = applyReadWindowOutgoing(decoy.damage, decoy.marks);
  return {
    damage: window.damage,
    marks: window.marks,
    consumed:
      fear.consumed ||
      smoke.consumed ||
      mist.consumed ||
      decoy.consumed ||
      window.consumed,
  };
}

function isSelfReflectMark(mark: Mark, attackMethod?: AttackMethod): boolean {
  if (mark.target !== CombatActor.PLAYER) return false;
  if (mark.id === ROTATION_REFLECT_MARK_ID) return true;
  if (mark.id === COUNTER_REFLECT_MARK_ID) {
    return attackMethod === undefined || attackMethod === AttackMethod.MELEE;
  }
  return false;
}

/**
 * Self counter_reflect / rotation_reflect → stacks/100 reflection percent.
 * Winner is max stacks if both armed. Counter is MELEE-only when attackMethod is passed;
 * Rotation applies to any offensive. Returned marks are stripped; caller assigns them
 * only if reflectedDamage > 0 (T-134).
 */
export function reflectPercentFromMarks(
  marks: readonly Mark[],
  attackMethod?: AttackMethod,
): { percent: number; marks: Mark[]; consumed: boolean } {
  const eligible = marks.filter((mark) => isSelfReflectMark(mark, attackMethod));
  if (eligible.length === 0) {
    return {
      percent: 0,
      marks: marks.map((mark) => ({ ...mark })),
      consumed: false,
    };
  }
  const winner = eligible.reduce((best, mark) =>
    (mark.stacks ?? 0) > (best.stacks ?? 0) ? mark : best,
  );
  const percent = Math.min(1, Math.max(0, (winner.stacks ?? 0) / 100));
  return {
    percent,
    marks: marks
      .filter(
        (mark) =>
          !(mark.id === winner.id && mark.target === CombatActor.PLAYER),
      )
      .map((mark) => ({ ...mark })),
    consumed: true,
  };
}

/**
 * Player MarkFamily.SHIELD absorbs before HP (SOUL §9). Oldest-first (array order).
 * Drain stacks; strip at ≤0. Duration-99 “until absorbed” breaks via stacks (T-135).
 * Live EnemyTurn applies this after buff mit + outgoing cuts, before lethal HP.
 */
export function absorbWithShieldMarks(
  damage: number,
  marks: readonly Mark[],
): { damage: number; marks: Mark[]; absorbed: number } {
  let remaining = Math.max(0, damage);
  let absorbed = 0;
  const next: Mark[] = [];
  for (const mark of marks) {
    const isPlayerShield =
      mark.family === MarkFamily.SHIELD && mark.target === CombatActor.PLAYER;
    if (!isPlayerShield || remaining <= 0) {
      next.push({ ...mark });
      continue;
    }
    const take = Math.min(remaining, Math.max(0, mark.stacks));
    remaining -= take;
    absorbed += take;
    const stacks = mark.stacks - take;
    if (stacks > 0) {
      next.push({ ...mark, stacks });
    }
  }
  return { damage: remaining, marks: next, absorbed };
}

/**
 * DoT opportunity tick: sum stacks of MarkFamily.DOT on `target`.
 * Does not decrement duration (TurnClock `tickMarkDurations` owns the clock) (T-137).
 */
export function tickDotMarksForActor(
  marks: readonly Mark[],
  target: CombatActor,
): { damage: number; marks: Mark[]; logs: string[] } {
  let damage = 0;
  const logs: string[] = [];
  const next = marks.map((mark) => ({ ...mark }));
  for (const mark of next) {
    if (mark.family !== MarkFamily.DOT || mark.target !== target) continue;
    const tick = Math.max(0, mark.stacks);
    if (tick <= 0) continue;
    damage += tick;
    logs.push(`${mark.id} deals ${tick}`);
  }
  return { damage, marks: next, logs };
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

function isStunSkipMark(mark: Mark, target?: CombatActor): boolean {
  if (mark.family !== MarkFamily.HARD_CONTROL) return false;
  if (mark.id !== STUN_SKIP_MARK_ID) return false;
  if (target !== undefined && mark.target !== target) return false;
  return true;
}

/**
 * Stun-type HARD_CONTROL skips: two Stun-1 instances collapse to one skip (SOUL §9).
 * Bound and other HARD_CONTROL ids do not skip. Optional `target` filters by mark.target.
 * Turn systems own skip application; this helper does not tick duration.
 */
export function resolveHardControlSkips(setup: TacticalSetup, target?: CombatActor): number {
  const totalStacks = setup
    .filter((mark) => isStunSkipMark(mark, target))
    .reduce((sum, mark) => sum + mark.stacks, 0);
  return Math.min(1, totalStacks);
}

export function actorHasHardControlSkip(setup: TacticalSetup, actor: CombatActor): boolean {
  return resolveHardControlSkips(setup, actor) > 0;
}

/** v1 integer primary map. Unknown STAT ids (aim, decoy, cloaked, …) are ignored. */
export const STAT_MARK_PRIMARY: Record<string, { key: keyof PrimaryAttributes; sign: 1 | -1 }> = {
  spd_down: { key: 'speed', sign: -1 },
  adamantine_spd: { key: 'speed', sign: -1 },
  air_acc_down: { key: 'accuracy', sign: -1 },
  blinded: { key: 'accuracy', sign: -1 },
  expansion_str: { key: 'strength', sign: 1 },
};

export function primaryDeltasFromStatMarks(
  marks: TacticalSetup,
  target: CombatActor,
): Partial<PrimaryAttributes> {
  const deltas: Partial<PrimaryAttributes> = {};
  for (const mark of marks) {
    if (mark.family !== MarkFamily.STAT || mark.target !== target) continue;
    const spec = STAT_MARK_PRIMARY[mark.id];
    if (!spec) continue;
    deltas[spec.key] = (deltas[spec.key] ?? 0) + spec.sign * mark.stacks;
  }
  return deltas;
}

/** Apply allowlisted STAT Marks as integer primaries. Floor 1. Does not tick duration. */
export function applyStatMarksToPrimaryStats(
  base: PrimaryAttributes,
  marks: TacticalSetup,
  target: CombatActor,
): PrimaryAttributes {
  const deltas = primaryDeltasFromStatMarks(marks, target);
  const next = { ...base };
  (Object.keys(deltas) as (keyof PrimaryAttributes)[]).forEach((key) => {
    next[key] = Math.max(1, next[key] + (deltas[key] ?? 0));
  });
  return next;
}

/** v1 derived elemental flat. Not a T-140 primary (spd_down / blinded / aim ignored). */
export const ELEM_DEF_MARK_IDS = new Set(['suijinheki_elem_def']);

/** Sum allowlisted STAT stacks as integer elementalDefenseFlat. Does not tick duration. */
export function elementalDefenseFlatFromMarks(
  marks: TacticalSetup,
  target: CombatActor,
): number {
  let flat = 0;
  for (const mark of marks) {
    if (mark.family !== MarkFamily.STAT || mark.target !== target) continue;
    if (!ELEM_DEF_MARK_IDS.has(mark.id)) continue;
    flat += mark.stacks;
  }
  return flat;
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
    id: STUN_SKIP_MARK_ID,
    sourceSkillId,
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 1,
    stacks: 1,
    family: MarkFamily.HARD_CONTROL,
    consume: MarkConsumeTiming.NONE,
  };
}

function isOnMoveReaction(mark: Mark): boolean {
  return mark.trigger === CombatTrigger.ON_MOVE || mark.id === TRIPWIRE_MARK_ID;
}

/**
 * First real enemy band change consumes one ON_MOVE mark (tripwire or trigger).
 * Payload: 8 chip + 60% Stun 1. Player moves and non-moves leave marks/HP unchanged.
 * Stun is a HARD_CONTROL mark — live skip ORs this with STUN buffs (T-139).
 */
export function fireTripwireOnEnemyMove(input: TripwireFireInput): TripwireFireResult {
  const marks = cloneSetup(input.marks);
  if (!input.moved || input.mover !== 'enemy') {
    return { marks, enemyHp: input.enemyHp, damageDealt: 0, stunned: false, fired: false };
  }
  const idx = marks.findIndex(isOnMoveReaction);
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

/** Live/sim alias: fire the first ON_MOVE mark after a real enemy band change. */
export function fireOnMoveReactions(input: TripwireFireInput): TripwireFireResult {
  return fireTripwireOnEnemyMove(input);
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
