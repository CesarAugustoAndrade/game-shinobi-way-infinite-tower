# T-113 review

**Verdict:** APPROVE

## Spec conformance

| AC | Result |
|---|---|
| AC1 authoring ATTACK AP5/CP13/HP20/CD5 20 + consumeCharges 2 + Burn 8×4 TRUE; not 13/50×5 | PASS |
| AC2 hit: dmg 20, charges −2, Burn 8×4, HP −20; miss still spends, no Burn | PASS |
| AC3 no Sharingan / 1 charge → mode-required; consume nothing | PASS |

TRUE Burn: live plant is `markEffects` 8×4; catalog TRUE identity is `effects` BURN 8×4 `damageType: TRUE` (MarkSpec has no damageType; ticks are not resolved here).

## Architecture

- R0: `skills.ts` authoring + existing `requireOn` gate now also requires `consumeCharges` when set (skipped if `consumeAllCharges` — Peacock C=3 still legal). No new charge API. No port change.
- RING-GUARD: no React/components/scenes/hooks/contexts imports.

## Quality

- BLOCK: none
- SHOULD: none
- NIT: SkillTag.DOJUTSU absent; used UCHIHA + NINJUTSU + FIRE.

## Out of scope

Untouched: kirin, rasenshuriken, fang_over_fang, bone_drill, c4_karura, Tsukuyomi, SOUL, live UI.
