# The two-loop development system

The concrete system for agentic development on a hexagonal architecture
(domain / application / adapters / composition-root). Examples use varied domains
(a game, an API, a product) — substitute your project's.

## 0. Overview

```
┌──────────────────── CREATIONAL LOOP (human + Claude, synchronous) ───────────────────┐
│                                                                                      │
│   idea ──▶ /task-new ──▶ brainstorm ──▶ SPEC ──▶ verification criteria ──▶ T-XXX     │
│              │              (dialogue)    │        objective + subjective             │
│              └── type: create|fix|expand|polish|iterate                               │
│                                                                                      │
└───────────────────────────────────┬──────────────────────────────────────────────────┘
                                    │  tasks/backlog/T-XXX.md
                                    ▼
┌──────────────────── DEVELOPMENT LOOP (/task-dev, agentic) ───────────────────────────┐
│                                                                                      │
│  1.EXPLORE ──▶ 2.RESEARCH ──▶ 3.ANALYZE+PLAN ──▶ 4.IMPLEMENT ──▶ 5.REVIEW ──▶ VERIFY │
│   (haiku)      (sonnet)        (opus/fable)      (sonnet ×N)     (opus)       gate    │
│                                                                     ▲           │     │
│                                                                     └── fix ────┘     │
│                                                                     (max 2 cycles)    │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

Guiding principle: **the creational loop produces a contract (spec +
verification); the development loop is a pipeline that can only close a task if
the contract is met.** No subjective "done" from the implementer: the gate is
decided by verification.

## 1. File structure

```
project/
├─ .claude/
│  ├─ commands/
│  │  ├─ task-new.md          # entry to the creational loop
│  │  ├─ task-dev.md          # orchestrator of the development loop
│  │  ├─ task-verify.md       # just the verification gate (re-runnable)
│  │  └─ forge-specialist.md  # (your existing one, for ad-hoc specialists)
│  └─ agents/
│     ├─ explorer.md          # model: haiku
│     ├─ researcher.md        # model: sonnet
│     ├─ planner.md           # model: opus  (or fable if the task is architecture-heavy)
│     ├─ implementer.md       # model: sonnet
│     ├─ reviewer.md          # model: opus
│     └─ verifier.md          # model: sonnet (executes, doesn't opine)
├─ tasks/
│  ├─ backlog/                # T-XXX.md created, not started
│  ├─ active/                 # in the development loop (+ working-files folder)
│  │  └─ T-012/
│  │     ├─ T-012.md          # the spec (source of truth)
│  │     ├─ exploration.md    # phase 1 output
│  │     ├─ research.md       # phase 2 output
│  │     ├─ plan.md           # phase 3 output (human-approvable)
│  │     └─ review.md         # phase 5 output
│  └─ done/
└─ src/                       # hexagonal: domain/ application/ adapters/ infrastructure/
```

Rule: **each phase writes its output to disk**, not just to context. That enables
resume, audit, and lets each subagent start with minimal context (it reads the
prior phases' `.md` files instead of inheriting a giant context). Direct token
savings.

## 2. Creational loop — task template (the contract)

`tasks/backlog/T-XXX.md`:

```markdown
# T-XXX · [short title]

- **Type:** create | fix | expand | polish | iterate
- **Layer(s) touched:** domain | ports | use-cases | adapters-in | adapters-out | composition-root | assets
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

- **Evaluation route:** `autonomous` (100% objective verification → zero human in
  the pipeline) | `with-scoring` (there are subjective dimensions → step 6b, §4).
  Decided by the creational loop: if EVERYTHING verifiable fits into objective
  tests (e.g. performance: "p95 of operation X < N ms under load Y"), the route is
  autonomous even if the task looks "quality-flavored".

Capture only what MATTERS — the few, high-value acceptance criteria, not an
exhaustive test list. Name WHAT must be true + the gate command that will check it;
the concrete test bodies are written when the task STARTS (the implementer, TDD),
not at creation.

### Objective AC (the 1-3 most important — blocking, run by `verifier`)
Each AC: what must be true → the gate command that will run its (yet-to-be-written)
test. Plus the always-on standard gates (commands with exit codes, no judgment).
- [ ] RING-GUARD (standard, on every task): a dependency check that FAILS if the
      diff touches a ring deeper than the one declared in the spec
      (e.g. `npx depcruise --validate .dependency-rules.js src` + diff-scope)
- [ ] `tsc --noEmit` with no errors
- [ ] AC1: <what must be true> → gate: `npm test -- --grep "T-XXX"`
- [ ] AC2: <…>   (stop at the few that matter; the implementer may add more tests)
Non-code deliverables also get an objective gate (before the subjective one):
e.g. assets (exact dimensions, format, weight ≤X KB, existence at the expected
path), docs (valid links, structure), data (valid schema, ≥N rows).

