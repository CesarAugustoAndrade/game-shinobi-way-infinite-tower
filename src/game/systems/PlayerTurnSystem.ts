/**
 * =============================================================================
 * PLAYER TURN SYSTEM - Player Turn Processing
 * =============================================================================
 *
 * This system handles player turn processing including:
 * - Skill execution (useSkill)
 * - Approach effect application at combat start
 * - Upkeep processing (toggle costs, passive regen)
 *
 * ## PLAYER TURN ORDER
 *
 * 1. Upkeep Phase (processUpkeep):
 *    - SOUL clock: Mode upkeep → regen → snapshot draw → mark duration
 *    - Untracked legacy toggles still pay CP upkeep (not board Modes)
 *    - Apply passive/artifact regen after Mode upkeep (never funds it)
 *
 * 2. Action Phase (useSkill):
 *    - Adapter over resolveSkill (T-082 live cutover)
 *    - Maps CombatState + actors → ResolveSkillState
 *    - Projects commit back to CombatResult (exported shape preserved)
 *    - Artifact on-hit + guts/survival after hit (not yet in resolveSkill)
 *
 * =============================================================================
 */

import {
  applyMovementPenaltyToMaxAp,
  applyRoomMovementCostToMaxAp,
} from './LocationTerrainSystem';
import {
  Player,
  Enemy,
  Skill,
  EffectType,
  CharacterStats,
  ActionType,
  Posture,
  RangeMoveDirection,
  ModeRuntimeState,
  ActiveModeRuntime,
  TypedCost,
  CardRole,
  CombatRange,
  Mark,
} from '../types';
import {
  outOfRangeBlockReason,
  shiftRange,
  voluntaryMoveCost,
  collectRangeReactions,
} from './RangeSystem';
import { RangeMoveTrigger } from '../types';
import { CombatModifiers } from './ApproachSystem';
import { logFlowCheckpoint } from '../utils/combatDebug';
import { LaunchProperties } from '../../config/featureFlags';
import { resolvePassiveDamageBonus } from './StatSystem';
import { getTerrainEvasionBonus } from './CombatCalculationSystem';
import {
  processPassivesOnHit,
  processPassivesOnTurnStart,
  checkGutsPassive,
  getTotalDefenseBypass,
  getCritDefenseBypass,
  hasAllElementsPassive,
  getConvertToElementalPercent,
  applyClanTraitToDamageContext,
} from './EquipmentPassiveSystem';
import { getEventFlagRunModifiers } from './EventSystem';
import { getApCost } from '../constants/combatCards';
import { stanceShiftFromSkill } from './PostureSystem';
import { buildDeck, drawNewTurnHand } from './DeckSystem';
import { checkLethalDamage } from './SurvivalSystem';
import type { CombatState, CombatResult, UpkeepResult } from './combat-types';
import { runTurnStartClock } from './TurnClockSystem';
import { getModeDefinition } from '../constants/modes';
import { normalizeSkillConfig } from './SkillConfigLive';
import type { WeightContext } from './DeckSystem';
import { buildModeWeightBonuses } from './ModeWeightSystem';
import {
  consumeSupportWeightBonuses,
  type PendingSupportWeight,
} from './SupportWeightSystem';
import {
  resolveSkill,
  type PendingDiscover,
  type ResolveRejectReason,
  type ResolveSkillIntent,
  type ResolveSkillPorts,
  type ResolveSkillResult,
  type ResolveSkillState,
} from './ResolveSkillSystem';

// ============================================================================
// APPROACH EFFECTS
// ============================================================================

/**
 * Apply approach buffs/debuffs at combat start.
 * Called once when combat begins after player selects an approach.
 *
 * @param player - Current player state
 * @param enemy - Current enemy state
 * @param modifiers - Combat modifiers from the selected approach
 * @returns Updated player and enemy states with approach effects applied
 */
