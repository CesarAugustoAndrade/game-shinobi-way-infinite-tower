/**
 * T-124 probe — Counter Stance SUPPORT Counter 30% + SIDE +1; no instant dmg.
 */

import { ActionType, CardRole, CombatRange, Posture } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { effectiveWeight } from '../game/systems/DeckSystem';
import { consumeSupportWeightBonuses } from '../game/systems/SupportWeightSystem';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface CounterStanceProbe {
  authoring: boolean;
  plant: boolean;
  weight: boolean;
  metrics: {
    legacyAp: number;
    legacyDmg: number;
    apCost: number;
    chakraCost: number;
    damageDealt: number;
    reflectPct: number;
    rotationReflect: number;
    braceAp: number;
  };
}

export function runCounterStanceProbe(): CounterStanceProbe {
  const stance = SKILLS.COUNTER_STANCE;
  const rotation = SKILLS.ROTATION;
  const brace = SKILLS.BRACE;
  const side = createMockSkill({
    id: 'wire_kunai_reel',
    cardRole: CardRole.SIDE_ATTACK,
    actionType: ActionType.ACTIVE,
    currentCooldown: 0,
  });
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [stance],
    playerBuffs: [],
    enemyHp: 80,
    pendingSupportWeights: [],
  });
  const result = resolveSkill({ skill: stance }, state());
  const mark = result.ok ? result.state.marks.find((m) => m.id === 'counter_reflect') : undefined;
  const first = consumeSupportWeightBonuses(
    result.ok ? (result.state.pendingSupportWeights ?? []) : [],
  );
  const second = consumeSupportWeightBonuses(first.bag);
  const ctx = { posture: Posture.BALANCED };
  const baseSide = effectiveWeight(side, { ...ctx, supportRoleBonuses: {} });
  const boosted = effectiveWeight(side, { ...ctx, supportRoleBonuses: first.roleBonuses });
  const rotReflect = rotation.markEffects?.find((m) => m.id === 'rotation_reflect')?.stacks ?? 0;
  return {
    authoring:
      stance.cardRole === CardRole.SUPPORT &&
      stance.apCost === 1 &&
      stance.chakraCost === 1 &&
      stance.cooldown === 4 &&
      stance.baseDamage === 0 &&
      stance.nextDrawRoleBonus?.role === CardRole.SIDE_ATTACK &&
      stance.nextDrawRoleBonus.delta === 1 &&
      stance.markEffects?.some(
        (m) => m.id === 'counter_reflect' && m.stacks === 30 && m.duration === 1,
      ) === true,
    plant:
      result.ok === true &&
      result.damageDealt === 0 &&
      mark?.stacks === 30 &&
      mark.target !== undefined &&
      first.roleBonuses[CardRole.SIDE_ATTACK] === 1,
    weight:
      result.ok === true &&
      result.damageDealt === 0 &&
      (result.ok ? result.state.enemyHp : 0) === 80 &&
      boosted === baseSide + 1 &&
      second.roleBonuses[CardRole.SIDE_ATTACK] === undefined,
    metrics: {
      legacyAp: 2,
      legacyDmg: 8,
      apCost: stance.apCost ?? 0,
      chakraCost: stance.chakraCost ?? 0,
      damageDealt: result.ok ? result.damageDealt : -1,
      reflectPct: mark?.stacks ?? 0,
      rotationReflect: rotReflect,
      braceAp: brace.apCost ?? 0,
    },
  };
}

export function printCounterStanceProbe(probe: CounterStanceProbe): void {
  const m = probe.metrics;
  console.log('\n── T-124 Counter Stance probe ──');
  console.log(`  authoring SUPPORT AP1/CP1 CD4 Counter 30% SIDE+1: ${probe.authoring}`);
  console.log(`  plant self mark 30 + SIDE bag +1; dmg 0:          ${probe.plant}`);
  console.log(`  no instant 8; SIDE bonus one-shot:                ${probe.weight}`);
  console.log('  ── balance vs mute AP2/8 dmg/50% reflect and Rotation 60% ──');
  console.log(
    `  package:     AP${m.apCost}/CP${m.chakraCost} dmg ${m.damageDealt}  (was AP${m.legacyAp} / ${m.legacyDmg} dmg)`,
  );
  console.log(
    `  reflect:     ${m.reflectPct}% duration 1  (was 50% effects[]; Rotation ${m.rotationReflect}%)`,
  );
  console.log(`  Brace sibling AP: ${m.braceAp} SUPPORT (no reflect)`);
}
