/**
 * T-134 AC: counter_reflect / rotation_reflect feed live REFLECTION mit and consume.
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
import {
  COUNTER_REFLECT_MARK_ID,
  reflectPercentFromMarks,
  ROTATION_REFLECT_MARK_ID,
} from '../MarkSystem';
import type { CombatState } from '../combat-types';
import type { Mark } from '../../types';
import { BASE_STATS, createMockEnemy, createMockPlayer, createMockSkill } from './testFixtures';

afterEach(() => {
  vi.restoreAllMocks();
});

function selfMark(id: string, stacks: number): Mark {
  return {
    id,
    sourceSkillId: id,
    owner: CombatActor.PLAYER,
    target: CombatActor.PLAYER,
    duration: 1,
    stacks,
    family: MarkFamily.STAT,
  };
}

describe('T-134 percent', () => {
  it('counter_reflect stacks 30 → 0.3 and strips; empty → 0', () => {
    const armed = reflectPercentFromMarks([selfMark(COUNTER_REFLECT_MARK_ID, 30)]);
    expect(armed.percent).toBe(0.3);
    expect(armed.consumed).toBe(true);
    expect(armed.marks.some((m) => m.id === COUNTER_REFLECT_MARK_ID)).toBe(false);

    const empty = reflectPercentFromMarks([]);
    expect(empty.percent).toBe(0);
    expect(empty.consumed).toBe(false);
  });
});

describe('T-134 rotation', () => {
  it('rotation_reflect stacks 60 → 0.6; max stacks wins if both armed', () => {
    const rotation = reflectPercentFromMarks([selfMark(ROTATION_REFLECT_MARK_ID, 60)]);
    expect(rotation.percent).toBe(0.6);
    expect(rotation.consumed).toBe(true);

    const both = reflectPercentFromMarks([
      selfMark(COUNTER_REFLECT_MARK_ID, 30),
      selfMark(ROTATION_REFLECT_MARK_ID, 60),
    ]);
    expect(both.percent).toBe(0.6);
    expect(both.marks.some((m) => m.id === ROTATION_REFLECT_MARK_ID)).toBe(false);
    expect(both.marks.some((m) => m.id === COUNTER_REFLECT_MARK_ID)).toBe(true);
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

describe('T-134 live', () => {
  it('MELEE enemy hit reflects from counter_reflect and strips the mark', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const melee = createMockSkill({
      id: 'melee',
      name: 'Close Cut',
      attackMethod: AttackMethod.MELEE,
      allowedRanges: [CombatRange.CLOSE],
      apCost: 2,
      baseDamage: 40,
      scalingPerPoint: 0,
    });
    const enemyHp = 10_000;
    const enemy = createMockEnemy({
      skills: [melee],
      currentHp: enemyHp,
      preferredRange: CombatRange.CLOSE,
      activeBuffs: [],
    });
    const player = createMockPlayer({ currentHp: 10_000, activeBuffs: [] });
    const close = combat({ currentRange: CombatRange.CLOSE, isFirstTurn: false });

    const clean = executeEnemyAction(
      player,
      playerStats,
      enemy,
      enemyStats,
      guts,
      { ...close, marks: [] },
    );
    expect(clean.logs.some((line) => /Reflection deals/i.test(line))).toBe(false);
    expect(clean.enemy.currentHp).toBe(enemyHp);

    const armed = executeEnemyAction(
      player,
      playerStats,
      enemy,
      enemyStats,
      guts,
      { ...close, marks: [selfMark(COUNTER_REFLECT_MARK_ID, 30)] },
    );
    expect(armed.logs.some((line) => /Reflection deals/i.test(line))).toBe(true);
    expect(armed.enemy.currentHp).toBeLessThan(enemyHp);
    expect(armed.marks?.some((m) => m.id === COUNTER_REFLECT_MARK_ID)).toBe(false);
    expect(armed.player.activeBuffs.some((b) => b.id === 'mark_reflect')).toBe(false);
  });
});
