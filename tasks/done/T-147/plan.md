# T-147 · plan

**Ring:** R3 · **auto-approved**

Before sim `shiftRange`, call `enemyVoluntaryMoveBlocked(ctx.marks)`. Blocked → skip shift, no “Closes in” log. Add `marks: Mark[]` default `[]`.

## Files

1. `src/simulation/BattleSimulator.ts`
2. `src/simulation/__tests__/t147BoundSimParity.test.ts`
3. `src/simulation/BoundSimParityBalance.ts` + `index.ts`
4. `CHANGELOG.md`

## Steps

### 1. Gate (AC1–AC3)

Export `applySimEnemyVoluntaryMove(range, moveDirection, marks)` wrapping helper + `shiftRange`. `executeEnemyTurn` uses it. Init `marks: []`.

Tests:
- `T-147 blocked` — bound mark + RETREAT from CLOSE → still CLOSE
- `T-147 free` — no mark + RETREAT from CLOSE → MEDIUM
- `T-147 wired` — BattleSimulator.ts contains `enemyVoluntaryMoveBlocked`

### 2. Sim probe: bound range unchanged vs free MEDIUM.

## Risks

1. CLOSE+APPROACH does not move — tests use RETREAT.
2. Sim still does not plant Bound from Shadow Possession (AC seeds marks). Note follow-up.
