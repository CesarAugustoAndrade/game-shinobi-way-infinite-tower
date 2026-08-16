/**
 * T-073 probe — Hidden Mist plant −20 + SIDE +1; vs unused SPEED +50% / ACC −30%.
 */

import {
  ActionType,
  CardRole,
  CombatRange,
  EffectType,
  Posture,
  PrimaryStat,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { effectiveWeight } from '../game/systems/DeckSystem';
import { consumeSupportWeightBonuses } from '../game/systems/SupportWeightSystem';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { applyMistOutgoing } from '../game/systems/MarkSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface HiddenMistProbe {
  authoring: boolean;
  weightMark: boolean;
  supportOnly: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    mistStacks: number;
    sideDelta: number;
    cutFrom40: number;
    leftoverSpeed: number;
    leftoverAcc: number;
  };
}

export function runHiddenMistProbe(): HiddenMistProbe {
  const skill = SKILLS.HIDDEN_MIST;
  const state: ResolveSkillState = {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 50,
    pendingSupportWeights: [],
  };
  const result = resolveSkill({ skill }, state);
  const first = consumeSupportWeightBonuses(
    result.ok ? result.state.pendingSupportWeights ?? [] : [],
  );
  const ctx = { posture: Posture.BALANCED };
  const side = createMockSkill({
    id: 'wire_kunai_reel',
    cardRole: CardRole.SIDE_ATTACK,
    actionType: ActionType.ACTIVE,
    currentCooldown: 0,
  });
  const attack = createMockSkill({
    id: 'rasengan',
    cardRole: CardRole.ATTACK,
    actionType: ActionType.ACTIVE,
    currentCooldown: 0,
  });
  const baseSide = effectiveWeight(side, { ...ctx, supportRoleBonuses: {} });
  const boosted = effectiveWeight(side, { ...ctx, supportRoleBonuses: first.roleBonuses });
  const attackEmpty = effectiveWeight(attack, { ...ctx, supportRoleBonuses: {} });
  const attackBag = effectiveWeight(attack, { ...ctx, supportRoleBonuses: first.roleBonuses });
  const mark = result.ok ? result.state.marks.find((m) => m.id === 'mist') : undefined;
  const cut = result.ok
    ? applyMistOutgoing(40, result.state.marks)
    : { damage: -1, consumed: false };
  const leftoverSpeed =
    skill.effects?.find(
      (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.SPEED,
    )?.value ?? 0;
  const leftoverAcc =
    skill.effects?.find(
      (e) => e.type === EffectType.DEBUFF && e.targetStat === PrimaryStat.ACCURACY,
    )?.value ?? 0;
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 2 &&
      skill.chakraCost === 5 &&
      skill.cooldown === 5 &&
      skill.baseDamage === 0 &&
      leftoverSpeed === 0 &&
      leftoverAcc === 0,
    weightMark:
      result.ok === true &&
      result.damageDealt === 0 &&
      mark?.duration === 2 &&
      mark.stacks === 20 &&
      first.roleBonuses[CardRole.SIDE_ATTACK] === 1 &&
      boosted === baseSide + 1 &&
      attackBag === attackEmpty,
    supportOnly: result.ok === true && !('terrain' in result.state),
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      mistStacks: mark?.stacks ?? 0,
      sideDelta: boosted - baseSide,
      cutFrom40: cut.damage,
      leftoverSpeed,
      leftoverAcc,
    },
  };
}

export function printHiddenMistProbe(probe: HiddenMistProbe): void {
  const m = probe.metrics;
  console.log('\n── T-073 Hidden Mist probe ──');
  console.log(`  authoring SUPPORT:      ${probe.authoring}`);
  console.log(`  mark + SIDE +1:         ${probe.weightMark}`);
  console.log(`  no Terrain / 0 dmg:     ${probe.supportOnly}`);
  console.log('  ── balance vs SPEED +50% / ACC −30% ──');
  console.log(`  AP / CP:                ${m.apCost} / ${m.chakraCost}  (was 2 / 5)`);
  console.log(`  mist stacks:            ${m.mistStacks}  (was SPEED/ACC %)`);
  console.log(`  SIDE weight Δ:          ${m.sideDelta}  (was 0)`);
  console.log(`  first offensive 40:     ${m.cutFrom40}  (was 40)`);
  console.log(`  leftover SPEED / ACC:   ${m.leftoverSpeed} / ${m.leftoverAcc}  (was 0.5 / 0.3)`);
  console.log('  ── equilibrium ──');
  console.log('  new: guaranteed −20 first enemy offensive + SIDE +1 vs secret SPEED/ACC %.');
  console.log('  Healthier than Smoke −25 (costs more AP/CP/CD). Mark, not Terrain.');
}
