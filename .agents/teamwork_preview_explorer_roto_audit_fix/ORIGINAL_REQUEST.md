## 2026-07-22T14:02:14Z
You are Explorer for Roto Audit Fix in Shinobi Way Region 1 Polish.
Working directory: C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\.agents\teamwork_preview_explorer_roto_audit_fix

FORENSIC AUDITOR FULL EVIDENCE REPORT FOR REMEDIATION:
=== BEGIN AUDIT REPORT ===
# Forensic Audit Report — Region 1 Polish (Roto Batch: TASK-R01 to TASK-R13)

**Work Product**: Region 1 Polish batch implementation (TASK-R01 to TASK-R13)
**Verdict**: INTEGRITY VIOLATION

## 1. Observation
### Audited Target Files & Assets
- `public/assets/` — Verified 14 `location_*.png` biome background assets, `naruto_kyubi_main_menu.png`, `character_select_background.png`, `translucent_begin_journey.png`.
- `src/game/constants/events/wavesArcEvents.ts` — Verified 7 new story events and flag `drowned_shrine_discovered: 1`.
- `src/game/systems/RegionSystem.ts` — Line 1089: `Math.min(100, Math.round((region.locationsCompleted / region.totalLocations) * 100))`.
- `src/components/exploration/RegionMap.tsx` — Line 75: `Math.min(100, Math.round((region.locationsCompleted / region.totalLocations) * 100))`.
- `src/components/modals/LocationCompleteModal.tsx` — Line 56: `Math.min(100, Math.round((result.regionCompleted / result.regionTotal) * 100))`.
- `src/hooks/useActivityHandlers.ts` — Line 684: `combatConfig.floor !== undefined && combatConfig.floor !== null`; line 703: `const combatDifficulty = baseDiff + (combatConfig.difficulty || 0);`.
- `src/game/systems/PlayerTurnSystem.ts` — Lines 589-592: `statMult = Math.max(1, (intStat + spiritStat) / 20); healAmount = Math.floor(baseHeal * statMult);`.
- `src/game/constants/index.ts` — Line 293: Danger 4 boss `Zabuza, Demon of the Mist` assigned `SKILLS.WATER_DRAGON`.
- `src/game/systems/EnemySystem.ts` — Lines 336-338: `if (bossData.name.includes('Zabuza')) { bossSkills.push(cloneSkill(SKILLS.DEMON_SLASH)); }`.
- `src/components/layout/CinematicViewscreen.tsx` — Added hero sprite layer rendering.
- `src/components/layout/CinematicViewscreen.css` — Line 153: `.cinematic__scanlines` `z-index: 25`; Line 175: `.cinematic__crt-frame` `z-index: 26`.
- `src/scenes/combat/Combat.tsx` & `Combat.css` — Stunned player banner `.combat-stunned-banner` and explicit pass turn CTA button.

### Build & Test Suite Verification Outputs
1. TypeScript Compilation (`npx tsc --noEmit`): Exit Code 0 (Clean).
2. Vitest Test Suite Execution (`npm test`):
   Exit Code: 1
   Summary: Test Files 1 failed | 24 passed (25)
   FAIL src/game/systems/__tests__/RotoEmpiricalStress.test.ts
   Error: Cannot find module '../../game/constants' imported from 'C:/Users/PC/workspace/SHINOBI-WAY-the-inifinite-tower/src/game/systems/__tests__/RotoEmpiricalStress.test.ts'
    > src/game/systems/__tests__/RotoEmpiricalStress.test.ts:32:1
        30| } from './testFixtures';
        31| import type { CombatState } from '../combat-types';
        32| import { REGIONS } from '../../game/constants';
          | ^
=== END AUDIT REPORT ===

Your task:
1. Analyze the exact failure reported by the Forensic Auditor in `src/game/systems/__tests__/RotoEmpiricalStress.test.ts:32`.
2. Inspect the import paths in `src/game/systems/__tests__/RotoEmpiricalStress.test.ts` and verify how `REGIONS` is exported from `src/game/constants/index.ts` or `src/constants/index.ts`.
3. Provide a clear, exact fix strategy for the Worker to fix line 32 of `RotoEmpiricalStress.test.ts` (changing `../../game/constants` to `../../constants`).
4. Write your analysis to `analysis.md` and handoff summary to `handoff.md` in your working directory. Send a message to parent when done.
