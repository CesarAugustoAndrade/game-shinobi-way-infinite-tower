---
name: loop-engineering
description: >-
  Principios para diseñar agentes y "loops" auto-mejorables que trabajan,
  verifican y reintentan solos (basado en "Loop Engineering 101" de Daniel Moka),
  y — cuando hace falta — un SISTEMA COMPLETO de desarrollo en loop con múltiples
  agentes y modelos sobre arquitectura hexagonal (Ring System, pipeline
  explorer/planner/implementer/reviewer/verifier, scoring con rúbricas, loop de
  skills auto-mejorable, worktrees). Úsalo SIEMPRE que se diseñe, construya o
  revise un agente autónomo, un loop recurrente, una automatización desatendida,
  un pipeline maker/checker, un quality gate, o un sistema que aprende de sus
  errores. Aplica cuando el usuario hable de agentes que corren en bucle,
  orquestar varios subagentes (flota), varios modelos por fase, arquitectura
  hexagonal para poder cambiar de framework rápido, montar/instanciar (scaffolding)
  el sistema en un proyecto e inicializar git para el pipeline, o convertir una
  tarea repetitiva en un proceso desatendido — aunque no diga la palabra "loop".
  También cuando se mencione closed loop vs open loop, separar constructor de
  revisor, worktrees para agentes paralelos, o cómo evitar que un agente genere
  "slop".
---

# Loop Engineering

Design guidance for building **loops**: agents that work, verify themselves, and
retry without you dictating every step. Based on "Loop Engineering 101" by Daniel
Moka (craftbettersoftware.com).

This is a **flexible** skill: judgment principles, not a rigid procedure. Adapt
them to context. The goal is that any agent/automation you help design is
**bounded, verifiable, and able to improve on every pass** — not a process that
produces plausible work with no control.

