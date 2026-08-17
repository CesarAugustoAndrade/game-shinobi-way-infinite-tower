# T-105 review

**SPEC CONFORMANCE: 96/100.** ATTACK AP4/CP7/HP10/CD5 20 ANY, Rasengan-identical clones `modeInteraction` (consume 1 / +50%, not requireOn). Burn 5×2 only on enhance + hit via `requireModeEnhance` + `requireHit`. Mute AP2 / no Mode / “cannot be evaded” identity dropped. Miss still spends the charge.

**ARCHITECTURE: PASS.** RING-GUARD: types + ResolveSkillSystem + skills + tests + sim. Extends existing `MarkSpec` / `applySkillMarkEffects` (no second clone mult). No React / components / scenes / hooks / contexts. OOS skills untouched.

**QUALITY:** NIT — SkillTag.CLONE unavailable (NINJUTSU+FIRE+UZUMAKI). Miss path bundled in clones test.

**VERDICT: APPROVE**
