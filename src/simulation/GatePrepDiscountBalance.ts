/**
 * T-017 probe — Gate Prep next Gate HP activation −50% one-shot.
 */

import { MODE_DEFINITIONS } from '../game/constants/modes';
import { activateMode, emptyModeBoard } from '../game/systems/CombatModeSystem';
import { armGatePrepDiscount, emptyGatePrepDiscount } from '../game/systems/GatePrepDiscountSystem';

export interface GatePrepDiscountProbe {
  halfHpSeven: boolean;
  failPreserves: boolean;
  nonGatePreserves: boolean;
  secondPaysFull: boolean;
}

export function runGatePrepDiscountProbe(): GatePrepDiscountProbe {
  const life = MODE_DEFINITIONS.gate_of_life;
  const clone = MODE_DEFINITIONS.shadow_clone;
  const armed = armGatePrepDiscount(emptyGatePrepDiscount()).pending;
  const tight = { ap: 10, chakra: 20, hp: 10 };
  const half = activateMode(emptyModeBoard(), life, tight, 1, { gateHpDiscount: armed });
  const fail = activateMode(emptyModeBoard(), life, { ...tight, hp: 5 }, 1, {
    gateHpDiscount: true,
  });
  const nonGate = activateMode(emptyModeBoard(), clone, { ap: 10, chakra: 20, hp: 40 }, 1, {
    gateHpDiscount: true,
  });
  const first = activateMode(emptyModeBoard(), life, { ap: 10, chakra: 20, hp: 20 }, 1, {
    gateHpDiscount: true,
  });
  const second = activateMode(emptyModeBoard(), life, { ap: 10, chakra: 20, hp: 20 }, 2, {
    gateHpDiscount: first.gateHpDiscount,
  });
  return {
    halfHpSeven: half.ok && tight.hp - half.pools.hp === 7 && half.gateHpDiscount === false,
    failPreserves: !fail.ok && fail.gateHpDiscount === true,
    nonGatePreserves: Boolean(nonGate.ok && nonGate.gateHpDiscount),
    secondPaysFull: Boolean(second.ok && 20 - second.pools.hp === 15),
  };
}

export function printGatePrepDiscountProbe(probe: GatePrepDiscountProbe): void {
  console.log('\n── T-017 Gate Prep HP discount probe ──');
  console.log(`  half HP 15→7:       ${probe.halfHpSeven}`);
  console.log(`  fail preserves:     ${probe.failPreserves}`);
  console.log(`  non-Gate preserves: ${probe.nonGatePreserves}`);
  console.log(`  second pays full:   ${probe.secondPaysFull}`);
}
