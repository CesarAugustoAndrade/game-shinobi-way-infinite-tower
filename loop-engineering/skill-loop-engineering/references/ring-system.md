# Ring System — protection gradient by hexagonal layer

Principle: **the closer to the center of the hexagon, the more expensive it is to
be wrong and the cheaper it should be NOT to touch it.** The domain encodes the
business rules (the core logic); an error there contaminates every use case and
adapter. An adapter, by contrast, is replaceable by design: it can vary without
fear. This is what lets you swap frameworks fast — the framework lives in the
outer rings, the value in the inner ones.

```
        ┌──────────────────────────────────────────────┐
        │ RING 3 · composition root, config, assets     │  changes daily     → free
        │  ┌────────────────────────────────────────┐  │
        │  │ RING 2 · adapters in/out (frameworks…)  │  │  changes per sprint → cheap
        │  │  ┌──────────────────────────────────┐  │  │
        │  │  │ RING 1 · ports + use cases        │  │  │  contracts         → expensive
        │  │  │  ┌────────────────────────────┐  │  │  │
        │  │  │  │ RING 0 · domain (rules)     │  │  │  │  near-immutable    → very expensive
        │  │  │  └────────────────────────────┘  │  │  │
        │  │  └──────────────────────────────────┘  │  │
        │  └────────────────────────────────────────┘  │
        └──────────────────────────────────────────────┘
```

## Policy per ring

| | Ring 0 · domain | Ring 1 · ports/use-cases | Ring 2 · adapters | Ring 3 · wiring/assets |
|---|---|---|---|---|
| **Planner** | **fable** (mandatory) | opus (fable if a port signature changes) | opus / sonnet on S | sonnet |
| **Implementer** | **opus** | sonnet | sonnet | sonnet / haiku |
| **Reviewer** | **opus + human reads the full diff** | opus | sonnet (opus if there's logic) | sonnet |
| **Human checkpoint** | plan AND merge, no exception | plan if the public contract changes | no (if tests pass) | no |
| **--auto allowed** | NEVER | NEVER | yes (fix with regression) | yes |
| **Extra gates** | domain coverage ≥90%; property/invariant test if applicable; forbidden to touch without an explicit type≠polish task | port contract tests (all existing adapters still compile and pass) | adapter integration tests | objective verification suffices |
| **Max fix cycles** | 1 (on the 2nd, human) | 2 | 2 | 3 |

## Three hard rules

1. **Innermost-ring rule:** a task inherits the policy of the deepest ring it
   touches. If 90% of the diff is an adapter but it changes one line of the
   domain, it's a Ring 0 task.
2. **Contract rule:** changing the *signature* of a port is Ring 1 no matter where
   the file lives. The contract belongs to the core; the implementation doesn't.
   (The explorer detects this in phase 1 and re-classifies the task.)
3. **Push-outward rule:** if the planner can solve the task touching only outer
   rings (e.g. logic in the correct adapter instead of "sneaking" it into the use
   case), it MUST prefer that option and justify when it doesn't. Goal: constant
   pressure to keep the core small and stable.

## Cost rationale

Model spend follows the **cost of an error, not the volume of work**. A Ring 3
failure is detected and fixed in minutes; a Ring 0 failure can live for weeks
corrupting persisted data and decisions that depend on the core logic (in a game:
saved games and balance; in a financial system: calculations and ledger entries).

## DDD overlay: the second axis (optional)

The ring is a **vertical** gradient inside one hexagon. When a project adopts the
DDD overlay (`ddd.md`), a **horizontal** axis is added: the **subdomain** the code
belongs to. Rings answer "how expensive is the error?"; subdomains answer "how
valuable is this slice of the business?". Crossed, they say exactly where to spend.

**Base × modifier (not a 16-cell table).** The ring sets the baseline model/gate
policy above. The subdomain type applies a modifier on top:

| Subdomain | Modifier on the ring baseline |
|---|---|
| **Core** | bump UP: Ring 1 of a core context behaves like Ring 0 (planner fable-eligible, human checkpoint on contract changes, invariant tests). The system's most expensive place is **Ring 0 of the core**. |
| **Supporting** | baseline as-is. |
| **Generic** | allow DOWN: prefer buying/outsourcing; if built, the innermost ring may run one tier cheaper. Full tactical DDD here is over-engineering (the reviewer flags it). |

**`context-guard` — the horizontal sibling of RING-GUARD.** RING-GUARD fails if a
diff touches a ring deeper than declared. `context-guard` fails if a diff makes one
bounded context reach into another's internals (a context may depend on another
only through its published API or an anti-corruption layer). Both are deterministic
dep-checks and both are standard objective gates on a DDD project. See `ddd.md` for
the tactical gates (aggregate-boundary, invariant tests) that refine the Ring 0
gate row above.

The innermost-ring and contract rules still hold; the subdomain modifier composes
with them — a task inherits the innermost ring it touches AND the highest-value
context it touches.

## Related anti-patterns

- **Ring erosion:** domain logic sneaking into adapters to dodge the Ring 0 gates
  → the reviewer marks it BLOCK: core logic outside the domain is the MOST severe
  violation, not an acceptable shortcut.
- **Context leak** (DDD overlay): one bounded context importing another's domain
  types instead of going through its published API / ACL → `context-guard` BLOCK.
  Breadth erosion is as severe as depth erosion.
