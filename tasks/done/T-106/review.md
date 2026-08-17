# T-106 review

**SPEC CONFORMANCE: 96/100.** SIDE AP2/CP5/CD3 9 M/L, `poison` 6×3 `requireHit`, `durationBonusIfEnemyMark` mist +1 → duration 4. Mute TRUE 18×4 / “ignores 50% def” dropped. Miss plants nothing; mist itself is not consumed.

**ARCHITECTURE: PASS.** RING-GUARD: types + ResolveSkillSystem + skills + tests + sim. Extends existing `MarkSpec` / `applySkillMarkEffects` (no second DoT / no TRUE pipeline). No React / components / scenes / hooks / contexts. OOS skills untouched.

**QUALITY:** NIT — SkillTag.POISON unavailable (NINJUTSU+FIRE). Miss path bundled in mist test.

**VERDICT: APPROVE**
