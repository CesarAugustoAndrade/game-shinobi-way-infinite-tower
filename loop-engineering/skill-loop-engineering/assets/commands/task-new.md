---
description: Creational loop — interactive brainstorm until a task with spec and verification is produced
---

You will create a task through brainstorming WITH the user (not autonomous).

User input: $ARGUMENTS (initial idea + type if given)

Process:
1. Classify the type (create/fix/expand/polish/iterate). If ambiguous, ask.
2. Ask at most 3 clarifying questions, ONE per turn. Prioritize:
   - fix → ask for the exact reproduction
   - create/expand → which hexagonal layer and which ports it touches
   - polish/iterate → what the criterion for "better" is
3. Propose the spec draft using the task template (see assets/task-template.md).
   Do NOT invent constraints: the base architectural ones always apply, the
   specific ones are agreed.
4. Propose the verification — only what MATTERS, not an exhaustive test list:
   - The **1-3 most-important OBJECTIVE acceptance criteria**. Each states WHAT
     must be true + the gate COMMAND that will check it. Do NOT write the test
     bodies now — the implementer writes them when the task starts (TDD).
   - **0-3 SUBJECTIVE criteria, ONLY if subjectivity is genuinely necessary**
     (prefer objective; default to none).
5. Iterate with the user until explicit OK.
6. Assign T-XXX (next free number in tasks/), write to tasks/backlog/, and show a
   3-line summary.

Rules:
- A spec with no objectively-verifiable AC (each with its gate command) is NOT
  saved — but the test bodies belong to task start, not creation.
- Don't over-specify: capture the few AC that matter; the implementer may add more
  tests. An AC must be objectively checkable, or it goes to a subjective rubric.
- If the task is too big (would touch 3+ layers with new logic in each), propose
  splitting it into several chained T-XXX.
