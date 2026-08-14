/**
 * T-040 probe — Gate Prep SUPPORT authoring; arm +3 weights + HP discount; reject low HP.
 */

import { CardRole, CombatRange } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface GatePrepSupportProbe {
  authoring: boolean;
  armBoth: boolean;
  rejectHp: boolean;
  metrics: {
    apCost: number;
    hpCost: number;
    hpPaid: number;
    weightDelta: number;
    discountArmed: boolean;
  };
}

export function runGatePrepSupportProbe(): GatePrepSupportProbe {
  const prep = SKILLS.GATE_PREP;
  const state = (hp: number): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [prep],
    playerBuffs: [],
    enemyHp: 50,
    pendingSupportWeights: [],
  });
  const ok = resolveSkill({ skill: prep }, state(40));
  const low = resolveSkill({ skill: prep }, state(10));
  const bag = ok.ok ? ok.state.pendingSupportWeights ?? [] : [];
  const life = bag.find((e) => e.skillId === 'gate_of_life')?.delta ?? 0;
  const limit = bag.find((e) => e.skillId === 'gate_of_limit')?.delta ?? 0;
  return {
    authoring:
      prep.cardRole === CardRole.SUPPORT &&
      prep.apCost === 1 &&
      prep.hpCost === 15 &&
      prep.chakraCost === 0 &&
      prep.cooldown === 5 &&
      prep.baseDamage === 0,
    armBoth:
      ok.ok &&
      ok.damageDealt === 0 &&
      40 - ok.state.pools.hp === 15 &&
      ok.state.pendingGateHpDiscount === true &&
      life === 3 &&
      limit === 3,
    rejectHp: !low.ok && low.reason === 'hp' && !low.state.pendingGateHpDiscount,
    metrics: {
      apCost: prep.apCost ?? 0,
      hpCost: prep.hpCost,
      hpPaid: ok.ok ? 40 - ok.state.pools.hp : 0,
      weightDelta: life,
      discountArmed: ok.ok === true && ok.state.pendingGateHpDiscount === true,
    },
  };
}

export function printGatePrepSupportProbe(probe: GatePrepSupportProbe): void {
  const m = probe.metrics;
  console.log('\n── T-040 Gate Prep SUPPORT probe ──');
  console.log(`  authoring SUPPORT:  ${probe.authoring}`);
  console.log(`  arm +3 + discount:  ${probe.armBoth}`);
  console.log(`  reject low HP:      ${probe.rejectHp}`);
  console.log('  ── balance vs unwired WIL +50% (motors existed, play did not) ──');
  console.log(`  AP / HP paid:       ${m.apCost} / ${m.hpPaid}  (catalog 1 / 15)`);
  console.log(`  Gate weight Δ:      ${m.weightDelta}  (T-016 +3)`);
  console.log(`  discount armed:     ${m.discountArmed}  (T-017)`);
}
