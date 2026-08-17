# T-105 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| CLONE_EXPLOSION is legacy AP2 / base 20 / HP10 / no cardRole / no modeInteraction / no Burn | **true** | `skills.ts:3165–3189` |
| Catalog wants ATTACK AP4/CP7/HP10/CD5 20 ANY + clones +50% + 1 charge + Burn 5×2 | **true** | `#catalogo` clone_explosion |
| Rasengan already has clones consume 1 / +50% optional enhance | **true** | `skills.ts:1538–1543`; `ResolveSkillSystem` `modeDamageBonus` |
| `impactStun`-style Mode gate on markEffects does **not** exist | **true** | `MarkSpec` has `requireHit` / `perHit` only |
| Burn as mark id `burn` DOT | **absent** | poison/bleed DOT marks exist; fire Burn is still `effects[]` (T-032/T-089) |
| SkillTag.CLONE | **absent** | use NINJUTSU + FIRE + UZUMAKI |

## Complexity premise

Reuse T-018 `modeInteraction` (no second clone mult). Small `MarkSpec.requireModeEnhance?: boolean` so `applySkillMarkEffects` plants `burn` 5×2 only when `modeDamageBonus > 0`. Default false preserves every existing mark. Charge-at-attempt already spends on miss; `requireHit` skips Burn. No port change.

## Relevant files

- `src/game/types.ts` — `MarkSpec`
- `src/game/systems/ResolveSkillSystem.ts` — `applySkillMarkEffects`
- `src/game/constants/skills.ts` — `CLONE_EXPLOSION`
- `src/game/systems/__tests__/t018RasenganModePayoff.test.ts` / `t089DragonFlame.test.ts`

## Port signatures

None. Stay R0. Optional field on existing `MarkSpec` only.
