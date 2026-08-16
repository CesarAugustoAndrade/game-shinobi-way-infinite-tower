# T-065 research

Internal pattern reuse only. Three options:

1. **Author-only markEffects (recommended).** Mirror T-064 with `brace_shield` stacks 20 duration 1. Remove WIL +0.3. Keep `stanceShift: DEFENSIVE`. No ResolveSkillSystem edit.

2. **Share id `shield` with Mud Wall.** Spec forbids collision; SOUL additive SHIELD instances want distinct ids.

3. **Wire enemy-response consume in resolve.** Catalog “until next enemy response” is duration 1 clock. Full enemy-turn break is out of scope.

**Recommendation:** option 1. AC2: stacks 20 duration 1, dmg 0. AC3: AP 6→5, CP 20→20, `readyOnTurn === 6` at turn 2 / CD 3.
