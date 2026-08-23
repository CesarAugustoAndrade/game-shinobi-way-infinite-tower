# T-147 · research

SOUL §15: sim uses the same Bound physics as live. T-132 helper is the contract.

**Options**

1. **Gate `plan.moveDirection` with `enemyVoluntaryMoveBlocked(ctx.marks)`.** Add `marks: Mark[]` default `[]` on BattleContext. Export a thin `applySimEnemyVoluntaryMove` for tests. (recommended)
2. New Bound engine in sim — forbidden.
3. Rewrite CombatSimulationService enemy turn — L / OOS.

**Recommendation:** option 1. Tests seed marks on ctx. Do not change helper semantics.

OOS: CombatSimulationService AI rewrite; feeding Bound from Shadow Possession resolve into sim ctx (follow-up).
