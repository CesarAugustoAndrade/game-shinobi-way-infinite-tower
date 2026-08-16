/**
 * TurnClockSystem — R0 SOUL turn clock (T-002).
 *
 * Single source of truth for phase order and `readyOnTurn`.
 * Mode upkeep is a payment hook, not a full Mode machine.
 * Zero React/DOM. Callers must use `resetCombatFrontier` at combat start.
 */

import {
  ActiveModeRuntime,
  Mark,
  ModeRuntimeState,
  Skill,
  TypedCost,
} from '../types';
import { clearMarks, tickMarkDurations } from './MarkSystem';

export enum TurnPhase {
  MODE_UPKEEP = 'MODE_UPKEEP',
  TICKS_REGEN = 'TICKS_REGEN',
  SNAPSHOT_DRAW = 'SNAPSHOT_DRAW',
  DURATION_DECREMENT = 'DURATION_DECREMENT',
  ACTIONS = 'ACTIONS',
  VIRTUAL_DISCARD = 'VIRTUAL_DISCARD',
}

/** Fixed SOUL order. Phases 5–6 are orchestration / end-of-turn helpers. */
export const TURN_PHASE_ORDER: readonly TurnPhase[] = [
  TurnPhase.MODE_UPKEEP,
  TurnPhase.TICKS_REGEN,
  TurnPhase.SNAPSHOT_DRAW,
  TurnPhase.DURATION_DECREMENT,
  TurnPhase.ACTIONS,
  TurnPhase.VIRTUAL_DISCARD,
] as const;

export const HP_UPKEEP_FLOOR = 1;

export function computeReadyOnTurn(usedOnTurn: number, cooldownN: number): number {
  return usedOnTurn + cooldownN + 1;
}

/** Normative readiness on player-turn index T. Missing / 0 = ready. */
export function isSkillReadyOnTurn(readyOnTurn: number | undefined, turnT: number): boolean {
  if (readyOnTurn === undefined || readyOnTurn <= 0) {
    return true;
  }
  return turnT >= readyOnTurn;
}

export function markSkillUsedOnTurn(skill: Skill, usedOnTurn: number): Skill {
  const readyOnTurn = computeReadyOnTurn(usedOnTurn, skill.cooldown);
  return { ...skill, readyOnTurn };
}

export interface CombatFrontier {
  skills: Skill[];
  modes: ActiveModeRuntime[];
  marks: Mark[];
}

/**
 * Encounter boundary. Call at the start of each combat.
 * Does not persist via Heat or Encounter Chain.
 */
export function resetCombatFrontier(frontier: CombatFrontier): CombatFrontier {
  return {
    skills: frontier.skills.map((skill) => ({
      ...skill,
      currentCooldown: 0,
      readyOnTurn: 0,
    })),
    modes: [],
    marks: clearMarks(frontier.marks),
  };
}

/**
 * Cooldown-reset style effect: skills ready; Modes stay off; charges not refilled.
 * Does not activate a Mode.
 */
export function resetCooldownsKeepModesOff(frontier: CombatFrontier): CombatFrontier {
  return {
    skills: frontier.skills.map((skill) => ({
      ...skill,
      currentCooldown: 0,
      readyOnTurn: 0,
    })),
    modes: frontier.modes.map((mode) => ({
      ...mode,
      charges: 0,
      state: ModeRuntimeState.COOLDOWN,
    })),
    marks: frontier.marks.map((mark) => ({ ...mark })),
  };
}

export interface ModeUpkeepFailure {
  id: string;
  reason: 'upkeep-fail';
  readyOnTurn: number;
}

export interface ModeUpkeepResult {
  chakra: number;
  hp: number;
  remainingModes: ActiveModeRuntime[];
  endedModes: ModeUpkeepFailure[];
}

function orderModeIds(activeIds: readonly string[], priority: readonly string[]): string[] {
  const remaining = new Set(activeIds);
  const ordered: string[] = [];
  for (const id of priority) {
    if (remaining.has(id)) {
      ordered.push(id);
      remaining.delete(id);
    }
  }
  for (const id of activeIds) {
    if (remaining.has(id)) {
      ordered.push(id);
      remaining.delete(id);
    }
  }
  return ordered;
}

function canPayUpkeep(pools: { chakra: number; hp: number }, cost: TypedCost): boolean {
  const chakraCost = cost.chakra ?? 0;
  const hpCost = cost.hp ?? 0;
  if (chakraCost > 0 && pools.chakra < chakraCost) {
    return false;
  }
  if (hpCost > 0 && pools.hp - hpCost < HP_UPKEEP_FLOOR) {
    return false;
  }
  return true;
}

/**
 * Pay Mode upkeep in priority order from current pools (no same-turn regen).
 * Failed payment ends that Mode and starts its cooldown; later modes still attempt.
 */
