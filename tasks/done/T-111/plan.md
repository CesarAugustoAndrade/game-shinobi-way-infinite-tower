# T-111 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `TEMPLE_NIRVANA` to SUPPORT AP3/CP8/CD6, `controlStun: { chance: 0.8, enemyDuration: 2 }`. Drop mute STUN chance 1.0 + PIERCING. Elite/Boss duration cap is OOS (no rank signal on resolve state).

## Files

1. `src/game/constants/skills.ts` — `TEMPLE_NIRVANA`.
2. `src/game/systems/__tests__/t111TempleNirvana.test.ts` — AC1–3.
3. `src/simulation/TempleNirvanaBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t111TempleNirvana.test.ts`

## Split

Single implementer.

## Out of scope

Elite/Boss Stun cap; shadow_possession; fang_over_fang; bone_drill; Killing Intent retune.
