/**
 * T-089 probe — Dragon Flame authoring; base 17; 2T +50% + 1 charge; Burn 5×3.
 */

import { CardRole, CombatRange, EffectType, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface DragonFlameProbe {
  authoring: boolean;
  baseNoMode: boolean;
  sharinganEnhance: boolean;
  metrics: {
    baseDamage: number;
    enhancedDamage: number;
    apCost: number;
    chakraCost: number;
    burnTotal: number;
    fireballBurnTotal: number;
    dmgPerApBase: number;
    dmgPerApEnhanced: number;
  };
}

export function runDragonFlameProbe(): DragonFlameProbe {
  const flame = SKILLS.DRAGON_FLAME;
  const fireball = SKILLS.FIREBALL;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [flame],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const sharingan2 = {
    instances: [
      {
        id: 'sharingan_2',
        family: MODE_FAMILY.SHARINGAN,
        charges: 3,
        state: ModeRuntimeState.ON,
      },
    ],
  };
  const hit = { rollHit: () => ({ hit: true as const, damage: flame.baseDamage }) };
  const off = resolveSkill({ skill: flame }, state(), hit);
  const on = resolveSkill({ skill: flame }, state({ modes: sharingan2 }), hit);
  const burn = flame.effects?.find((e) => e.type === EffectType.BURN);
  const fbBurn = fireball.effects?.find((e) => e.type === EffectType.BURN);
  const burnTotal = (burn?.value ?? 0) * (burn?.duration ?? 0);
  const fireballBurnTotal = (fbBurn?.value ?? 0) * (fbBurn?.duration ?? 0);
  const baseDmg = off.ok ? off.damageDealt : 0;
  const enhDmg = on.ok ? on.damageDealt : 0;
  const ap = flame.apCost ?? 0;
  return {
    authoring:
      flame.cardRole === CardRole.ATTACK &&
      flame.apCost === 3 &&
      flame.chakraCost === 6 &&
      flame.cooldown === 3 &&
      flame.baseDamage === 17 &&
      (flame.allowedRanges ?? []).includes(CombatRange.MEDIUM) &&
      (flame.allowedRanges ?? []).includes(CombatRange.LONG) &&
      flame.modeInteraction?.modeId === 'sharingan_2' &&
      flame.modeInteraction.consumeCharges === 1 &&
      flame.modeInteraction.damageMultBonus === 0.5 &&
      !flame.modeInteraction.requireOn &&
      burn?.value === 5 &&
      burn.duration === 3,
    baseNoMode: off.ok === true && off.damageDealt === 17 && off.state.modes.instances.length === 0,
    sharinganEnhance:
      on.ok === true &&
      on.damageDealt === Math.floor(17 * 1.5) &&
      on.state.modes.instances.find((m) => m.id === 'sharingan_2')?.charges === 2 &&
      on.state.modes.instances.find((m) => m.id === 'sharingan_2')?.state === ModeRuntimeState.ON,
    metrics: {
      baseDamage: baseDmg,
      enhancedDamage: enhDmg,
      apCost: ap,
      chakraCost: flame.chakraCost,
      burnTotal,
      fireballBurnTotal,
      dmgPerApBase: ap > 0 ? baseDmg / ap : 0,
      dmgPerApEnhanced: ap > 0 ? enhDmg / ap : 0,
    },
  };
}

export function printDragonFlameProbe(probe: DragonFlameProbe): void {
  const m = probe.metrics;
  console.log('\n── T-089 Dragon Flame probe ──');
  console.log(`  authoring 17 + Burn 5×3: ${probe.authoring}`);
  console.log(`  base no Mode:            ${probe.baseNoMode}`);
  console.log(`  2T +50% + 1 charge:      ${probe.sharinganEnhance}`);
  console.log('  ── balance vs legacy 17/AP2/Burn 10×3@70% and Fireball 5×2 ──');
  console.log(`  base / 2T dmg:           ${m.baseDamage} / ${m.enhancedDamage}  (was 17 / no Mode)`);
  console.log(`  AP / CP:                 ${m.apCost} / ${m.chakraCost}  (was 2 / 6)`);
  console.log(`  burn package:            ${m.burnTotal}  (was 21 expected @70%; Fireball ${m.fireballBurnTotal})`);
  console.log(`  dmg/AP base / 2T:        ${m.dmgPerApBase.toFixed(2)} / ${m.dmgPerApEnhanced.toFixed(2)}  (was 8.50 / n/a)`);
}
