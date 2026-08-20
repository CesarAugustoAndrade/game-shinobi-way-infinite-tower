# T-134 · plan

**Ring:** R0 · **auto-approved**

`reflectPercentFromMarks`: self `counter_reflect` / `rotation_reflect`, percent = stacks/100, max stacks wins, strip in returned marks. Counter eligible on MELEE (or unspecified); Rotation always. EnemyTurn prepends temp REFLECTION buff; consume marks only if `hit.reflectedDamage > 0`. Filter temp buff off lasting player buffs. No skill reauthor.

## Files

1. `MarkSystem.ts` — helper + ids
2. `EnemyTurnSystem.ts` — one call beside outgoing cuts
3. `t134ReflectMarksLive.test.ts`
4. `ReflectMarksLiveBalance.ts` + `index.ts`
5. `CHANGELOG.md`
