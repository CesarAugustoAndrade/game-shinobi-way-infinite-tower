# T-105 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Add optional `requireModeEnhance` to `MarkSpec` (default false). `applySkillMarkEffects` skips those marks unless clone/Mode enhance applied (`modeDamageBonus > 0`). Reauthor `CLONE_EXPLOSION` to ATTACK AP4/CP7/HP10/CD5 20 ANY + Rasengan-identical `modeInteraction` + `burn` 5×2 `requireHit` + `requireModeEnhance`. Drop mute AP2 / “cannot be evaded” identity.

## Files

1. `src/game/types.ts` — optional `requireModeEnhance` on `MarkSpec`.
2. `src/game/systems/ResolveSkillSystem.ts` — pass enhance flag into `applySkillMarkEffects`.
3. `src/game/constants/skills.ts` — `CLONE_EXPLOSION`.
4. `src/game/systems/__tests__/t105CloneExplosion.test.ts` — AC1–3.
5. `src/simulation/CloneExplosionBalance.ts` + `index.ts`.
6. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t105CloneExplosion.test.ts`

## Split

Single implementer.

## Out of scope

poison_fog, bone_drill, fang_over_fang, c4_karura, Rasengan retune.
