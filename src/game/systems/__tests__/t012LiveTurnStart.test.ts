/**
 * T-012 AC: live processUpkeep uses SOUL turn-start clock.
 */

import { describe, it, expect } from 'vitest';
import { processUpkeep } from '../PlayerTurnSystem';
import { calculateDerivedStats } from '../StatSystem';
import {
  ActionType,
  CombatActor,
  CombatRange,
  MarkConsumeTiming,
  ModeRuntimeState,
  Posture,
} from '../../types';
import {
  createMockPlayer,
  createMockSkill,
  BASE_STATS,
} from './testFixtures';
import type { CombatState } from '../combat-types';
import { MODE_DEFINITIONS } from '../../constants/modes';

const makeStats = (stats = BASE_STATS) => ({
  primary: { ...stats },
  effectivePrimary: { ...stats },
  derived: calculateDerivedStats(stats, {}),
});

const baseCombatState = (overrides: Partial<CombatState> = {}): CombatState => ({
  isFirstTurn: false,
  firstHitMultiplier: 1.0,
  playerGoesFirst: true,
  playerInitiativeBonus: 0,
  xpMultiplier: 1.0,
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

const fourPool = () =>
  ['a', 'b', 'c', 'd'].map((id) => createMockSkill({ id, name: id, baseDamage: 10, scalingPerPoint: 2 }));

describe('T-012 upkeep before regen', () => {
  it('ends a Mode when current CP cannot pay, even if same-turn regen would cover it', () => {
    const def = MODE_DEFINITIONS.byakugan;
    const regenPassive = createMockSkill({
      id: 'meditate',
      name: 'Meditate',
      actionType: ActionType.PASSIVE,
      passiveEffect: { regenBonus: { chakra: def.upkeep.chakra! + 2 } },
    });
    const player = createMockPlayer({
      skills: [regenPassive],
      currentChakra: def.upkeep.chakra! - 1,
      currentHp: 80,
    });
    const result = processUpkeep(
      player,
      makeStats(),
      baseCombatState({
        playablePool: fourPool(),
        activeModes: [
          {
            id: def.id,
            family: def.family,
            charges: def.maxCharges,
            state: ModeRuntimeState.ON,
            cooldown: def.cooldown,
          },
        ],
      }),
    );

    const live = result.activeModes.find((mode) => mode.id === def.id);
    expect(live?.state).not.toBe(ModeRuntimeState.ON);
    expect(result.activeModes.some((mode) => mode.id === def.id && mode.state === ModeRuntimeState.ON)).toBe(false);
    expect(result.player.currentChakra).toBe((def.upkeep.chakra! - 1) + (def.upkeep.chakra! + 2));
  });
});

describe('T-012 draw then duration', () => {
  it('draws a hand of 4 then ticks a duration-1 Mark off the board', () => {
    const pool = fourPool();
    const player = createMockPlayer({ skills: pool, currentChakra: 40, currentHp: 80 });
    const result = processUpkeep(
      player,
      makeStats(),
      baseCombatState({
        playablePool: pool,
        activeModes: [],
        marks: [
          {
            id: 'aim',
            sourceSkillId: 'wire',
            owner: CombatActor.PLAYER,
            target: CombatActor.ENEMY,
            duration: 1,
            stacks: 1,
            consume: MarkConsumeTiming.ATTEMPT,
          },
        ],
      }),
    );

    expect(result.hand.length).toBe(4);
    expect(result.marks).toEqual([]);
  });
});

describe('T-012 hp upkeep floor', () => {
  it('ends an HP Mode instead of dropping the player below 1 HP', () => {
    const def = MODE_DEFINITIONS.curse_mark_1;
    const player = createMockPlayer({
      skills: fourPool(),
      currentChakra: 20,
      currentHp: def.upkeep.hp!,
    });
    const result = processUpkeep(
      player,
      makeStats(),
      baseCombatState({
        playablePool: fourPool(),
        activeModes: [
          {
            id: def.id,
            family: def.family,
            charges: def.maxCharges,
            state: ModeRuntimeState.ON,
            cooldown: def.cooldown,
          },
        ],
      }),
    );

    expect(result.activeModes.some((mode) => mode.id === def.id && mode.state === ModeRuntimeState.ON)).toBe(false);
    expect(result.player.currentHp).toBeGreaterThanOrEqual(1);
    expect(result.player.currentHp).toBe(def.upkeep.hp);
  });
});