export function applyApproachEffects(
  player: Player,
  enemy: Enemy,
  modifiers: CombatModifiers
): { player: Player; enemy: Enemy; logs: string[] } {
  const logs: string[] = [];
  let updatedPlayer = { ...player };
  let updatedEnemy = { ...enemy };

  // Apply player buffs/penalties from approach (success = buffs; failure = debuffs/curses)
  if (modifiers.playerBuffs && modifiers.playerBuffs.length > 0) {
    updatedPlayer.activeBuffs = [...updatedPlayer.activeBuffs, ...modifiers.playerBuffs];
    const isPenalty = modifiers.playerBuffs.some((b) => {
      const t = b.effect?.type;
      return (
        t === EffectType.DEBUFF ||
        t === EffectType.CURSE ||
        t === EffectType.CONFUSION ||
        t === EffectType.STUN ||
        t === EffectType.SILENCE
      );
    });
    logs.push(
      isPenalty
        ? 'Your approach fails — you enter combat at a disadvantage!'
        : 'Your approach grants combat advantages!',
    );
  }

  // Apply enemy debuffs from approach (success only in practice)
  if (modifiers.enemyDebuffs && modifiers.enemyDebuffs.length > 0) {
    updatedEnemy.activeBuffs = [...updatedEnemy.activeBuffs, ...modifiers.enemyDebuffs];
    logs.push(`${enemy.name} is affected by your approach!`);
  }

  return { player: updatedPlayer, enemy: updatedEnemy, logs };
}

// ============================================================================
// UPKEEP PROCESSING
// ============================================================================

export function buildUpkeepWeightContext(
  player: Player,
  combatState: CombatState,
): WeightContext {
  const config = normalizeSkillConfig(player.skillConfig);
  const activeModes = combatState.activeModes ?? [];
  const consumed = consumeSupportWeightBonuses(combatState.pendingSupportWeights ?? []);
  return {
    posture: combatState.posture,
    turnIndex: combatState.turnIndex,
    mainAttackId: config.mainAttackId,
    activeModeIds: activeModes
      .filter((mode) => mode.state === ModeRuntimeState.ON || mode.state === undefined)
      .map((mode) => mode.id),
    modeBonuses: buildModeWeightBonuses(activeModes),
    supportBonuses: consumed.bonuses,
    supportRoleBonuses: consumed.roleBonuses,
    supportMentalAttackBonus: consumed.mentalAttackBonus,
    supportTagBonuses: consumed.tagBonuses,
  };
}

function isBoardTrackedMode(skillId: string, boardIds: ReadonlySet<string>): boolean {
  return boardIds.has(skillId);
}

function modeCostsForBoard(modes: readonly ActiveModeRuntime[]): Record<string, TypedCost> {
  const costs: Record<string, TypedCost> = {};
  for (const mode of modes) {
    const def = getModeDefinition(mode.id);
    if (def) {
      costs[mode.id] = def.upkeep;
    }
  }
  return costs;
}

function persistModeBoard(
  parked: readonly ActiveModeRuntime[],
  remainingOn: readonly ActiveModeRuntime[],
  endedIds: readonly string[],
): ActiveModeRuntime[] {
  const cooling: ActiveModeRuntime[] = endedIds.map((id) => {
    const def = getModeDefinition(id);
    return {
      id,
      family: def?.family ?? '',
      charges: 0,
      cooldown: def?.cooldown ?? 0,
      state: ModeRuntimeState.COOLDOWN,
      stage: def?.stage,
    };
  });
  return [
    ...parked.map((mode) => ({ ...mode })),
    ...remainingOn.map((mode) => ({ ...mode, state: ModeRuntimeState.ON })),
    ...cooling,
  ];
}

/**
 * Process upkeep phase at the start of player's turn (SOUL phases 01–04).
 * Board Modes pay via `runTurnStartClock` (upkeep before regen). Untracked
 * legacy toggles still pay chakra upkeep. AP restore stays adjacent, not inside Mode upkeep.
 */
