# T-131 review

**Verdict:** APPROVE

## Spec conformance

- AC1: ATTACK AP5/CP18/CD6, `baseDamage: 0` (not 17), `c4` enemy mark duration 1 stacks 35, TRUE type kept for catalog payload.
- AC2: resolve plants enemy C4; `damageDealt === 0` on hit and miss (no `requireHit`).
- AC3: `resolveC4AtEnemyOpportunity` → 35 TRUE + consume; unarmed 0; `stripC4` removes without firing.
- Out of scope respected: no copy_jutsu/edo/kawarimi, no Kai rewrite, no EnemyTurn wire, no UI.

## Architecture

- R0 only. No React / UI imports. Helper is a new MarkSystem export, not a port change.
- `scalingPerPoint: 0` so live hit-core cannot sneak instant TRUE.
- STAT family (not DOT) so recurring DoT ticks will not fire C4.

## Quality

- BLOCK: none
- SHOULD: none
- NIT: live EnemyTurn start-of-opportunity one-liner still optional (T-074 bar). Medical/Kai remain player-target; `stripC4` is the AC3 cleanse path as spec allowed.

## RING-GUARD

PASS.
