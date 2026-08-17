# T-094 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| WATER_WALL `suijinheki` is legacy ACTIVE Shield 60×2 + SPIRIT 30% + Defensive | **true** | `skills.ts:1839–1862` |
| Catalog wants SUPPORT AP1/CP6/CD4 Shield 40 + +1 elem def until next enemy response | **true** | `#catalogo` suijinheki |
| Brace duration-1 SHIELD plant exists | **true** | T-065 `brace_shield` 20/1 |
| SUPPORT applies markEffects | **true** | `ResolveSkillSystem` SUPPORT branch |
| `elementalDefenseFlat` exists | **true** | `DerivedStats` + `StatSystem` from SPIRIT + equipment |
| Marks feed `elementalDefenseFlat` | **false** | StatSystem never reads marks |
| SkillTag.DEFENSE available | **false** | NINJUTSU / WATER only |

## Complexity premise

Shield is authoring-only (Brace path). Wiring STAT marks into StatSystem would invent a mitigation pipeline — spec forbids that and allows SHIELD 40 + documented +1 integer field. Stay R0; no port change.

## Relevant files

- `src/game/constants/skills.ts` — `WATER_WALL`
- `src/game/systems/__tests__/t065Brace.test.ts`
- `src/game/systems/StatSystem.ts` — no mark hook (do not add this fire)

## Port signatures

None. Stay R0.
