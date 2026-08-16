# T-076 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none. Authoring-only; stays R0.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `SAND_SHIELD` is ACTIVE-only AP1/CP5/CD3, SHIELD 80×2, no `cardRole` | **true** | `skills.ts` 2392–2416 |
| Mud Wall plants self SHIELD via `markEffects` | **true** | `skills.ts` 137–145; `t064MudWall` |
| SUPPORT `resolveSkill` plants marks via `applySkillMarkEffects` | **true** | `ResolveSkillSystem.ts` 934–935 |
| Duration 99 = absorb-until-gone identity | **true** | Mud Wall duration 99, stacks 35 |
| SkillTag.DEFENSE | **false** | `SkillTag` has NINJUTSU + EARTH; no DEFENSE. Use those two. |
| Live mark-SHIELD absorb required | **false** | T-064 bar: plant is enough |

## Complexity premise

Spec's "hard part" is SUPPORT self SHIELD plant. **Already generalized** by T-064/T-028 `applySkillMarkEffects`. No ResolveSkillSystem change.

## Layers

R0: `skills.ts` SAND_SHIELD. Tests + R3 probe. Do not edit resolve.
