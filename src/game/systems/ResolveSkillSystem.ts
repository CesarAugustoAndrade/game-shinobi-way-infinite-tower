/**
 * ResolveSkillSystem — R0 SOUL §13 commit orchestrator (T-007).
 *
 * Order: validate → commit AP/CP/HP + readyOnTurn → attempt marks + Mode charges
 * → role dispatch → impact marks if ≥1 hit → perHitEffects → movement/reactions.
 * Invalid intents return a clone of the input state (consume nothing).
 */

import {
  ActionType,
  AttackMethod,
  Buff,
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  Mark,
  MarkConsumeTiming,
  MarkFamily,
  ModeDefinition,
  PrimaryStat,
  ModeRuntimeState,
  Posture,
  RangeReactionDef,
  Skill,
} from '../types';
import { getApCost } from '../constants/combatCards';
import { getModeDefinition, MODE_FAMILY } from '../constants/modes';
import {
  isHandPlayableRole,
  resolveCardRole,
} from './CardContractSystem';
import {
  activateMode,
  ascendMode,
  classifyFamilyTransition,
  drainCharges,
  emptyModeBoard,
  lateralSwap,
  manualOff,
  pickEnemyModeToDrain,
  tryRestoreCharges,
  trySpendCharges,
  type FamilyTransition,
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
import {
  discoverThree,
  snapshotSkill,
  type DiscoverFilter,
  type HandSnapshot,
  type WeightContext,
} from './DeckSystem';
import {
  applySupportWeightOnPlay,
  enqueueSupportWeightBonuses,
  GATE_PREP_ID,
  type PendingSupportWeight,
} from './SupportWeightSystem';
import { onGatePrepPlayed } from './GatePrepDiscountSystem';

export interface ResolveSkillPools {
  ap: number;
  chakra: number;
  hp: number;
  maxHp: number;
}

export interface PendingDiscover {
  candidates: HandSnapshot[];
  sourceId: string;
}

export interface ResolveSkillState {
  pools: ResolveSkillPools;
  range: CombatRange;
  turnIndex: number;
  marks: Mark[];
  modes: ModeBoard;
  skills: Skill[];
  playerBuffs: import('../types').Buff[];
  enemyModes?: ModeBoard;
  enemyBuffs?: Buff[];
  enemyModeUpkeepPriority?: string[];
  enemyHp: number;
  /** Optional enemy chakra pool (T-045 Gentle Fist drain). */
  enemyChakra?: number;
  /** Optional enemy % defense for penetration fixtures (T-047 Studied). */
  enemyDefensePercent?: number;
  skipFirstSkillCost?: boolean;
  playerMoveUsedThisTurn?: boolean;
  reactionSources?: readonly RangeReactionDef[];
  hand?: Skill[];
  playablePool?: Skill[];
  pendingDiscover?: PendingDiscover;
  pendingSupportWeights?: PendingSupportWeight[];
  /** T-017 one-shot next Gate HP activation −50% (armed by Gate Prep play). */
  pendingGateHpDiscount?: boolean;
}

export interface ResolveSkillIntent {
  skill: Skill;
  snapshot?: { skillId: string; playable?: boolean };
  modeCharges?: { modeId: string; n: number };
  modeOp?: 'activate' | 'manual-off' | 'family-replace';
  replaceTo?: ModeDefinition;
  movement?: { kind: 'PUSH' | 'PULL' };
  enhanced?: boolean;
  discoverFilter?: DiscoverFilter;
  weightContext?: WeightContext;
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
  ascendMode?: (
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
  | 'not-ready'
  | 'mode-required'
  | 'mode-family';

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
      pendingDiscover?: PendingDiscover;
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
    enemyChakra: state.enemyChakra,
    enemyDefensePercent: state.enemyDefensePercent,
    skipFirstSkillCost: state.skipFirstSkillCost,
    playerMoveUsedThisTurn: state.playerMoveUsedThisTurn,
    reactionSources: state.reactionSources?.map((entry) => ({ ...entry })),
    hand: state.hand?.map((skill) => ({ ...skill })),
    playablePool: state.playablePool?.map((skill) => ({ ...skill })),
    pendingDiscover: state.pendingDiscover
      ? {
          sourceId: state.pendingDiscover.sourceId,
          candidates: state.pendingDiscover.candidates.map((entry) => ({
            ...entry,
            skill: { ...entry.skill },
            reasons: [...entry.reasons],
          })),
        }
      : undefined,
    pendingSupportWeights: state.pendingSupportWeights?.map((entry) => ({ ...entry })),
    pendingGateHpDiscount: state.pendingGateHpDiscount,
    enemyModes: state.enemyModes
      ? { instances: state.enemyModes.instances.map((mode) => ({ ...mode })) }
      : undefined,
    enemyBuffs: state.enemyBuffs?.map((buff) => ({ ...buff, effect: { ...buff.effect } })),
    enemyModeUpkeepPriority: state.enemyModeUpkeepPriority
      ? [...state.enemyModeUpkeepPriority]
      : undefined,
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

function targetModeDefinition(intent: ResolveSkillIntent): ModeDefinition | undefined {
  return intent.replaceTo ?? getModeDefinition(resolveModeId(intent.skill));
}

function classifyModeIntent(intent: ResolveSkillIntent, state: ResolveSkillState): FamilyTransition | undefined {
  const roleRes = resolveCardRole(intent.skill);
  if (!roleRes.ok || roleRes.role !== CardRole.MODE) return undefined;
  if (intent.modeOp === 'manual-off') return undefined;
  const def = targetModeDefinition(intent);
  if (!def) return undefined;
  return classifyFamilyTransition(state.modes, def);
}

function isFamilyPay(classified: FamilyTransition | undefined): classified is
  | { kind: 'ascent'; fromId: string }
  | { kind: 'lateral'; fromId: string } {
  return classified?.kind === 'ascent' || classified?.kind === 'lateral';
}

function isModeOnBoard(board: ModeBoard, modeId: string): boolean {
  return board.instances.some(
    (mode) =>
      mode.id === modeId &&
      (mode.state === ModeRuntimeState.ON || mode.state === undefined),
  );
}

function modeChargesOnBoard(board: ModeBoard, modeId: string): number {
  const current = board.instances.find(
    (mode) =>
      mode.id === modeId &&
      (mode.state === ModeRuntimeState.ON || mode.state === undefined),
  );
  return current?.charges ?? 0;
}

/** Fixed modeId, else the ON instance matching requireFamily / family. */
function bindLiveModeId(board: ModeBoard, mi?: Skill['modeInteraction']): string | undefined {
  if (!mi) return undefined;
  if (mi.modeId) return mi.modeId;
  const family = mi.requireFamily ?? mi.family;
  if (!family) return undefined;
  return board.instances.find(
    (mode) =>
      mode.family === family &&
      (mode.state === ModeRuntimeState.ON || mode.state === undefined),
  )?.id;
}

function hasEnemyMark(marks: Mark[], markId: string): boolean {
  return marks.some((mark) => mark.id === markId && mark.target === CombatActor.ENEMY);
}

function hasPlayerMark(marks: Mark[], markId: string): boolean {
  return marks.some((mark) => mark.id === markId && mark.target === CombatActor.PLAYER);
}

function enemyMarkStacks(marks: readonly Mark[], markId: string): number {
  return marks.reduce(
    (sum, mark) =>
      mark.id === markId && mark.target === CombatActor.ENEMY ? sum + mark.stacks : sum,
    0,
  );
}

/** Consume up to `maxStacks` of an enemy mark. Remaining stacks stay. */
function consumeEnemyMarkStacks(
  marks: readonly Mark[],
  markId: string,
  maxStacks: number,
): { marks: Mark[]; consumed: number } {
  let remaining = Math.max(0, maxStacks);
  let consumed = 0;
  const next: Mark[] = [];
  for (const mark of marks) {
    if (remaining <= 0 || mark.id !== markId || mark.target !== CombatActor.ENEMY) {
      next.push({ ...mark });
      continue;
    }
    const take = Math.min(mark.stacks, remaining);
    remaining -= take;
    consumed += take;
    if (mark.stacks - take > 0) {
      next.push({ ...mark, stacks: mark.stacks - take });
    }
  }
  return { marks: next, consumed };
}

/** StatSystem-style: outgoing *= (1 - defensePercent * (1 - pen)). Def 0 is identity. */
function applySkillPenetration(
  damage: number,
  penetration: number,
  defensePercent = 0,
): number {
  return Math.floor(damage * (1 - defensePercent * (1 - penetration)));
}

function applySkillMarkEffects(
  state: ResolveSkillState,
  skill: Skill,
  hitsLanded = 1,
): ResolveSkillState {
  let marks = state.marks;
  for (const spec of skill.markEffects ?? []) {
    const applies = spec.perHit
      ? hitsLanded
      : spec.consume === MarkConsumeTiming.IMPACT && hitsLanded < 1
        ? 0
        : 1;
    if (applies < 1) continue;
    const added = addMark(marks, {
      id: spec.id,
      sourceSkillId: skill.id,
      owner: CombatActor.PLAYER,
      target: spec.targetActor === 'self' ? CombatActor.PLAYER : CombatActor.ENEMY,
      duration: spec.duration,
      stacks: (spec.stacks ?? 1) * applies,
      consume: spec.consume,
      trigger: spec.trigger,
      family: spec.family,
    });
    marks = added.marks;
  }
  return { ...state, marks };
}

const LAUNCHED_SETUP_MULT = 1.2;
const GUARD_BREAK_PEN = 0.15;
const WIRE_TRAP_ID = 'wire_trap';
const WIRE_TRAP_MULT = 1.2;
const COATED_ID = 'coated';

function markDamageMultiplier(spent: readonly Mark[], skill: Skill): number {
  const ids = new Set(spent.map((mark) => mark.id));
  let mult = 1;
  if (ids.has('off_balance')) mult *= 1.2;
  if (ids.has('exposed') && skill.attackMethod === AttackMethod.RANGED) mult *= 1.15;
  if (ids.has('launched') && skill.attackMethod === AttackMethod.MELEE) mult *= LAUNCHED_SETUP_MULT;
  return mult;
}

function isGatesFinisher(skill: Skill): boolean {
  const mi = skill.modeInteraction;
  if (!mi) return false;
  const family = mi.requireFamily ?? mi.family;
  return family === MODE_FAMILY.GATES && (mi.consumeAllCharges === true || Boolean(mi.requireOn));
}

function skillForcedMove(skill: Skill): { kind: 'PUSH' | 'PULL' } | undefined {
  const spec = skill.bandMove;
  if (!spec) return undefined;
  if (spec.kind === 'SELF_RETREAT') return { kind: 'PUSH' };
  if (spec.kind === 'SELF_APPROACH') return { kind: 'PULL' };
  return { kind: spec.kind };
}

function modeGrantedRanges(skill: Skill, board: ModeBoard): CombatRange[] {
  const mi = skill.modeInteraction;
  if (!mi?.modeId || !mi.grantRanges?.length) return [];
  const need = mi.consumeCharges ?? 1;
  if (modeChargesOnBoard(board, mi.modeId) < need) return [];
  return [...mi.grantRanges];
}

function isEnemyChargeDrainSupport(skill: Skill): boolean {
  return (skill.modeInteraction?.consumeCharges ?? 0) > 0 && !skill.modeInteraction?.modeId;
}

function stunControlBuff(sourceId: string, duration: number, side: 'enemy' | 'self'): Buff {
  return {
    id: `stun-${side}-${sourceId}`,
    name: 'Stun',
    duration,
    effect: { type: EffectType.STUN, duration, chance: 1 },
    source: sourceId,
  };
}

function confusionControlBuff(sourceId: string, duration: number): Buff {
  return {
    id: `confusion-${sourceId}`,
    name: 'Confusion',
    duration,
    effect: { type: EffectType.CONFUSION, duration, chance: 1 },
    source: sourceId,
  };
}

/** Player-targeted mental/control marks Kai may strip (one, first match). */
export const KAI_HOSTILE_MENTAL_MARK_IDS: readonly string[] = ['mental_bind', 'fear'];

function isHostileMentalMark(mark: Mark): boolean {
  if (mark.target !== CombatActor.PLAYER) return false;
  if (KAI_HOSTILE_MENTAL_MARK_IDS.includes(mark.id)) return true;
  return mark.family === MarkFamily.HARD_CONTROL;
}

function resolveSupportCleanse(skill: Skill, state: ResolveSkillState): ResolveSkillState {
  const spec = skill.supportCleanse;
  if (!spec) return state;
  let removed = false;
  let playerBuffs = [...(state.playerBuffs ?? [])];
  if (spec.confusion) {
    const next = playerBuffs.filter((buff) => buff.effect.type !== EffectType.CONFUSION);
    if (next.length !== playerBuffs.length) removed = true;
    playerBuffs = next;
  }
  if (spec.silence) {
    const next = playerBuffs.filter((buff) => buff.effect.type !== EffectType.SILENCE);
    if (next.length !== playerBuffs.length) removed = true;
    playerBuffs = next;
  }
  let marks = state.marks.map((mark) => ({ ...mark }));
  if (spec.oneHostileMentalMark) {
    const idx = marks.findIndex(isHostileMentalMark);
    if (idx >= 0) {
      marks = marks.filter((_, i) => i !== idx);
      removed = true;
    }
  }
  const refund = removed ? (spec.refundChakra ?? 0) : 0;
  return {
    ...state,
    playerBuffs,
    marks,
    pools: refund > 0 ? { ...state.pools, chakra: state.pools.chakra + refund } : { ...state.pools },
  };
}

/** SUPPORT Confusion: rng() < chance → enemy Confusion. Fail applies nothing. */
function resolveConfusionSupport(
  skill: Skill,
  state: ResolveSkillState,
  rng: () => number,
): ResolveSkillState {
  const spec = skill.controlConfusion;
  if (!spec) return state;
  if (rng() < spec.chance) {
    return {
      ...state,
      enemyBuffs: [...(state.enemyBuffs ?? []), confusionControlBuff(skill.id, spec.enemyDuration)],
    };
  }
  return state;
}

/** SIDE/ATTACK impact stun: rng() < chance → enemy stun. No self-stun. */
function resolveImpactStun(
  skill: Skill,
  state: ResolveSkillState,
  rng: () => number,
): ResolveSkillState {
  const spec = skill.impactStun;
  if (!spec) return state;
  if (rng() < spec.chance) {
    return {
      ...state,
      enemyBuffs: [...(state.enemyBuffs ?? []), stunControlBuff(skill.id, spec.duration, 'enemy')],
    };
  }
  return state;
}

function silenceControlBuff(sourceId: string, duration: number): Buff {
  return {
    id: `silence-${sourceId}`,
    name: 'Silence',
    duration,
    effect: { type: EffectType.SILENCE, duration, chance: 1 },
    source: sourceId,
  };
}

/** SIDE/ATTACK impact silence: rng() < chance → enemy silence. Does not end Modes. */
function resolveImpactSilence(
  skill: Skill,
  state: ResolveSkillState,
  rng: () => number,
): ResolveSkillState {
  const spec = skill.impactSilence;
  if (!spec) return state;
  if (rng() < spec.chance) {
    return {
      ...state,
      enemyBuffs: [...(state.enemyBuffs ?? []), silenceControlBuff(skill.id, spec.duration)],
    };
  }
  return state;
}

/** SUPPORT control: rng() < chance → enemy stun; else self stun. Never deals damage. */
function resolveControlSupport(
  skill: Skill,
  state: ResolveSkillState,
  rng: () => number,
): ResolveSkillState {
  const spec = skill.controlStun;
  if (!spec) return state;
  if (rng() < spec.chance) {
    return {
      ...state,
      enemyBuffs: [...(state.enemyBuffs ?? []), stunControlBuff(skill.id, spec.enemyDuration, 'enemy')],
    };
  }
  return {
    ...state,
    playerBuffs: [...state.playerBuffs, stunControlBuff(skill.id, spec.failSelfDuration, 'self')],
  };
}

function sealingSilenceBuff(sourceId: string): Buff {
  return {
    id: `silence-${sourceId}`,
    name: 'Silence',
    duration: 1,
    effect: { type: EffectType.SILENCE, duration: 1, chance: 1 },
    source: sourceId,
  };
}

function applySealingTagXor(state: ResolveSkillState, skill: Skill): ResolveSkillState {
  const board = state.enemyModes ?? emptyModeBoard();
  const pick = pickEnemyModeToDrain(board, state.enemyModeUpkeepPriority ?? []);
  if (pick) {
    const drain = drainCharges(board, pick, skill.modeInteraction?.consumeCharges ?? 1, state.turnIndex);
    if (drain.ok) {
      return { ...state, enemyModes: drain.board };
    }
  }
  return {
    ...state,
    enemyBuffs: [...(state.enemyBuffs ?? []), sealingSilenceBuff(skill.id)],
  };
}

function discoverFilterFromSkill(
  skill: Skill,
  state: ResolveSkillState,
  intent: ResolveSkillIntent,
): DiscoverFilter | undefined {
  const spec = skill.discover;
  const intentFilter = intent.discoverFilter;
  if (!spec && !intentFilter) return undefined;
  let predicate = intentFilter?.predicate;
  if (spec?.matchMainAttackTags) {
    const mainId = intent.weightContext?.mainAttackId;
    const lookup = [...(state.playablePool ?? []), ...state.skills];
    const main = lookup.find((entry) => entry.id === mainId);
    const mainTags = new Set(main?.tags ?? []);
    predicate = (candidate) => {
      if (candidate.cardRole !== CardRole.ATTACK) return false;
      if (mainTags.size === 0) return false;
      return (candidate.tags ?? []).some((tag) => mainTags.has(tag));
    };
  }
  return {
    tag: intentFilter?.tag ?? spec?.tag,
    element: intentFilter?.element ?? spec?.element,
    predicate,
  };
}

function applyDiscoverOffer(
  state: ResolveSkillState,
  skill: Skill,
  intent: ResolveSkillIntent,
  rng: () => number,
): ResolveSkillState {
  const hand = (state.hand ?? []).filter((card) => card.id !== skill.id);
  const pool = state.playablePool ?? state.skills;
  const ctx: WeightContext = intent.weightContext ?? { posture: Posture.BALANCED, turnIndex: state.turnIndex };
  const offer = discoverThree({
    pool,
    hand,
    sourceId: skill.id,
    filter: discoverFilterFromSkill(skill, state, intent),
    ctx,
    rng,
  });
  return {
    ...state,
    hand,
    pendingDiscover: {
      sourceId: skill.id,
      candidates: offer.candidates,
    },
  };
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

  const classified = classifyModeIntent(intent, state);
  if (classified?.kind === 'reject-downgrade') {
    return { ok: false, reason: 'mode-family' };
  }
  const familyPay = isFamilyPay(classified);

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
      (intent.modeOp === 'manual-off' || intent.modeOp === 'family-replace' || familyPay),
    grantedRanges: modeGrantedRanges(skill, state.modes),
  });
  if (block && !(familyPay && (block === 'ap' || block === 'chakra' || block === 'hp'))) {
    return { ok: false, reason: block };
  }
  if (familyPay) {
    const def = targetModeDefinition(intent);
    if (!def) return { ok: false, reason: 'mode-family' };
    const dry =
      classified.kind === 'ascent'
        ? ascendMode(state.modes, classified.fromId, def, modePoolsFrom(state.pools), state.turnIndex)
        : lateralSwap(state.modes, classified.fromId, def, modePoolsFrom(state.pools), state.turnIndex);
    if (!dry.ok) {
      return { ok: false, reason: dry.reason === 'cannot-afford' ? 'ap' : 'mode-family' };
    }
  }
  if (!isSkillReadyOnTurn(skill.readyOnTurn, state.turnIndex)) {
    return { ok: false, reason: 'not-ready' };
  }
  const mi = skill.modeInteraction;
  if (mi?.requireOn) {
    const boundId = bindLiveModeId(state.modes, mi);
    if (!boundId || modeChargesOnBoard(state.modes, boundId) <= 0) {
      return { ok: false, reason: 'mode-required' };
    }
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
  const classified = classifyModeIntent(intent, original);
  const familyPay = isFamilyPay(classified);

  const apCost = familyPay ? 0 : getApCost(skill);
  const chakraCost = familyPay ? 0 : effectiveChakraCost(skill, next.skipFirstSkillCost);
  const hpCost = familyPay ? 0 : skill.hpCost ?? 0;
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

  const isOffensive = role === CardRole.ATTACK || role === CardRole.SIDE_ATTACK;
  const afterAttempt = isOffensive
    ? consumeOnAttempt(
        next.marks,
        CombatActor.PLAYER,
        (mark) => {
          if (mark.id === 'lotus_opening') return isGatesFinisher(skill);
          if (mark.id === 'feint') return role === CardRole.ATTACK;
          if (mark.id === 'aim') return role === CardRole.ATTACK;
          if (mark.id === 'guard_break') return role === CardRole.ATTACK;
          if (mark.id === 'launched') {
            return role === CardRole.ATTACK && skill.attackMethod === AttackMethod.MELEE;
          }
          return true;
        },
      )
    : { marks: next.marks, spent: [] as Mark[] };
  next = { ...next, marks: afterAttempt.marks };

  const mi = skill.modeInteraction;
  const boundModeId = bindLiveModeId(next.modes, mi);
  const autoModeOn = Boolean(boundModeId && isModeOnBoard(next.modes, boundModeId));
  const remainingCharges = boundModeId ? modeChargesOnBoard(next.modes, boundModeId) : 0;
  let modeDamageBonus = 0;
  let modeBonusHits = 0;
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
  } else if (
    autoModeOn &&
    boundModeId &&
    (role === CardRole.ATTACK || role === CardRole.SIDE_ATTACK || role === CardRole.SUPPORT)
  ) {
    const markStacks = mi?.requireMarkId ? enemyMarkStacks(next.marks, mi.requireMarkId) : 0;
    const markOk =
      !mi?.requireMarkId ||
      (mi.minMarkStacks != null
        ? markStacks >= mi.minMarkStacks
        : hasEnemyMark(next.marks, mi.requireMarkId));
    let spentOk = true;
    const spendN = mi?.consumeAllCharges ? remainingCharges : (mi?.consumeCharges ?? 0);
    if (spendN > 0 && markOk) {
      const spend = (ports.spendCharges ?? trySpendCharges)(
        next.modes,
        boundModeId,
        spendN,
        next.turnIndex,
      );
      if (spend.ok) {
        next = { ...next, modes: spend.board };
      } else {
        spentOk = false;
      }
    }
    if (spentOk && markOk && (mi?.damageMultBonus ?? 0) > 0) {
      modeDamageBonus = mi?.damageMultBonus ?? 0;
    }
    if (spentOk && markOk && (mi?.damagePerMarkStackBonus ?? 0) > 0) {
      const cap = mi?.damageMarkStackCap ?? Number.POSITIVE_INFINITY;
      modeDamageBonus += Math.min(cap, (mi?.damagePerMarkStackBonus ?? 0) * markStacks);
    }
    if (spentOk && (mi?.damagePerChargeBonus ?? 0) > 0) {
      modeDamageBonus += remainingCharges * (mi?.damagePerChargeBonus ?? 0);
    }
    if (spentOk && (mi?.bonusHits ?? 0) > 0) {
      modeBonusHits = mi?.bonusHits ?? 0;
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
    const climb = ports.ascendMode ?? ascendMode;
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
    } else if (isFamilyPay(classified) && def) {
      const result =
        classified.kind === 'ascent'
          ? climb(next.modes, classified.fromId, def, modePoolsFrom(next.pools), next.turnIndex)
          : replace(next.modes, classified.fromId, def, modePoolsFrom(next.pools), next.turnIndex);
      modeActivations += 1;
      if (!result.ok) {
        return reject(original, result.reason === 'cannot-afford' ? 'ap' : 'mode-family');
      }
      next = {
        ...next,
        modes: result.board,
        pools: {
          ...next.pools,
          ap: result.pools.ap,
          chakra: result.pools.chakra,
          hp: result.pools.hp,
        },
      };
    } else {
      const result = activate(next.modes, stubDef, modePoolsFrom(next.pools), next.turnIndex);
      modeActivations += 1;
      if (result.ok) next = { ...next, modes: result.board };
    }
  } else if (role === CardRole.SUPPORT) {
    next = applySkillMarkEffects(next, skill);
    if (isEnemyChargeDrainSupport(skill)) {
      next = applySealingTagXor(next, skill);
    }
    if (skill.discover) {
      next = applyDiscoverOffer(next, skill, intent, ports.rng ?? (() => 0));
    }
    if (skill.controlStun) {
      next = resolveControlSupport(skill, next, ports.rng ?? (() => 0));
    }
    if (skill.controlConfusion) {
      next = resolveConfusionSupport(skill, next, ports.rng ?? (() => 0));
    }
    if (skill.supportCleanse) {
      next = resolveSupportCleanse(skill, next);
    }
    if ((mi?.restoreCharges ?? 0) > 0) {
      const boundId = bindLiveModeId(next.modes, mi);
      if (boundId) {
        const restored = tryRestoreCharges(next.modes, boundId, mi?.restoreCharges ?? 0);
        if (restored.ok) next = { ...next, modes: restored.board };
      }
    }
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
    const hitCount = (skill.hitCount ?? 1) + modeBonusHits;
    const multi = resolveMultiHit({ hitCount, perHit: Boolean(skill.perHitEffects?.length) }, rollHit);
    hitsLanded = multi.hitsLanded;
    damageDealt = multi.totalDamage;
    if (intent.enhanced && hitsLanded > 0 && !ports.rollHit) {
      damageDealt += Math.floor(Math.max(0, skill.baseDamage) * 0.5) * hitsLanded;
    }
    const impactSpec = skill.impactMarkConsume;
    const cpStacksConsumed =
      impactSpec && hitsLanded > 0
        ? Math.min(impactSpec.maxStacks, enemyMarkStacks(next.marks, impactSpec.markId))
        : 0;
    if (hitsLanded > 0 && (modeDamageBonus > 0 || cpStacksConsumed > 0)) {
      const modeMult = 1 + modeDamageBonus;
      const cpMult = 1 + (impactSpec?.damageMultPerStack ?? 0) * cpStacksConsumed;
      damageDealt = Math.floor(damageDealt * modeMult * cpMult);
      if (modeDamageBonus > 0 && (skill.penetration ?? 0) > 0) {
        damageDealt = applySkillPenetration(damageDealt, skill.penetration ?? 0);
      }
    }
    const markMult = markDamageMultiplier(afterAttempt.spent, skill);
    if (markMult !== 1 && hitsLanded > 0) {
      damageDealt = Math.floor(damageDealt * markMult);
    }
    const setup = skill.setupRead;
    if (setup && hitsLanded > 0 && hasEnemyMark(next.marks, setup.markId)) {
      damageDealt = Math.floor(damageDealt * (1 + setup.damageMultBonus));
    }
    if (
      role === CardRole.ATTACK &&
      hitsLanded > 0 &&
      hasEnemyMark(next.marks, WIRE_TRAP_ID)
    ) {
      damageDealt = Math.floor(damageDealt * WIRE_TRAP_MULT);
    }
    if (hitsLanded > 0 && afterAttempt.spent.some((mark) => mark.id === 'shunshin_dex')) {
      damageDealt +=
        skill.scalingStat === PrimaryStat.DEXTERITY ? Math.max(0, skill.scalingPerPoint) : 1;
    }
    if (hitsLanded > 0 && afterAttempt.spent.some((mark) => mark.id === 'aim')) {
      damageDealt +=
        skill.scalingStat === PrimaryStat.ACCURACY ? Math.max(0, skill.scalingPerPoint) : 1;
    }
    if (hitsLanded > 0 && afterAttempt.spent.some((mark) => mark.id === 'feint')) {
      damageDealt += 15;
    }
    if (hitsLanded > 0 && afterAttempt.spent.some((mark) => mark.id === 'lotus_opening')) {
      damageDealt = Math.floor(damageDealt * 1.25);
    }
    const studied = next.marks.find(
      (mark) =>
        mark.id === 'studied' &&
        mark.target === CombatActor.PLAYER &&
        mark.boundSkillId === skill.id,
    );
    const spentGuard = afterAttempt.spent.some((mark) => mark.id === 'guard_break');
    const defensePercent = next.enemyDefensePercent ?? 0;
    if (hitsLanded > 0 && (studied || spentGuard || defensePercent > 0)) {
      const pen = Math.max(
        studied ? 0.2 : 0,
        spentGuard ? GUARD_BREAK_PEN : 0,
        skill.penetration ?? 0,
      );
      damageDealt = applySkillPenetration(damageDealt, pen, defensePercent);
    }
    next = { ...next, enemyHp: Math.max(0, next.enemyHp - damageDealt) };
    if (skill.perHitEffects?.length) {
      perHitApplied = multi.perHitProcs;
    }
  }

  if (hitsLanded >= 1) {
    const skipImpactId = skill.impactMarkConsume?.markId;
    const impactPool = next.marks.filter(
      (mark) => mark.id !== skipImpactId && mark.id !== WIRE_TRAP_ID,
    );
    const reserved = next.marks.filter(
      (mark) => mark.id === skipImpactId || mark.id === WIRE_TRAP_ID,
    );
    const afterImpact = consumeOnImpact(impactPool, CombatActor.ENEMY, hitsLanded);
    next = { ...next, marks: [...afterImpact.marks, ...reserved.map((mark) => ({ ...mark }))] };
    impactSpent = afterImpact.spent;
    if (skill.impactMarkConsume) {
      const taken = consumeEnemyMarkStacks(
        next.marks,
        skill.impactMarkConsume.markId,
        skill.impactMarkConsume.maxStacks,
      );
      const drain = (skill.impactMarkConsume.drainChakraPerStack ?? 0) * taken.consumed;
      next = {
        ...next,
        marks: taken.marks,
        enemyChakra: Math.max(0, (next.enemyChakra ?? 0) - drain),
      };
    }
    if (mi?.consumeAllMatchingMarks && mi.requireMarkId) {
      next = {
        ...next,
        marks: next.marks.filter(
          (mark) => !(mark.id === mi.requireMarkId && mark.target === CombatActor.ENEMY),
        ),
      };
    }
    if (skill.setupRead?.consume === true) {
      const consumeId = skill.setupRead.markId;
      next = {
        ...next,
        marks: next.marks.filter(
          (mark) => !(mark.id === consumeId && mark.target === CombatActor.ENEMY),
        ),
      };
    }
    if (role === CardRole.ATTACK && hasEnemyMark(next.marks, WIRE_TRAP_ID)) {
      const withoutTrap = next.marks.filter(
        (mark) => !(mark.id === WIRE_TRAP_ID && mark.target === CombatActor.ENEMY),
      );
      const planted = addMark(withoutTrap, {
        id: 'bleed',
        sourceSkillId: skill.id,
        owner: CombatActor.PLAYER,
        target: CombatActor.ENEMY,
        duration: 2,
        stacks: 5,
        family: MarkFamily.DOT,
      });
      next = { ...next, marks: planted.marks };
    }
    if (
      (role === CardRole.ATTACK || role === CardRole.SIDE_ATTACK) &&
      hasPlayerMark(next.marks, COATED_ID)
    ) {
      const withoutCoat = next.marks.filter(
        (mark) => !(mark.id === COATED_ID && mark.target === CombatActor.PLAYER),
      );
      const planted = addMark(withoutCoat, {
        id: 'poison',
        sourceSkillId: skill.id,
        owner: CombatActor.PLAYER,
        target: CombatActor.ENEMY,
        duration: 3,
        stacks: 5,
        family: MarkFamily.DOT,
      });
      next = { ...next, marks: planted.marks };
    }
  }

  if (
    (role === CardRole.ATTACK || role === CardRole.SIDE_ATTACK) &&
    hitsLanded >= 1 &&
    skill.controlConfusion
  ) {
    next = resolveConfusionSupport(skill, next, ports.rng ?? (() => 0));
  }

  if (
    (role === CardRole.ATTACK || role === CardRole.SIDE_ATTACK) &&
    hitsLanded >= 1 &&
    skill.impactStun
  ) {
    next = resolveImpactStun(skill, next, ports.rng ?? (() => 0));
  }

  if (
    (role === CardRole.ATTACK || role === CardRole.SIDE_ATTACK) &&
    hitsLanded >= 1 &&
    skill.impactSilence
  ) {
    next = resolveImpactSilence(skill, next, ports.rng ?? (() => 0));
  }

  if (role === CardRole.ATTACK || role === CardRole.SIDE_ATTACK) {
    next = applySkillMarkEffects(next, skill, hitsLanded);
  }

  const supportWeightEntries = applySupportWeightOnPlay(skill, {
    mainAttackId: intent.weightContext?.mainAttackId,
    hitsLanded,
  });
  if (supportWeightEntries.length > 0) {
    next = {
      ...next,
      pendingSupportWeights: enqueueSupportWeightBonuses(
        next.pendingSupportWeights ?? [],
        supportWeightEntries,
      ),
    };
  }
  if (skill.id === GATE_PREP_ID) {
    next = { ...next, pendingGateHpDiscount: onGatePrepPlayed().pending };
  }

  let reactions: RangeReactionDef[] = [];
  const skipAuthoredMove = Boolean(skill.bandMove?.requireHit) && hitsLanded < 1;
  const movement = intent.movement ?? (skipAuthoredMove ? undefined : skillForcedMove(skill));
  if (movement) {
    const steps = Math.max(1, skill.bandMove?.steps ?? 1);
    let range = next.range;
    let voluntary = next.playerMoveUsedThisTurn ?? false;
    for (let i = 0; i < steps; i += 1) {
      const moved = resolveForcedMove(
        range,
        movement.kind,
        voluntary,
        next.reactionSources ?? [],
      );
      range = moved.range;
      voluntary = moved.playerMoveUsedThisTurn;
      reactions = moved.reactions;
    }
    next = {
      ...next,
      range,
      playerMoveUsedThisTurn: voluntary,
    };
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
    pendingDiscover: next.pendingDiscover,
  };
}

export function commitDiscoverChoice(
  state: ResolveSkillState,
  chosenSkillId: string,
): { state: ResolveSkillState; inserted: HandSnapshot | null; refused: boolean } {
  const pending = state.pendingDiscover;
  if (!pending) {
    return { state: cloneState(state), inserted: null, refused: true };
  }
  const match = pending.candidates.find((entry) => entry.skill.id === chosenSkillId);
  if (!match) {
    return { state: cloneState(state), inserted: null, refused: true };
  }
  const ctx: WeightContext = { posture: Posture.BALANCED, turnIndex: state.turnIndex };
  const snapshot = snapshotSkill(match.skill, ctx);
  const next = cloneState(state);
  const source = [...next.skills, ...(next.playablePool ?? [])].find(
    (entry) => entry.id === pending.sourceId,
  );
  let marks = next.marks;
  if (source?.discover?.matchMainAttackTags) {
    marks = [
      ...marks,
      {
        id: 'studied',
        sourceSkillId: pending.sourceId,
        owner: CombatActor.PLAYER,
        target: CombatActor.PLAYER,
        duration: 2,
        stacks: 1,
        consume: MarkConsumeTiming.NONE,
        family: MarkFamily.STAT,
        boundSkillId: chosenSkillId,
      },
    ];
  }
  return {
    state: {
      ...next,
      marks,
      hand: [...(next.hand ?? []), snapshot.skill],
      pendingDiscover: undefined,
    },
    inserted: snapshot,
    refused: false,
  };
}

/** Sim / auto-combat commit — same function as live SOUL resolve (T-009). */
export const commitSimPlayerSkill = resolveSkill;
