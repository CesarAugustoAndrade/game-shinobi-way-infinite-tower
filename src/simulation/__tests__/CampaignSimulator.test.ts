/**
 * Unit tests for CampaignSimulator pure logic (T-015)
 *
 * Covers:
 *  - scoreItem: weighted sum, zero score for empty stats, element affinity.
 *  - tryEquipOrSell: equip into empty slot, equip upgrade into full slots,
 *    sell when not an upgrade.
 *  - totalGearScore: empty equipment, partial equipment.
 *  - aggregateCampaignRuns: edge case (empty runs), clear-rate by depth.
 *  - simulateMerchant: no buy if ryo < price; buy and equip if ryo >= price
 *    and is upgrade (T-015 attempt 2 gate).
 *  - simulateCampaignRun: locationsCleared propagated to player (T-015 attempt 2 gate).
 *
 * NOTE: applyLevelUp tests were moved to LevelSystem.test.ts (T-015 attempt 2).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  scoreItem,
  tryEquipOrSell,
  totalGearScore,
  aggregateCampaignRuns,
  getStatWeights,
  simulateMerchant,
  simulateCampaignRun,
  DEFAULT_CAMPAIGN_CONFIG,
  CampaignConfig,
} from '../CampaignSimulator';
import {
  Player,
  Item,
  EquipmentSlot,
  ElementType,
  Clan,
  Rarity,
  TreasureQuality,
  DEFAULT_MERCHANT_SLOTS,
} from '../../game/types';
import type { PlayerBuildConfig } from '../types';
import { installSeededRandom } from '../seededRandom';

// ============================================================================
// HELPERS
// ============================================================================

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    clan: Clan.UZUMAKI,
    level: 1,
    exp: 0,
    maxExp: 100,
    primaryStats: {
      willpower: 25, chakra: 22, strength: 12, spirit: 10,
      intelligence: 10, calmness: 14, speed: 10, accuracy: 8, dexterity: 8,
    },
    currentHp: 350,
    currentChakra: 196,
    element: ElementType.WIND,
    ryo: 500,
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

function makeItem(stats: Partial<Item['stats']>, value = 100): Item {
  return {
    id: `test-item-${Math.random()}`,
    name: 'Test Item',
    rarity: Rarity.COMMON,
    stats,
    value,
    isComponent: true,
  };
}

// ============================================================================
// getStatWeights
// ============================================================================

describe('getStatWeights', () => {
  it('returns high spirit weight for elemental builds', () => {
    const weights = getStatWeights(ElementType.FIRE);
    expect((weights.spirit ?? 0)).toBeGreaterThanOrEqual(2);
  });

  it('returns high strength weight for physical builds', () => {
    const weights = getStatWeights(ElementType.PHYSICAL);
    expect((weights.strength ?? 0)).toBeGreaterThanOrEqual(2);
  });

  it('returns high intelligence weight for mental builds', () => {
    const weights = getStatWeights(ElementType.MENTAL);
    expect((weights.intelligence ?? 0)).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================================
// scoreItem
// ============================================================================

describe('scoreItem', () => {
  it('returns 0 for an item with no stats', () => {
    const player = makePlayer();
    const item = makeItem({});
    expect(scoreItem(item, player)).toBe(0);
  });

  it('uses element-appropriate weights (wind build cares about spirit)', () => {
    const windPlayer = makePlayer({ element: ElementType.WIND });
    const physPlayer = makePlayer({ element: ElementType.PHYSICAL });
    const item = makeItem({ spirit: 10 });

    // Wind build should value spirit more than physical build
    expect(scoreItem(item, windPlayer)).toBeGreaterThan(scoreItem(item, physPlayer));
  });

  it('scores item proportionally to stat values', () => {
    const player = makePlayer({ element: ElementType.PHYSICAL });
    const item5 = makeItem({ strength: 5 });
    const item10 = makeItem({ strength: 10 });
    expect(scoreItem(item10, player)).toBeGreaterThan(scoreItem(item5, player));
  });
});

// ============================================================================
// tryEquipOrSell
// ============================================================================

describe('tryEquipOrSell', () => {
  it('equips item into empty slot without selling', () => {
    const player = makePlayer({ ryo: 100 });
    const item = makeItem({ strength: 10 }, 50);
    const result = tryEquipOrSell(player, item);

    expect(result.equipped).toBe(true);
    // Ryo should NOT change (equipping, not buying)
    expect(result.player.ryo).toBe(player.ryo);
    // One slot should now have the item
    const equipped = Object.values(result.player.equipment).filter(Boolean);
    expect(equipped.length).toBe(1);
  });

  it('sells item instead of equipping when it is not an upgrade', () => {
    // Fill all slots with high-score items
    const highItem = makeItem({ strength: 100, speed: 100, dexterity: 100 }, 200);
    const player = makePlayer({
      element: ElementType.PHYSICAL,
      ryo: 0,
      equipment: {
        [EquipmentSlot.SLOT_1]: highItem,
        [EquipmentSlot.SLOT_2]: highItem,
        [EquipmentSlot.SLOT_3]: highItem,
        [EquipmentSlot.SLOT_4]: highItem,
      },
    });
    const weakItem = makeItem({ strength: 1 }, 10);
    const result = tryEquipOrSell(player, weakItem);

    expect(result.equipped).toBe(false);
    // Ryo increased from selling
    expect(result.player.ryo).toBeGreaterThan(0);
    // Equipment unchanged
    expect(result.player.equipment[EquipmentSlot.SLOT_1]).toBe(highItem);
  });

  it('equips upgrade into full slots, selling the displaced item', () => {
    const weakItem = makeItem({ strength: 1 }, 10);
    const strongItem = makeItem({ strength: 1, speed: 1, dexterity: 1 }, 10);
    const megaItem = makeItem({ strength: 50 }, 100);
    const player = makePlayer({
      element: ElementType.PHYSICAL,
      ryo: 0,
      equipment: {
        [EquipmentSlot.SLOT_1]: weakItem,
        [EquipmentSlot.SLOT_2]: strongItem,
        [EquipmentSlot.SLOT_3]: strongItem,
        [EquipmentSlot.SLOT_4]: strongItem,
      },
    });
    const result = tryEquipOrSell(player, megaItem);

    expect(result.equipped).toBe(true);
    // Displaced weak item was sold → ryo > 0
    expect(result.player.ryo).toBeGreaterThan(0);
    // megaItem should be in the slot that held weakItem
    expect(result.player.equipment[EquipmentSlot.SLOT_1]).toBe(megaItem);
  });
});

// ============================================================================
// totalGearScore
// ============================================================================

describe('totalGearScore', () => {
  it('returns 0 for a player with no equipment', () => {
    const player = makePlayer();
    expect(totalGearScore(player)).toBe(0);
  });

  it('sums scores from all equipped items', () => {
    const item = makeItem({ strength: 10 });
    const player = makePlayer({
      element: ElementType.PHYSICAL,
      equipment: {
        [EquipmentSlot.SLOT_1]: item,
        [EquipmentSlot.SLOT_2]: item,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const oneItemScore = scoreItem(item, player);
    expect(totalGearScore(player)).toBeCloseTo(oneItemScore * 2);
  });
});

// ============================================================================
// aggregateCampaignRuns
// ============================================================================

describe('aggregateCampaignRuns', () => {
  const build: PlayerBuildConfig = {
    name: 'Test Build',
    clan: Clan.UZUMAKI,
    level: 5,
    skillIds: ['basic_atk'],
    element: ElementType.WIND,
  };

  it('returns zero-value aggregate for empty results array', () => {
    const agg = aggregateCampaignRuns([], build, 3);
    expect(agg.runs).toBe(0);
    expect(agg.clearRateByDepth).toHaveLength(0);
    expect(agg.completionRate).toBe(0);
    expect(agg.deathRate).toBe(0);
    expect(agg.incompleteRate).toBe(0);
  });

  it('computes correct clear rate by depth', () => {
    // 2 runs: run1 clears loc1+loc2, run2 clears loc1 but dies at loc2
    const makeLocationStat = (idx: number, outcome: 'cleared' | 'died'): import('../CampaignSimulator').LocationStats => ({
      locationIndex: idx,
      dangerLevel: idx,
      playerLevelAtEntry: 5,
      playerLocationsCleared: idx - 1,
      hpFractionAtEntry: 1.0,
      effectiveMaxHp: 300,
      effectiveAtk: 50,
      combats: 3,
      ryoGained: 100,
      ryoSpent: 0,
      itemsEquipped: 0,
      outcome,
    });

    const run1: import('../CampaignSimulator').CampaignRunResult = {
      locationsAttempted: 2,
      locationsCleared: 2,
      finalOutcome: 'completed',
      deathLocationIndex: null,
      locationStats: [makeLocationStat(1, 'cleared'), makeLocationStat(2, 'cleared')],
      finalPlayerLevel: 6,
      totalRyoGained: 200,
      totalRyoSpent: 0,
      finalGearScore: 0,
      withItems: false,
    };

    const run2: import('../CampaignSimulator').CampaignRunResult = {
      locationsAttempted: 2,
      locationsCleared: 1,
      finalOutcome: 'died',
      deathLocationIndex: 2,
      locationStats: [makeLocationStat(1, 'cleared'), makeLocationStat(2, 'died')],
      finalPlayerLevel: 5,
      totalRyoGained: 100,
      totalRyoSpent: 0,
      finalGearScore: 0,
      withItems: false,
    };

    const agg = aggregateCampaignRuns([run1, run2], build, 2);

    // Location 1: both cleared → 100%
    expect(agg.clearRateByDepth[0]).toBe(1.0);
    // Location 2: 1 of 2 cleared → 50%
    expect(agg.clearRateByDepth[1]).toBe(0.5);
    // completionRate: 1 of 2 completed all → 50%
    expect(agg.completionRate).toBe(0.5);
    // deathRate: 1 of 2 died → 50%
    expect(agg.deathRate).toBe(0.5);
    // incompleteRate: 0 of 2 incomplete → 0%
    expect(agg.incompleteRate).toBe(0);
    // avgTotalRyoGained: (200 + 100) / 2
    expect(agg.avgTotalRyoGained).toBe(150);
  });

  it('computes incompleteRate correctly', () => {
    const makeSimpleRun = (outcome: 'completed' | 'died' | 'incomplete'): import('../CampaignSimulator').CampaignRunResult => ({
      locationsAttempted: 1,
      locationsCleared: outcome === 'completed' ? 1 : 0,
      finalOutcome: outcome,
      deathLocationIndex: null,
      locationStats: [],
      finalPlayerLevel: 5,
      totalRyoGained: 0,
      totalRyoSpent: 0,
      finalGearScore: 0,
      withItems: false,
    });

    const runs = [
      makeSimpleRun('completed'),
      makeSimpleRun('incomplete'),
      makeSimpleRun('incomplete'),
      makeSimpleRun('died'),
    ];

    const agg = aggregateCampaignRuns(runs, build, 1);
    expect(agg.completionRate).toBeCloseTo(0.25);
    expect(agg.deathRate).toBeCloseTo(0.25);
    expect(agg.incompleteRate).toBeCloseTo(0.5);
  });
});

// ============================================================================
// simulateMerchant — T-015 attempt 2 gate
// ============================================================================

describe('simulateMerchant', () => {
  it('does not buy if ryo < price (ryo=0)', () => {
    installSeededRandom(42);
    const player = makePlayer({ ryo: 0 });
    const result = simulateMerchant(player, 10, 40, 1.5);
    // With zero ryo, no item can be affordable regardless of price
    expect(result.ryoSpent).toBe(0);
    expect(result.player.ryo).toBe(0);
  });

  it('buys and equips if ryo >= price and slot is empty', () => {
    installSeededRandom(42);
    // Player has plenty of ryo and empty slots — any item should be purchased
    // (empty slot path: always equip regardless of score comparison)
    const player = makePlayer({ ryo: 10000 });
    const result = simulateMerchant(player, 5, 20, 1.5);

    // seed 42: generateComponent(5, 20) produces value > 0, so a purchase
    // is guaranteed with 10000 ryo and empty slots.
    const purchasedSlots = Object.values(result.player.equipment).filter(Boolean).length;
    expect(result.ryoSpent).toBeGreaterThan(0);
    expect(result.player.ryo).toBeLessThan(10000);
    expect(purchasedSlots).toBeGreaterThan(0);
  });

  it('applies merchantMarkupMultiplier to price (markup=10 → never buys with ryo=99)', () => {
    installSeededRandom(99);
    // With a ×10 markup, price = item.value * 10.
    // If item.value >= 10 (minimum realistic component value), price >= 100.
    // Player has 99 ryo → cannot afford anything.
    const player = makePlayer({ ryo: 99 });
    const result = simulateMerchant(player, 5, 20, 10);
    // Cannot afford any item at 10× markup with only 99 ryo
    // (base component value at floor 5 should be at least 10+)
    expect(result.ryoSpent).toBe(0);
  });
});

// ============================================================================
// simulateCampaignRun — locationsCleared propagation (T-015 attempt 2 gate)
// ============================================================================

describe('simulateCampaignRun — locationsCleared propagation', () => {
  const build: PlayerBuildConfig = {
    name: 'Uzumaki Test',
    clan: Clan.UZUMAKI,
    level: 5,
    skillIds: ['basic_atk'],
    element: ElementType.WIND,
  };

  it('first location snapshot has playerLocationsCleared = 0', () => {
    installSeededRandom(12345);
    const result = simulateCampaignRun(build, DEFAULT_CAMPAIGN_CONFIG, false, 0);
    expect(result.locationStats.length).toBeGreaterThan(0);
    expect(result.locationStats[0].playerLocationsCleared).toBe(0);
  });

  it('location N+1 snapshot has playerLocationsCleared = N after a clear', () => {
    // Run multiple locations; for any location whose index > 1 and whose
    // prior location was cleared, playerLocationsCleared must equal prior clears.
    installSeededRandom(12345);
    const result = simulateCampaignRun(build, DEFAULT_CAMPAIGN_CONFIG, false, 0);

    expect(result.locationStats.some(s => s.outcome === 'cleared')).toBe(true);
    let expectedCleared = 0;
    for (const stat of result.locationStats) {
      expect(stat.playerLocationsCleared).toBe(expectedCleared);
      if (stat.outcome === 'cleared') {
        expectedCleared++;
      }
    }
  });
});
