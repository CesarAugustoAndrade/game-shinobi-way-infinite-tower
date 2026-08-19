# T-114 review

**Verdict:** APPROVE

## Spec conformance

| AC | Result |
|---|---|
| AC1 authoring ATTACK AP6/CP20/CD5 6×5 M/L clones consume 2 +0.5; not TRUE-15 | PASS |
| AC2 Mode OFF: 6 hits / 30 / no spend; CLOSE reject | PASS |
| AC3 clones ≥2: 45 dmg, charges −2; 1 charge stays base 30 / no spend | PASS |

20% pen: used existing `DamageProperty.PIERCING` (Rasengan convention). No new pen field.

## Architecture

- R0 authoring only in `skills.ts`. No ResolveSkill fork. Reuses T-018 clone enhance + T-033 multi-hit.
- RING-GUARD: no React/components/scenes/hooks/contexts imports. No port signature change.

## Quality

- BLOCK: none
- SHOULD: none
- NIT: SkillTag.KINJUTSU absent; used UZUMAKI + NINJUTSU + WIND + MULTI_HIT.

## Out of scope

Untouched: new 20% pen motor, kirin, fang_over_fang, c4_karura, Rasengan, SOUL, live UI.
