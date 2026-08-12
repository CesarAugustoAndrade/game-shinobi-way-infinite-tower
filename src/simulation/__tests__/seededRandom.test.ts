import { describe, it, expect, afterEach } from 'vitest';
import { mulberry32, installSeededRandom, uninstallSeededRandom, DEFAULT_SEED } from '../seededRandom';
import { getGlobalRng, random } from '../../game/utils/rng';

describe('mulberry32', () => {
  it('produces identical sequences for the same seed', () => {
    const a = mulberry32(DEFAULT_SEED);
    const b = mulberry32(DEFAULT_SEED);
    const seqA = Array.from({ length: 16 }, () => a());
    const seqB = Array.from({ length: 16 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const seqA = Array.from({ length: 16 }, () => a());
    const seqB = Array.from({ length: 16 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it('produces values within [0, 1)', () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('advances the sequence on each call (within-run variation)', () => {
    const rng = mulberry32(7);
    const first = rng();
    const second = rng();
    const third = rng();
    expect(first).not.toEqual(second);
    expect(second).not.toEqual(third);
  });
});

describe('installSeededRandom', () => {
  afterEach(() => {
    uninstallSeededRandom();
  });

  it('makes Math.random deterministic and reproducible across re-installs', () => {
    installSeededRandom(DEFAULT_SEED);
    const run1 = Array.from({ length: 8 }, () => Math.random());
    installSeededRandom(DEFAULT_SEED);
    const run2 = Array.from({ length: 8 }, () => Math.random());
    expect(run1).toEqual(run2);
  });

  it('returns the generator now backing Math.random', () => {
    const rng = installSeededRandom(42);
    expect(Math.random).toBe(rng);
  });

  it('installs the same stream on getGlobalRng() / random()', () => {
    installSeededRandom(DEFAULT_SEED);
    // Alternating Math.random and project RNG must advance one shared sequence
    const viaMath = Math.random();
    const viaGlobal = random();
    installSeededRandom(DEFAULT_SEED);
    expect(Math.random()).toBe(viaMath);
    expect(getGlobalRng().random()).toBe(viaGlobal);
  });
});
