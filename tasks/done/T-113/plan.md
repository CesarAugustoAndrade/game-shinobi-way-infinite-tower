# T-113 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `AMATERASU` to ATTACK AP5/CP13/HP20/CD5 20, `requireFamily: SHARINGAN` + `requireOn` + `consumeCharges: 2`, `markEffects` burn 8×4 requireHit, `effects` BURN 8×4 TRUE (catalog tick tag). Drop mute PIERCING 13 + BURN 50×5. Gate `requireOn` when remaining charges < `consumeCharges`.

## Files

1. `src/game/constants/skills.ts` — `AMATERASU`.
2. `src/game/systems/ResolveSkillSystem.ts` — requireOn + consumeCharges floor.
3. `src/game/systems/__tests__/t113Amaterasu.test.ts` — AC1–3.
4. `src/simulation/AmaterasuBalance.ts` + `index.ts`.
5. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t113Amaterasu.test.ts`

## Split

Single implementer.

## Out of scope

kirin, rasenshuriken, fang_over_fang, bone_drill, c4_karura, Tsukuyomi retune.
