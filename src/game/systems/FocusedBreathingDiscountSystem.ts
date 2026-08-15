/**
 * FocusedBreathingDiscountSystem — +8 CP now; one-shot next CP Mode upkeep −2 (T-067).
 * Mirrors GatePrepDiscountSystem on the CP axis. No React. No Math.random.
 */

import { TypedCost } from '../types';

export const FOCUSED_BREATHING_ID = 'focused_breathing';
export const FOCUSED_BREATHING_GRANT = 8;
export const FOCUSED_BREATHING_UPKEEP_DISCOUNT = 2;

export function grantFocusedBreathingChakra(chakra: number): number {
  return chakra + FOCUSED_BREATHING_GRANT;
}

export function armFocusedBreathingDiscount(): number {
  return FOCUSED_BREATHING_UPKEEP_DISCOUNT;
}

/**
 * Reduce the first CP upkeep by `pending` (min 0). HP unchanged.
 * Consume only when a chakra cost > 0 is actually reduced.
 */
export function applyCpUpkeepDiscount(
  cost: TypedCost,
  pending: number,
): { cost: TypedCost; remaining: number; consumed: boolean } {
  const n = cost.chakra ?? 0;
  if (pending <= 0 || n <= 0) {
    return { cost, remaining: Math.max(0, pending), consumed: false };
  }
  return {
    cost: { ...cost, chakra: Math.max(0, n - pending) },
    remaining: 0,
    consumed: true,
  };
}
