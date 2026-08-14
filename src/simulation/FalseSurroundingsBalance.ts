/**
 * T-041 probe — False Surroundings authoring; Confusion/Read Mind; MENTAL ATTACK +1.
 */

import { ActionType, CardRole, CombatRange, DamageType, EffectType, Posture } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { effectiveWeight } from '../game/systems/DeckSystem';
import { consumeSupportWeightBonuses } from '../game/systems/SupportWeightSystem';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface FalseSurroundingsProbe {
  authoring: boolean;
  resolveControl: boolean;
  mentalWeight: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    confusionChance: number;
    mentalDelta: number;
  };
}

export function runFalseSurroundingsProbe(): FalseSurroundingsProbe {
  const skill = SKILLS.FALSE_SURROUNDINGS;
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 50,
    pendingSupportWeights: [],
  });
  const win = resolveSkill({ skill }, state(), { rng: () => 0 });
  const lose = resolveSkill({ skill }, state(), { rng: () => 0.99 });
  const first = consumeSupportWeightBonuses(win.ok ? win.state.pendingSupportWeights ?? [] : []);
  const mental = createMockSkill({
    id: 'hell_viewing',
    cardRole: CardRole.ATTACK,
    actionType: ActionType.ACTIVE,
    damageType: DamageType.MENTAL,
    currentCooldown: 0,
  });
  const phys = createMockSkill({
    id: 'basic_atk',
    cardRole: CardRole.ATTACK,
    actionType: ActionType.ACTIVE,
    damageType: DamageType.PHYSICAL,
    currentCooldown: 0,
  });
  const ctx = { posture: Posture.BALANCED };
  const mentalBase = effectiveWeight(mental, { ...ctx, supportMentalAttackBonus: 0 });
  const mentalBoost = effectiveWeight(mental, { ...ctx, supportMentalAttackBonus: first.mentalAttackBonus });
  const physSame =
    effectiveWeight(phys, { ...ctx, supportMentalAttackBonus: first.mentalAttackBonus }) ===
    effectiveWeight(phys, { ...ctx, supportMentalAttackBonus: 0 });
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 2 &&
      skill.chakraCost === 8 &&
      skill.cooldown === 5 &&
      skill.baseDamage === 0 &&
      skill.controlConfusion?.chance === 0.75 &&
      skill.controlConfusion.enemyDuration === 2 &&
      skill.nextDrawMentalAttackBonus === 1 &&
      skill.markEffects?.some((m) => m.id === 'read_mind' && m.duration === 2) === true,
    resolveControl:
      win.ok &&
      win.damageDealt === 0 &&
      (win.state.enemyBuffs ?? []).some((b) => b.effect.type === EffectType.CONFUSION && b.duration === 2) &&
      win.state.marks.some((m) => m.id === 'read_mind') &&
      lose.ok &&
      !(lose.state.enemyBuffs ?? []).some((b) => b.effect.type === EffectType.CONFUSION) &&
      lose.state.marks.some((m) => m.id === 'read_mind'),
    mentalWeight: first.mentalAttackBonus === 1 && mentalBoost === mentalBase + 1 && physSame,
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      confusionChance: skill.controlConfusion?.chance ?? 0,
      mentalDelta: mentalBoost - mentalBase,
    },
  };
}

export function printFalseSurroundingsProbe(probe: FalseSurroundingsProbe): void {
  const m = probe.metrics;
  console.log('\n── T-041 False Surroundings probe ──');
  console.log(`  authoring SUPPORT:  ${probe.authoring}`);
  console.log(`  confuse + Read Mind:${probe.resolveControl}`);
  console.log(`  MENTAL ATTACK +1:   ${probe.mentalWeight}`);
  console.log('  ── balance vs legacy Confusion 3 @80% (unwired SUPPORT) ──');
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (unchanged 2 / 8)`);
  console.log(`  confusion chance:   ${m.confusionChance}  (was packaging 0.8 / 3t)`);
  console.log(`  MENTAL ATTACK Δ:    ${m.mentalDelta}  (was 0)`);
}
