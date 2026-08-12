---
description: Re-run only the objective verification gate of a task
---

Input: $ARGUMENTS = task ID (T-XXX)

Dispatch the `verifier` subagent against tasks/active/T-XXX/T-XXX.md (or the
task's current location). It runs EACH command of "Objective tests" literally and
returns a table command → PASS/FAIL + relevant output on failures.

This command does NOT fix, plan, or score. It's the objective gate on demand —
useful to confirm a task still passes after an unrelated change, or to re-check
after a manual fix. A missing command is a FAIL.
