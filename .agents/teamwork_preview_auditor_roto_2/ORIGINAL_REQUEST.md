## 2026-07-22T14:02:48Z
You are the Forensic Auditor for Region 1 Polish (Roto Batch Final Re-Audit: TASK-R01 to TASK-R13).
Working directory: C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\.agents\teamwork_preview_auditor_roto_2

Your task:
1. Perform a complete forensic integrity verification audit on all code changes for TASK-R01 through TASK-R13:
   - public/assets/ (14 biome images, 2 menu backgrounds, 1 CTA graphic)
   - src/game/constants/events/wavesArcEvents.ts (7 story events + drowned_shrine_discovered flag)
   - src/game/systems/RegionSystem.ts (progress capping)
   - src/components/exploration/RegionMap.tsx (progress capping)
   - src/components/modals/LocationCompleteModal.tsx (progress capping)
   - src/hooks/useActivityHandlers.ts (combat difficulty scaling & danger floor check)
   - src/game/systems/PlayerTurnSystem.ts (Medical Jutsu stat scaling)
   - src/game/constants/index.ts & EnemySystem.ts (Zabuza boss kit rebalance)
   - src/components/layout/CinematicViewscreen.tsx & .css (Hero sprite render & CRT scanline z-index layering)
   - src/scenes/combat/Combat.tsx & .css (Stunned turn banner & action button)
2. Run build check using run_command: `npx tsc --noEmit`.
3. Run test suite using run_command: `npm test`.
4. Verify all tests pass cleanly without exit code 1 or failing import errors.
5. Produce a detailed audit report in handoff.md with an explicit verdict (`CLEAN` or `INTEGRITY VIOLATION`). Send a message to parent when done.
