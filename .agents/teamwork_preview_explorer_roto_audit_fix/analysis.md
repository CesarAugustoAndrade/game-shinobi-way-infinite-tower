# Detailed Technical Analysis — Roto Audit Fix: RotoEmpiricalStress.test.ts

**Target File**: `src/game/systems/__tests__/RotoEmpiricalStress.test.ts`
**Objective**: Analyze test failure in forensic audit report, inspect import and export paths, and provide a clear, bulletproof fix strategy for the Worker.

---

## 1. Import Path Failure Analysis (`RotoEmpiricalStress.test.ts:32`)

### 1.1 Observation & Error Signature
The Forensic Audit report noted the following Vitest execution failure:
```text
FAIL src/game/systems/__tests__/RotoEmpiricalStress.test.ts
Error: Cannot find module '../../game/constants' imported from 'C:/Users/PC/workspace/SHINOBI-WAY-the-inifinite-tower/src/game/systems/__tests__/RotoEmpiricalStress.test.ts'
 > src/game/systems/__tests__/RotoEmpiricalStress.test.ts:32:1
     30| } from './testFixtures';
     31| import type { CombatState } from '../combat-types';
     32| import { REGIONS } from '../../game/constants';
```

### 1.2 Directory Depth & Path Resolution Math
- **Test File Location**: `src/game/systems/__tests__/RotoEmpiricalStress.test.ts`
- **Current Working Directory of File**: `src/game/systems/__tests__` (depth: 3 relative to `src/`)
- **Relative Path Resolution**:
  - `.` -> `src/game/systems/__tests__`
  - `..` -> `src/game/systems`
  - `../..` -> `src/game`
- **The Bug**:
  - Importing from `'../../game/constants'` evaluates to: `src/game` + `/game/constants` = `src/game/game/constants`.
  - Directory `src/game/game/constants` does not exist in the filesystem.
- **Correct Paths**:
  - Importing from `'../../constants'` evaluates to: `src/game` + `/constants` = `src/game/constants`.
  - Importing from `'../../constants/regions'` evaluates to: `src/game` + `/constants/regions` = `src/game/constants/regions`.

### 1.3 Export Symbol Analysis (`REGIONS` vs `LAND_OF_WAVES_CONFIG`)
- A project-wide codebase search for `REGIONS` in `src/` yielded 0 export definitions.
- The region configurations are stored under `src/game/constants/regions/` and exported via `src/game/constants/regions/index.ts`:
  - `LAND_OF_WAVES_CONFIG` from `./landOfWaves`
  - `CHUNIN_EXAMS_CONFIG` from `./chuninExams`
  - `SASUKE_RETRIEVAL_CONFIG` from `./sasukeRetrieval`
  - `GREAT_NINJA_WAR_CONFIG` from `./greatNinjaWar`
- Importing `LAND_OF_WAVES_CONFIG` from `'../../constants/regions'` correctly resolves to `src/game/constants/regions/index.ts` and imports the Land of Waves region data.

---

## 2. Test Execution Failure Analysis (Area 3 Empirical Stress Tests)

### 2.1 Empirical Vitest Execution Output
When running `npx vitest run src/game/systems/__tests__/RotoEmpiricalStress.test.ts`, TypeScript compilation succeeds, but 2 out of 12 tests fail:

```text
 FAIL  src/game/systems/__tests__/RotoEmpiricalStress.test.ts > Roto Batch Empirical Stress Tests > 3. Event Combat Difficulty Scaling Empirical Tests > increases enemy stats when event combat specifies a positive difficulty offset
AssertionError: expected 197 to be greater than 215
 ❯ src/game/systems/__tests__/RotoEmpiricalStress.test.ts:243:40
    243|       expect(hardEventEnemy.currentHp).toBeGreaterThan(normalEventEnemy.currentHp);

 FAIL  src/game/systems/__tests__/RotoEmpiricalStress.test.ts > Roto Batch Empirical Stress Tests > 3. Event Combat Difficulty Scaling Empirical Tests > decreases enemy stats when event combat specifies a negative difficulty offset
AssertionError: expected 152 to be less than 143
 ❯ src/game/systems/__tests__/RotoEmpiricalStress.test.ts:256:40
    256|       expect(easyEventEnemy.currentHp).toBeLessThan(standardEnemy.currentHp);
```

