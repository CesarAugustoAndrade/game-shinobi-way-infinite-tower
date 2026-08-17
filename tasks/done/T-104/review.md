# T-104 review

**SPEC CONFORMANCE: 96/100.** ATTACK AP3/CP7/CD4 4×4 ANY, `impactStun` 0.4×1 `minHitsLanded: 2`. Mute 15 / AP2 / PIERCING / STUN 0.5 dropped. Stun once per card only if ≥2 hits; 1-hit and miss skip even when rng would succeed. Default minHits 1 leaves T-055/T-080/T-090/T-093/T-097/T-100 unchanged.

**ARCHITECTURE: PASS.** RING-GUARD: types + ResolveSkillSystem + skills + tests + sim. Extends existing `ImpactStunSpec` / `resolveImpactStun` (no second stun pipeline). No React / components / scenes / hooks / contexts. OOS skills untouched.

**QUALITY:** NIT — SkillTag.CONTROL unavailable (NINJUTSU+WATER+MULTI_HIT). LONG legality bundled in multi-stun test.

**VERDICT: APPROVE**
