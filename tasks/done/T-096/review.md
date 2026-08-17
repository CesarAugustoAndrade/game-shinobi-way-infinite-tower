# T-096 review

**SPEC CONFORMANCE: 96/100.** ATTACK AP3/CP6/CD4 16 CLOSE, self STAT `expansion_str` stacks 2 duration 1. Mute STR +50%×2 / AP2 / Aggressive stanceShift dropped. Honest description. Plants on miss (no `requireHit`). StatSystem mark hook deferred (spec minimum AC; documented in test).

**ARCHITECTURE: PASS.** RING-GUARD: constants + tests + sim only. No ResolveSkill / StatSystem change. OOS skills untouched.

**QUALITY:** NIT — SkillTag.TAIJUTSU unused (NINJUTSU/PHYSICAL present). `targetStat` not on MarkSpec (id + stacks 2 documents +2 STR).

**VERDICT: APPROVE**
