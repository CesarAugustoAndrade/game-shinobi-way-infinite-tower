# T-068 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** additive optional `Skill.supportHeal` + SUPPORT branch. No adapter change → **stays R0**.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `BASIC_MEDICAL` unmarked ACTIVE AP2/CP5/CD5, HEAL 25 effects[] | **true** | `skills.ts` 1096–1116 |
| SUPPORT never increments `pools.hp` | **true** | `resolveSupportCleanse` only refunds chakra |
| T-046 `supportCleanse` is mental-only | **true** | confusion/silence/oneHostileMentalMark |
| `poison` / `bleed` mark ids exist | **true** | T-048/T-059/T-061 `MarkFamily.DOT` |
| `SkillTag.MEDICAL` / `SUSTAIN` / `CLEANSE` | **false** | omit tags |

## Ports / reuse

- New `supportHeal: { amount: 25, cleanseOneOf: ['poison','bleed'] }` — do **not** extend Kai `supportCleanse` (avoids T-046 retune).
- SUPPORT path after `supportCleanse`: `resolveSupportHeal`.
- Cleanse: first player-targeted mark whose id is in `cleanseOneOf` (array order). If none, first player buff with `EffectType.POISON` or `BLEED`.
- Heal: `hp = min(maxHp, hp + 25)`. Always, even with no DoT.

## Complexity premise

Spec listed ResolveSkillSystem SUPPORT heal/cleanse. Verified: small sibling of T-046. **Do not** invent SkillTag. **Do not** edit Kai.

## Layers

R0: `types.ts` `supportHeal`; `skills.ts` `BASIC_MEDICAL`; `ResolveSkillSystem.ts` heal+one DoT. Tests + R3 probe.

## Relevant files

- `src/game/types.ts` — Skill `supportCleanse` neighbor
- `src/game/constants/skills.ts` — `BASIC_MEDICAL` / `KAI`
- `src/game/systems/ResolveSkillSystem.ts` — `resolveSupportCleanse` ~462; SUPPORT branch ~910
- `src/game/systems/__tests__/t046Kai.test.ts` — fixture template
