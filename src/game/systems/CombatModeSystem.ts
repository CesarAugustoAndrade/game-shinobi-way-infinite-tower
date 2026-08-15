/**
 * CombatModeSystem — R0 Mode state machine (T-005 / SOUL §8).
 *
 * OFF/READY (absent) → ACTIVATION → ON → FIN → COOLDOWN → READY.
 * Charges do not decay with time. Stun/Silence do not end Modes.
 * Same family cannot dual-ON; ascent vs lateral are explicit APIs.
 */

import {
  ActiveModeRuntime,
  ModeDefinition,
  ModeEndKind,
  ModeRuntimeState,
  TypedCost,
} from '../types';
import { getModeDefinition, MODE_FAMILY } from '../constants/modes';
import {
  computeReadyOnTurn,
  HP_UPKEEP_FLOOR,
  resolveModeUpkeep,
} from './TurnClockSystem';
import { discountedGateActivationCost, isGateHpDiscountEligible } from './GatePrepDiscountSystem';
import { applyCpUpkeepDiscount } from './FocusedBreathingDiscountSystem';

export interface ModeBoard {
  instances: ActiveModeRuntime[];
}

export interface ModePools {
  ap: number;
  chakra: number;
  hp: number;
}

export type ModeFailReason =
  | 'not-ready'
  | 'already-on'
  | 'same-family'
  | 'cannot-afford'
  | 'hp-floor'
  | 'not-on'
  | 'not-ascent'
  | 'not-lateral'
  | 'unknown-mode'
  | 'insufficient-charges';

export interface ModeActivateOpts {
  gateHpDiscount?: boolean;
}

export interface ModeOpResult {
  ok: boolean;
  board: ModeBoard;
  pools: ModePools;
  reason?: ModeFailReason;
  ended?: { id: string; kind: ModeEndKind }[];
  /** Remaining Gate Prep HP discount after this op (echo; undefined if unused). */
  gateHpDiscount?: boolean;
  /** Remaining T-067 CP upkeep discount after this op (echo; undefined if unused). */
  cpUpkeepDiscount?: number;
}

export function emptyModeBoard(): ModeBoard {
  return { instances: [] };
}

export function resetModeBoard(_board?: ModeBoard): ModeBoard {
  return emptyModeBoard();
}

/** Stun/Silence never end Modes (SOUL v1). */
export function stunEndsModes(_stunned: boolean): false {
  return false;
}

function cloneBoard(board: ModeBoard): ModeBoard {
  return { instances: board.instances.map((mode) => ({ ...mode })) };
}

function clonePools(pools: ModePools): ModePools {
  return { ...pools };
}

function onModes(board: ModeBoard): ActiveModeRuntime[] {
  return board.instances.filter((mode) => mode.state === ModeRuntimeState.ON || mode.state === undefined);
}

function coolingOf(board: ModeBoard, id: string, turn: number): ActiveModeRuntime | undefined {
  return board.instances.find(
    (mode) =>
      mode.id === id &&
      mode.state === ModeRuntimeState.COOLDOWN &&
      mode.readyOnTurn !== undefined &&
      turn < mode.readyOnTurn,
  );
}

function canAffordActivation(pools: ModePools, cost: TypedCost): ModeFailReason | null {
  if ((cost.ap ?? 0) > 0 && pools.ap < (cost.ap ?? 0)) return 'cannot-afford';
  if ((cost.chakra ?? 0) > 0 && pools.chakra < (cost.chakra ?? 0)) return 'cannot-afford';
  if ((cost.hp ?? 0) > 0 && pools.hp - (cost.hp ?? 0) < HP_UPKEEP_FLOOR) return 'hp-floor';
  return null;
}

function payCost(pools: ModePools, cost: TypedCost): ModePools {
  return {
    ap: pools.ap - (cost.ap ?? 0),
    chakra: pools.chakra - (cost.chakra ?? 0),
    hp: pools.hp - (cost.hp ?? 0),
  };
}

function toOn(def: ModeDefinition, charges: number): ActiveModeRuntime {
  return {
    id: def.id,
    family: def.family,
    stage: def.stage,
    charges,
    cooldown: def.cooldown,
    state: ModeRuntimeState.ON,
  };
}

