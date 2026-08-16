# T-002 · plan

**Ring:** R0 · **Route:** autonomous · **Estimate:** S (pure-core)  
**Worktree:** `.worktrees/T-002` · **Branch:** `task/T-002`  
**HUMAN CHECKPOINT (R0):** auto-approved 2026-08-12 by standing automatic `/task-dev` loop (coherent with spec).

## Design decision

New pure module `src/game/systems/TurnClockSystem.ts` is the single source of truth for phase order and `readyOnTurn`. Do **not** rewrite `processUpkeep` (toggle + AP + `drawNewTurnHand` stay). Optional `Skill.readyOnTurn`. Frontier type holds skills + Modes + Marks. `resetCombatFrontier` is what combat-start callers must use; light-wire `createCombatState` empty collections and sim start CD reset through that helper (behavior-preserving).

## Implementation steps (1 implementer, TDD)

### Step 1 — AC tests
- **Files:** `src/game/systems/__tests__/t002TurnClock.test.ts`
- Cases: `T-002 cooldown 2`, `T-002 upkeep before regen`, `T-002 encounter reset`
- Also pin `TURN_PHASE_ORDER` and HP-upkeep floor (HP would go below 1 → Mode off, no pay).

### Step 2 — Types
- **Files:** `src/game/types.ts` (`readyOnTurn?: number` on `Skill`, comment: 0/omit = ready)
- Optional on `CombatState`: `turnIndex?`, `activeModes?`, `marks?` so fixtures stay valid.

### Step 3 — `TurnClockSystem.ts`
- `TurnPhase` enum + `TURN_PHASE_ORDER`
- `computeReadyOnTurn(T, N) => T+N+1`
- `isSkillReadyOnTurn(readyOnTurn, T)`
- `markSkillUsedOnTurn(skill, T)` immutable
- `resolveModeUpkeep` — priority order; fail ends that mode (cooldown starts); later modes still attempt; HP floor 1
- `applyTicksRegen` — after upkeep only
- `decrementSupportAndMarkDurations` — no-op if empty
- `virtualDiscardHand`
- `runTurnStartClock` — phases 1–4 in order, records `phasesRun`
- `resetCombatFrontier`

No React/DOM. No import of components/scenes/hooks/contexts. No `Math.random`.

### Step 4 — Light live call sites (behavior-preserving)
- `createCombatState`: `turnIndex: 1`, `activeModes: []`, `marks: []`
- `CombatSimulationService` combat start: skills via `resetCombatFrontier` instead of inline `currentCooldown: 0`
- **Do not** change `processUpkeep` toggle/regen order or `currentCooldown` decrement math.

### Step 5 — gates
- RING-GUARD, `tsc`, `vitest` t002 + full suite
- `npm run simulate:quick` — expect identical WR/TTK (clock unused by live AI)

## Out of scope

Deck rewrite, full Mode machine, Mark consume, catalog, UI, processUpkeep rewrite, R3 sim metrics.

## Risks

1. Changing `currentCooldown` formula — **forbidden** this slice.
2. Making CombatState fields required — fixtures explode. Keep optional + defaults in `createCombatState`.
3. Mapping toggle upkeep to Mode hook — do not; different contract.

## Implementer split

Single implementer in `.worktrees/T-002`.

## Status

`auto-approved` — IMPLEMENT.
