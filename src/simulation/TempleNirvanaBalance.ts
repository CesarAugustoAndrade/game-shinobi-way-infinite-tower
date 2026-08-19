/**
 * T-111 probe — Temple of Nirvana SUPPORT 80% Stun 2; vs mute 100% Stun and Killing Intent 80%×1.
 */

import { CardRole, CombatRange, EffectType } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface TempleNirvanaProbe {
  authoring: boolean;
  stunHit: boolean;
  stunMiss: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    chance: number;
    stunDuration: number;
    failSelf: number;
    intentChance: number;
    intentDuration: number;
    mindChance: number;
    mindDuration: number;
    leftoverStun1: boolean;
    successDamage: number;
    failDamage: number;
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

export function runTempleNirvanaProbe(): TempleNirvanaProbe {
  const temple = SKILLS.TEMPLE_NIRVANA;
  const intent = SKILLS.KILLING_INTENT;
  const transfer = SKILLS.MIND_TRANSFER;
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [temple],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
  });
  const win = resolveSkill({ skill: temple }, state(), { rng: () => 0 });
  const lose = resolveSkill({ skill: temple }, state(), { rng: () => 0.99 });
  return {
    authoring:
      temple.cardRole === CardRole.SUPPORT &&
      temple.apCost === 3 &&
      temple.chakraCost === 8 &&
      temple.cooldown === 6 &&
      temple.baseDamage === 0 &&
      temple.controlStun?.chance === 0.8 &&
      temple.controlStun.enemyDuration === 2 &&
      temple.controlStun.failSelfDuration === undefined &&
      !temple.effects?.some((e) => e.type === EffectType.STUN && e.chance === 1),
    stunHit:
      win.ok === true &&
      win.damageDealt === 0 &&
      hasStun(win.state.enemyBuffs, 2) &&
      !hasStun(win.state.playerBuffs, 2),
    stunMiss:
      lose.ok === true &&
      lose.damageDealt === 0 &&
      !hasStun(lose.state.enemyBuffs, 2) &&
      !hasStun(lose.state.playerBuffs, 2),
    metrics: {
      apCost: temple.apCost ?? 0,
      chakraCost: temple.chakraCost,
      chance: temple.controlStun?.chance ?? 0,
      stunDuration: temple.controlStun?.enemyDuration ?? 0,
      failSelf: temple.controlStun?.failSelfDuration ?? 0,
      intentChance: intent.controlStun?.chance ?? 0,
      intentDuration: intent.controlStun?.enemyDuration ?? 0,
      mindChance: transfer.controlStun?.chance ?? 0,
      mindDuration: transfer.controlStun?.enemyDuration ?? 0,
      leftoverStun1: temple.effects?.some((e) => e.type === EffectType.STUN && e.chance === 1) === true,
      successDamage: win.ok ? win.damageDealt : -1,
      failDamage: lose.ok ? lose.damageDealt : -1,
      dmgPerAp: 0,
    },
  };
}

export function printTempleNirvanaProbe(probe: TempleNirvanaProbe): void {
  const m = probe.metrics;
  console.log('\n── T-111 Temple of Nirvana probe ──');
  console.log(`  authoring SUPPORT 80% Stun 2 AP3/CP8: ${probe.authoring}`);
  console.log(`  success Stun 2 / 0 dmg:               ${probe.stunHit}`);
  console.log(`  fail no stun / 0 dmg:                 ${probe.stunMiss}`);
  console.log('  ── balance vs mute 100% Stun×2 AP2 and Intent 80%×1 / Mind 70%×2 ──');
  console.log(`  AP / CP / CD:       ${m.apCost} / ${m.chakraCost} / 6  (was 2 / 8 / 6)`);
  console.log(`  stun chance×dur:    ${m.chance}×${m.stunDuration}  (was mute 1.0×2; Intent ${m.intentChance}×${m.intentDuration}; Mind ${m.mindChance}×${m.mindDuration})`);
  console.log(`  failSelf:           ${m.failSelf}  (none; Mind has 1)`);
  console.log(`  leftover 100% STUN: ${m.leftoverStun1}`);
  console.log(`  dmg success/fail:   ${m.successDamage} / ${m.failDamage}`);
}
