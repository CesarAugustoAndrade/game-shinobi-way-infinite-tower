# T-013 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- AC1: `bootstrapPlayerSkillConfig` + `ensureMainAttack` assign a loadout ATTACK and set `notified` when Main was empty.
- AC2: `applyLearnSkill` uses `withAddedSkill` (Main unchanged); `applyForgetSkill` re-runs ensure and never keeps a removed id.
- AC3: `buildUpkeepWeightContext` / `processUpkeep` pass `player.skillConfig.mainAttackId`; rewrite/learn refuse in `GameState.COMBAT`.
- New-run `createPlayer` bootstraps empty config. Combat start logs auto-pick. Priority feeds T-012.

## Architecture

- RING-GUARD PASS: `SkillConfigLive` is R0 (types + CardContractSystem only). R1 `useCombat` persists/feeds. No React in R0.
- No second Main algorithm; no DPS inference.

## Quality

- BLOCK: none.
- SHOULD: `skillConfig` is optional (old-save migration) rather than required — allowed by spec notes.
- NIT: academy starters may still have zero `cardRole: ATTACK` so new-run Main can stay null until T-008 ATTACK rows are learned.
