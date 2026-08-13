/**
 * T-016 probe — Drill Main +2 one-shot; Gate Prep +3; no Main no-op.
 */

import { Posture } from '../game/types';
import { effectiveWeight } from '../game/systems/DeckSystem';
import {
  applySupportWeightOnPlay,
  consumeSupportWeightBonuses,
  enqueueSupportWeightBonuses,
} from '../game/systems/SupportWeightSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface SupportNextDrawProbe {
  drillMainPlus2: boolean;
  secondConsumeEmpty: boolean;
  weightPlusTwo: boolean;
  gatePrepPlus3: boolean;
  noMainEmpty: boolean;
}

export function runSupportNextDrawProbe(): SupportNextDrawProbe {
  const drill = { id: 'chakra_control_drill' };
  const first = consumeSupportWeightBonuses(
    enqueueSupportWeightBonuses([], applySupportWeightOnPlay(drill, { mainAttackId: 'rasengan' })),
  );
  const second = consumeSupportWeightBonuses(first.bag);
  const rasengan = createMockSkill({ id: 'rasengan', currentCooldown: 0 });
  const ctx = { posture: Posture.BALANCED };
  const base = effectiveWeight(rasengan, { ...ctx, supportBonuses: {} });
  const boosted = effectiveWeight(rasengan, { ...ctx, supportBonuses: first.bonuses });
  const gate = consumeSupportWeightBonuses(
    enqueueSupportWeightBonuses([], applySupportWeightOnPlay({ id: 'gate_prep' })),
  );
  return {
    drillMainPlus2: first.bonuses.rasengan === 2,
    secondConsumeEmpty: second.bonuses.rasengan === undefined,
    weightPlusTwo: boosted === base + 2,
    gatePrepPlus3: gate.bonuses.gate_of_life === 3 && gate.bonuses.gate_of_limit === 3,
    noMainEmpty: applySupportWeightOnPlay(drill, { mainAttackId: null }).length === 0,
  };
}

export function printSupportNextDrawProbe(probe: SupportNextDrawProbe): void {
  console.log('\n── T-016 next-draw support weight probe ──');
  console.log(`  Drill Main +2:        ${probe.drillMainPlus2}`);
  console.log(`  second consume empty: ${probe.secondConsumeEmpty}`);
  console.log(`  effectiveWeight +2:   ${probe.weightPlusTwo}`);
  console.log(`  Gate Prep +3:         ${probe.gatePrepPlus3}`);
  console.log(`  no Main no-op:        ${probe.noMainEmpty}`);
}
