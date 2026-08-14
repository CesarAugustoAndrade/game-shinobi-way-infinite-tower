/**
 * T-034 probe — Chidori Stream authoring; base without Mode; Sharingan 3T +40% + 1 charge.
 */

import { CardRole, CombatRange, EffectType, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface ChidoriStreamProbe {
  authoring: boolean;
  baseNoMode: boolean;
  sharinganEnhance: boolean;
  /** Live resolve numbers (legacy authoring was 18 / AP2 / Stun 80%). */
  metrics: {
    baseDamage: number;
    enhancedDamage: number;
    apCost: number;
    chakraCost: number;
    stunChance: number;
    dmgPerApBase: number;
    dmgPerApEnhanced: number;
  };
}

export function runChidoriStreamProbe(): ChidoriStreamProbe {
  const stream = SKILLS.CHIDORI_STREAM;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [stream],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const sharingan3 = {
    instances: [
      {
        id: 'sharingan_3',
        family: MODE_FAMILY.SHARINGAN,
        charges: 3,
        state: ModeRuntimeState.ON,
      },
    ],
  };
  const hit = { rollHit: () => ({ hit: true as const, damage: stream.baseDamage }) };
  const off = resolveSkill({ skill: stream }, state(), hit);
  const on = resolveSkill({ skill: stream }, state({ modes: sharingan3 }), hit);
  const stun = stream.effects?.find((e) => e.type === EffectType.STUN);
  const baseDmg = off.ok ? off.damageDealt : 0;
  const enhDmg = on.ok ? on.damageDealt : 0;
  const ap = stream.apCost ?? 0;
  return {
    authoring:
      stream.cardRole === CardRole.ATTACK &&
      stream.apCost === 4 &&
      stream.chakraCost === 7 &&
      stream.cooldown === 4 &&
      stream.baseDamage === 18 &&
      (stream.allowedRanges ?? []).includes(CombatRange.CLOSE) &&
      stream.modeInteraction?.modeId === 'sharingan_3' &&
      stream.modeInteraction.consumeCharges === 1 &&
      stream.modeInteraction.damageMultBonus === 0.4 &&
      !stream.modeInteraction.requireOn &&
      stun?.chance === 0.6 &&
      stun.duration === 1,
    baseNoMode: off.ok && off.damageDealt === 18 && off.state.modes.instances.length === 0,
    sharinganEnhance:
      on.ok &&
      on.damageDealt === Math.floor(18 * 1.4) &&
      on.state.modes.instances.find((m) => m.id === 'sharingan_3')?.charges === 2 &&
      on.state.modes.instances.find((m) => m.id === 'sharingan_3')?.state === ModeRuntimeState.ON,
    metrics: {
      baseDamage: baseDmg,
      enhancedDamage: enhDmg,
      apCost: ap,
      chakraCost: stream.chakraCost,
      stunChance: stun?.chance ?? 0,
      dmgPerApBase: ap > 0 ? baseDmg / ap : 0,
      dmgPerApEnhanced: ap > 0 ? enhDmg / ap : 0,
    },
  };
}

export function printChidoriStreamProbe(probe: ChidoriStreamProbe): void {
  const m = probe.metrics;
  console.log('\n── T-034 Chidori Stream probe ──');
  console.log(`  authoring 18 + 3T:  ${probe.authoring}`);
  console.log(`  base no Mode:       ${probe.baseNoMode}`);
  console.log(`  3T +40% + 1 charge: ${probe.sharinganEnhance}`);
  console.log('  ── balance vs legacy 18/AP2/Stun 80% ──');
  console.log(`  base dmg:           ${m.baseDamage}  (was 18)`);
  console.log(`  3T enhanced dmg:    ${m.enhancedDamage}  (was none / 18)`);
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (was 2 / 7)`);
  console.log(`  stun chance:        ${m.stunChance}  (was 0.8)`);
  console.log(`  dmg/AP base:        ${m.dmgPerApBase.toFixed(2)}  (was 9.00)`);
  console.log(`  dmg/AP enhanced:    ${m.dmgPerApEnhanced.toFixed(2)}  (was n/a)`);
}
