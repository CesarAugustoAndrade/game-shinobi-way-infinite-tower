# T-118 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `FANG_OVER_FANG` (`fang_over_fang`) to explicit `cardRole: ATTACK`, `hitCount: 2`, `baseDamage: 7` (not single 13), CLOSE ranges, TAIJUTSU/PHYSICAL/MULTI_HIT, no Mode.

CLOSE-entry Setup: add data-driven `setupMultIfEnteredCloseThisTurn: 0.15` and optional `ResolveSkillState.enteredCloseThisTurn`. Apply Setup-bucket +15% only when the flag is true and ≥1 hit. Do **not** invent movement history. Live writers of the flag (voluntary approach / SELF_APPROACH) are OOS.

## Files

1. `src/game/types.ts` — `setupMultIfEnteredCloseThisTurn?: number` on Skill.
2. `src/game/systems/ResolveSkillSystem.ts` — `enteredCloseThisTurn?: boolean`; apply next to `bandMovedSetup`.
3. `src/game/constants/skills.ts` — `FANG_OVER_FANG`.
4. `src/game/systems/__tests__/t118FangOverFang.test.ts` — AC1–3.
5. `src/simulation/FangOverFangBalance.ts` + `index.ts`.
6. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t118FangOverFang.test.ts`

## Split

Single implementer.

## Out of scope

Full movement-history; live R1 flag writers; kirin; bone_drill; kawarimi; c4_karura; shadow_possession; live UI; SOUL.
