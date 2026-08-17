# T-092 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `WATER_CLONE` to SIDE 11 C/M. On ≥1 hit: `markEffects` self SHIELD 15 (`water_clone_shield`, duration 99, T-076 convention). Drop mute STR +40%. No `modeInteraction`. AC2 fixture: Shadow Clones ON 3 charges stay 3.

## Files

1. `src/game/constants/skills.ts` — `WATER_CLONE`.
2. `src/game/systems/__tests__/t092WaterClone.test.ts` — AC1–3.
3. `src/simulation/WaterCloneBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t092WaterClone.test.ts`

## Split

Single implementer.

## Out of scope

suijinheki, adamantine, earth_decapitation, expansion, kawarimi, Shadow Clones reauthor.
