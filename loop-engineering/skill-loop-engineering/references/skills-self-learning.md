# Skills — the learning loop (self-learning)

Skills are the system's third loop: **the creational loop produces tasks, the
development loop produces code, and the skills loop produces reusable knowledge
that improves the other two.**

## Structure of a system skill

```
.claude/skills/<name>/
├─ SKILL.md          # the living skill: rules, techniques, decisions. Versioned (v1.0, v1.1…)
├─ LEARNINGS.md      # changelog of learnings: what was added, why, evidence (T-XXX)
├─ RUBRIC.md         # the score-system rubric (scoring-and-calibration.md), if the skill has a subjective dimension
├─ SCORES.md         # score history per task → measurable trend
└─ examples/
   ├─ good/          # real project examples that score high (positive anchors)
   └─ bad/           # real rejected examples and WHY (negative anchors)
```

## Life cycle

```
   GENESIS ──────▶ USE ──────▶ HARVEST ──────▶ CONSOLIDATION ──┐
   /skill-new    injection    skill-curator    /skill-evolve    │
   (with you)    in phases    at each CLOSE    (periodic)       │
      ▲                                                          │
      └──────────────────── skill vN+1 ◀─────────────────────────┘
```

**1. GENESIS (`/skill-new`)** — two paths, both with you in the loop:
- **Seed path:** you provide the base skill (your knowledge, a doc, a project
  standard). Claude structures it to the format and proposes gaps to fill.
- **Research path:** brainstorm + joint investigation (the creational loop applied
  to knowledge instead of tasks). You investigate, debate, and the agreed result is
  SKILL.md v1.0.
- When: at project start (foundational skills: "core-architecture", "visual-style",
  "domain-x" — yours) or when something important emerges mid-way ("we've repeated
  this particle pattern 3 times → skill").

**2. USE** — in `/task-dev`, SETUP detects which skills the spec references and
injects them into the subagents of the relevant phases: the planner gets the
architecture skills, the implementer the technique ones, the reviewer the
RUBRIC.md. Subagents cite the skill when a decision leans on it (traceability).

**3. HARVEST (skill-curator, automatic at each CLOSE)** — see the agent below.
Turns each task's experience into concrete deltas to the skill.

**4. CONSOLIDATION (`/skill-evolve`, periodic or on hitting the size limit)** — the
skill can NOT grow without limit (a 2000-line skill nobody reads, human or model).
Every N tasks or on passing ~300 lines: merge redundant rules, promote repeated
patterns to a general rule, archive the obsolete, re-version (v1.x → v2.0 if
something structural changes).

## `.claude/agents/skill-curator.md`

Ready-to-copy in `assets/agents/skill-curator.md`. In short (opus, Read/Edit):
receives a fully closed T-XXX (spec, plan, review.md, deviations, scores). For each
skill used in the task, proposes classified deltas:

- NEW or modified RULE            → needs human approval
- ANTI-PATTERN detected           → needs human approval
- EXAMPLE: ARCHIVE in examples/good|bad (reference material) → auto-applicable
- EXAMPLE: PROMOTE to a RUBRIC.md anchor (it now defines a band) → human
- RUBRIC ANCHOR ADJUSTMENT (scoring-and-calibration.md) → needs human approval
- NIT (typo, clarification)        → auto-applicable

Hard rules:
1. EVERY delta carries evidence: a reference to the task and the concrete fact
   ("in T-014 the reviewer blocked X for Y" — not "it'd be a good idea…"). No
   evidence, no delta. Skills learn from FACTS, not opinions.
2. A learning that contradicts an existing rule does NOT overwrite it: the conflict
   is presented to the human with both pieces of evidence.
3. Record each applied delta in LEARNINGS.md with date, task and version.
4. If there's nothing to learn, report "no deltas" — don't invent learnings to
   justify your run.

## Anti-degradation (skills can rot too)

- **Evidence mandatory:** with no backing T-XXX, the delta is rejected.
- **Conflicts escalate to human:** the skill never silently self-contradicts.
- **Bounded size + consolidation:** better 10 anchored rules than 100 vague ones.
- **The human is the editor-in-chief:** rules and anchors change only with your OK;
  the system proposes, you dispose.

## Related anti-patterns

- **Skill-bloat:** the skill accumulates 40 rules nobody re-reads → mandatory
  consolidation by size; better few anchored rules with examples.
- **Learning without evidence:** the curator "learns" opinions → every new rule
  references a concrete task or is rejected.