export function processUpkeep(
  player: Player,
  playerStats: CharacterStats,
  combatState: CombatState,
  enemy?: Enemy
): UpkeepResult {
  let updatedPlayer = { ...player };
  const logs: string[] = [];
  const togglesDeactivated: string[] = [];
  const turnIndex = combatState.turnIndex ?? 1;
  const board = combatState.activeModes ?? [];
  const onModes = board.filter(
    (mode) => mode.state === ModeRuntimeState.ON || mode.state === undefined,
  );
  const parked = board.filter(
    (mode) => mode.state !== undefined && mode.state !== ModeRuntimeState.ON,
  );
  const boardIds = new Set(onModes.map((mode) => mode.id));

  // Legacy toggle CP upkeep — skip rows the Mode board already tracks.
  updatedPlayer.skills = updatedPlayer.skills.map(skill => {
    if (!skill.isToggle || !skill.isActive) return skill;
    if (isBoardTrackedMode(skill.id, boardIds)) return skill;

    const upkeepCost = skill.upkeepCost || 0;
    if (upkeepCost <= 0) return skill;

    if (updatedPlayer.currentChakra >= upkeepCost) {
      updatedPlayer.currentChakra -= upkeepCost;
      logs.push(`${skill.name} upkeep: -${upkeepCost} CP`);
      return skill;
    }
    logs.push(`${skill.name} deactivated (insufficient chakra)`);
    togglesDeactivated.push(skill.name);
    updatedPlayer.activeBuffs = updatedPlayer.activeBuffs.filter(
      buff => buff.source !== skill.name
    );
    return { ...skill, isActive: false };
  });

  let regenChakra = 0;
  let regenHp = 0;
  const passiveSkills = updatedPlayer.skills.filter(
    s => s.actionType === ActionType.PASSIVE && s.passiveEffect?.regenBonus
  );
  for (const skill of passiveSkills) {
    const regen = skill.passiveEffect?.regenBonus;
    if (regen?.hp && regen.hp > 0) {
      regenHp += regen.hp;
      logs.push(`${skill.name}: +${regen.hp} HP`);
    }
    if (regen?.chakra && regen.chakra > 0) {
      regenChakra += regen.chakra;
      logs.push(`${skill.name}: +${regen.chakra} CP`);
    }
  }

  if (enemy) {
    const turnStartResult = processPassivesOnTurnStart(
      updatedPlayer,
      enemy,
      playerStats.derived.maxHp
    );
    regenHp += turnStartResult.healToPlayer;
    regenChakra += turnStartResult.chakraRestored;
    logs.push(...turnStartResult.logs);
  }

  const pool =
    combatState.playablePool.length > 0
      ? combatState.playablePool
      : buildDeck(updatedPlayer.skills);
  const playerPriority = normalizeSkillConfig(updatedPlayer.skillConfig).modeUpkeepPriority;
  const priority =
    combatState.modeUpkeepPriority && combatState.modeUpkeepPriority.length > 0
      ? combatState.modeUpkeepPriority
      : playerPriority.length > 0
        ? playerPriority
        : onModes.map((mode) => mode.id);

  const clock = runTurnStartClock({
    turnIndex,
    chakra: updatedPlayer.currentChakra,
    hp: updatedPlayer.currentHp,
    regen: {
      chakra: regenChakra,
      hp: regenHp,
      maxChakra: playerStats.derived.maxChakra,
      maxHp: playerStats.derived.maxHp,
    },
    modes: onModes,
    modeCosts: modeCostsForBoard(onModes),
    modeUpkeepPriority: priority,
    marks: combatState.marks ?? [],
    hand: combatState.hand,
    snapshotDraw: () =>
      drawNewTurnHand(
        pool,
        buildUpkeepWeightContext(updatedPlayer, combatState),
        LaunchProperties.HAND_SIZE,
        Math.random,
      ).hand,
  });

  updatedPlayer = {
    ...updatedPlayer,
    currentChakra: clock.chakra,
    currentHp: clock.hp,
  };

  for (const ended of clock.endedModes) {
    logs.push(`${ended.id} Mode ended (insufficient upkeep)`);
  }

  let maxAp = applyRoomMovementCostToMaxAp(
    playerStats.derived.actionPointsPerTurn,
    combatState.terrain,
  );
  maxAp = applyMovementPenaltyToMaxAp(maxAp, combatState.locationTerrainMods);

  return {
    player: updatedPlayer,
    logs,
    togglesDeactivated,
    currentAp: maxAp,
    maxAp,
    hand: clock.hand,
    turnIndex: clock.turnIndex,
    activeModes: persistModeBoard(
      parked,
      clock.modes,
      clock.endedModes.map((ended) => ended.id),
    ),
    marks: clock.marks,
  };
}

