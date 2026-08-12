<!--
  T-XXX spec template — the CONTRACT the development loop must satisfy.
  Copy to tasks/backlog/T-XXX.md and fill it via /task-new. Skill:
  loop-engineering → references/dev-loop-system.md (§2).
-->
# T-XXX · [short title]

- **Type:** create | fix | expand | polish | iterate
- **Layer(s) touched:** domain | ports | use-cases | adapters-in | adapters-out | composition-root | assets
  <!-- DDD overlay (optional, ddd.md): refine domain/use-cases to
       aggregate | value-object | domain-event | domain-service | repository-port | application-service -->
- **Bounded context:** <context name> · **Subdomain:** core | supporting | generic
  <!-- DDD overlay only; delete this line on non-DDD projects. Subdomain modifies
       the ring policy (ring-system.md): core bumps up, generic may go cheaper. -->
- **Priority:** P0-P3
- **Agent estimate:** S (1 implementer) | M (2-3) | L (3+ and planner on fable)

## Context
[Why this task exists. Current state. Links to related tasks.]

## Spec
[WHAT must exist when done, not HOW. In type=fix: exact repro of the bug.
 In type=iterate: which feedback from the previous cycle this attacks.]

### Architectural constraints (inherited from hexagonal)
- [ ] The domain imports nothing from adapters or frameworks
- [ ] New external dependencies enter only as an adapter of a port
- [ ] All new wiring goes through the composition root
- [task-specific constraints]

## Verification

Capture only what MATTERS — few, high-value acceptance criteria, not an exhaustive
test list. Here you name WHAT must be true and the gate command that will check it;
the concrete test bodies are written when the task STARTS (the implementer, TDD:
tests before/with the code), not now.

- **Evaluation route:** `autonomous` (all AC objective → zero human in the pipeline)
  | `with-scoring` (a genuinely-needed subjective dimension → step 6b). Default to
  autonomous: if it can be objective, make it objective.

### Objective AC (the 1-3 most important — blocking, run by `verifier`)
Each AC: what must be true → the gate command that will run its (yet-to-be-written)
test. Plus the always-on standard gates.
- [ ] RING-GUARD (standard, every task): dependency check FAILS if the diff touches
      a ring deeper than declared here
      (e.g. `npx depcruise --validate .dependency-rules.js src` + diff-scope)
- [ ] `tsc --noEmit` with no errors
- [ ] AC1: <what must be true> → gate: `npm test -- --grep "T-XXX"`
- [ ] AC2: <…>   (stop at the few that matter; the implementer may add more tests)
DDD overlay gates (optional, ddd.md — keep only on a DDD project):
- [ ] CONTEXT-GUARD: dep-check fails if this diff imports another context's
      internals (only its published API / ACL is allowed)
- [ ] AGGREGATE-BOUNDARY: no reference across aggregates except by ID; inner
      entities not touched from outside the root (grep/lint)
- [ ] INVARIANT TESTS: each aggregate invariant this task adds/changes has a
      property/invariant test (counts toward Ring 0 ≥90% coverage)
Non-code deliverables also get an objective gate: assets (exact dimensions, format,
weight ≤X KB, path), docs (valid links, structure), data (valid schema, ≥N rows).

### Subjective criteria (0-3 — ONLY if subjectivity is truly necessary)
Prefer objective; add a subjective dimension only when it genuinely can't be made
objective (default: none). Score 0-100 against the scoring skill's RUBRIC;
threshold: weighted mean ≥80, no dimension <60 (polish ≥90).
- [ ] [only if needed] <dimension> → RUBRIC of the matching skill

## Out of scope
[Explicit. What the implementer must NOT touch even if it looks improvable.]
