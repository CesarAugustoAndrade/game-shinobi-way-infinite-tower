# BRIEFING — 2026-07-22T15:58:20Z

## Mission
Fix TASK-R09, TASK-R10, TASK-R12 in Region 1 Polish: hero sprite rendering on combat stage, CRT scanlines and frame layering, and stunned player turn banner & action button.

## 🔒 My Identity
- Archetype: implementer / qa / specialist
- Roles: implementer, qa, specialist
- Working directory: C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\.agents\teamwork_preview_worker_roto_combat_stage
- Original parent: d77054aa-b77a-4e05-95f4-4310a1e426d9
- Milestone: Region 1 Polish

## 🔒 Key Constraints
- CODE_ONLY network mode: no external HTTP/downloads.
- Minimal change principle.
- No hardcoded test results, facade implementations, or cheating. Genuine behavior required.
- Pass `npx tsc --noEmit` and `npm test`.

## Current Parent
- Conversation ID: d77054aa-b77a-4e05-95f4-4310a1e426d9
- Updated: 2026-07-22T15:58:20Z

## Task Summary
- **What to build**:
  - TASK-R09: Accept `heroImage`/`heroCutout` props in `CinematicViewscreen.tsx` and render hero sprite on left of stage opposite enemy sprite, handling fallback gracefully. (COMPLETED)
  - TASK-R10: Update `.cinematic__scanlines` and `.cinematic__crt-frame` z-indices to sit above character sprites (`z-index: 25` / `26`) with `pointer-events: none` in `CinematicViewscreen.css`. (COMPLETED)
  - TASK-R12: Present explicit "STUNNED - PASS TURN" banner and action button in `Combat.tsx` when player is stunned. (COMPLETED)
- **Success criteria**: Zero tsc errors, all unit tests pass (450/450 tests passed).

## Key Decisions Made
- Hero sprite rendered on left side of stage with cutout and masked portrait support.
- CRT scanlines (z-25) & frame (z-26) sit above hero/enemy sprites (z-10) with pointer-events: none, panel slot at z-30.
- Stunned state displays explicit banner and pulsating action button for turn passing.

## Artifact Index
- ORIGINAL_REQUEST.md — Initial request details.
- BRIEFING.md — Context briefing index.
- progress.md — Heartbeat and progress tracking.
- handoff.md — Final handoff report with verification details.

## Change Tracker
- **Files modified**:
  - `src/components/layout/CinematicViewscreen.tsx`
  - `src/components/layout/CinematicViewscreen.css`
  - `src/scenes/combat/Combat.tsx`
  - `src/scenes/combat/Combat.css`
  - `src/components/layout/__tests__/CinematicViewscreenProps.test.ts`
  - `src/scenes/combat/__tests__/CombatStunnedState.test.ts`
- **Build status**: PASS (`npx tsc --noEmit` clean, `npm test` 24/24 files passed, 450/450 tests passed)
- **Pending issues**: None

## Quality Status
- **Build/test result**: All passing (0 errors)
- **Lint status**: Clean
- **Tests added/modified**: `CinematicViewscreenProps.test.ts`, `CombatStunnedState.test.ts`

## Loaded Skills
- **Source**: C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\.agents\skills\combat-art\SKILL.md
- **Local copy**: C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\.agents\skills\combat-art\SKILL.md
- **Core methodology**: Combat art direction for 16-bit arcade layering, sprites, auras, CRT overlay.