// ============================================================================
// VOLUNTARY RANGE MOVE (F2)
// ============================================================================

export interface VoluntaryMoveResult {
  success: boolean;
  combatState: CombatState;
  logMessage: string;
  /** True when blocked (no AP, already moved, boundary). */
  blocked: boolean;
}

/**
 * Player voluntary move: one band, once per turn, base 1 AP (+ optional surcharge).
 * Immutable CombatState update.
 */
export function voluntaryPlayerMove(
  combatState: CombatState,
  direction: RangeMoveDirection,
  apSurcharge: number = 0
): VoluntaryMoveResult {
  if (combatState.playerMoveUsedThisTurn) {
    return {
      success: false,
      blocked: true,
      combatState,
      logMessage: 'Already moved this turn.',
    };
  }
  const cost = voluntaryMoveCost(apSurcharge);
  if (combatState.currentAp < cost) {
    return {
      success: false,
      blocked: true,
      combatState,
      logMessage: `Not enough AP to move (need ${cost}).`,
    };
  }
  const { range, moved } = shiftRange(combatState.currentRange, direction);
  if (!moved) {
    return {
      success: false,
      blocked: true,
      combatState,
      logMessage: 'Cannot move further in that direction.',
    };
  }
  // Empty reaction hooks (no content adapted this delivery)
  void collectRangeReactions(RangeMoveTrigger.VOLUNTARY, moved, false);

  return {
    success: true,
    blocked: false,
    combatState: {
      ...combatState,
      currentRange: range,
      currentAp: combatState.currentAp - cost,
      playerMoveUsedThisTurn: true,
    },
    logMessage:
      direction === RangeMoveDirection.APPROACH
        ? `You close the gap → ${range}.`
        : `You create distance → ${range}.`,
  };
}

// ============================================================================
// SKILL EXECUTION (T-082 adapter over resolveSkill)
// ============================================================================

/** Board fields resolveSkill owns; extra on CombatResult so useCombat still compiles. */
export interface LiveCombatBoardPatch {
  currentRange: CombatRange;
  newCurrentAp: number;
  marks: Mark[];
  activeModes: ActiveModeRuntime[];
  playerMoveUsedThisTurn: boolean;
  hand?: Skill[];
  pendingSupportWeights?: PendingSupportWeight[];
  pendingDiscover?: PendingDiscover;
  pendingGateHpDiscount?: boolean;
}

export type LiveCombatResult = CombatResult & Partial<LiveCombatBoardPatch>;

const UNBOUNDED_AP = 1_000_000;

/** Residual: unauthored live skills need a role so resolveSkill can commit. */
function authorLiveSkill(skill: Skill): Skill {
  if (skill.cardRole !== undefined) return skill;
  if (skill.actionType === ActionType.TOGGLE || skill.isToggle) {
    return { ...skill, cardRole: CardRole.MODE };
  }
  return { ...skill, cardRole: CardRole.ATTACK };
}

function toResolveSkillState(
  player: Player,
  playerStats: CharacterStats,
  enemy: Enemy,
  combatState?: CombatState,
): ResolveSkillState {
  return {
    pools: {
      ap: combatState?.currentAp ?? UNBOUNDED_AP,
      chakra: player.currentChakra,
      hp: player.currentHp,
      maxHp: playerStats?.derived?.maxHp ?? player.currentHp,
    },
    range: combatState?.currentRange ?? CombatRange.MEDIUM,
    turnIndex: combatState?.turnIndex ?? 1,
    marks: combatState?.marks ?? [],
    modes: { instances: (combatState?.activeModes ?? []).map((mode) => ({ ...mode })) },
    skills: player.skills,
    playerBuffs: player.activeBuffs,
    enemyHp: enemy.currentHp,
    enemyChakra: enemy.currentChakra,
    skipFirstSkillCost: combatState?.skipFirstSkillCost,
    playerMoveUsedThisTurn: combatState?.playerMoveUsedThisTurn,
    hand: combatState?.hand,
    playablePool: combatState?.playablePool,
    pendingDiscover: combatState?.pendingDiscover,
    pendingSupportWeights: combatState?.pendingSupportWeights,
    enemyBuffs: enemy.activeBuffs,
  };
}