function toCooldown(def: ModeDefinition, turn: number): ActiveModeRuntime {
  return {
    id: def.id,
    family: def.family,
    stage: def.stage,
    charges: 0,
    cooldown: def.cooldown,
    state: ModeRuntimeState.COOLDOWN,
    readyOnTurn: computeReadyOnTurn(turn, def.cooldown),
  };
}

function replaceInstance(board: ModeBoard, predicate: (m: ActiveModeRuntime) => boolean, next: ActiveModeRuntime[]): ModeBoard {
  return {
    instances: [...board.instances.filter((mode) => !predicate(mode)), ...next],
  };
}

export function activateMode(
  board: ModeBoard,
  def: ModeDefinition,
  pools: ModePools,
  turnIndex: number,
  opts?: ModeActivateOpts,
): ModeOpResult {
  const armed = Boolean(opts?.gateHpDiscount);
  const echo = (remaining: boolean): Pick<ModeOpResult, 'gateHpDiscount'> =>
    opts !== undefined ? { gateHpDiscount: remaining } : {};
  if (coolingOf(board, def.id, turnIndex)) {
    return {
      ok: false,
      board: cloneBoard(board),
      pools: clonePools(pools),
      reason: 'not-ready',
      ...echo(armed),
    };
  }
  if (onModes(board).some((mode) => mode.id === def.id)) {
    return {
      ok: false,
      board: cloneBoard(board),
      pools: clonePools(pools),
      reason: 'already-on',
      ...echo(armed),
    };
  }
  if (onModes(board).some((mode) => mode.family === def.family)) {
    return {
      ok: false,
      board: cloneBoard(board),
      pools: clonePools(pools),
      reason: 'same-family',
      ...echo(armed),
    };
  }
  const applyDiscount = armed && isGateHpDiscountEligible(def);
  const cost = discountedGateActivationCost(def, applyDiscount);
  const fail = canAffordActivation(pools, cost);
  if (fail) {
    return {
      ok: false,
      board: cloneBoard(board),
      pools: clonePools(pools),
      reason: fail,
      ...echo(armed),
    };
  }
  const paid = payCost(pools, cost);
  const withoutOld = replaceInstance(board, (mode) => mode.id === def.id, []);
  return {
    ok: true,
    board: { instances: [...withoutOld.instances, toOn(def, def.maxCharges)] },
    pools: paid,
    ...echo(applyDiscount ? false : armed),
  };
}

/** Higher stage, same family: full AP + resource difference; charges remaining +1 capped. */
export function ascendMode(
  board: ModeBoard,
  fromId: string,
  toDef: ModeDefinition,
  pools: ModePools,
  turnIndex: number,
): ModeOpResult {
  const current = onModes(board).find((mode) => mode.id === fromId);
  const fromDef = getModeDefinition(fromId);
  if (!current || !fromDef) {
    return { ok: false, board: cloneBoard(board), pools: clonePools(pools), reason: 'not-on' };
  }
  if (fromDef.family !== toDef.family || (toDef.stage ?? 0) <= (fromDef.stage ?? 0)) {
    return { ok: false, board: cloneBoard(board), pools: clonePools(pools), reason: 'not-ascent' };
  }
  const apCost: TypedCost = { ap: toDef.activationCost.ap ?? 0 };
  const chakraDiff = Math.max(0, (toDef.activationCost.chakra ?? 0) - (fromDef.activationCost.chakra ?? 0));
  const hpDiff = Math.max(0, (toDef.activationCost.hp ?? 0) - (fromDef.activationCost.hp ?? 0));
  const resource: TypedCost = { ...apCost, chakra: chakraDiff, hp: hpDiff };
  const fail = canAffordActivation(pools, resource);
  if (fail) {
    return { ok: false, board: cloneBoard(board), pools: clonePools(pools), reason: fail };
  }
  const charges = Math.min(toDef.maxCharges, current.charges + 1);
  return {
    ok: true,
    board: replaceInstance(board, (mode) => mode.id === fromId, [toOn(toDef, charges)]),
    pools: payCost(pools, resource),
    ended: [{ id: fromId, kind: ModeEndKind.FAMILY_REPLACE }],
  };
}

