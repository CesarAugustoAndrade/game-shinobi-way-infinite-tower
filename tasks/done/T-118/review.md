# T-118 review

**Verdict:** APPROVE

## Spec conformance

| AC | Result |
|---|---|
| AC1 authoring ATTACK AP2/CP5/CD3 2×7 CLOSE, no modeInteraction, not single-13 | PASS |
| AC2 both hits, Setup inactive → 14; MEDIUM reject | PASS |
| AC3 enteredCloseThisTurn true → floor(14×1.15)=16; false/unset → 14 (not always-on) | PASS |

`cloneState` copies `enteredCloseThisTurn`. Setup is Setup-bucket, not posture. No movement-history motor.

## Architecture

- R0: Skill field + optional state flag + apply next to `bandMovedSetup` (hit-core preMits and rollHit floor path).
- RING-GUARD: no React/components/scenes/hooks/contexts imports. No port signature change.

## Quality

- BLOCK: none
- SHOULD: none
- NIT: live combat does not yet write `enteredCloseThisTurn` (voluntary approach / SELF_APPROACH). Documented OOS.

## Out of scope

Untouched: kirin, bone_drill, kawarimi, c4_karura, shadow_possession, SOUL, live UI, full movement history.
