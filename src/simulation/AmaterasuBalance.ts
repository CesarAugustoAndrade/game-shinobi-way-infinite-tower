/**
 * T-113 probe — Amaterasu ATTACK 20; Sharingan consume 2; TRUE Burn 8×4 on hit.
 */

import {
  CardRole,
  CombatRange,
  DamageType,
  EffectType,
  MarkFamily,
  ModeRuntimeState,
} from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface AmaterasuProbe {
  authoring: boolean;
  hit: boolean;
  requireOn: boolean;
  metrics: {
    baseDamage: number;
    apCost: number;
    chakraCost: number;
    hpCost: number;
    hpAfter: number;
    chargesAfter3: number;
    burnStacks: number;
    burnDur: number;
    toadDmgPerAp: number;
    dmgPerAp: number;
  };
}

export function runAmaterasuProbe(): AmaterasuProbe {
  const flame = SKILLS.AMATERASU;
  const tsukuyomi = SKILLS.TSUKUYOMI;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [flame],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const sharinganOn = (id: 'sharingan_2' | 'sharingan_3', charges: number) => ({
    instances: [{ id, family: MODE_FAMILY.SHARINGAN, charges, state: ModeRuntimeState.ON }],
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: flame.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const off = resolveSkill({ skill: flame }, state(), hit);
  const short = resolveSkill({ skill: flame }, state({ modes: sharinganOn('sharingan_2', 1) }), hit);
  const landed = resolveSkill({ skill: flame }, state({ modes: sharinganOn('sharingan_2', 3) }), hit);
  const whiff = resolveSkill({ skill: flame }, state({ modes: sharinganOn('sharingan_2', 3) }), miss);
  const ap = flame.apCost ?? 0;
  const dmg = landed.ok ? landed.damageDealt : 0;
  const burn = landed.ok ? landed.state.marks.find((m) => m.id === 'burn') : undefined;
  return {
    authoring:
      flame.cardRole === CardRole.ATTACK &&
      flame.apCost === 5 &&
      flame.chakraCost === 13 &&
      flame.hpCost === 20 &&
      flame.cooldown === 5 &&
      flame.baseDamage === 20 &&
      flame.modeInteraction?.requireOn === true &&
      flame.modeInteraction.requireFamily === MODE_FAMILY.SHARINGAN &&
      flame.modeInteraction.consumeCharges === 2 &&
      flame.markEffects?.some(
        (m) =>
          m.id === 'burn' &&
          m.stacks === 8 &&
          m.duration === 4 &&
          m.family === MarkFamily.DOT &&
          m.requireHit === true,
      ) === true &&
      flame.effects?.some(
        (e) =>
          e.type === EffectType.BURN &&
          e.value === 8 &&
          e.duration === 4 &&
          e.damageType === DamageType.TRUE,
      ) === true &&
      flame.effects?.some((e) => e.type === EffectType.BURN && e.value === 50) !== true,
    hit:
      landed.ok === true &&
      dmg === 20 &&
      landed.state.pools.hp === 20 &&
      burn?.stacks === 8 &&
      burn.duration === 4 &&
      landed.state.modes.instances.find((m) => m.id === 'sharingan_2')?.charges === 1 &&
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      !whiff.state.marks.some((m) => m.id === 'burn') &&
      whiff.state.modes.instances.find((m) => m.id === 'sharingan_2')?.charges === 1,
    requireOn:
      off.ok === false &&
      off.reason === 'mode-required' &&
      off.state.pools.hp === 40 &&
      short.ok === false &&
      short.reason === 'mode-required' &&
      short.state.modes.instances.find((m) => m.id === 'sharingan_2')?.charges === 1,
    metrics: {
      baseDamage: dmg,
      apCost: ap,
      chakraCost: flame.chakraCost,
      hpCost: flame.hpCost ?? 0,
      hpAfter: landed.ok ? landed.state.pools.hp : 0,
      chargesAfter3: landed.ok
        ? (landed.state.modes.instances.find((m) => m.id === 'sharingan_2')?.charges ?? -1)
        : -1,
      burnStacks: burn?.stacks ?? 0,
      burnDur: burn?.duration ?? 0,
      toadDmgPerAp: tsukuyomi.apCost ? tsukuyomi.baseDamage / tsukuyomi.apCost : 0,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
    },
  };
}

export function printAmaterasuProbe(probe: AmaterasuProbe): void {
  const m = probe.metrics;
  console.log('\n── T-113 Amaterasu probe ──');
  console.log(`  authoring ATTACK 20 + consume 2 + Burn 8×4 TRUE: ${probe.authoring}`);
  console.log(`  hit 20 + HP−20 + charges 3→1 / miss no Burn:     ${probe.hit}`);
  console.log(`  require ON / <2 charges consume nothing:         ${probe.requireOn}`);
  console.log('  ── balance vs mute 13 PIERCING/AP2/Burn 50×5 and Tsukuyomi consume-all ──');
  console.log(`  dmg / AP:           ${m.baseDamage} / ${m.apCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was 13 / 2 = 6.50)`);
  console.log(`  CP / HP / CD:       ${m.chakraCost} / ${m.hpCost} / 5  (HP after ${m.hpAfter})`);
  console.log(`  live burn:          ${m.burnStacks}×${m.burnDur}  (was mute TRUE 50×5)`);
  console.log(`  charges after 3:    ${m.chargesAfter3}  (spend 2, Mode stays ON)`);
  console.log(`  tsukuyomi dmg/AP:   ${m.toadDmgPerAp.toFixed(2)}  (sibling consume-all closer)`);
}
