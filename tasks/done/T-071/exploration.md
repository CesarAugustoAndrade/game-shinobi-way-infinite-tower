# T-071 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none. `bandMove` PULL + `requireHit` already in resolve. Stays R0.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `WINDMILL_SHURIKEN` unmarked ACTIVE 12 PIERCING pen 0.2 | **true** | `skills.ts` 715–733 |
| `skillForcedMove` maps `PULL` | **true** | ResolveSkillSystem ~415–421 |
| `requireHit` skips move on miss | **true** | skipAuthoredMove ~1178; T-056 |
| SkillTag.MOVEMENT | **false** | omit; TOOL/WEAPON/PHYSICAL |

## Complexity premise

Spec listed ResolveSkillSystem. Verified: Explosive Tag PUSH pattern is enough. **Do not edit resolve.**

## Layers

R0: `skills.ts` `WINDMILL_SHURIKEN`. Tests + R3 probe.
