# T-119 review

**Verdict:** APPROVE

## Spec conformance

| AC | Result |
|---|---|
| AC1 authoring ATTACK AP3/HP10/CD3 18 C/M, `penetration: 0.25`, not TRUE | PASS |
| AC2 CLOSE/MEDIUM hit 18, pay AP3/HP10; LONG reject; miss 0 still pays HP | PASS |
| AC3 40% def: 12 with pen > 10 zero-pen and ≠ 18 TRUE strip | PASS |

No skill-id special-case. Shared `applySkillPenetration`. FORBIDDEN tier and STR/WILL reqs kept.

## Architecture

- R0 authoring only in `skills.ts`. RING-GUARD: no React/UI imports. No port change.

## Quality

- BLOCK: none
- SHOULD: none
- NIT: none.

## Out of scope

Untouched: kirin, c4_karura, kawarimi, shadow_possession, tengai, new mit layers, SOUL, live UI.
