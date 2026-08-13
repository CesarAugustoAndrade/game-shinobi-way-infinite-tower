/**
 * T-012 probe — live processUpkeep SOUL order vs leftover dual Mode upkeep.
 */

import { ActionType, CombatActor, CombatRange, ModeRuntimeState, Posture } from '../game/types';
import { processUpkeep } from '../game/systems/PlayerTurnSystem';
import { calculateDerivedStats } from '../game/systems/StatSystem';
import { MODE_DEFINITIONS } from '../game/constants/modes';
import { createMockPlayer, createMockSkill, BASE_STATS } from '../game/systems/__tests__/testFixtures';
import type { CombatState } from '../game/systems/combat-types';

export interface LiveTurnStartProbe {
  upkeepBeforeRegen: boolean;
  drawThenDuration: boolean;
  hpFloor: boolean;
}

function stats() {
  return {
    primary: { ...BASE_STATS },
    effectivePrimary: { ...BASE_STATS },
    derived: calculateDerivedStats(BASE_STATS, {}),
  };
}

function combat(overrides: Partial<CombatState> = {}): CombatState {
  const pool = ['a', 'b', 'c', 'd'].map((id) =>
    createMockSkill({ id, name: id, baseDamage: 8, scalingPerPoint: 2 }),
  );
  return {
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
    playablePool: pool,
    currentRange: CombatRange.CLOSE,
    playerMoveUsedThisTurn: false,
    enemyMoveUsedThisTurn: false,
    enemyCurrentAp: 5,
    enemyMaxAp: 5,
    turnIndex: 1,
    activeModes: [],
    marks: [],
    ...overrides,
  };
}

export function runLiveTurnStartProbe(): LiveTurnStartProbe {
  const byakugan = MODE_DEFINITIONS.byakugan;
  const curse = MODE_DEFINITIONS.curse_mark_1;
  const regen = createMockSkill({
    id: 'meditate',
    actionType: ActionType.PASSIVE,
    passiveEffect: { regenBonus: { chakra: (byakugan.upkeep.chakra ?? 0) + 2 } },
  });

  const before = processUpkeep(
    createMockPlayer({
      skills: [regen],
      currentChakra: (byakugan.upkeep.chakra ?? 1) - 1,
      currentHp: 80,
    }),
    stats(),
    combat({
      activeModes: [
        {
          id: byakugan.id,
          family: byakugan.family,
          charges: byakugan.maxCharges,
          state: ModeRuntimeState.ON,
        },
      ],
    }),
  );

  const duration = processUpkeep(
    createMockPlayer({ currentChakra: 30, currentHp: 80 }),
    stats(),
    combat({
      marks: [
        {
          id: 'aim',
          sourceSkillId: 'wire',
          owner: CombatActor.PLAYER,
          target: CombatActor.ENEMY,
          duration: 1,
          stacks: 1,
        },
      ],
    }),
  );

  const floor = processUpkeep(
    createMockPlayer({ currentChakra: 20, currentHp: curse.upkeep.hp ?? 5 }),
    stats(),
    combat({
      activeModes: [
        {
          id: curse.id,
          family: curse.family,
          charges: curse.maxCharges,
          state: ModeRuntimeState.ON,
        },
      ],
    }),
  );

  return {
    upkeepBeforeRegen: !before.activeModes.some(
      (mode) => mode.id === byakugan.id && mode.state === ModeRuntimeState.ON,
    ),
    drawThenDuration: duration.hand.length === 4 && duration.marks.length === 0,
    hpFloor:
      floor.player.currentHp >= 1 &&
      !floor.activeModes.some((mode) => mode.id === curse.id && mode.state === ModeRuntimeState.ON),
  };
}

export function printLiveTurnStartProbe(probe: LiveTurnStartProbe): void {
  console.log('\n── T-012 live turn-start probe ──');
  console.log(`  upkeep before regen: ${probe.upkeepBeforeRegen}`);
  console.log(`  draw then duration:  ${probe.drawThenDuration}`);
  console.log(`  HP upkeep floor:     ${probe.hpFloor}`);
}
