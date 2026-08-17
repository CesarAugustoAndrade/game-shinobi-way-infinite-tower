# T-092 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| WATER_CLONE is legacy ACTIVE 11 + mute STR +40%×2 | **true** | `skills.ts:2022–2047` |
| Catalog wants SIDE AP2/CP6/CD4 C/M + Shield 15 on hit, no clone charges | **true** | `#catalogo` water_clone |
| Self SHIELD via markEffects exists | **true** | T-064 `mud_wall_shield` / T-076 `sand_shield` duration 99 stacks=absorb |
| SIDE applies markEffects on ≥1 hit | **true** | `applySkillMarkEffects` + `requireHit` |
| SkillTag.DEFENSE available | **false** | `SkillTag` has NINJUTSU / WATER only |
| Need new resolve hook | **false** | Authoring-only; no Mode machine |

## Complexity premise

Authoring + T-076-shaped shield with `requireHit: true`. No port change. Stay R0.

## Relevant files

- `src/game/constants/skills.ts` — `WATER_CLONE`
- `src/game/systems/ResolveSkillSystem.ts` — reuse only
- `src/game/systems/__tests__/t076SandShield.test.ts` — shield template
- `src/game/constants/modes.ts` — `shadow_clone` fixture

## Port signatures

None. Stay R0.
