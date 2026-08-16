# T-012 · exploration

**Ring:** R0 `processUpkeep` + R1 persist. No new formulas.

- `runTurnStartClock` (T-002) already does MODE_UPKEEP → REGEN → DRAW → DURATION. Unused by live `processUpkeep`.
- Live upkeep: toggle CP only, then regen, then `drawNewTurnHand`. `activeModes` / `marks` unused.
- `resolveModeUpkeep` already implements upkeep-before-regen and HP floor (`hp - cost < 1` → fail, no spend).
- `useCombat` applies player + AP/hand only; must also persist modes/marks/turnIndex.
- `CombatState` has optional `turnIndex`, `activeModes`, `marks`. No `modeUpkeepPriority` yet — add optional, fallback to active ids.
