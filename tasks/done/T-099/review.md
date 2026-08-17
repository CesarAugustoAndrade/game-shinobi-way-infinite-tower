# T-099 review

**SPEC CONFORMANCE: 96/100.** ATTACK AP3/CP6/CD4 18 M/L, `setupRead` mist +0.2 `consume: false`. Hit under mist `floor(18*1.2)=21` and mark stays. No mist = 18. Honest copy. Mute 15/AP2 dropped.

**ARCHITECTURE: PASS.** RING-GUARD: constants + tests + sim. Reuses T-042 `setupRead` + T-073 id `mist`. No ResolveSkill fork. OOS skills untouched.

**QUALITY:** NIT — miss case lives under `T-099 no mist` (still asserted). CLOSE reject bundled in mist-bonus test.

**VERDICT: APPROVE**
