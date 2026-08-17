# T-103 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `WATER_VORTEX` to ATTACK AP4/CP8/CD5 20 M/L + `bandMove` PUSH 1 `requireHit` + `spd_down` stacks 2 duration 2 STAT `requireHit`. Drop mute AP2 + SPEED 0.4×3 DEBUFF. Do **not** change ResolveSkill (T-095/T-051 motors). Tags: NINJUTSU + WATER (MOVEMENT unavailable).

## Files

1. `src/game/constants/skills.ts` — `WATER_VORTEX`.
2. `src/game/systems/__tests__/t103WaterVortex.test.ts` — AC1–3.
3. `src/simulation/WaterVortexBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t103WaterVortex.test.ts`

## Split

Single implementer.

## Out of scope

bone_drill, ice_mirrors, poison_fog, Breakthrough Setup retune.
