# T-129 review

**Verdict:** APPROVE

## Spec conformance

| AC | Result |
|---|---|
| AC1 SUPPORT AP1/CP3/CD4 + substitution 2, not SHIELD 30 / SPEED 0.3 | PASS |
| AC2 plant self substitution duration 2; `damageDealt === 0` | PASS |
| AC3 helper zeros damage, strips, `retreatSteps: 1`; unarmed passthrough | PASS |

RING-GUARD: `skills.ts` + `MarkSystem.ts` only in R0. No React / components / scenes / hooks / contexts imports.

## Architecture

- R0 reauthor + `applySubstitutionIncoming` mirroring `applyDecoyOutgoing` with self-target, full ignore, retreat flag. Existing `markEffects` plant path; no new resolve branch. Not added to `applyOutgoingMarkCuts` (T-074 bar).

## Quality

- BLOCK: none
- SHOULD: none
- NIT: live EnemyTurn still ignores substitution (documented follow-up, same as decoy).

## Out of scope

Untouched: live EnemyTurn mit rewrite; edo / c4 / copy; PASSIVE reauthors; live UI; SOUL; DEFENSE/MOVEMENT tag enum.
