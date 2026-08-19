# T-117 review

**Verdict:** APPROVE

## Spec conformance

| AC | Result |
|---|---|
| AC1 authoring ATTACK AP2/CP0/CD0 12 CLOSE, no modeInteraction | PASS |
| AC2 CLOSE hit 12; Mode charges unchanged; MEDIUM reject | PASS |
| AC3 resolveCardRole ATTACK without authoringMap | PASS |

Aggressive stanceBonus kept (catalog silent; not Mode). Heavy Kick untouched.

## Architecture

- R0 authoring only in `skills.ts`. No ResolveSkill fork. Mirrors T-116.
- RING-GUARD: no React/components/scenes/hooks/contexts imports. No port signature change.

## Quality

- BLOCK: none
- SHOULD: none
- NIT: none.

## Out of scope

Untouched: heavy_kick, Skill Config default Main, fang_over_fang, kirin, SOUL, live UI.
