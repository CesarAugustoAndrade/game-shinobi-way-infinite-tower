# T-100 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `SAND_COFFIN` to SIDE AP2/CP7/CD5 15 M/L + `impactStun` 0.7×1 + `markEffects` `coffined` duration 2 `requireHit`. Family `HARD_CONTROL` (setup lock for later Burial, not a STAT modifier). Drop mute ARMOR_BREAK + `effects` STUN 0.7. Do **not** change ResolveSkill (T-093/T-091 motors).

## Files

1. `src/game/constants/skills.ts` — `SAND_COFFIN`.
2. `src/game/systems/__tests__/t100SandCoffin.test.ts` — AC1–3.
3. `src/simulation/SandCoffinBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t100SandCoffin.test.ts`

## Split

Single implementer.

## Out of scope

sand_burial consume, kawarimi, puppet_crow, ARMOR_BREAK retune elsewhere.
