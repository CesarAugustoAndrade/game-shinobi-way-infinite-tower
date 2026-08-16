# T-073 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none. Reuse SUPPORT plant + `nextDrawRoleBonus`. Stays R0.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `HIDDEN_MIST` unmarked ACTIVE AP2/CP5/CD5, SPEED +0.5 / ACC −0.3×3 | **true** | `skills.ts` 1937–1964 |
| Smoke plants `smoke` 2/25 + SIDE +1 | **true** | `skills.ts` 985–1015 |
| `applySmokeOutgoing` is smoke-id-only | **true** | MarkSystem ~139–155 |
| ResolveSkillState has Terrain | **false** | no terrain field |
| SkillTag.DEFENSE | **false** | use NINJUTSU + WATER + MARK |

## Complexity premise

Spec listed resolve + SupportWeight. Both exist. Author-only + `applyMistOutgoing` sibling (preferred −20 apply). Do not retune smoke.

## Layers

R0: `skills.ts` `HIDDEN_MIST`; `MarkSystem.ts` `applyMistOutgoing`. Tests + R3 probe.
