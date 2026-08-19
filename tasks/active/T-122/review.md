# T-122 review

**Verdict:** APPROVE

## Spec conformance

| AC | Result |
|---|---|
| AC1 authoring ATTACK AP6/CP27/CD8 45 LONG + 3T/Burn hard, not ARMOR_BREAK 15 | PASS |
| AC2 hit 45, 3T closed, Burn gone; CLOSE reject | PASS |
| AC3 no Mode/2T → mode-required; no Burn → mark-required no spend; miss keeps Burn, Mode closed | PASS |

`requireMarkHard` is opt-in. Twin Lion `requireMarkHard` undefined. No skill-id branch.

## Architecture

- R0: types + validate + authoring. RING-GUARD: no React/UI imports.

## Quality

- BLOCK: none
- SHOULD: none
- NIT: none.

## Out of scope

Untouched: c4, kawarimi, edo, copy_jutsu, Amaterasu/Tsukuyomi retune, SOUL, live UI.
