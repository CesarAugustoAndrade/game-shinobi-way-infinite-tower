---
description: Curate and improve SOUL.md via research, references, and hard thinking (never creates T-XXX)
---

# /soul-loop — improve the SOUL (not the backlog)

You are the **SOUL curation loop**. Your product is a better
`.claude/skills/soul/SOUL.md`. You **never** create task specs, **never** write
`tasks/backlog/**`, **never** touch `src/**`, and **never** run `/task-dev`.

Tasks come from **`/task-new`** (gap mode without args, brainstorm with args).

System source of truth: skill `loop-engineering` → `references/soul.md`.

User input: `$ARGUMENTS`

| Args | Behavior |
|------|----------|
| empty or `interactivo` | **Interactive default:** ask questions, research, propose SOUL diffs |
| `<foco>` | Same interactive pass, scoped to that axis (e.g. `modes`, `anti-visión`, `R1`) |
| contains `spec` + path (optional) | May propose edits to a linked canonical spec **only if** human asked; default is **SOUL.md only** |

---

## Load first (always, in order)

1. `.claude/skills/soul/SOUL.md` — if missing, prepare a **minimal skeleton** proposal (pillars, anti-visión, canonical sources, empty “Loop decisions”) instead of inventing a full vision alone.
2. Canonical sources the SOUL already cites (project docs, HTML specs, VISION files). Prefer repo paths the human owns.
3. Light code snapshot **only** for pillars under discussion: targeted grep / file reads. Do not load the whole monorepo.
4. `tasks/SOUL-LOG.md` — prior curation passes (create on first write if absent).
5. Optional context: `CLAUDE.md` ring map; do not rewrite it here.

---

## One curation pass (interactive)

Default mode is **interactive hard thinking**, not a one-line scout.

### 1 · Orient (questions)

Ask **1–3 questions max per turn**, one turn at a time when answers change the research plan. Examples:

- Which pillar hurts or is ambiguous?
- Which reference is **canonical** vs mere inspiration?
- What is explicitly **out of SOUL scope** this week?
- Should the SOUL stay a short wrapper that points at a long spec?

If `$ARGUMENTS` already names a focus, skip questions that only restate it.

### 2 · Explore references

- Read cited docs and related repo docs.
- Check code that **implements or contradicts** the current SOUL claims (evidence paths).
- External URLs only if the human provided them or they are already linked — **do not invent** papers, games, or citations.

### 3 · Hard thinking (synthesis)

Produce a short research brief **before** any SOUL patch:

- Tensions / ambiguities in the SOUL
- Promises without a verifiable meaning
- Overlap with anti-visión
- Drift vs code (SOUL claims X; code does Y)
- Bloat risk (what should stay in linked specs, not in SOUL)

Keep the SOUL **short**: identity, ordered pillars, anti-visión, delivery order, links to anchors. A 50-page SOUL is a failure mode.

### 4 · Propose a SOUL diff

Show a **legible markdown diff or section-level before/after** (not a silent full rewrite).

Rules:

- **Never write SOUL.md without explicit human OK.**
- Do not invent new game mechanics “because they sound good.” Every addition needs evidence (human answer, existing canonical spec, or clear code fact) or is marked **`needs-human`** in the brief and omitted from the patch.
- Prefer improving the **wrapper** (pillars, anti-visión, order, links). Do **not** re-host a 100-row catalog inside SOUL.
- Default: edit **only** `.claude/skills/soul/SOUL.md`. Canonical HTML/MD specs are edited **only** if the human explicitly asked in args/focus.

### 5 · Apply after OK

1. Write/update `.claude/skills/soul/SOUL.md`.
2. Append one line to `tasks/SOUL-LOG.md`:
   `YYYY-MM-DD soul-loop <focus|general> — <≤1 sentence result>`.
3. **Commit only if the human asks** (or the project’s stated convention requires it). Suggested message: `docs(soul): <focus>`.

---

## Hard brakes (non-negotiable)

- No `src/**`.
- No `tasks/backlog/**`, no T-XXX, no pre-backlog promote (that pipeline is retired).
- No `/task-dev`, no implementation “while we’re here.”
- No full SOUL replace without a readable diff.
- No scoring the SOUL with rubrics (Soul does not score; rubrics evaluate implementation).
- Authorship: new design promises require the human — park as `needs-human`, do not smuggle them in.

---

## What this command is not

| Not this | That job is |
|----------|-------------|
| Creating T-XXX from SOUL↔code | `/task-new` (no args) |
| Brainstorming an ad-hoc feature task | `/task-new <idea>` |
| Implementing or verifying code | `/task-dev` / `/task-verify` |
| Eternal auto-promote from pre-backlog | **Removed** — do not revive |

---

## Project instance notes

When copied into a project, replace nothing mandatory: paths above are fixed conventions.
If the project’s vision lives primarily in a long spec (e.g. a combat HTML), the SOUL should **link** it and stay curatable in 1–2 pages; `/soul-loop` improves that short document.
