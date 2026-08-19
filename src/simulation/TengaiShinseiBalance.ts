/**
 * T-121 probe — Tengai Shinsei ATTACK 35 LONG; Stun 1; PUSH 2 to LONG; no Mode.
 */

import { CardRole, CombatRange, DamageType, EffectType } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface TengaiShinseiProbe {
  authoring: boolean;
  hit: boolean;
  forceLong: boolean;
  metrics: {
    legacyDmg: number;
    legacyAp: number;
    baseDamage: number;
    apCost: number;
    chakraCost: number;
    shinraDmg: number;
    shinraAp: number;
    dmgPerAp: number;
    dmgPerApLegacy: number;
  };
}

function hasStun(
  buffs: { effect: { type: EffectType }; duration: number }[] | undefined,
): boolean {
  return (buffs ?? []).some((buff) => buff.effect.type === EffectType.STUN && buff.duration === 1);
}

export function runTengaiShinseiProbe(): TengaiShinseiProbe {
  const meteor = SKILLS.TENGAI_SHINSEI;
  const shinra = SKILLS.SHINRA_TENSEI;
  const closer = {
    ...meteor,
    allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
  };
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 8, chakra: 30, hp: 40, maxHp: 40 },
    range: CombatRange.LONG,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [meteor],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: true,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: meteor.baseDamage }), rng: () => 0 };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }), rng: () => 0 };
  const atLong = resolveSkill({ skill: meteor }, state(), hit);
  const closeReject = resolveSkill({ skill: meteor }, state({ range: CombatRange.CLOSE }), hit);
  const whiff = resolveSkill({ skill: meteor }, state(), miss);
  const fromClose = resolveSkill(
    { skill: closer },
    state({ range: CombatRange.CLOSE, skills: [closer] }),
    hit,
  );
  const fromMid = resolveSkill(
    { skill: closer },
    state({ range: CombatRange.MEDIUM, skills: [closer] }),
    hit,
  );
  const ap = meteor.apCost ?? 0;
  const dmg = atLong.ok ? atLong.damageDealt : 0;
  return {
    authoring:
      meteor.cardRole === CardRole.ATTACK &&
      meteor.apCost === 6 &&
      meteor.chakraCost === 27 &&
      meteor.cooldown === 8 &&
      meteor.baseDamage === 35 &&
      meteor.damageType === DamageType.ELEMENTAL &&
      meteor.allowedRanges?.length === 1 &&
      meteor.allowedRanges[0] === CombatRange.LONG &&
      meteor.bandMove?.kind === 'PUSH' &&
      meteor.bandMove.steps === 2 &&
      meteor.bandMove.requireHit === true &&
      meteor.impactStun?.chance === 1 &&
      meteor.impactStun.duration === 1 &&
      meteor.modeInteraction === undefined,
    hit:
      atLong.ok === true &&
      dmg === 35 &&
      atLong.state.range === CombatRange.LONG &&
      hasStun(atLong.state.enemyBuffs) &&
      closeReject.ok === false &&
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      hasStun(whiff.state.enemyBuffs) === false,
    forceLong:
      fromClose.ok === true &&
      fromClose.state.range === CombatRange.LONG &&
      fromMid.ok === true &&
      fromMid.state.range === CombatRange.LONG &&
      atLong.ok === true &&
      atLong.state.range === CombatRange.LONG,
    metrics: {
      legacyDmg: 27,
      legacyAp: 2,
      baseDamage: dmg,
      apCost: ap,
      chakraCost: meteor.chakraCost ?? 0,
      shinraDmg: shinra.baseDamage,
      shinraAp: shinra.apCost ?? 0,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
      dmgPerApLegacy: 27 / 2,
    },
  };
}

export function printTengaiShinseiProbe(probe: TengaiShinseiProbe): void {
  const m = probe.metrics;
  console.log('\n── T-121 Tengai Shinsei probe ──');
  console.log(`  authoring ATTACK 35 LONG AP6/CP27/CD8 Stun1 PUSH2: ${probe.authoring}`);
  console.log(`  hit 35 + Stun 1; CLOSE reject; miss no Stun:       ${probe.hit}`);
  console.log(`  fixture CLOSE/MEDIUM → LONG; LONG stays LONG:      ${probe.forceLong}`);
  console.log('  ── balance vs mute TRUE 27/AP2 and Shinra 23/AP4 PUSH1 70% Stun ──');
  console.log(
    `  package:     ${m.baseDamage} / AP${m.apCost} CP${m.chakraCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was ${m.legacyDmg}/AP${m.legacyAp} TRUE = ${m.dmgPerApLegacy.toFixed(2)})`,
  );
  console.log(`  Shinra sibling: ${m.shinraDmg}/AP${m.shinraAp}=${(m.shinraDmg / m.shinraAp).toFixed(2)} ANY + 70% Stun`);
}
