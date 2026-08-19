# T-125 review

**Verdict:** APPROVE

## Spec conformance

| AC | Result |
|---|---|
| AC1 SUPPORT ACTIVE AP1/CP3/CD5 Balanced, Focused 2, not TOGGLE | PASS |
| AC2 plant self focused duration 2; damage 0 | PASS |
| AC3 ATTACK consumes +20 crit path; SIDE keeps; no mark no bonus | PASS |

`spendMarks` decrements 1 stack — Focused uses stacks 1 + `FOCUSED_CRIT_POINTS = 20` (Cloak sibling). Hit-core adds those points to `critBonus`.

## Architecture

- R0 authoring + consume filter + one-line critBonus. Yamanaka loadout honesty. RING-GUARD clean.

## Quality

- BLOCK: none
- SHOULD: none
- NIT: none.

## Out of scope

Untouched: defensive_posture, aggressive_stance, kawarimi, c4, edo, live UI, SOUL.
