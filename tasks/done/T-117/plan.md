# T-117 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `BASIC_ATTACK` (`basic_atk`) to explicit `cardRole: ATTACK`, CLOSE ranges, TAIJUTSU/PHYSICAL tags, honest no-Mode description. Keep Aggressive stanceBonus. No modeInteraction. Do not retune Heavy Kick.

## Files

1. `src/game/constants/skills.ts` — `BASIC_ATTACK`.
2. `src/game/systems/__tests__/t117BasicAtk.test.ts` — AC1–3.
3. `src/simulation/BasicAtkBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t117BasicAtk.test.ts`

## Split

Single implementer.

## Out of scope

heavy_kick retune; Skill Config default Main; fang_over_fang; kirin.
