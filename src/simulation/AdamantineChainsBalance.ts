/**
 * T-097 probe — Adamantine Chains ATTACK 20; PULL LONG→CLOSE; 70% Stun; −1 SPD×2.
 */

import { CardRole, CombatRange, EffectType, MarkFamily } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface AdamantineChainsProbe {
  authoring: boolean;
  pull: boolean;
  control: boolean;
  metrics: {
    baseDamage: number;
    apCost: number;
    chakraCost: number;
    stunChance: number;
    decapStun: number;
    whirlDmg: number;
    dmgPerAp: number;
  };
}

export function runAdamantineChainsProbe(): AdamantineChainsProbe {
  const chains = SKILLS.ADAMANTINE_CHAINS;
  const decap = SKILLS.EARTH_DECAPITATION;
  const whirl = SKILLS.LEAF_WHIRLWIND;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.LONG,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [chains],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: true,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: chains.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const pulled = resolveSkill({ skill: chains }, state(), { ...hit, rng: () => 0.99 });
  const stunned = resolveSkill({ skill: chains }, state(), { ...hit, rng: () => 0 });
  const fail = resolveSkill({ skill: chains }, state(), { ...hit, rng: () => 0.7 });
  const whiff = resolveSkill({ skill: chains }, state(), { ...miss, rng: () => 0 });
  const stunOk =
    stunned.ok &&
    (stunned.state.enemyBuffs ?? []).some((b) => b.effect.type === EffectType.STUN && b.duration === 1) &&
    stunned.state.marks.some(
      (m) => m.id === 'adamantine_spd' && m.family === MarkFamily.STAT && m.duration === 2,
    );
  const failOk =
    fail.ok &&
    !(fail.state.enemyBuffs ?? []).some((b) => b.effect.type === EffectType.STUN) &&
    fail.state.marks.some((m) => m.id === 'adamantine_spd');
  const missOk =
    whiff.ok === true &&
    whiff.damageDealt === 0 &&
    whiff.state.range === CombatRange.LONG &&
    !whiff.state.marks.some((m) => m.id === 'adamantine_spd');
  const ap = chains.apCost ?? 0;
  const dmg = pulled.ok ? pulled.damageDealt : 0;
  return {
    authoring:
      chains.cardRole === CardRole.ATTACK &&
      chains.apCost === 3 &&
      chains.chakraCost === 6 &&
      chains.cooldown === 4 &&
      chains.baseDamage === 20 &&
      (chains.allowedRanges ?? []).includes(CombatRange.MEDIUM) &&
      (chains.allowedRanges ?? []).includes(CombatRange.LONG) &&
      chains.bandMove?.kind === 'PULL' &&
      chains.bandMove.steps === 2 &&
      chains.bandMove.requireHit === true &&
      chains.impactStun?.chance === 0.7 &&
      chains.impactStun.duration === 1 &&
      chains.markEffects?.some(
        (m) => m.id === 'adamantine_spd' && m.stacks === 1 && m.duration === 2 && m.requireHit === true,
      ) === true,
    pull:
      pulled.ok === true &&
      pulled.damageDealt === 20 &&
      pulled.state.range === CombatRange.CLOSE &&
      pulled.state.playerMoveUsedThisTurn === true,
    control: stunOk === true && failOk === true && missOk === true,
    metrics: {
      baseDamage: dmg,
      apCost: ap,
      chakraCost: chains.chakraCost,
      stunChance: chains.impactStun?.chance ?? 0,
      decapStun: decap.impactStun?.chance ?? 0,
      whirlDmg: whirl.baseDamage,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
    },
  };
}

export function printAdamantineChainsProbe(probe: AdamantineChainsProbe): void {
  const m = probe.metrics;
  console.log('\n── T-097 Adamantine Chains probe ──');
  console.log(`  authoring ATTACK 20 + PULL 2 + 70% Stun + SPD: ${probe.authoring}`);
  console.log(`  PULL LONG→CLOSE no move spend:                 ${probe.pull}`);
  console.log(`  stun 0.7 / SPD on hit / miss clean:            ${probe.control}`);
  console.log('  ── balance vs legacy AP2 + Stun 35% / CHAKRA % and Decap 50% / Whirl 14 ──');
  console.log(`  dmg / AP:           ${m.baseDamage} / ${m.apCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was 20 / 2)`);
  console.log(`  CP:                 ${m.chakraCost}  (unchanged 6)`);
  console.log(`  live stun:          ${m.stunChance}  (was mute 0.35; Decap ${m.decapStun})`);
  console.log(`  Whirlwind sibling:  ${m.whirlDmg} dmg −1 SPD no PULL`);
}