/** Lateral same family: full activation cost; transfer charges; prior Mode on cooldown. */
export function lateralSwap(
  board: ModeBoard,
  fromId: string,
  toDef: ModeDefinition,
  pools: ModePools,
  turnIndex: number,
): ModeOpResult {
  const current = onModes(board).find((mode) => mode.id === fromId);
  const fromDef = getModeDefinition(fromId);
  if (!current || !fromDef) {
    return { ok: false, board: cloneBoard(board), pools: clonePools(pools), reason: 'not-on' };
  }
  if (fromDef.family !== toDef.family || fromDef.stage === toDef.stage) {
    return { ok: false, board: cloneBoard(board), pools: clonePools(pools), reason: 'not-lateral' };
  }
  const fail = canAffordActivation(pools, toDef.activationCost);
  if (fail) {
    return { ok: false, board: cloneBoard(board), pools: clonePools(pools), reason: fail };
  }
  const transferred = Math.min(toDef.maxCharges, current.charges);
  return {
    ok: true,
    board: replaceInstance(
      board,
      (mode) => mode.id === fromId || mode.id === toDef.id,
      [toCooldown(fromDef, turnIndex), toOn(toDef, transferred)],
    ),
    pools: payCost(pools, toDef.activationCost),
    ended: [{ id: fromId, kind: ModeEndKind.FAMILY_REPLACE }],
  };
}

/** SOUL §8: Gate/Curse higher stage = ascent; Sharingan = lateral; never downgrade. */
export type FamilyTransition =
  | { kind: 'activate' }
  | { kind: 'already-on' }
  | { kind: 'ascent'; fromId: string }
  | { kind: 'lateral'; fromId: string }
  | { kind: 'reject-downgrade'; fromId: string };

export function classifyFamilyTransition(board: ModeBoard, target: ModeDefinition): FamilyTransition {
  const live = onModes(board);
  if (live.some((mode) => mode.id === target.id)) return { kind: 'already-on' };
  const sibling = live.find((mode) => mode.family === target.family && mode.id !== target.id);
  if (!sibling) return { kind: 'activate' };
  const fromStage = sibling.stage ?? getModeDefinition(sibling.id)?.stage ?? 0;
  const toStage = target.stage ?? 0;
  if (toStage <= fromStage) return { kind: 'reject-downgrade', fromId: sibling.id };
  if (target.family === MODE_FAMILY.GATES || target.family === MODE_FAMILY.CURSE) {
    return { kind: 'ascent', fromId: sibling.id };
  }
  if (target.family === MODE_FAMILY.SHARINGAN) {
    return { kind: 'lateral', fromId: sibling.id };
  }
  return { kind: 'reject-downgrade', fromId: sibling.id };
}

/** Re-play while ON: pay AP only, start cooldown. */
export function manualOff(
  board: ModeBoard,
  modeId: string,
  pools: ModePools,
  turnIndex: number,
): ModeOpResult {
  const current = onModes(board).find((mode) => mode.id === modeId);
  const def = getModeDefinition(modeId);
  if (!current || !def) {
    return { ok: false, board: cloneBoard(board), pools: clonePools(pools), reason: 'not-on' };
  }
  const apOnly: TypedCost = { ap: def.activationCost.ap ?? 0 };
  if (canAffordActivation(pools, apOnly)) {
    return {
      ok: true,
      board: replaceInstance(board, (mode) => mode.id === modeId, [toCooldown(def, turnIndex)]),
      pools: payCost(pools, apOnly),
      ended: [{ id: modeId, kind: ModeEndKind.MANUAL_OFF }],
    };
  }
  return { ok: false, board: cloneBoard(board), pools: clonePools(pools), reason: 'cannot-afford' };
}

export function trySpendCharges(
  board: ModeBoard,
  modeId: string,
  n: number,
  turnIndex: number,
): ModeOpResult {
  const current = onModes(board).find((mode) => mode.id === modeId);
  const def = getModeDefinition(modeId);
  if (!current || !def) {
    return { ok: false, board: cloneBoard(board), pools: { ap: 0, chakra: 0, hp: 0 }, reason: 'not-on' };
  }
  if (n > current.charges) {
    return { ok: false, board: cloneBoard(board), pools: { ap: 0, chakra: 0, hp: 0 }, reason: 'insufficient-charges' };
  }
  const nextCharges = current.charges - n;
  if (nextCharges <= 0) {
    return {
      ok: true,
      board: replaceInstance(board, (mode) => mode.id === modeId, [toCooldown(def, turnIndex)]),
      pools: { ap: 0, chakra: 0, hp: 0 },
      ended: [{ id: modeId, kind: ModeEndKind.ZERO_CHARGES }],
    };
  }
  return {
    ok: true,
    board: {
      instances: board.instances.map((mode) =>
        mode.id === modeId && (mode.state === ModeRuntimeState.ON || mode.state === undefined)
          ? { ...mode, charges: nextCharges }
          : { ...mode },
      ),
    },
    pools: { ap: 0, chakra: 0, hp: 0 },
  };
}

