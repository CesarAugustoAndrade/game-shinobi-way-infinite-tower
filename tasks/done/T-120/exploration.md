# T-120 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `KAMUI_IMPACT` is KINJUTSU AP2/CP11/CD4, TRUE 27, AUTO, SPEED DEBUFF 50%×2, no `cardRole` / pen / Tear | **true** | `skills.ts:3952–3983` |
| Catalog wants ATTACK 27 ANY, AP5/CP11/CD4, 50% pen, Spatial Tear 2 → next ATTACK +20% | **true** | spec + `#catalogo` |
| `Skill.penetration` + `applySkillPenetration` exist | **true** | T-119/T-022; `ResolveSkillSystem.ts:376–381,1192–1200` |
| Next-ATTACK Setup via attempt-consume self mark exists (`barrage_setup` ×1.1) | **true** | T-069; `markDamageMultiplier`; consume filter `role === ATTACK` |
| `off_balance` is enemy mark ×1.2 | **true** | T-023; different identity — do not reuse |
| Plant-on-resolve without `requireHit` plants on miss | **true** | `applySkillMarkEffects`: ATTEMPT + no requireHit → applies=1 |
| KINJUTSU / SPACE_TIME / DOJUTSU tags | **false** | no such `SkillTag`; available: NINJUTSU, UCHIHA |
| ANY range | **true** | omit `allowedRanges` + AUTO (Shinra T-115) |

## Complexity premise

Authoring + one table row (`spatial_tear` ×1.2) + consume filter ATTACK-only. No new mit/delay motor.

Plant Tear on resolve success (hit or miss) — catalog “applies Spatial Tear 2”, not requireHit.

## Relevant files

- `src/game/constants/skills.ts` — `KAMUI_IMPACT`
- `src/game/systems/ResolveSkillSystem.ts` — `markDamageMultiplier` + attempt `allow`
- `src/game/systems/__tests__/t069ShurikenBarrage.test.ts` — self Setup mark
- `src/game/systems/__tests__/t119BoneDrill.test.ts` — pen fixture

## Port signatures

None. Stay R0.
