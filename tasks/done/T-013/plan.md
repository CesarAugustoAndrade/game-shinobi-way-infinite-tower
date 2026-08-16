# T-013 · plan

**Ring:** R0 (+ R1 feed) · **auto-approved**

Optional `Player.skillConfig` + `SkillConfigLive` adapters around T-001 helpers. `createPlayer` / combat start bootstrap via `ensureMainAttack`. `processUpkeep` passes `mainAttackId` and player priority. Combat-state mutations no-op. Tests `t013SkillConfigLive` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 ensure main | SkillConfigLive + createPlayer |
| AC2 learn/forget | SkillConfigLive + grantSkill |
| AC3 draw feed + lock | processUpkeep + rewriteSkillConfig |
