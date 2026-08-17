# T-095 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S–M

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| GREAT_BREAKTHROUGH is legacy ACTIVE AP2 + ACC −25%×2, no cardRole / ranges / PUSH | **true** | `skills.ts:2145–2170` |
| Catalog wants ATTACK AP3/CP5/CD3 16 M/L + PUSH 1 + +20% Setup if band changes | **true** | `#catalogo` great_breakthrough |
| PUSH `bandMove` requireHit exists | **true** | Air Bullet T-077 / Explosive Tag T-056 |
| `resolveForcedMove` / `applyForcedMove` report `moved` | **true** | `RangeSystem.ts:259–323` |
| PUSH@LONG is a no-move boundary | **true** | `applyForcedMove` + T-006 |
| Setup bucket already floors via `setupRead` / Mode | **true** | `ResolveSkillSystem` stub path `Math.floor(dmg * (1+bonus))`; hit-core `preMits` |
| SkillTag.MOVEMENT available | **false** | NINJUTSU / WIND only |

## Complexity premise

Damage is computed **before** bandMove commit. Need a would-move peek (`applyForcedMove`) so Setup +20% applies on the same hit that then PUSHes. Existing PUSH motor stays; only add `setupMultIfBandMoved` field + floor multiply when `moved`. No port change.

## Relevant files

- `src/game/types.ts` — optional `setupMultIfBandMoved`
- `src/game/constants/skills.ts` — `GREAT_BREAKTHROUGH`
- `src/game/systems/ResolveSkillSystem.ts` — would-move → Setup bucket
- `src/game/systems/__tests__/t077AirBullet.test.ts` / `t093EarthDecapitation.test.ts`

## Port signatures

None. Stay R0.
