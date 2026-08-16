# T-052 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `RISING_WIND` is AP2 unmarked ACTIVE with STR +25% ×1 | **true** | `skills.ts` 365–384: `apCost: 2`, no `cardRole`, `effects` BUFF STR 0.25 duration 1, no `markEffects` / `allowedRanges` |
| T-023 Off-Balance +20% / Exposed +15% ranged already in `markDamageMultiplier` | **true** | `ResolveSkillSystem.ts` 376–381: `off_balance` ×1.2; `exposed` ×1.15 if RANGED |
| T-050 Feint is flat +15 next any ATTACK | **true** | consume gate `feint` only on `CardRole.ATTACK`; payoff `damageDealt += 15` |
| No `launched` id exists | **true** | grep: only T-052 spec |
| `SkillTag.SETUP` exists | **false** | `types.ts` SkillTag has TAIJUTSU/PHYSICAL/LEE, no SETUP |
| ATTEMPT `markEffects` plant on miss | **true unless `perHit`** | `applySkillMarkEffects`: ATTEMPT non-perHit applies 1 even at hitsLanded 0 |
| `effects[]` STR buff is applied by `resolveSkill` to next ATTACK dmg | **false under test ports** | resolve path uses `rollHit` damage + mark/mode/setup mults; legacy STR buff is dead packaging |
| No test locks Rising Wind STR +25% | **true** | no `rising_wind` assertions in `__tests__` |

## Ports / reuse

- Plant: existing `markEffects` + `applySkillMarkEffects` (SIDE/ATTACK).
- Consume: `consumeOnAttempt` predicate (sibling of `feint` / `lotus_opening`).
- Payoff: `markDamageMultiplier` (same bucket as Off-Balance). Document: composition is **multiply** (`off_balance` × `launched` = 1.44 if both spent).
- Miss plant: author `perHit: true` so stacks = hitsLanded (0 on miss). Do **not** retune global ATTEMPT plant (Feint out of scope).

## Complexity premise

Spec said “reuse Off-Balance mult wiring with a melee-only gate.” Confirmed: one `ids.has('launched') && MELEE` line in `markDamageMultiplier` + consume predicate. No second damage pipeline.

## Layers

R0 only: `skills.ts` `RISING_WIND`; `ResolveSkillSystem.ts` consume + mult. Tests + `src/simulation/` probe (R3) as T-050/T-051.
