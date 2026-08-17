# T-095 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `GREAT_BREAKTHROUGH` to ATTACK AP3/CP5/CD3 16 M/L + PUSH 1 requireHit + `setupMultIfBandMoved: 0.2`. Peek `applyForcedMove` before damage: if PUSH would change the band, apply Setup `floor(dmg * 1.2)` (stub + hit-core preMits). Drop mute ACC −25%. PUSH@LONG → no move → no +20%.

## Files

1. `src/game/types.ts` — optional `setupMultIfBandMoved`.
2. `src/game/constants/skills.ts` — `GREAT_BREAKTHROUGH`.
3. `src/game/systems/ResolveSkillSystem.ts` — would-move Setup bucket.
4. `src/game/systems/__tests__/t095GreatBreakthrough.test.ts` — AC1–3.
5. `src/simulation/GreatBreakthroughBalance.ts` + `index.ts`.
6. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t095GreatBreakthrough.test.ts`

## Split

Single implementer.

## Out of scope

adamantine, expansion, fang_over_fang, kawarimi, Air Bullet retune.
