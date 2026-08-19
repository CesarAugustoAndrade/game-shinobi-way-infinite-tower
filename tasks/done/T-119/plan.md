# T-119 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `BONE_DRILL` (`bone_drill`) to explicit `cardRole: ATTACK`, AP3/HP10/CD3, `baseDamage: 18`, CLOSE+MEDIUM, `DamageType.PHYSICAL` (not TRUE), `penetration: 0.25`, TAIJUTSU/PHYSICAL, no Mode. Keep FORBIDDEN tier and existing stat requirements. `critBonus` catalog-silent — keep.

No ResolveSkill fork. Shared `applySkillPenetration` + `enemyDefensePercent` fixture prove pen vs zero-pen vs TRUE full strip.

## Files

1. `src/game/constants/skills.ts` — `BONE_DRILL`.
2. `src/game/systems/__tests__/t119BoneDrill.test.ts` — AC1–3.
3. `src/simulation/BoneDrillBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t119BoneDrill.test.ts`

## Split

Single implementer.

## Out of scope

kirin; c4_karura; kawarimi; shadow_possession; tengai; new mit layers; live UI; SOUL.
