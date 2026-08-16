# T-086 review

**SPEC CONFORMANCE: 95/100.** Activity/treasure already choked. Loot `learnSkill` now uses `applyLearnSkill` / `applyForgetSkill`. Forget Main realigns. AC tests pass.

**ARCHITECTURE: PASS.** RING-GUARD: no new R0 files. App is the only loot caller (spec-allowed).

**QUALITY:** NIT — Campaign boon still appends `skills[]` raw (out of layers). Discover UI still T-087.

**VERDICT: APPROVE**
