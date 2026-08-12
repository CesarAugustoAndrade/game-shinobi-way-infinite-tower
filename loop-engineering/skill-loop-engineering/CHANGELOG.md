# Changelog — loop-engineering skill

Traceability log of **changes made to this skill's own documents** (`SKILL.md`,
`references/`, `assets/`). One entry per meaningful change set: which files were
touched and why. Use the date from the session context — don't invent one.

This is **not**:
- a log of "learnings from running loops" — that belongs to a project's own skills
  (`LEARNINGS.md`/`SCORES.md`, see `references/skills-self-learning.md`);
- a place to add rules — genuinely important rules go into `SKILL.md`'s body
  (learning here is minimal by design).

Entry format: `## <date> — <label>` then **Files** and **Why** lines.

## 2026-07-22 — v2.8: dual of T-033 (new invariant → sweep all routes + in-flight effects)
- **Files:** `SKILL.md` — extended the "A shared primitive doesn't carry a sibling
  path's invariant" (T-033) block with a compact dual paragraph.
- **Why:** T-121 (pride-and-fire) — introducing a new global inhibitor state
  (routing) guarded only at `orderMove`/`orderAttack` left the ability/volley route
  (`issueAbility` + deferred Impact damage) evading it, including a volley emitted
  pre-rout that impacts post-rout; reviewer BLOCKED. T-033 covered the inverse
  direction; the new nuance is the sweep-on-introduce + deferred/in-flight effects.

## 2026-07-20 — v2.7: Soul leaves beta — /soul-loop joins the package
- **Files:** `references/soul-beta.md` → rewritten as `references/soul.md`
  (implemented system: SOUL.md + pre-backlog.md + eternal creational loop with
  state machine, gated/full-auto modes, permanent `needs-human`, Side label
  back/presentación); new `assets/commands/soul-loop.md` template; updated the
  reference table in `SKILL.md` and the skills map row in
  `assets/CLAUDE-template.md`.
- **Why:** first real instantiation in `pride-and-fire` (2026-07-20, César's
  order) turned the beta concept into a working design: promotion runs
  `/task-new` in autonomous mode with the brainstorm embedded as a "Génesis"
  section, and full-auto delegates the user's time but never their authorship
  (`needs-human` survives every mode).

## 2026-07-14 — v2.6: .gitkeep in tasks dirs (fix first-CLOSE bug)
- **Files:** `assets/commands/loop-init.md` (touch .gitkeep in tasks dirs) +
  `references/scaffolding.md` (note); user-level `~/.claude/commands/loop-init.md`
  re-synced.
- **Why:** git doesn't track empty directories, so `tasks/done/` didn't exist in a
  fresh checkout and the first `/task-dev` CLOSE failed moving `active→done`.
  Evidence: fever-lab **T-001** close. Scaffolding now seeds `.gitkeep` in
  backlog/active/done.

## 2026-07-14 — v2.5: /loop-init bootstrap command
- **Files:** new `assets/commands/loop-init.md`; edited `SKILL.md` (scaling-up
  points to `/loop-init`) and `references/scaffolding.md` (notes it's the runnable
  form).
- **Why:** scaffolding existed only as prose steps; `/loop-init` makes it a single
  runnable command (ask → show plan → git init + folders + copy assets + CLAUDE.md
  + smoke-check worktree) so setting up a project is one command instead of manual
  steps.

## 2026-07-13 — v2.4: delegate art assets to /generar-asset
- **Files:** `references/dev-loop-system.md` (§4 IMPLEMENT bullet),
  `assets/agents/implementer.md` (new rule 3 + renumber), `assets/CLAUDE-template.md`
  (skills-table row).
- **Why:** anything better as/with an asset (textures, particles, icons, sprites,
  backgrounds, scenes) should be produced with the `/generar-asset` skill, not
  hand-rolled or left as a placeholder/emoji fallback; its output already meets the
  objective asset gate (dimensions/format/weight). Placeholders standing in for
  real art become candidate improvements (→ /task-new).

## 2026-07-13 — v2.3: verification = few important AC, tests written at task start
- **Files:** `assets/task-template.md` and `references/dev-loop-system.md` (§2
  template + /task-new summary) reframed Verification to "1-3 most-important
  objective AC (what + gate command) and 0-3 subjective ONLY if truly needed";
  `assets/commands/task-new.md` step 4 + hard rule relaxed accordingly;
  `assets/agents/planner.md` + `assets/agents/implementer.md` (and their
  descriptions in dev-loop-system.md) now: planner assigns each AC to a step,
  implementer writes that AC's test (TDD).
- **Why:** the spec should capture only what matters, not enumerate every test;
  the concrete test bodies belong to task start (TDD), not creation. Relaxes the
  old "no spec without an executable objective test" hard rule to "no spec without
  an objectively-verifiable AC + its gate command".

## 2026-07-13 — v2.2: project scaffolding + git init
- **Files:** new `references/scaffolding.md`; edited `SKILL.md` (scaling-up
  "Setting up the system in a project" subsection + `description` trigger for
  scaffolding/git init).
- **Why:** setting up the system had no defined procedure and git was left
  implicit — but the pipeline isolates every task in a `git worktree`, so git is a
  hard prerequisite. The scaffolding now adapts a project to the loop system
  (structure, assets, hexagonal `src/`, `CLAUDE.md`) and initializes git with an
  initial commit + `.worktrees/` gitignore.

## 2026-07-13 — v2.1: DDD overlay added
- **Files:** new `references/ddd.md`; edited `references/ring-system.md` (subdomain
  axis, base×modifier matrix, context-guard), `assets/task-template.md`
  (bounded-context field + DDD gates), `SKILL.md` (scaling-up row),
  `assets/CLAUDE-template.md` (context map); new
  `assets/skills/domain-model/{SKILL.md,RUBRIC.md}` scaffold.
- **Why:** the Ring System protected one hexagon by depth but had no breadth axis;
  DDD supplies bounded contexts + subdomain distillation as an opt-in overlay, and
  a horizontal `context-guard` to match the vertical RING-GUARD.

## 2026-07-13 — v2.0: absorbed the complex dev-loop system
- **Files:** rewrote `SKILL.md` body (English, kept Spanish triggers in
  `description`); added `references/` (6 files) and `assets/` (commands, agents,
  `task-template.md`, `CLAUDE-template.md`) packaging the full hexagonal
  multi-agent dev-loop system.
- **Why:** the system was a loose doc in `workspace/.../docs/` that never triggered
  and carried no runnable templates; packaged it as an opt-in part of this skill
  so the simple loop stays the default and the complex pipeline is reached
  deliberately.
