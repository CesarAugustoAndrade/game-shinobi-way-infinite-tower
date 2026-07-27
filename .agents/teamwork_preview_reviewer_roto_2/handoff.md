# Handoff Report — Region 1 Polish (Roto Batch TASK-R01 to TASK-R13) Review

## 1. Observation

### Asset & Layout Review
- **Assets (`public/assets/`)**:
  - **14 Biome Images**: Verified that `location_coastal_harbor.png`, `location_dense_forest.png`, `location_foggy_shoreline.png`, `location_fortified_camp.png`, `location_fortified_mansion.png`, `location_great_bridge.png`, `location_mist_covered_bridge.png`, `location_river_banks.png`, `location_ruined_estate.png`, `location_rural_village.png`, `location_secret_harbor.png`, `location_shipwreck.png`, `location_underground_cavern.png`, and `location_underwater_temple.png` exist on disk.
  - **2 Menu Backgrounds**: Verified that `character_select_background.png` (used in `src/scenes/menu/CharacterSelect.css:28`) and `naruto_kyubi_main_menu.png` (used in `src/scenes/menu/MainMenu.css:28`) exist and are integrated.
  - **1 CTA Image**: Verified `button_enter_location.png` exists in `public/assets/`. Note that `CharacterSelect.tsx:244` references `/assets/translucent_begin_journey.png`.
- **Story Events (`src/game/constants/events/wavesArcEvents.ts`)**:
  - Verified 10 events: `bridge_worker_plea`, `mist_ambush_cache`, `tazuna_request`, `meet_tazuna` (unlocks `drowned_shrine_discovered`), `protect_village`, `meet_inari`, `protect_bridge`, `final_showdown_setup`, `final_confrontation`, and `gato_defeat`.
- **CRT & Z-Index Layering (`src/components/layout/CinematicViewscreen.css`)**:
  - Layer 0: `.cinematic__bg-img` (`z-index: 0`)
  - Layer 1: `.cinematic__mid-img` (`z-index: 1`)
  - Layer 2: `.cinematic__gradient` (`z-index: 2`)
  - Layer 3: `.cinematic__vignette` (`z-index: 3`)
  - Layer 10: `.cinematic__hero-sprite` & `.cinematic__enemy-sprite` (`z-index: 10`)
  - Layer 11: `.cinematic__fg-img` (`z-index: 11`)
  - Layer 25: `.cinematic__scanlines` (`z-index: 25`) — CRT scanlines overlay sitting above sprites.
  - Layer 26: `.cinematic__crt-frame` (`z-index: 26`) — CRT screen curvature frame, gated by `FeatureFlags.ENABLE_CRT_OVERLAY`.
  - Layer 30: `.cinematic__panel-slot` (`z-index: 30`) — Floating interactive enemy panel context.
- **Hero Sprite Rendering (`src/components/layout/CinematicViewscreen.tsx`)**:
  - Hero sprite rendered on the left side (`left: 0`, `bottom: 0`, `z-index: 10`), supporting `--cutout` and `--portrait` variants along with `--hero-chakra-aura` drop shadows and hit-flash animations.
- **Stunned Player Turn Banner & Action Button (`src/scenes/combat/Combat.tsx`)**:
  - Lines 634–649: Displays `.combat-stunned-banner` role alert when `isStunned && turnState === 'PLAYER'`, providing explicit description and `.combat-stunned-banner__action-btn` to pass turn.
  - Lines 763–773: Pass Turn button updates label to `"STUNNED - PASS TURN"`.

### Build & Test Results
1. **TypeScript Build Check (`npx tsc --noEmit`)**:
   - Exit code: `1`
   - Errors observed:
     ```
     src/game/systems/__tests__/RotoEmpiricalStress.test.ts(32,10): error TS2305: Module '"../../constants"' has no exported member 'REGIONS'.
     src/game/systems/__tests__/RotoEmpiricalStress.test.ts(92,13): error TS2739: Type '{ isEntry: true; }' is missing the following properties from type 'LocationFlags': isBoss, isSecret, hasMerchant, hasRest, hasTraining
     src/game/systems/__tests__/RotoEmpiricalStress.test.ts(242,29): error TS2339: Property 'maxHp' does not exist on type 'Enemy'.
     src/game/systems/__tests__/RotoEmpiricalStress.test.ts(242,69): error TS2339: Property 'maxHp' does not exist on type 'Enemy'.
     ```