### Subjective criteria (0-3 — ONLY if subjectivity is truly necessary)
Prefer objective; add a subjective dimension only when it genuinely can't be made
objective (default: none). Evaluator depends on each dimension's calibration phase
(see scoring-and-calibration.md): at first YOU, later the `reviewer` (or an
`auditor` persona) using the skill's RUBRIC.md. Threshold: weighted mean ≥80 and no
dimension <60 (polish: ≥90).
- [ ] [only if needed] <dimension> → RUBRIC of the matching skill

## Out of scope
[Explicit. What the implementer must NOT touch even if it looks improvable.]
```

### The 5 types and what changes in the brainstorm

| Type | Brainstorm focus | Typical verification |
|---|---|---|
| **create** | Port design first: which interface? which adapters? | new tests + architecture |
| **fix** | Exact reproduction before anything. The failing test IS the spec | mandatory regression test |
| **expand** | Which existing port is extended vs. which new one is created | existing tests intact + new |
| **polish** | Subjective criteria dominate (UX, feel, perceived performance) | subjective rubric, high threshold |
| **iterate** | Diff against the previous cycle's feedback; read the prior review.md | re-evaluation of failed criteria |

### `/task-new` — command (`.claude/commands/task-new.md`)

See `assets/commands/task-new.md` for the ready-to-copy version. In short:

1. Classify the type (create/fix/expand/polish/iterate). If ambiguous, ask.
2. Ask at most 3 clarifying questions, ONE per turn. Prioritize: fix → exact
   reproduction; create/expand → which hexagonal layer and which ports;
   polish/iterate → what "better" means.
3. Propose the spec draft using the task template. Don't invent constraints: the
   base architectural ones always apply, the specific ones are agreed.
4. Propose the verification — only what MATTERS: the 1-3 most-important objective
   AC (each = what must be true + the gate command), and 0-3 subjective criteria
   ONLY if subjectivity is genuinely necessary. Do NOT write the test bodies now —
   they're authored when the task starts (the implementer, TDD).
5. Iterate with the user until explicit OK.
6. Assign T-XXX (next free number), write to `tasks/backlog/`, show a 3-line
   summary.

Hard rules: a spec with no objectively-verifiable AC (each with its gate command)
is NOT saved — but the test bodies belong to task start, not creation. Don't
over-specify tests; capture the few AC that matter. If the task is too big (would
touch 3+ layers with new logic in each), propose splitting it into several chained
T-XXX.

## 3. Development loop — subagents

> **Persistence convention:** phase subagents RETURN their synthesis as their
> reply; it's the **main agent that persists** it as an `.md` in
> `tasks/active/T-XXX/`. Only `implementer` and `skill-curator` have Write/Edit.
> So the main receives only the distillate (see subagents-and-worktrees.md,
> reason 2) and nobody writes files without a tool to do it.
>
> **Model convention:** agents whose model varies by ring carry `model: inherit`;
> the `/task-dev` orchestrator sets the model when invoking them per the ring
> policy (see ring-system.md). Single source of truth: the ring table.

Ready-to-copy definitions for all agents live in `assets/agents/`. Summary of
each:

- **explorer** (haiku, Read/Glob/Grep) — maps the terrain of the relevant code.
  Read-only. Returns: relevant files (path + 1 line), existing ports/interfaces
  the task touches or should reuse, local dependency map of the affected area,
  existing tests, surprises/tech-debt. NO solutions. Budget ~15 files.
- **researcher** (sonnet, Read/WebSearch/WebFetch) — investigates techniques,
  libraries, external APIs. Returns: ≤3 technical options with concrete
  trade-offs; if an external library is a candidate, its exact API and how it
  would be wrapped in an adapter of the matching port (never used directly from
  domain/use-cases); a single justified recommendation in ≤5 lines. Skipped on
  trivial fixes and local polish.
- **planner** (inherit → Ring 0 = fable, else opus; Read only) — turns spec +
  exploration + research into a verifiable implementation plan. Returns: the
  design decision in 3-5 lines; ordered implementation steps, each with exact
  file(s) + hexagonal layer + which objective AC covers it; split across
  implementers if ≥2 (steps must be parallelizable with no file conflict); risks
  and plan B (≤3). Hard rule: every objective AC in the spec must be assigned to a
  step, whose implementer writes the AC's test (TDD; the test bodies aren't in the
  spec). If an AC isn't coverable by a test, STOP and report the spec must return
  to the creational loop.
- **implementer** (inherit → Ring 0 = opus, else sonnet; Read/Write/Edit/Bash) —
  implements concrete steps of an approved plan. Doesn't re-design. If a step is
  unviable, STOP and report (don't improvise an alternative design: that's the
  planner's). Writes the step's tests before or alongside the code, never "after"
  — including the test for each spec AC assigned to the step (the spec named the AC
  + gate command; the implementer writes the actual test). Respects out-of-scope
  even when it sees obvious improvements (notes them at the end). Runs its step's
  tests before reporting.
- **reviewer** (opus, Read/Grep/Bash) — reviews code against spec and
  architecture. Doesn't edit: reports. See scoring-and-calibration.md for how it
  scores. Checks: (1) SPEC CONFORMANCE — scores 0-100 ONLY the dimensions it's the
  canonical evaluator of; (2) ARCHITECTURE — hexagonal violations (forbidden
  imports, logic in adapters, wiring outside the composition root) = BLOCK; (3)
  QUALITY — bugs, untested edge cases, naming, classified BLOCK / SHOULD / NIT.
  Final verdict: APPROVE | FIX (lists the BLOCKs) | REDESIGN (back to planner).
  Hard on BLOCKs, light on NITs.
- **verifier** (sonnet, Bash/Read) — runs the spec's objective tests. Binary, no
  judgment. Output: a table command → PASS/FAIL + relevant output on failures.
  Nothing else. Doesn't fix, doesn't interpret. A missing command is a FAIL.

## 4. `/task-dev` — orchestrator (`.claude/commands/task-dev.md`)

Ready-to-copy version in `assets/commands/task-dev.md`. Input: `T-XXX` [+ flags:
`--skip-research`, `--plan-only`, `--auto`]. Pipeline:

**0. SETUP**
- Move `tasks/backlog/T-XXX.md` → `tasks/active/T-XXX/T-XXX.md`.
- WORKTREE ISOLATION (mandatory when working with agents):
  `git worktree add .worktrees/T-XXX -b task/T-XXX`. The whole pipeline works
  inside `.worktrees/T-XXX` — the original worktree (main) stays intact and usable
  by you. The N parallel implementers share the task's worktree (the plan
  guarantees disjoint files). See subagents-and-worktrees.md.
- DETERMINE THE RING (ring-system.md): the innermost ring declared in "Layers
  touched". The ring policy (models, gates, CYCLE LIMIT) governs the whole
  pipeline — the pipeline carries no numbers of its own, it reads them from the
  ring table.
- DETERMINE THE ROUTE (spec): `autonomous` (all objective, zero human after the
  plan) or `with-scoring` (there are subjective dimensions → there will be a step
  6b).
- LOAD SKILLS (skills-self-learning.md): list the skills the spec references;
  their `SKILL.md` + `LEARNINGS.md` are injected into each subagent of the phases
  where they apply.

**1. EXPLORE** → explorer subagent; the main persists `exploration.md`.
- If the planned diff touches a port's signature, the explorer flags it: that
  RE-CLASSIFIES the task to Ring 1 even if the spec said adapters (ring-system.md).

**2. RESEARCH** → researcher subagent; the main persists `research.md`.
- Skip if: type=fix with an obvious cause, type=polish local, or `--skip-research`.

**3. ANALYZE + PLAN** → planner subagent; the main persists `plan.md`.
- Model per ring: Ring 0 ⇒ fable; Ring 1 ⇒ opus (fable if it changes a port
  contract); Ring 2-3 ⇒ opus standard / sonnet on S tasks.
- HUMAN CHECKPOINT: present the plan and wait for approval. (`--auto` skips it ONLY
  in type=fix with a regression test already written, and NEVER in Ring 0-1: there
  the human checkpoint is non-negotiable.)
- If the planner reports "incomplete spec" → return to the creational loop. END.

**4. IMPLEMENT** → 1..N implementer subagents per the plan's split.
- Parallel only if the plan guarantees zero file overlap. Each implementer
  reports; consolidate deviations.
- **Art assets:** anything that would be better AS or WITH an asset — textures,
  particles, icons, sprites, backgrounds, scenes — is produced with the
  `/generar-asset` skill, not hand-rolled and not left as a placeholder/emoji
  fallback. Its output already targets the objective asset gate (dimensions,
  format, weight, path). If a task's deliverable is an asset, wire `/generar-asset`
  into the plan; if a placeholder is currently standing in for real art, that's a
  candidate improvement to note (→ `/task-new`).

**5. REVIEW** → reviewer subagent; the main persists `review.md`.
- APPROVE → step 6. FIX → resend BLOCKs to implementer(s); cycle limit is the
  ring's. REDESIGN → back to step 3 (once; after that, human). Exceeding the
  limit: STOP and escalate to the human with a summary of the stall.
- If there's an auditor panel (subagents-and-worktrees.md), it runs here in
  parallel with the reviewer; the panel is canonical evaluator of its dimensions
  (the reviewer doesn't score those).

**6. VERIFY (objective gate)** → verifier subagent.
- All PASS → step 6b (with-scoring route) or step 7 (autonomous route).
- Any FAIL → treat as FIX. SINGLE COUNTER: review-fix and verify-fail share the
  ring's cycle limit. In Ring 0 this is deliberately relentless: 1 cycle and
  escalate to human.

**6b. SCORE (subjective gate — ONLY on the with-scoring route, and ONLY over work
that already passed the objective gate: no human time spent scoring something
broken)**
- The main presents the subjective dimensions with their calibration phase
  (scoring-and-calibration.md) and ASKS which parts the human wants to verify and
  score: Phase 1-2 → their score is MANDATORY (the gate is theirs); Phase 3 →
  optional: delegate to the reviewer/panel score or spot-check (auto-reminder ~1
  in 4, always on polish).
- COMPACT record in the skill's SCORES.md, one line per dimension:
  `T-XXX | dim | score | Δ vs the dim's last score | why (≤1 line)`. The Δ and the
  why are the insight.
