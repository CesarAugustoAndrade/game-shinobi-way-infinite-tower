/**
 * Headless combat driver — same commands as live useCombat, no React.
 * processUpkeep → canPlaySkill / selectBestCard → useSkill → processEnemyTurn
 */

import {
  CardRole,
  CombatRange,
  ModeRuntimeState,
  type Enemy,
  type Player,
  type Skill,
  type ApproachType,
} from '../game/types';
import type { CombatState } from '../game/systems/combat-types';
import { processUpkeep, useSkill } from '../game/systems/PlayerTurnSystem';
import { processEnemyTurn } from '../game/systems/EnemyTurnSystem';
import { getPlayerFullStats, getEnemyFullStats } from '../game/systems/StatSystem';
import { canPlaySkill, type SkillPlayContext } from '../game/systems/skillPlayability';
import { getApCost } from '../game/constants/combatCards';
import { stanceShiftFromSkill } from '../game/systems/PostureSystem';
import {
  applyRoomMovementCostToMaxAp,
  applyMovementPenaltyToMaxAp,
} from '../game/systems/LocationTerrainSystem';
import { commitDiscoverOnCombatState } from '../hooks/discoverCommit';
import { selectBestCard } from './SkillSelectionAI';
import type { BattleResult, SimCombatant } from './types';
import type { DerivedStats } from '../game/types';

export interface HeadlessCombatInput {
  player: Player;
  enemy: Enemy;
  combatState: CombatState;
  playerGoesFirst: boolean;
  /** Player already drew opening hand (live player-first skip of first processUpkeep). */
  skipOpeningUpkeep: boolean;
  maxTurns: number;
  battleId: number;
  approach: ApproachType | null;
  approachSucceeded: boolean;
  firstHitMultiplier: number;
}

export interface HeadlessCombatOutput {
  result: BattleResult;
  playerFinalChakra: number;
}

function toSim(entity: Player | Enemy, derived: DerivedStats, name: string): SimCombatant {
  return {
    name,
    primaryStats: entity.primaryStats,
    currentHp: entity.currentHp,
    maxHp: derived.maxHp,
    currentChakra: entity.currentChakra,
    maxChakra: derived.maxChakra,
    element: entity.element,
    skills: entity.skills,
    activeBuffs: entity.activeBuffs,
  };
}

function buildPlayCtx(
  skill: Skill,
  player: Player,
  maxHp: number,
  combatState: CombatState,
): SkillPlayContext {
  const modeSkill = skill.cardRole === CardRole.MODE || Boolean(skill.isToggle);
  const modeAlreadyOn = Boolean(
    modeSkill &&
      combatState.activeModes?.some(
        (mode) =>
          mode.id === skill.id &&
          (mode.state === ModeRuntimeState.ON || mode.state === undefined),
      ),
  );
  return {
    skill,
    currentChakra: player.currentChakra,
    currentHp: player.currentHp,
    maxHp,
    currentAp: combatState.currentAp,
    currentRange: combatState.currentRange ?? undefined,
    activeBuffs: player.activeBuffs,
    skipFirstSkillCost: Boolean(combatState.skipFirstSkillCost),
    modeActivation: modeSkill && !modeAlreadyOn,
    modeAlreadyOn,
    turnIndex: combatState.turnIndex,
    activeModes: combatState.activeModes ?? [],
    marks: combatState.marks ?? [],
  };
}

function tallyLog(log: string, metrics: BattleResult): void {
  if (log.includes('CRITICAL') || log.includes('Crit')) metrics.critCount += 1;
  if (/\bMISS/i.test(log) || log.includes('missed')) metrics.missCount += 1;
  if (log.includes('EVADE') || log.includes('evaded')) metrics.evasionCount += 1;
}

function refreshEnemyAp(enemy: Enemy, combatState: CombatState): CombatState {
  let budget = getEnemyFullStats(enemy, combatState.marks).derived.actionPointsPerTurn;
  budget = applyRoomMovementCostToMaxAp(budget, combatState.terrain);
  budget = applyMovementPenaltyToMaxAp(budget, combatState.locationTerrainMods);
  return {
    ...combatState,
    enemyMaxAp: budget,
    enemyCurrentAp: budget,
    enemyMoveUsedThisTurn: false,
    playerMoveUsedThisTurn: false,
  };
}

