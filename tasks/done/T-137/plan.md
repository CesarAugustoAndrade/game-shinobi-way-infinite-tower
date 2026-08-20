# T-137 · plan

**Ring:** R0 · **auto-approved**

`tickDotMarksForActor(marks, target)`: sum `stacks` for DOT family + matching target; clone marks unchanged. EnemyTurn Phase 1: enemy DoT → enemy HP. Phase 2: player DoT → `absorbWithShieldMarks` then player HP. Pass updated marks into executeEnemyAction. Stun fixture for AC3 so no attack noise. No skill reauthor.

## Files

1. `MarkSystem.ts`
2. `EnemyTurnSystem.ts`
3. `t137DotMarksLive.test.ts`
4. `DotMarksLiveBalance.ts` + `index.ts`
5. `CHANGELOG.md`
