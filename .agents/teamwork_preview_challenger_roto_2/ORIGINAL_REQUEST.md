## 2026-07-22T14:00:51Z
You are Challenger 2 for Region 1 Polish (Roto Batch: TASK-R01 to TASK-R13).
Working directory: C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\.agents\teamwork_preview_challenger_roto_2

Your task:
1. Empirically stress-test event and combat state fixes for Roto tasks:
   - Event picking logic for all 7 story events in wavesArcEvents.ts (`meet_tazuna`, `protect_village`, `meet_inari`, `protect_bridge`, `final_showdown_setup`, `final_confrontation`, `gato_defeat`)
   - `drowned_shrine_discovered` flag outcome unlocking DROWNED_SHRINE
   - Stunned player state handling and pass turn action button in Combat.tsx
   - CRT overlay z-index stacking in CinematicViewscreen.css
2. Run test suite using run_command: `npm test`.
3. Write handoff.md with empirical test results and an explicit verdict (`PASS` / `FAIL`). Send a message to parent when done.
