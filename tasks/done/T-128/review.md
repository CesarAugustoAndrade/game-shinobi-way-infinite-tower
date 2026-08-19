# T-128 review

**Verdict:** APPROVE

## Spec conformance

| AC | Result |
|---|---|
| AC1 SUPPORT AP2/CP6/CD5 + 80% Bound 1, not STUN+REFLECT | PASS |
| AC2 plant Bound 1 on rng success; fail plants nothing; no Stun | PASS |
| AC3 ATTACK ×1.2 Setup consume on hit; miss keeps; SIDE ignores | PASS |

RING-GUARD: authoring + `controlBound` + Bound board convention. No UI imports.

## Architecture

- R0 `types.ts` `ControlBoundSpec` (Bound ≠ Stun) + `skills.ts` + `ResolveSkillSystem` plant/Setup. Reuses control chance plant + `wire_trap` ATTACK ×1.2 IMPACT consume. Movement lock absent → OOS.

## Quality

- BLOCK: none
- SHOULD: none
- NIT: none.

## Out of scope

Untouched: Bound movement-lock subsystem; kawarimi; c4; edo; copy; Temple/Killing Intent; live UI; SOUL.