function toResolveSkillIntent(skill: Skill, player: Player, combatState?: CombatState): ResolveSkillIntent {
  return {
    skill: authorLiveSkill(skill),
    weightContext: combatState
      ? buildUpkeepWeightContext(player, combatState)
      : { posture: Posture.BALANCED, turnIndex: 1 },
  };
}

function toResolveSkillPorts(
  player: Player,
  playerStats: CharacterStats,
  enemy: Enemy,
  enemyStats: CharacterStats,
  skill: Skill,
  combatState?: CombatState,
): ResolveSkillPorts {
  const clanCtx = applyClanTraitToDamageContext(
    player,
    playerStats.derived,
    enemyStats.effectivePrimary,
    enemyStats.derived,
  );
  const roomEvasion = getTerrainEvasionBonus(combatState?.terrain ?? null);
  const defenderDerived =
    roomEvasion !== 0
      ? {
          ...clanCtx.defenderDerived,
          evasion: Math.min(0.75, clanCtx.defenderDerived.evasion + roomEvasion),
        }
      : clanCtx.defenderDerived;
  return {
    rng: Math.random,
    combatants: {
      attackerPrimary: playerStats.effectivePrimary,
      attackerDerived: clanCtx.attackerDerived,
      defenderPrimary: clanCtx.defenderPrimary,
      defenderDerived,
      attackerElement: player.element,
      defenderElement: enemy.element,
    },
    damageOptions: {
      damageBonus:
        resolvePassiveDamageBonus(playerStats.passiveBonuses, skill.element)
        + getEventFlagRunModifiers(player).damageBonus,
      defenseBypass: getTotalDefenseBypass(player),
      critDefenseBypass: getCritDefenseBypass(player),
      forceSuperEffective: hasAllElementsPassive(player),
      convertToElementalPercent: getConvertToElementalPercent(player),
    },
  };
}

function rejectLogMessage(
  reason: ResolveRejectReason,
  skill: Skill,
  combatState?: CombatState,
): string {
  switch (reason) {
    case 'stun':
      return 'You are stunned!';
    case 'silence':
      return 'You are Silenced and cannot use chakra skills!';
    case 'chakra':
    case 'hp':
      return 'Insufficient Chakra or HP!';
    case 'ap':
      return 'Not enough Action Points!';
    case 'range':
      return combatState?.currentRange
        ? outOfRangeBlockReason(skill, combatState.currentRange)
        : 'Out of range';
    case 'not-ready':
      return 'That skill is not ready this turn!';
    case 'mode-required':
      return 'Required Mode is not active!';
    case 'mode-family':
      return 'Cannot change Mode family that way!';
    case 'incomplete-authoring':
      return 'Skill is missing a card role!';
    case 'invalid-snapshot':
      return 'Invalid card snapshot!';
    default:
      return 'Cannot use that skill!';
  }
}

function rejectToCombatResult(
  reason: ResolveRejectReason,
  player: Player,
  enemy: Enemy,
  skill: Skill,
  combatState?: CombatState,
): LiveCombatResult | null {
  if (reason === 'cooldown' || reason === 'passive') return null;
  return {
    damageDealt: 0,
    newEnemyHp: enemy.currentHp,
    newPlayerHp: player.currentHp,
    newPlayerChakra: player.currentChakra,
    newEnemyBuffs: enemy.activeBuffs,
    newPlayerBuffs: player.activeBuffs,
    logMessage: rejectLogMessage(reason, skill, combatState),
    logType: 'danger',
    enemyDefeated: false,
    apCost: 0,
  };
}

function commitLogMessage(
  skill: Skill,
  resolved: Extract<ResolveSkillResult, { ok: true }>,
  skipCost: boolean,
  extra: string[],
): string {
  const offensive = resolved.role === CardRole.ATTACK || resolved.role === CardRole.SIDE_ATTACK;
  let logMsg: string;
  if (offensive && resolved.hitsLanded < 1) {
    logMsg = `You used ${skill.name} but MISSED!`;
  } else if (resolved.damageDealt > 0) {
    logMsg = `Used ${skill.name} for ${resolved.damageDealt} dmg`;
  } else {
    logMsg = `Used ${skill.name}`;
  }
  if (skipCost) logMsg += ' FREE!';
  if (extra.length > 0) logMsg += ` ${extra.join(' ')}`;
  return logMsg;
}

