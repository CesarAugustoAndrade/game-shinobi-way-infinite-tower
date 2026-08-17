# T-095 review

**SPEC CONFORMANCE: 96/100.** ATTACK AP3/CP5/CD3 16 M/L, `bandMove` PUSH requireHit, `setupMultIfBandMoved: 0.2`. MEDIUM hit → `floor(16*1.2)=19` + LONG; PUSH@LONG → 16 no move; miss no PUSH. Mute ACC −25% / AP2 dropped. Would-move peek before damage (Setup bucket, T-018 floor).

**ARCHITECTURE: PASS.** RING-GUARD: types + constants + ResolveSkill + tests + sim. Reuses `applyForcedMove` / PUSH motor. Optional Skill field, no port change. OOS skills untouched.

**QUALITY:** NIT — SkillTag.MOVEMENT unavailable. Enemy Temari/Sound still share the same skill (AP 3; OOS).

**VERDICT: APPROVE**
