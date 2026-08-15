/**
 * T-063 probe — Iaido 12 CLOSE; Cloak 12→28 consume; miss consumes.
 */

import { CardRole, CombatRange } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface IaidoProbe {
  authoring: boolean;
  baseline: boolean;
  cloakPayoff: boolean;
  missConsumes: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    baseDamage: number;
    cloakDamage: number;
    missDamage: number;
    setupDelta: number;
  };
}

export function runIaidoProbe(): IaidoProbe {
  const skill = SKILLS.IAIDO;
  const cloak = SKILLS.CLOAK_INVIS;
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill, cloak],
    playerBuffs: [],
    enemyHp: 80,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: skill.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const base = resolveSkill({ skill }, state(), hit);
  const planted = resolveSkill({ skill: cloak }, state());
  const armed = planted.ok
    ? resolveSkill({ skill }, planted.state, hit)
    : planted;
  const whiffPlant = resolveSkill({ skill: cloak }, state());
  const whiff = whiffPlant.ok
    ? resolveSkill({ skill }, whiffPlant.state, miss)
    : whiffPlant;
  return {
    authoring:
      skill.cardRole === CardRole.ATTACK &&
      skill.apCost === 2 &&
      skill.chakraCost === 1 &&
      skill.cooldown === 3 &&
      skill.baseDamage === 12 &&
      skill.allowedRanges?.length === 1 &&
      skill.allowedRanges[0] === CombatRange.CLOSE &&
      skill.critBonus !== 40,
    baseline: base.ok === true && base.damageDealt === 12,
    cloakPayoff:
      armed.ok === true &&
      armed.damageDealt === 28 &&
      !armed.state.marks.some((m) => m.id === 'cloaked'),
    missConsumes:
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      !whiff.state.marks.some((m) => m.id === 'cloaked'),
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      baseDamage: base.ok ? base.damageDealt : -1,
      cloakDamage: armed.ok ? armed.damageDealt : -1,
      missDamage: whiff.ok ? whiff.damageDealt : -1,
      setupDelta: armed.ok && base.ok ? armed.damageDealt - base.damageDealt : -1,
    },
  };
}

export function printIaidoProbe(probe: IaidoProbe): void {
  const m = probe.metrics;
  console.log('\n── T-063 Iaido probe ──');
  console.log(`  authoring ATTACK:       ${probe.authoring}`);
  console.log(`  baseline 12 no cloak:   ${probe.baseline}`);
  console.log(`  Cloak 12→28 consume:    ${probe.cloakPayoff}`);
  console.log(`  miss consumes cloak:    ${probe.missConsumes}`);
  console.log('  ── balance vs legacy critBonus 40 ──');
  console.log(`  AP / CP:                ${m.apCost} / ${m.chakraCost}  (was 2 / 1)`);
  console.log(`  base / cloak dmg:       ${m.baseDamage} / ${m.cloakDamage}  (was 12 / 12 + 40% crit chance)`);
  console.log(`  cloak Δ:                ${m.setupDelta}  (1.5 crit × 1.5 Setup +1 DEX)`);
  console.log(`  miss dmg:               ${m.missDamage}`);
}
