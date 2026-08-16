# T-083 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

R0 clock already increments T and `createCombatState` already calls `resetCombatFrontier` via `applyEncounterReset`. Do not re-design. Do not touch `useCombat`. Dual-write `currentCooldown` stays.

## Files

1. Keep `src/game/systems/TurnClockSystem.ts` increment (`turnIndex + 1`). No echo.
2. Keep `src/game/systems/CombatWorkflowSystem.ts` `applyEncounterReset` + empty-skill reset on `createCombatState`.
3. Keep `src/game/systems/__tests__/t083TurnIndex.test.ts` AC1–2.
4. `src/simulation/TurnIndexBalance.ts` + `index.ts` — echo vs increment CD unlock probe.
5. `CHANGELOG.md` [Unreleased].

## Tests

`npm test -- src/game/systems/__tests__/t083TurnIndex.test.ts`

## Out of scope

Kill `currentCooldown`. Edit `useCombat`. Multi-turn sim service clock (note only).
