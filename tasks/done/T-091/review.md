# T-091 review

**SPEC CONFORMANCE: 95/100.** SIDE AP2/CP6/CD4 8 M/L, `impactChakraDrain: 6`, Poison `markEffects` 3×3 `id: poison` requireHit, no Mode. Hit 8 / 20→14 CP / one poison; miss no package. Legacy mute 25/8×3 dropped.

**ARCHITECTURE: PASS.** RING-GUARD: types + resolve hook + constants + tests + sim. Generic field, no skill-id branch. OOS skills untouched.

**QUALITY:** NIT — floor-0 drain when enemyChakra < 6 untested (not an AC). SkillTag.POISON unavailable.

**VERDICT: APPROVE**
