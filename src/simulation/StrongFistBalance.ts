/**
 * T-057 probe — Strong Fist authoring; 2×5 full; miss 0; partial 1/5.
 */

import {
  CardRole,
  CombatRange,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface StrongFistProbe {
  authoring: boolean;
  fullConnect: boolean;
  missSafe: boolean;
  partial: boolean;
  mediumIllegal: boolean;
  metrics: {
    apCost: number;
    hitCount: number;
    perHit: number;
    fullDamage: number;
    missDamage: number;
    partialDamage: number;
    dmgPerAp: number;
  };
}

export function runStrongFistProbe(): StrongFistProbe {
  const skill = SKILLS.STRONG_FIST;
  const state = (range: CombatRange): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 80,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: skill.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  let n = 0;
  const mixed = {
    rollHit: () => {
      n += 1;
      return n === 1
        ? { hit: true as const, damage: skill.baseDamage }
        : { hit: false as const, damage: 0 };
    },
  };
  const full = resolveSkill({ skill }, state(CombatRange.CLOSE), hit);
  const whiff = resolveSkill({ skill }, state(CombatRange.CLOSE), miss);
  const one = resolveSkill({ skill }, state(CombatRange.CLOSE), mixed);
  const mid = resolveSkill({ skill }, state(CombatRange.MEDIUM), hit);
  const fullDmg = full.ok ? full.damageDealt : 0;
  const apCost = skill.apCost ?? 0;
  return {
    authoring:
      skill.cardRole === CardRole.ATTACK &&
      skill.apCost === 2 &&
      skill.cooldown === 1 &&
      skill.hitCount === 2 &&
      skill.baseDamage === 5 &&
      skill.modeInteraction === undefined,
    fullConnect:
      full.ok === true &&
      full.hitsLanded === 2 &&
      full.damageDealt === 10,
    missSafe:
      whiff.ok === true &&
      whiff.hitsLanded === 0 &&
      whiff.damageDealt === 0,
    partial:
      one.ok === true &&
      one.hitsLanded === 1 &&
      one.damageDealt === 5,
    mediumIllegal: mid.ok === false,
    metrics: {
      apCost,
      hitCount: skill.hitCount ?? 1,
      perHit: skill.baseDamage,
      fullDamage: fullDmg,
      missDamage: whiff.ok ? whiff.damageDealt : -1,
      partialDamage: one.ok ? one.damageDealt : -1,
      dmgPerAp: apCost > 0 ? fullDmg / apCost : 0,
    },
  };
}

export function printStrongFistProbe(probe: StrongFistProbe): void {
  const m = probe.metrics;
  console.log('\n── T-057 Strong Fist probe ──');
  console.log(`  authoring ATTACK 2×5:    ${probe.authoring}`);
  console.log(`  full 2 hits → 10:        ${probe.fullConnect}`);
  console.log(`  miss 0/0:                ${probe.missSafe}`);
  console.log(`  partial 1/5:             ${probe.partial}`);
  console.log(`  MEDIUM illegal:          ${probe.mediumIllegal}`);
  console.log('  ── balance vs legacy single 10 ──');
  console.log(`  AP:                     ${m.apCost}  (was 2)`);
  console.log(`  hits × per-hit:         ${m.hitCount}×${m.perHit}  (was 1×10)`);
  console.log(`  full connect:           ${m.fullDamage}  (was 10)`);
  console.log(`  dmg/AP:                 ${m.dmgPerAp.toFixed(1)}  (was 5.0)`);
  console.log(`  partial / miss:         ${m.partialDamage} / ${m.missDamage}  (was 10 or 0)`);
}
