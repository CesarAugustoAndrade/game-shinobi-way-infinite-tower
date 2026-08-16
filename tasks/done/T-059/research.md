# T-059 research

Internal pattern reuse only. Three Bleed-on-hit options:

1. **`markEffects` bleed duration 2 stacks 4 `perHit` (recommended).** Mirror T-048 Kunai Slash. Full hit plants 4/2 on a clean board; miss plants nothing. Zero resolve edits.

2. **Keep `effects[]` BLEED 7 @0.3 and honor generic effects.** Wrong catalog numbers (7 vs 4; coin-flip vs guaranteed). New engine. Discarded by spec.

3. **New `impactBleed` field.** Duplicates `markEffects` for one skill. Heavier than reuse.

**Recommendation:** option 1. AC2: CLOSE hit → dmg 10 + enemy `bleed` stacks 4 duration 2. AC3: miss → 0, no bleed. Do not retune Kunai Slash.
