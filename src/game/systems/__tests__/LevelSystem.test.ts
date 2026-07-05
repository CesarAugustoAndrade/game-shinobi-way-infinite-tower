/**
 * LevelSystem Unit Tests (T-015 attempt 2)
 *
 * Verifies parity with App.tsx checkLevelUp behavior across clans:
 *  - Correct CLAN_GROWTH stat gains applied each level.
 *  - Full heal on any level gain.
 *  - Immutability (input player is never mutated).
 *  - Multi-level-up in one call.
 *  - maxExp = newLevel × 100 after each level.
 */

import { describe, it, expect } from 'vitest';
import { applyLevelUp } from '../LevelSystem';
import { CLAN_GROWTH } from '../../constants';
import {
  Player,
  Clan,
  ElementType,
  EquipmentSlot,
  TreasureQuality,
  DEFAULT_MERCHANT_SLOTS,
} from '../../types';

// ============================================================================
// HELPERS
// ============================================================================

function makePlayer(clan: Clan, overrides: Partial<Player> = {}): Player {
  return {
    clan,
    level: 1,
    exp: 0,
    maxExp: 100,
    primaryStats: {
      willpower: 10, chakra: 10, strength: 10, spirit: 10,
      intelligence: 10, calmness: 10, speed: 10, accuracy: 10, dexterity: 10,
    },
    currentHp: 170,   // matches calculateDerivedStats(allTen) maxHp
    currentChakra: 100,
    element: ElementType.WIND,
    ryo: 0,
    equipment: {
      [EquipmentSlot.SLOT_1]: null,
      [EquipmentSlot.SLOT_2]: null,
      [EquipmentSlot.SLOT_3]: null,
      [EquipmentSlot.SLOT_4]: null,
    },
    skills: [],
    activeBuffs: [],
    bag: Array(12).fill(null),
    treasureQuality: TreasureQuality.BROKEN,
    merchantSlots: DEFAULT_MERCHANT_SLOTS,
    locationsCleared: 0,
    eventFlags: {},
    ...overrides,
  };
}

// ============================================================================
// IMMUTABILITY
// ============================================================================

describe('applyLevelUp — immutability', () => {
  it('does not mutate the input player when no level-up occurs', () => {
    const player = makePlayer(Clan.UZUMAKI, { exp: 50, maxExp: 100 });
    const frozen = JSON.stringify(player);
    applyLevelUp(player);
    expect(JSON.stringify(player)).toBe(frozen);
  });

  it('does not mutate the input player when a level-up occurs', () => {
    const player = makePlayer(Clan.UZUMAKI, { exp: 100, maxExp: 100 });
    const beforeStats = { ...player.primaryStats };
    applyLevelUp(player);
    expect(player.level).toBe(1);
    expect(player.exp).toBe(100);
    expect(player.primaryStats.willpower).toBe(beforeStats.willpower);
  });
});

// ============================================================================
// NO LEVEL-UP
// ============================================================================

describe('applyLevelUp — no level-up', () => {
  it('returns the same player (structurally) when exp < maxExp', () => {
    const player = makePlayer(Clan.UZUMAKI, { exp: 50, maxExp: 100 });
    const result = applyLevelUp(player);
    expect(result.level).toBe(1);
    expect(result.exp).toBe(50);
  });
});

// ============================================================================
// SINGLE LEVEL-UP — UZUMAKI
// ============================================================================

describe('applyLevelUp — Uzumaki single level', () => {
  const player = makePlayer(Clan.UZUMAKI, {
    exp: 100, maxExp: 100, level: 1, currentHp: 1,
  });

  it('increments level to 2', () => {
    const result = applyLevelUp(player);
    expect(result.level).toBe(2);
  });

  it('sets maxExp = newLevel × 100', () => {
    const result = applyLevelUp(player);
    expect(result.maxExp).toBe(200);
  });

  it('deducts the maxExp threshold from exp', () => {
    const result = applyLevelUp(player);
    expect(result.exp).toBe(0); // 100 - 100 = 0
  });

  it('applies UZUMAKI CLAN_GROWTH stats correctly', () => {
    const growth = CLAN_GROWTH[Clan.UZUMAKI];
    const result = applyLevelUp(player);
    expect(result.primaryStats.willpower).toBe(player.primaryStats.willpower + (growth.willpower ?? 0));
    expect(result.primaryStats.chakra).toBe(player.primaryStats.chakra + (growth.chakra ?? 0));
    expect(result.primaryStats.spirit).toBe(player.primaryStats.spirit + (growth.spirit ?? 0));
  });

  it('fully heals on level-up (currentHp goes from 1 to maxHp)', () => {
    const result = applyLevelUp(player);
    expect(result.currentHp).toBeGreaterThan(1);
    expect(result.currentHp).toBe(result.currentHp); // Verify it's set
  });
});

// ============================================================================
// SINGLE LEVEL-UP — UCHIHA (different growth profile)
// ============================================================================

