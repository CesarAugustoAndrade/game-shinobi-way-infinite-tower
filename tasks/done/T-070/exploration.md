# T-070 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none new. `MarkSpec.requireHit` (T-069) already plants once on ≥1 hit. Stays R0.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `SENBON_RAIN` unmarked ACTIVE base 6, POISON 5×3 @0.2 | **true** | `skills.ts` 761–780 |
| T-069 `requireHit` plants once if hitsLanded ≥ 1 | **true** | applySkillMarkEffects |
| `perHit: true` would stack 3×4 | **true** | stacks * hitsLanded |
| SkillTag.POISON | **false** | omit; use TOOL/WEAPON/PHYSICAL/MULTI_HIT |
| `poison` mark id used | **true** | T-061 / T-068 |

## Complexity premise

Spec listed ResolveSkillSystem multi-hit + poison. Multi-hit + requireHit already exist. **Author-only.** Do not edit resolve, Senbon, Barrage, or Poison Coat.

## Layers

R0: `skills.ts` `SENBON_RAIN`. Tests + R3 probe.
