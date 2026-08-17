# T-101 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Extend `SetupReadSpec` with `alsoIfEnemyStunned?: boolean`. Setup mult fires if enemy has `markId` **or** (flag + `enemyBuffs` STUN). Consume stays markId-only. Reauthor `SAND_BURIAL` to ATTACK AP3/CP6/CD3 18 M/L + setupRead coffined +0.5 consume + alsoIfEnemyStunned. Drop mute 15 / AP2 / low-HP execute.

## Files

1. `src/game/types.ts` — optional flag on `SetupReadSpec`.
2. `src/game/systems/ResolveSkillSystem.ts` — setupMult OR stun; no consume change.
3. `src/game/constants/skills.ts` — `SAND_BURIAL`.
4. `src/game/systems/__tests__/t101SandBurial.test.ts` — AC1–3.
5. `src/simulation/SandBurialBalance.ts` + `index.ts`.
6. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t101SandBurial.test.ts`

## Split

Single implementer.

## Out of scope

sand_coffin retune, puppet_crow, kawarimi, low-HP execute.
