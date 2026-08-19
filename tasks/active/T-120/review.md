# T-120 review

**Verdict:** APPROVE

## Spec conformance

| AC | Result |
|---|---|
| AC1 authoring ATTACK AP5/CP11/CD4 27 ANY, pen 0.5, Spatial Tear, not TRUE+SPD | PASS |
| AC2 hit 27 any band; 40% def 21 > 16 zero-pen and ≠ 27 TRUE | PASS |
| AC3 Tear on resolve (miss too); next ATTACK +20% consume; SIDE keeps | PASS |

`spatial_tear` is its own id (not `off_balance`). Consume ATTACK-only like `barrage_setup`. Plant on resolve regardless of hit (documented).

## Architecture

- R0 authoring + one shared mult/consume row. RING-GUARD: no React/UI imports. No port change.

## Quality

- BLOCK: none
- SHOULD: none
- NIT: none.

## Out of scope

Untouched: kirin, c4, kawarimi, edo, tengai, copy_jutsu, SOUL, live UI.
