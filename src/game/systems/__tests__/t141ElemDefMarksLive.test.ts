/**
 * T-141 AC: suijinheki_elem_def stacks feed elementalDefenseFlat; primaries ignored.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AttackMethod,
  CombatActor,
  CombatRange,
  DamageType,
  ElementType,
  MarkFamily,
  Posture,
  PrimaryStat,
} from '../../types';
import { elementalDefenseFlatFromMarks } from '../MarkSystem';
import { calculateDamage, calculateDerivedStats, getPlayerFullStats } from '../StatSystem';
import { executeEnemyAction } from '../EnemyTurnSystem';
import type { CombatState } from '../combat-types';
import type { Mark } from '../../types';
import { BASE_STATS, createMockEnemy, createMockPlayer, createMockSkill } from './testFixtures';

afterEach(() => {
  vi.restoreAllMocks();
});

function elemDefMark(stacks: number, target = CombatActor.PLAYER): Mark {
  return {
    id: 'suijinheki_elem_def',
    sourceSkillId: 'suijinheki',
    owner: CombatActor.PLAYER,
    target,
    duration: 1,
    stacks,
    family: MarkFamily.STAT,
  };
}

function statMark(id: string, stacks: number, target = CombatActor.PLAYER): Mark {
  return {
    id,
    sourceSkillId: id,
    owner: CombatActor.PLAYER,
    target,
    duration: 2,
    stacks,
    family: MarkFamily.STAT,
  };
}

describe('T-141 pure', () => {
  it('self suijinheki_elem_def stacks 1 returns 1; empty / spd_down only return 0', () => {
    expect(elementalDefenseFlatFromMarks([elemDefMark(1)], CombatActor.PLAYER)).toBe(1);
    expect(elementalDefenseFlatFromMarks([], CombatActor.PLAYER)).toBe(0);
    expect(elementalDefenseFlatFromMarks([statMark('spd_down', 2)], CombatActor.PLAYER)).toBe(0);
    expect(elementalDefenseFlatFromMarks([statMark('blinded', 2)], CombatActor.PLAYER)).toBe(0);
    expect(elementalDefenseFlatFromMarks([statMark('aim', 3)], CombatActor.PLAYER)).toBe(0);
    expect(elementalDefenseFlatFromMarks([statMark('cloaked', 1)], CombatActor.PLAYER)).toBe(0);
    expect(elementalDefenseFlatFromMarks([elemDefMark(1, CombatActor.ENEMY)], CombatActor.PLAYER)).toBe(0);
  });
});

describe('T-141 stacks', () => {
  it('two instances or stacks 2 sum to flat 2', () => {
    expect(elementalDefenseFlatFromMarks([elemDefMark(2)], CombatActor.PLAYER)).toBe(2);
    expect(
      elementalDefenseFlatFromMarks([elemDefMark(1), elemDefMark(1)], CombatActor.PLAYER),
    ).toBe(2);
  });
});

const playerStats = {
  primary: BASE_STATS,
  effectivePrimary: BASE_STATS,
  derived: calculateDerivedStats(BASE_STATS, {}),
};
const enemyStats = {
  primary: BASE_STATS,
  effectivePrimary: BASE_STATS,
  derived: calculateDerivedStats(BASE_STATS, {}),
};
const guts = { triggered: false, artifactTriggered: false };

const combat = (overrides: Partial<CombatState> = {}): CombatState => ({
  isFirstTurn: false,
  firstHitMultiplier: 1,
  playerGoesFirst: true,
  playerInitiativeBonus: 0,
  xpMultiplier: 1,
  terrain: null,
  approachApplied: true,
  skipFirstSkillCost: false,
  artifactGutsUsed: false,
  locationTerrainMods: null,
  roomCombatEvasion: 0,
  fallDamageOnMiss: 0,
  roomConditionNames: [],
  enemyFirstHitMultiplier: 1,
  currentAp: 0,
  maxAp: 10,
  posture: Posture.BALANCED,
  hand: [],
  playablePool: [],
  currentRange: CombatRange.CLOSE,
  playerMoveUsedThisTurn: false,
  enemyMoveUsedThisTurn: false,
  enemyCurrentAp: 5,
  enemyMaxAp: 5,
  turnIndex: 1,
  activeModes: [],
  marks: [],
  ...overrides,
});

describe('T-141 live', () => {
  it('elemental hit vs suijinheki_elem_def mitigates more; derived includes +1', () => {
    const player = createMockPlayer({ primaryStats: { ...BASE_STATS }, activeBuffs: [] });
    const bareStats = getPlayerFullStats(player);
    const armedStats = getPlayerFullStats(player, [elemDefMark(1)]);
    expect(armedStats.derived.elementalDefenseFlat).toBe(bareStats.derived.elementalDefenseFlat + 1);

    const elemSkill = createMockSkill({
      baseDamage: 20,
      scalingPerPoint: 0,
      scalingStat: PrimaryStat.SPIRIT,
      damageType: DamageType.ELEMENTAL,
      attackMethod: AttackMethod.AUTO,
      element: ElementType.FIRE,
    });
    const attackerDerived = calculateDerivedStats(BASE_STATS, {});
    const dmgBare = calculateDamage(
      BASE_STATS,
      attackerDerived,
      bareStats.effectivePrimary,
      bareStats.derived,
      elemSkill,
      ElementType.FIRE,
      ElementType.WATER,
      { forceHit: true, forceCrit: false },
    );
    const dmgArmed = calculateDamage(
      BASE_STATS,
      attackerDerived,
      armedStats.effectivePrimary,
      armedStats.derived,
      elemSkill,
      ElementType.FIRE,
      ElementType.WATER,
      { forceHit: true, forceCrit: false },
    );
    expect(dmgBare.finalDamage).toBeGreaterThan(0);
    expect(dmgArmed.finalDamage).toBeLessThan(dmgBare.finalDamage);

    const physSkill = createMockSkill({
      baseDamage: 20,
      scalingPerPoint: 0,
      damageType: DamageType.PHYSICAL,
      attackMethod: AttackMethod.AUTO,
    });
    const physBare = calculateDamage(
      BASE_STATS,
      attackerDerived,
      bareStats.effectivePrimary,
      bareStats.derived,
      physSkill,
      ElementType.PHYSICAL,
      ElementType.WATER,
      { forceHit: true, forceCrit: false },
    );
    const physArmed = calculateDamage(
      BASE_STATS,
      attackerDerived,
      armedStats.effectivePrimary,
      armedStats.derived,
      physSkill,
      ElementType.PHYSICAL,
      ElementType.WATER,
      { forceHit: true, forceCrit: false },
    );
    expect(physArmed.finalDamage).toBe(physBare.finalDamage);

    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const liveElem = createMockSkill({
      id: 'ember',
      name: 'Ember',
      attackMethod: AttackMethod.AUTO,
      allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
      apCost: 2,
      baseDamage: 20,
      scalingPerPoint: 0,
      scalingStat: PrimaryStat.SPIRIT,
      damageType: DamageType.ELEMENTAL,
      element: ElementType.FIRE,
    });
    const playerHp = 400;
    const enemy = createMockEnemy({
      skills: [liveElem],
      currentHp: 10_000,
      preferredRange: CombatRange.CLOSE,
      activeBuffs: [],
    });
    const livePlayer = createMockPlayer({ currentHp: playerHp, activeBuffs: [] });
    const close = combat({ currentRange: CombatRange.CLOSE, isFirstTurn: false });
    const bareHit = executeEnemyAction(
      livePlayer,
      playerStats,
      enemy,
      enemyStats,
      guts,
      { ...close, marks: [] },
    );
    const armedHit = executeEnemyAction(
      livePlayer,
      playerStats,
      enemy,
      enemyStats,
      guts,
      { ...close, marks: [elemDefMark(1)] },
    );
    const bareLoss = playerHp - bareHit.player.currentHp;
    const armedLoss = playerHp - armedHit.player.currentHp;
    expect(bareLoss).toBeGreaterThan(0);
    expect(armedLoss).toBeLessThan(bareLoss);

    const livePhys = createMockSkill({
      id: 'strike',
      name: 'Strike',
      attackMethod: AttackMethod.AUTO,
      allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
      apCost: 2,
      baseDamage: 20,
      scalingPerPoint: 0,
      damageType: DamageType.PHYSICAL,
    });
    const physEnemy = createMockEnemy({
      skills: [livePhys],
      currentHp: 10_000,
      preferredRange: CombatRange.CLOSE,
      activeBuffs: [],
    });
    const physBareHit = executeEnemyAction(
      livePlayer,
      playerStats,
      physEnemy,
      enemyStats,
      guts,
      { ...close, marks: [] },
    );
    const physArmedHit = executeEnemyAction(
      livePlayer,
      playerStats,
      physEnemy,
      enemyStats,
      guts,
      { ...close, marks: [elemDefMark(1)] },
    );
    expect(playerHp - physArmedHit.player.currentHp).toBe(playerHp - physBareHit.player.currentHp);
  });
});
