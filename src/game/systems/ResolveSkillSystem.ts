/**
 * ResolveSkillSystem — R0 SOUL §13 commit orchestrator (T-007).
 *
 * Order: validate → commit AP/CP/HP + readyOnTurn → attempt marks + Mode charges
 * → role dispatch → impact marks if ≥1 hit → perHitEffects → movement/reactions.
 * Invalid intents return a clone of the input state (consume nothing).
 */

import {
  ActionType,
  CardRole,
  CombatActor,
  CombatRange,
  Mark,
  MarkConsumeTiming,
  ModeDefinition,
  RangeReactionDef,
  Skill,
} from '../types';
import { getApCost } from '../constants/combatCards';
import { getModeDefinition } from '../constants/modes';
import {
  isHandPlayableRole,
  resolveCardRole,
} from './CardContractSystem';
import {
  activateMode,
  lateralSwap,
  manualOff,
  trySpendCharges,
  type ModeBoard,
  type ModeOpResult,
  type ModePools,
} from './CombatModeSystem';
import {
  addMark,
  consumeOnAttempt,
  consumeOnImpact,
  resolveMultiHit,
  type HitRoll,
} from './MarkSystem';
import { resolveForcedMove } from './RangeSystem';
import {
  effectiveChakraCost,
  getSkillBlockReason,
  type SkillBlockReason,
} from './skillPlayability';
import { isSkillReadyOnTurn, markSkillUsedOnTurn } from './TurnClockSystem';

export interface ResolveSkillPools {
  ap: number;
  chakra: number;
  hp: number;
  maxHp: number;
}

export interface ResolveSkillState {
  pools: ResolveSkillPools;
  range: CombatRange;
  turnIndex: number;
  marks: Mark[];
  modes: ModeBoard;
  skills: Skill[];
  playerBuffs: import('../types').Buff[];
  enemyHp: number;
  skipFirstSkillCost?: boolean;
  playerMoveUsedThisTurn?: boolean;
  reactionSources?: readonly RangeReactionDef[];
}

export interface ResolveSkillIntent {
  skill: Skill;
  snapshot?: { skillId: string; playable?: boolean };
  modeCharges?: { modeId: string; n: number };
  modeOp?: 'activate' | 'manual-off' | 'family-replace';
  replaceTo?: ModeDefinition;
  movement?: { kind: 'PUSH' | 'PULL' };
  enhanced?: boolean;
}

export interface ResolveSkillPorts {
  rng?: () => number;
  rollHit?: () => HitRoll;
  activateMode?: (
    board: ModeBoard,
    def: ModeDefinition,
    pools: ModePools,
    turn: number,
  ) => ModeOpResult;
  manualOff?: (
    board: ModeBoard,
    modeId: string,
    pools: ModePools,
    turn: number,
  ) => ModeOpResult;
  familyReplace?: (
    board: ModeBoard,
    fromId: string,
    toDef: ModeDefinition,
    pools: ModePools,
    turn: number,
  ) => ModeOpResult;
  spendCharges?: (
    board: ModeBoard,
    modeId: string,
    n: number,
    turn: number,
  ) => ModeOpResult;
  getModeDef?: (id: string) => ModeDefinition | undefined;
}

export type ResolveRejectReason =
  | 'invalid-snapshot'
  | 'incomplete-authoring'
  | 'passive'
  | Exclude<SkillBlockReason, null>
  | 'not-ready';

export type ResolveSkillResult =
  | {
      ok: false;
      reason: ResolveRejectReason;
      state: ResolveSkillState;
    }
  | {
      ok: true;
      role: CardRole;
      state: ResolveSkillState;
      hitsLanded: number;
      damageDealt: number;
      attemptSpent: Mark[];
      impactSpent: Mark[];
      modeActivations: number;
      perHitApplied: number;
      oncePerCardFired: boolean;
      reactions: RangeReactionDef[];
    };

function cloneState(state: ResolveSkillState): ResolveSkillState {
  return {
    pools: { ...state.pools },
    range: state.range,
    turnIndex: state.turnIndex,
    marks: state.marks.map((mark) => ({ ...mark })),
    modes: {
      instances: state.modes.instances.map((mode) => ({ ...mode })),
    },
    skills: state.skills.map((skill) => ({ ...skill })),
    playerBuffs: state.playerBuffs.map((buff) => ({ ...buff })),
    enemyHp: state.enemyHp,
    skipFirstSkillCost: state.skipFirstSkillCost,
    playerMoveUsedThisTurn: state.playerMoveUsedThisTurn,
    reactionSources: state.reactionSources?.map((entry) => ({ ...entry })),
  };
}

