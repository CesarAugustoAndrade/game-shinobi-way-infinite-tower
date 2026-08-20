/**
 * T-130 probe — Edo Tensei SUPPORT Reanimation 3 lethal→1 + Shield 40; vs unused STR/SPD 50%×5.
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
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import {
  applyReanimationLethal,
  reanimationRoleBonuses,
  REANIMATION_MARK_ID,
  REANIMATION_SHIELD_MARK_ID,
} from '../game/systems/MarkSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface EdoTenseiProbe {
  authoring: boolean;
  plant: boolean;
  helper: boolean;
  passthrough: boolean;
  weight: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    hpCost: number;
    cooldown: number;
    duration: number;
    stacks: number;
    hpAfterPlant: number;
    lethalFrom10vs40: number;
    shieldStacks: number;
    leftoverStr: number;
    leftoverSpd: number;
    attackWeightDelta: number;
    attackWeightAfterConsume: number;
    unarmedNewHp: number;
  };
}

const attack = createMockSkill({
  id: 'basic_atk',
  cardRole: CardRole.ATTACK,
  actionType: ActionType.ACTIVE,
  currentCooldown: 0,
});

export function runEdoTenseiProbe(): EdoTenseiProbe {
  const skill = SKILLS.EDO_TENSEI;
  const planted = resolveSkill(
    { skill },
    {
      pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
      range: CombatRange.MEDIUM,
      turnIndex: 2,
      marks: [],
      modes: emptyModeBoard(),
      skills: [skill],
      playerBuffs: [],
      enemyHp: 80,
      pendingSupportWeights: [],
    } satisfies ResolveSkillState,
  );
  const mark = planted.ok
    ? planted.state.marks.find((m) => m.id === REANIMATION_MARK_ID)
    : undefined;
  const used = planted.ok
    ? planted.state.skills.find((s) => s.id === skill.id)
    : undefined;
  const leftoverStr =
    skill.effects?.find(
      (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.STRENGTH,
    )?.value ?? 0;
  const leftoverSpd =
    skill.effects?.find(
      (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.SPEED,
    )?.value ?? 0;
  const fired = planted.ok
    ? applyReanimationLethal(10, 40, planted.state.marks)
    : {
        newHp: -1,
        consumed: false,
        grantShield: 0,
        survived: false,
        marks: [],
      };
  const unarmed = applyReanimationLethal(10, 40, []);
  const ctx = { posture: Posture.BALANCED };
  const armedBonuses = planted.ok ? reanimationRoleBonuses(planted.state.marks) : {};
  const afterBonuses = reanimationRoleBonuses(fired.marks);
  const baseAtk = effectiveWeight(attack, { ...ctx, supportRoleBonuses: {} });
  const armedAtk = effectiveWeight(attack, { ...ctx, supportRoleBonuses: armedBonuses });
  const consumedAtk = effectiveWeight(attack, { ...ctx, supportRoleBonuses: afterBonuses });
  const shield = fired.marks.find((m) => m.id === REANIMATION_SHIELD_MARK_ID);
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 4 &&
      skill.chakraCost === 18 &&
      skill.hpCost === 30 &&
      skill.cooldown === 10 &&
      skill.baseDamage === 0 &&
      leftoverStr === 0 &&
      leftoverSpd === 0 &&
      skill.nextDrawRoleBonus === undefined &&
      skill.markEffects?.some(
        (m) => m.id === REANIMATION_MARK_ID && m.duration === 3 && m.targetActor === 'self',
      ) === true,
    plant:
      planted.ok === true &&
      planted.damageDealt === 0 &&
      planted.state.pools.hp === 10 &&
      mark?.duration === 3 &&
      mark.target !== undefined &&
      planted.state.modes.instances.length === 0 &&
      used?.readyOnTurn === 13,
    helper:
      fired.newHp === 1 &&
      fired.consumed === true &&
      fired.grantShield === 40 &&
      fired.survived === true &&
      shield?.stacks === 40,
    passthrough: unarmed.newHp === -30 && unarmed.consumed === false && unarmed.grantShield === 0,
    weight: armedAtk === baseAtk + 1 && consumedAtk === baseAtk,
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      hpCost: skill.hpCost ?? 0,
      cooldown: skill.cooldown,
      duration: mark?.duration ?? 0,
      stacks: mark?.stacks ?? 0,
      hpAfterPlant: planted.ok ? planted.state.pools.hp : -1,
      lethalFrom10vs40: fired.newHp,
      shieldStacks: shield?.stacks ?? 0,
      leftoverStr,
      leftoverSpd,
      attackWeightDelta: armedAtk - baseAtk,
      attackWeightAfterConsume: consumedAtk - baseAtk,
      unarmedNewHp: unarmed.newHp,
    },
  };
}

export function printEdoTenseiProbe(probe: EdoTenseiProbe): void {
  const m = probe.metrics;
  console.log('\n── T-130 Edo Tensei probe ──');
  console.log(`  authoring SUPPORT Reanimation 3 not STR/SPD 50%: ${probe.authoring}`);
  console.log(`  plant self duration 3 HP−30 dmg 0:               ${probe.plant}`);
  console.log(`  lethal 10−40 → 1 + Shield 40 consume:            ${probe.helper}`);
  console.log(`  unarmed lethal passthrough:                      ${probe.passthrough}`);
  console.log(`  ATTACK weight +1 armed / 0 after consume:        ${probe.weight}`);
  console.log('  ── balance vs unused STR/SPD +50%×5 ──');
  console.log(`  AP / CP / HP / CD:      ${m.apCost} / ${m.chakraCost} / ${m.hpCost} / ${m.cooldown}  (was 2 / 18 / 30 / 10)`);
  console.log(`  reanimation stacks×dur: ${m.stacks}×${m.duration}  (was STR 0.5 + SPD 0.5 ×5)`);
  console.log(`  HP after plant:         ${m.hpAfterPlant}  (paid 30)`);
  console.log(`  lethal 10 vs 40:        ${m.lethalFrom10vs40} HP  (was guts rng or death)`);
  console.log(`  Shield on fire:         ${m.shieldStacks}  (was none)`);
  console.log(`  leftover STR/SPD:       ${m.leftoverStr} / ${m.leftoverSpd}  (was 0.5 / 0.5)`);
  console.log(`  ATTACK weight Δ armed:  ${m.attackWeightDelta}  (was 0)`);
  console.log(`  ATTACK weight Δ after:  ${m.attackWeightAfterConsume}`);
  console.log(`  unarmed 10−40:          ${m.unarmedNewHp}`);
  console.log('  ── equilibrium ──');
  console.log('  Guaranteed once-per-arm lethal save + Shield 40 vs secret 50% STR/SPD summon. Healthier honesty; stronger vs one execute, weaker as a 5-turn stat steroid. HP 30 + AP 4 is a steep arm cost.');
}
