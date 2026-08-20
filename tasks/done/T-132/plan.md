# T-132 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Bound movement-lock: enemy-targeted `bound` blocks **voluntary** APPROACH and RETREAT. Water Prison stay RETREAT-only. Forced/card `applyForcedMove` ungated. No `shadow_possession` reauthor. Bound ≠ Stun (no skip turn). Gate does not consume.

## Files

1. `src/game/systems/RangeSystem.ts` — `BOUND_MARK_ID` + `enemyVoluntaryMoveBlocked` (R0)
2. `src/game/systems/EnemyTurnSystem.ts` — skip voluntary `shiftRange` when blocked (R0)
3. `src/game/systems/__tests__/t132BoundMovementLock.test.ts` — AC1–3
4. `src/simulation/BoundMovementLockBalance.ts` + `index.ts` — probe
5. `CHANGELOG.md`

## Helper

```
enemyVoluntaryMoveBlocked(marks):
  true iff some mark id === 'bound' && target === ENEMY
```

Document vs Water Prison: Bound = all voluntary dirs / enemy target; Water Prison = RETREAT / player lock id.

## Enemy turn

In `executeEnemyAction`, if `plan.moveDirection` and `enemyVoluntaryMoveBlocked(actionMarks)`: do not `shiftRange`, do not spend move AP, do not set `enemyMoveUsed`, do not fire ON_MOVE. Skill/Guard still proceeds (not Stun).

## Tests

- AC1 gate: bound → blocked; empty → not; water_prison_lock does not trip this helper; APPROACH and RETREAT both blocked.
- AC2: `processEnemyTurn` CLOSE + ranged skill → without Bound range MEDIUM; with Bound range CLOSE.
- AC3: gate leaves mark; no STUN required; `applyForcedMove` still PUSH; player `voluntaryPlayerMove` still works with enemy Bound.

## Sim

Free CLOSE→MEDIUM vs locked CLOSE; leftover Bound stacks; water prison still retreat-only.

## Split

Single implementer.

## Out of scope

copy_jutsu; C4/Kawarimi/Edo; T-128 Setup retune; BattleSimulator duplicate path; player self-Bound; UI; SOUL.
