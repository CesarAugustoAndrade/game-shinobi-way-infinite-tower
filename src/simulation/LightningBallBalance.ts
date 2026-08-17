/**
 * T-090 probe — Lightning Ball authoring; base 15; 3T +40% + 1 charge; 45% Stun 1.
 */

import { CardRole, CombatRange, EffectType, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface LightningBallProbe {
  authoring: boolean;
  baseNoMode: boolean;
  sharinganEnhance: boolean;
  metrics: {
    baseDamage: number;
    enhancedDamage: number;
    apCost: number;
    chakraCost: number;
    stunChance: number;
    streamStunChance: number;
    dmgPerApBase: number;
    dmgPerApEnhanced: number;
  };
}

export function runLightningBallProbe(): LightningBallProbe {
  const ball = SKILLS.LIGHTNING_BALL;
  const stream = SKILLS.CHIDORI_STREAM;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [ball],
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
  const hit = { rollHit: () => ({ hit: true as const, damage: ball.baseDamage }) };
  const off = resolveSkill({ skill: ball }, state(), hit);
  const on = resolveSkill({ skill: ball }, state({ modes: sharingan3 }), hit);
  const stunChance = ball.impactStun?.chance ?? 0;
  const streamStun =
    stream.impactStun?.chance ??
    stream.effects?.find((e) => e.type === EffectType.STUN)?.chance ??
    0;
  const baseDmg = off.ok ? off.damageDealt : 0;
  const enhDmg = on.ok ? on.damageDealt : 0;
  const ap = ball.apCost ?? 0;
  return {
    authoring:
      ball.cardRole === CardRole.ATTACK &&
      ball.apCost === 2 &&
      ball.chakraCost === 5 &&
      ball.cooldown === 3 &&
      ball.baseDamage === 15 &&
      (ball.allowedRanges ?? []).includes(CombatRange.MEDIUM) &&
      (ball.allowedRanges ?? []).includes(CombatRange.LONG) &&
      ball.modeInteraction?.modeId === 'sharingan_3' &&
      ball.modeInteraction.consumeCharges === 1 &&
      ball.modeInteraction.damageMultBonus === 0.4 &&
      !ball.modeInteraction.requireOn &&
      !ball.modeInteraction.grantRanges &&
      ball.impactStun?.chance === 0.45 &&
      ball.impactStun.duration === 1,
    baseNoMode: off.ok === true && off.damageDealt === 15 && off.state.modes.instances.length === 0,
    sharinganEnhance:
      on.ok === true &&
      on.damageDealt === Math.floor(15 * 1.4) &&
      on.state.modes.instances.find((m) => m.id === 'sharingan_3')?.charges === 2 &&
      on.state.modes.instances.find((m) => m.id === 'sharingan_3')?.state === ModeRuntimeState.ON,
    metrics: {
      baseDamage: baseDmg,
      enhancedDamage: enhDmg,
      apCost: ap,
      chakraCost: ball.chakraCost,
      stunChance,
      streamStunChance: streamStun,
      dmgPerApBase: ap > 0 ? baseDmg / ap : 0,
      dmgPerApEnhanced: ap > 0 ? enhDmg / ap : 0,
    },
  };
}

export function printLightningBallProbe(probe: LightningBallProbe): void {
  const m = probe.metrics;
  console.log('\n── T-090 Lightning Ball probe ──');
  console.log(`  authoring 15 + 45% Stun 1: ${probe.authoring}`);
  console.log(`  base no Mode:              ${probe.baseNoMode}`);
  console.log(`  3T +40% + 1 charge:        ${probe.sharinganEnhance}`);
  console.log('  ── balance vs legacy 15/AP2/Stun 40% and Chidori Stream 60% ──');
  console.log(`  base / 3T dmg:             ${m.baseDamage} / ${m.enhancedDamage}  (was 15 / no Mode)`);
  console.log(`  AP / CP:                   ${m.apCost} / ${m.chakraCost}  (was 2 / 5)`);
  console.log(`  stun chance:               ${m.stunChance}  (was 0.4; Stream ${m.streamStunChance})`);
  console.log(`  dmg/AP base / 3T:          ${m.dmgPerApBase.toFixed(2)} / ${m.dmgPerApEnhanced.toFixed(2)}  (was 7.50 / n/a)`);
}
