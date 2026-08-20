# T-142 · research

SOUL §9 + §7: C4 1 detonates 35 TRUE at the **start of the next enemy opportunity** and consumes. T-131 helper is the contract. Stun/Silence must not cancel it.

**Options**

1. **Call helper at `processEnemyTurn` Phase 1** (recommended), before DoT ticks / before `executeEnemyAction`. Direct HP subtract of `trueDamage` (35), persist returned marks. Same site as enemy DoT opportunity. Stun skip later does not cancel.
2. Call at start of `executeEnemyAction` before stun return — also stun-safe, but misses the documented DoT opportunity site; tests that only call `executeEnemyAction` would fire, tests of full turn would too if both wired (double-count). Spec wants **one** call.
3. Route 35 through `calculateDamage` TRUE — CESAR ×2 → 70. Anti-catalog.

**Recommendation:** option 1. Reuse T-131 helper. No skill reauthor. No second engine.

OOS: copy_jutsu, Discover UI, COOLDOWN_RESET, DoT rewrite, CESAR on C4.
