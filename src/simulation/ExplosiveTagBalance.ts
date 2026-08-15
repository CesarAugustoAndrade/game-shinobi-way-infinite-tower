/**
 * T-056 probe — Explosive Tag authoring; chip 11; PUSH 1 on hit; miss stays.
 */

import {
  CardRole,
  CombatRange,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface ExplosiveTagProbe {
  authoring: boolean;
  closePush: boolean;
  mediumPush: boolean;
  missSafe: boolean;
  longIllegal: boolean;
  metrics: {
    apCost: number;
    chipDamage: number;
    missDamage: number;
    closeAfterRange: string;
    missAfterRange: string;
    dmgPerAp: number;
  };
}

export function runExplosiveTagProbe(): ExplosiveTagProbe {
  const skill = SKILLS.EXPLOSIVE_TAG;
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
  const hit = { rollHit: () => ({ hit: true as const, damage: skill.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const closeHit = resolveSkill({ skill }, state(CombatRange.CLOSE), hit);
  const midHit = resolveSkill({ skill }, state(CombatRange.MEDIUM), hit);
  const whiff = resolveSkill({ skill }, state(CombatRange.CLOSE), miss);
  const longPlay = resolveSkill({ skill }, state(CombatRange.LONG), hit);
  const chip = closeHit.ok ? closeHit.damageDealt : 0;
  const apCost = skill.apCost ?? 0;
  return {
    authoring:
      skill.cardRole === CardRole.SIDE_ATTACK &&
      skill.apCost === 1 &&
      skill.cooldown === 2 &&
      skill.baseDamage === 11 &&
      skill.bandMove?.kind === 'PUSH' &&
      skill.bandMove.steps === 1 &&
      skill.bandMove.requireHit === true,
    closePush:
      closeHit.ok === true &&
      closeHit.damageDealt === 11 &&
      closeHit.state.range === CombatRange.MEDIUM &&
      closeHit.state.playerMoveUsedThisTurn === false,
    mediumPush:
      midHit.ok === true &&
      midHit.damageDealt === 11 &&
      midHit.state.range === CombatRange.LONG &&
      midHit.state.playerMoveUsedThisTurn === false,
    missSafe:
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      whiff.state.range === CombatRange.CLOSE,
    longIllegal: longPlay.ok === false,
    metrics: {
      apCost,
      chipDamage: chip,
      missDamage: whiff.ok ? whiff.damageDealt : -1,
      closeAfterRange: closeHit.ok ? closeHit.state.range : 'fail',
      missAfterRange: whiff.ok ? whiff.state.range : 'fail',
      dmgPerAp: apCost > 0 ? chip / apCost : 0,
    },
  };
}

export function printExplosiveTagProbe(probe: ExplosiveTagProbe): void {
  const m = probe.metrics;
  console.log('\n── T-056 Explosive Tag probe ──');
  console.log(`  authoring SIDE AP1 PUSH: ${probe.authoring}`);
  console.log(`  CLOSE hit → MEDIUM:      ${probe.closePush}`);
  console.log(`  MEDIUM hit → LONG:       ${probe.mediumPush}`);
  console.log(`  miss stays CLOSE:        ${probe.missSafe}`);
  console.log(`  LONG illegal:            ${probe.longIllegal}`);
  console.log('  ── balance vs legacy AP2 fire no PUSH ──');
  console.log(`  AP:                     ${m.apCost}  (was 2)`);
  console.log(`  chip:                   ${m.chipDamage}  (was 11 / no PUSH)`);
  console.log(`  dmg/AP:                 ${m.dmgPerAp.toFixed(1)}  (was 5.5)`);
  console.log(`  CLOSE after hit:        ${m.closeAfterRange}  (was CLOSE)`);
  console.log(`  miss after range:       ${m.missAfterRange}  (was CLOSE, still)`);
  console.log(`  miss damage:            ${m.missDamage}`);
}
