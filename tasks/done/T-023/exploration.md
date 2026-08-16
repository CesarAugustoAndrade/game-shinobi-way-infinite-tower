# T-023 · exploration

**Ring:** R0 SIDE tools — mark plant, next-card % from attempt marks, skill band move. No new port.

## Relevant files

- `skillsCombatV1New.ts` — Wire/Blastback have `markEffects` (ATTEMPT). Backstep has no move field. None declare PULL/PUSH.
- `ResolveSkillSystem.ts` — `applySupportMarks` only on SUPPORT. Movement only if `intent.movement`. Damage has Mode bonus, no mark-id %.
- `RangeSystem.ts` — `resolveForcedMove` PUSH/PULL, never flips `playerMoveUsedThisTurn`. SELF_RETREAT = same band shift as PUSH.
- `types.ts` — no `bandMove` on Skill.

## Premises

- Plant SIDE `markEffects` after attempt-consume so the same card does not eat its own Off-Balance.
- Read +20%/+15% from `consumeOnAttempt.spent` (present before consume).
- Exposed only if `AttackMethod.RANGED`.
- Default path: `skill.bandMove` without caller `intent.movement`.

## Surprises

- ATTACK never plants `markEffects` today (T-022 removed Twin Lion self-CP).
- Live `useSkill` still not on this path (out of scope).
