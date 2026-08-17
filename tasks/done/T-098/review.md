# T-098 review

**SPEC CONFORMANCE: 96/100.** SUPPORT AP1/CP3/CD3, `requireOn` Byakugan no charge spend, `tenketsu_exposed` 2/30, `nextDrawSkillBonuses` +2 on Hyuga ATTACK ids. OFF reject / ON 0 dmg. Mute ACC +30% dropped. Tenketsu pen 0.3 consume on next Hyuga ATTACK hit.

**ARCHITECTURE: PASS.** RING-GUARD: constants + ResolveSkill + tests + sim. Reuses T-039 requireOn + T-016 skillId bag + studied pen helper. OOS skills untouched.

**QUALITY:** NIT — SkillTag.DOJUTSU/PRECISION unavailable. Weight lock is skillId list (Hyuga ATTACKs lack HYUGA tag). Pen consume not in AC tests.

**VERDICT: APPROVE**
