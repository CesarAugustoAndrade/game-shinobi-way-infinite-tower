# T-094 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `WATER_WALL` (`suijinheki`) to SUPPORT Shield 40 duration 1 (Brace clock) + STAT mark `suijinheki_elem_def` stacks 1 (catalog +1 elemental defense integer). Drop mute SHIELD 60×2, SPIRIT 30%, Defensive stanceShift. Do **not** wire StatSystem (no new mitigation pipeline).

## Files

1. `src/game/constants/skills.ts` — `WATER_WALL`.
2. `src/game/systems/__tests__/t094Suijinheki.test.ts` — AC1–3.
3. `src/simulation/SuijinhekiBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t094Suijinheki.test.ts`

## Split

Single implementer.

## Out of scope

great_breakthrough, adamantine, expansion, kawarimi, Brace/Sand retune, StatSystem mark hook.
