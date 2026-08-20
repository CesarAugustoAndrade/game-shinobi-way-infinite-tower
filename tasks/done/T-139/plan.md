# T-139 · plan

**Ring:** R0 · **auto-approved**

Refine `resolveHardControlSkips(setup, target?)`: count only `id === 'stun'` HARD_CONTROL (optional target filter); exclude Bound and other HARD_CONTROL; `Math.min(1, totalStacks)`. Companion `actorHasHardControlSkip`. `executeEnemyAction`: skip if buff STUN **or** enemy-targeted stun Mark. Invert T-004 ids to `stun`. No skill reauthor. No duration tick here.

## Files

1. `src/game/systems/MarkSystem.ts`
2. `src/game/systems/EnemyTurnSystem.ts`
3. `src/game/systems/__tests__/t004MarksSetup.test.ts` (invert ids)
4. `src/game/systems/__tests__/t139HardControlSkipLive.test.ts`
5. `src/simulation/HardControlSkipLiveBalance.ts` + `index.ts`
6. `CHANGELOG.md`
