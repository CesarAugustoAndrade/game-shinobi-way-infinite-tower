# T-107 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| SUMMON_GAMABUNTA is legacy AP2 / base 25 / effects SHIELD 80×3 / no cardRole / no ranges | **true** | `skills.ts:2651–2676` |
| Catalog wants ATTACK AP4/CP11/CD8 25 M/L + Shield 35, no Mode | **true** | `#catalogo` summon_gamabunta |
| Self SHIELD absorb-until-gone (duration 99, stacks) exists | **true** | Mud Wall 35; Water Clone 15 requireHit |
| SkillTag.SUMMON | **absent** | use NINJUTSU + WATER |

## Complexity premise

Authoring-only. Reuse T-092 `markEffects` self SHIELD `requireHit`. No ResolveSkill fork. No port change.

## Relevant files

- `src/game/constants/skills.ts` — `SUMMON_GAMABUNTA`
- `src/game/systems/__tests__/t092WaterClone.test.ts` / `t064MudWall.test.ts`

## Port signatures

None. Stay R0.
