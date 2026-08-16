# T-075 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none. Additive consume filter + `exposed_10` mult. Stays R0.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `HENGE` unmarked ACTIVE AP1/CP1/CD4, DEX +0.25×2 | **true** | `skills.ts` 251–269 |
| `nextDrawRoleBonus` SIDE bag exists | **true** | Smoke/Mist |
| T-023 `exposed` is ×1.15 RANGED | **true** | markDamageMultiplier ~402 |
| Consume filter is per-id | **true** | ResolveSkillSystem ~802 |
| SkillTag.SETUP | **false** | use NINJUTSU + MENTAL + MARK |

## Complexity premise

Spec listed SUPPORT plant + SIDE consume → Exposed 10%. Need resolve hook: spent `misdirect` + hitsLanded ≥ 1 → plant `exposed_10`. Do not reuse `exposed` (would be ×1.15).

## Layers

R0: `skills.ts` HENGE; `ResolveSkillSystem.ts` consume + plant + ×1.10. Tests + R3 probe.
