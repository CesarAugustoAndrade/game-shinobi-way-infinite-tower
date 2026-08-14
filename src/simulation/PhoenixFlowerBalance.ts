/**
 * T-033 probe — Phoenix Flower authoring; 3-hit base; Sharingan 2T +40% + 1 charge.
 */

import { CardRole, CombatRange, EffectType, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface PhoenixFlowerProbe {
  authoring: boolean;
  baseMulti: boolean;
  sharinganEnhance: boolean;
  /** Live resolve numbers (legacy authoring was 14 / AP1 / Burn 10×2@50%). */
  metrics: {
    hitsLanded: number;
    baseDamage: number;
    enhancedDamage: number;
    apCost: number;
    chakraCost: number;
    burnTotal: number;
    dmgPerApBase: number;
    dmgPerApEnhanced: number;
  };
}

export function runPhoenixFlowerProbe(): PhoenixFlowerProbe {
  const phoenix = SKILLS.PHOENIX_FLOWER;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [phoenix],
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
  const hit = { rollHit: () => ({ hit: true as const, damage: phoenix.baseDamage }) };
  const off = resolveSkill({ skill: phoenix }, state(), hit);
  const on = resolveSkill({ skill: phoenix }, state({ modes: sharingan2 }), hit);
  const burn = phoenix.effects?.find((e) => e.type === EffectType.BURN);
  const burnTotal = (burn?.value ?? 0) * (burn?.duration ?? 0);
  const baseDmg = off.ok ? off.damageDealt : 0;
  const enhDmg = on.ok ? on.damageDealt : 0;
  const ap = phoenix.apCost ?? 0;
  return {
    authoring:
      phoenix.cardRole === CardRole.ATTACK &&
      phoenix.hitCount === 3 &&
      phoenix.baseDamage === 5 &&
      phoenix.apCost === 2 &&
      phoenix.chakraCost === 5 &&
      phoenix.cooldown === 2 &&
      (phoenix.allowedRanges ?? []).includes(CombatRange.MEDIUM) &&
      (phoenix.allowedRanges ?? []).includes(CombatRange.LONG) &&
      phoenix.modeInteraction?.modeId === 'sharingan_2' &&
      phoenix.modeInteraction.consumeCharges === 1 &&
      phoenix.modeInteraction.damageMultBonus === 0.4 &&
      !phoenix.modeInteraction.requireOn,
    baseMulti:
      off.ok &&
      off.hitsLanded === 3 &&
      off.damageDealt === 15 &&
      off.state.modes.instances.length === 0,
    sharinganEnhance:
      on.ok &&
      on.damageDealt === Math.floor(15 * 1.4) &&
      on.state.modes.instances.find((m) => m.id === 'sharingan_2')?.charges === 2 &&
      on.state.modes.instances.find((m) => m.id === 'sharingan_2')?.state === ModeRuntimeState.ON,
    metrics: {
      hitsLanded: off.ok ? off.hitsLanded : 0,
      baseDamage: baseDmg,
      enhancedDamage: enhDmg,
      apCost: ap,
      chakraCost: phoenix.chakraCost,
      burnTotal,
      dmgPerApBase: ap > 0 ? baseDmg / ap : 0,
      dmgPerApEnhanced: ap > 0 ? enhDmg / ap : 0,
    },
  };
}

export function printPhoenixFlowerProbe(probe: PhoenixFlowerProbe): void {
  const m = probe.metrics;
  console.log('\n── T-033 Phoenix Flower probe ──');
  console.log(`  authoring 3×5 + 2T: ${probe.authoring}`);
  console.log(`  base 3-hit no Mode: ${probe.baseMulti}`);
  console.log(`  2T +40% + 1 charge: ${probe.sharinganEnhance}`);
  console.log('  ── balance vs legacy 14/AP1/Burn 10×2@50% ──');
  console.log(`  hits landed:        ${m.hitsLanded}  (was 1)`);
  console.log(`  base dmg:           ${m.baseDamage}  (was 14)`);
  console.log(`  2T enhanced dmg:    ${m.enhancedDamage}  (was none / 14)`);
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (was 1 / 5)`);
  console.log(`  burn package:       ${m.burnTotal}  (was expected 10)`);
  console.log(`  dmg/AP base:        ${m.dmgPerApBase.toFixed(2)}  (was 14.00)`);
  console.log(`  dmg/AP enhanced:    ${m.dmgPerApEnhanced.toFixed(2)}  (was n/a)`);
}
