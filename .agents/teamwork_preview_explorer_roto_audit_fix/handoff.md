# Handoff Report — Roto Audit Fix (RotoEmpiricalStress.test.ts)

**Agent**: Explorer
**Target Milestone**: Region 1 Polish (Roto Batch Audit Remediation)
**Status**: Exploration & Forensic Analysis Complete

---

## 1. Observation

### 1.1 Forensic Audit Error & Module Path Analysis
- **Target File**: `src/game/systems/__tests__/RotoEmpiricalStress.test.ts`
- **Reported Error**:
  ```text
  FAIL src/game/systems/__tests__/RotoEmpiricalStress.test.ts
  Error: Cannot find module '../../game/constants' imported from 'C:/Users/PC/workspace/SHINOBI-WAY-the-inifinite-tower/src/game/systems/__tests__/RotoEmpiricalStress.test.ts'
   > src/game/systems/__tests__/RotoEmpiricalStress.test.ts:32:1
       30| } from './testFixtures';
       31| import type { CombatState } from '../combat-types';
       32| import { REGIONS } from '../../game/constants';
  ```
- **Filesystem Verification**:
  - `src/game/systems/__tests__` -> `../..` = `src/game`.
  - Path `../../game/constants` evaluates to `src/game/game/constants` (non-existent).
  - Path `../../constants` evaluates to `src/game/constants` (exists).
  - Path `../../constants/regions` evaluates to `src/game/constants/regions` (exists).
  - `REGIONS` does not exist as an exported identifier in the codebase.
  - `LAND_OF_WAVES_CONFIG` is exported from `src/game/constants/regions/index.ts`.

### 1.2 Vitest Runtime Failure Observation
Running `npx vitest run src/game/systems/__tests__/RotoEmpiricalStress.test.ts` reproduces 2 failed tests in Area 3:
1. `increases enemy stats when event combat specifies a positive difficulty offset`
   - `AssertionError: expected 197 to be greater than 215` at line 243.
2. `decreases enemy stats when event combat specifies a negative difficulty offset`
   - `AssertionError: expected 152 to be less than 143` at line 256.

- **EnemySystem.ts Code Verification** (Lines 270-280 & 365-373):
  `generateEnemy` signature:
  `generateEnemy(dangerLevel, locationsCleared, type, diff, arcName, forcedArchetype?, enemyPool?, preferredElement?)`
  When `forcedArchetype` is omitted, line 372 executes `archetype = pick(COMBAT_ARCHETYPES) ?? 'BALANCED'`, randomly assigning `TANK` (willpower 22, high HP) or `CASTER`/`ASSASSIN` (willpower 10, lower HP).

---

## 2. Logic Chain

1. **Path Resolution Math**:
   - `src/game/systems/__tests__/` is 3 directories deep from `src/`.
   - A `../..` relative step navigates to `src/game`.
   - Appending `game/constants` creates `src/game/game/constants`, causing module resolution failure.
   - Appending `constants/regions` creates `src/game/constants/regions`, successfully resolving to `src/game/constants/regions/index.ts`.

2. **Import Symbol Resolution**:
   - `REGIONS` was a placeholder name.
   - The actual region export used in region tests is `LAND_OF_WAVES_CONFIG` exported from `../../constants/regions`.

3. **Area 3 Test Non-Determinism**:
   - `generateEnemy` calculates HP from `willpower * totalScaling`.
   - `TANK` base willpower is 22 vs `CASTER` base willpower of 10 (a 2.2x ratio).
   - In Area 3 tests, omitting `forcedArchetype` causes `normalEventEnemy` to randomly pick `TANK` (HP 215) while `hardEventEnemy` randomly picks `CASTER` (HP 197), breaking the difficulty assertion (`197 > 215` fails).
   - Providing `'BALANCED'` as the 6th argument (`forcedArchetype`) eliminates archetype RNG and enforces deterministic comparison of difficulty offsets.

---

## 3. Caveats

- **Read-Only Scope**: Explorer operated under read-only rules; no production or test source files outside `.agents/` were modified during this investigation.
- **Worker Execution Required**: The Worker agent must apply the changes to `src/game/systems/__tests__/RotoEmpiricalStress.test.ts`.

---

## 4. Conclusion

To achieve 100% test pass rate across the Vitest suite, the Worker agent must perform two edits in `src/game/systems/__tests__/RotoEmpiricalStress.test.ts`:
1. Ensure line 32 imports `LAND_OF_WAVES_CONFIG` from `'../../constants/regions'`.
2. Pass `'BALANCED'` as the 6th parameter (`forcedArchetype`) in `generateEnemy()` calls on lines 236, 239, 253, and 254.

---

## 5. Verification Method

To verify the remediation:
1. Run TypeScript check: `npx tsc --noEmit` (Must return Exit Code 0).
2. Run single test suite: `npx vitest run src/game/systems/__tests__/RotoEmpiricalStress.test.ts` (Must return 12 passed, 0 failed).
3. Run full project test suite: `npm test` (Must return 25 passed, 0 failed).