function applyArtifactOnHit(
  player: Player,
  enemy: Enemy,
  playerStats: CharacterStats,
  resolved: Extract<ResolveSkillResult, { ok: true }>,
): {
  playerHp: number;
  playerChakra: number;
  enemyChakra: number;
  enemyBuffs: LiveCombatResult['newEnemyBuffs'];
  playerBuffs: LiveCombatResult['newPlayerBuffs'];
  logs: string[];
} {
  let playerHp = resolved.state.pools.hp;
  let playerChakra = resolved.state.pools.chakra;
  let enemyChakra = resolved.state.enemyChakra ?? enemy.currentChakra;
  let enemyBuffs = [...(resolved.state.enemyBuffs ?? enemy.activeBuffs)];
  let playerBuffs = [...resolved.state.playerBuffs];
  const logs: string[] = [];
  if (resolved.hitsLanded < 1) {
    return { playerHp, playerChakra, enemyChakra, enemyBuffs, playerBuffs, logs };
  }
  const onHit = processPassivesOnHit(
    { ...player, currentHp: playerHp, currentChakra: playerChakra, activeBuffs: playerBuffs },
    { ...enemy, currentHp: resolved.state.enemyHp, currentChakra: enemyChakra, activeBuffs: enemyBuffs },
    resolved.damageDealt,
    false,
  );
  const newDebuffs = onHit.enemy.activeBuffs.filter(
    (buff) => !enemyBuffs.some((existing) => existing.id === buff.id),
  );
  enemyBuffs = [...enemyBuffs, ...newDebuffs];
  if (onHit.healToPlayer > 0) {
    playerHp = Math.min(playerStats.derived.maxHp, playerHp + onHit.healToPlayer);
  }
  if (onHit.chakraRestored > 0) {
    playerChakra = Math.min(playerStats.derived.maxChakra, playerChakra + onHit.chakraRestored);
  }
  if (onHit.enemy.currentChakra !== enemyChakra) {
    enemyChakra = onHit.enemy.currentChakra;
  } else if (onHit.chakraDrained > 0) {
    enemyChakra = Math.max(0, enemyChakra - onHit.chakraDrained);
  }
  logs.push(...onHit.logs);
  return { playerHp, playerChakra, enemyChakra, enemyBuffs, playerBuffs, logs };
}

function applyGutsIfLethal(
  player: Player,
  playerStats: CharacterStats,
  currentHp: number,
  incomingDamage: number,
  artifactGutsUsed?: boolean,
): { hp: number; artifactGutsTriggered: boolean; log?: string } {
  if (currentHp > 0 || incomingDamage <= 0) {
    return { hp: currentHp, artifactGutsTriggered: false };
  }
  const lethal = checkLethalDamage(
    player.currentHp,
    incomingDamage,
    playerStats.derived.gutsChance,
    { triggered: false, artifactTriggered: false },
    checkGutsPassive(player),
    artifactGutsUsed,
    playerStats.derived.maxHp,
  );
  return {
    hp: lethal.newHp,
    artifactGutsTriggered: lethal.artifactGutsTriggered,
    log: lethal.log,
  };
}

/**
 * Live skill adapter: maps pools/board → resolveSkill and projects CombatResult.
 * Does not reimplement hit math (T-088). Name kept so useCombat callers compile.
 */
