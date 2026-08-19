# T-127 review

**Verdict:** APPROVE

## Spec conformance

| AC | Result |
|---|---|
| AC1 SUPPORT ACTIVE AP1/CP3/CD5 Aggressive + Setup/open marks | PASS |
| AC2 plant self focus 2 + open 20/1; damage 0 | PASS |
| AC3 next ATTACK ×1.2 Setup consume focus; open remains | PASS |

Lee kit moved from toggle to active. RING-GUARD: authoring + loadout honesty + one table row.

## Architecture

- R0 `skills.ts` + `ResolveSkillSystem` `markDamageMultiplier`/`aggressive_focus` ATTACK consume + Lee kit. Reuses attempt Setup ×1.2. Open mark plant-only (no new incoming mit engine).

## Quality

- BLOCK: none
- SHOULD: none
- NIT: none.

## Out of scope

Untouched: focused/defensive retune, kawarimi, c4, edo, full incoming mit, live UI, SOUL.
