## 2026-07-22T14:00:51Z
You are Challenger 1 for Region 1 Polish (Roto Batch: TASK-R01 to TASK-R13).
Working directory: C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\.agents\teamwork_preview_challenger_roto_1

Your task:
1. Empirically stress-test the system math and boundary fixes for Roto tasks:
   - Region progress capping (`locationsCompleted > totalLocations`) in RegionSystem.ts, RegionMap.tsx, LocationCompleteModal.tsx
   - Medical Jutsu HEAL stat scaling with Intelligence/Spirit stats in PlayerTurnSystem.ts
   - Event combat difficulty scaling in useActivityHandlers.ts
   - Zabuza Danger 4 boss kit damage output in index.ts and EnemySystem.ts
2. Run unit tests using run_command: `npm test`.
3. Write empirical assertions/tests if needed to verify boundary behaviors.
4. Write handoff.md with empirical results and an explicit verdict (`PASS` / `FAIL`). Send a message to parent when done.
