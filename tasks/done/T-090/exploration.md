# T-090 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| LIGHTNING_BALL is legacy ACTIVE 15 + Stun 40%, no Mode/role/ranges | **true** | `skills.ts:2049–2073` |
| Catalog wants ATTACK AP2/CP5/CD3 M/L + 45% Stun 1 + 3T +40%/1 charge | **true** | `#catalogo` lightning_ball |
| Fireball/Dragon Flame prove Mode `damageMultBonus` + `consumeCharges: 1` | **true** | `skills.ts` FIREBALL / DRAGON_FLAME |
| Chidori (T-025) is a different 3T contract (2 charges + MEDIUM grant) | **true** | `skills.ts` CHIDORI `consumeCharges: 2`, `grantRanges` |
| Need new Mode machine | **false** | Reuse `modeInteraction` + existing resolve path |
| `effects[]` STUN is mute in resolve | **true** | `ResolveSkillSystem` only applies stun via `impactStun` (`resolveImpactStun`) |
| 45% Stun live path exists | **true** | T-081 `impactStun: { chance: 0.45, duration: 1 }` |

## Complexity premise

Authoring-only plus T-089/T-032-shaped tests. Stun uses `impactStun` (HARD_CONTROL buff path), not a new motor. No ResolveSkill id special-case. Port signatures unchanged → stay R0.

## Relevant files

- `src/game/constants/skills.ts` — `LIGHTNING_BALL` row
- `src/game/systems/ResolveSkillSystem.ts` — Mode enhance + `resolveImpactStun` (reuse only)
- `src/game/systems/__tests__/t089DragonFlame.test.ts` — AC template
- `src/game/systems/__tests__/t081ThousandYears.test.ts` — 45% stun rng port
- `src/simulation/DragonFlameBalance.ts` / `ChidoriStreamBalance.ts` — probe templates

## Existing tests

None for `lightning_ball`. T-025/T-032/T-034/T-089 cover sibling Mode contracts. Do not retune those.

## Port signatures

None. Stay R0.
