/**
 * T-144 AC: live Reanimation lethal save before guts; ATTACK +1 while armed; chip does not consume.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AttackMethod,
  CardRole,
  CombatActor,
  CombatRange,
  MarkFamily,
  Posture,
} from '../../types';
import { calculateDerivedStats } from '../StatSystem';
import { executeEnemyAction } from '../EnemyTurnSystem';
import { buildUpkeepWeightContext } from '../PlayerTurnSystem';
import { effectiveWeight } from '../DeckSystem';
import {
  REANIMATION_MARK_ID,
  REANIMATION_SHIELD_MARK_ID,
  REANIMATION_SHIELD_STACKS,
} from '../MarkSystem';
import { createCombatState } from '../CombatWorkflowSystem';
import type { CombatState } from '../combat-types';
import type { Mark } from '../../types';
import { BASE_STATS, createMockEnemy, createMockPlayer, createMockSkill } from './testFixtures';

afterEach(() => {
  vi.restoreAllMocks();
});

function reanimationMark(): Mark {
  return {
    id: REANIMATION_MARK_ID,
    sourceSkillId: 'edo_tensei',
    owner: CombatActor.PLAYER,
    target: CombatActor.PLAYER,
    duration: 3,
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

const attack = createMockSkill({
  id: 'basic_atk',
  cardRole: CardRole.ATTACK,
  currentCooldown: 0,
});

describe('T-144 lethal', () => {
  it('lethal enemy hit with reanimation leaves HP 1, strips mark, plants Shield 40, skips guts', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const player = createMockPlayer({ currentHp: 20, activeBuffs: [] });
    const close = combat({ currentRange: CombatRange.CLOSE, isFirstTurn: false });
    const saved = executeEnemyAction(
      player,
      playerStats,
      strikeEnemy(),
      enemyStats,
      guts,
      { ...close, marks: [reanimationMark()] },
    );
    expect(saved.player.currentHp).toBe(1);
    expect(saved.playerDefeated).toBe(false);
    expect(saved.gutsContext.triggered).toBe(false);
    expect(saved.marks?.some((m) => m.id === REANIMATION_MARK_ID)).toBe(false);
    const shield = saved.marks?.find((m) => m.id === REANIMATION_SHIELD_MARK_ID);
    expect(shield?.family).toBe(MarkFamily.SHIELD);
    expect(shield?.stacks).toBe(REANIMATION_SHIELD_STACKS);
    expect(saved.logs.some((line) => /Reanimation/i.test(line))).toBe(true);
  });
});

describe('T-144 weight', () => {
  it('ATTACK effectiveWeight is +1 while armed and gone after lethal consume', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const player = createMockPlayer({ currentHp: 20, activeBuffs: [] });
    const empty = buildUpkeepWeightContext(player, { ...createCombatState(), marks: [] });
    const armed = buildUpkeepWeightContext(player, {
      ...createCombatState(),
      marks: [reanimationMark()],
    });
    expect(armed.supportRoleBonuses?.[CardRole.ATTACK]).toBe(1);
    expect(effectiveWeight(attack, armed)).toBe(effectiveWeight(attack, empty) + 1);

    const saved = executeEnemyAction(
      player,
      playerStats,
      strikeEnemy(),
      enemyStats,
      guts,
      combat({ marks: [reanimationMark()] }),
    );
    const after = buildUpkeepWeightContext(player, {
      ...createCombatState(),
      marks: saved.marks ?? [],
    });
    expect(after.supportRoleBonuses?.[CardRole.ATTACK] ?? 0).toBe(0);
    expect(effectiveWeight(attack, after)).toBe(effectiveWeight(attack, empty));
  });
});

describe('T-144 chip', () => {
  it('non-lethal hit with reanimation armed does not consume the mark', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const playerHp = 400;
    const player = createMockPlayer({ currentHp: playerHp, activeBuffs: [] });
    const chipped = executeEnemyAction(
      player,
      playerStats,
      strikeEnemy(),
      enemyStats,
      guts,
      combat({ marks: [reanimationMark()] }),
    );
    expect(chipped.player.currentHp).toBeLessThan(playerHp);
    expect(chipped.player.currentHp).toBeGreaterThan(1);
    expect(chipped.marks?.some((m) => m.id === REANIMATION_MARK_ID)).toBe(true);
    expect(chipped.marks?.some((m) => m.id === REANIMATION_SHIELD_MARK_ID)).toBe(false);
  });
});
