# T-026 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- **AC1 authoring:** `air_palm` is `cardRole: SIDE_ATTACK` with `markEffects: chakra_point` (duration 2, IMPACT, `perHit`, STAT) and `bandMove: PUSH 1`. Honest description. No `modeInteraction`. Costs unchanged.
- **AC2 hit + PUSH + no spend:** 1 landed hit plants 1 CP; MEDIUM → LONG; `playerMoveUsedThisTurn` stays false; Byakugan charges remain 4. IMPACT plants run **after** `consumeOnImpact` so Air Palm does not self-consume.
- **AC3 miss / multi:** full miss plants no CP (PUSH still once per card, T-023 pattern). `hitCount: 2` clone STAT-merges to one mark with stacks 2.

## Architecture

- RING-GUARD PASS: touched R0 (`skills.ts`, `types.ts`, `ResolveSkillSystem.ts`) has no React/DOM or `components`/`scenes`/`hooks`/`contexts` imports.
- Reuses T-023 `markEffects` + `bandMove` + `addMark`. No new port. Live `useSkill` not cut over (out of scope).

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: no dedicated PUSH@LONG identity assertion (covered by existing `resolveForcedMove` / T-006). Live combat still does not call this path (explicitly out of scope).
