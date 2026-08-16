# T-084 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Live enemy move already fires ON_MOVE via `fireOnMoveReactions`. Live hit already cuts Fear → Smoke → Read Window. Do not re-design. Do not touch `resolveSkill` or stun-buff unification.

## Files

1. `src/game/systems/combat-types.ts` — add optional `marks` on `EnemyTurnResult` (already returned).
2. Keep `EnemyTurnSystem.ts` / `MarkSystem.ts` wiring.
3. Keep `src/game/systems/__tests__/t084LiveReactions.test.ts`.
4. `src/simulation/LiveReactionsBalance.ts` + `index.ts` — tripwire chip vs no-move; Fear once-cut vs clean outgoing.
5. `CHANGELOG.md` [Unreleased].

## Tests

`npm test -- src/game/systems/__tests__/t084LiveReactions.test.ts`

## Out of scope

Stun-mark vs stun-buff. `resolveSkill` hit math. `useCombat` persist (residual). Player `collectRangeReactions` sources.