export function useSkill(
  player: Player,
  playerStats: CharacterStats,
  enemy: Enemy,
  enemyStats: CharacterStats,
  skill: Skill,
  combatState?: CombatState,
): LiveCombatResult | null {
  logFlowCheckpoint('useSkill START', {
    skill: skill.name,
    playerHp: player.currentHp,
    playerChakra: player.currentChakra,
    enemyHp: enemy.currentHp,
    enemyName: enemy.name,
  });

  const resolved = resolveSkill(
    toResolveSkillIntent(skill, player, combatState),
    toResolveSkillState(player, playerStats, enemy, combatState),
    toResolveSkillPorts(player, playerStats, enemy, enemyStats, skill, combatState),
  );

  if (!resolved.ok) {
    return rejectToCombatResult(resolved.reason, player, enemy, skill, combatState);
  }

  const spentAp = (combatState?.currentAp ?? UNBOUNDED_AP) - resolved.state.pools.ap;
  const skipCost = Boolean(combatState?.skipFirstSkillCost);

  if (skill.mutualKo) {
    const result: LiveCombatResult = {
      damageDealt: enemy.currentHp,
      newEnemyHp: 0,
      newPlayerHp: 0,
      newPlayerChakra: resolved.state.pools.chakra,
      newEnemyChakra: resolved.state.enemyChakra ?? enemy.currentChakra,
      newEnemyBuffs: resolved.state.enemyBuffs ?? enemy.activeBuffs,
      newPlayerBuffs: resolved.state.playerBuffs,
      logMessage: `${skill.name}! Mutual seal — both fall.`,
      logType: 'danger',
      skillsUpdate: resolved.state.skills,
      enemyDefeated: true,
      playerDefeated: true,
      apCost: Math.max(0, spentAp),
      currentRange: resolved.state.range,
      newCurrentAp: resolved.state.pools.ap,
      marks: resolved.state.marks,
      activeModes: resolved.state.modes.instances,
      playerMoveUsedThisTurn: resolved.state.playerMoveUsedThisTurn ?? false,
      hand: resolved.state.hand,
      pendingSupportWeights: resolved.state.pendingSupportWeights,
      pendingDiscover: resolved.state.pendingDiscover,
      pendingGateHpDiscount: resolved.state.pendingGateHpDiscount,
    };
    logFlowCheckpoint('useSkill END', {
      damageDealt: result.damageDealt,
      enemyDefeated: true,
      playerDefeated: true,
      newEnemyHp: 0,
    });
    return result;
  }

  const onHit = applyArtifactOnHit(player, enemy, playerStats, resolved);
  const hpLost = player.currentHp - onHit.playerHp;
  const guts = applyGutsIfLethal(
    player,
    playerStats,
    onHit.playerHp,
    hpLost,
    combatState?.artifactGutsUsed,
  );
  const extraLogs = [...onHit.logs];
  if (guts.log) extraLogs.push(guts.log);

  const newEnemyHp = resolved.state.enemyHp;
  const result: LiveCombatResult = {
    damageDealt: resolved.damageDealt,
    newEnemyHp,
    newPlayerHp: guts.hp,
    newPlayerChakra: onHit.playerChakra,
    newEnemyChakra: onHit.enemyChakra,
    newEnemyBuffs: onHit.enemyBuffs,
    newPlayerBuffs: onHit.playerBuffs,
    logMessage: commitLogMessage(skill, resolved, skipCost, extraLogs),
    logType: resolved.hitsLanded < 1 && resolved.damageDealt === 0 ? 'info' : 'combat',
    skillsUpdate: resolved.state.skills,
    enemyDefeated: newEnemyHp <= 0,
    playerDefeated: guts.hp <= 0,
    apCost: Math.max(0, spentAp),
    newPosture: stanceShiftFromSkill(skill),
    artifactGutsTriggered: guts.artifactGutsTriggered || undefined,
    currentRange: resolved.state.range,
    newCurrentAp: resolved.state.pools.ap,
    marks: resolved.state.marks,
    activeModes: resolved.state.modes.instances,
    playerMoveUsedThisTurn: resolved.state.playerMoveUsedThisTurn ?? false,
    hand: resolved.state.hand,
    pendingSupportWeights: resolved.state.pendingSupportWeights,
    pendingDiscover: resolved.state.pendingDiscover,
    pendingGateHpDiscount: resolved.state.pendingGateHpDiscount,
  };

  logFlowCheckpoint('useSkill END', {
    damageDealt: result.damageDealt,
    enemyDefeated: result.enemyDefeated,
    playerDefeated: result.playerDefeated,
    newEnemyHp: result.newEnemyHp,
  });

  return result;
}
