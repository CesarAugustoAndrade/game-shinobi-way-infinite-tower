# T-077 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none. Authoring-only; stays R0.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `AIR_BULLET` unmarked ACTIVE AP2/CP5/CD2 base 13, WIL −0.15×2 | **true** | `skills.ts` 2108–2133 |
| Explosive Tag `bandMove` PUSH 1 `requireHit` | **true** | `skills.ts` 843; ResolveSkillSystem 1200 |
| SIDE `applySkillMarkEffects` honors `requireHit` | **true** | ResolveSkillSystem 1151–1152 + applySkillMarkEffects 366–370 |
| Flash Bomb integer ACC via STAT stacks | **true** | `blinded` stacks 2 = −2 ACC |
| SkillTag.MOVEMENT | **false** | use NINJUTSU + WIND |
| LONG PUSH stays LONG | **true** | existing RangeSystem / T-056 MEDIUM→LONG; LONG already edge |

## Complexity premise

Spec's "hard part" is PUSH + ACC on hit. **Already generalized.** No ResolveSkillSystem change.

## Layers

R0: `skills.ts` AIR_BULLET. Tests + R3 probe.
