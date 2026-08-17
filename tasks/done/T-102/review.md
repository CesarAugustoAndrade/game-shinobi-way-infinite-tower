# T-102 review

**SPEC CONFORMANCE: 96/100.** ATTACK AP3/CP6/CD4 22 M/L, dual `markEffects` poison 4×2 + bleed 4×2 `requireHit`. Hit plants both once; miss plants neither. Mute AP2 + TRUE poison 10×3 / bleed 10×3 dropped.

**ARCHITECTURE: PASS.** RING-GUARD: constants + tests + sim. Reuses T-091 `requireHit` loop (dual entries). No ResolveSkill fork. OOS skills untouched.

**QUALITY:** NIT — SkillTag.PUPPET/POISON unavailable (WEAPON+PHYSICAL). LONG hit lives under `T-102 miss`.

**VERDICT: APPROVE**
