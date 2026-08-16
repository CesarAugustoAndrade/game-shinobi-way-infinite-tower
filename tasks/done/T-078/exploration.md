# T-078 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none. Authoring-only; stays R0.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `DEMON_SLASH` unmarked ACTIVE AP2/CP0/CD2 base 15 PIERCING BLEED 15×3 | **true** | `skills.ts` 3183–3216 |
| Sword Slash plants `bleed` 4×2 via `markEffects` `perHit` | **true** | `skills.ts` 903–912; `t059SwordSlash` |
| ATTACK `applySkillMarkEffects` honors `perHit` / miss | **true** | ResolveSkillSystem 1151–1152 |
| SkillTag.BLEED | **false** | use WEAPON + PHYSICAL |
| Catalog wants drop PIERCING | **true** | spec default |

## Complexity premise

Bleed plant already generalized by T-059. No ResolveSkillSystem change.

## Layers

R0: `skills.ts` DEMON_SLASH. Tests + R3 probe.
