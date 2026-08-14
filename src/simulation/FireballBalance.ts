/**
 * T-032 probe — Fireball authoring; base without Mode; Sharingan 2T +50% + 1 charge.
 */

import { CardRole, CombatRange, EffectType, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface FireballProbe {
  authoring: boolean;
  baseNoMode: boolean;
  sharinganEnhance: boolean;
  /** Live resolve numbers for balance (legacy authoring was 15 / AP2 / Burn 15×3@80%). */
  metrics: {
    baseDamage: number;
    enhancedDamage: number;
    apCost: number;
    chakraCost: number;
    burnTotal: number;
    dmgPerApBase: number;
    dmgPerApEnhanced: number;
  };
}

export function runFireballProbe(): FireballProbe {
  const fireball = SKILLS.FIREBALL;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [fireball],
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
  const hit = { rollHit: () => ({ hit: true as const, damage: fireball.baseDamage }) };
  const off = resolveSkill({ skill: fireball }, state(), hit);
  const on = resolveSkill({ skill: fireball }, state({ modes: sharingan2 }), hit);
  const burn = fireball.effects?.find((e) => e.type === EffectType.BURN);
  const burnTotal = (burn?.value ?? 0) * (burn?.duration ?? 0);
  const baseDmg = off.ok ? off.damageDealt : 0;
  const enhDmg = on.ok ? on.damageDealt : 0;
  const ap = fireball.apCost ?? 0;
  return {
    authoring:
      fireball.cardRole === CardRole.ATTACK &&
      fireball.apCost === 3 &&
      fireball.chakraCost === 6 &&
      fireball.cooldown === 3 &&
      fireball.baseDamage === 17 &&
      (fireball.allowedRanges ?? []).includes(CombatRange.MEDIUM) &&
      (fireball.allowedRanges ?? []).includes(CombatRange.LONG) &&
      fireball.modeInteraction?.modeId === 'sharingan_2' &&
      fireball.modeInteraction.consumeCharges === 1 &&
      fireball.modeInteraction.damageMultBonus === 0.5 &&
      !fireball.modeInteraction.requireOn,
    baseNoMode: off.ok && off.damageDealt === 17 && off.state.modes.instances.length === 0,
    sharinganEnhance:
      on.ok &&
      on.damageDealt === Math.floor(17 * 1.5) &&
      on.state.modes.instances.find((m) => m.id === 'sharingan_2')?.charges === 2 &&
      on.state.modes.instances.find((m) => m.id === 'sharingan_2')?.state === ModeRuntimeState.ON,
    metrics: {
      baseDamage: baseDmg,
      enhancedDamage: enhDmg,
      apCost: ap,
      chakraCost: fireball.chakraCost,
      burnTotal,
      dmgPerApBase: ap > 0 ? baseDmg / ap : 0,
      dmgPerApEnhanced: ap > 0 ? enhDmg / ap : 0,
    },
  };
}

export function printFireballProbe(probe: FireballProbe): void {
  const m = probe.metrics;
  console.log('\n── T-032 Great Fireball probe ──');
  console.log(`  authoring 17 + 2T:  ${probe.authoring}`);
  console.log(`  base no Mode:       ${probe.baseNoMode}`);
  console.log(`  2T +50% + 1 charge: ${probe.sharinganEnhance}`);
  console.log('  ── balance vs legacy 15/AP2/Burn 15×3@80% ──');
  console.log(`  base dmg:           ${m.baseDamage}  (was 15)`);
  console.log(`  2T enhanced dmg:    ${m.enhancedDamage}  (was none / 15)`);
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (was 2 / 6)`);
  console.log(`  burn package:       ${m.burnTotal}  (was expected 36)`);
  console.log(`  dmg/AP base:        ${m.dmgPerApBase.toFixed(2)}  (was 7.50)`);
  console.log(`  dmg/AP enhanced:    ${m.dmgPerApEnhanced.toFixed(2)}  (was n/a)`);
}
