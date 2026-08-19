# T-109 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| SHUKAKU_ARM is legacy AP2 / base 27 / ARMOR_BREAK / effects SHIELD 100×2 / no cardRole / no ranges | **true** | `skills.ts:3667–3692` |
| Catalog wants ATTACK AP4/CP8/CD6 27 C/M + Shield 30 even on miss | **true** | `#catalogo` shukaku_arm |
| Self SHIELD absorb-until-gone (duration 99, stacks) exists | **true** | Mud Wall 35; Sand Shield 45; Gamabunta 35 requireHit |
| markEffects without `requireHit` / IMPACT plant even when hitsLanded < 1 | **true** | `ResolveSkillSystem.ts:390–394` |
| SkillTag.DEFENSE | **absent** | use NINJUTSU + EARTH (Mud Wall / Sand Shield) |

## Complexity premise

Authoring-only. Reuse SHIELD `markEffects` `targetActor: 'self'` **without** `requireHit`. Contrast T-107 (requireHit 35). No ResolveSkill fork. No port change.

## Relevant files

- `src/game/constants/skills.ts` — `SHUKAKU_ARM`
- `src/game/systems/__tests__/t107SummonGamabunta.test.ts` / `t064MudWall.test.ts` / `t076` Sand Shield

## Port signatures

None. Stay R0.
