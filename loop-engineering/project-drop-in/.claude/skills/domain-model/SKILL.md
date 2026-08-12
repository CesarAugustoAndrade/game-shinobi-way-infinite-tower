---
name: domain-model-<context>
description: >-
  Ubiquitous language and tactical model for the <context> bounded context.
  Injected into planner/reviewer on tasks touching this context's domain/use-cases.
  Rename per context (domain-model-orders, domain-model-billing…). Requires the
  DDD overlay (skill loop-engineering → references/ddd.md).
---

# Domain model · <context>

<!-- SCAFFOLD — copy into .claude/skills/ per CORE bounded context and fill in.
     Supporting subdomains may keep a lighter version; generic subdomains usually
     don't need this at all (ddd.md, subdomain distillation). -->

Foundational skill for the **<context>** bounded context: its ubiquitous language,
its aggregates and invariants, and the model decisions a task must respect. This
is what makes the code speak the domain — the planner leans on it to place logic
in the right aggregate, the reviewer to catch language and boundary drift.

## Ubiquitous language (glossary)

The precise terms of this context. Code uses these names; a synonym in the domain
is a review NIT (a naming lint catches the common ones).

| Term | Means | NOT (common confusion) |
|---|---|---|
| `<Order>` | <definition in this context> | <what it is in another context> |
| `<LineItem>` | <definition> | <e.g. not a product> |

## Aggregates (the consistency boundaries)

For each aggregate: its root, what it protects, and its invariants (each invariant
must have a property/invariant test — a Ring 0 gate).

### `<Order>` (root: `<Order>`)
- **Protects:** <the invariant this boundary exists to keep>
- **Invariants:**
  - [ ] <e.g. total = sum(line items) − discounts, always ≥ 0> → test: `<name>`
  - [ ] <e.g. a confirmed order has ≥1 line item> → test: `<name>`
- **Referenced from other aggregates:** by ID only (`OrderId`), never by object.

## Value objects

`<Money>`, `<Email>`, `<Quantity>`… — immutable, validated at construction.
| VO | Rejects | 
|---|---|
| `<Money>` | negative amount, mismatched currency in arithmetic |

## Domain events

Named facts this context publishes. An event crossing a context boundary is a
context-mapping relationship (ddd.md), not a direct call.
- `<OrderPlaced>` — <when it fires, what it carries>

## Model decisions (the "why", with evidence)

Decisions that aren't obvious from the code, each tied to a task.
- <e.g. "Pricing lives in a domain service, not in Order, because it depends on
  the catalog context (T-021).">