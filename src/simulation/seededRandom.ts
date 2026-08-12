/**
 * Seeded PRNG for the battle simulation CLI.
 *
 * The combat math (calculateDamage hit/crit rolls), DeckSystem.drawHand, the
 * enemy AI, and BattleSimulator all rely on the global `Math.random`. That math
 * is frozen, so we make the *simulation process* deterministic by swapping the
 * global `Math.random` for a seeded generator at the start of the CLI entry
 * point. The real game keeps the native `Math.random` because this override
 * only lives inside the simulation process (`npx tsx src/simulation/index.ts`).
 *
 * With a fixed seed two runs produce byte-identical metrics, while the N
 * battles within a single run still vary as the generator advances - exactly
 * what reliable balance tuning needs.
 *
 * ## Dual install (backward compat + project RNG)
 * `installSeededRandom` still overrides `Math.random` for legacy call sites, and
 * also calls `setGlobalRng(createSeededRng(seed))` so systems that use
 * `getGlobalRng()` / `random()` / `pick()` from `src/game/utils/rng` share the
 * **same** seeded stream. Prefer migrating new code to the project RNG module;
 * keep Math.random only until a call site is touched.
 */

import {
  createSeededRng,
  resetGlobalRng,
  setGlobalRng,
} from '../game/utils/rng';

/** Default seed so simulation runs are reproducible unless `--seed` overrides it. */
export const DEFAULT_SEED = 12345;

/** Native Math.random captured at module load (before any install). */
const nativeMathRandom: () => number = Math.random.bind(Math);

/**
 * mulberry32: a tiny, fast, well-distributed 32-bit PRNG.
 * Returns a generator producing floats in [0, 1), deterministic per seed.
 * Kept for direct tests / callers that want a standalone stream without installing globals.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Replace the global `Math.random` with a seeded generator for this process,
 * and install the same stream as the project global RNG (`setGlobalRng`).
 *
 * Every subsequent `Math.random` call - including those inside the frozen game
 * math imported by the simulator - becomes deterministic. Code that uses
 * `getGlobalRng()` advances the same sequence (not a second independent seed).
 *
 * Returns the generator now backing `Math.random` (useful for tests).
 */
export function installSeededRandom(seed: number): () => number {
  // Single stream shared by Math.random and getGlobalRng() (mulberry32 via createSeededRng).
  const seeded = createSeededRng(seed);
  const rng = (): number => seeded.random();
  Math.random = rng;
  setGlobalRng(seeded);
  return rng;
}

/**
 * Restore native `Math.random` and reset the project global RNG to `defaultRng`.
 * Use in tests / after a simulation batch that called `installSeededRandom`.
 */
export function uninstallSeededRandom(): void {
  Math.random = nativeMathRandom;
  resetGlobalRng();
}
