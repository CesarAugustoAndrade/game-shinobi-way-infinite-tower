# T-145 · research

SOUL §7: CD is `readyOnTurn` vs turn T. §15 kill reset must make skills ready, not only zero `currentCooldown`.

**Options**

1. **turnIndex on SkillPlayContext; SoT when set; currentCooldown fallback when omitted.** Kill reset mirrors `resetCooldownsKeepModesOff` skill half (`readyOnTurn: 0` + `currentCooldown: 0`). Pass `combatState.turnIndex` from useCombat + Combat/App. (recommended)
2. Delete `currentCooldown` — migration L; spec discarded.
3. Change resolve `'not-ready'` to `'cooldown'` — breaks t123 Reaper; not required by AC.

**Recommendation:** option 1. Do not change resolve reject reason. FREE_FIRST still chakra-only.

OOS: Discover picker, deleting currentCooldown, Mode board kill reset UX.
