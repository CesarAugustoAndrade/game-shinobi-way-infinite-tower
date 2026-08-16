# T-015 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- AC1: `MODE_DEFINITIONS.shadow_clone.weightModifiers` is `[{ skillId: 'rasengan', delta: 4 }]`. Catalog id matches.
- AC2: `buildModeWeightBonuses` sums ON skillId deltas; COOLDOWN/empty boards omit rasengan.
- AC3: `effectiveWeight(rasengan, { modeBonuses: built }) === base + 4` (posture held fixed).
- Live wire: `buildUpkeepWeightContext` passes `modeBonuses: buildModeWeightBonuses(activeModes)` into the T-012 upkeep draw path.

## Architecture

- RING-GUARD PASS: `ModeWeightSystem` imports only `../types` + `../constants/modes`. No React/DOM, no `components`/`scenes`/`hooks`/`contexts`.
- Reuses T-003 `WeightContext.modeBonuses` / `effectiveWeight`. Tag/role modifiers deferred (skillId path only; unused by authored rows).
- No damage-% enhancements, no Mode skill reauthor, no invented deltas.

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: `undefined` Mode state treated as ON — matches existing `activeModeIds` filter in the same function.
