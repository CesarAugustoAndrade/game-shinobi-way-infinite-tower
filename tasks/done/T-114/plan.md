# T-114 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `RASENSHURIKEN` to ATTACK AP6/CP20/CD5 6×5 MEDIUM/LONG, clones `consumeCharges: 2` + `damageMultBonus: 0.5`, no `requireOn`. PIERCING (existing 20% ignore stand-in). Drop mute TRUE single 15 / AP2.

## Files

1. `src/game/constants/skills.ts` — `RASENSHURIKEN`.
2. `src/game/systems/__tests__/t114Rasenshuriken.test.ts` — AC1–3.
3. `src/simulation/RasenshurikenBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t114Rasenshuriken.test.ts`

## Split

Single implementer.

## Out of scope

New 20% pen motor; kirin; fang_over_fang; c4_karura; Rasengan retune.
