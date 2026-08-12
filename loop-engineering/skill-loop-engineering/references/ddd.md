# DDD overlay — Domain-Driven Design on top of the hexagon

**Opt-in.** This is an optional overlay for projects with a rich domain. It's
never mandatory and it's applied **per subdomain**, not globally — full tactical
DDD only where the business value concentrates. If your domain is thin (CRUD, a
tool, a thin API over a service), skip this file: a single hexagon with the plain
Ring System is the right tool. DDD earns its overhead only where the domain is
genuinely complex or where the same word means different things in different
places.

## The one idea: DDD adds a second axis

The Ring System protects **one hexagon by depth** (domain → adapters). DDD adds
the axis it's missing — **breadth**, the partition of a large system into several
hexagons:

| Axis | Question | Spend rule |
|---|---|---|
| **Ring** (you already have it) | How deep is the change? | Spend where the **error** is expensive (domain > adapter) |
| **Subdomain** (DDD adds it) | How valuable is this slice of the business? | Spend where the **value** is (core > supporting > generic) |

Crossed, they give the 2D cost matrix formalized in `ring-system.md`. The
system's single most expensive place becomes precise: **Ring 0 of the core
subdomain**. The cheapest: Ring 3 of a generic subdomain (the one you could
replace with a SaaS). DDD strategic design and the Ring System are the same cost
rationale on two axes.

DDD enters in two halves with two different integrations.

---

## Strategic DDD — structure *above* the hexagon

### Bounded contexts = "one hexagon"
A **bounded context** is the scope inside which a model and its ubiquitous
language are consistent. A real system is several contexts, each its own hexagon
(its own rings). A term (`Order`, `Account`, `Customer`) may exist in several
contexts with **different meaning and shape** — that's expected, not a bug to
deduplicate.

- **`context-guard` (sibling of RING-GUARD):** an objective check that FAILS if
  one context reaches into another's internals. A context may only depend on
  another through its **published API** or an **anti-corruption layer** — never on
  its domain types directly. Ring-guard protects depth; context-guard protects
  breadth. Both are deterministic greps/dep-checks, not opinions.
- **One model → one context.** Don't invent contexts to look sophisticated; a
  context boundary is justified by a genuine model conflict or team/lifecycle
  seam, not by folder aesthetics.

### Subdomain distillation = the breadth cost axis
Classify each subdomain and let it *modify* the ring policy (see `ring-system.md`
for the base×modifier matrix):

| Subdomain | What it is | DDD investment |
|---|---|---|
| **Core** | the differentiator, the reason the product wins | full tactical DDD; most expensive models/gates |
| **Supporting** | needed but not a differentiator | light tactical or plain use-cases |
| **Generic** | a solved problem (auth, notifications, billing) | buy/outsource or the simplest thing that works — often **don't** DDD it |

The DDD-native resolution to "DDD is heavyweight": DDD itself tells you **where not
to do DDD**. Full aggregates and invariants in a generic subdomain is the
anti-pattern, not the goal.

### Ubiquitous language
The shared, precise vocabulary of a context — the names in the code ARE the names
the domain experts use. It's project knowledge, so it lives in a **skill**
(`domain-model` per core context; see `assets/skills/domain-model/`), not scattered
in comments. Enforced **softly**: the reviewer and a naming lint flag synonyms and
technical jargon leaking into the domain, but this is a NIT/SHOULD, rarely a BLOCK
— language police is worse than an occasional synonym.

### Context mapping — how contexts relate
When context A consumes B, name the relationship; it dictates the wiring:

- **Anti-corruption layer (ACL):** A wraps B behind a translator so B's model
  never leaks into A. **The default for consuming anything you don't control.**
- **Shared kernel:** A and B share a small, jointly-owned model. Powerful but
  couples two teams — use sparingly.
- **Customer/Supplier, Conformist:** A depends on B's model as-is (conformist) or
  negotiates it (customer/supplier).
- **Published language / Open host service:** B exposes a stable, documented
  contract many consumers use.

Planner rule (extends the **push-outward** rule): **push across correctly** —
foreign contexts enter only through an ACL/adapter of a port, never by importing
their domain types. A cross-context import of a domain type is a `context-guard`
BLOCK.

---

## Tactical DDD — structure *inside* Ring 0–1

Tactical patterns give the previously-opaque "Ring 0 · domain" a vocabulary and,
crucially, turn vague gates into **deterministic checks** (exactly what the
quality-gate philosophy wants):

