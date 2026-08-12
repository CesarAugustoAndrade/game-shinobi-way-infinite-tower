# Diagnostic Analysis: Test Suite & TypeScript Compilation

**Date**: 2026-07-23  
**Target Repository**: `C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower`  
**Working Directory**: `C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\.agents\explorer_diag_test_tsc`

---

## 1. Executive Summary

| Diagnostic Pass | Status | Details |
|---|---|---|
| **npm test (Vitest v4.0.15)** | **FAILED** | 26 Test Files (25 Passed, 1 Failed), 473 Tests (472 Passed, 1 Failed) |
| **npx tsc --noEmit** | **PASSED** | Exit Code 0 — 0 TypeScript compilation errors |

---

## 2. Test Suite Failure Details

### Failing Test Suite
`src/game/systems/__tests__/RotoChallenger2Empirical.test.ts`

### Failing Test Case
`Roto Batch Empirical Stress Tests - Challenger 2 (TASK-R01 to TASK-R13) > 4. CRT Overlay z-index Stacking in CinematicViewscreen.css > CinematicViewscreen.css defines correct z-index hierarchy for CRT and stage elements`

### Verbatim Error Log
```
FAIL  src/game/systems/__tests__/RotoChallenger2Empirical.test.ts > Roto Batch Empirical Stress Tests - Challenger 2 (TASK-R01 to TASK-R13) > 4. CRT Overlay z-index Stacking in CinematicViewscreen.css > CinematicViewscreen.css defines correct z-index hierarchy for CRT and stage elements
AssertionError: expected 1 to be 10 // Object.is equality

- Expected
+ Received

- 10
+ 1

 ❯ src/game/systems/__tests__/RotoChallenger2Empirical.test.ts:269:22
    267|       expect(gradientZ).toBe(2);
    268|       expect(vignetteZ).toBe(3);
    269|       expect(enemyZ).toBe(10);
       |                      ^
    270|       expect(fgZ).toBe(11);
```

---

## 3. Deep Root Cause Analysis

### Code Inspection

1. **Test File**: `src/game/systems/__tests__/RotoChallenger2Empirical.test.ts`
   - **Line 246–251**: Defines helper function `getZIndex`:
     ```ts
     const getZIndex = (selector: string): number => {
       const regex = new RegExp(`\\.${selector}\\s*\\{[^}]*z-index:\\s*(\\d+);`, 's');
       const match = cssContent.match(regex);
       if (!match) throw new Error(`Could not find z-index for .${selector}`);
       return parseInt(match[1], 10);
     };
     ```
   - **Line 258**: Queries selector `cinematic__enemy-sprite`:
     ```ts
     const enemyZ = getZIndex('cinematic__enemy-sprite');
     ```
   - **Line 269**: Asserts layer value:
     ```ts
     expect(enemyZ).toBe(10);
     ```

2. **CSS File**: `src/components/layout/CinematicViewscreen.css`
   - **Lines 10–12** (Header Documentation):
     ```css
     *   4  .cinematic__mist-floor  Ground mist (grounds the sole vertical)
     *  10  .cinematic__enemy-stage Enemy stage subject only (portrait OR cutout; no player hero)
     *  11  .cinematic__fg-img      Lámina 3: foreground (optional, faster parallax, occludes sprites)
     ```
   - **Lines 254–266** (Stage Container CSS Rule):
     ```css
     .cinematic__enemy-stage {
       position: absolute;
       bottom: 4%;
       right: 6%;
       left: auto;
       z-index: 10;
       width: clamp(280px, 58%, 520px);
       height: 88%;
       display: flex;
       align-items: flex-end;
       justify-content: center;
       pointer-events: none;
     }
     ```
   - **Lines 329–342** (Enemy Sprite Child CSS Rule):
     ```css
     .cinematic__enemy-sprite {
       position: relative;
       z-index: 1;
       width: 100%;
       height: 100%;
       ...
     }
     ```

### Diagnosis
The test `RotoChallenger2Empirical.test.ts` intends to verify that the enemy stage element sits at layer level 10 in `CinematicViewscreen.css`.
However, the test calls `getZIndex('cinematic__enemy-sprite')` instead of `getZIndex('cinematic__enemy-stage')`.
- `.cinematic__enemy-stage` is the parent container holding layer `z-index: 10;`.
- `.cinematic__enemy-sprite` is a child element inside `.cinematic__enemy-stage` with local relative `z-index: 1;` (positioning it above `.cinematic__enemy-shadow` which has `z-index: 0;`).
- The regex in `getZIndex` matched `.cinematic__enemy-sprite` line 331 in `CinematicViewscreen.css`, returning `1`, which caused `expect(1).toBe(10)` to fail.

---

## 4. TypeScript Compilation Analysis (`npx tsc --noEmit`)

Command: `npx tsc --noEmit`  
Exit Code: `0`  
Output: (Empty - zero errors)

The entire codebase compiles cleanly with zero type errors.

---

## 5. Recommended Actionable Fix

Modify `src/game/systems/__tests__/RotoChallenger2Empirical.test.ts` at line 258:

```diff
- const enemyZ = getZIndex('cinematic__enemy-sprite');
+ const enemyZ = getZIndex('cinematic__enemy-stage');
```

This aligns the test selector with the CSS container (`.cinematic__enemy-stage`) which defines layer 10 of the z-index stacking hierarchy.
