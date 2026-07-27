## 2026-07-22T13:55:27Z
You are Worker Roto Assets & Data for Shinobi Way Region 1 Polish.
Working directory: C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\.agents\teamwork_preview_worker_roto_assets_data

Your task:
Fix TASK-R01, TASK-R02, TASK-R03, TASK-R04, TASK-R05 in region1-polish-backlog.md:

1. TASK-R01, TASK-R02, TASK-R03 (Asset Paths & Missing Images):
   - Copy/ensure all 13 biome images (`location_*.png`), 2 menu key art backgrounds (`naruto_kyubi_main_menu.png`, `character_select_background.png`), and `translucent_begin_journey.png` are present in `public/assets/`. (Source files exist in root `assets/` or `assets/assets_backup/`).
   - Check and verify path references in `src/App.tsx`, `src/components/exploration/LocationCardDisplay.tsx`, `src/scenes/menu/MainMenu.css`, `src/scenes/menu/CharacterSelect.css`, `src/scenes/menu/CharacterSelect.tsx`.

2. TASK-R04 (Unlinked Story Events):
   - In `src/game/constants/events/wavesArcEvents.ts`, add event definitions for the 7 story event IDs referenced in `landOfWaves.ts`: `meet_tazuna`, `protect_village`, `meet_inari`, `protect_bridge`, `final_showdown_setup`, `final_confrontation`, `gato_defeat`.
   - Ensure each event is properly formed as a `GameEvent` with choices, outcomes, and log messages matching the Land of Waves story.

3. TASK-R05 (Orphan Secret Flag):
   - In `wavesArcEvents.ts` (e.g. in `coastal_mist_investigation` or `meet_tazuna`), add `setFlags: { drowned_shrine_discovered: 1 }` to an outcome so the `DROWNED_SHRINE` secret location can unlock via intel gating.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Verification:
- Run `npx tsc --noEmit` and `npm test` using run_command to ensure the TypeScript build passes with zero errors and all unit tests pass cleanly.
- Document exact file changes, test command output, and verification results in handoff.md in your working directory.
- Send a message to parent when done.
