# T-114 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| RASENSHURIKEN is legacy AP2 / single 15 TRUE+PIERCING / no cardRole / no hitCount / no ranges / no modeInteraction | **true** | `skills.ts:3787–3812` |
| Catalog wants ATTACK AP6/CP20/CD5 6×5 M/L + clones +50% consume 2 | **true** | `#catalogo` rasenshuriken |
| Multi-hit `hitCount` + per-hit `baseDamage` exists | **true** | Phoenix Flower 3×5; enhance floors total `Math.floor(hits*base*mult)` |
| Rasengan clone enhance consume 1 +0.5 | **true** | T-018 `modeId: shadow_clone` `consumeCharges: 1` `damageMultBonus: 0.5` |
| No `requireOn`: <2 charges → spend fail, no enhance, skill still resolves | **true** | `ResolveSkillSystem.ts` `spentOk` false skips `damageMultBonus` |
| SkillTag.KINJUTSU | **absent** | use UZUMAKI + WIND + MULTI_HIT + NINJUTSU |
| New 20% pen field | **absent / OOS** | use existing `DamageProperty.PIERCING` (Rasengan convention) |

## Complexity premise

Authoring-only. Reuse T-018 clone enhance + T-033 multi-hit. No ResolveSkill fork. No port change.

## Relevant files

- `src/game/constants/skills.ts` — `RASENSHURIKEN`
- `src/game/systems/__tests__/t018RasenganModePayoff.test.ts` / `t033PhoenixFlower.test.ts`

## Port signatures

None. Stay R0.
