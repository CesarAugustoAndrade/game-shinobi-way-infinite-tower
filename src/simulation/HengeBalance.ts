/**
 * T-075 probe — Henge Misdirect 2 + SIDE +2; next SIDE Exposed 10%; vs unused DEX +25%.
 */

import {
  ActionType,
  AttackMethod,
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
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface HengeProbe {
  authoring: boolean;
  weight: boolean;
  exposed: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    sideDelta: number;
    rangedBefore: number;
    rangedAfter: number;
    leftoverDex: number;
  };
}

export function runHengeProbe(): HengeProbe {
  const skill = SKILLS.HENGE;
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 80,
    pendingSupportWeights: [],
  });
  const planted = resolveSkill({ skill }, state());
  const first = consumeSupportWeightBonuses(
    planted.ok ? planted.state.pendingSupportWeights ?? [] : [],
  );
  const ctx = { posture: Posture.BALANCED };
  const sideCard = createMockSkill({
    id: 'wire_kunai_reel',
    cardRole: CardRole.SIDE_ATTACK,
    actionType: ActionType.ACTIVE,
    currentCooldown: 0,
  });
  const attackCard = createMockSkill({
    id: 'rasengan',
    cardRole: CardRole.ATTACK,
    actionType: ActionType.ACTIVE,
    currentCooldown: 0,
  });
  const baseSide = effectiveWeight(sideCard, { ...ctx, supportRoleBonuses: {} });
  const boostedSide = effectiveWeight(sideCard, { ...ctx, supportRoleBonuses: first.roleBonuses });
  const attackEmpty = effectiveWeight(attackCard, { ...ctx, supportRoleBonuses: {} });
  const attackBag = effectiveWeight(attackCard, { ...ctx, supportRoleBonuses: first.roleBonuses });
  const slash = SKILLS.KUNAI_SLASH;
  const hitSide =
    planted.ok
      ? resolveSkill(
          { skill: slash },
          { ...planted.state, range: CombatRange.CLOSE, skills: [slash] },
          { rollHit: () => ({ hit: true, damage: slash.baseDamage }) },
        )
      : undefined;
  const rangedAttack = createMockSkill({
    id: 'fire_atk',
    cardRole: CardRole.ATTACK,
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 10,
    attackMethod: AttackMethod.RANGED,
    allowedRanges: [CombatRange.MEDIUM, CombatRange.LONG],
    currentCooldown: 0,
  });
  const boosted =
    hitSide?.ok
      ? resolveSkill(
          { skill: rangedAttack },
          { ...hitSide.state, range: CombatRange.MEDIUM, skills: [rangedAttack] },
          { rollHit: () => ({ hit: true, damage: 10 }) },
        )
      : undefined;
  const clean = resolveSkill(
    { skill: rangedAttack },
    { ...state(), skills: [rangedAttack] },
    { rollHit: () => ({ hit: true, damage: 10 }) },
  );
  const leftoverDex =
    skill.effects?.find(
      (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.DEXTERITY,
    )?.value ?? 0;
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 1 &&
      skill.chakraCost === 1 &&
      skill.cooldown === 4 &&
      skill.nextDrawRoleBonus?.delta === 2 &&
      leftoverDex === 0,
    weight:
      planted.ok === true &&
      first.roleBonuses[CardRole.SIDE_ATTACK] === 2 &&
      boostedSide === baseSide + 2 &&
      attackBag === attackEmpty,
    exposed:
      hitSide?.ok === true &&
      !hitSide.state.marks.some((m) => m.id === 'misdirect') &&
      hitSide.state.marks.some((m) => m.id === 'exposed_10') &&
      boosted?.ok === true &&
      boosted.damageDealt === 11 &&
      clean.ok === true &&
      clean.damageDealt === 10,
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      sideDelta: boostedSide - baseSide,
      rangedBefore: clean.ok ? clean.damageDealt : -1,
      rangedAfter: boosted?.ok ? boosted.damageDealt : -1,
      leftoverDex,
    },
  };
}

export function printHengeProbe(probe: HengeProbe): void {
  const m = probe.metrics;
  console.log('\n── T-075 Henge probe ──');
  console.log(`  authoring SUPPORT:      ${probe.authoring}`);
  console.log(`  SIDE +2 once:           ${probe.weight}`);
  console.log(`  Exposed 10% 10→11:      ${probe.exposed}`);
  console.log('  ── balance vs unused DEX +25%×2 ──');
  console.log(`  AP / CP:                ${m.apCost} / ${m.chakraCost}  (was 1 / 1)`);
  console.log(`  SIDE weight Δ:          ${m.sideDelta}  (was 0; Smoke/Mist +1)`);
  console.log(`  next RANGED 10→:        ${m.rangedAfter}  (was ${m.rangedBefore} / unused DEX %)`);
  console.log(`  leftover DEX:           ${m.leftoverDex}  (was 0.25)`);
  console.log('  ── equilibrium ──');
  console.log('  +2 SIDE draw bias + 10% setup vs secret DEX %. Distinct from Blastback 15%.');
  console.log('  Healthy academy setup; not overtuned.');
}
