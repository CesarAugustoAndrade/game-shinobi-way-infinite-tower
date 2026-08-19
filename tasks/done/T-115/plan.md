# T-115 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `SHINRA_TENSEI` to ATTACK AP4/CP13/CD5 23 ANY, `bandMove` PUSH 1 requireHit, `impactStun` 0.7×1. Drop mute TRUE + STUN 0.5 effects. steps: 1 (sibling; not CLOSE→LONG in one resolve).

## Files

1. `src/game/constants/skills.ts` — `SHINRA_TENSEI`.
2. `src/game/systems/__tests__/t115ShinraTensei.test.ts` — AC1–3.
3. `src/simulation/ShinraTenseiBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t115ShinraTensei.test.ts`

## Split

Single implementer.

## Out of scope

kirin, fang_over_fang, bone_drill, c4_karura, Water Vortex retune.
