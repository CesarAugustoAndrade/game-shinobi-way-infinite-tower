# T-104 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| ICE_MIRRORS is legacy AP2 / base 15 / PIERCING / effects STUN 0.5 / no hitCount | **true** | `skills.ts:2975–3001` |
| Catalog wants ATTACK AP3/CP7/CD4 4×4 ANY + 40% Stun if ≥2 hits | **true** | `#catalogo` ice_mirrors |
| `impactStun` fires on `hitsLanded >= 1` only | **true** | `ResolveSkillSystem` ~1279–1284 |
| `ImpactStunSpec` has no min-hits field | **true** | `types.ts` |
| `hitCount: 4` + independent `rollHit` exists | **true** | T-070 Senbon Rain |
| SkillTag.CONTROL | **absent** | use NINJUTSU + WATER + MULTI_HIT |

## Complexity premise

Small `ImpactStunSpec.minHitsLanded?: number` (default 1) + honor in `resolveImpactStun`. Existing stun skills unchanged. No second stun pipeline. No port change.

## Relevant files

- `src/game/types.ts` — `ImpactStunSpec`
- `src/game/systems/ResolveSkillSystem.ts` — `resolveImpactStun`
- `src/game/constants/skills.ts` — `ICE_MIRRORS`
- `src/game/systems/__tests__/t070SenbonRain.test.ts` / `t055SweepingKick.test.ts`

## Port signatures

None. Stay R0. Optional field on existing spec only.
