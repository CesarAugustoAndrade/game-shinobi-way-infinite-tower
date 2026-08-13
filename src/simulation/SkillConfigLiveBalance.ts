/**
 * T-013 probe — Skill Config Main bootstrap, learn/forget, combat lock.
 */

import { CardRole, GameState } from '../game/types';
import { createMockPlayer, createMockSkill } from '../game/systems/__tests__/testFixtures';
import {
  applyForgetSkill,
  applyLearnSkill,
  bootstrapPlayerSkillConfig,
  rewriteSkillConfig,
} from '../game/systems/SkillConfigLive';
import { buildUpkeepWeightContext } from '../game/systems/PlayerTurnSystem';
import { CombatRange, Posture } from '../game/types';
import type { CombatState } from '../game/systems/combat-types';

export interface SkillConfigLiveProbe {
  ensureNotified: boolean;
  learnPreservesMain: boolean;
  forgetReassigns: boolean;
  drawHasMain: boolean;
  combatLocked: boolean;
}

const attack = (id: string) => createMockSkill({ id, cardRole: CardRole.ATTACK });

const emptyCombat = (): CombatState => ({
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
});

export function runSkillConfigLiveProbe(): SkillConfigLiveProbe {
  const empty = createMockPlayer({
    skills: [attack('rasengan'), attack('chidori')],
    skillConfig: { mainAttackId: null, modeUpkeepPriority: [] },
  });
  const boot = bootstrapPlayerSkillConfig(empty, () => 0);
  const learned = applyLearnSkill(
    { ...boot.player, skillConfig: { mainAttackId: 'rasengan', modeUpkeepPriority: [] } },
    attack('twin_lion_fists'),
    GameState.EXPLORE,
  );
  const forgotten = applyForgetSkill(learned.player, 'rasengan', GameState.EXPLORE, () => 0);
  const locked = rewriteSkillConfig(
    learned.player,
    { mainAttackId: 'chidori', modeUpkeepPriority: [] },
    GameState.COMBAT,
  );

  return {
    ensureNotified: boot.notified && boot.player.skillConfig?.mainAttackId === 'rasengan',
    learnPreservesMain: learned.player.skillConfig?.mainAttackId === 'rasengan',
    forgetReassigns:
      forgotten.player.skillConfig?.mainAttackId !== 'rasengan' &&
      forgotten.player.skillConfig?.mainAttackId != null,
    drawHasMain: buildUpkeepWeightContext(learned.player, emptyCombat()).mainAttackId === 'rasengan',
    combatLocked: locked.refused && locked.player.skillConfig?.mainAttackId === 'rasengan',
  };
}

export function printSkillConfigLiveProbe(probe: SkillConfigLiveProbe): void {
  console.log('\n── T-013 Skill Config live probe ──');
  console.log(`  ensure notified:     ${probe.ensureNotified}`);
  console.log(`  learn preserves Main:${probe.learnPreservesMain}`);
  console.log(`  forget reassigns:    ${probe.forgetReassigns}`);
  console.log(`  draw has mainAttack: ${probe.drawHasMain}`);
  console.log(`  combat lock:         ${probe.combatLocked}`);
}
