# T-072 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none new. Reuse `exposed` + `requireHit`. Stays R0.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `EXPLOSIVE_BARRAGE` unmarked ACTIVE 13 + SPEED −0.2×2 | **true** | `skills.ts` 822–840 |
| `markDamageMultiplier` Exposed ×1.15 if RANGED | **true** | ResolveSkillSystem ~402 |
| Blastback plants `exposed` ATTEMPT duration 1 | **true** | skillsCombatV1New ~172–174 |
| consumeOnAttempt default spends Exposed on any offensive | **true** | filter `return true` |
| `requireHit` plants once on ≥1 hit | **true** | T-069/T-070 |
| SkillTag.FIRE / MULTI_HIT / TOOL | **true** | SkillTag enum |

## Complexity premise

Spec listed resolve multi-hit + existing Exposed. Multi-hit + requireHit exist. Only add `if (mark.id === 'exposed') return role === ATTACK` so SIDE does not consume (spec). Do not broaden ×1.15 to MELEE.

## Layers

R0: `skills.ts` `EXPLOSIVE_BARRAGE`; one consume-filter line in `ResolveSkillSystem.ts`. Tests + R3 probe.
