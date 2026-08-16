---
description: Creational loop — create one T-XXX (gap SOUL↔code if no args; brainstorm if args)
---

# /task-new — create a task spec

You create **one** task through the creational loop. You **never implement**
(`src/**` is forbidden) and you **never edit** the SOUL (that is `/soul-loop`).

User input: `$ARGUMENTS`

- **Empty / no args** → **Gap mode** (SOUL ↔ code → one T-XXX).
- **Non-empty** → **Brainstorm mode** (interactive, classic) + SOUL alignment check if SOUL exists.

System source of truth: skill `loop-engineering` → `references/soul.md`,
`references/dev-loop-system.md` §2, `assets/task-template.md`.

---

## Load first (always)

1. `tasks/backlog/`, `tasks/active/`, `tasks/done/` — next free `T-XXX`, and what is already covered.
2. Task template: skill `loop-engineering` → `assets/task-template.md` (or project copy if present).
3. Project instance: `CLAUDE.md` ring map + verification commands (inherited constraints).
4. If present: `.claude/skills/soul/SOUL.md` and any **canonical sources it links** (HTML/MD specs). Read those anchors; do not invent pillars absent from SOUL/sources.
5. Optional hint only (not required): `tasks/pre-backlog.md` if it exists — human notes, not a promotion queue.

---

## Mode A — Gap mode (`$ARGUMENTS` empty)

**Job:** compare SOUL promises to the repo + backlog; draft **exactly one** T-XXX that closes the best missing gap.

### Preconditions

- **SOUL required.** If `.claude/skills/soul/SOUL.md` is missing:
  - Stop with a short message: create/seed the SOUL (or run `/soul-loop`) first; gap mode cannot invent vision.
  - Do not fall back to brainstorm unless the human pastes an idea as arguments.

### Process

1. **Diff SOUL ↔ code ↔ backlog**
   - For each ordered pillar / delivery promise in the SOUL (and cited canonical anchors when needed):
     - Present in code? → evidence `path` or `file:line`.
     - Absent? → mark `ausente`.
     - Already covered by backlog/active/done? → skip (cite T-XXX).
   - Prefer evidence over vibes. Targeted greps; do not dump the monorepo into context.

2. **Pick ONE gap** using these criteria (in order):
   - Not a trivial variant of an existing backlog/active item.
   - Truly missing relative to SOUL + code.
   - **Combines best with what is already implemented** (multiplies existing surface > new island).
   - Complexity: prefer **S/M**. If the gap is **L**, propose a **chained split** and only draft the first slice (or ask OK on the split before drafting).

3. **Draft the spec** from the task template:
   - Fill type, layers/ring, priority, estimate, Context, Spec, constraints, Out of scope.
   - Add **Génesis**: why this gap, evidence paths, what was discarded and why, which SOUL pillar it serves.
   - **Lado/Side:** `back` or `presentación` (see `references/soul.md`).
   - Declared ring = innermost path touched.

4. **Verification (hard rules — same as always)**
   - **1–3 objective AC**, each: WHAT must be true + **gate command** (e.g. `npm run typecheck`, `npm test -- …`). No gate → not an AC.
   - Do **not** write test bodies now (implementer writes them at task start / TDD).
   - **0–3 subjective** criteria only if genuinely necessary (default: none).
   - Always include standard gates implied by the project (`tsc`/typecheck, RING-GUARD intent).
   - A spec with no objectively-verifiable AC is **not** saved.

5. **Human OK**
   - Show the full draft. Wait for **explicit OK**.
   - Iterate on the draft until OK. Do not write files before OK.

6. **Persist**
   - Assign next free `T-XXX`.
   - Write `tasks/backlog/T-XXX.md`.
   - Show a **3-line summary** (title, ring/lado, top AC).

### Gap mode brakes

- One T-XXX per invocation.
- No edits to SOUL, no `src/**`, no `/task-dev`.
- Do not author a **new design promise** absent from SOUL/canonical sources — if the only “gap” would invent mechanics, stop and tell the human to run `/soul-loop` or supply an idea via brainstorm args.
- If the task would touch 3+ layers with new logic in each, split (see step 2).

---

## Mode B — Brainstorm mode (`$ARGUMENTS` non-empty)

**Job:** create a task from the human's idea, interactively (classic creational loop).

### Process

1. Classify type: `create` | `fix` | `expand` | `polish` | `iterate`. If ambiguous, ask.
2. Ask at most **3** clarifying questions, **one per turn**. Prioritize:
   - fix → exact reproduction
   - create/expand → hexagonal layer / ports touched
   - polish/iterate → criterion for “better”
3. Propose the spec draft using the task template. Do not invent constraints: base architectural ones always apply; specifics are agreed.
4. Propose verification — only what matters (same AC rules as Mode A step 4).
5. **SOUL alignment (if SOUL exists):** one short paragraph —
   - which pillar it serves (or “orthogonal / no SOUL pillar”)
   - whether it hits **anti-visión** → if yes, **do not save**; reformulate or mark needs-human
6. If SOUL is missing, skip step 5; brainstorm still works.
7. Iterate until explicit OK → assign `T-XXX` → write `tasks/backlog/T-XXX.md` → 3-line summary.

### Brainstorm brakes

- Same AC hard rule; same “no over-specify”; same split rule for oversized work.
- Never implement. Never edit SOUL.

---

## Shared rules

- Spec path: `tasks/backlog/T-XXX.md` only after OK.
- Next id: scan backlog + active + done (and nested `tasks/active/T-XXX/`) for the highest number.
- Prefer objective AC; default evaluation route `autonomous` when all AC are objective.
- Out-of-scope is sacred in the written spec so `/task-dev` does not freestyle.
