/**
 * T-049 probe — Kunai Throw authoring; 7 + TOOL +1 on hit; miss/non-TOOL isolated.
 */

import { ActionType, CardRole, CombatRange, Posture, SkillTag } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { effectiveWeight } from '../game/systems/DeckSystem';
import { consumeSupportWeightBonuses } from '../game/systems/SupportWeightSystem';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface KunaiThrowProbe {
  authoring: boolean;
  hitWeight: boolean;
  apply: boolean;
  metrics: {
    apCost: number;
    hitDamage: number;
    toolDelta: number;
    closeRejected: boolean;
  };
}

export function runKunaiThrowProbe(): KunaiThrowProbe {
  const skill = SKILLS.KUNAI_THROW;
  const state = (range = CombatRange.MEDIUM): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 80,
    pendingSupportWeights: [],
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: skill.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const landed = resolveSkill({ skill }, state(), hit);
  const whiff = resolveSkill({ skill }, state(), miss);
  const close = resolveSkill({ skill }, state(CombatRange.CLOSE), hit);
  const first = consumeSupportWeightBonuses(landed.ok ? landed.state.pendingSupportWeights ?? [] : []);
  const missBag = consumeSupportWeightBonuses(whiff.ok ? whiff.state.pendingSupportWeights ?? [] : []);
  const ctx = { posture: Posture.BALANCED };
  const tool = createMockSkill({
    id: 'tool_chip',
    cardRole: CardRole.SIDE_ATTACK,
    actionType: ActionType.ACTIVE,
    tags: [SkillTag.TOOL],
    currentCooldown: 0,
  });
  const nonTool = createMockSkill({
    id: 'smash',
    cardRole: CardRole.ATTACK,
    actionType: ActionType.ACTIVE,
    tags: [SkillTag.TAIJUTSU],
    currentCooldown: 0,
  });
  const toolBase = effectiveWeight(tool, { ...ctx, supportTagBonuses: {} });
  const toolBoost = effectiveWeight(tool, { ...ctx, supportTagBonuses: first.tagBonuses });
  const nonSame =
    effectiveWeight(nonTool, { ...ctx, supportTagBonuses: first.tagBonuses }) ===
    effectiveWeight(nonTool, { ...ctx, supportTagBonuses: {} });
  return {
    authoring:
      skill.cardRole === CardRole.SIDE_ATTACK &&
      skill.apCost === 1 &&
      skill.cooldown === 1 &&
      skill.baseDamage === 7 &&
      skill.allowedRanges?.includes(CombatRange.MEDIUM) === true &&
      skill.allowedRanges?.includes(CombatRange.LONG) === true &&
      !skill.allowedRanges?.includes(CombatRange.CLOSE) &&
      skill.nextDrawTagBonus?.tag === SkillTag.TOOL &&
      skill.nextDrawTagBonus.delta === 1,
    hitWeight: landed.ok && landed.damageDealt === 7 && first.tagBonuses[SkillTag.TOOL] === 1,
    apply:
      toolBoost === toolBase + 1 &&
      nonSame &&
      missBag.tagBonuses[SkillTag.TOOL] === undefined &&
      close.ok === false,
    metrics: {
      apCost: skill.apCost ?? 0,
      hitDamage: landed.ok ? landed.damageDealt : 0,
      toolDelta: toolBoost - toolBase,
      closeRejected: close.ok === false,
    },
  };
}

export function printKunaiThrowProbe(probe: KunaiThrowProbe): void {
  const m = probe.metrics;
  console.log('\n── T-049 Kunai Throw probe ──');
  console.log(`  authoring SIDE:     ${probe.authoring}`);
  console.log(`  hit 7 + TOOL +1:    ${probe.hitWeight}`);
  console.log(`  weight / miss / CLOSE: ${probe.apply}`);
  console.log('  ── balance vs legacy AP2 untagged RANGED ──');
  console.log(`  AP:                 ${m.apCost}  (was 2)`);
  console.log(`  hit dmg:            ${m.hitDamage}  (was 7)`);
  console.log(`  TOOL Δ:             ${m.toolDelta}  (was 0)`);
  console.log(`  CLOSE rejected:     ${m.closeRejected}`);
}
