# T-042 · review

**Verdict:** APPROVE

## Spec conformance

- AC1: ATTACK AP3/CP6/CD4/HP0, 15 dmg, `controlConfusion` 0.65/2, `setupRead` read_mind +0.5 consume false. Legacy Confusion 3@1.0 / AP2 identity gone.
- AC2: no mark → 15; Confusion only `rng() < 0.65`; miss plants nothing.
- AC3: `read_mind` present → 22; duration/stacks unchanged; empty Mode board.

## Architecture

- R0 only for domain. `setupRead` is mark-only; does not overload `modeInteraction`.
- Immutability: mark filter returns a new array; fixture array identity asserted.
- RING-GUARD: no React / components / scenes / hooks / contexts in touched R0 files.

## Quality

- BLOCK: none
- SHOULD: none
- NIT: live `BattleSimulator` still ignores `setupRead` / `controlConfusion` on ATTACK (applies `effects` only) — OOS, same as T-041 SUPPORT path. Probe covers resolve.

Cycles: 0 fix.
