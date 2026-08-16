# T-085 review

**SPEC CONFORMANCE: 94/100.** CombatState already held the fields. `buildUpkeepWeightContext` consumes into WeightContext. `processUpkeep` now returns an empty bag; second context has no +2. Discover is not consumed at upkeep.

**ARCHITECTURE: PASS.** RING-GUARD: R0 files import no React/UI. `useCombat` only writes the UpkeepResult bag (R2 adapter). No useSkill cutover.

**QUALITY:** NIT — `pendingSupportWeights: []` is hardcoded after consume (matches `consumeSupportWeightBonuses` contract). Discover UI still T-087.

**VERDICT: APPROVE**
