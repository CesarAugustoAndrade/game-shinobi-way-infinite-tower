# T-012 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- AC1: live `processUpkeep` ends a Mode when current CP < upkeep even if same-turn regen would cover it.
- AC2: hand of 4 then duration-1 Mark removed.
- AC3: HP upkeep ≥ current HP ends Mode; `currentHp >= 1`.
- Board Modes skip the legacy toggle-CP path (`isBoardTrackedMode`). Untracked toggles remain.
- R1 `useCombat` persists `activeModes`, `marks`, `turnIndex` immutably. Draw stays `drawNewTurnHand`.

## Architecture

- RING-GUARD PASS: R0 `PlayerTurnSystem` / `combat-types` have no React/DOM/UI imports. R1 hook only projects state. R3 sim probe only.
- Clock is T-002 `runTurnStartClock`; no new Mode/draw formulas.

## Quality

- BLOCK: none.
- SHOULD: BattleSimulator still mirrors old toggle upkeep (out of scope; T-009 residual).
- NIT: sim probe imports `testFixtures` from `__tests__` (acceptable for a fixture probe).
