---
description: Development loop — runs a backlog task end-to-end with subagents
---

Input: $ARGUMENTS = task ID (T-XXX) [+ flags: --skip-research, --plan-only, --auto]

You are the main agent (fable). You orchestrate; the subagents do the work and
return distilled synthesis that YOU persist as .md in tasks/active/T-XXX/. Full
system reference: skill `loop-engineering` → references/dev-loop-system.md and
references/ring-system.md.

Pipeline:

0. SETUP
   - Move tasks/backlog/T-XXX.md → tasks/active/T-XXX/T-XXX.md
   - WORKTREE ISOLATION (mandatory): `git worktree add .worktrees/T-XXX -b task/T-XXX`.
     The whole pipeline works inside .worktrees/T-XXX. N parallel implementers share
     the task's worktree (the plan guarantees disjoint files).
   - DETERMINE THE RING: the innermost ring declared in "Layers touched". The ring
     policy (models, gates, CYCLE LIMIT) governs the whole pipeline.
   - DETERMINE THE ROUTE: `autonomous` (all objective) or `with-scoring` (there are
     subjective dimensions → there will be a step 6b).
   - LOAD SKILLS: list the skills the spec references; inject their SKILL.md +
     LEARNINGS.md into the subagents of the phases where they apply.

1. EXPLORE  → explorer subagent; the main persists exploration.md
   - If the diff touches a port's signature, the explorer marks it: RE-CLASSIFY to
     Ring 1 even if the spec said adapters.

2. RESEARCH → researcher subagent; the main persists research.md
   - Skip if: type=fix with an obvious cause, type=polish local, or --skip-research

3. ANALYZE + PLAN → planner subagent; the main persists plan.md
   - Model per ring: Ring 0 ⇒ fable; Ring 1 ⇒ opus (fable if a port contract
     changes); Ring 2-3 ⇒ opus standard / sonnet on S tasks.
   - HUMAN CHECKPOINT: present the plan and wait for approval. (--auto skips it ONLY
     in type=fix with a regression test already written, and NEVER in Ring 0-1.)
   - If the planner reports "incomplete spec" → return to the creational loop. END.

4. IMPLEMENT → 1..N implementer subagents per the plan's split
   - Parallel only if the plan guarantees zero file overlap. Consolidate deviations.

5. REVIEW → reviewer subagent; the main persists review.md
   - APPROVE → step 6. FIX → resend BLOCKs to implementer(s); cycle limit = ring's.
     REDESIGN → back to step 3 (once; after that, human). Over the limit: STOP and
     escalate to human with a summary of the stall.
   - If there's an auditor panel, it runs here in parallel; the panel is canonical
     evaluator of its dimensions (the reviewer doesn't score those).

6. VERIFY (objective gate) → verifier subagent
   - All PASS → step 6b (with-scoring route) or step 7 (autonomous route)
   - Any FAIL → treat as FIX. SINGLE COUNTER: review-fix and verify-fail share the
     ring's cycle limit. In Ring 0: 1 cycle and escalate to human.

6b. SCORE (subjective gate — ONLY on the with-scoring route, and ONLY over work
    that already passed the objective gate)
   - Present the subjective dimensions with their calibration phase and ASK which
     parts the human wants to verify and score. Record COMPACTLY in the skill's
     SCORES.md: `T-XXX | dim | score | Δ | why (≤1 line)`.
   - Score < threshold → counts as a FIX cycle (same ring counter).
   - May stay `pending-score` if launched unattended; the pipeline doesn't close
     without the Phase 1-2 scores.

7. CLOSE
   - Move tasks/active/T-XXX/ → tasks/done/. Append to T-XXX.md: summary, cycles
     consumed, improvements noted by implementers (candidates for /task-new).
   - LEARNING HARVEST — CONDITIONAL: run skill-curator ONLY if there were scores,
     plan deviations, fix cycles, or the task is Ring 0-1 / polish / iterate.
   - WORKTREE MERGE (per-ring protocol): commit → rebase + dry-run merge to detect
     conflicts (conflict ⇒ human always) → effective merge (auto only Ring 2-3 +
     autonomous + verify PASS + no conflicts; else the human confirms) → remove the
     worktree and branch.

Budget (pipeline tool calls): S ≤ 50 · M ≤ 150 · L ≤ 400. On exceeding it: STOP,
summarize state, and ask before burning more tokens.
