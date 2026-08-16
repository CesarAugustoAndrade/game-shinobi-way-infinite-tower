# T-060 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S–M
**Port signatures:** none touched → stays R0. New resolve path is an R0 helper, not a port.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `WIRE_SETUP` is unmarked ACTIVE AP1/CP1/CD4, self STR +20%×1 + BLEED 8@40% | **true** | `skills.ts` 859–882: no `cardRole`, no enemy mark |
| SUPPORT already plants `markEffects` | **true** | `ResolveSkillSystem.ts` 877–878 `applySkillMarkEffects(next, skill)` |
| Off-Balance +20% is ATTEMPT-spent, miss still consumes | **true** | `markDamageMultiplier` + T-023 miss eats `off_balance` |
| Generic IMPACT consume fires on any ≥1 hit (ATTACK **and** SIDE) | **true** | `consumeOnImpact` after hits (976–986) |
| `setupRead` is per-ATTACK skill (Mind Destruction) | **true** | T-042 `setupRead` on that skill only |
| Catalog wants **any** next ATTACK, not a named follow-up | **true** | spec AC3 uses a generic base-10 ATTACK |
| `wire_kunai_reel` / tripwire are different ids | **true** | T-023 / T-024 |
| No test locks WIRE_SETUP STR/Bleed identity | **true** | no `wire_setup` in `__tests__` |
| AUTO method = ANY range | **true** | `defaultsForAttackMethod(AUTO)` → all bands |

## Ports / reuse

- SUPPORT plant: existing `applySkillMarkEffects` (no hits gate).
- +20% floor: same `Math.floor(dmg * 1.2)` as Off-Balance, **after** attempt `markMult` if both present (`1.2 × 1.2`).
- Bleed plant: `addMark` `bleed` stacks 5 duration 2 DOT enemy (T-048/T-059 shape).
- Consume: **dedicated ATTACK-only** path. Do **not** let generic `consumeOnImpact` eat `wire_trap` on SIDE.

## Complexity premise

Spec said compose with Off-Balance + IMPACT consume. Confirmed Off-Balance is ATTEMPT (wrong consume timing for trap). Confirmed generic IMPACT would fire on SIDE (forbidden). Need a new `resolveWireTrapImpact` gated on `role === ATTACK && hitsLanded ≥ 1`. Not a new mark engine — one mark-id payoff sibling of `setupRead` / Off-Balance.

## Layers

R0: `skills.ts` `WIRE_SETUP`; `ResolveSkillSystem.ts` ATTACK wire-trap payoff (mult + bleed + consume; skip generic IMPACT for `wire_trap`). Tests + R3 probe.

## Relevant files

- `src/game/constants/skills.ts` — `WIRE_SETUP`.
- `src/game/systems/ResolveSkillSystem.ts` — SUPPORT plant; damage mult; `consumeOnImpact`.
- `src/game/systems/__tests__/t023SideToolMarksMove.test.ts` — Off-Balance ×1.2 (must stay ATTEMPT).
- `src/game/systems/__tests__/t048KunaiSlash.test.ts` / `t059SwordSlash.test.ts` — bleed plant shape.

## Surprises / debt

- `consume: IMPACT` on the mark is honest catalog metadata but **must** be excluded from generic `consumeOnImpact` or SIDE would steal the trap with no +20%/bleed.
- Do not retune `wire_kunai_reel`.
