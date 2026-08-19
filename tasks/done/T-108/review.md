# T-108 review

**Verdict:** APPROVE

## Spec conformance

| AC | Result |
|---|---|
| AC1 authoring ATTACK AP4/CP8/HP20/CD7 25 C/M Poison 6×3 requireHit; no TRUE 15×4 | PASS |
| AC2 hit: HP −20, dmg 25, poison 6×3 | PASS |
| AC3 miss still pays HP −20, no poison; insufficient HP consumes nothing | PASS |

## Architecture

- R0 authoring only in `skills.ts`. No ResolveSkill fork. Poison plant reuses `markEffects` id `poison` + `requireHit` (T-106). HP commit is existing `hpCost` (T-007).
- RING-GUARD: no React/components/scenes/hooks/contexts imports. No port signature change.

## Quality

- BLOCK: none
- SHOULD: none
- NIT: SkillTag.SUMMON / POISON still absent (same as T-107 SUMMON). Used NINJUTSU + PHYSICAL.

## Out of scope

Untouched: bone_drill, fang_over_fang, kawarimi, summon_gamabunta, c4_karura, SOUL, live UI.
