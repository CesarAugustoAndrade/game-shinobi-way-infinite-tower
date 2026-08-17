# T-101 review

**SPEC CONFORMANCE: 96/100.** ATTACK AP3/CP6/CD3 18 M/L, `setupRead` coffined +0.5 `consume: true` + `alsoIfEnemyStunned`. Hit under Coffined `floor(18*1.5)=27` and mark gone. Stun-only 27, STUN remains. Bare 18. Mute 15/AP2/low-HP execute dropped.

**ARCHITECTURE: PASS.** RING-GUARD: types + ResolveSkill + constants + tests + sim. Extends existing `setupRead` (no second pipeline). Consume stays markId-only. Stub `!useHitCore` sibling uses `setupArmed` (T-033). OOS skills untouched.

**QUALITY:** NIT — CLOSE reject bundled in coffined test. Optional flag defaults unset so T-042/T-099 stay mark-only.

**VERDICT: APPROVE**
