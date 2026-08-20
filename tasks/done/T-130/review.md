# T-130 review

**Verdict:** APPROVE

## Spec conformance

- AC1 authoring: SUPPORT, AP4/CP18/HP30/CD10, `baseDamage: 0`, Reanimation self-mark duration 3, no STR/SPD 0.5 identity. Honest description. Tags NINJUTSU/MENTAL/MARK (no invented SkillTags).
- AC2 plant: `resolveSkill` plants duration 3, HP −30, `damageDealt === 0`; insufficient HP `'hp'` no-consume.
- AC3 helper: lethal + mark → HP 1, consume, Shield 40 (`MarkFamily.SHIELD` stacks 40 duration 99); unarmed/non-lethal passthrough; ATTACK weight +1 while armed, gone after consume; SIDE unchanged.
- Out of scope respected: no c4/copy/kawarimi, no EnemyTurn rewrite, no guts formula change, no UI.

## Architecture

- R0 only. MarkSystem + skills.ts. No React / components / scenes / hooks / contexts.
- Helper is a new MarkSystem export (T-129 sibling). Does not change `checkLethalDamage` signature. Not a port rewrite → stays R0.
- Immutability: clones marks; `addMark` for shield.

## Quality

- BLOCK: none
- SHOULD: none
- NIT: live EnemyTurn/guts pre-step and `buildUpkeepWeightContext` mark peek are documented follow-ups (spec-optional, T-074 bar).

## RING-GUARD

PASS. Touched R0 files import only `../types` and RangeSystem.
