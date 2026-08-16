# T-016 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- AC1: Drill + `mainAttackId: 'rasengan'` consume yields `{ rasengan: 2 }`; second consume empty; `effectiveWeight` +2. `baseWeight` unchanged.
- AC2: Gate Prep consume yields `gate_of_life` and `gate_of_limit` each +3.
- AC3: Drill with null/empty Main enqueues nothing; unknown skill ids enqueue nothing.
- Resolve hook: successful `resolveSkill` of Drill with `weightContext.mainAttackId` writes `pendingSupportWeights`.

## Architecture

- RING-GUARD PASS: `SupportWeightSystem` has no imports (types only). `ResolveSkillSystem` stays R0.
- Reuses T-003 `supportBonuses` / `effectiveWeight`. One-shot bag. No Gate HP −50%, no Mode weightModifiers, no invented deltas.
- Live `processUpkeep` consume deferred (R1 persist would re-apply without `useCombat` writeback). Spec allows unit-test path.

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: `gate_prep` still lacks `cardRole` so live `resolveSkill` rejects it (`incomplete-authoring`); enqueue rules live on `applySupportWeightOnPlay` by id (explicitly out of scope to reauthor).
