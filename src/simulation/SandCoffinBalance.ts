/**
 * T-100 probe — Sand Coffin SIDE 15 M/L; 70% Stun 1 + Coffined 2; no ARMOR_BREAK.
 */

import {
  CardRole,
  CombatRange,
  DamageProperty,
  EffectType,
  MarkFamily,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface SandCoffinProbe {
  authoring: boolean;
  impact: boolean;
  miss: boolean;
  metrics: {
    baseDamage: number;
    apCost: number;
    chakraCost: number;
    stunChance: number;
    decapStun: number;
    decapDmg: number;
    dmgPerAp: number;
  };
}

export function runSandCoffinProbe(): SandCoffinProbe {
  const coffin = SKILLS.SAND_COFFIN;
  const decap = SKILLS.EARTH_DECAPITATION;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [coffin],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: coffin.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const stunned = resolveSkill({ skill: coffin }, state(), { ...hit, rng: () => 0 });
  const fail = resolveSkill({ skill: coffin }, state(), { ...hit, rng: () => 0.7 });
  const whiff = resolveSkill({ skill: coffin }, state(), { ...miss, rng: () => 0 });
  const stunOk =
    stunned.ok === true &&
    stunned.damageDealt === 15 &&
    (stunned.state.enemyBuffs ?? []).some((b) => b.effect.type === EffectType.STUN && b.duration === 1) &&
    stunned.state.marks.some(
      (m) => m.id === 'coffined' && m.family === MarkFamily.HARD_CONTROL && m.duration === 2,
    );
  const failOk =
    fail.ok === true &&
    fail.damageDealt === 15 &&
    !(fail.state.enemyBuffs ?? []).some((b) => b.effect.type === EffectType.STUN) &&
    fail.state.marks.some((m) => m.id === 'coffined');
  const missOk =
    whiff.ok === true &&
    whiff.damageDealt === 0 &&
    !whiff.state.marks.some((m) => m.id === 'coffined') &&
    !(whiff.state.enemyBuffs ?? []).some((b) => b.effect.type === EffectType.STUN);
  const ap = coffin.apCost ?? 0;
  const dmg = stunned.ok ? stunned.damageDealt : 0;
  return {
    authoring:
      coffin.cardRole === CardRole.SIDE_ATTACK &&
      coffin.apCost === 2 &&
      coffin.chakraCost === 7 &&
      coffin.cooldown === 5 &&
      coffin.baseDamage === 15 &&
      (coffin.allowedRanges ?? []).includes(CombatRange.MEDIUM) &&
      (coffin.allowedRanges ?? []).includes(CombatRange.LONG) &&
      coffin.damageProperty === DamageProperty.NORMAL &&
      coffin.impactStun?.chance === 0.7 &&
      coffin.impactStun.duration === 1 &&
      coffin.markEffects?.some(
        (m) => m.id === 'coffined' && m.duration === 2 && m.requireHit === true,
      ) === true,
    impact: stunOk === true && failOk === true,
    miss: missOk,
    metrics: {
      baseDamage: dmg,
      apCost: ap,
      chakraCost: coffin.chakraCost,
      stunChance: coffin.impactStun?.chance ?? 0,
      decapStun: decap.impactStun?.chance ?? 0,
      decapDmg: decap.baseDamage,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
    },
  };
}

export function printSandCoffinProbe(probe: SandCoffinProbe): void {
  const m = probe.metrics;
  console.log('\n── T-100 Sand Coffin probe ──');
  console.log(`  authoring SIDE 15 + 70% Stun + coffined 2: ${probe.authoring}`);
  console.log(`  hit coffined 2 / stun 0.7 independent:    ${probe.impact}`);
  console.log(`  miss no coffined / no stun:               ${probe.miss}`);
  console.log('  ── balance vs mute ARMOR_BREAK + Stun 70% and Decap 13/50% ──');
  console.log(`  dmg / AP:           ${m.baseDamage} / ${m.apCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was 15 / 2)`);
  console.log(`  CP:                 ${m.chakraCost}  (unchanged 7)`);
  console.log(`  live stun:          ${m.stunChance}  (was mute 0.7; Decap ${m.decapStun})`);
  console.log(`  Decap sibling:      ${m.decapDmg} dmg SIDE 50% Stun no Coffined`);
}
