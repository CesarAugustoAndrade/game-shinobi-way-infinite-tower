# T-110 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `CURSE_SURGE` to SUPPORT AP1/HP10/CD4, `requireFamily: CURSE` + `requireOn` + `restoreCharges: 2`, self `vulnerable` stacks 10 duration 2. Drop mute STR +0.3 buff.

## Files

1. `src/game/constants/skills.ts` — `CURSE_SURGE`.
2. `src/game/systems/__tests__/t110CurseSurge.test.ts` — AC1–3.
3. `src/simulation/CurseSurgeBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t110CurseSurge.test.ts`

## Split

Single implementer.

## Out of scope

bone_drill, fang_over_fang, shadow_possession, temple_nirvana, c4_karura, CURSE Mode retune.
