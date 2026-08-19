/**
 * T-115 probe — Shinra Tensei ATTACK 23 ANY; PUSH 1; 70% Stun 1; no TRUE.
 */

import { CardRole, CombatRange, DamageType, EffectType } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface ShinraTenseiProbe {
  authoring: boolean;
  hit: boolean;
  missOrLong: boolean;
  metrics: {
    baseDamage: number;
    apCost: number;
    chakraCost: number;
    stunChance: number;
    vortexDmg: number;
    gustDmg: number;
    dmgPerAp: number;
  };
}

function hasStun(
  buffs: { effect: { type: EffectType }; duration: number }[] | undefined,
  duration = 1,
): boolean {
  return (buffs ?? []).some(
    (buff) => buff.effect.type === EffectType.STUN && buff.duration === duration,
  );
}

export function runShinraTenseiProbe(): ShinraTenseiProbe {
  const gravity = SKILLS.SHINRA_TENSEI;
  const vortex = SKILLS.WATER_VORTEX;
  const gust = SKILLS.GREAT_BREAKTHROUGH;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [gravity],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: true,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: gravity.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const pushed = resolveSkill({ skill: gravity }, state(), { ...hit, rng: () => 0 });
  const fromClose = resolveSkill(
    { skill: gravity },
    state({ range: CombatRange.CLOSE }),
    { ...hit, rng: () => 0 },
  );
  const atLong = resolveSkill(
    { skill: gravity },
    state({ range: CombatRange.LONG }),
    { ...hit, rng: () => 0 },
  );
  const whiff = resolveSkill({ skill: gravity }, state(), { ...miss, rng: () => 0 });
  const failStun = resolveSkill({ skill: gravity }, state(), { ...hit, rng: () => 0.7 });
  const ap = gravity.apCost ?? 0;
  const dmg = pushed.ok ? pushed.damageDealt : 0;
  return {
    authoring:
      gravity.cardRole === CardRole.ATTACK &&
      gravity.apCost === 4 &&
      gravity.chakraCost === 13 &&
      gravity.cooldown === 5 &&
      gravity.baseDamage === 23 &&
      gravity.damageType === DamageType.ELEMENTAL &&
      gravity.bandMove?.kind === 'PUSH' &&
      gravity.bandMove.requireHit === true &&
      gravity.impactStun?.chance === 0.7 &&
      gravity.impactStun.duration === 1 &&
      gravity.effects?.some((e) => e.type === EffectType.STUN && e.chance === 0.5) !== true,
    hit:
      pushed.ok === true &&
      dmg === 23 &&
      pushed.state.range === CombatRange.LONG &&
      hasStun(pushed.state.enemyBuffs, 1) &&
      fromClose.ok === true &&
      fromClose.state.range === CombatRange.MEDIUM,
    missOrLong:
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      whiff.state.range === CombatRange.MEDIUM &&
      !hasStun(whiff.state.enemyBuffs, 1) &&
      atLong.ok === true &&
      atLong.state.range === CombatRange.LONG &&
      hasStun(atLong.state.enemyBuffs, 1) &&
      failStun.ok === true &&
      failStun.state.range === CombatRange.LONG &&
      !hasStun(failStun.state.enemyBuffs, 1),
    metrics: {
      baseDamage: dmg,
      apCost: ap,
      chakraCost: gravity.chakraCost,
      stunChance: gravity.impactStun?.chance ?? 0,
      vortexDmg: vortex.baseDamage,
      gustDmg: gust.baseDamage,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
    },
  };
}

export function printShinraTenseiProbe(probe: ShinraTenseiProbe): void {
  const m = probe.metrics;
  console.log('\n── T-115 Shinra Tensei probe ──');
  console.log(`  authoring ATTACK 23 ANY + PUSH + 70% Stun 1: ${probe.authoring}`);
  console.log(`  hit MEDIUM→LONG + Stun / CLOSE→MEDIUM:      ${probe.hit}`);
  console.log(`  miss no PUSH; LONG stay + Stun; rng fail:   ${probe.missOrLong}`);
  console.log('  ── balance vs mute TRUE 23/AP2/Stun 50% and Vortex 20 / Gust 16 ──');
  console.log(`  dmg / AP:           ${m.baseDamage} / ${m.apCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was 23 / 2 = 11.50 TRUE)`);
  console.log(`  CP / CD / stun:     ${m.chakraCost} / 5 / ${m.stunChance}  (was mute 0.5)`);
  console.log(`  Vortex / Gust:      ${m.vortexDmg} PUSH / ${m.gustDmg} PUSH+Setup`);
}
