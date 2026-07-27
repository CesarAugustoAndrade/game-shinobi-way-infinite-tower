## 2026-07-22T13:55:44Z
You are Worker Roto Systems for Shinobi Way Region 1 Polish.
Working directory: C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\.agents\teamwork_preview_worker_roto_systems

Your task:
Fix TASK-R06, TASK-R07, TASK-R08, TASK-R11, TASK-R13 in region1-polish-backlog.md:

1. TASK-R06 (Region Progress Overflow):
   - In `src/game/systems/RegionSystem.ts`, `src/components/exploration/RegionMap.tsx`, `src/components/modals/LocationCompleteModal.tsx`, cap progress percentage at 100% (`Math.min(100, Math.round(...))`) so clearing secret locations does not overflow past 100% or break progress bar CSS width.

2. TASK-R07 (Event Combat Difficulty Scaling):
   - In `src/hooks/useActivityHandlers.ts` line 705, scale event combat difficulty relative to base region difficulty rather than overriding base difficulty with absolute low values.

3. TASK-R08 (Event Danger Floor Falsy Check):
   - In `src/hooks/useActivityHandlers.ts` line 683, check `combatConfig.floor !== undefined && combatConfig.floor !== null` instead of falsy `combatConfig.floor ? ...`.

4. TASK-R11 (Medical Jutsu Healing Stat Scaling):
   - In `src/game/systems/PlayerTurnSystem.ts` lines 587–598, scale `HEAL` effect dynamically based on player Intelligence/Spirit stats (or stat multipliers) rather than flat unscaled value.

5. TASK-R13 (Zabuza Boss Skill Kit Rebalance):
   - In `src/game/constants/index.ts` and `src/game/systems/EnemySystem.ts`, rebalance Zabuza's Danger 4 boss kit in `BOSS_BY_ARC['WAVES_ARC']` to ensure he has high-threat damaging jutsu (e.g. Water Dragon / Silent Killing) alongside utility skills.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Verification:
- Run `npx tsc --noEmit` and `npm test` using run_command to ensure the TypeScript build passes with zero errors and all unit tests pass cleanly.
- Document exact file changes, test command output, and verification results in handoff.md in your working directory.
- Send a message to parent when done.
