/**
 * T-112 probe — Tsukuyomi ATTACK 30 MENTAL; Sharingan consume-all close; Stun 2 on hit.
 */

import { CardRole, CombatRange, DamageType, EffectType, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface TsukuyomiProbe {
  authoring: boolean;
  hitClose: boolean;
  requireOn: boolean;
  metrics: {
    baseDamage: number;
    apCost: number;
    chakraCost: number;
    hpCost: number;
    hpAfter: number;
    stunDuration: number;
    lotusClose: boolean;
    dmgPerAp: number;
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

export function runTsukuyomiProbe(): TsukuyomiProbe {
  const illusion = SKILLS.TSUKUYOMI;
  const lotus = SKILLS.HIDDEN_LOTUS;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [illusion],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const sharinganOn = (id: 'sharingan_2' | 'sharingan_3', charges: number) => ({
    instances: [{ id, family: MODE_FAMILY.SHARINGAN, charges, state: ModeRuntimeState.ON }],
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: illusion.baseDamage }), rng: () => 0 };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }), rng: () => 0 };
  const off = resolveSkill({ skill: illusion }, state(), hit);
  const landed = resolveSkill({ skill: illusion }, state({ modes: sharinganOn('sharingan_2', 3) }), hit);
  const three = resolveSkill({ skill: illusion }, state({ modes: sharinganOn('sharingan_3', 2) }), hit);
  const whiff = resolveSkill({ skill: illusion }, state({ modes: sharinganOn('sharingan_2', 2) }), miss);
  const ap = illusion.apCost ?? 0;
  const dmg = landed.ok ? landed.damageDealt : 0;
  return {
    authoring:
      illusion.cardRole === CardRole.ATTACK &&
      illusion.apCost === 5 &&
      illusion.chakraCost === 13 &&
      illusion.hpCost === 15 &&
      illusion.cooldown === 6 &&
      illusion.baseDamage === 30 &&
      illusion.damageType === DamageType.MENTAL &&
      illusion.modeInteraction?.requireOn === true &&
      illusion.modeInteraction.requireFamily === MODE_FAMILY.SHARINGAN &&
      illusion.modeInteraction.consumeAllCharges === true &&
      illusion.impactStun?.chance === 1 &&
      illusion.impactStun.duration === 2 &&
      illusion.effects?.some((e) => e.type === EffectType.STUN && e.duration === 1) !== true,
    hitClose:
      landed.ok === true &&
      dmg === 30 &&
      landed.state.pools.hp === 25 &&
      hasStun(landed.state.enemyBuffs, 2) &&
      landed.state.modes.instances.find((m) => m.id === 'sharingan_2')?.state ===
        ModeRuntimeState.COOLDOWN &&
      three.ok === true &&
      three.state.modes.instances.find((m) => m.id === 'sharingan_3')?.state ===
        ModeRuntimeState.COOLDOWN &&
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      !hasStun(whiff.state.enemyBuffs, 2) &&
      whiff.state.modes.instances.find((m) => m.id === 'sharingan_2')?.state ===
        ModeRuntimeState.COOLDOWN,
    requireOn: off.ok === false && off.reason === 'mode-required' && off.state.pools.hp === 40,
    metrics: {
      baseDamage: dmg,
      apCost: ap,
      chakraCost: illusion.chakraCost,
      hpCost: illusion.hpCost ?? 0,
      hpAfter: landed.ok ? landed.state.pools.hp : 0,
      stunDuration: illusion.impactStun?.duration ?? 0,
      lotusClose: lotus.modeInteraction?.consumeAllCharges === true,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
    },
  };
}

export function printTsukuyomiProbe(probe: TsukuyomiProbe): void {
  const m = probe.metrics;
  console.log('\n── T-112 Tsukuyomi probe ──');
  console.log(`  authoring ATTACK 30 MENTAL + consume-all + Stun 2: ${probe.authoring}`);
  console.log(`  hit 30 + Stun 2 + Mode COOLDOWN / miss no Stun:    ${probe.hitClose}`);
  console.log(`  require Sharingan ON else consume nothing:         ${probe.requireOn}`);
  console.log('  ── balance vs mute 15 TRUE/AP2/Stun 1 and Lotus consume-all ──');
  console.log(`  dmg / AP:           ${m.baseDamage} / ${m.apCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was 15 / 2 = 7.50)`);
  console.log(`  CP / HP / CD:       ${m.chakraCost} / ${m.hpCost} / 6  (HP after ${m.hpAfter})`);
  console.log(`  stun duration:      ${m.stunDuration}  (was mute 1; hit-gated)`);
  console.log(`  lotus sibling close:${m.lotusClose}`);
}
