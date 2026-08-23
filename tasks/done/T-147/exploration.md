# T-147 · exploration

**Ring:** R3 (`BattleSimulator.ts`). Reuse R0 `enemyVoluntaryMoveBlocked`. No R0 contract change.

## Spec premises vs code

- Live: `EnemyTurnSystem` `if (plan.moveDirection && !enemyVoluntaryMoveBlocked(actionMarks))`.
- Sim: `executeEnemyTurn` `if (plan.moveDirection) { shiftRange(...) }` — no Bound.
- `BattleContext` has no `marks` field.
- `CombatSimulationService` has no `planEnemyAction` / `shiftRange` — OOS document.

## Relevant files

| Path | Why |
|---|---|
| `BattleSimulator.ts` ~225, ~813, ~1012 | ctx + move branch + init |
| `RangeSystem.ts` `enemyVoluntaryMoveBlocked` | reuse |
| `t132BoundMovementLock.test.ts` | Bound mark fixture |

No port break.