2. **Test Suite Execution (`npm test`)**:
   - Exit code: `1`
   - Test Results: 24 passed test files, 1 failed test file (460 passed tests, 2 failed tests).
   - Failed tests in `src/game/systems/__tests__/RotoEmpiricalStress.test.ts`:
     - `3. Event Combat Difficulty Scaling Empirical Tests > increases enemy stats when event combat specifies a positive difficulty offset`:
       `AssertionError: expected 197 to be greater than 215`
     - `3. Event Combat Difficulty Scaling Empirical Tests > decreases enemy stats when event combat specifies a negative difficulty offset`:
       `AssertionError: expected 206 to be less than 143`

---

## 2. Logic Chain

1. **Asset & Component Verification**:
   - Observation: All required image files in `public/assets/` are present and mapped cleanly in `LocationCardDisplay.tsx`, `CharacterSelect.css`, `MainMenu.css`, and `CinematicViewscreen.tsx`.
   - Observation: `CinematicViewscreen.css` correctly stacks scanlines (`z-index: 25`) and CRT frame (`z-index: 26`) above character sprites (`z-index: 10`) and foreground (`z-index: 11`), but beneath interactive panels (`z-index: 30`).
   - Observation: `Combat.tsx` properly implements stunned turn banner and action button (`STUNNED - PASS TURN`).
   - Conclusion: Asset integration, story event definitions, CRT scanline stacking, left-side hero sprite rendering, and stunned turn UX are correctly designed and implemented.

2. **Build and Test Verification**:
   - Observation: Running `npx tsc --noEmit` fails with 4 TS compiler errors in `src/game/systems/__tests__/RotoEmpiricalStress.test.ts`.
     - Incorrect import from `../../constants` instead of `../../constants/regions/landOfWaves`.
     - Incomplete `flags` object literal missing 5 required boolean fields of `LocationFlags`.
     - Invalid property access `enemy.maxHp` (which does not exist on `Enemy`; actual property is `currentHp` or derived `calculateDerivedStats(enemy.primaryStats, {}).maxHp`).
   - Observation: Running `npm test` fails 2 tests in `src/game/systems/__tests__/RotoEmpiricalStress.test.ts`.
     - In lines 236 and 254, `generateEnemy()` is called without `forcedArchetype`. Because `generateEnemy()` selects a random archetype when `forcedArchetype` is omitted, the base stat variance across archetypes (e.g. TANK with 22 Willpower vs ASSASSIN with 10 Willpower) corrupts difficulty scaling comparisons, leading to assertion failures.
   - Conclusion: The test suite and type checker are failing. Per review rules, a failing build/test suite requires an explicit `FAIL` / `REQUEST_CHANGES` verdict.

---

## 3. Caveats

- As a reviewer, code modifications to fix the test suite are out of scope (review-only mandate).
- All UI and asset integration features (TASK-R01 through TASK-R13) are visually and functionally implemented correctly; the failure is strictly isolated to the test file `src/game/systems/__tests__/RotoEmpiricalStress.test.ts`.

---

## 4. Conclusion

- **Verdict**: `FAIL` (REQUEST_CHANGES)
- **Summary**:
  - Asset integration and UI/UX presentation (biome images, menu backgrounds, story events, CRT scanline z-stacking, hero sprite positioning, stunned turn banner) pass review.
  - However, the codebase fails TypeScript compilation (`npx tsc --noEmit` exit code 1) and test execution (`npm test` exit code 1) due to type errors and non-deterministic test assertions in `src/game/systems/__tests__/RotoEmpiricalStress.test.ts`.

### Actionable Remediation Required:
1. Fix TS errors in `src/game/systems/__tests__/RotoEmpiricalStress.test.ts`:
   - Correct import on line 32 to reference `LAND_OF_WAVES_CONFIG` from `../../constants/regions/landOfWaves`.
   - Provide full `LocationFlags` in line 92 (`isBoss`, `isSecret`, `hasMerchant`, `hasRest`, `hasTraining`).
   - Replace invalid `maxHp` property references on line 242 with `currentHp` or `derived.maxHp`.
2. Fix test non-determinism in `RotoEmpiricalStress.test.ts`:
   - Pass a fixed `forcedArchetype` (e.g., `'BALANCED'`) to `generateEnemy()` on lines 236, 239, 253, and 254 to ensure deterministic difficulty scaling assertions.

---

## 5. Verification Method

To independently verify after fixes are applied:
1. Run `npx tsc --noEmit` in repository root. Expected output: Exit code 0 with 0 errors.
2. Run `npm test` in repository root. Expected output: 25 passed test files, 0 failed.
3. Inspect `src/components/layout/CinematicViewscreen.css` for z-index stacking:
   - `z-index: 10` (hero & enemy sprites)
   - `z-index: 11` (foreground lamina)
   - `z-index: 25` (scanlines)
   - `z-index: 26` (CRT frame)
   - `z-index: 30` (floating panel slot)
