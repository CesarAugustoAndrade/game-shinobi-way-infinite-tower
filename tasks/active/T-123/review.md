# T-123 review

**Verdict:** APPROVE

## Spec conformance

| AC | Result |
|---|---|
| AC1 authoring ATTACK AP6 CD99 mutualKo 0.35, not AP2 | PASS |
| AC2 36/100 → `hp-threshold`, pools unchanged | PASS |
| AC3 35/100 both HP 0; second cast `not-ready` | PASS |

Live Guts skip unchanged (`useSkill` mutualKo return before `applyGutsIfLethal`). Pure path zeros both HP so Guts cannot leave 1.

## Architecture

- R0 gate + KO short-circuit. Adapter only adds `enemyMaxHp`. RING-GUARD: no React/UI imports.

## Quality

- BLOCK: none
- SHOULD: none
- NIT: none.

## Out of scope

Untouched: c4, kawarimi, edo, copy, global Guts formulas, live UI.
