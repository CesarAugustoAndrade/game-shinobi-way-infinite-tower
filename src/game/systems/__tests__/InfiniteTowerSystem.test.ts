/**
 * Infinite Tower / Ascent (T-027)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateInfiniteRegionConfig,
  infiniteHeightFromFloor,
  computeTowerScore,
  INFINITE_DIFFICULTY_PER_FLOOR,
  isInfiniteModeUnlocked,
  unlockInfiniteMode,
  clearInfiniteUnlockForTests,
} from '../InfiniteTowerSystem';
import { generateRegion, markLocationComplete, enterLocationFromCard, isRegionBossDefeated } from '../RegionSystem';
import { createMockPlayer } from './testFixtures';

describe('generateInfiniteRegionConfig', () => {
  it('cycles campaign templates and remaps location ids', () => {
    const f0 = generateInfiniteRegionConfig(0, 40);
    const f1 = generateInfiniteRegionConfig(1, 40);
    expect(f0.id).toContain('infinite_');
    expect(f0.id).toContain('_f0');
    expect(f0.entryLocationIds.every((id) => id.endsWith('_f0'))).toBe(true);
    expect(f0.bossLocationId.endsWith('_f0')).toBe(true);
    expect(f0.locations.every((l) => l.id.endsWith('_f0'))).toBe(true);
    // Paths remapped
    const path = f0.locations[0].forwardPaths[0];
    expect(path.targetId.endsWith('_f0')).toBe(true);
    expect(f1.bossLocationId.endsWith('_f1')).toBe(true);
    expect(f0.name).toContain('Ascent 1');
    expect(f1.name).toContain('Ascent 2');
  });

  it('raises baseDifficulty with floor', () => {
    const a = generateInfiniteRegionConfig(0, 40);
    const b = generateInfiniteRegionConfig(4, 40);
    expect(b.baseDifficulty).toBeGreaterThan(a.baseDifficulty);
    expect(b.baseDifficulty - a.baseDifficulty).toBeGreaterThanOrEqual(
      4 * INFINITE_DIFFICULTY_PER_FLOOR - 1,
    );
  });

  it('produces a playable Region with boss clear detection', () => {
    const config = generateInfiniteRegionConfig(2, 50);
    const player = createMockPlayer({ locationsCleared: 20 });
    const region = generateRegion(config, config.baseDifficulty, player);
    expect(region.locations.length).toBe(config.locations.length);
    const boss = region.locations.find((l) => l.flags.isBoss)!;
    expect(boss).toBeDefined();
    const done = markLocationComplete(enterLocationFromCard(region, boss.id));
    expect(isRegionBossDefeated(done)).toBe(true);
  });
});

describe('tower score / height helpers', () => {
  it('maps floor index to height and score', () => {
    expect(infiniteHeightFromFloor(0)).toBe(1);
    expect(infiniteHeightFromFloor(9)).toBe(10);
    expect(computeTowerScore(7)).toBe(7);
    expect(computeTowerScore(-1)).toBe(0);
  });
});

describe('infinite unlock flag', () => {
  beforeEach(() => {
    clearInfiniteUnlockForTests();
  });

  it('unlocks and reports flag', () => {
    expect(isInfiniteModeUnlocked()).toBe(false);
    unlockInfiniteMode();
    expect(isInfiniteModeUnlocked()).toBe(true);
  });
});
