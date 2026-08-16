# T-013 · exploration

**Ring:** R0 Player + CardContract helpers; R1 persist/feed.

- `SkillConfig` + `ensureMainAttack` / `withAddedSkill` exist. `Player` has no `skillConfig`.
- `processUpkeep` draw context omits `mainAttackId`. T-012 already reads `combatState.modeUpkeepPriority` with fallback to active ids.
- `createPlayer` (`entities/Player.ts`) is the new-run factory. `createMockPlayer` is the fixture.
- Learn path: `eventEffectHandlers.applyGrantSkill` appends skills without `withAddedSkill`.
