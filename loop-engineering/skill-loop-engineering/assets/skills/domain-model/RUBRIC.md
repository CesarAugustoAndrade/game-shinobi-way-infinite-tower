# Rubric · domain-model-<context> (v1.0)

<!-- SCAFFOLD. The subjective dimension DDD contributes to the score system
     (scoring-and-calibration.md). Anchor the bands with REAL examples from this
     project as they appear; a band with no project anchor is false precision.
     Calibration: taste-adjacent, so start in Phase 1 (you score, reviewer shadow)
     unless you give an explicit fast-track OK. -->

## Dimension: Model expressiveness / aggregate design (weight 3)

| Band | Anchor |
|---|---|
| 0-20  | Anemic: aggregates are data bags, all logic in services; code doesn't name the domain |
| 21-40 | Some behavior on objects but boundaries arbitrary; invariants enforced in use cases, not the aggregate |
| 41-60 | Aggregates hold their invariants; boundaries defensible ← 60 = MIN per dimension |
| 61-80 | + boundaries match true consistency needs; cross-aggregate refs by ID; language consistent with the glossary |
| 81-100| + a domain expert would recognize the model; the boundary made a later change local instead of sprawling |
| Good anchor (≈85): <examples/good/... (T-XXX)> |
| Bad anchor  (≈35): <examples/bad/... (T-XXX): logic leaked into a service> |

## Calculation

Deliverable score = this dimension (add more if the context warrants: e.g.
"ubiquitous-language fidelity" as a separate weight-1 dimension).
APPROVE contribution: ≥60 here; the task's overall gate is the weighted mean per
the spec (≥80, no dimension <60; polish ≥90).
