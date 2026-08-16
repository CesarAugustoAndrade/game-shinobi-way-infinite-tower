# T-037 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- **AC1 authoring:** PASS — `HELL_VIEWING` ATTACK AP2/CP6/CD4 base 18. `markEffects` `fear` duration 1 stacks 20 STAT enemy. No STR −30%×3.
- **AC2 plant:** PASS — hit → `damageDealt: 18`, enemy Fear duration 1 stacks 20. Miss plants nothing (`perHit`).
- **AC3 fear mult:** PASS — `applyFearOutgoing(100)` → 80 and Fear gone; no mark → 100.
- **Mind Transfer:** PASS — t036 still green.

## Architecture

- RING-GUARD PASS: R0 `skills.ts` + `MarkSystem.ts`. No React/UI.
- Fear is not IMPACT (player hits would consume it). Live EnemyTurn consume OOS (helper is the contract).

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: EnemyTurnSystem does not yet call `applyFearOutgoing`.

## Out of scope

- Live enemy-turn Fear apply; auto Main assign; Mind Transfer retune.

## Verdict rationale

Authoring, plant-on-hit, and −20% helper match catalog. APPROVE → verify.
