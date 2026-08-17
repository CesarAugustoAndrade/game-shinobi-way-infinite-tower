# T-093 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| EARTH_DECAPITATION is legacy ACTIVE 13 + mute STUN 60%, no PULL/role | **true** | `skills.ts:2099–2124` |
| Catalog wants SIDE AP2/CP5/CD3 C/M + PULL + 50% Stun 1 | **true** | `#catalogo` earth_decapitation |
| `bandMove` PULL requireHit exists | **true** | T-071 Windmill |
| `impactStun` exists | **true** | T-055 Sweeping Kick |
| SkillTag.CONTROL / MOVEMENT available | **false** | `SkillTag` has NINJUTSU / EARTH |
| Need new resolve hook | **false** | Authoring-only |

## Complexity premise

Authoring + existing PULL + impactStun. No port change. Stay R0.

## Relevant files

- `src/game/constants/skills.ts` — `EARTH_DECAPITATION`
- `src/game/systems/__tests__/t071WindmillShuriken.test.ts`
- `src/game/systems/__tests__/t055SweepingKick.test.ts`

## Port signatures

None. Stay R0.
