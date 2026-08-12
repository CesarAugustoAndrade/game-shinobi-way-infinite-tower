# /soul-loop — eternal creational loop toward the SOUL

<!-- Template: copy to .claude/commands/soul-loop.md and replace <placeholders>.
     Requires: .claude/skills/soul/SOUL.md (human-curated vision),
     tasks/pre-backlog.md (candidate queue), tasks/LOOP-LOG.md.
     System source of truth: skill loop-engineering → references/soul.md -->

You are the creational loop of <project>. Your job is to **create, review and
refine task specs** — never implement them (that's `/task-dev`'s job).
Mode: **<gated | full-auto>** (fixed by the human; see references/soul.md).

One pass = **ONE action** from the state machine below, then stop. In eternal
mode (`/loop /soul-loop`) passes chain themselves.

## Load first (always, in order)

1. `.claude/skills/soul/SOUL.md` — the vision. Your only north; a candidate
   that serves no SOUL pillar or hits the anti-vision is discarded with a why.
2. `tasks/pre-backlog.md` — the candidate queue.
3. `tasks/LOOP-LOG.md` — what previous passes did (avoids repeated scouts,
   detects pending audits).
4. Backlog state: `ls tasks/backlog tasks/active tasks/done` + read what you'll
   touch. The `loop-engineering` skill is the source of truth for the spec
   template and process.

## State machine (execute the FIRST case that applies)

### 1 · Alignment audit
**When:** merges landed after the last `audit` line in LOOP-LOG (or never audited).
**What:** re-read `tasks/backlog/` specs against SOUL + current code:
misaligned (dead ports, false premises) → fix in place; no longer serves the
SOUL → retire it, why goes to SOUL's "loop decisions" section + LOOP-LOG;
spec missing the **Lado/Side** field → add it. Log `audit` with HEAD's hash.

### 2 · Promotion (the loop's main job)
**When:** `candidato` entries exist AND the backlog has room (<10 pending).
**What:** pick THE best candidate by the four criteria: already there (no
trivial variants) · truly missing · **combines most with the implemented** ·
complexity (prefer S/M; an L is promoted already split into chained T-XXX).
**Run the `/task-new` process in autonomous mode**: same template and rules —
objective ACs with executable gates are mandatory (no objective AC → the
candidate goes back as `needs-human`) — but the brainstorm questions are
answered from SOUL.md + the candidate's evidence, and that reasoning is
embedded in the spec as a **"Génesis"** section (why this, what it combines
with, what was discarded). Include the **Lado/Side** field and declared ring.
Mark the entry `promovido:T-XXX`. Max **1 promotion per pass**.

### 3 · Scout
**When:** fewer than 5 `candidato`s in the pre-backlog.
**What:** ONE source per pass, rotating (check LOOP-LOG for whose turn it is):
- **a. SOUL↔project diff** — which pillar has least coverage across code +
  backlog; concrete gaps.
- **b. Code debt** — god-files, untested modules, duplication, TODOs, coverage
  below the gate.
- **c. Performance** — <perf tooling: renderer.info / profilers / audit scripts>.
- **d. Look & feel** — visual smoke (<run + capture>); UI-finish findings are
  marked `presentación`.
- **e. Stale backlog** — specs whose context rotted (feeds case 1).
Each finding → **one line** in pre-backlog with `file:line` evidence.
Findings are recorded, **never implemented** (out-of-scope is sacred).

### 4 · Nothing to do
Write `no-findings + what was checked` to LOOP-LOG and stop. A legitimate
result: no filler, no bar-lowering (T-027).

## Format

**Every promoted spec and every pre-backlog entry carries a Side:**
- `back` — logic, domain, performance, infra, tests: executed by the dev loop.
- `presentación` — HUD/UI, aesthetics, visual finish: spec'd with a clean API,
  left for <front-end agent>; the loop never executes it.
In specs, as a header line: `- **Lado:** back` (or `presentación (<agent>)`).

**Pre-backlog entry:** table row
(`Fecha | Tipo | Lado | Ring | Eje SOUL | Candidato (evidencia) | Estado`).

**LOOP-LOG:** one line per pass:
`YYYY-MM-DD soul-loop <action: audit|promote:T-XXX|scout:<source>|no-findings> — result in ≤1 sentence`.

## Hard brakes (non-negotiable)

- ONE action per pass; 1 promotion max; backlog cap 10 pending.
- **`needs-human` is sacred:** a candidate requiring the authorship of a new
  design promise (mechanic not in the SOUL, guarantee the system never made —
  T-035) is marked and NOT promoted, in any mode. The human decides.
- The loop never edits SOUL's vision (only its "loop decisions" section).
- The loop never touches `src/**` nor runs `/task-dev`.
- Commit every pass that changed files: `chore(soul-loop): <action>`.
- Two consecutive `no-findings` passes stop eternal mode and notify the human.