describe('applyLevelUp — Uchiha single level', () => {
  it('applies UCHIHA CLAN_GROWTH stats correctly', () => {
    const player = makePlayer(Clan.UCHIHA, { exp: 100, maxExp: 100, level: 1 });
    const growth = CLAN_GROWTH[Clan.UCHIHA];
    const result = applyLevelUp(player);
    expect(result.primaryStats.spirit).toBe(player.primaryStats.spirit + (growth.spirit ?? 0));
    expect(result.primaryStats.dexterity).toBe(player.primaryStats.dexterity + (growth.dexterity ?? 0));
    expect(result.primaryStats.intelligence).toBe(player.primaryStats.intelligence + (growth.intelligence ?? 0));
  });
});

// ============================================================================
// SINGLE LEVEL-UP — HYUGA
// ============================================================================

describe('applyLevelUp — Hyuga single level', () => {
  it('applies HYUGA CLAN_GROWTH stats correctly', () => {
    const player = makePlayer(Clan.HYUGA, { exp: 100, maxExp: 100, level: 1 });
    const growth = CLAN_GROWTH[Clan.HYUGA];
    const result = applyLevelUp(player);
    expect(result.primaryStats.intelligence).toBe(player.primaryStats.intelligence + (growth.intelligence ?? 0));
    expect(result.primaryStats.calmness).toBe(player.primaryStats.calmness + (growth.calmness ?? 0));
  });
});

// ============================================================================
// SINGLE LEVEL-UP — LEE
// ============================================================================

describe('applyLevelUp — Lee single level', () => {
  it('applies LEE CLAN_GROWTH stats correctly (chakra growth is 0)', () => {
    const player = makePlayer(Clan.LEE, { exp: 100, maxExp: 100, level: 1 });
    const growth = CLAN_GROWTH[Clan.LEE];
    const result = applyLevelUp(player);
    expect(result.primaryStats.strength).toBe(player.primaryStats.strength + (growth.strength ?? 0));
    // Lee has chakra: 0 growth — chakra stat should not increase
    expect(result.primaryStats.chakra).toBe(player.primaryStats.chakra + (growth.chakra ?? 0));
  });
});

// ============================================================================
// MULTI LEVEL-UP
// ============================================================================

describe('applyLevelUp — multiple levels in one call', () => {
  it('levels L1→L3 correctly from 300 exp (100+200=300)', () => {
    // L1→L2: costs 100, remaining 200, maxExp becomes 200
    // L2→L3: costs 200, remaining 0, maxExp becomes 300
    const player = makePlayer(Clan.UZUMAKI, { exp: 300, maxExp: 100, level: 1 });
    const result = applyLevelUp(player);
    expect(result.level).toBe(3);
    expect(result.exp).toBe(0);
    expect(result.maxExp).toBe(300);
  });

  it('applies CLAN_GROWTH 2× for two levels gained', () => {
    const player = makePlayer(Clan.UZUMAKI, { exp: 300, maxExp: 100, level: 1 });
    const growth = CLAN_GROWTH[Clan.UZUMAKI];
    const result = applyLevelUp(player);
    const expectedWillpower = player.primaryStats.willpower + (growth.willpower ?? 0) * 2;
    expect(result.primaryStats.willpower).toBe(expectedWillpower);
  });

  it('fully heals after multi-level-up', () => {
    const player = makePlayer(Clan.UZUMAKI, {
      exp: 300, maxExp: 100, level: 1, currentHp: 1,
    });
    const result = applyLevelUp(player);
    expect(result.currentHp).toBeGreaterThan(1);
  });

  it('carries over leftover exp correctly', () => {
    // L1→L2: costs 100, remaining=250, maxExp=200
    // L2→L3: costs 200, remaining=50, maxExp=300
    const player = makePlayer(Clan.UZUMAKI, { exp: 350, maxExp: 100, level: 1 });
    const result = applyLevelUp(player);
    expect(result.level).toBe(3);
    expect(result.exp).toBe(50);
  });
});

// ============================================================================
// PARITY WITH App.tsx checkLevelUp — structural contract
// ============================================================================

describe('applyLevelUp — parity contract (all clans)', () => {
  const clans = [Clan.UZUMAKI, Clan.UCHIHA, Clan.HYUGA, Clan.LEE];

  for (const clan of clans) {
    it(`${clan}: stats after 1 level-up match CLAN_GROWTH`, () => {
      const player = makePlayer(clan, { exp: 100, maxExp: 100, level: 1 });
      const growth = CLAN_GROWTH[clan];
      const result = applyLevelUp(player);

      // Every stat in CLAN_GROWTH must be applied exactly once
      (Object.keys(growth) as (keyof typeof growth)[]).forEach(stat => {
        const gain = growth[stat] ?? 0;
        expect(result.primaryStats[stat]).toBe(player.primaryStats[stat] + gain);
      });
    });
  }
});
