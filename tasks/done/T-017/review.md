# T-017 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- AC1: Armed discount + `gate_of_life` from hp 10 (cannot pay 15) succeeds; HP −7 (`Math.floor(15/2)`); AP 10→7 unchanged; pending cleared.
- AC2: hp 5 even-half fails (`hp-floor`), pending remains. `shadow_clone` pays full CP, pending remains.
- AC3: First Gate pays 7; second (echo false) pays full 15.
- `armGatePrepDiscount` / `onGatePrepPlayed` / `resetGatePrepDiscount` exist. Ascend/lateral untouched.

## Architecture

- RING-GUARD PASS: `GatePrepDiscountSystem` imports only `../types` + `../constants/modes`. Optional `activateMode` 5th arg; existing callers unchanged.
- No dual cost tables. No T-016 weight, no `gate_prep` reauthor, no invented deltas.

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: live play still cannot arm the flag (`gate_prep` lacks `cardRole`) — documented out of scope.