function reject(
  original: ResolveSkillState,
  reason: ResolveRejectReason,
): ResolveSkillResult {
  return { ok: false, reason, state: cloneState(original) };
}

function modePoolsFrom(pools: ResolveSkillPools): ModePools {
  return { ap: pools.ap, chakra: pools.chakra, hp: pools.hp };
}

function resolveModeId(skill: Skill): string {
  return skill.modeInteraction?.modeId ?? skill.id;
}

function applySupportMarks(state: ResolveSkillState, skill: Skill): ResolveSkillState {
  let marks = state.marks;
  for (const spec of skill.markEffects ?? []) {
    const added = addMark(marks, {
      id: spec.id,
      sourceSkillId: skill.id,
      owner: CombatActor.PLAYER,
      target: CombatActor.ENEMY,
      duration: spec.duration,
      stacks: spec.stacks ?? 1,
      consume: spec.consume,
      trigger: spec.trigger,
    });
    marks = added.marks;
  }
  return { ...state, marks };
}

function validateIntent(
  intent: ResolveSkillIntent,
  state: ResolveSkillState,
): { ok: true; role: CardRole } | { ok: false; reason: ResolveRejectReason } {
  const { skill } = intent;
  if (intent.snapshot) {
    if (intent.snapshot.skillId !== skill.id || intent.snapshot.playable === false) {
      return { ok: false, reason: 'invalid-snapshot' };
    }
  }
  if (skill.actionType === ActionType.PASSIVE) {
    return { ok: false, reason: 'passive' };
  }
  const roleRes = resolveCardRole(skill);
  if (!roleRes.ok) {
    return { ok: false, reason: 'incomplete-authoring' };
  }
  if (!isHandPlayableRole(roleRes.role)) {
    return { ok: false, reason: 'passive' };
  }

  const block = getSkillBlockReason({
    skill,
    currentChakra: state.pools.chakra,
    currentHp: state.pools.hp,
    maxHp: state.pools.maxHp,
    currentAp: state.pools.ap,
    currentRange: state.range,
    activeBuffs: state.playerBuffs,
    skipFirstSkillCost: state.skipFirstSkillCost,
    modeActivation: roleRes.role === CardRole.MODE && (intent.modeOp ?? 'activate') === 'activate',
    modeAlreadyOn:
      roleRes.role === CardRole.MODE &&
      (intent.modeOp === 'manual-off' || intent.modeOp === 'family-replace'),
  });
  if (block) {
    return { ok: false, reason: block };
  }
  if (!isSkillReadyOnTurn(skill.readyOnTurn, state.turnIndex)) {
    return { ok: false, reason: 'not-ready' };
  }
  return { ok: true, role: roleRes.role };
}

/**
 * Pure SOUL commit. Never mutates `state`. Invalid → consume nothing.
 */
