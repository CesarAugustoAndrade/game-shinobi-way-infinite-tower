# T-056 research

Internal pattern reuse only. Three PUSH-on-hit options:

1. **`BandMoveSpec.requireHit?: boolean` (recommended).** Explosive Tag sets `requireHit: true`. Resolve skips `skillForcedMove` when `requireHit && hitsLanded < 1`. Air Palm / Blastback omit the flag → miss still PUSHes (T-026 intact).

2. **Gate all enemy PUSH on `hitsLanded ≥ 1`.** Breaks T-026 miss (MEDIUM→LONG) and Blastback miss-push. Out of scope retune.

3. **New `impactBandMove` field.** Duplicates `bandMove` for one skill. Heavier than a one-bit opt-in.

**Recommendation:** option 1. AC2: CLOSE hit → 11 + range MEDIUM, `playerMoveUsedThisTurn` false. AC3: miss → 0 + range still CLOSE. LONG play rejects via `allowedRanges`.
