# T-103 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| WATER_VORTEX is legacy AP2 / base 20 / SPEED DEBUFF 0.4×3 / no cardRole | **true** | `skills.ts:3120–3145` |
| Catalog wants ATTACK AP4/CP8/CD5 20 M/L + PUSH 1 + −2 SPD×2 | **true** | `#catalogo` water_vortex |
| PUSH `bandMove` requireHit live (MEDIUM→LONG; LONG stays) | **true** | T-077 / T-095 |
| `spd_down` stacks = flat SPD penalty | **true** | T-051 stacks 1 = −1 |
| SkillTag.MOVEMENT | **absent** | use NINJUTSU + WATER |

## Complexity premise

Authoring-only. Reuse PUSH motor + `spd_down` `requireHit`. Do not fork ResolveSkill. No percent SPEED. No port change.

## Relevant files

- `src/game/constants/skills.ts` — `WATER_VORTEX`
- `src/game/systems/__tests__/t095GreatBreakthrough.test.ts` / `t051LeafWhirlwind.test.ts`

## Port signatures

None. Stay R0.
