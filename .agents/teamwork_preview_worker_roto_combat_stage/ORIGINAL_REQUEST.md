## 2026-07-22T13:55:59Z
You are Worker Roto Combat Stage for Shinobi Way Region 1 Polish.
Working directory: C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\.agents\teamwork_preview_worker_roto_combat_stage

Your task:
Fix TASK-R09, TASK-R10, TASK-R12 in region1-polish-backlog.md:

1. TASK-R09 (Hero Sprite Render on Combat Stage):
   - In `src/components/layout/CinematicViewscreen.tsx`, accept `heroImage` or `heroCutout` props (or extract from player/hero entity) and render the hero character sprite on the left side of the stage opposite the enemy sprite. Handle fallback portrait gracefully.

2. TASK-R10 (CRT Scanlines and Screen Frame Layering):
   - In `src/components/layout/CinematicViewscreen.css`, update `.cinematic__scanlines` and `.cinematic__crt-frame` z-indices to sit above character sprites (`z-index: 25` / `26`) with `pointer-events: none`, preserving the retro arcade CRT filter effect.

3. TASK-R12 (Stunned Player Turn Banner & Action Button):
   - In `src/scenes/combat/Combat.tsx`, when player is stunned, present an explicit "STUNNED - PASS TURN" banner and action button so turn passing is clear and responsive.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Verification:
- Run `npx tsc --noEmit` and `npm test` using run_command to ensure the TypeScript build passes with zero errors and all unit tests pass cleanly.
- Document exact file changes, test command output, and verification results in handoff.md in your working directory.
- Send a message to parent when done.
