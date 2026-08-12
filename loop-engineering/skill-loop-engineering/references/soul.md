# Soul — the automatic creational loop

If rubrics capture the user's vision to **evaluate**, the Soul captures it to
**propose**. It's the automatic version of the creational loop: where the manual
mode brainstorms with the user, the Soul mode brainstorms against a document
that IS the user. First instantiated in `pride-and-fire` (2026-07-20); the
runnable template is [`assets/commands/soul-loop.md`](../assets/commands/soul-loop.md).

## The pieces

```
.claude/skills/soul/SOUL.md   # the vision: pillars (ordered), what "well done"
                              # is, ANTI-vision (what NOT), tone. Human-curated;
                              # the loop only appends to a "loop decisions" section.
tasks/pre-backlog.md          # candidate queue: 1-line entries with evidence
                              # (file:line), type, SIDE, ring guess, SOUL axis,
                              # state: candidato | promovido:T-XXX |
                              # descartado(why) | needs-human
.claude/commands/soul-loop.md # the eternal prompt (instance of the asset)
tasks/LOOP-LOG.md             # one line per pass — no log, no improvement
```

**Side (`Lado`) on every candidate and spec:** `back` (logic/domain/perf/infra —
the dev loop executes it) vs `presentación` (HUD/UI/aesthetic finish — spec'd
with a clean API and left for the front-end agent; the loop never executes it).
Adapt the two labels to the project's agent split.

## The pass — a state machine, ONE action per pass

1. **Alignment audit** (when merges landed since the last audit): re-read
   backlog specs against SOUL + current code. Misaligned spec → fix in place;
   spec that no longer serves the SOUL → retire it, why goes to SOUL's
   decisions section + LOOP-LOG.
2. **Promotion** (the loop's main job): if candidates exist and the backlog has
   room (cap ~10 pending), promote THE best one by the four criteria: what's
   there (no trivial variants) · what's not · **what combines best with the
   implemented** (multiplying beats a new island) · complexity (prefer S/M; an
   L is promoted already split into chained T-XXX).
   **Promotion runs the `/task-new` process in autonomous mode**: same
   template, same rules (objective ACs with gate commands are mandatory — no
   objective AC, no promotion → `needs-human`), but the brainstorm questions
   are answered from SOUL.md + the candidate's evidence, and that reasoning is
   **embedded in the spec as a "Génesis" section** — the spec tells its own
   origin (why this, what it combines with, what was discarded).
3. **Scout** (when the pre-backlog runs low, <5): ONE source per pass,
   rotating — SOUL↔project diff · code debt · performance · look-and-feel
   (visual smoke) · stale backlog. Findings are appended as candidates, never
   implemented (out-of-scope is sacred).
4. **Nothing applies** → log `no-findings + what was checked` and stop. A
   legitimate result: no filler, no bar-lowering (T-027).

## Modes (the human fixes the mode, like the merge modes)

- **Gated (default):** the loop scouts and refines, but promotion into the
  backlog waits for the human's acceptance. Rejection asks a one-line why; that
  why feeds SOUL's curation — the Soul learns the admission criterion.
- **Full-auto (explicit human order only):** the loop promotes and commits on
  its own. Even here, **`needs-human` is permanent and non-negotiable**: a
  candidate that would require *authoring a new design promise* (a mechanic not
  described in the SOUL, a guarantee the system never made — T-035 case b) is
  marked and parked, never self-promoted. Full-auto delegates the user's
  *time*, never their *authorship*.

## Hard brakes (in the prompt, not in config)

ONE action per pass · 1 promotion max · backlog cap (~10 pending) · the loop
never edits SOUL's vision (only its decisions section) · never touches `src/**`
nor runs the dev loop · commits every pass that changed files · two consecutive
`no-findings` passes stop the eternal mode and notify the human.

## Design limits (unchanged from the original concept)

- **The Soul doesn't score.** Generation (Soul) and evaluation (rubrics) stay
  separate: if the same document proposes and approves, it feeds back on itself.
- **Soul-bloat:** same consolidation rules as any skill; a 50-page Soul isn't
  identity, it's noise. 1-2 curated pages.
- The **anti-vision section is load-bearing** in full-auto: it's the cheapest
  drift brake the human owns.
