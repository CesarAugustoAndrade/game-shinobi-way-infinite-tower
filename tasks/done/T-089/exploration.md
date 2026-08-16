# T-089 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| DRAGON_FLAME is legacy AP2 + Burn 10×3@70%, no Mode | **true** | `skills.ts:1937–1963` |
| Fireball already has 2T +50% / 1 charge | **true** | `skills.ts:1605–1648`; `ResolveSkillSystem` Mode path |
| Need new Mode machine | **false** | Reuse `modeInteraction` + `trySpendCharges` |

## Complexity premise

Authoring-only plus Fireball-shaped tests. No ResolveSkill id special-case.

## Port signatures

None. Stay R0.
