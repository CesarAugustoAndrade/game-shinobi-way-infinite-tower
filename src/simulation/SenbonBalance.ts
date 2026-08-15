/**
 * T-058 probe — Senbon authoring; chip 7; 35% Silence 1 on hit.
 */

import {
  CardRole,
  CombatRange,
  EffectType,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface SenbonProbe {
  authoring: boolean;
  silenceOn: boolean;
  silenceOff: boolean;
  missSafe: boolean;
  closeIllegal: boolean;
  metrics: {
    apCost: number;
    chipDamage: number;
    silenceChance: number;
    silenceDuration: number;
    missDamage: number;
  };
}

function hasSilence(
  buffs: { effect: { type: EffectType }; duration: number }[] | undefined,
  duration: number,
): boolean {
  return (buffs ?? []).some(
    (buff) => buff.effect.type === EffectType.SILENCE && buff.duration === duration,
  );
}

export function runSenbonProbe(): SenbonProbe {
  const skill = SKILLS.SENBON;
  const state = (range: CombatRange): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: skill.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const silenced = resolveSkill({ skill }, state(CombatRange.MEDIUM), { ...hit, rng: () => 0 });
  const clean = resolveSkill({ skill }, state(CombatRange.MEDIUM), { ...hit, rng: () => 0.35 });
  const whiff = resolveSkill({ skill }, state(CombatRange.MEDIUM), { ...miss, rng: () => 0 });
  const close = resolveSkill({ skill }, state(CombatRange.CLOSE), { ...hit, rng: () => 0 });
  return {
    authoring:
      skill.cardRole === CardRole.SIDE_ATTACK &&
      skill.apCost === 1 &&
      skill.cooldown === 1 &&
      skill.baseDamage === 7 &&
      skill.impactSilence?.chance === 0.35 &&
      skill.impactSilence.duration === 1 &&
      skill.controlStun === undefined,
    silenceOn:
      silenced.ok === true &&
      silenced.damageDealt === 7 &&
      hasSilence(silenced.state.enemyBuffs, 1) &&
      !hasSilence(silenced.state.playerBuffs, 1),
    silenceOff:
      clean.ok === true &&
      clean.damageDealt === 7 &&
      !hasSilence(clean.state.enemyBuffs, 1),
    missSafe:
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      !hasSilence(whiff.state.enemyBuffs, 1),
    closeIllegal: close.ok === false,
    metrics: {
      apCost: skill.apCost ?? 0,
      chipDamage: silenced.ok ? silenced.damageDealt : 0,
      silenceChance: skill.impactSilence?.chance ?? 0,
      silenceDuration: silenced.ok && hasSilence(silenced.state.enemyBuffs, 1) ? 1 : 0,
      missDamage: whiff.ok ? whiff.damageDealt : -1,
    },
  };
}

export function printSenbonProbe(probe: SenbonProbe): void {
  const m = probe.metrics;
  console.log('\n── T-058 Senbon probe ──');
  console.log(`  authoring SIDE AP1:     ${probe.authoring}`);
  console.log(`  hit rng 0 → Silence 1:  ${probe.silenceOn}`);
  console.log(`  hit rng 0.35 → none:    ${probe.silenceOff}`);
  console.log(`  miss no silence:        ${probe.missSafe}`);
  console.log(`  CLOSE illegal:          ${probe.closeIllegal}`);
  console.log('  ── balance vs legacy AP2 unused 50% Silence ──');
  console.log(`  AP:                     ${m.apCost}  (was 2)`);
  console.log(`  chip:                   ${m.chipDamage}  (was 7 / dead silence)`);
  console.log(`  silence chance:         ${m.silenceChance}  (was 0.5 packaging)`);
  console.log(`  silence duration on hit:${m.silenceDuration}  (was 0 under resolve)`);
  console.log(`  miss damage:            ${m.missDamage}`);
}
