/**
 * T-135 AC: MarkFamily.SHIELD absorbs before HP; deplete strips; live enemy-hit honors it.
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
import { absorbWithShieldMarks } from '../MarkSystem';
import type { CombatState } from '../combat-types';
import type { Mark } from '../../types';
import { BASE_STATS, createMockEnemy, createMockPlayer, createMockSkill } from './testFixtures';

afterEach(() => {
  vi.restoreAllMocks();
});

function shieldMark(stacks: number, id = 'mud_wall_shield'): Mark {
  return {
    id,
    sourceSkillId: 'mud_wall',
    owner: CombatActor.PLAYER,
    target: CombatActor.PLAYER,
    duration: 99,
    stacks,
    family: MarkFamily.SHIELD,
  };
}

describe('T-135 absorb', () => {
  it('damage 20 vs SHIELD stacks 35 → damage 0, stacks 15', () => {
    const result = absorbWithShieldMarks(20, [shieldMark(35)]);
    expect(result.damage).toBe(0);
    expect(result.absorbed).toBe(20);
    expect(result.marks).toHaveLength(1);
    expect(result.marks[0]?.stacks).toBe(15);
    expect(result.marks[0]?.id).toBe('mud_wall_shield');
  });
});

describe('T-135 deplete', () => {
  it('damage 40 vs stacks 35 → damage 5 and mark removed', () => {
    const result = absorbWithShieldMarks(40, [shieldMark(35)]);
    expect(result.damage).toBe(5);
    expect(result.absorbed).toBe(35);
    expect(result.marks.some((m) => m.family === MarkFamily.SHIELD)).toBe(false);
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

describe('T-135 live', () => {
  it('enemy hit with mud_wall_shield reduces HP loss vs no-mark control', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
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
      activeBuffs: [],
    });
    const player = createMockPlayer({ currentHp: playerHp, activeBuffs: [] });
    const close = combat({ currentRange: CombatRange.CLOSE, isFirstTurn: false });

    const bare = executeEnemyAction(
      player,
      playerStats,
      enemy,
      enemyStats,
      guts,
      { ...close, marks: [] },
    );
    const shielded = executeEnemyAction(
      player,
      playerStats,
      enemy,
      enemyStats,
      guts,
      { ...close, marks: [shieldMark(35)] },
    );

    const bareLoss = playerHp - bare.player.currentHp;
    const shieldedLoss = playerHp - shielded.player.currentHp;
    expect(bareLoss).toBeGreaterThan(0);
    expect(shieldedLoss).toBeLessThan(bareLoss);
    const leftover = shielded.marks?.find((m) => m.id === 'mud_wall_shield');
    if (shieldedLoss === 0) {
      expect(leftover?.stacks).toBe(35 - bareLoss);
    } else {
      expect(shielded.marks?.some((m) => m.id === 'mud_wall_shield')).toBe(false);
    }
  });
});
