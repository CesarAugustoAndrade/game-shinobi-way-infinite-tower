/**
 * T-038 probe — Smoke Bomb authoring; mark + SIDE +1 one-shot; ATTACK isolated.
 */

import { ActionType, CardRole, CombatRange, Posture } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { effectiveWeight } from '../game/systems/DeckSystem';
import { consumeSupportWeightBonuses } from '../game/systems/SupportWeightSystem';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { applySmokeOutgoing } from '../game/systems/MarkSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface SmokeBombProbe {
  authoring: boolean;
  weightMark: boolean;
  sideOnly: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    smokeStacks: number;
    sideDelta: number;
    cutFrom40: number;
  };
}

export function runSmokeBombProbe(): SmokeBombProbe {
  const smoke = SKILLS.SMOKE_BOMB;
  const state: ResolveSkillState = {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [smoke],
    playerBuffs: [],
    enemyHp: 50,
    pendingSupportWeights: [],
  };
  const result = resolveSkill({ skill: smoke }, state);
  const first = consumeSupportWeightBonuses(result.ok ? result.state.pendingSupportWeights ?? [] : []);
  const second = consumeSupportWeightBonuses(first.bag);
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
  const mark = result.ok ? result.state.marks.find((m) => m.id === 'smoke') : undefined;
  const cut = result.ok ? applySmokeOutgoing(40, result.state.marks) : { damage: -1, consumed: false };
  return {
    authoring:
      smoke.cardRole === CardRole.SUPPORT &&
      smoke.apCost === 1 &&
      smoke.chakraCost === 0 &&
      smoke.cooldown === 3 &&
      smoke.baseDamage === 0 &&
      smoke.nextDrawRoleBonus?.role === CardRole.SIDE_ATTACK &&
      smoke.nextDrawRoleBonus.delta === 1 &&
      smoke.markEffects?.some((m) => m.id === 'smoke' && m.duration === 2 && m.stacks === 25) === true,
    weightMark:
      result.ok &&
      result.damageDealt === 0 &&
      mark?.duration === 2 &&
      first.roleBonuses[CardRole.SIDE_ATTACK] === 1 &&
      boosted === baseSide + 1 &&
      second.roleBonuses[CardRole.SIDE_ATTACK] === undefined,
    sideOnly: attackBag === attackEmpty,
    metrics: {
      apCost: smoke.apCost ?? 0,
      chakraCost: smoke.chakraCost,
      smokeStacks: mark?.stacks ?? 0,
      sideDelta: boosted - baseSide,
      cutFrom40: cut.damage,
    },
  };
}

export function printSmokeBombProbe(probe: SmokeBombProbe): void {
  const m = probe.metrics;
  console.log('\n── T-038 Smoke Bomb probe ──');
  console.log(`  authoring SUPPORT:  ${probe.authoring}`);
  console.log(`  mark + SIDE +1:     ${probe.weightMark}`);
  console.log(`  ATTACK isolated:    ${probe.sideOnly}`);
  console.log('  ── balance vs legacy SPEED +35% / ACC −20% ──');
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (unchanged 1 / 0)`);
  console.log(`  smoke stacks:       ${m.smokeStacks}  (was SPEED/ACC %)`);
  console.log(`  SIDE weight Δ:      ${m.sideDelta}  (was 0)`);
  console.log(`  first offensive 40: ${m.cutFrom40}  (was 40)`);
}
