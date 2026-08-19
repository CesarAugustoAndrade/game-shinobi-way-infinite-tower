# T-108 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `SUMMON_MANDA` to ATTACK AP4/CP8/HP20/CD7 25 C/M + enemy `poison` stacks 6 duration 3 `requireHit`. Drop mute TRUE poison 15×4 effects. HP paid at attempt (existing `hpCost`).

## Files

1. `src/game/constants/skills.ts` — `SUMMON_MANDA`.
2. `src/game/systems/__tests__/t108SummonManda.test.ts` — AC1–3.
3. `src/simulation/SummonMandaBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t108SummonManda.test.ts`

## Split

Single implementer.

## Out of scope

bone_drill, fang_over_fang, kawarimi, summon_gamabunta retune, c4_karura.
