/**
 * T-129 probe — Kawarimi SUPPORT Substitution 2 ignore first hit + retreat 1; vs unused Shield 30 + SPEED 30%.
 */

import {
  CardRole,
  CombatRange,
  EffectType,
  PrimaryStat,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { applySubstitutionIncoming } from '../game/systems/MarkSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface KawarimiProbe {
  authoring: boolean;
  plant: boolean;
  helper: boolean;
  passthrough: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    cooldown: number;
    duration: number;
    stacks: number;
    hitFrom40: number;
    retreatFromMedium: CombatRange | undefined;
    leftoverShield: number;
    leftoverSpeed: number;
    apAfter: number;
    cpAfter: number;
    unarmedFrom40: number;
  };
}

export function runKawarimiProbe(): KawarimiProbe {
  const skill = SKILLS.KAWARIMI;
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
    ? planted.state.marks.find((m) => m.id === 'substitution')
    : undefined;
  const used = planted.ok
    ? planted.state.skills.find((s) => s.id === skill.id)
    : undefined;
  const leftoverShield =
    skill.effects?.find((e) => e.type === EffectType.SHIELD)?.value ?? 0;
  const leftoverSpeed =
    skill.effects?.find(
      (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.SPEED,
    )?.value ?? 0;
  const fired = planted.ok
    ? applySubstitutionIncoming(40, planted.state.marks, CombatRange.MEDIUM)
    : { damage: -1, consumed: false, retreatSteps: 0, range: undefined, marks: [] };
  const unarmed = applySubstitutionIncoming(40, [], CombatRange.MEDIUM);
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 1 &&
      skill.chakraCost === 3 &&
      skill.cooldown === 4 &&
      skill.baseDamage === 0 &&
      leftoverShield === 0 &&
      leftoverSpeed === 0 &&
      skill.stanceShift === undefined &&
      skill.markEffects?.some(
        (m) => m.id === 'substitution' && m.duration === 2 && m.targetActor === 'self',
      ) === true,
    plant:
      planted.ok === true &&
      planted.damageDealt === 0 &&
      mark?.duration === 2 &&
      mark.target !== undefined &&
      planted.state.modes.instances.length === 0 &&
      used?.readyOnTurn === 7,
    helper:
      fired.damage === 0 &&
      fired.consumed === true &&
      fired.retreatSteps === 1 &&
      fired.range === CombatRange.LONG,
    passthrough:
      unarmed.damage === 40 &&
      unarmed.consumed === false &&
      unarmed.retreatSteps === 0,
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      cooldown: skill.cooldown,
      duration: mark?.duration ?? 0,
      stacks: mark?.stacks ?? 0,
      hitFrom40: fired.damage,
      retreatFromMedium: fired.range,
      leftoverShield,
      leftoverSpeed,
      apAfter: planted.ok ? planted.state.pools.ap : -1,
      cpAfter: planted.ok ? planted.state.pools.chakra : -1,
      unarmedFrom40: unarmed.damage,
    },
  };
}

export function printKawarimiProbe(probe: KawarimiProbe): void {
  const m = probe.metrics;
  console.log('\n── T-129 Kawarimi probe ──');
  console.log(`  authoring SUPPORT Substitution 2 not Shield/SPEED: ${probe.authoring}`);
  console.log(`  plant self duration 2 dmg 0:                       ${probe.plant}`);
  console.log(`  first hit 40→0 + retreat MEDIUM→LONG:              ${probe.helper}`);
  console.log(`  unarmed 40 passthrough:                            ${probe.passthrough}`);
  console.log('  ── balance vs unused Shield 30 + SPEED +30%×2 ──');
  console.log(`  AP / CP / CD:           ${m.apCost} / ${m.chakraCost} / ${m.cooldown}  (was 1 / 3 / 4)`);
  console.log(`  substitution stacks×dur: ${m.stacks}×${m.duration}  (was Shield 30 + SPEED 0.3)`);
  console.log(`  first offensive 40:     ${m.hitFrom40}  (was 40 after Shield, or 10 if Shield 30 applied)`);
  console.log(`  retreat from MEDIUM:    ${m.retreatFromMedium}  (was no retreat)`);
  console.log(`  leftover Shield/SPEED:  ${m.leftoverShield} / ${m.leftoverSpeed}  (was 30 / 0.3)`);
  console.log(`  pools after:            AP ${m.apAfter} / CP ${m.cpAfter}`);
  console.log(`  unarmed 40:             ${m.unarmedFrom40}`);
  console.log('  ── equilibrium ──');
  console.log('  Full ignore once + band retreat vs partial Shield 30. Healthier honesty; stronger vs one big hit, weaker vs multi-hit chip after consume.');
}
