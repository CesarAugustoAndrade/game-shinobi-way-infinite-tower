# T-124 review

**Verdict:** APPROVE

## Spec conformance

| AC | Result |
|---|---|
| AC1 authoring SUPPORT AP1/CP1/CD4 base 0, Counter 30%, SIDE +1 | PASS |
| AC2 plant self mark 30 + pending SIDE +1; damageDealt 0 | PASS |
| AC3 no instant 8; SIDE bag one-shot; ATTACK weight unchanged | PASS |

No new reflect engine. RING-GUARD: authoring-only.

## Architecture

- R0 `skills.ts`. Reuses Rotation self-mark + SupportWeight bag.

## Quality

- BLOCK: none
- SHOULD: none
- NIT: none.

## Out of scope

Untouched: kawarimi, c4, edo, posture cards, live MELEE mit rewrite, SOUL, live UI.
