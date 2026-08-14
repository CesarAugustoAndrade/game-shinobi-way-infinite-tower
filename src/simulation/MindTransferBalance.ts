/**
 * T-036 probe — Mind Transfer authoring; success enemy Stun 2; fail self-Stun 1.
 */

import { CardRole, CombatRange, EffectType } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface MindTransferProbe {
  authoring: boolean;
  successStun: boolean;
  failSelfStun: boolean;
  /** Live resolve numbers (legacy authoring was unwired 0 dmg / no resolve stun). */
  metrics: {
    successDamage: number;
    failDamage: number;
    apCost: number;
    chakraCost: number;
    chance: number;
    enemyStunDuration: number;
    failSelfDuration: number;
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

export function runMindTransferProbe(): MindTransferProbe {
  const transfer = SKILLS.MIND_TRANSFER;
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [transfer],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 50,
  });
  const win = resolveSkill({ skill: transfer }, state(), { rng: () => 0 });
  const lose = resolveSkill({ skill: transfer }, state(), { rng: () => 0.99 });
  return {
    authoring:
      transfer.cardRole === CardRole.SUPPORT &&
      transfer.apCost === 2 &&
      transfer.chakraCost === 7 &&
      transfer.cooldown === 6 &&
      transfer.baseDamage === 0 &&
      transfer.controlStun?.chance === 0.7 &&
      transfer.controlStun.enemyDuration === 2 &&
      transfer.controlStun.failSelfDuration === 1,
    successStun:
      win.ok &&
      win.damageDealt === 0 &&
      win.state.enemyHp === 50 &&
      hasStun(win.state.enemyBuffs, 2) &&
      !hasStun(win.state.playerBuffs, 1),
    failSelfStun:
      lose.ok &&
      lose.damageDealt === 0 &&
      hasStun(lose.state.playerBuffs, 1) &&
      !hasStun(lose.state.enemyBuffs, 2),
    metrics: {
      successDamage: win.ok ? win.damageDealt : -1,
      failDamage: lose.ok ? lose.damageDealt : -1,
      apCost: transfer.apCost ?? 0,
      chakraCost: transfer.chakraCost,
      chance: transfer.controlStun?.chance ?? 0,
      enemyStunDuration: transfer.controlStun?.enemyDuration ?? 0,
      failSelfDuration: transfer.controlStun?.failSelfDuration ?? 0,
    },
  };
}

export function printMindTransferProbe(probe: MindTransferProbe): void {
  const m = probe.metrics;
  console.log('\n── T-036 Mind Transfer probe ──');
  console.log(`  authoring SUPPORT:  ${probe.authoring}`);
  console.log(`  success Stun 2:     ${probe.successStun}`);
  console.log(`  fail self-Stun 1:   ${probe.failSelfStun}`);
  console.log('  ── balance vs unwired legacy (0 resolve stun) ──');
  console.log(`  success/fail dmg:   ${m.successDamage} / ${m.failDamage}  (must be 0)`);
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (unchanged 2 / 7)`);
  console.log(`  stun chance:        ${m.chance}  (was packaging-only 0.7)`);
  console.log(`  enemy / fail stun:  ${m.enemyStunDuration} / ${m.failSelfDuration}`);
}
