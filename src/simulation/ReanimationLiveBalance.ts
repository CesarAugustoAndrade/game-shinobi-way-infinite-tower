/**
 * T-144 probe — live Reanimation lethal save + ATTACK +1 vs decorative unused mark.
 */

import {
  AttackMethod,
  CardRole,
  CombatActor,
  CombatRange,
  MarkFamily,
  Posture,
} from '../game/types';
import { calculateDerivedStats } from '../game/systems/StatSystem';
import { executeEnemyAction } from '../game/systems/EnemyTurnSystem';
import { buildUpkeepWeightContext } from '../game/systems/PlayerTurnSystem';
import { effectiveWeight } from '../game/systems/DeckSystem';
import {
  REANIMATION_MARK_ID,
  REANIMATION_SHIELD_MARK_ID,
  REANIMATION_SHIELD_STACKS,
} from '../game/systems/MarkSystem';
import { createCombatState } from '../game/systems/CombatWorkflowSystem';
import type { CombatState } from '../game/systems/combat-types';
import type { Mark } from '../game/types';
import { BASE_STATS, createMockEnemy, createMockPlayer, createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface ReanimationLiveProbe {
  lethal: boolean;
  weight: boolean;
  chip: boolean;
  metrics: {
    hpAfterLethal: number;
    gutsTriggered: boolean;
    shieldStacks: number;
    leftoverReanim: boolean;
    atkDeltaArmed: number;
    atkDeltaAfter: number;
    chipKeptMark: boolean;
  };
}

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

const stats = {
  primary: BASE_STATS,
  effectivePrimary: BASE_STATS,
  derived: calculateDerivedStats(BASE_STATS, {}),
};
const guts = { triggered: false, artifactTriggered: false };

const close: CombatState = {
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
};

function enemy() {
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

export function runReanimationLiveProbe(): ReanimationLiveProbe {
  const rng = Math.random;
  Math.random = () => 0.01;
  try {
    const player = createMockPlayer({ currentHp: 20, activeBuffs: [] });
    const saved = executeEnemyAction(
      player,
      stats,
      enemy(),
      stats,
      guts,
      { ...close, marks: [reanimationMark()] },
    );
    const empty = buildUpkeepWeightContext(player, { ...createCombatState(), marks: [] });
    const armed = buildUpkeepWeightContext(player, {
      ...createCombatState(),
      marks: [reanimationMark()],
    });
    const after = buildUpkeepWeightContext(player, {
      ...createCombatState(),
      marks: saved.marks ?? [],
    });
    const atkDeltaArmed = effectiveWeight(attack, armed) - effectiveWeight(attack, empty);
    const atkDeltaAfter = effectiveWeight(attack, after) - effectiveWeight(attack, empty);
    const chipped = executeEnemyAction(
      createMockPlayer({ currentHp: 400, activeBuffs: [] }),
      stats,
      enemy(),
      stats,
      guts,
      { ...close, marks: [reanimationMark()] },
    );
    const shield = saved.marks?.find((m) => m.id === REANIMATION_SHIELD_MARK_ID);
    return {
      lethal:
        saved.player.currentHp === 1 &&
        !saved.playerDefeated &&
        !saved.gutsContext.triggered &&
        !(saved.marks ?? []).some((m) => m.id === REANIMATION_MARK_ID) &&
        shield?.stacks === REANIMATION_SHIELD_STACKS,
      weight: atkDeltaArmed === 1 && atkDeltaAfter === 0,
      chip:
        chipped.player.currentHp > 1 &&
        (chipped.marks ?? []).some((m) => m.id === REANIMATION_MARK_ID),
      metrics: {
        hpAfterLethal: saved.player.currentHp,
        gutsTriggered: saved.gutsContext.triggered,
        shieldStacks: shield?.stacks ?? 0,
        leftoverReanim: (saved.marks ?? []).some((m) => m.id === REANIMATION_MARK_ID),
        atkDeltaArmed,
        atkDeltaAfter,
        chipKeptMark: (chipped.marks ?? []).some((m) => m.id === REANIMATION_MARK_ID),
      },
    };
  } finally {
    Math.random = rng;
  }
}

export function printReanimationLiveProbe(probe: ReanimationLiveProbe): void {
  const m = probe.metrics;
  console.log('\n── T-144 Reanimation live probe ──');
  console.log(`  lethal → HP 1 + Shield 40, no guts: ${probe.lethal}`);
  console.log(`  ATTACK +1 while armed, 0 after:     ${probe.weight}`);
  console.log(`  chip keeps mark:                    ${probe.chip}`);
  console.log('  ── balance vs decorative unused Reanimation / guts rng ──');
  console.log(`  HP after lethal:     ${m.hpAfterLethal}  (was 0 / guts rng)`);
  console.log(`  guts triggered:      ${m.gutsTriggered}  (must be false)`);
  console.log(`  shield stacks:       ${m.shieldStacks}`);
  console.log(`  ATTACK Δ armed/after:${m.atkDeltaArmed} / ${m.atkDeltaAfter}`);
  console.log('  ── equilibrium ──');
  console.log('  Guaranteed first-lethal save + ATTACK +1 while armed. Not guts. Chip does not consume.');
}
