# T-064 research

Internal pattern reuse only. Three shield options:

1. **Author-only markEffects (recommended).** SUPPORT already plants self SHIELD via `applySkillMarkEffects`. Reauthor `mud_wall`: SUPPORT AP1/CP4/CD4, `stanceShift: DEFENSIVE`, `mud_wall_shield` stacks 35 duration 99 family SHIELD `targetActor: 'self'`. Remove `effects[]` SHIELD 40×3. No ResolveSkillSystem edit.

2. **Mirror into `playerBuffs` SHIELD 35** so live CombatCalculation absorb works. Spec says optional; AC does not require. Skip — would invent a second identity.

3. **Apply `stanceShift` inside resolve.** Live path already uses `stanceShiftFromSkill`. Pure resolve has no posture field required by AC. Skip.

**Recommendation:** option 1. AC2: plant stacks 35, dmg 0. AC3: AP 6→5, CP 20→16, `readyOnTurn === 7` at `turnIndex` 2 / CD 4.
