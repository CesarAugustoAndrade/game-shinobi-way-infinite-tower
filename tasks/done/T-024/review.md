# T-024 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- AC1: enemy `moved: true` → 8 dmg (40→32), tripwire consumed.
- AC2: LONG RETREAT `moved: false` → 0 dmg, mark remains.
- AC3: `rng() < 0.6` plants HARD_CONTROL Stun 1 (`resolveHardControlSkips === 1`); `rng() >= 0.6` no stun; player move does not fire.
- First tripwire only. Marks are the source of truth.

## Architecture

- RING-GUARD PASS: `MarkSystem` stays R0. Imports `shiftRange` from `RangeSystem` (R0). No React/UI.
- No new port. Live EnemyTurn not touched (out of scope).

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: live EnemyTurn still does not call the helper (explicitly out of scope).
