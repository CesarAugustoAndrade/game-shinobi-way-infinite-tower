# T-132 exploration

**Ring:** R0 (no port signature change). Route: autonomous.

## Relevant files

- `src/game/systems/RangeSystem.ts` — `voluntaryRangeIncreaseBlocked` only `water_prison_lock` + RETREAT. `shiftRange` / `applyForcedMove` ungated.
- `src/game/systems/EnemyTurnSystem.ts` `executeEnemyAction` ~367 — `plan.moveDirection` → `shiftRange` with **no** Bound check. Marks from `combatState.marks`.
- `src/game/systems/PlayerTurnSystem.ts` ~384 — player voluntary uses Water Prison helper only.
- `src/game/systems/ResolveSkillSystem.ts` `BOUND_ID = 'bound'` — T-128 plants enemy HARD_CONTROL IMPACT-consume.
- `src/game/systems/EnemyAISystem.ts` — `planEnemyAction` can set `moveDirection` (reachable 1-band skill or preferred+Guard).
- `src/game/systems/__tests__/t080WaterPrison.test.ts` — retreat-only lock + `voluntaryPlayerMove`.
- `src/game/systems/__tests__/t128ShadowPossession.test.ts` — Bound plant id/target.
- `src/game/systems/__tests__/EnemyTurnSystem.test.ts` — `processEnemyTurn` fixtures.
- `src/simulation/BattleSimulator.ts` — **separate** `executeEnemyTurn` also `planEnemyAction`+shift (not EnemyTurnSystem). Spec AC is EnemyTurn.

## Ports / reuse

- New `enemyVoluntaryMoveBlocked(marks)` in RangeSystem (all directions; enemy `bound`).
- Do **not** fold into `voluntaryRangeIncreaseBlocked` (that is player RETREAT + water_prison_lock).
- `applyForcedMove` / card `bandMove` stay ungated.
- Player voluntary unchanged by enemy Bound.

## Surprises

- Melee@LONG is **not** a 1-band candidate (`planMoveForSkill`); RANGED@CLOSE is (RETREAT → MEDIUM). Use that fixture for AC2.
- BattleSimulator duplicate move path will still shift unless a follow-up wires the helper (OOS).
- Bound consume remains IMPACT on ATTACK (T-128); gate must not strip.

**RE-CLASSIFY:** no. Stays R0.
