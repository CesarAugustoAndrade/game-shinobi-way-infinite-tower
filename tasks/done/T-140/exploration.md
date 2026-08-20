# T-140 · exploration

**Ring:** R0 (innermost StatSystem/MarkSystem). Live call site `useCombat` enemyStats is R1 overlay; getters remain optional `marks`.

## Spec premises vs code

- `applyBuffsToPrimaryStats` integer floor 1 — STAT Marks must match, not %.
- `getEnemyFullStats` / `getPlayerFullStats` had no marks param.
- Mis-tagged STAT (`aim`, `cloaked`, `decoy`) must not map — allowlist required.
- `useCombat` `enemyStats` useMemo was enemy-only; now also `combatState.marks`.

No port signature break for existing 0-arg callers (default `[]`).
