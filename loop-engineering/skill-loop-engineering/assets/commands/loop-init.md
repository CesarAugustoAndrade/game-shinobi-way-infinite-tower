---
description: Bootstrap a project into the loop-engineering system — folders, assets, CLAUDE.md, and git init
---

Input: $ARGUMENTS = [--ddd] [project path, default = current dir]

Scaffold a project so it can be developed with the loop system. This is the
runnable form of `references/scaffolding.md` (skill `loop-engineering`) — read it
for the full rationale. **Git init is part of this, not optional:** the development
loop isolates every task in a `git worktree`, so no git, no pipeline.

Discipline: this WRITES files and runs git. Gather the few unknowns, **show the
plan, and get an explicit OK before creating anything.**

## 1. Ask (only what you can't infer)
- Language/stack + the test / type-check / lint commands (for CLAUDE.md's
  verification block).
- DDD overlay? (`--ddd` or ask). If yes: the bounded-context names and which is
  core.
- What already exists: is it already a git repo? is there a `src/` layout?

## 2. Show the plan, wait for OK
List exactly what will be created/changed (dirs, files copied, git init + initial
commit). Don't proceed without an explicit yes.

## 3. Execute (steps 0-2 + 5 of scaffolding.md)

```bash
SKILL=~/.claude/skills/loop-engineering/assets   # this skill's assets dir

# 0 · git first  (skip `init` if already a repo; NEVER rewrite history)
git init
printf ".worktrees/\nnode_modules/\n" > .gitignore
git add -A && git commit -m "chore: init repo"

# 1 · folders
mkdir -p .claude/commands .claude/agents .claude/skills
mkdir -p tasks/backlog tasks/active tasks/done          # + tasks/proposed if using Soul
touch tasks/backlog/.gitkeep tasks/active/.gitkeep tasks/done/.gitkeep   # git ignores empty dirs; keep them so CLOSE can move active→done
mkdir -p src/domain src/application src/adapters src/infrastructure
#   --ddd instead: mkdir -p src/contexts/<ctx>/{domain,application,adapters}

# 2 · copy this skill's assets into the project
cp "$SKILL"/commands/* .claude/commands/                # task-new, task-dev, task-verify, skill-*, score
cp "$SKILL"/agents/*   .claude/agents/                  # explorer … auditor
cp "$SKILL"/CLAUDE-template.md CLAUDE.md
#   --ddd: cp -r "$SKILL"/skills/domain-model .claude/skills/domain-model-<ctx>

# 5 · commit + smoke-check the worktree isolation the pipeline depends on
git add -A && git commit -m "chore: scaffold loop-engineering system"
git worktree add .worktrees/_smoke -b _smoke && git worktree remove .worktrees/_smoke && git branch -d _smoke
```

On Windows, run the same via the Bash tool, or translate `mkdir -p`/`cp`/`printf`
to PowerShell equivalents; the git commands are identical.

## 4. Instantiate CLAUDE.md (steps 3-4 of scaffolding.md)
Fill the placeholders in `CLAUDE.md`: the **ring map** (real repo paths per ring),
the **verification commands** (from step 1), and — if DDD — the **context map**.
Delete the DDD sections on a non-DDD project. Keep it ≤~120 lines. Wire RING-GUARD
(and CONTEXT-GUARD if DDD) as the standard objective gates.

## 5. Verify + report
- `.claude/commands` and `.claude/agents` are populated; `CLAUDE.md` has no leftover
  `<placeholders>`; the smoke `git worktree add/remove` succeeded.
- Report the resulting tree and tell the user the next step is `/task-new`.

Note: `/loop-init` bootstraps the project, so it is NOT one of the commands the
project runs day-to-day. Install it at user level (`~/.claude/commands/`) or run it
from the loop-engineering skill; the per-project commands are
task-new / task-dev / task-verify / skill-* / score.
