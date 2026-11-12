# T-081 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none. Authoring-only.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `THOUSAND_YEARS` unmarked ACTIVE AP2/CP1/CD5 9, STUN 100% + CONFUSION 60%×2 | **true** | `skills.ts` 3005–3027 |
| SIDE on-hit `controlConfusion` already dispatches | **true** | ResolveSkillSystem 1142–1148 |
| SIDE on-hit `impactStun` already dispatches | **true** | ResolveSkillSystem 1150–1156 |
| Call order: confusion then stun (two rng draws) | **true** | same block |
| SkillTag.CONTROL | **false** | TAIJUTSU + PHYSICAL |

## Complexity premise

Dual independent rolls already exist as two ports. No ResolveSkillSystem change.

## Layers

R0: `skills.ts` THOUSAND_YEARS. Tests + R3 probe.
