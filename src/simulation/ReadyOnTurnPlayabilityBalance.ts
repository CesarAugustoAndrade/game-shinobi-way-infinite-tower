/**
 * T-145 probe — playability/kill reset honor readyOnTurn vs decorative currentCooldown-only.
 */

import { CombatRange, EquipmentSlot, PassiveEffectType } from '../game/types';
import { getSkillBlockReason } from '../game/systems/skillPlayability';
import { processPassivesOnKill } from '../game/systems/EquipmentPassiveSystem';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockArtifact, createMockEnemy, createMockPlayer, createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface ReadyOnTurnPlayabilityProbe {
  playability: boolean;
  kill: boolean;
  parity: boolean;
  metrics: {
    blockAtTPlus1: string | null;
    readyAtTPlus2: string | null;
    cdAfterKill: number;
    readyAfterKill: number | undefined;
    resolveOk: boolean;
  };
}

const T = 2;

export function runReadyOnTurnPlayabilityProbe(): ReadyOnTurnPlayabilityProbe {
  const skill = createMockSkill({
    id: 'chidori',
    cooldown: 2,
    currentCooldown: 0,
    readyOnTurn: T + 2,
    chakraCost: 0,
    hpCost: 0,
    apCost: 1,
    allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
  });
  const ctx = (turnIndex: number) => ({
    skill,
    currentChakra: 20,
    currentHp: 40,
    maxHp: 40,
    currentAp: 6,
    currentRange: CombatRange.MEDIUM,
    activeBuffs: [],
    turnIndex,
  });
  const blockAtTPlus1 = getSkillBlockReason(ctx(T + 1));
  const readyAtTPlus2 = getSkillBlockReason(ctx(T + 2));

  const artifact = createMockArtifact();
  artifact.passive = {
    type: PassiveEffectType.COOLDOWN_RESET_ON_KILL,
    triggerCondition: 'on_kill',
  };
  const player = createMockPlayer({
    skills: [createMockSkill({ id: 'chidori', currentCooldown: 3, readyOnTurn: 9 })],
    equipment: {
      [EquipmentSlot.SLOT_1]: artifact,
      [EquipmentSlot.SLOT_2]: null,
      [EquipmentSlot.SLOT_3]: null,
      [EquipmentSlot.SLOT_4]: null,
    },
  });
  const killed = processPassivesOnKill(player, createMockEnemy());

  const state: ResolveSkillState = {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: T + 1,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 80,
  };
  const resolved = resolveSkill({ skill }, state);

  return {
    playability: blockAtTPlus1 === 'cooldown' && readyAtTPlus2 === null,
    kill: killed.player.skills[0]?.currentCooldown === 0 && killed.player.skills[0]?.readyOnTurn === 0,
    parity: blockAtTPlus1 === 'cooldown' && resolved.ok === false,
    metrics: {
      blockAtTPlus1,
      readyAtTPlus2,
      cdAfterKill: killed.player.skills[0]?.currentCooldown ?? -1,
      readyAfterKill: killed.player.skills[0]?.readyOnTurn,
      resolveOk: resolved.ok,
    },
  };
}

export function printReadyOnTurnPlayabilityProbe(probe: ReadyOnTurnPlayabilityProbe): void {
  const m = probe.metrics;
  console.log('\n── T-145 readyOnTurn playability probe ──');
  console.log(`  playability T+1 block / T+2 ready: ${probe.playability}`);
  console.log(`  kill reset both CD fields:         ${probe.kill}`);
  console.log(`  resolve rejects same fixture:      ${probe.parity}`);
  console.log('  ── balance vs currentCooldown-only greying ──');
  console.log(`  block T+1 / T+2:    ${m.blockAtTPlus1} / ${m.readyAtTPlus2}  (was null while readyOnTurn armed)`);
  console.log(`  after kill CD/ready:${m.cdAfterKill} / ${m.readyAfterKill}  (ready was 9)`);
  console.log(`  resolve ok:         ${m.resolveOk}  (must be false)`);
  console.log('  ── equilibrium ──');
  console.log('  Hand SoT = readyOnTurn vs turnIndex. Kill reset actually makes skills ready. Not a second CD math.');
}