### 2.2 Root Cause Analysis of Area 3 Test Failures
1. **Enemy Archetype Randomness**:
   In `src/game/systems/EnemySystem.ts`:
   ```typescript
   export const generateEnemy = (
     dangerLevel: number,
     locationsCleared: number,
     type: 'NORMAL' | 'ELITE' | 'BOSS' | 'AMBUSH',
     diff: number,
     arcName: string,
     forcedArchetype?: EnemyArchetype,
     enemyPool?: string[],
     preferredElement?: ElementType,
   ): Enemy => {
     ...
     let archetype: EnemyArchetype = 'BALANCED';
     if (forcedArchetype && isEnemyArchetype(forcedArchetype)) {
       archetype = forcedArchetype;
     ...
     } else {
       archetype = pick(COMBAT_ARCHETYPES) ?? 'BALANCED';
     }
   ```
2. **Stat Variance Across Archetypes**:
   - `TANK` archetype: Base Willpower = 22 (high base HP).
   - `CASTER` / `ASSASSIN` archetypes: Base Willpower = 10 (low base HP).
3. **Test Flaw**:
   Lines 236 & 239 of `RotoEmpiricalStress.test.ts` call `generateEnemy()` without the 6th parameter `forcedArchetype`.
   - `normalEventEnemy` randomly picks `TANK` (Willpower 22) -> `currentHp` = 215.
   - `hardEventEnemy` randomly picks `CASTER` (Willpower 10) -> `currentHp` = 197.
   Because random archetype picking causes HP base variance higher than the +30 difficulty modifier, the assertion `hardEventEnemy.currentHp > normalEventEnemy.currentHp` randomly fails!

---

## 3. Worker Fix Strategy

### 3.1 Code Changes in `src/game/systems/__tests__/RotoEmpiricalStress.test.ts`

#### Step 1: Ensure Correct Import on Line 32
Replace any stale import (`import { REGIONS } from '../../game/constants'`) with:
```typescript
import { LAND_OF_WAVES_CONFIG } from '../../constants/regions';
```
*(Note: `../../constants/regions` relative to `src/game/systems/__tests__/` resolves to `src/game/constants/regions`)*

#### Step 2: Fix Area 3 Test Calls to Supply `forcedArchetype`
In `describe('3. Event Combat Difficulty Scaling Empirical Tests', ...)`:

1. Update lines 236–239:
```typescript
// Standard enemy generated at base difficulty (50)
const normalEventEnemy = generateEnemy(dangerLevel, locationsCleared, 'NORMAL', baseDiff, arc, 'BALANCED');

// Event enemy generated with +30 difficulty offset (80)
const hardEventEnemy = generateEnemy(dangerLevel, locationsCleared, 'NORMAL', baseDiff + 30, arc, 'BALANCED');
```

2. Update lines 253–254:
```typescript
const standardEnemy = generateEnemy(dangerLevel, locationsCleared, 'NORMAL', baseDiff, arc, 'BALANCED');
const easyEventEnemy = generateEnemy(dangerLevel, locationsCleared, 'NORMAL', baseDiff - 20, arc, 'BALANCED');
```

---

## 4. Verification Method

### 4.1 Execution Commands
1. **Type Checking**:
   `npx tsc --noEmit`
   *Expected Outcome*: Exit Code 0 (Clean).

2. **Empirical Stress Test Suite**:
   `npx vitest run src/game/systems/__tests__/RotoEmpiricalStress.test.ts`
   *Expected Outcome*: Exit Code 0 (12 passed, 0 failed).

3. **Full Test Suite**:
   `npm test`
   *Expected Outcome*: Exit Code 0 (25 passed, 0 failed).
