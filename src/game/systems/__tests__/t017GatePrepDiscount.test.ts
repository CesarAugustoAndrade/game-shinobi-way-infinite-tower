/**
 * T-017 AC: Gate Prep next Gate activation HP −50% (Math.floor).
 */

import { describe, it, expect } from 'vitest';
import { MODE_DEFINITIONS } from '../../constants/modes';
import { activateMode, emptyModeBoard } from '../CombatModeSystem';
import {
  armGatePrepDiscount,
  emptyGatePrepDiscount,
  onGatePrepPlayed,
} from '../GatePrepDiscountSystem';

const life = MODE_DEFINITIONS.gate_of_life;
const clone = MODE_DEFINITIONS.shadow_clone;

const pools = (overrides: { ap?: number; chakra?: number; hp?: number } = {}) => ({
  ap: overrides.ap ?? 10,
  chakra: overrides.chakra ?? 20,
  hp: overrides.hp ?? 40,
});

describe('T-017 half hp', () => {
  it('lets Gate of Life pay floor(15/2)=7 when full 15 is unaffordable', () => {
    const armed = armGatePrepDiscount(emptyGatePrepDiscount());
    expect(onGatePrepPlayed().pending).toBe(true);
    const start = pools({ hp: 10 });
    const full = activateMode(emptyModeBoard(), life, start, 1);
    expect(full.ok).toBe(false);

    const discounted = activateMode(emptyModeBoard(), life, start, 1, {
      gateHpDiscount: armed.pending,
    });
    expect(discounted.ok).toBe(true);
    expect(discounted.pools.hp).toBe(3);
    expect(start.hp - discounted.pools.hp).toBe(7);
    expect(discounted.pools.ap).toBe(7);
    expect(discounted.gateHpDiscount).toBe(false);
  });
});

describe('T-017 preserve', () => {
  it('keeps the discount when even half HP fails', () => {
    const result = activateMode(emptyModeBoard(), life, pools({ hp: 5 }), 1, {
      gateHpDiscount: true,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('hp-floor');
    expect(result.gateHpDiscount).toBe(true);
    expect(result.pools.hp).toBe(5);
  });

  it('does not consume the discount on a non-Gate Mode', () => {
    const result = activateMode(emptyModeBoard(), clone, pools(), 1, {
      gateHpDiscount: true,
    });
    expect(result.ok).toBe(true);
    expect(result.pools.chakra).toBe(8);
    expect(result.gateHpDiscount).toBe(true);
  });
});

describe('T-017 one shot', () => {
  it('charges full HP on the second successful Gate activation', () => {
    const first = activateMode(emptyModeBoard(), life, pools({ hp: 20 }), 1, {
      gateHpDiscount: true,
    });
    expect(first.ok).toBe(true);
    expect(first.pools.hp).toBe(13);
    expect(first.gateHpDiscount).toBe(false);

    const second = activateMode(emptyModeBoard(), life, pools({ hp: 20 }), 2, {
      gateHpDiscount: first.gateHpDiscount,
    });
    expect(second.ok).toBe(true);
    expect(second.pools.hp).toBe(5);
    expect(20 - second.pools.hp).toBe(15);
  });
});
