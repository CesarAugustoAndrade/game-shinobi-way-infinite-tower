# T-012 · plan

**Ring:** R0 (+ R1 persist) · **auto-approved**

`processUpkeep` builds `TurnClockInput` and calls `runTurnStartClock`. Regen amounts computed first (not applied). Board Mode upkeep uses T-005 `MODE_DEFINITIONS.upkeep`. Legacy toggles without a board Mode id keep the old CP path. R1 writes modes/marks/turnIndex. Tests `t012LiveTurnStart`. Sim probe.

## Steps

1. Extend `UpkeepResult` + optional `modeUpkeepPriority` on `CombatState`.
2. Rewrite `processUpkeep` to call `runTurnStartClock` (draw hook = `drawNewTurnHand`).
3. Persist new fields in `useCombat`.
4. AC tests + `LiveTurnStartBalance` probe + CHANGELOG.

## AC map

| AC | Step |
|---|---|
| AC1 upkeep before regen | 2, 4 |
| AC2 draw then duration | 2, 4 |
| AC3 HP floor | 2, 4 |
| RING-GUARD | R0 systems + R1 hook only |
