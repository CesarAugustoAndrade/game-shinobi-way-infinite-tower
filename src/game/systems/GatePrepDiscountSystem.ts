/**
 * GatePrepDiscountSystem — one-shot next Gate activation HP −50% (T-017).
 * Weight +3 is T-016. No React. No Math.random.
 */

import { ModeDefinition, TypedCost } from '../types';
import { MODE_FAMILY } from '../constants/modes';

export interface GatePrepDiscountState {
  pending: boolean;
}

export function emptyGatePrepDiscount(): GatePrepDiscountState {
  return { pending: false };
}

export function armGatePrepDiscount(
  _state: GatePrepDiscountState = emptyGatePrepDiscount(),
): GatePrepDiscountState {
  return { pending: true };
}

export function resetGatePrepDiscount(
  _state?: GatePrepDiscountState,
): GatePrepDiscountState {
  return { pending: false };
}

/** Pure enqueue source after playing Gate Prep. Tests may call arm directly. */
export function onGatePrepPlayed(): GatePrepDiscountState {
  return armGatePrepDiscount();
}

export function isGateHpDiscountEligible(def: ModeDefinition): boolean {
  return def.family === MODE_FAMILY.GATES && (def.activationCost.hp ?? 0) > 0;
}

/** Math.floor half of Gate HP activation. AP/chakra unchanged. */
export function discountedGateActivationCost(
  def: ModeDefinition,
  pending: boolean,
): TypedCost {
  const cost = def.activationCost;
  if (!pending || !isGateHpDiscountEligible(def)) return cost;
  return { ...cost, hp: Math.floor((cost.hp ?? 0) / 2) };
}
