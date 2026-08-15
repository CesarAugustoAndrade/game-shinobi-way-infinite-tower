/**
 * T-055 probe — Sweeping Kick authoring; chip 7; 40% Stun 1 on hit.
 */

import {
  CardRole,
  CombatRange,
  EffectType,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface SweepingKickProbe {
  authoring: boolean;
  stunOn: boolean;
  stunOff: boolean;
  missSafe: boolean;
  metrics: {
    apCost: number;
    chipDamage: number;
    stunDuration: number;
    missDamage: number;
  };
}

function hasStun(
  buffs: { effect: { type: EffectType }; duration: number }[] | undefined,
  duration: number,
): boolean {
  return (buffs ?? []).some(
    (buff) => buff.effect.type === EffectType.STUN && buff.duration === duration,
  );
}

export function runSweepingKickProbe(): SweepingKickProbe {
  const skill = SKILLS.SWEEPING_KICK;
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
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
  const stunned = resolveSkill({ skill }, state(), { ...hit, rng: () => 0 });
  const clean = resolveSkill({ skill }, state(), { ...hit, rng: () => 0.4 });
  const whiff = resolveSkill({ skill }, state(), { ...miss, rng: () => 0 });
  return {
    authoring:
      skill.cardRole === CardRole.SIDE_ATTACK &&
      skill.apCost === 1 &&
      skill.cooldown === 2 &&
      skill.baseDamage === 7 &&
      skill.impactStun?.chance === 0.4 &&
      skill.impactStun.duration === 1 &&
      skill.controlStun === undefined,
    stunOn:
      stunned.ok === true &&
      stunned.damageDealt === 7 &&
      hasStun(stunned.state.enemyBuffs, 1) &&
      !hasStun(stunned.state.playerBuffs, 1),
    stunOff:
      clean.ok === true &&
      clean.damageDealt === 7 &&
      !hasStun(clean.state.enemyBuffs, 1),
    missSafe:
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      !hasStun(whiff.state.enemyBuffs, 1),
    metrics: {
      apCost: skill.apCost ?? 0,
      chipDamage: stunned.ok ? stunned.damageDealt : 0,
      stunDuration: stunned.ok && hasStun(stunned.state.enemyBuffs, 1) ? 1 : 0,
      missDamage: whiff.ok ? whiff.damageDealt : -1,
    },
  };
}

export function printSweepingKickProbe(probe: SweepingKickProbe): void {
  const m = probe.metrics;
  console.log('\n── T-055 Sweeping Kick probe ──');
  console.log(`  authoring SIDE:         ${probe.authoring}`);
  console.log(`  hit rng 0 → Stun 1:     ${probe.stunOn}`);
  console.log(`  hit rng 0.4 → no stun:  ${probe.stunOff}`);
  console.log(`  miss no stun:           ${probe.missSafe}`);
  console.log('  ── balance vs legacy AP2 unused effects[] ──');
  console.log(`  AP:                     ${m.apCost}  (was 2)`);
  console.log(`  chip:                   ${m.chipDamage}  (was 7 / dead stun)`);
  console.log(`  stun duration on hit:   ${m.stunDuration}  (was 0 under resolve)`);
  console.log(`  miss damage:            ${m.missDamage}`);
}