export function resolveSkill(
  intent: ResolveSkillIntent,
  state: ResolveSkillState,
  ports: ResolveSkillPorts = {},
): ResolveSkillResult {
  const original = cloneState(state);
  const gate = validateIntent(intent, original);
  if (!gate.ok) {
    return reject(original, gate.reason);
  }

  const { skill } = intent;
  const role = gate.role;
  let next = cloneState(original);

  const apCost = getApCost(skill);
  const chakraCost = effectiveChakraCost(skill, next.skipFirstSkillCost);
  const hpCost = skill.hpCost ?? 0;
  next = {
    ...next,
    pools: {
      ...next.pools,
      ap: next.pools.ap - apCost,
      chakra: next.pools.chakra - chakraCost,
      hp: next.pools.hp - hpCost,
    },
    skills: next.skills.map((entry) =>
      entry.id === skill.id ? markSkillUsedOnTurn(entry, next.turnIndex) : entry,
    ),
  };
  if (!next.skills.some((entry) => entry.id === skill.id)) {
    next = {
      ...next,
      skills: [...next.skills, markSkillUsedOnTurn(skill, next.turnIndex)],
    };
  }

  const afterAttempt = consumeOnAttempt(next.marks, CombatActor.PLAYER);
  next = { ...next, marks: afterAttempt.marks };

  if (intent.modeCharges && intent.modeCharges.n > 0) {
    const spend = (ports.spendCharges ?? trySpendCharges)(
      next.modes,
      intent.modeCharges.modeId,
      intent.modeCharges.n,
      next.turnIndex,
    );
    if (spend.ok) {
      next = { ...next, modes: spend.board };
    }
  }

  let hitsLanded = 0;
  let damageDealt = 0;
  let modeActivations = 0;
  let perHitApplied = 0;
  let impactSpent: Mark[] = [];

  if (role === CardRole.MODE) {
    const op = intent.modeOp ?? 'activate';
    const activate = ports.activateMode ?? activateMode;
    const off = ports.manualOff ?? manualOff;
    const replace = ports.familyReplace ?? lateralSwap;
    const lookup = ports.getModeDef ?? getModeDefinition;
    const modeId = resolveModeId(skill);
    const def = intent.replaceTo ?? lookup(modeId);
    const stubDef: ModeDefinition = def ?? {
      id: modeId,
      family: modeId,
      maxCharges: 1,
      activationCost: {},
      upkeep: {},
      cooldown: skill.cooldown,
      weightModifiers: [],
      enhancements: [],
      endClauses: [],
    };
    if (op === 'manual-off') {
      const result = off(next.modes, modeId, modePoolsFrom(next.pools), next.turnIndex);
      modeActivations += 1;
      if (result.ok) next = { ...next, modes: result.board };
    } else if (op === 'family-replace' && intent.replaceTo) {
      const result = replace(
        next.modes,
        modeId,
        intent.replaceTo,
        modePoolsFrom(next.pools),
        next.turnIndex,
      );
      modeActivations += 1;
      if (result.ok) next = { ...next, modes: result.board };
    } else {
      const result = activate(next.modes, stubDef, modePoolsFrom(next.pools), next.turnIndex);
      modeActivations += 1;
      if (result.ok) next = { ...next, modes: result.board };
    }
  } else if (role === CardRole.SUPPORT) {
    next = applySupportMarks(next, skill);
  } else {
    const rollHit =
      ports.rollHit ??
      (() => {
        const roll = ports.rng?.() ?? 0;
        const bonus = intent.enhanced ? Math.floor(Math.max(0, skill.baseDamage) * 0.5) : 0;
        return {
          hit: roll < 0.85,
          damage: Math.max(0, skill.baseDamage) + bonus,
        };
      });
    const multi = resolveMultiHit({ hitCount: skill.hitCount, perHit: Boolean(skill.perHitEffects?.length) }, rollHit);
    hitsLanded = multi.hitsLanded;
    damageDealt = multi.totalDamage;
    if (intent.enhanced && hitsLanded > 0 && !ports.rollHit) {
      damageDealt += Math.floor(Math.max(0, skill.baseDamage) * 0.5) * hitsLanded;
    }
    next = { ...next, enemyHp: Math.max(0, next.enemyHp - damageDealt) };
    if (skill.perHitEffects?.length) {
      perHitApplied = multi.perHitProcs;
    }
  }

  if (hitsLanded >= 1) {
    const afterImpact = consumeOnImpact(next.marks, CombatActor.ENEMY, hitsLanded);
    next = { ...next, marks: afterImpact.marks };
    impactSpent = afterImpact.spent;
  }

  let reactions: RangeReactionDef[] = [];
  if (intent.movement) {
    const moved = resolveForcedMove(
      next.range,
      intent.movement.kind,
      next.playerMoveUsedThisTurn ?? false,
      next.reactionSources ?? [],
    );
    next = {
      ...next,
      range: moved.range,
      playerMoveUsedThisTurn: moved.playerMoveUsedThisTurn,
    };
    reactions = moved.reactions;
  }

  return {
    ok: true,
    role,
    state: next,
    hitsLanded,
    damageDealt,
    attemptSpent: afterAttempt.spent,
    impactSpent,
    modeActivations,
    perHitApplied,
    oncePerCardFired: hitsLanded >= 1,
    reactions,
  };
}
