# Score system — subjective evaluation with anchored rubrics

Problem: in a lot of work half the value is subjective — art, visualization,
presentation, UX, clarity, writing tone — and in a game, fun, playability, game
feel. "Looks good" isn't evaluable. Solution: **rubrics with anchors from the
project itself**, that live in the skills and evolve with the learning loop
(skills-self-learning.md).

## Anatomy of a rubric (`RUBRIC.md` of a skill) — 0-100 scale by bands

The scale is 0-100, but **the anchors define BANDS of 20 points**: the evaluator
first places the deliverable in its band by comparing with the anchors, then fine-
tunes within the band. An 87 vs 85 with no justification is false precision; an 83
vs 65 is a band judgment and that DOES have to be anchored.

```markdown
# Rubric · visual-style (v1.3)   ← EXAMPLE from a game project; use your dimensions

## Dimension: Visual legibility (weight 3)
| Band | Anchor |
|---|---|
| 0-20  | The unit is indistinguishable from the background at game zoom |
| 21-40 | Distinguishable but faction/role is ambiguous at a glance |
| 41-60 | Faction and role clear; recognizable silhouette ← 60 = MIN per dimension |
| 61-80 | + instant read of state (damaged/elite) without a tooltip |
| 81-100| + memorable identity; distinguishable in 20+ unit skirmishes |
| Good anchor (≈85): examples/good/asset-v3.png (T-011) |
| Bad anchor  (≈35): examples/bad/asset-v1.png (T-009: low contrast with background) |

## Dimension: Style coherence (weight 2)
[...same structure...]

## Dimension: Animation game feel (weight 2)
[...]

## Calculation
Deliverable score = weighted mean (0-100).
APPROVE: ≥80 and no dimension <60. In type=polish: ≥90.
```

Typical project dimensions (each in the skill it belongs to):

| Dimension | Owner skill | Who scores |
|---|---|---|
| Art / visual style | visual-style | reviewer + human in calibration |
| Visualization / UI clarity | ui-ux | reviewer |
| Presentation (menus, transitions, juice) | presentation | reviewer |
| Experiential (game: fun; product: flow) | experience | **human mainly** (see limit below) |
| Domain rules with trade-offs (e.g. balance) | domain-x | reviewer with sim data + human |
| Code: readability, port APIs | core-architecture | reviewer |

## Calibration phases — transferring YOUR vision to the scoring skill

The scoring skill isn't born knowing what you like: **at first, the rubric IS
YOU**, and the system exists to capture your judgment into anchors until it can
delegate. Delegation is PER DIMENSION, not global — each dimension advances at its
own pace.

```
PHASE 1 · YOU ARE THE RUBRIC (first ~5-10 evaluations of the dimension)
├─ You score everything and verbalize the why ("this is a 45 because the role
│  doesn't read"). The gate is decided by YOUR score.
├─ The reviewer scores in SHADOW MODE: its score is recorded in SCORES.md but
│  doesn't count. It measures how far it is from understanding you.
└─ The curator turns each of your whys into anchors and examples → the RUBRIC.md
   is built with YOUR vision, not the model's generic taste.

PHASE 2 · CO-SCORING
├─ Both score; the gate is still your score.
├─ Discrepancy |Δ|>15 → the curator proposes a new or corrected anchor.
└─ Convergence metric: mean of |Δ| over the last 10 evaluations.

PHASE 3 · DELEGATION (with a safety net)
├─ Entry gate: mean |Δ| ≤10 over the last 10 evaluations of THAT dimension.
├─ The reviewer/auditor scores and decides; you do spot-checks (~1 in 4) and
│  ALWAYS evaluate yourself in type=polish and in Ring 0-1.
└─ If a spot-check reveals |Δ|>15 → the dimension returns to Phase 2. No drama:
   it's the signal that your vision evolved and the rubric fell behind.
```

Expected reality: "code readability" or "style coherence" converge fast (very
anchorable criteria); "fun" may never leave Phase 2 — and that's fine, there the
reviewer is a permanent pre-filter.

Two tunings:
- **Fast-track:** a dimension where the model is already well-calibrated out of the
  box (typically code ones) may start directly in Phase 2 **with your explicit OK**
  at the skill's genesis. Taste ones (art, feel) always go through Phase 1.
- **Per-dimension convergence window:** default 10 evaluations; the curator may
  propose adjusting it (5 for code dimensions, 15 for art) like any other delta —
  with evidence and your approval.

## The calibration loop (mechanics of the improvement)

```
reviewer scores 78 ──▶ you score 55 ──▶ |Δ|=23 recorded in SCORES.md
                                            │
                                            ▼
                     skill-curator proposes: corrected band anchor
                     ("a case like X is band 41-60 because Y") + a real
                     example to examples/bad/ ──▶ you approve ──▶ rubric vN+1
```

## SCORES.md — compact format (one line per evaluation)

```
| Task  | Dim         | Score | Eval     | Δ   | Insight (≤1 line)                       |
|-------|-------------|-------|----------|-----|-----------------------------------------|
| T-014 | legibility  | 72    | human    | +17 | 1px outline separated the unit from bg  |
| T-014 | legibility  | 80    | reviewer | —   | (shadow, Phase 2: |Δ| human-reviewer = 8)|
| T-016 | game-feel   | 58    | human    | -6  | the new screen-shake hides the hit-flash|
```

The Δ is against THAT dimension's last score: the column tells the story of
whether the project is improving and why, readable in 30 seconds. From it come the
two health metrics:
- **Trend per dimension** → is the project's art improving over time?
- **Discrepancy rate** → is the reviewer calibrated? If it converges, you can
  delegate more; if it diverges, the rubric needs better anchors.

## The system's honest limit

Experiential dimensions (in a game, "fun" and "game feel"; in a product, "feels
smooth") are where a model evaluating cold is least reliable: it doesn't play the
match or feel the pacing. There the rubric serves the objectively-adjacent
(visual feedback on each action, input response time, clarity of tactical options)
and **you are the primary evaluator**; the reviewer is a pre-filter. The score
system doesn't replace the playtest — it makes it accumulable and comparable
across iterations.

## Related anti-patterns

- **Rubric without anchors:** 0-100 scores with no real examples → false precision
  (an "87" that means nothing). A dimension without project band-anchors doesn't
  enter the APPROVE.
- **Circular self-calibration:** the reviewer adjusts its own rubric with no
  recorded human discrepancy → forbidden; anchors change only with your OK.
- **Premature delegation:** moving a dimension to Phase 3 without meeting the
  convergence gate (|Δ|≤10) → the skill scores with the model's generic taste, not
  your vision. The human-intensive Phase 1 isn't bureaucracy: it's where the system
  learns WHAT is good for YOU.
