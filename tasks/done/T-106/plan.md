# T-106 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Add optional `durationBonusIfEnemyMark` to `MarkSpec`. `applySkillMarkEffects` adds `bonus` to duration when that enemy mark is present. Reauthor `POISON_FOG` to SIDE AP2/CP5/CD3 9 M/L + `poison` 6×3 `requireHit` + bonus `{ markId: 'mist', bonus: 1 }`. Drop mute TRUE 18×4 / “ignores 50% def”.

## Files

1. `src/game/types.ts` — optional duration bonus on `MarkSpec`.
2. `src/game/systems/ResolveSkillSystem.ts` — honor bonus via `hasEnemyMark`.
3. `src/game/constants/skills.ts` — `POISON_FOG`.
4. `src/game/systems/__tests__/t106PoisonFog.test.ts` — AC1–3.
5. `src/simulation/PoisonFogBalance.ts` + `index.ts`.
6. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t106PoisonFog.test.ts`

## Split

Single implementer.

## Out of scope

bone_drill, summon_gamabunta, fang_over_fang, kawarimi, Hidden Mist retune.
