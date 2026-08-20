/**
 * T-141 probe — suijinheki_elem_def stacks feed live elementalDefenseFlat vs decorative 0.
 */

import {
  AttackMethod,
  CombatActor,
  DamageType,
  ElementType,
  MarkFamily,
  PrimaryStat,
} from '../game/types';
import { elementalDefenseFlatFromMarks } from '../game/systems/MarkSystem';
import { calculateDamage, calculateDerivedStats, getPlayerFullStats } from '../game/systems/StatSystem';
import type { Mark } from '../game/types';
import { BASE_STATS, createMockPlayer, createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface ElemDefMarksLiveProbe {
  pure: boolean;
  stacks: boolean;
  liveDerived: boolean;
  liveElemMit: boolean;
  physUnchanged: boolean;
  metrics: {
    helperFlat1: number;
    helperFlat2: number;
    spdDownFlat: number;
    derivedBare: number;
    derivedArmed: number;
    elemDmgBare: number;
    elemDmgArmed: number;
    physDmgBare: number;
    physDmgArmed: number;
  };
}

function elemDefMark(stacks: number): Mark {
  return {
    id: 'suijinheki_elem_def',
    sourceSkillId: 'suijinheki',
    owner: CombatActor.PLAYER,
    target: CombatActor.PLAYER,
    duration: 1,
    stacks,
    family: MarkFamily.STAT,
  };
}

function spdDown(stacks: number): Mark {
  return {
    id: 'spd_down',
    sourceSkillId: 'leaf_whirlwind',
    owner: CombatActor.PLAYER,
    target: CombatActor.PLAYER,
    duration: 2,
    stacks,
    family: MarkFamily.STAT,
  };
}

export function runElemDefMarksLiveProbe(): ElemDefMarksLiveProbe {
  const helperFlat1 = elementalDefenseFlatFromMarks([elemDefMark(1)], CombatActor.PLAYER);
  const helperFlat2 = elementalDefenseFlatFromMarks([elemDefMark(2)], CombatActor.PLAYER);
  const spdDownFlat = elementalDefenseFlatFromMarks([spdDown(2)], CombatActor.PLAYER);
  const player = createMockPlayer({ primaryStats: { ...BASE_STATS }, activeBuffs: [] });
  const bare = getPlayerFullStats(player);
  const armed = getPlayerFullStats(player, [elemDefMark(1)]);
  const attackerDerived = calculateDerivedStats(BASE_STATS, {});
  const elemSkill = createMockSkill({
    baseDamage: 20,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.FIRE,
  });
  const physSkill = createMockSkill({
    baseDamage: 20,
    scalingPerPoint: 0,
    damageType: DamageType.PHYSICAL,
    attackMethod: AttackMethod.AUTO,
  });
  const opts = { forceHit: true, forceCrit: false } as const;
  const elemBare = calculateDamage(
    BASE_STATS,
    attackerDerived,
    bare.effectivePrimary,
    bare.derived,
    elemSkill,
    ElementType.FIRE,
    ElementType.WATER,
    opts,
  );
  const elemArmed = calculateDamage(
    BASE_STATS,
    attackerDerived,
    armed.effectivePrimary,
    armed.derived,
    elemSkill,
    ElementType.FIRE,
    ElementType.WATER,
    opts,
  );
  const physBare = calculateDamage(
    BASE_STATS,
    attackerDerived,
    bare.effectivePrimary,
    bare.derived,
    physSkill,
    ElementType.PHYSICAL,
    ElementType.WATER,
    opts,
  );
  const physArmed = calculateDamage(
    BASE_STATS,
    attackerDerived,
    armed.effectivePrimary,
    armed.derived,
    physSkill,
    ElementType.PHYSICAL,
    ElementType.WATER,
    opts,
  );
  return {
    pure: helperFlat1 === 1 && spdDownFlat === 0,
    stacks: helperFlat2 === 2,
    liveDerived: armed.derived.elementalDefenseFlat === bare.derived.elementalDefenseFlat + 1,
    liveElemMit: elemArmed.finalDamage < elemBare.finalDamage,
    physUnchanged: physArmed.finalDamage === physBare.finalDamage,
    metrics: {
      helperFlat1,
      helperFlat2,
      spdDownFlat,
      derivedBare: bare.derived.elementalDefenseFlat,
      derivedArmed: armed.derived.elementalDefenseFlat,
      elemDmgBare: elemBare.finalDamage,
      elemDmgArmed: elemArmed.finalDamage,
      physDmgBare: physBare.finalDamage,
      physDmgArmed: physArmed.finalDamage,
    },
  };
}

export function printElemDefMarksLiveProbe(probe: ElemDefMarksLiveProbe): void {
  const m = probe.metrics;
  console.log('\n── T-141 elem-def Marks live probe ──');
  console.log(`  suijinheki_elem_def 1 → flat 1: ${probe.pure}`);
  console.log(`  stacks 2 → flat 2:              ${probe.stacks}`);
  console.log(`  live derived +1:                ${probe.liveDerived}`);
  console.log(`  elemental mit lower:            ${probe.liveElemMit}`);
  console.log(`  physical unchanged:             ${probe.physUnchanged}`);
  console.log('  ── balance vs decorative unused elem STAT ──');
  console.log(`  helper 1 / 2 / spd_down: ${m.helperFlat1} / ${m.helperFlat2} / ${m.spdDownFlat}  (was 0 live)`);
  console.log(`  derived flat:            ${m.derivedBare} → ${m.derivedArmed}`);
  console.log(`  elemental finalDamage:   ${m.elemDmgBare} → ${m.elemDmgArmed}`);
  console.log(`  physical finalDamage:    ${m.physDmgBare} → ${m.physDmgArmed}`);
  console.log('  ── equilibrium ──');
  console.log('  +1 integer elem flat (Suijinheki). Shield 40 still the bulk absorb. Not SPIRIT %. Physical hits unchanged.');
}
