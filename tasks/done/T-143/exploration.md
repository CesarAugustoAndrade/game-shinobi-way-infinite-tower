# T-143 · exploration

**Ring:** R0 (EnemyTurnSystem + existing `applySubstitutionIncoming`). No port signature break.

## Spec premises vs code

- T-129 helper `applySubstitutionIncoming` zeros damage>0, strips player `substitution`, `retreatSteps: 1`, `range = applyForcedMove(range, 'PUSH')`. `damage <= 0` does not consume.
- Grep helper only in `t129Kawarimi` — **not** `EnemyTurnSystem`.
- Live incoming path (`executeEnemyAction` ~557): `applyOutgoingMarkCuts` → `absorbWithShieldMarks` → lethal. No substitution.
- `range` local already written back as `currentRange` on the action result. `playerMoveUsedThisTurn` is on combatState, not mutated by executeEnemyAction.
- T-135/T-141 live tests call `executeEnemyAction` with AUTO skill + marks.

## Relevant files

| Path | Why |
|---|---|
| `MarkSystem.ts` ~178 | helper to reuse |
| `EnemyTurnSystem.ts` ~557 | incoming hit after outgoing cuts |
| `t129Kawarimi.test.ts` | plant + pure helper |
| `t135ShieldMarksLive.test.ts` | live `executeEnemyAction` fixture |

## Surprises

- Shield after substitution: if shield runs first, a fully absorbed hit is `damage 0` and would **not** consume Substitution (helper rule). Spec wants first offensive with damage>0 ignored — call **after** outgoing cuts, **before** shield.
- Forced retreat is PUSH toward LONG; CLOSE→MEDIUM. Do not set `playerMoveUsedThisTurn`.
