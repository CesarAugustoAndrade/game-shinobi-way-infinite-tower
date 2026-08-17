# T-102 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| PUPPET_CROW is legacy AP2 / base 22 / no cardRole / effects POISON 10×3 TRUE + BLEED 10×3 | **true** | `skills.ts:2705–2732` |
| Catalog wants ATTACK AP3/CP6/CD4 22 M/L + Poison 4×2 + Bleed 4×2 on hit | **true** | `#catalogo` puppet_crow |
| `markEffects` `requireHit` plants once on ≥1 hit; loop supports dual entries | **true** | `applySkillMarkEffects` T-091 poison |
| Bleed plant id `bleed` family DOT exists | **true** | `KUNAI_SLASH` |
| SkillTag.PUPPET / POISON | **absent** | use WEAPON + PHYSICAL |

## Complexity premise

Authoring-only. Two `markEffects` `requireHit` reuse T-091/T-048 motors. Do not fork ResolveSkill. No port change.

## Relevant files

- `src/game/constants/skills.ts` — `PUPPET_CROW`
- `src/game/systems/__tests__/t091BugSwarm.test.ts` / `t048KunaiSlash.test.ts`

## Port signatures

None. Stay R0.
