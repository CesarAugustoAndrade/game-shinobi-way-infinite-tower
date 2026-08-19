# T-123 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `REAPER_DEATH_SEAL` to ATTACK AP6/CP0/CD99, `mutualKo: true`, `mutualKoMaxHpFraction: 0.35`, AUTO/ANY, honest description. Keep TRUE 0 (not a damage nuke).

`validateIntent`: if fraction authored and `enemyHp / enemyMaxHp > cap` → `'hp-threshold'`, no spend.

`resolveSkill` after costs: mutualKo zeros player HP and enemy HP; `damageDealt` = pre-seal enemy HP.

`toResolveSkillState` passes `enemyStats.derived.maxHp`. Live mutualKo branch stays (Guts already skipped).

Once/combat: CD 99 + readyOnTurn.

## Files

1. `src/game/types.ts`
2. `src/game/systems/ResolveSkillSystem.ts`
3. `src/game/systems/PlayerTurnSystem.ts`
4. `src/game/constants/skills.ts`
5. `src/game/systems/__tests__/t123ReaperDeathSeal.test.ts`
6. `src/simulation/ReaperDeathSealBalance.ts` + `index.ts`
7. `CHANGELOG.md`

## Tests

`npm test -- src/game/systems/__tests__/t123ReaperDeathSeal.test.ts`

## Split

Single implementer.

## Out of scope

c4; kawarimi; edo; copy; global Guts retune; live UI.
