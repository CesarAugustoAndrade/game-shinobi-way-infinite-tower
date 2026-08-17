# T-107 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `SUMMON_GAMABUNTA` to ATTACK AP4/CP11/CD8 25 M/L + self `gamabunta_shield` stacks 35 duration 99 `requireHit`. No `modeInteraction`. Drop mute SHIELD 80×3 effects.

## Files

1. `src/game/constants/skills.ts` — `SUMMON_GAMABUNTA`.
2. `src/game/systems/__tests__/t107SummonGamabunta.test.ts` — AC1–3.
3. `src/simulation/SummonGamabuntaBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t107SummonGamabunta.test.ts`

## Split

Single implementer.

## Out of scope

summon_manda, bone_drill, fang_over_fang, kawarimi, Water Clone retune.
