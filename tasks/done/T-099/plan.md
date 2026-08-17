# T-099 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `WATER_DRAGON` to ATTACK AP3/CP6/CD4 18 M/L + `setupRead` mist +0.2 `consume: false`. Drop mute base 15 / AP2. Do **not** change ResolveSkill (T-042 motor).

## Files

1. `src/game/constants/skills.ts` — `WATER_DRAGON`.
2. `src/game/systems/__tests__/t099WaterDragon.test.ts` — AC1–3.
3. `src/simulation/WaterDragonBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t099WaterDragon.test.ts`

## Split

Single implementer.

## Out of scope

kawarimi, sand_burial, puppet_crow, Hidden Mist retune.
