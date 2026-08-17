# T-096 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `EXPANSION` to ATTACK AP3/CP6/CD4 16 CLOSE + STAT mark `expansion_str` stacks 2 duration 1 (catalog +2 STR integer, Brace clock). No `requireHit` so the self-buff plants on legal commit (including miss). Drop mute STR +50%×2, Aggressive stanceShift / stanceBonus. Do **not** wire StatSystem (no new primary-stat pipeline).

## Files

1. `src/game/constants/skills.ts` — `EXPANSION`.
2. `src/game/systems/__tests__/t096Expansion.test.ts` — AC1–3.
3. `src/simulation/ExpansionBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t096Expansion.test.ts`

## Split

Single implementer.

## Out of scope

adamantine, fang_over_fang, shadow_possession, kawarimi, StatSystem mark hook.