/** Restore charges on an ON Mode. Never exceeds maxCharges. Does not revive COOLDOWN. */
export function tryRestoreCharges(
  board: ModeBoard,
  modeId: string,
  n: number,
): ModeOpResult {
  const current = onModes(board).find((mode) => mode.id === modeId);
  const def = getModeDefinition(modeId);
  if (!current || !def) {
    return { ok: false, board: cloneBoard(board), pools: { ap: 0, chakra: 0, hp: 0 }, reason: 'not-on' };
  }
  const nextCharges = Math.min(def.maxCharges, current.charges + Math.max(0, n));
  return {
    ok: true,
    board: {
      instances: board.instances.map((mode) =>
        mode.id === modeId && (mode.state === ModeRuntimeState.ON || mode.state === undefined)
          ? { ...mode, charges: nextCharges }
          : { ...mode },
      ),
    },
    pools: { ap: 0, chakra: 0, hp: 0 },
  };
}

/** Explicit charge drain can end an enemy Mode. */
export function drainCharges(
  board: ModeBoard,
  modeId: string,
  n: number,
  turnIndex: number,
): ModeOpResult {
  return trySpendCharges(board, modeId, n, turnIndex);
}

/**
 * First ON Mode: optional priority ids, else stable `instances` order.
 */
export function pickEnemyModeToDrain(
  board: ModeBoard,
  priority: readonly string[] = [],
): string | null {
  const on = onModes(board);
  if (on.length === 0) return null;
  for (const id of priority) {
    if (on.some((mode) => mode.id === id)) return id;
  }
  return on[0].id;
}

export interface ModeUpkeepOpts {
  cpUpkeepDiscount?: number;
}

export function applyModeUpkeep(
  board: ModeBoard,
  priority: readonly string[],
  pools: ModePools,
  turnIndex: number,
  opts?: ModeUpkeepOpts,
): ModeOpResult {
  const active = onModes(board);
  const costs: Record<string, TypedCost> = {};
  let remainingDiscount = opts?.cpUpkeepDiscount ?? 0;
  const seen = new Set<string>();
  const payOrder: string[] = [];
  for (const id of priority) {
    if (active.some((mode) => mode.id === id) && !seen.has(id)) {
      payOrder.push(id);
      seen.add(id);
    }
  }
  for (const mode of active) {
    if (!seen.has(mode.id)) payOrder.push(mode.id);
  }
  for (const id of payOrder) {
    const def = getModeDefinition(id);
    if (!def) continue;
    const applied = applyCpUpkeepDiscount(def.upkeep, remainingDiscount);
    costs[id] = applied.cost;
    if (applied.consumed) remainingDiscount = applied.remaining;
  }
  const paid = resolveModeUpkeep(
    active,
    costs,
    priority,
    { chakra: pools.chakra, hp: pools.hp },
    turnIndex,
  );
  const endedIds = new Set(paid.endedModes.map((ended) => ended.id));
  const kept = active.filter((mode) => !endedIds.has(mode.id)).map((mode) => ({ ...mode, state: ModeRuntimeState.ON }));
  const cooling = paid.endedModes.map((ended) => {
    const def = getModeDefinition(ended.id);
    return {
      id: ended.id,
      family: def?.family ?? '',
      charges: 0,
      cooldown: def?.cooldown ?? 0,
      state: ModeRuntimeState.COOLDOWN,
      readyOnTurn: ended.readyOnTurn,
      stage: def?.stage,
    };
  });
  const others = board.instances.filter(
    (mode) => mode.state === ModeRuntimeState.COOLDOWN && !endedIds.has(mode.id) && !kept.some((k) => k.id === mode.id),
  );
  return {
    ok: paid.endedModes.length === 0,
    board: { instances: [...others, ...kept, ...cooling] },
    pools: { ap: pools.ap, chakra: paid.chakra, hp: paid.hp },
    ended: paid.endedModes.map((ended) => ({ id: ended.id, kind: ModeEndKind.UPKEEP_FAIL })),
    ...(opts !== undefined ? { cpUpkeepDiscount: remainingDiscount } : {}),
  };
}
