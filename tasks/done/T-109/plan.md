# T-109 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `SHUKAKU_ARM` to ATTACK AP4/CP8/CD6 27 C/M + self `shukaku_arm_shield` stacks 30 duration 99 **without** `requireHit`. Drop mute ARMOR_BREAK + SHIELD 100×2 effects.

## Files

1. `src/game/constants/skills.ts` — `SHUKAKU_ARM`.
2. `src/game/systems/__tests__/t109ShukakuArm.test.ts` — AC1–3.
3. `src/simulation/ShukakuArmBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t109ShukakuArm.test.ts`

## Split

Single implementer.

## Out of scope

bone_drill, fang_over_fang, shadow_possession, curse_surge, c4_karura, summon_gamabunta retune, sand coffin/burial retune.
