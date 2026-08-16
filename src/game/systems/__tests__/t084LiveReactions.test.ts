/**
 * T-084 AC: live enemy move fires ON_MOVE tripwire; Fear cuts outgoing once.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AttackMethod,
  CombatActor,
  CombatRange,
  CombatTrigger,
  MarkConsumeTiming,
  MarkFamily,
  Posture,
} from '../../types';
import { calculateDerivedStats } from '../StatSystem';
import { executeEnemyAction } from '../EnemyTurnSystem';
import { applyFearOutgoing, TRIPWIRE_DAMAGE, TRIPWIRE_MARK_ID } from '../MarkSystem';
import type { CombatState } from '../combat-types';
import { BASE_STATS, createMockEnemy, createMockPlayer, createMockSkill } from './testFixtures';

afterEach(() => {
  vi.restoreAllMocks();
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

const tripwireMark = {
  id: TRIPWIRE_MARK_ID,
  sourceSkillId: 'tripwire_perimeter',
  owner: CombatActor.PLAYER,
  target: CombatActor.ENEMY,
  duration: 2,
  stacks: 1,
  family: MarkFamily.STAT,
  consume: MarkConsumeTiming.NONE,
  trigger: CombatTrigger.ON_MOVE,
};

const fearMark = {
  id: 'fear',
  sourceSkillId: 'hell_viewing',
  owner: CombatActor.PLAYER,
  target: CombatActor.ENEMY,
  duration: 1,
  stacks: 20,
  family: MarkFamily.STAT,
  consume: MarkConsumeTiming.NONE,
};

describe('T-084 tripwire live', () => {
  it('deals tripwire damage when the enemy changes band', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const melee = createMockSkill({
      id: 'melee',
      name: 'Close Cut',
      attackMethod: AttackMethod.MELEE,
      allowedRanges: [CombatRange.CLOSE],
      apCost: 2,
    });
    const startHp = 80;
    const enemy = createMockEnemy({
      skills: [melee],
      currentHp: startHp,
      archetype: 'TANK',
      preferredRange: CombatRange.CLOSE,
    });
    const player = createMockPlayer({ currentHp: 10_000 });
    const combatState = combat({
      currentRange: CombatRange.LONG,
      marks: [tripwireMark],
    });

    const result = executeEnemyAction(player, playerStats, enemy, enemyStats, guts, combatState);

    expect(result.enemyMoveUsedThisTurn).toBe(true);
    expect(result.currentRange).toBe(CombatRange.MEDIUM);
    expect(result.enemy.currentHp).toBe(startHp - TRIPWIRE_DAMAGE);
    expect(result.logs.some((line) => /tripwire/i.test(line))).toBe(true);
    expect(result.marks?.some((mark) => mark.id === TRIPWIRE_MARK_ID)).toBe(false);
  });
});

describe('T-084 fear once', () => {
  it('reduces the next enemy outgoing hit once and consumes Fear', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const strike = createMockSkill({
      id: 'strike',
      name: 'Strike',
      attackMethod: AttackMethod.AUTO,
      allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
      apCost: 2,
      baseDamage: 20,
      scalingPerPoint: 0,
    });
    const playerHp = 400;
    const enemy = createMockEnemy({
      skills: [strike],
      currentHp: 10_000,
      preferredRange: CombatRange.CLOSE,
    });
    const player = createMockPlayer({ currentHp: playerHp, activeBuffs: [] });
    const close = combat({
      currentRange: CombatRange.CLOSE,
      isFirstTurn: false,
    });

    const clean = executeEnemyAction(
      player,
      playerStats,
      enemy,
      enemyStats,
      guts,
      { ...close, marks: [] },
    );
    const feared = executeEnemyAction(
      player,
      playerStats,
      enemy,
      enemyStats,
      guts,
      { ...close, marks: [fearMark] },
    );

    const cleanDamage = playerHp - clean.player.currentHp;
    const fearedDamage = playerHp - feared.player.currentHp;
    expect(cleanDamage).toBeGreaterThan(0);
    expect(fearedDamage).toBe(applyFearOutgoing(cleanDamage, [fearMark]).damage);
    expect(feared.marks?.some((mark) => mark.id === 'fear')).toBe(false);

    const second = executeEnemyAction(
      player,
      playerStats,
      enemy,
      enemyStats,
      guts,
      { ...close, marks: feared.marks ?? [] },
    );
    expect(playerHp - second.player.currentHp).toBe(cleanDamage);
  });
});
