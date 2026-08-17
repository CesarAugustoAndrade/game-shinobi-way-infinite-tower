# T-106 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| POISON_FOG is legacy AP2 / base 9 / effects POISON 18×4 TRUE / no cardRole / no ranges | **true** | `skills.ts:3475–3507` |
| Catalog wants SIDE AP2/CP5/CD3 9 M/L + Poison 6×3; +1 dur if Mist | **true** | `#catalogo` poison_fog |
| Poison plant via `markEffects` id `poison` requireHit | **true** | Bug Swarm T-091 |
| Enemy `mist` mark exists; `hasEnemyMark` already used | **true** | Hidden Mist T-073; Water Dragon T-099 |
| Duration bonus field on MarkSpec | **absent** | `requireHit` / `requireModeEnhance` only |
| SkillTag.POISON | **absent** | use NINJUTSU + FIRE |

## Complexity premise

Small `MarkSpec.durationBonusIfEnemyMark?: { markId; bonus }` (default none). `applySkillMarkEffects` adds bonus when `hasEnemyMark`. Mist stays. No second DoT. No port change.

## Relevant files

- `src/game/types.ts` — `MarkSpec`
- `src/game/systems/ResolveSkillSystem.ts` — `applySkillMarkEffects`
- `src/game/constants/skills.ts` — `POISON_FOG`
- `src/game/systems/__tests__/t091BugSwarm.test.ts` / `t073HiddenMist.test.ts`

## Port signatures

None. Stay R0. Optional field on existing `MarkSpec` only.
