/**
 * T-093 probe — Earth Decapitation SIDE 13; PULL MEDIUM→CLOSE; 50% Stun 1.
 */

import { CardRole, CombatRange, EffectType } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface EarthDecapitationProbe {
  authoring: boolean;
  pull: boolean;
  stun: boolean;
  metrics: {
    baseDamage: number;
    apCost: number;
    chakraCost: number;
    stunChance: number;
    windmillDmg: number;
    kickStunChance: number;
    dmgPerAp: number;
  };
}

export function runEarthDecapitationProbe(): EarthDecapitationProbe {
  const decap = SKILLS.EARTH_DECAPITATION;
  const mill = SKILLS.WINDMILL_SHURIKEN;
  const kick = SKILLS.SWEEPING_KICK;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [decap],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: true,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: decap.baseDamage }) };
  const pulled = resolveSkill({ skill: decap }, state(), { ...hit, rng: () => 0.99 });
  const stunned = resolveSkill({ skill: decap }, state(), { ...hit, rng: () => 0 });
  const fail = resolveSkill({ skill: decap }, state(), { ...hit, rng: () => 0.5 });
  const stunOk =
    stunned.ok &&
    (stunned.state.enemyBuffs ?? []).some((b) => b.effect.type === EffectType.STUN && b.duration === 1);
  const failOk =
    fail.ok &&
    !(fail.state.enemyBuffs ?? []).some((b) => b.effect.type === EffectType.STUN);
  const ap = decap.apCost ?? 0;
  const dmg = pulled.ok ? pulled.damageDealt : 0;
  return {
    authoring:
      decap.cardRole === CardRole.SIDE_ATTACK &&
      decap.apCost === 2 &&
      decap.chakraCost === 5 &&
      decap.cooldown === 3 &&
      decap.baseDamage === 13 &&
      (decap.allowedRanges ?? []).includes(CombatRange.CLOSE) &&
      (decap.allowedRanges ?? []).includes(CombatRange.MEDIUM) &&
      decap.bandMove?.kind === 'PULL' &&
      decap.bandMove.requireHit === true &&
      decap.impactStun?.chance === 0.5 &&
      decap.impactStun.duration === 1,
    pull:
      pulled.ok === true &&
      pulled.damageDealt === 13 &&
      pulled.state.range === CombatRange.CLOSE &&
      pulled.state.playerMoveUsedThisTurn === true,
    stun: stunOk === true && failOk === true,
    metrics: {
      baseDamage: dmg,
      apCost: ap,
      chakraCost: decap.chakraCost,
      stunChance: decap.impactStun?.chance ?? 0,
      windmillDmg: mill.baseDamage,
      kickStunChance: kick.impactStun?.chance ?? 0,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
    },
  };
}

export function printEarthDecapitationProbe(probe: EarthDecapitationProbe): void {
  const m = probe.metrics;
  console.log('\n── T-093 Earth Decapitation probe ──');
  console.log(`  authoring SIDE 13 + PULL + 50% Stun: ${probe.authoring}`);
  console.log(`  PULL MEDIUM→CLOSE no move spend:     ${probe.pull}`);
  console.log(`  stun 0.5 path:                       ${probe.stun}`);
  console.log('  ── balance vs legacy mute Stun 60% and Windmill PULL / Sweep 40% ──');
  console.log(`  dmg / AP:           ${m.baseDamage} / ${m.apCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was 13 / 2)`);
  console.log(`  CP:                 ${m.chakraCost}  (unchanged 5)`);
  console.log(`  live stun:          ${m.stunChance}  (was mute 0.6; Sweep ${m.kickStunChance})`);
  console.log(`  Windmill sibling:   ${m.windmillDmg} dmg PULL no stun`);
}
