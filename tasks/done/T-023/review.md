# T-023 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- AC1: Wire from MEDIUM plants `off_balance`, PULL → CLOSE, `playerMoveUsedThisTurn` stays false.
- AC2: Off-Balance → `floor(10 * 1.20) = 12`; mark consumed on hit and on full miss.
- AC3: Exposed boosts RANGED `floor(10 * 1.15) = 11`, melee stays 10; Blastback CLOSE → MEDIUM; Backstep CLOSE → MEDIUM without voluntary spend.
- Marks planted after attempt-consume (same card does not eat its own Off-Balance). IMPACT skipped on miss.
- Mode `damageMultBonus` stays separate from mark-id mults.

## Architecture

- RING-GUARD PASS: `types.ts` + `ResolveSkillSystem` + three tool rows stay R0. No React/UI.
- Reuses `addMark`, `consumeOnAttempt`, `resolveForcedMove`. No new port.

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: `intent.movement` + authored `bandMove.steps` share the step loop. Live `useSkill` still out of scope.
