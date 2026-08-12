/**
 * T-005 AC tests: Mode machine — upkeep, family ascent/lateral, charges.
 */

import { describe, it, expect } from 'vitest';
import { ModeRuntimeState } from '../../types';
import { MODE_DEFINITIONS, V1_MODE_IDS } from '../../constants/modes';
import {
  activateMode,
  ascendMode,
  applyModeUpkeep,
  emptyModeBoard,
  lateralSwap,
  stunEndsModes,
  trySpendCharges,
} from '../CombatModeSystem';
import { applyTicksRegen } from '../TurnClockSystem';

const pools = (overrides: { ap?: number; chakra?: number; hp?: number } = {}) => ({
  ap: overrides.ap ?? 10,
  chakra: overrides.chakra ?? 20,
  hp: overrides.hp ?? 40,
});

describe('T-005 upkeep', () => {
  it('ends a Mode on insufficient CP before regen; later priority Mode still attempts', () => {
    let board = emptyModeBoard();
    const byakugan = activateMode(board, MODE_DEFINITIONS.byakugan, pools({ chakra: 20 }), 1);
    const clone = activateMode(byakugan.board, MODE_DEFINITIONS.shadow_clone, byakugan.pools, 1);
    expect(clone.ok).toBe(true);

    const afterUpkeep = applyModeUpkeep(
      clone.board,
      ['byakugan', 'shadow_clone'],
      { ap: 10, chakra: 3, hp: 40 },
      2,
    );
    expect(afterUpkeep.ended?.map((e) => e.id)).toContain('byakugan');
    expect(afterUpkeep.board.instances.find((m) => m.id === 'shadow_clone')?.state).toBe(
      ModeRuntimeState.ON,
    );
    expect(afterUpkeep.pools.chakra).toBe(1);

    const regen = applyTicksRegen(
      { chakra: afterUpkeep.pools.chakra, hp: afterUpkeep.pools.hp },
      { chakra: 4, hp: 0, maxChakra: 20, maxHp: 40 },
    );
    expect(regen.chakra).toBe(5);
    expect(afterUpkeep.board.instances.find((m) => m.id === 'byakugan')?.state).toBe(
      ModeRuntimeState.COOLDOWN,
    );
  });

  it('HP upkeep that would kill turns the Mode off and keeps hp >= 1', () => {
    const on = activateMode(emptyModeBoard(), MODE_DEFINITIONS.curse_mark_1, pools({ hp: 20 }), 1);
    expect(on.ok).toBe(true);
    const after = applyModeUpkeep(on.board, ['curse_mark_1'], { ap: 5, chakra: 10, hp: 5 }, 2);
    expect(after.ended?.map((e) => e.id)).toEqual(['curse_mark_1']);
    expect(after.pools.hp).toBeGreaterThanOrEqual(1);
    expect(after.pools.hp).toBe(5);
  });
});

describe('T-005 family', () => {
  it('ascent pays AP + activation diff and grants charges+1 capped', () => {
    const stage1 = activateMode(emptyModeBoard(), MODE_DEFINITIONS.curse_mark_1, pools({ hp: 40 }), 1);
    const spent = trySpendCharges(stage1.board, 'curse_mark_1', 1, 1);
    expect(spent.board.instances.find((m) => m.id === 'curse_mark_1')?.charges).toBe(2);
    const up = ascendMode(spent.board, 'curse_mark_1', MODE_DEFINITIONS.curse_mark_2, pools({ ap: 10, hp: 40 }), 1);
    expect(up.ok).toBe(true);
    expect(up.pools.ap).toBe(7);
    expect(up.pools.hp).toBe(27);
    const now = up.board.instances.find((m) => m.id === 'curse_mark_2');
    expect(now?.state).toBe(ModeRuntimeState.ON);
    expect(now?.charges).toBe(3);
    expect(up.board.instances.some((m) => m.id === 'curse_mark_1' && m.state === ModeRuntimeState.ON)).toBe(false);
  });

  it('lateral transfers charges without refill; prior Mode goes on cooldown', () => {
    const two = activateMode(emptyModeBoard(), MODE_DEFINITIONS.sharingan_2, pools(), 1);
    const spent = trySpendCharges(two.board, 'sharingan_2', 1, 1);
    const swap = lateralSwap(spent.board, 'sharingan_2', MODE_DEFINITIONS.sharingan_3, pools(), 1);
    expect(swap.ok).toBe(true);
    expect(swap.board.instances.find((m) => m.id === 'sharingan_3')?.charges).toBe(2);
    expect(swap.board.instances.find((m) => m.id === 'sharingan_2')?.state).toBe(ModeRuntimeState.COOLDOWN);
    expect(swap.pools.ap).toBe(7);
    expect(swap.pools.chakra).toBe(14);
  });

  it('two different families can be ON together', () => {
    const a = activateMode(emptyModeBoard(), MODE_DEFINITIONS.byakugan, pools(), 1);
    const b = activateMode(a.board, MODE_DEFINITIONS.shadow_clone, a.pools, 1);
    expect(b.ok).toBe(true);
    const onIds = b.board.instances.filter((m) => m.state === ModeRuntimeState.ON).map((m) => m.id);
    expect(onIds.sort()).toEqual(['byakugan', 'shadow_clone']);
  });
});

describe('T-005 charges', () => {
  it('activate fills max charges; spend reduces; cannot overspend; 0 ends into cooldown', () => {
    const on = activateMode(emptyModeBoard(), MODE_DEFINITIONS.byakugan, pools(), 1);
    expect(on.board.instances[0]?.charges).toBe(MODE_DEFINITIONS.byakugan.maxCharges);
    const spent = trySpendCharges(on.board, 'byakugan', 1, 1);
    expect(spent.ok).toBe(true);
    expect(spent.board.instances[0]?.charges).toBe(3);
    const over = trySpendCharges(spent.board, 'byakugan', 9, 1);
    expect(over.ok).toBe(false);
    expect(over.reason).toBe('insufficient-charges');
    const drain = trySpendCharges(spent.board, 'byakugan', 3, 1);
    expect(drain.ended?.[0]?.id).toBe('byakugan');
    expect(drain.board.instances.find((m) => m.id === 'byakugan')?.state).toBe(ModeRuntimeState.COOLDOWN);
  });

  it('Stun does not end Modes', () => {
    expect(stunEndsModes(true)).toBe(false);
    const on = activateMode(emptyModeBoard(), MODE_DEFINITIONS.byakugan, pools(), 1);
    expect(on.board.instances[0]?.state).toBe(ModeRuntimeState.ON);
    expect(stunEndsModes(true)).toBe(false);
  });

  it('registers the eight v1 Mode definitions', () => {
    expect(V1_MODE_IDS).toHaveLength(8);
  });
});