- **Aggregate** (Ring 0): a cluster of objects with a **root** and an **invariant
  boundary**. The consistency unit. Rules that become objective gates:
  - modified **only through its root** (no reaching into inner entities from
    outside) — a grep/lint check;
  - **no references across aggregates except by ID** — a grep/lint check;
  - **every invariant has a property/invariant test** — replaces the old vague
    "property/invariant test if applicable" in the Ring 0 gates.
- **Value object** (Ring 0): immutable, equality by value, self-validating (a
  `Money`, an `Email`). Gate: construction rejects invalid state (a test).
- **Entity** (Ring 0): identity over time; equality by ID.
- **Domain event** (Ring 0): a named fact that happened (`OrderPlaced`). Decouples
  aggregates and contexts (an event crossing a context boundary is a mapping
  relationship, not a direct call).
- **Domain service** (Ring 0): domain logic that doesn't belong to one aggregate.
  Stateless. Not a place to dump anemic-model logic.
- **Repository** = a **port** (Ring 1), implemented by an adapter (Ring 2). The
  domain speaks "give me the aggregate"; persistence is an adapter detail. This is
  already how the hexagon works — DDD just names it.
- **Application service / use case** (Ring 1): orchestrates aggregates and
  repositories to fulfill a use case. No business rules here (those live in the
  aggregate); it coordinates, it doesn't decide.
- **Factory** (Ring 0/1): encapsulates complex aggregate construction so the
  invariant holds from birth.

Watch the **anemic domain model** anti-pattern: aggregates that are bags of
getters/setters with all logic in services. If the domain has no behavior, you
don't need tactical DDD — you have a data model, so say so and use Ring 2 logic.

---

## How the overlay plugs into the pipeline

- **Task template** (`assets/task-template.md`): a **Bounded context** field, a
  richer "Layers touched" (`aggregate | value-object | domain-event |
  domain-service | repository-port | application-service`), and DDD objective
  gates in the checklist (context-guard, aggregate-boundary, invariant tests).
- **`/task-new` brainstorm** for `create` in a core context: **design the
  aggregate boundary and its invariants first** — the DDD analog of "port design
  first".
- **explorer**: reports which bounded context and which aggregate the task touches;
  flags any cross-context or cross-aggregate reference as a re-classification
  signal (a cross-context contract change is at least as expensive as a Ring 1
  port change).
- **planner**: obeys push-outward *and* push-across-correctly (ACL for foreign
  contexts); keeps invariants in the aggregate, orchestration in the use case.
- **skills**: a `domain-model` skill per core context holds the ubiquitous
  language + the model decisions; injected into planner/reviewer on domain tasks.
- **scoring** (`scoring-and-calibration.md`): DDD's soft judgments slot into the
  existing score system as a subjective dimension — **"model expressiveness /
  aggregate design"** (is the boundary right? does the code speak the language?).
  No new machinery; it calibrates like any other dimension. The `domain-model`
  skill owns its RUBRIC.

## DDD-specific objective gates (deterministic, run by `verifier`)

Add to a domain task's spec, as commands with exit codes:
- **context-guard**: dep-check that fails on cross-context internal imports (e.g. a
  depcruise rule: context A's files may not import `contexts/B/domain/**`, only
  `contexts/B/api/**`).
- **aggregate-boundary**: grep/lint — no imports of an aggregate's inner entities
  from outside its root; no cross-aggregate references except by ID type.
- **invariant tests**: each aggregate invariant has a property/invariant test
  (part of the Ring 0 ≥90% coverage gate).

## Anti-patterns

- **Cargo-cult DDD:** aggregates/VOs/events on a thin domain → use the plain
  hexagon; DDD is opt-in per subdomain.
- **Inventing bounded contexts:** contexts with no model conflict → merge them; a
  boundary you can't justify by a model difference is just folders.
- **Anemic model:** all logic in services, aggregates are data bags → either put
  behavior in the aggregate or admit it's a data model and don't DDD it.
- **Leaky context:** consuming a foreign context by importing its domain types
  instead of via an ACL → context-guard BLOCK.
- **Ubiquitous-language police:** blocking merges over synonyms → keep it a
  NIT/SHOULD + lint, not a hard gate.
- **Full DDD in a generic subdomain:** the one place distillation tells you to stay
  cheap → the reviewer flags over-engineering as a SHOULD.