**Start simple.** The default is a single-agent closed loop. Only when the task
truly demands a multi-agent, multi-model development pipeline with per-layer
protection do you reach for the full hexagonal system — see
[**Scaling up**](#scaling-up-the-complex-hexagonal-dev-loop-system) below.

## When it applies

Applies when the work fits a loop. A task is a good candidate if all three hold:

- **It repeats** enough to be worth wiring up.
- It has a **definition of "done" that can be verified automatically** (a test, a
  compiler, a check — something the agent can't argue with).
- A **failed attempt is cheap to discard**.

If one is missing — especially automatic verification — don't force a loop: it
probably needs a human in the cycle or isn't ready to be automated. Say so
instead of wiring up something that will generate noise.

## The core cycle

In its simplest form, a loop is an agent working on itself:

1. **Discovery** — find out what needs to be known.
2. **Planning** — break the goal into clear steps.
3. **Execution** — do the work.
4. **Verification** — compare the result against the goal.
5. **Iteration** — fix the gaps and run again.

You wire the cycle once and walk away. The canonical example: reproduce the bug →
write a failing test → fix the code → run the suite → repeat until green.

## Closed loops over open loops

**Open loop (exploratory):** the agent explores and discovers freely. High token
burn (50K–2M+), tends to drift off-goal and produce "slop", risky as a starting
point. Useful for open research, not for production.

**Closed loop (bounded):** clear goal, defined steps, validation checks. The
agent operates within constraints. Predictable, efficient, controllable. **It's
the default for almost everything.**

The deep reason the closed loop wins: **improvement**. Each pass feeds the next,
so the loop you run a month from now is sharper than today's. An open loop
accumulates nothing.

> When designing, start closed and open only the narrow spots where exploration
> adds real value.

## Separate maker and checker

The one who builds and the one who reviews **must never be the same agent.** An
agent that self-evaluates rationalizes its own mistakes. Minimal structure:

```
goal  = load('VISION.md')     # what we want
rules = load('RULES.md')      # what we learned

for attempt in range(MAX_ATTEMPTS):    # explicit cap: never infinite
    work   = maker.run(goal, rules)    # one agent writes
    review = checker.run(work, tests)  # a different one verifies
    log(attempt, work, review)         # every pass is recorded

    if review.passed:
        ship(work)                     # the gate opens
        break

    rules.append(review.reason)        # the loop learns
else:
    alert_human(rules)                 # attempts exhausted → alert, don't insist
```

Goal and rules load **from disk**, not from chat — so the loop doesn't forget
between runs.

## Every loop needs a brake

A loop with no stop criterion becomes an expensive slop loop: it retries forever,
burns tokens, and never admits it's stuck. Always define an explicit cap:

- **Max attempts** (`MAX_ATTEMPTS`). When exhausted, the loop **stops and alerts**
  a human — it doesn't keep insisting with the same strategy.
- Optional: a **budget** of tokens/time as a secondary brake.

Running out of attempts isn't a design failure: it's the loop recognizing it
needs a human. That's better than an agent insisting forever.

**"No findings" is a legitimate terminal result — not a failure to work around.**
An orchestrating loop that scans for work (tasks to generate, issues to fix,
improvements to propose) will sometimes come up empty. When it does, it **stops
and asks the human** — it must never manufacture filler to justify the run, nor
**lower its own confidence threshold** to force a marginal candidate past the bar.
Widening the scope of what counts as "work" is the **human's decision, not the
orchestrator's**: an agent that broadens its own mandate to avoid returning empty
has slipped its bounds exactly like one that retries forever. Returning "nothing
to do, here's what I checked" is a valid, successful pass.

## The Quality Gate

A loop without a gate produces slop faster. The gate is the verification the work
must pass **before** it ships, and it's the only thing keeping the loop sane.

Build it from things the agent can't argue with:

- the **compiler** and the **type system**
- **integration tests**, **property-based tests**, **mutation tests**
- **linters**, **static analyzers**
- **CI**

Avoid "soft" gates (a note saying "review it carefully"): the agent slips past
them. Always prefer **deterministic** checks.

**Forbid the shortcuts that hide the problem instead of solving it.** An agent
under pressure to "pass the gate" reaches for the easy way out, and that way out
is usually hiding the symptom. The gate must explicitly reject:

- "Fixing" a flaky test by raising the timeout, adding `retry`, or marking it
  `skip` **without a demonstrated root cause**.
- Lowering an assertion threshold, commenting out the check that's in the way, or
  catching and swallowing the exception.
- Leaving placeholders (`TODO`, `lorem`, `[insert]`), invented data, or anything
  that "looks finished" but isn't.

The underlying rule: the gate verifies the problem **was solved**, not that it
**stopped showing**. If the only way to pass is to hide, the loop must fail and
escalate to the human.

**A test only gates what it can discriminate.** When the effect under test is
*stochastic* or a *side-effect applied to a shared relation*, check that the
assertion can actually tell the right behavior from the wrong one. A **constant-
value mock** often can't: if the effect fires once or twice, the arithmetic comes
out identical (one roll of a fixed value vs. two rolls of the same fixed value
land on the same number), so a double-invocation bug passes green. Require a mock
with a **varying sequence** — each call returns a different value, so an extra
invocation moves the result — or assert the **call-count explicitly**
(`expect(roll).toHaveBeenCalledTimes(1)`). A green test built on a
non-discriminating mock is a soft gate wearing a deterministic mask.

**Deliberately reverting a design decision inverts its test — it never deletes
it.** When a task's purpose is to *reverse* a prior design decision, the test that
encoded the old decision as an **explicit assertion** is not obsolete: it's the
guardian of a behavior that's genuinely changing. Deleting it drops the gate that
protects the new decision and erases the record that the switch happened. Instead
**invert it in place** — same scenario, opposite assertion — so the suite now pins
the *new* behavior. And if the old guarantee still holds under some condition (e.g.
it survives as the **default** while the new behavior is opt-in, or vice versa),
**add a contrast test** for that condition so both branches stay covered. This is
the complement of "**don't comment out / skip the check that's in the way**", not a
contradiction of it: both refuse to *silence* a test to make a diff pass. The
anti-pattern hides an assertion the code still has to satisfy; this rule *rewrites*
an assertion because the spec deliberately changed what must be satisfied — the
assertion stays live, only its expected value moves. The tell that separates them:
a legitimate inversion is **authorized by the spec** and leaves the scenario still
asserted (with the opposite expectation), whereas skirting the gate removes the
scenario from enforcement altogether. If a test is in your way and the spec did
*not* order the behavior it guards to change, you may not touch it — invert only
what the design consciously reverses.

## Reuse re-opens a component's assumptions

When you extract something (a function, module, prompt, check) to **reuse it in a
new call site**, a matching signature is **not enough**: re-examine whether the
*implicit assumptions* it inherited from its original context still hold in the
new one. A green gate won't catch this — the code compiles and every test passes
because the mismatch is **latent**, not a present bug. If the assumptions diverge,
make them explicit and **inject the dependency that changes**; otherwise document
it as a conscious tradeoff with a follow-up task. Never reuse in silence under
"it compiles the same → it behaves the same."

The assumption travels **pinned to the component** when you move it. Example: a
`capitalCellForFaction` helper extracted from startup seeding — which assumes the
*static* owner from the artifact, correct for the one-time seed — was reused for
runtime economy spawns, where conquests can change the owner; a faction that lost
its original capital could try to spawn on territory it no longer owns. Signature
fit, tests green, latent risk. The fix is to surface the assumption and inject
what varies (here: a `getOwner`), not to trust the compile.

## A shared primitive doesn't carry a sibling path's invariant

When a **new decision path** converges on the same low-level primitive as an
existing path, it does **not** automatically inherit an invariant that a
**sibling** path — one with a *different intention* — enforces around that
primitive. A shared primitive is a shared *mechanism*, not a shared *contract*:
the invariant belongs to the sibling's intent, not to the primitive both paths
call. Verify each such invariant **explicitly per path** when designing and
reviewing; don't assume "it ends up in the same function → it behaves the same."

Evidence (T-033): a "brake/stop-in-range" invariant lived only on the attack path
(`orderAttack` / `attackOrders`). A new path that reused the same movement
primitive (`orderMove`) with a different intent did **not** get that braking
behavior for free — the invariant was never a property of `orderMove`, only of the
attack sibling. The reviewer required checking it explicitly on the new path.

**The dual: introducing a *new* invariant obliges a sweep of every sibling route,
including deferred effects already in flight.** T-033 warns a new path not to
assume an old invariant; the inverse hazard is adding a **new global inhibitor**
(e.g. a "routing" state: accepts no orders / deals no damage) and wiring its guard
only at the one route that looks canonical. Enumerate **all** existing entry/damage
routes and apply the guard to each — and remember that a **deferred** effect
(projectile/volley/ability resolving in a later Impact tick) can have been emitted
*before* the state flipped and land *after* it, so guarding emission is not enough:
guard resolution too. Evidence (T-121): the plan put the rout guard on
`orderMove`/`orderAttack` but the ability route (`issueAbility` + a volley whose
damage resolves in a later Impact) evaded it — the reviewer BLOCKED until the guard
covered `issueAbility` *and* discarded a routing attacker's in-flight Impact.

**Boundary vs T-028 (Reuse re-opens a component's assumptions):** different, not a
contradiction. T-028 is about the inherited context of **one reused component** — a
function dragging an implicit assumption from its original call site into a new one.
T-033 is about invariants **distributed across sibling paths** that merely share a
primitive: nothing was extracted or moved; two independent paths converge on the
same call and one wrongly assumes it inherits the other's guarantee.

## Giving memory to a from-scratch component re-opens the state lifecycle

When you add **persistent memory** to a component that until now **recomputed
everything from scratch** each pass, you introduce a class of state that never
existed before: **entries that outlive the thing they described** (orphans / stale
rows). A from-scratch computation can't leak — it rebuilt clean every pass; a
persisted one **accumulates**. Before assuming orphans "clean themselves up,"
**audit whether an orphan can do damage** — be read as live, collide with a new
entity, block an action, double-count — and pin that safety to a **concrete
guarantee**, not a hope: e.g. "**ids are never recycled**" (so a stale id can never
be mistaken for a fresh one), or an explicit purge tied to the entity's death. If
no such guarantee holds, the orphan is a latent bug: surface it and either add the
purge or document the guarantee the design leans on. Never reason "the old code
recomputed, so this is fine" — the old code had no memory to corrupt.

**Boundary vs T-028 (Reuse re-opens a component's assumptions):** same discipline,
different trigger. T-028 is a *reused function* dragging an implicit assumption from
its old call site into a new one. T-036 is introducing a **new capability
(persistence) into an existing component**, which re-opens an assumption the
from-scratch design never had to make — the *lifecycle* of its own state. Both:
adding/moving something into an existing component re-opens its implicit
assumptions; here the assumption is orphan cleanup, not inherited context.

Evidence (T-036): the human approved auditing orphan entries when giving persistent
memory to a system that previously recalculated everything from zero — verifying the
orphans can't damage anything before assuming they self-clean, contingent on a
concrete guarantee such as "ids are never recycled."

## EXPLORE verifies the spec's premises, not just the ports

A spec written *before* anyone reads the code carries **premises** — things it
assumes true about the system. EXPLORE's job is not only to confirm that the
ports/signatures the design needs **exist**; it must also **verify the spec's
premises against the real code and data** before PLAN commits to a design built on
them. Two kinds of premise to check on every such spec:

- **Data premises** (T-015): what the design assumes about the *content* of real
  artifacts/fixtures/seeds — id ranges, cardinalities, distribution of owners, who
  owns what at start. A grep/read of the artifact settles it early. In T-015 the
  spec assumed "the player faction owns regions at startup"; the real
  `provinces.generated.json` split owners across other factions, and the false
  premise surfaced only at the smoke gate — one wasted cycle, the project's only
  REDESIGN.

- **Complexity premises** (T-029): when a spec anticipates that "X is the
  hard/non-trivial part," EXPLORE must verify that difficulty explicitly — search
  whether an **existing mechanism already generalizes the "hard" case** — before
  PLAN designs new infrastructure for it. An unverified complexity premise drags
  PLAN into building infrastructure the system may already cover
  (over-engineering). In T-029 the spec declared that truncating the pursuit path
  to "stop at range" was the non-trivial part and ordered PLAN to design a
  path-truncation scheme; EXPLORE found `tick()` already had a generic
  post-`advanceMarches` check that clears the march once an engage-range predicate
  holds — parameterizing that radius solved the case without touching
  `processPursuit`/`findPath`. The plan inverted to something far simpler.

**The boundary between the two:** data premises are about **what's already there**
(the facts the design reads); complexity premises are about **how much new work is
really needed** (the effort the design assumes it must build). Same root — EXPLORE
validates the spec's assumptions, not just the existence of ports — on orthogonal
axes: *what data exists* vs *what still has to be built*. Expected EXPLORE output
either way: confirm or refute the premise with a `file:line` pointing at the
mechanism/artifact that settles it (or its documented absence).

## A bounded budget is a bound, not an absolute "never"

When a spec caps a costly resource (calls to an expensive port, allocations, passes
over a large pool), state the limit as a **bound — "acotado O(K) per pool/pass"** —
not as an absolute prohibition like "**never both X in the same pass**". Prefer the
K=5 + round-robin shape (T-014): a bound the implementer can size and a test can
count, over a categorical "never" that reads as an invariant to hold at any cost.
The absolute phrasing is brittle in two ways: it over-constrains the design (the
budget was the real intent, not a hard ban), and it can **silently contradict a
mandatory fallback the same spec already declares** — if the spec elsewhere requires
a fallback that, in a degenerate pass, *does* emit both X, the "never" and the
fallback are in direct conflict and the implementer is handed an unsatisfiable
contract. So, on any spec with a budget clause: (1) phrase the cap as `O(K)` per
pool/pass, and (2) **cross-check every absolute "never X" against the fallbacks
declared elsewhere in the same spec** — if a required fallback can produce X, the
"never" is wrong and must become a bound. This is spec-internal consistency
(the two clauses of *one* spec must not contradict), distinct from EXPLORE's job of
checking premises against the real code/data. Evidence: T-032 — the human approved
replacing "never both X in the same pass" with "bounded O(K) per pool/pass" and
adding the check that a "never X" not contradict a mandatory fallback already
declared in the same spec.

## Diagnose a reported bug with a throwaway sim before you spec it

A bug **reported while playing** (a runtime/gameplay report, not a failing test)
is a symptom, not a diagnosis. Before turning it into a fix task, **reproduce and
localize it with a throwaway simulation of the pure module** — run *outside the
pipeline*, with **no worktree**, **never committed** — to rule out hypotheses
instead of guessing the cause or opening a speculative task. Opening a task on a
guessed root cause spends a full pipeline cycle (spec → EXPLORE → PLAN → …) on a
design that may target the wrong mechanism; the disposable sim settles which module
and which invariant actually break, so the spec that follows is grounded in a
**reproduced fact**, not a hunch. Discard the sim once it has done its job — it's a
diagnostic probe, not an artifact of the task.

Evidence (T-033): the human approved diagnosing a play-reported bug with a
descartable simulation of the pure module before creating the fix task, in place of
adivinar the cause or spinning up a speculative spec.

**Once the sim reproduces the finding, classify it before you spec — you may not
have the authority to author the fix yet.** Reproducing the behavior settles *what
the code does*, not *what it should do*. Split the reproduced finding in two:

- **(a) Confirmed bug** — it violates a guarantee the system **already promised**
  (a spec'd invariant, a documented contract, an existing assertion). The "should"
  already exists; you're restoring it. **Spec the fix directly** — no new
  authorization needed, the promise was made earlier.
- **(b) Open design decision** — the behavior is *surprising* but **no promised
  guarantee is broken**; deciding it's "wrong" means **authoring a new promise** the
  system never made. That authorship is the **human's call**: **ask before you
  spec** (which behavior is intended), and only then turn the answer into a task.
  Writing the spec first silently converts your preference into a system guarantee.

The tell: point at the specific promise the finding breaks. If you can cite one
(invariant, contract, live assertion), it's (a) — fix it. If you can't — if calling
it a bug requires *inventing* the guarantee it supposedly violates — it's (b): the
scope of what counts as "correct" just widened, and widening the mandate is the
human's decision, not the diagnostician's.

**Boundary vs T-027 (empty scope / manufacturing filler):** related but distinct.
T-027 is about a loop that finds **no work** and must not fabricate filler or lower
its bar to invent some. Case (b) here is the loop that *did* reproduce a real
finding but must not **author a new guarantee** to justify calling it a bug — same
underlying discipline (don't broaden your own mandate to produce a task), applied to
the authorship of a promise rather than to the existence of work.

**Boundary vs T-020 (isolate the cause during implementation):** different phase.
T-020 isolates a cause **DURING** implementation — measuring the baseline via `git
stash` once a worktree and a diff already exist. T-033 is **PRE-task** diagnosis:
*before any spec or worktree exists*, to decide whether and how the task should be
created at all.

## The merge stays with the human

Automate the reproduce-fix-verify grind, but **the loop never ships to production
on its own.** A good loop proposes the fix and pings you. The human owns the
merge. Design it to stop and notify, not to silently auto-merge.

**For loops with external effects** (publishing, sending email, charging, calling
an API that changes something), put the hard limits **in code, not in config.**
Config gets changed by mistake or ignored; code doesn't. Examples: "max 1 publish
per day" as a code invariant, not an editable value; idempotency by key/date so a
retry or double-trigger doesn't repeat the effect; least-privilege tokens. The
irreversible effect is exactly where the loop must not be able to get it wrong.

## The learning loop (self-learning)

A loop only improves if it can **carry its lessons forward**. The mechanism is a
rules file (`RULES.md`) the loop consults and appends each lesson to:

`RUN → FAIL (mistake) → ANALYZE → FIX & IMPROVE → (rule applied next time)`

Each mistake becomes a permanent rule the loop can't repeat.

Rules for curating `RULES.md`:

- ✅ Add a rule **when the agent repeats a mistake** (not preventively).
- ✅ **Curate it by hand**: prune and rewrite; don't let it grow unchecked.
- ❌ Don't trust a prose note for something that can be a deterministic check —
  turn the lesson into a test/lint whenever you can.
- ❌ Don't let the loop fill itself with noise. Signal over volume.

## Observability: if you don't log it, you can't improve it

Self-learning depends on being able to look back. A loop running unattended must
leave **a log of every pass**: what it produced, what the checker said, whether it
passed or failed the gate, and why. Without that you can't curate `RULES.md`, you
don't notice when the loop starts degrading, and a silent failure goes unnoticed
until it does damage.

Minimum viable: one line per run with status (`generated / validated / shipped /
rejected`) and the reason for rejection. Errors **notify**, they aren't swallowed.

## Single agent vs fleet

- **Single-agent loop:** one agent repeats the cycle until the result is good.
  Simple, cheap, and **enough for most tasks.** Start here.
- **Fleet loop:** several specialized agents under an orchestrator. Use it only
  when one agent isn't enough. Don't jump to a fleet by default: it adds
  coordination and cost. (The full hexagonal dev-loop below IS a fleet loop —
  reach for it deliberately.)

## The 6 building blocks

When a loop needs real infrastructure, these are the six pieces you wire once.
Don't wire them all before you need them — add each when the loop asks for it:

1. **Automations** — the trigger/heartbeat: it runs on a schedule, not when you
   remember.
2. **Worktrees** — parallel agents with no file collisions (one worktree per
   agent).
3. **Skills** — project knowledge written once, read on every loop.
4. **Plugins & Connectors** — the loop touches real tools: PRs, tickets, Slack,
   CI.
5. **Subagents** — maker and checker as distinct agents (see above).
6. **Memory** — state that lives outside the conversation; the loop doesn't
   forget.

## Quick antidotes (anti-patterns → fix)

- Rules/memory only in chat → **persist them to disk** (RULES.md, memory, skills).
- Triggering every run by hand → **automate** the trigger.
- One agent that builds and reviews → **separate maker and checker**.
- Parallel agents stepping on each other's files → **one worktree per agent**.
- Soft gate / no gate → **deterministic checks** (compiler, tests, CI).
- "Fixes" that hide the symptom (retry/skip/timeout, placeholders) → the gate
  **forbids** them; verify it was solved, not that it stopped showing.
- Constant-value mock on a stochastic / shared-relation effect → it can't tell 1
  invocation from 2 → **varying-sequence mock or explicit call-count assertion**.
- Deleting a test because the task reverses the decision it asserts → **invert it
  in place** (same scenario, opposite assertion) + a **contrast test** if the old
  guarantee survives under some condition (e.g. the default). Complement of "don't
  skip the check", not a contradiction: inversion is spec-authorized and keeps the
  scenario enforced; skirting removes it from enforcement.
- Reusing extracted code in a new call site on signature fit alone → **re-open its
  context assumptions**; a green gate won't reveal a latent mismatch. Inject what
  varies or document the tradeoff.
- Assuming a new path inherits a sibling path's invariant just because both call
  the same primitive → a shared primitive is a **shared mechanism, not a shared
  contract**; **verify the invariant explicitly per path** (T-033: brake-in-range
  lived on the attack path, not on the shared `orderMove`).
- Turning a play-reported bug into a fix task on a guessed cause → **reproduce it
  first with a throwaway sim of the pure module** (no worktree, never committed) so
  the spec targets a reproduced fact, not a hunch. Then **classify the reproduced
  finding**: violates an **already-promised** guarantee (invariant/contract/live
  assertion) → **spec the fix directly**; surprising but **no promise broken** →
  calling it a bug means **authoring a new promise** → **ask the human before you
  spec** (T-035). Boundary vs T-027: T-027 forbids fabricating filler when there's
  no work; T-035 forbids authoring a new guarantee to justify a task from a real
  finding.
- Giving persistent memory to a component that used to recompute from scratch →
  **audit orphan/stale entries before assuming self-cleanup**; pin their safety to a
  **concrete guarantee** ("ids never recycled" / explicit purge on death), not "the
  old code recomputed so it's fine" (T-036). Complement of T-028: adding persistence
  into an existing component re-opens its state-lifecycle assumption.
- Spec assumes what an artifact contains, or that "X is the hard part," checked
  only against signatures/existence → EXPLORE **verifies the premise against real
  code/data** (the artifact's actual content; a mechanism that already covers X)
  before PLAN designs for it — data premise vs complexity premise, both are the
  spec's assumptions.
- Spec caps a costly resource with an absolute "never both X in the same pass" →
  state it as a **bound (`O(K)` per pool/pass)** the implementer can size and a test
  can count, and **cross-check the "never X" against the spec's own mandatory
  fallbacks** — if a required fallback can emit X, the "never" contradicts it and
  must become a bound (spec-internal consistency, not an EXPLORE premise check).
- Infinite retry → **attempt cap** (`MAX_ATTEMPTS`) and escalate to the human.
- Orchestrator invents filler / lowers its confidence bar / widens its own scope
  to avoid an empty run → **"no findings" is a valid result**: stop and ask;
  scope-widening is the human's call.
- Blind loop, no trace → **log every pass**; errors notify.
- External-effect limit in config → **put it in code** + idempotency.
- Silent auto-merge → **propose and notify**; the human merges.
- RULES.md growing unchecked → **curate it**; turn lessons into checks.

## In one line

Your job isn't just to design loops that **direct** agents. It's to design loops
that **learn from experience** — bounded, verifiable, and a little better on every
pass.

---

## Scaling up: the complex hexagonal dev-loop system

Everything above is the simple, always-correct default. When the work is a real
software project and you want a **multi-agent, multi-model development loop with
per-layer protection so you can swap frameworks fast**, this skill packages a full
system: a **creational loop** (human + you produce a spec + verification
contract) feeding a **development loop** (a subagent pipeline that can only close
a task if the contract is met). Model spend follows the **cost of an error, not
the volume of work** — cheap models read many files, expensive models plan and
review.

Load the reference for the piece you need — don't pull the whole system into
context at once:

| You want to… | Read |
|---|---|
| Understand the two loops, the task spec template, the `/task-dev` pipeline, and the model-per-phase rationale | [`references/dev-loop-system.md`](references/dev-loop-system.md) |
| Grade model spend & gates by hexagonal layer (domain → adapters); the Ring System | [`references/ring-system.md`](references/ring-system.md) |
| Add Domain-Driven Design on a rich domain: bounded contexts + a second (breadth) cost axis, aggregates/invariants, context-guard (opt-in per subdomain) | [`references/ddd.md`](references/ddd.md) |
| Score subjective quality with anchored rubrics that calibrate to your taste | [`references/scoring-and-calibration.md`](references/scoring-and-calibration.md) |
| Make the project's skills improve over time (skill-curator, LEARNINGS.md, SCORES.md) | [`references/skills-self-learning.md`](references/skills-self-learning.md) |
| Understand why subagents exist and isolate parallel work with git worktrees | [`references/subagents-and-worktrees.md`](references/subagents-and-worktrees.md) |
| Auto-propose the "what's next" from a document that IS the user's taste (the Soul: SOUL.md + pre-backlog + `/soul-loop`) | [`references/soul.md`](references/soul.md) |

**Ready-to-copy templates** for instantiating the system in a project live in
[`assets/`](assets/): the slash commands (`assets/commands/`), the subagent
definitions (`assets/agents/`), the `T-XXX` spec template
(`assets/task-template.md`), and the per-project `CLAUDE.md`
(`assets/CLAUDE-template.md`). Copy them into a project's `.claude/` and fill the
placeholders; the per-project instance only holds paths and the ring map — the
system itself stays in this skill.

**Setting up the system in a project (scaffolding).** When the user asks to set up
/ instantiate / bootstrap the system, run the **`/loop-init`** command
([`assets/commands/loop-init.md`](assets/commands/loop-init.md)) — the runnable
form of [`references/scaffolding.md`](references/scaffolding.md). It creates the
folder layout, copies the `assets/` into `.claude/`, builds the hexagonal `src/`
skeleton, instantiates `CLAUDE.md` from the template, and **initializes git** — a
hard prerequisite, because the development loop isolates every task in a `git
worktree` and merges per ring. No git, no pipeline. It shows the plan and gets an
OK before writing (same checkpoint discipline as the rest of the system).

When NOT to scale up: a one-off script, a task with no repetition, or anything a
single-agent closed loop already handles. The hexagonal pipeline earns its
coordination cost only on ongoing projects where a domain error is expensive.

## Self-learning (minimal)

Keep this skill's own learning **rare**. Capture something only when it's genuinely
important — a rule that would change a *future* run, not a one-off observation.
Most sessions add nothing to the skill, and that's the correct outcome: a skill
that accumulates minor notes rots (skill-bloat). **Default: change nothing.**

When a learning truly clears that bar, fold it into the body above as a real rule
— the body is what guides future runs. Don't leave learnings as loose notes.

This section is NOT the two things below — keep them separate:
- **The system's built-in learning** (the `skill-curator` harvesting a project's
  closed tasks into that project's `LEARNINGS.md`/`SCORES.md`) is the *project's*
  loop, documented in
  [`references/skills-self-learning.md`](references/skills-self-learning.md) and
  [`references/scoring-and-calibration.md`](references/scoring-and-calibration.md).
  It has nothing to do with editing this skill.
- **The edit history of this skill's own documents** (SKILL.md, `references/`,
  `assets/`) is logged for traceability in
  [`CHANGELOG.md`](CHANGELOG.md), outside this file. Whenever you change a
  reference or asset, add an entry there — don't narrate it here and don't grow a
  changelog inside SKILL.md.
