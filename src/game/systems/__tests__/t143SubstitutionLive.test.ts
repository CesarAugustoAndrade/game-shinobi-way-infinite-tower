/**
 * T-143 AC: live first enemy hit under substitution is nullified + retreat 1; once only.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AttackMethod,
  CombatActor,
  CombatRange,
  MarkFamily,
  Posture,
} from '../../types';
import { calculateDerivedStats } from '../StatSystem';
import { executeEnemyAction } from '../EnemyTurnSystem';
import { SUBSTITUTION_MARK_ID } from '../MarkSystem';
import type { CombatState } from '../combat-types';
import type { Mark } from '../../types';
import { BASE_STATS, createMockEnemy, createMockPlayer, createMockSkill } from './testFixtures';

afterEach(() => {
  vi.restoreAllMocks();
});

function substitutionMark(): Mark {
  return {
    id: SUBSTITUTION_MARK_ID,
    sourceSkillId: 'kawarimi',
    owner: CombatActor.PLAYER,
    target: CombatActor.PLAYER,
    duration: 2,
    stacks: 1,
    family: MarkFamily.STAT,
  };
}

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

function strikeEnemy() {
  const strike = createMockSkill({
    id: 'strike',
    name: 'Strike',
    attackMethod: AttackMethod.AUTO,
    allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
    apCost: 2,
    baseDamage: 20,
    scalingPerPoint: 0,
  });
  return createMockEnemy({
    skills: [strike],
    currentHp: 10_000,
    preferredRange: CombatRange.CLOSE,
    activeBuffs: [],
  });
}

describe('T-143 live', () => {
  it('first enemy hit with substitution deals 0, strips the mark, and retreats CLOSE→MEDIUM', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const playerHp = 400;
    const player = createMockPlayer({ currentHp: playerHp, activeBuffs: [] });
    const close = combat({ currentRange: CombatRange.CLOSE, isFirstTurn: false });
    const armed = executeEnemyAction(
      player,
      playerStats,
      strikeEnemy(),
      enemyStats,
      guts,
      { ...close, marks: [substitutionMark()] },
    );
    expect(armed.player.currentHp).toBe(playerHp);
    expect(armed.marks?.some((m) => m.id === SUBSTITUTION_MARK_ID)).toBe(false);
    expect(armed.currentRange).toBe(CombatRange.MEDIUM);
    expect(armed.logs.some((line) => /Substitution/i.test(line))).toBe(true);
  });
});

describe('T-143 absent', () => {
  it('same path without substitution deals HP and does not retreat', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const playerHp = 400;
    const player = createMockPlayer({ currentHp: playerHp, activeBuffs: [] });
    const close = combat({ currentRange: CombatRange.CLOSE, isFirstTurn: false });
    const bare = executeEnemyAction(
      player,
      playerStats,
      strikeEnemy(),
      enemyStats,
      guts,
      { ...close, marks: [] },
    );
    expect(playerHp - bare.player.currentHp).toBeGreaterThan(0);
    expect(bare.currentRange).toBe(CombatRange.CLOSE);
    expect(bare.marks ?? []).toEqual([]);
  });
});

describe('T-143 once', () => {
  it('second hit after consume is not nullified', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const playerHp = 400;
    const player = createMockPlayer({ currentHp: playerHp, activeBuffs: [] });
    const close = combat({ currentRange: CombatRange.CLOSE, isFirstTurn: false });
    const first = executeEnemyAction(
      player,
      playerStats,
      strikeEnemy(),
      enemyStats,
      guts,
      { ...close, marks: [substitutionMark()] },
    );
    expect(first.player.currentHp).toBe(playerHp);
    const second = executeEnemyAction(
      first.player,
      playerStats,
      strikeEnemy(),
      enemyStats,
      guts,
      {
        ...close,
        currentRange: first.currentRange ?? CombatRange.MEDIUM,
        marks: first.marks ?? [],
      },
    );
    expect(first.player.currentHp - second.player.currentHp).toBeGreaterThan(0);
    expect(second.marks?.some((m) => m.id === SUBSTITUTION_MARK_ID)).toBe(false);
  });
});
