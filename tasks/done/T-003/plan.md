# T-003 · plan

**Ring:** R0 (+ R1/R3 call sites to delete deck/discard) · **Route:** autonomous  
**Worktree:** `.worktrees/T-003` · **Branch:** `task/T-003`  
**HUMAN CHECKPOINT:** auto-approved 2026-08-12 (standing automatic loop).

## Design

Rewrite `DeckSystem.ts` as full-pool weighted draw. Delete `reshuffle` and CombatState `deck`/`discard`. Weights via `effectiveWeight` + `cardRole` (never `getCardCategory`). Live catalog without `cardRole` gets posture +0 (incomplete authoring, not DPS guess). `getCardCategory` stays unused by draw (legacy tests). Remove `POSTURE_DRAW_WEIGHTS`.

## Steps

1. AC tests `t003WeightedDraw.test.ts` + invert `deckSystem.test.ts` reshuffle cases.
2. `DeckSystem`: pool, `effectiveWeight`, `drawHand(pool, ctx, size, rng)`, virtual-discard `drawNewTurnHand`, `discoverThree`, dead-hand no redraw.
3. Delete CombatState/UpkeepResult deck/discard; add `playablePool`.
4. Wire `processUpkeep`, `useCombat`, `BattleSimulator`, `createCombatState`.
5. Remove `weightFor` / `POSTURE_DRAW_WEIGHTS`. Invert combatCards weight tests.

## Out of scope

Mode machine, catalog cardRole authoring, R2 UI, enemy hand.
