# T-135 review

**Verdict:** APPROVE

## Spec conformance

- AC1: 20 vs 35 → 0 dmg, 15 stacks
- AC2: 40 vs 35 → 5 dmg, mark stripped
- AC3: live HP loss 56 → 21 (35 absorbed)
- Oldest-first; player SHIELD family only. No skill reauthor.

## Architecture

- R0 helper + EnemyTurn after outgoing cuts, before HP. Buff shields still apply first (document). RING-GUARD PASS.

## Quality

- BLOCK: none
- NIT: CombatSimulationService still buff-only (OOS).
