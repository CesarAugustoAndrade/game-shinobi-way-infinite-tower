# T-084 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** fix M (narrow)

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `collectRangeReactions` called without sources | **true on player move only** | `PlayerTurnSystem.ts:408` voids the hook. Enemy path does not use it. |
| `fireTripwireOnEnemyMove` never enters live move | **false** | `EnemyTurnSystem.ts:376` `fireOnMoveReactions` after a real band change |
| Fear/Smoke/ReadWindow only in probes | **false** | `EnemyTurnSystem.ts:515` `applyOutgoingMarkCuts` on a successful hit |
| ON_MOVE is id===tripwire only | **false** | `MarkSystem.ts:309` trigger ON_MOVE **or** tripwire id |
| AC test exists | **true** | `t084LiveReactions.test.ts` (2 tests, passing) |

## Complexity premise

Live R0 path is already written. Remaining: lock ACs, official `EnemyTurnResult.marks`, sim probe vs uncut outgoing / no-tripwire.

Player `collectRangeReactions(...)` without sources is leftover T-006; tripwire ignores player movers. Do **not** wire player move this task.

## Residual (out of ring)

`useCombat` processEnemyTurn path does not write `result.marks` back to `combatState` (hooks R2). Fear consume is correct in R0; live React may re-apply stale marks. Note only.

## Port signatures

No React. Adding optional `marks` on `EnemyTurnResult` documents the field `buildTurnResult` already returns. Stay Ring 0.
