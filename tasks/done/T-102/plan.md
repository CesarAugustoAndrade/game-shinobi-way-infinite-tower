# T-102 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `PUPPET_CROW` to ATTACK AP3/CP6/CD4 22 M/L + dual `markEffects` poison 4×2 + bleed 4×2 `requireHit`. Drop mute AP2 + effects POISON 10×3 TRUE / BLEED 10×3. Do **not** change ResolveSkill (T-091 loop). Tags: WEAPON + PHYSICAL (PUPPET/POISON unavailable).

## Files

1. `src/game/constants/skills.ts` — `PUPPET_CROW`.
2. `src/game/systems/__tests__/t102PuppetCrow.test.ts` — AC1–3.
3. `src/simulation/PuppetCrowBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t102PuppetCrow.test.ts`

## Split

Single implementer.

## Out of scope

poison_fog, bone_drill, kawarimi, puppet kit beyond Crow.
