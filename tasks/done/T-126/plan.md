# T-126 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `DEFENSIVE_POSTURE` to SUPPORT ACTIVE AP1/CP3/CD5, `stanceShift: DEFENSIVE`, `baseDamage: 0`. Plant self `defensive_shield` stacks 25 duration 1 SHIELD. Drop TOGGLE / isToggle / upkeep / WIL-SPD %. Uzumaki kit: move from `toggle` to `active`.

## Files

1. `src/game/constants/skills.ts`
2. `src/game/constants/index.ts`
3. `src/game/systems/__tests__/t126DefensivePosture.test.ts`
4. `src/simulation/DefensivePostureBalance.ts` + `index.ts`
5. `CHANGELOG.md`

## Tests

`npm test -- src/game/systems/__tests__/t126DefensivePosture.test.ts`

## Split

Single implementer.

## Out of scope

aggressive_stance; focused retune; Brace retune; kawarimi; c4; live UI; SOUL.
