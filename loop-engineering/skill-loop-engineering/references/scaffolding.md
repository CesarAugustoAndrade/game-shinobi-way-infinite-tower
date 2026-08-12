# Scaffolding — set up the loop system in a project

Follow this when the user asks to **set up / instantiate / bootstrap the system**
in a project. Its runnable form is the **`/loop-init`** command
(`assets/commands/loop-init.md`), which executes these steps interactively; this
file is the rationale behind it. It adapts the project to the loop system and
**initializes git** —
a hard prerequisite, not an optional step: the development loop isolates every
task in a `git worktree` and merges per ring (dev-loop-system.md,
subagents-and-worktrees.md). **No git, no pipeline.**

Same discipline as the rest of the system: **show the plan and get an explicit OK
before writing anything.** Ask the few things you can't infer (language/stack,
whether the DDD overlay applies, bounded-context names) rather than guessing.

## 0. Git first (prerequisite)

- If the project is **not** a git repo yet: `git init`, then make an **initial
  commit** (even of an empty tree / README). Worktrees and per-task branches need
  a base commit to branch from — a repo with zero commits can't `git worktree add`.
- If it **already is** a repo: leave history untouched; just ensure the working
  tree is clean before scaffolding (or scaffold on a branch).
- Add `.worktrees/` to `.gitignore` (create `.gitignore` if absent). The pipeline
  writes task worktrees there and they must never be committed.

## 1. Structure to create

```
project/
├─ .git/                       ← git init (step 0)
├─ .gitignore                  ← contains .worktrees/
├─ CLAUDE.md                   ← from assets/CLAUDE-template.md, ring map filled
├─ .claude/
│  ├─ commands/                ← copy assets/commands/*  (task-new, task-dev,
│  │                             task-verify, skill-new, skill-evolve, score)
│  ├─ agents/                  ← copy assets/agents/*    (explorer … auditor)
│  └─ skills/                  ← project skills (see step 4)
├─ tasks/
│  ├─ backlog/  active/  done/ ← each with a .gitkeep (+ proposed/ if Soul beta)
└─ src/                        ← hexagonal skeleton (step 3)
```

> **Git ignores empty directories.** Put a `.gitkeep` in `tasks/backlog`,
> `tasks/active` and `tasks/done` so they exist in a fresh checkout — otherwise the
> first `/task-dev` CLOSE fails when it tries to move `active/T-XXX → done/` and
> `done/` was never materialized. (Learned from fever-lab T-001.)

## 2. Copy the assets

Copy this skill's `assets/commands/` → `.claude/commands/` and `assets/agents/` →
`.claude/agents/` verbatim. These are the slash commands and subagents the
pipeline uses; they carry the model/ring conventions and don't need editing.

## 3. Hexagonal `src/` skeleton

Default single-hexagon layout:

```
src/
├─ domain/          # Ring 0 — core rules, no framework imports
├─ application/     # Ring 1 — ports (ports/in, ports/out) + use cases
├─ adapters/        # Ring 2 — framework/UI/persistence adapters
└─ infrastructure/  # Ring 3 — composition root, wiring, config
```

**DDD overlay** (ddd.md), one hexagon per bounded context:

```
src/contexts/
├─ <core-context>/     domain/ application/ adapters/    # full tactical DDD
├─ <supporting-ctx>/   application/ adapters/            # lighter
└─ <generic-ctx>/      adapters/                         # thin / ACL to a SaaS
```

Create only the directories the project will actually use; empty layers are noise.

## 4. Project skills

- If DDD applies, copy `assets/skills/domain-model/` into `.claude/skills/` once
  per **core** context and rename (`domain-model-<context>`); fill its glossary and
  aggregates later, not now.
- Seed other foundational skills (`core-architecture`, `visual-style`, `domain-x`)
  as the project needs them via `/skill-new` — don't pre-create empty skills.

## 5. Instantiate `CLAUDE.md`

Copy `assets/CLAUDE-template.md` → `CLAUDE.md` and fill the placeholders — above
all the **ring map** (the real paths of this repo per ring), the verification
commands, and, on a DDD project, the **context map**. Keep it ≤~120 lines: it
loads every session. Delete the DDD sections on a non-DDD project.

## 6. Objective gates wiring (recommended)

Set up the standard gates the specs will reference as commands:
- **RING-GUARD**: a dependency-rule check that fails on a diff touching a ring
  deeper than declared (e.g. a `depcruise` config `.dependency-rules.js`).
- **CONTEXT-GUARD** (DDD only): the same idea across bounded contexts (a context
  may import another only through its published API / ACL).
- Wire the project's test/type-check/lint commands into `CLAUDE.md`'s verification
  block so `verifier` can run them literally.

## 7. Final commit + verify

- Commit the scaffolding (`chore: scaffold loop-engineering system`).
- Smoke-check: `git worktree add .worktrees/_smoke -b _smoke` succeeds and
  `git worktree remove .worktrees/_smoke` cleans up — proves the worktree
  isolation the pipeline depends on actually works. Delete the `_smoke` branch.
- Confirm `.claude/commands/` and `.claude/agents/` are populated and `CLAUDE.md`
  has no leftover `<placeholders>`.

After scaffolding, the project is ready for the creational loop: the first real
step is `/task-new` (dev-loop-system.md).
