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
 */

/** Default seed so simulation runs are reproducible unless `--seed` overrides it. */
export const DEFAULT_SEED = 12345;

/**
 * mulberry32: a tiny, fast, well-distributed 32-bit PRNG.
 * Returns a generator producing floats in [0, 1), deterministic per seed.
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
 * Replace the global `Math.random` with a seeded generator for this process.
 * Every subsequent `Math.random` call - including those inside the frozen game
 * math imported by the simulator - becomes deterministic.
 *
 * Returns the generator now backing `Math.random` (useful for tests).
 */
export function installSeededRandom(seed: number): () => number {
  const rng = mulberry32(seed);
  Math.random = rng;
  return rng;
}
