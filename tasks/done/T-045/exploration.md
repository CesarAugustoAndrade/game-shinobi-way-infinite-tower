# T-045 exploration

**Ring:** R0. Route: `autonomous`.

## Terrain

| Path | Role |
|---|---|
| `skills.ts` ~1479 | `GENTLE_FIST` — AP2/CP4/CD2, 12 TRUE, CHAKRA_DRAIN 20, no role/Mode/CP |
| `ResolveSkillSystem` Mode path | `consumeCharges` + `damageMultBonus` when Mode ON (Fireball style). No requireOn = base legal |
| `consumeAllMatchingMarks` | 64 Palms — all CP. Twin Lion impact consume-all. Neither is “hasta 2” |
| `ResolveSkillState` | no `enemyChakra` |
| Air Palm CP | `chakra_point` IMPACT — generic `consumeOnImpact` would eat 1 extra if we also spend 2 |

## Premises

- Reuse Mode path for +40%/1 charge at **attempt** (even miss).
- New `impactMarkConsume` (max 2, +10%/stack, drain 4) applied on ≥1 hit **independent of Mode**.
- Skip generic IMPACT consume for that markId on this skill so total consumed is min(2, stacks).

## Re-classify

No.