export function runHeadlessCombat(input: HeadlessCombatInput): HeadlessCombatOutput {
  let { player, enemy, combatState } = input;
  let skipUpkeep = input.skipOpeningUpkeep;
  let turns = 0;

  const metrics: BattleResult = {
    battleId: input.battleId,
    won: false,
    turns: 0,
    totalDamageDealt: 0,
    totalDamageReceived: 0,
    totalAttacks: 0,
    critCount: 0,
    missCount: 0,
    evasionCount: 0,
    gutsTriggersPlayer: 0,
    playerFinalHp: player.currentHp,
    enemyFinalHp: enemy.currentHp,
    totalChakraUsed: 0,
    totalApUsed: 0,
    totalCardsPlayed: 0,
    skillsUsed: {},
    approachUsed: input.approach,
    approachSucceeded: input.approachSucceeded,
  };

  const playerPhase = (): boolean => {
    if (!skipUpkeep) {
      const pStats = getPlayerFullStats(player, combatState.marks);
      const upkeep = processUpkeep(player, pStats, combatState, enemy);
      player = upkeep.player;
      combatState = refreshEnemyAp(enemy, {
        ...combatState,
        currentAp: upkeep.currentAp,
        maxAp: upkeep.maxAp,
        hand: upkeep.hand,
        activeModes: upkeep.activeModes,
        marks: upkeep.marks,
        turnIndex: upkeep.turnIndex,
        pendingSupportWeights: upkeep.pendingSupportWeights ?? [],
        pendingDiscover: upkeep.pendingDiscover,
        pendingCpUpkeepDiscount: upkeep.pendingCpUpkeepDiscount,
      });
    }
    skipUpkeep = false;

    const pending = combatState.pendingDiscover;
    if (pending && pending.candidates.length > 0) {
      const pick = pending.candidates[0].skill.id;
      const committed = commitDiscoverOnCombatState(combatState, pick, player.skills);
      if (!committed.refused) combatState = committed.combatState;
    }

    while (
      combatState.currentAp > 0 &&
      combatState.hand.length > 0 &&
      player.currentHp > 0 &&
      enemy.currentHp > 0
    ) {
      const pStats = getPlayerFullStats(player, combatState.marks);
      const eStats = getEnemyFullStats(enemy, combatState.marks);
      const liveHand = combatState.hand.map(
        (card) => player.skills.find((skill) => skill.id === card.id) ?? card,
      );
      const gated = liveHand.filter((skill) =>
        canPlaySkill(buildPlayCtx(skill, player, pStats.derived.maxHp, combatState)),
      );
      const card = selectBestCard(
        gated,
        combatState.currentAp,
        toSim(player, pStats.derived, String(player.clan)),
        pStats.derived,
        toSim(enemy, eStats.derived, enemy.name),
        eStats.derived,
        combatState.isFirstTurn,
        input.firstHitMultiplier,
        combatState.currentRange ?? CombatRange.MEDIUM,
      );
      if (!card) break;

      const chakraBefore = player.currentChakra;
      const hpBefore = player.currentHp;
      const used = useSkill(player, pStats, enemy, eStats, card, combatState);
      if (!used) break;
      if (used.apCost === 0 && used.damageDealt === 0 && used.logType === 'danger') {
        break;
      }

      player = {
        ...player,
        currentHp: used.newPlayerHp,
        currentChakra: used.newPlayerChakra,
        activeBuffs: used.newPlayerBuffs,
        skills: used.skillsUpdate ?? player.skills,
      };
      enemy = {
        ...enemy,
        currentHp: used.newEnemyHp,
        currentChakra: used.newEnemyChakra ?? enemy.currentChakra,
        activeBuffs: used.newEnemyBuffs,
      };

      const spentAp = used.apCost || getApCost(card);
      const sourceHand = used.hand ?? combatState.hand;
      const shift = stanceShiftFromSkill(card);
      combatState = {
        ...combatState,
        currentAp: used.newCurrentAp ?? Math.max(0, combatState.currentAp - spentAp),
        hand: sourceHand.filter((entry) => entry.id !== card.id),
        posture: shift ?? combatState.posture,
        currentRange: used.currentRange ?? combatState.currentRange,
        marks: used.marks ?? combatState.marks,
        activeModes: used.activeModes ?? combatState.activeModes,
        playerMoveUsedThisTurn:
          used.playerMoveUsedThisTurn ?? combatState.playerMoveUsedThisTurn,
        pendingSupportWeights: used.pendingSupportWeights ?? combatState.pendingSupportWeights,
        pendingDiscover: used.pendingDiscover,
        pendingGateHpDiscount: used.pendingGateHpDiscount,
        pendingCpUpkeepDiscount: used.pendingCpUpkeepDiscount,
        skipFirstSkillCost: false,
        isFirstTurn:
          combatState.isFirstTurn && used.damageDealt > 0 ? false : combatState.isFirstTurn,
        artifactGutsUsed: used.artifactGutsTriggered ? true : combatState.artifactGutsUsed,
      };

      metrics.totalCardsPlayed += 1;
      metrics.totalApUsed += spentAp;
      metrics.totalChakraUsed += Math.max(0, chakraBefore - player.currentChakra);
      metrics.totalDamageDealt += used.damageDealt;
      metrics.totalDamageReceived += Math.max(0, hpBefore - player.currentHp);
      metrics.totalAttacks += 1;
      metrics.skillsUsed[card.id] = (metrics.skillsUsed[card.id] ?? 0) + 1;
      tallyLog(used.logMessage, metrics);
      if (used.artifactGutsTriggered) metrics.gutsTriggersPlayer += 1;

      if (used.enemyDefeated || used.playerDefeated) return true;
    }
    return player.currentHp <= 0 || enemy.currentHp <= 0;
  };

  const enemyPhase = (): boolean => {
    if (player.currentHp <= 0 || enemy.currentHp <= 0) return true;
    const hpBefore = player.currentHp;
    const pStats = getPlayerFullStats(player, combatState.marks);
    const eStats = getEnemyFullStats(enemy, combatState.marks);
    const er = processEnemyTurn(player, pStats, enemy, eStats, combatState);
    player = {
      ...player,
      currentHp: er.newPlayerHp,
      currentChakra: er.newPlayerChakra,
      activeBuffs: er.newPlayerBuffs,
      skills: er.playerSkills,
    };
    enemy = {
      ...enemy,
      currentHp: er.newEnemyHp,
      currentChakra: er.newEnemyChakra,
      activeBuffs: er.newEnemyBuffs,
      skills: er.enemySkills,
      intendedSkillId: er.intendedSkillId ?? enemy.intendedSkillId,
      intendedSkillName: er.intendedSkillName ?? enemy.intendedSkillName,
    };
    combatState = {
      ...combatState,
      artifactGutsUsed: er.artifactGutsTriggered ? true : combatState.artifactGutsUsed,
      currentRange: er.currentRange ?? combatState.currentRange,
      enemyCurrentAp: er.enemyCurrentAp ?? combatState.enemyCurrentAp,
      enemyMoveUsedThisTurn: er.enemyMoveUsedThisTurn ?? false,
      marks: er.marks ?? combatState.marks,
    };
    metrics.totalDamageReceived += Math.max(0, hpBefore - player.currentHp);
    if (er.artifactGutsTriggered) metrics.gutsTriggersPlayer += 1;
    for (const line of er.logMessages) tallyLog(line, metrics);
    return er.playerDefeated || er.enemyDefeated || player.currentHp <= 0 || enemy.currentHp <= 0;
  };

  while (turns < input.maxTurns && player.currentHp > 0 && enemy.currentHp > 0) {
    turns += 1;
    let ended = false;
    if (input.playerGoesFirst) {
      ended = playerPhase();
      if (!ended) ended = enemyPhase();
    } else {
      ended = enemyPhase();
      if (!ended) ended = playerPhase();
    }
    if (ended) break;
  }

  metrics.turns = turns;
  metrics.won = enemy.currentHp <= 0 && player.currentHp > 0;
  metrics.playerFinalHp = player.currentHp;
  metrics.enemyFinalHp = enemy.currentHp;
  return { result: metrics, playerFinalChakra: player.currentChakra };
}