- Score < threshold → counts as a FIX cycle (same ring counter).
- 6b is BLOCKING but may stay `pending-score` if you launched the task unattended;
  the pipeline doesn't close without the Phase 1-2 scores. Design nightly tasks as
  the autonomous route when you can.

**7. CLOSE**
- Move `tasks/active/T-XXX/` → `tasks/done/`.
- Append to T-XXX.md: summary of what was done, cycles consumed, improvements
  noted by implementers (candidates for new tasks → suggest `/task-new`).
- LEARNING HARVEST (skills-self-learning.md) — CONDITIONAL: the skill-curator runs
  ONLY if there were scores, plan deviations, fix cycles, or the task is Ring 0-1
  / polish / iterate. On a clean Ring 3 fix: skip (opus on every trivial close
  contradicts the cost rationale).
- WORKTREE MERGE (per-ring protocol): (1) final commit on task/T-XXX inside the
  worktree; (2) rebase onto main and dry-run merge (`--no-commit --no-ff`) to
  detect conflicts — any conflict → ALWAYS escalate to human, no agent resolves
  merge conflicts alone; (3) effective merge: Ring 2-3 + autonomous route + verify
  PASS + no conflicts → auto-merge; Ring 0-1, with-scoring route, or any doubt →
  the branch is ready and you confirm the merge (Ring 0: reading the full diff);
  (4) after merge: `git worktree remove .worktrees/T-XXX` and delete the branch.

