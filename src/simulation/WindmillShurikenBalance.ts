/**
 * T-071 probe — Windmill 12 M/L + PULL 1 on hit; vs unused PIERCING/pen 0.2.
 */

import {
  CardRole,
  CombatRange,
  DamageProperty,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface WindmillShurikenProbe {
  authoring: boolean;
  pull: boolean;
  edge: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    baseDamage: number;
    hitDamage: number;
    longTo: string;
    missRange: string;
    mediumTo: string;
    leftoverPen: number;
    leftoverPiercing: boolean;
  };
}

export function runWindmillShurikenProbe(): WindmillShurikenProbe {
  const skill = SKILLS.WINDMILL_SHURIKEN;
  const state = (range: CombatRange): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: false,
  });
  const hit = { rollHit: () => ({ hit: true, damage: skill.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false, damage: 0 }) };
  const fromLong = resolveSkill({ skill }, state(CombatRange.LONG), hit);
  const whiff = resolveSkill({ skill }, state(CombatRange.LONG), miss);
  const fromMid = resolveSkill({ skill }, state(CombatRange.MEDIUM), hit);
  const fromClose = resolveSkill({ skill }, state(CombatRange.CLOSE), hit);
  return {
    authoring:
      skill.cardRole === CardRole.SIDE_ATTACK &&
      skill.apCost === 2 &&
      skill.chakraCost === 0 &&
      skill.cooldown === 3 &&
      skill.baseDamage === 12 &&
      skill.bandMove?.kind === 'PULL' &&
      skill.bandMove.requireHit === true &&
      skill.damageProperty !== DamageProperty.PIERCING &&
      (skill.penetration ?? 0) === 0,
    pull:
      fromLong.ok === true &&
      fromLong.damageDealt === 12 &&
      fromLong.state.range === CombatRange.MEDIUM &&
      fromLong.state.playerMoveUsedThisTurn === false,
    edge:
      whiff.ok === true &&
      whiff.state.range === CombatRange.LONG &&
      fromMid.ok === true &&
      fromMid.state.range === CombatRange.CLOSE &&
      fromClose.ok === false,
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      baseDamage: skill.baseDamage,
      hitDamage: fromLong.ok ? fromLong.damageDealt : -1,
      longTo: fromLong.ok ? fromLong.state.range : 'fail',
      missRange: whiff.ok ? whiff.state.range : 'fail',
      mediumTo: fromMid.ok ? fromMid.state.range : 'fail',
      leftoverPen: skill.penetration ?? 0,
      leftoverPiercing: skill.damageProperty === DamageProperty.PIERCING,
    },
  };
}

export function printWindmillShurikenProbe(probe: WindmillShurikenProbe): void {
  const m = probe.metrics;
  console.log('\n── T-071 Windmill Shuriken probe ──');
  console.log(`  authoring SIDE 12 PULL: ${probe.authoring}`);
  console.log(`  LONG→MEDIUM on hit:     ${probe.pull}`);
  console.log(`  miss / CLOSE edge:      ${probe.edge}`);
  console.log('  ── balance vs unused PIERCING/pen 0.2 ──');
  console.log(`  AP / CP:                ${m.apCost} / ${m.chakraCost}  (was 2 / 0)`);
  console.log(`  hit dmg:                ${m.hitDamage}  (was 12 unused pen)`);
  console.log(`  LONG / miss / MEDIUM:   ${m.longTo} / ${m.missRange} / ${m.mediumTo}`);
  console.log(`  leftover pen / pierce:  ${m.leftoverPen} / ${m.leftoverPiercing}  (was 0.2 / true)`);
  console.log('  ── equilibrium ──');
  console.log('  new: 12 chip + forced PULL 1 (no manual-move spend).');
  console.log('  old: 12 + secret 20% pen, no movement. Healthy reposition SIDE.');
}
