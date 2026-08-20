/**
 * T-139 AC: stun HARD_CONTROL Marks skip one action; Bound does not skip.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AttackMethod,
  CombatActor,
  CombatRange,
  MarkConsumeTiming,
  MarkFamily,
  Posture,
} from '../../types';
import { calculateDerivedStats } from '../StatSystem';
import { executeEnemyAction } from '../EnemyTurnSystem';
import {
  actorHasHardControlSkip,
  resolveHardControlSkips,
  STUN_SKIP_MARK_ID,
} from '../MarkSystem';
import { BOUND_MARK_ID } from '../RangeSystem';
import type { CombatState } from '../combat-types';
import type { Mark } from '../../types';
import { BASE_STATS, createMockEnemy, createMockPlayer, createMockSkill } from './testFixtures';

afterEach(() => {
  vi.restoreAllMocks();
});

function stunMark(overrides: Partial<Mark> = {}): Mark {
  return {
    id: STUN_SKIP_MARK_ID,
    sourceSkillId: 'tripwire',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 1,
    stacks: 1,
    family: MarkFamily.HARD_CONTROL,
    consume: MarkConsumeTiming.NONE,
    ...overrides,
  };
}

function boundMark(overrides: Partial<Mark> = {}): Mark {
  return {
    id: BOUND_MARK_ID,
    sourceSkillId: 'shadow_possession',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 1,
    stacks: 1,
    family: MarkFamily.HARD_CONTROL,
    consume: MarkConsumeTiming.IMPACT,
    ...overrides,
  };
}

describe('T-139 pure', () => {
  it('two enemy-targeted stun-1 Marks collapse to one skip; empty is 0', () => {
    const two = [stunMark(), stunMark()];
    expect(resolveHardControlSkips(two)).toBe(1);
    expect(resolveHardControlSkips(two, CombatActor.ENEMY)).toBe(1);
    expect(resolveHardControlSkips(two, CombatActor.PLAYER)).toBe(0);
    expect(actorHasHardControlSkip(two, CombatActor.ENEMY)).toBe(true);
    expect(actorHasHardControlSkip(two, CombatActor.PLAYER)).toBe(false);
    expect(resolveHardControlSkips([])).toBe(0);
    expect(actorHasHardControlSkip([], CombatActor.ENEMY)).toBe(false);
  });
});

describe('T-139 bound', () => {
  it('Bound-only HARD_CONTROL does not skip', () => {
    const onlyBound = [boundMark()];
    expect(resolveHardControlSkips(onlyBound)).toBe(0);
    expect(resolveHardControlSkips(onlyBound, CombatActor.ENEMY)).toBe(0);
    expect(actorHasHardControlSkip(onlyBound, CombatActor.ENEMY)).toBe(false);
    expect(resolveHardControlSkips([boundMark(), stunMark()])).toBe(1);
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

describe('T-139 live', () => {
  it('enemy-targeted stun Mark skips the action with no STUN buff; bare attacks', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const poke = createMockSkill({
      id: 'poke',
      name: 'Poke',
      attackMethod: AttackMethod.AUTO,
      allowedRanges: [CombatRange.CLOSE],
      apCost: 1,
      baseDamage: 20,
      scalingPerPoint: 0,
    });
    const playerHp = 10_000;
    const enemy = createMockEnemy({
      skills: [poke],
      currentHp: 10_000,
      preferredRange: CombatRange.CLOSE,
      activeBuffs: [],
    });
    const player = createMockPlayer({ currentHp: playerHp, activeBuffs: [] });
    const close = combat({ currentRange: CombatRange.CLOSE, isFirstTurn: false });

    const stunned = executeEnemyAction(
      player,
      playerStats,
      enemy,
      enemyStats,
      guts,
      { ...close, marks: [stunMark()] },
    );
    expect(stunned.logs.some((line) => /STUNNED/i.test(line))).toBe(true);
    expect(stunned.player.currentHp).toBe(playerHp);

    const bare = executeEnemyAction(
      player,
      playerStats,
      enemy,
      enemyStats,
      guts,
      { ...close, marks: [] },
    );
    expect(bare.logs.some((line) => /STUNNED/i.test(line))).toBe(false);
    expect(bare.player.currentHp).toBeLessThan(playerHp);

    const boundOnly = executeEnemyAction(
      player,
      playerStats,
      enemy,
      enemyStats,
      guts,
      { ...close, marks: [boundMark()] },
    );
    expect(boundOnly.logs.some((line) => /STUNNED/i.test(line))).toBe(false);
    expect(boundOnly.player.currentHp).toBeLessThan(playerHp);
  });
});
