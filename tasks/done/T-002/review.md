# T-002 · review

**Verdict:** APPROVE  
**Ring:** R0 · **Route:** autonomous

## Objective AC

| AC | Result |
|---|---|
| RING-GUARD | PASS — `TurnClockSystem` imports only `../types`. Other R0 call sites (`CombatWorkflowSystem`, `CombatSimulationService`, `combat-types`) stay R0. No React/DOM/R2. |
| typecheck | PASS |
| AC1 cooldown 2 | PASS — `T-002 cooldown 2` |
| AC2 upkeep before regen | PASS — `T-002 upkeep before regen` |
| AC3 encounter reset | PASS — `T-002 encounter reset` |

## Design

- Normative readiness is `isSkillReadyOnTurn`. Live `currentCooldown` decrement untouched.
- Mode hook is not toggle upkeep rewrite.
- `resetCombatFrontier` used at sim combat start (same CD-zero).
- HP floor 1 covered.

## Out of scope (correct)

processUpkeep rewrite, deck, Mode machine, Mark consume, UI, R3 sim files.

## Cycles

0 FIX.
