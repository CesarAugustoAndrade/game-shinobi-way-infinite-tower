# T-132 review

**Verdict:** APPROVE

## Spec conformance

- AC1: `enemyVoluntaryMoveBlocked` true for enemy `bound`; false empty / player-target / water_prison_lock. Water Prison remains RETREAT-only.
- AC2: `processEnemyTurn` CLOSE + ranged → MEDIUM free; CLOSE locked with Bound; no move AP / ON_MOVE.
- AC3: Bound leftover; no Stun required; `applyForcedMove` PUSH still LONG; player voluntary RETREAT still works.
- Out of scope: no skill reauthor, no copy_jutsu/C4, Water Prison not retuned.

## Architecture

- R0 RangeSystem + EnemyTurnSystem. No React/UI.
- Bound ≠ Stun: action still proceeds.
- Forced/card path (`applyForcedMove`) ungated.

## Quality

- BLOCK: none
- NIT: `BattleSimulator.executeEnemyTurn` still shifts without the helper (duplicate R3 path; spec AC is EnemyTurn). Follow-up candidate.

## RING-GUARD

PASS.
