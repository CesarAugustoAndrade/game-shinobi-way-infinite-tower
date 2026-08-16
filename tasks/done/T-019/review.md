# T-019 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- AC1: Enemy clones ON charges 3 → drain to 2; last charge → COOLDOWN; no Silence; player `modes` untouched.
- AC2: Empty enemy board → Silence 1 on `enemyBuffs`; modes unchanged.
- AC3: Sealing Tag `effects[]` no longer packages Silence; drain path has no Silence buff.
- `pickEnemyModeToDrain` uses first ON (optional priority list).

## Architecture

- RING-GUARD PASS: `ResolveSkillSystem` + `CombatModeSystem` + catalog stay R0. No React/UI.
- Reuses `drainCharges`. Optional `enemyModes` / `enemyBuffs` so T-007 fixtures still compile.
- SUPPORT xor only when `consumeCharges` and no player `modeId`.

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: live `useCombat` still has no enemy Mode board (explicitly out of scope).
