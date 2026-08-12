# CLAUDE.md — <PROJECT>
<!-- ============================================================
  GENERIC TEMPLATE for any project using the LOOP ENGINEERING
  system. Fill the <placeholders> and delete what doesn't apply.
  Division of responsibility:
    · The SKILL defines the system (pipeline, rings, phases, scoring)
    · This CLAUDE.md defines the INSTANCE (paths, commands, map)
    · The T-XXX define the work
  Golden rule: this file loads in EVERY session → max ~120 lines.
  If something can live in the skill or load on demand, it does NOT
  go here. NEVER duplicate the pipeline here.
============================================================ -->

## Development system

This project is developed with **LOOP ENGINEERING**.
Source of truth for the system: skill `loop-engineering` — read it BEFORE running
any task. Don't improvise process: everything goes through the system's commands
(`/task-new`, `/task-dev`, `/score`, `/skill-new`…).

- No code change without a T-XXX that authorizes it.
- No T-XXX without a spec with executable objective tests.
- The pipeline, gates, calibration phases and merge protocol live in the skill:
  this file only instantiates its parameters for THIS repo.

## Ring map (Ring System → this repo's paths)

<!-- The MOST important table: the one thing the skill can't know.
     Classic hexagonal example; adapt to your real structure. -->

| Ring | Paths | Notes |
|---|---|---|
| **R0** | `<src/domain/**>` | core logic: <the project's business rules> |
| **R1** | `<src/application/**>` | ports (ports/in, ports/out) + use cases |
| **R2** | `<src/adapters/**>` | <UI/render framework, external libraries, persistence> |
| **R3** | `<src/infrastructure/**, assets/**, config/**, tools/**>` | composition root, wiring, assets, scripts |

- Changing the SIGNATURE of any file in `<ports path>` is R1, wherever the diff
  lives (contract rule).
- A task's ring = the innermost it touches. In doubt: the innermost.

## Context map (DDD overlay — optional; delete on non-DDD projects)

<!-- Only if the project uses the DDD overlay (skill loop-engineering →
     references/ddd.md). Each bounded context is its own hexagon. -->

| Bounded context | Subdomain | Path | Depends on (via) |
|---|---|---|---|
| `<orders>` | core | `<src/contexts/orders/**>` | `<catalog (published API)>`, `<payments (ACL)>` |
| `<catalog>` | supporting | `<src/contexts/catalog/**>` | — |
| `<notifications>` | generic | `<src/contexts/notifications/**>` | external SaaS (ACL) |

- **CONTEXT-GUARD** is a standard objective gate here: a context may import another
  only through its published API / ACL, never its domain internals.
- Subdomain modifies the ring policy: **core bumps up** (Ring 1 behaves like Ring
  0), **generic may go cheaper**. See the skill's `ring-system.md`.

## Verification commands (run by `verifier`, literally)

```bash
<test command>                                # unit + integration
<type-check / lint command>                   # static analysis
<ring-guard command>                          # RING-GUARD (mandatory in every spec)
                                              #   e.g. npx depcruise --validate .dependency-rules.js src
<port contract test command>                  # (R1)
<objective checks for non-code deliverables>  # assets / docs / data, if applicable
<command to start the project>                # manual smoke
```

Project thresholds (skill defaults unless stated otherwise here):
APPROVE score ≥80 · min dimension 60 · polish ≥90 · R0 coverage ≥90%.

## This project's skills

<!-- List the real skills and when they're injected. Example names. -->

| Skill | When it's injected |
|---|---|
| `<core-architecture>` | every R0-R1 task; planner and reviewer |
| `<visual-style / ui-ux>` | visual tasks; implementer and reviewer (RUBRIC) |
| `<domain-x>` | tasks touching `<subdomain path>` |
| `generar-asset` | any task needing art — textures, particles, icons, sprites, backgrounds, scenes; never hand-roll or leave a placeholder |
| `soul` | only via /soul-loop (creational); NEVER injected in evaluation |

Calibration state per dimension: see each skill's `SCORES.md` — do NOT assume
Phase 3 without checking it.

## Tasks

```
tasks/backlog/    # accepted specs, pending        tasks/active/T-XXX/  # in the pipeline
tasks/proposed/   # Soul candidates (beta)         tasks/done/          # closed
```

## Hard operational rules (emergency summary — detail is in the skill)

1. **Always a worktree:** `git worktree add .worktrees/T-XXX -b task/T-XXX`.
   FORBIDDEN to work in the main worktree. `.worktrees/` is in .gitignore.
2. **Merge conflicts:** never resolved by an agent. Escalate to the human.
3. **Auto-merge** only R2-3 + autonomous route + verify PASS + no conflicts.
4. **R0-R1:** human checkpoint on the plan; in R0 also on the merge (full diff).
   `--auto` does not exist in R0-R1.
5. **Out-of-scope is sacred:** detected improvements are noted, not implemented.
6. **The phase .md files** (exploration/research/plan/review) are persisted in
   `tasks/active/T-XXX/` — they are the pipeline's memory, not the context.
7. **Subagents:** raw material >2-3k tokens → a subagent that returns synthesis.
   The main doesn't read 40 files.

## Minimal project context

- <What the project is, in one line.>
- Stack: <language + frameworks + build + tests>.
- Pure domain with no framework imports (verified by ring-guard).
- Entrypoint / composition root: `<path>`.

## What does NOT go in this file

The step-by-step pipeline, the per-ring policy tables, the calibration phases, the
SCORES.md format, the full worktree protocol → all of that lives in the skill
`loop-engineering`. If you find a discrepancy between this file and the skill, the
SKILL WINS, and report the discrepancy as a candidate fix for this CLAUDE.md.
