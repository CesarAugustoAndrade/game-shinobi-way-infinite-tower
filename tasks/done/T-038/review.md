# T-038 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- **AC1 authoring:** PASS — SUPPORT AP1/CP0/CD3 base 0. Smoke duration 2 stacks 25. `nextDrawRoleBonus` SIDE +1. No SPEED/ACC %.
- **AC2 mark + weight:** PASS — resolve plants smoke, enqueues SIDE +1, `effectiveWeight` SIDE +1 once, second consume empty. `applySmokeOutgoing(40)` → 15.
- **AC3 isolation:** PASS — ATTACK weight unchanged under SIDE +1 bag.
- **T-016:** PASS — skillId path + probe still true.

## Architecture

- RING-GUARD PASS: R0 types, SupportWeightSystem, DeckSystem, skills, MarkSystem. No React.
- Role bag is data-driven (`nextDrawRoleBonus`). No Terrain. No baseWeight mutation.

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: live EnemyTurn does not call `applySmokeOutgoing`.

## Out of scope

- Predict, False Surroundings, live enemy apply.

## Verdict rationale

Authoring, one-shot SIDE +1, and ATTACK isolation match catalog without breaking T-016. APPROVE → verify.
