# T-083 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** fix S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `runTurnStartClock` echoes `turnIndex` | **false** | `TurnClockSystem.ts:253` already does `input.turnIndex + 1` |
| Nobody increments T | **false** | `processUpkeep` persists `clock.turnIndex` (`PlayerTurnSystem.ts:342`); live writes it (`useCombat.ts:991`) |
| `createCombatState` does not call `resetCombatFrontier` | **false** | `CombatWorkflowSystem.ts:161` → `applyEncounterReset([])` → `resetCombatFrontier` |
| Player skills stay locked across fights | **false for live** | `useCombat.ts:578` calls `resetCombatFrontier` on `preparedPlayer.skills` (out of scope to retouch) |
| AC test exists | **true** | `src/game/systems/__tests__/t083TurnIndex.test.ts` |

## Complexity premise

The clock increment and encounter reset are already in R0. Remaining work is lock-in: keep the AC test, add a sim probe that measures echo-vs-increment CD unlock, changelog, close.

`createCombatState` has no skill list. `applyEncounterReset` is the skill-bearing hook; live `startCombat` already resets via `resetCombatFrontier`. Do **not** change `useCombat` (spec out of scope).

## Port signatures

No port signature change. Stay Ring 0.

## Layers

R0: `TurnClockSystem.runTurnStartClock`, `CombatWorkflowSystem.createCombatState` / `applyEncounterReset`.
R3: `src/simulation/TurnIndexBalance.ts` probe (measure only).
