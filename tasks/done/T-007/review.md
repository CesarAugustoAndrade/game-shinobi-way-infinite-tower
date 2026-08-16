# T-007 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- AC1 invalid no-consume: AP / range / CD reject returns clone of fixture; input unmodified.
- AC2 attempt vs impact: miss spends attempt, keeps impact, commits AP/CP + `readyOnTurn`; ≥1 hit consumes impact once (varying-sequence `rollHit`).
- AC3 roles: SUPPORT `baseDamage: 0` applies mark, 0 dmg, ignores injected offensive `rollHit`; MODE activation port called once; PASSIVE rejected.
- Role from `resolveCardRole` only — not inferred from damage.
- SOUL order: validate → commit → attempt marks/charges → role → impact if ≥1 hit → movement/reactions.
- `SkillResolutionSystem` untouched. Live `useSkill` not rewritten (plan: parallel SoT API).

## Architecture

- RING-GUARD: `ResolveSkillSystem.ts` imports only R0 (`types`, `constants`, other `systems`). No React/DOM/hooks/scenes/components.
- Immutability: clone on entry; reject returns clone of original.
- Mode/Mark/rng injected as ports; default Mode port applies **board only** (does not write `result.pools`) so skill commit is not double-paid.

## Quality

- BLOCK: none.
- SHOULD (out of scope this close): live `useSkill` still a second path; default `activateMode` may fail affordance after skill costs already deducted if activationCost == remaining pools; `perHitEffects` counted not applied; unused `MarkConsumeTiming` import.
- NIT: inline `import('../types').Buff`.

## Out of scope respected

No catalog reauthor, UI, Terrain/Heat, SOUL edit, `useSkill` cutover.
