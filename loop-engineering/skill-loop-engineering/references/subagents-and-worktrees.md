# Subagents philosophy + worktree isolation

## Why subagents exist and how they're used

The main session is run by a **main agent on fable**: it holds the project's long
context, orchestrates `/task-dev`, makes direction decisions, and talks to you.
Subagents exist for THREE distinct reasons — worth keeping clear because each asks
for a different subagent design:

### 1 · PARALLELISM (speed)
Several independent tasks at once: implementers over disjoint files, exploration of
several code areas simultaneously, generating N assets.
- Requirement: the plan guarantees zero overlap (the planner verifies it).
- Design: identical subagents with different inputs.

### 2 · COST EFFICIENCY (context and model economy)
Double saving:
- **Of model:** fable directs, sonnet/haiku execute volume. The expensive model
  doesn't read 40 files; it reads the 60-line exploration.md haiku produced.
- **Of context:** each subagent burns tokens in ITS isolated context and returns a
  distilled summary. The main agent's context stays clean and strategic across the
  whole session — without this, a long session degrades the main agent through
  saturation even on fable.

Practical rule: if an operation is about to put >2-3k tokens of raw material into
the main's context (reading code, searching docs, running and parsing tests), it
goes to a subagent that returns the synthesis.

### 3 · PERSPECTIVE (expert viewpoints)
A subagent with a persona sees what the generalist doesn't: "you are a senior UI
designer, audit this screen". It's not theater — narrowing the focus to a single
angle produces deeper findings than asking "review everything". It's the
generalization of `/forge-specialist`.

## `.claude/agents/auditor.md` — generic persona auditor

Ready-to-copy in `assets/agents/auditor.md`. In short (sonnet; opus if it audits a
Phase 3 dimension or Ring 0-1 material; Read/Grep/Bash). Invocation parameters:
- PERSONA: e.g. "senior UI designer specialized in <your domain>"
- FOCUS: what to audit and from which angle (ONLY that angle; ignore the rest even
  if you see problems — other auditors cover other angles)
- The matching skill's RUBRIC.md, if the dimension has a score system

Output: (1) prioritized findings (BLOCK / SHOULD / NIT) from YOUR expert angle;
(2) score 0-100 against the rubric if there is one (respecting its calibration
phase: in Phase 1-2 your score is shadow/advisory); (3) at most 1 strategic
recommendation, the rest actionable point findings. No full redesigns, no
implementation.

## Pattern: auditor panel (multi-perspective)

For polish tasks, Ring 0-1, or visual milestones: the main agent launches 2-4
auditors IN PARALLEL with different personas and consolidates:

```
                    ┌─ auditor(UI expert)          ─▶ findings + UI score
main (fable) ───────┼─ auditor(domain expert)      ─▶ findings + domain score
  consolidates ◀────┼─ auditor(performance eng)    ─▶ findings + performance score
  and decides       └─ auditor(art director)       ─▶ findings + visual score
```

- The auditors do NOT talk to each other (avoids groupthink; independent agreements
  are the strongest signal).
- The main agent consolidates: agreements → high priority; contradictions between
  experts → presented to you with both arguments, not resolved silently.
- Cost: 3-4 sonnets in parallel ≪ one fable pass playing "expert at everything" —
  and it performs better.

## Summary table: what runs where

| Role | Model | Context | Reason |
|---|---|---|---|
| Main agent (session) | **fable** | long, strategic, clean | direction, orchestration, talking to you |
| explorer / verifier | haiku / sonnet | isolated, disposable | cheap volume (reason 2) |
| researcher / implementer ×N | sonnet (implementer: opus in Ring 0) | isolated per task | parallelism (reason 1) + cost (reason 2) |
| planner | opus (**fable only in Ring 0**) | isolated, dense | maximum leverage |
| reviewer / curator | opus (Ring 0: opus **+ human reads the diff**) | isolated, dense | the error is expensive: expensive model |
| auditor(persona) ×N | sonnet / opus | isolated per angle | perspective (reason 3) |

---

## Worktree isolation — operational summary

```
repo/                          ← ORIGINAL worktree (main): always clean,
├─ .worktrees/                    always usable by you while the agents work
│  ├─ T-014/                   ← the task's worktree (branch task/T-014)
│  │                              the whole pipeline lives here
│  └─ T-016/                   ← another task in parallel, zero interference
└─ src/ …
```

- **One worktree per task, always** (`git worktree add .worktrees/T-XXX -b
  task/T-XXX`). Advantages: you keep working on main without colliding with the
  agents; two tasks can run in parallel without sharing a working directory; an
  aborted pipeline leaves main clean — throw away the worktree and done.
- **Merge back** per the per-ring protocol of `/task-dev` step 7
  (dev-loop-system.md): rebase + dry-run merge to detect conflicts; conflict ⇒
  human always; auto-merge only in Ring 2-3 with the autonomous route and verify
  PASS; clean up the worktree and branch after the merge.
- **`.worktrees/` goes in the main repo's .gitignore.**

## Related anti-patterns

- **Agents in the main worktree:** an implementer touching main directly can leave
  your working directory broken mid-session → one worktree per task, no exceptions.
- **Orphan worktrees:** closed tasks whose `.worktrees/T-XXX` is still alive →
  cleanup is part of CLOSE, not a future maintenance task.
- **Agent resolving merge conflicts:** a conflict is an integration decision, not a
  text puzzle → escalate to human always.
