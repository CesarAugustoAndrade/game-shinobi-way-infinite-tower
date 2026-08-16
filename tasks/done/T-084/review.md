# T-084 review

**SPEC CONFORMANCE: 93/100.** Live enemy band change fires `fireOnMoveReactions` (ON_MOVE trigger or tripwire id) with 8 chip + 60% Stun 1. Live hit runs `applyOutgoingMarkCuts` (Fear → Smoke → Read Window). AC tests pass. `EnemyTurnResult.marks` now official.

**ARCHITECTURE: PASS.** RING-GUARD: no R0 React/UI imports. `resolveSkill` untouched. Stun-mark vs stun-buff residual documented.

**QUALITY:** NIT — `useCombat` still does not persist `result.marks` (R2 residual). Player `collectRangeReactions` still void (player movers ignored by tripwire).

**VERDICT: APPROVE**