**Budget** (measurable, in pipeline tool calls): S ≤ 50 · M ≤ 150 · L ≤ 400. On
exceeding it: STOP, summarize state, and ask before burning more tokens.

## 5. Model assignment — cost rationale

| Phase | Model | Why |
|---|---|---|
| Explore | **haiku** | Mechanical reading of many files; cheap and fast |
| Research | **sonnet** | Synthesis of sources; no deep reasoning needed |
| Plan | **opus / fable** | Highest-leverage phase: a bad plan is paid for by all the others. Fable only on L or architecture tasks |
| Implement | **sonnet ×N** | With a good plan, implementing is execution; parallelize cheap |
| Review | **opus** | Detecting subtle violations and grading subjective rubrics needs judgment |
| Verify | **sonnet** | Running commands and tabulating; zero creativity wanted |

General rule: **spend the expensive model where the error is expensive** (plan and
review), not where the volume is high (explore and implement). This is the same
gradient the Ring System formalizes per hexagonal layer (ring-system.md).

## 6. Pipeline anti-patterns to watch

1. **Spec-drift:** the implementer "improves" things out of scope → that's why
   out-of-scope is mandatory and the reviewer checks it.
2. **Infinite review-loop:** hard limit of 2 fix cycles; the 3rd escalates to
   human.
3. **Giant inherited context:** each subagent reads the prior phases' `.md`, it
   doesn't drag the whole conversation. The `.md` files ARE the pipeline's memory.
4. **Subjective tests disguised as objective:** "the code is clean" is not an
   objective test. If it's not a command with an exit code, it goes to the
   reviewer's rubric.
5. **Fable/Opus on explore:** waste; exploration doesn't require genius.
6. **Verification as the implementer's opinion:** the gate is ALWAYS run by the
   verifier from scratch, even if the implementer says everything passes.
