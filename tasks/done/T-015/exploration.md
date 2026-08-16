# T-015 · exploration

**Ring:** R0 modes data + weight aggregator.

- `MODE_DEFINITIONS.shadow_clone.weightModifiers` is `[]`; Rasengan +4 lives only as an enhancement note.
- Catalog Rasengan id is `rasengan`.
- `effectiveWeight` already reads `ctx.modeBonuses[skill.id]`.
- `buildUpkeepWeightContext` (T-013) can pass built bonuses from `combatState.activeModes`.
