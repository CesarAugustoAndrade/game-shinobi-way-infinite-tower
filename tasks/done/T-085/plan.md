# T-085 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

CombatState already has the fields. `buildUpkeepWeightContext` already consumes into `WeightContext`. Make `processUpkeep` return the emptied bag so consume is once.

## Files

1. `src/game/systems/combat-types.ts` — `UpkeepResult.pendingSupportWeights` + `pendingDiscover`.
2. `src/game/systems/PlayerTurnSystem.ts` — return emptied bag; pass through Discover.
3. `src/hooks/useCombat.ts` — write those fields after upkeep (live consume-once).
4. `src/game/systems/__tests__/t085LiveWeights.test.ts` — assert emptied bag after processUpkeep.
5. `src/simulation/LiveWeightsBalance.ts` + `index.ts` — +2 weight vs second-upkeep empty.
6. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t085LiveWeights.test.ts`

## Out of scope

Discover UI. useSkill cutover. Do not re-implement consume.
