# T-083 review

**SPEC CONFORMANCE: 94/100.** `runTurnStartClock` returns `input.turnIndex + 1`. Two clocks do not leave T equal. Encounter reset via `applyEncounterReset` / `createCombatState` leaves skills ready (`readyOnTurn` 0 or ≤ 1). AC2 `createCombatState()` pool is empty (vacuous `.every`); the skill-bearing case is asserted on `applyEncounterReset`.

**ARCHITECTURE: PASS.** RING-GUARD: no R0 React/DOM/UI imports. `useCombat` untouched. `currentCooldown` dual-write kept.

**QUALITY:** NIT — AC2 empty-pool `.every` is weak; helper covers the locked-skill case. SHOULD not: do not fold live `startCombat` into `createCombatState` this task.

**VERDICT: APPROVE**