export function resolveModeUpkeep(
  modes: readonly ActiveModeRuntime[],
  costsById: Readonly<Record<string, TypedCost>>,
  priority: readonly string[],
  pools: { chakra: number; hp: number },
  usedOnTurn: number,
): ModeUpkeepResult {
  let chakra = pools.chakra;
  let hp = pools.hp;
  const remainingModes: ActiveModeRuntime[] = [];
  const endedModes: ModeUpkeepFailure[] = [];
  const byId = new Map(modes.map((mode) => [mode.id, mode]));

  for (const id of orderModeIds(modes.map((mode) => mode.id), priority)) {
    const mode = byId.get(id);
    if (!mode) {
      continue;
    }
    const cost = costsById[id] ?? {};
    if (canPayUpkeep({ chakra, hp }, cost)) {
      chakra -= cost.chakra ?? 0;
      hp -= cost.hp ?? 0;
      remainingModes.push(mode);
    } else {
      endedModes.push({
        id,
        reason: 'upkeep-fail',
        readyOnTurn: computeReadyOnTurn(usedOnTurn, mode.cooldown ?? 0),
      });
    }
  }

  return { chakra, hp, remainingModes, endedModes };
}

export interface ResourceRegen {
  chakra: number;
  hp: number;
  maxChakra: number;
  maxHp: number;
}

export function applyTicksRegen(
  pools: { chakra: number; hp: number },
  regen: ResourceRegen,
): { chakra: number; hp: number } {
  return {
    chakra: Math.min(regen.maxChakra, pools.chakra + Math.max(0, regen.chakra)),
    hp: Math.min(regen.maxHp, pools.hp + Math.max(0, regen.hp)),
  };
}

export interface SupportDuration {
  id: string;
  duration: number;
}

export function decrementSupportAndMarkDurations(
  marks: readonly Mark[],
  supports: readonly SupportDuration[] = [],
): { marks: Mark[]; supports: SupportDuration[] } {
  return {
    marks: tickMarkDurations(marks),
    supports: supports
      .map((support) => ({ ...support, duration: support.duration - 1 }))
      .filter((support) => support.duration > 0),
  };
}

/** Virtual discard: hand leaves play. Deck deletion is T-003. */
export function virtualDiscardHand(hand: readonly Skill[]): { hand: Skill[]; discarded: Skill[] } {
  return { hand: [], discarded: [...hand] };
}

export interface TurnClockInput {
  turnIndex: number;
  chakra: number;
  hp: number;
  regen: ResourceRegen;
  modes: readonly ActiveModeRuntime[];
  modeCosts: Readonly<Record<string, TypedCost>>;
  modeUpkeepPriority: readonly string[];
  marks: readonly Mark[];
  supports?: readonly SupportDuration[];
  hand: readonly Skill[];
  /** Optional phase-3 hook (e.g. drawNewTurnHand). Default: identity. */
  snapshotDraw?: (hand: readonly Skill[]) => readonly Skill[];
}

export interface TurnClockResult {
  turnIndex: number;
  chakra: number;
  hp: number;
  modes: ActiveModeRuntime[];
  endedModes: ModeUpkeepFailure[];
  marks: Mark[];
  supports: SupportDuration[];
  hand: Skill[];
  phasesRun: TurnPhase[];
}

/**
 * Runs start-of-turn phases 1–4 in SOUL order.
 * ACTIONS / VIRTUAL_DISCARD stay at existing turn-system call sites.
 * T-083: T advances at start-of-turn so readyOnTurn = T+N+1 can expire.
 */
export function runTurnStartClock(input: TurnClockInput): TurnClockResult {
  const phasesRun: TurnPhase[] = [];
  const turnIndex = input.turnIndex + 1;

  phasesRun.push(TurnPhase.MODE_UPKEEP);
  const upkeep = resolveModeUpkeep(
    input.modes,
    input.modeCosts,
    input.modeUpkeepPriority,
    { chakra: input.chakra, hp: input.hp },
    turnIndex,
  );

  phasesRun.push(TurnPhase.TICKS_REGEN);
  const pools = applyTicksRegen({ chakra: upkeep.chakra, hp: upkeep.hp }, input.regen);

  phasesRun.push(TurnPhase.SNAPSHOT_DRAW);
  const drawn = input.snapshotDraw ? input.snapshotDraw(input.hand) : input.hand;

  phasesRun.push(TurnPhase.DURATION_DECREMENT);
  const durations = decrementSupportAndMarkDurations(input.marks, input.supports ?? []);

  return {
    turnIndex,
    chakra: pools.chakra,
    hp: pools.hp,
    modes: upkeep.remainingModes,
    endedModes: upkeep.endedModes,
    marks: durations.marks,
    supports: durations.supports,
    hand: [...drawn],
    phasesRun,
  };
}
