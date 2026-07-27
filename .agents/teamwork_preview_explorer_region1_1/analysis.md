# Region 1 Polish Analysis — Deep Audit Report

**Working Directory**: `C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\.agents\teamwork_preview_explorer_region1_1`  
**Scope**: Region 1 (Start screen, Character Selection, Onboarding/Tutorial flow, Main Menu, UI/HUD layout, Pixel Arcade styling, CRT overlay, Screen transitions, Audio/Visual asset loading for Region 1).

---

## Executive Summary
This report presents a thorough, read-only audit of Region 1 in *Shinobi Way: The Infinite Tower*. The investigation audited entry screens, character selection, onboarding, exploration HUDs, combat stage rendering, Pixel Arcade CSS design system, CRT overlay implementation, asset resolution pipelines, and sound/fx state.

Key finding: **Critical asset path mismatch** causes all biome backgrounds (`location_*.png`), Main Menu background (`naruto_kyubi_main_menu.png`), Character Select background (`character_select_background.png`), and Clan CTA image (`translucent_begin_journey.png`) to fail with 404 errors because they are stored in root `assets/` instead of `public/assets/`. Additionally, there is a total absence of audio triggers (SFX/BGM) and zero in-run onboarding for first-time Region 1 players.

---

## Priority 1: Roto (Bugs, Crashes, Missing Assets, Broken Fallbacks, Broken Navigation)

### ROTO-01: Asset Path Mismatch — 404 Failure for Menu & Biome Background Images
- **File Paths & Line Numbers**:
  - `src/scenes/menu/MainMenu.css`: line 28 (`url(/assets/naruto_kyubi_main_menu.png)`)
  - `src/scenes/menu/CharacterSelect.css`: line 28 (`url(/assets/character_select_background.png)`)
  - `src/App.tsx`: line 328 (`return '/assets/location_${getBiomeSlug(biome)}.png';`)
  - `src/components/exploration/LocationCardDisplay.tsx`: line 48 (`const artSrc = '/assets/location_${getBiomeSlug(card.location.biome)}.png';`)
- **Severity**: **HIGH (P1)**
- **Category**: Roto / Missing Assets
- **Description**:
  Vite serves static assets at `/assets/` only if the files reside inside the `public/assets/` directory. However, 13 region biome images (e.g. `location_coastal_harbor.png`, `location_foggy_shoreline.png`, `location_dense_forest.png`, `location_underground_cavern.png`, `location_rural_village.png`, `location_river_banks.png`, `location_shipwreck.png`, `location_great_bridge.png`, `location_fortified_camp.png`, `location_ruined_estate.png`, `location_secret_harbor.png`, `location_underwater_temple.png`, `location_fortified_mansion.png`) and menu backgrounds (`naruto_kyubi_main_menu.png`, `character_select_background.png`) reside ONLY in root `assets/` (NOT in `public/assets/`).
- **Impact**:
  - Main Menu and Character Selection display dark blank backgrounds instead of key art.
  - All combat, elite challenge, loot, merchant, training, and interlude scenes fail to load the `combatBackground` image (emitting console 404 errors and triggering image fallback).
  - Every `LocationCardDisplay` on the Region Map triggers `onError={() => setArtError(true)}` for every card.
- **Recommended Fix Strategy**:
  Copy or move the 13 `location_*.png` biome files and the menu background images (`naruto_kyubi_main_menu.png`, `character_select_background.png`) from root `assets/` into `public/assets/`.

---

### ROTO-02: Missing Asset File `translucent_begin_journey.png`
- **File Paths & Line Numbers**:
  - `src/scenes/menu/CharacterSelect.tsx`: line 243 (`src="/assets/translucent_begin_journey.png"`)
- **Severity**: **HIGH (P1)**
- **Category**: Roto / Broken Image Fallback
- **Description**:
  The image `/assets/translucent_begin_journey.png` referenced as the primary button graphic for clan selection on the Character Select card does not exist in `public/assets/` or `assets/`. It only exists inside a backup folder (`assets/assets_backup/translucent_begin_journey.png`).
- **Impact**:
  On every single render of the Character Select screen, all 5 clan card selection buttons fail to load the image (`onError` handler fires on line 249), forcing the UI into text-fallback mode (`clan-card__select--fallback`).
- **Recommended Fix Strategy**:
  Copy `assets/assets_backup/translucent_begin_journey.png` into `public/assets/translucent_begin_journey.png`, or replace the `<img>` reference with a pure Pixel Arcade button component (`button.main-menu__enter` style).

---

### ROTO-03: Event Listener Re-attachment & Memory Churn in MainMenu
- **File Paths & Line Numbers**:
  - `src/scenes/menu/MainMenu.tsx`: lines 24-38
  - `src/App.tsx`: line 1066 (`onEnter={() => { setPendingRunMode('campaign'); setGameState(GameState.CHAR_SELECT); }}`)
- **Severity**: **MEDIUM (P2)**
- **Category**: Roto / Performance & Event Listener Hygiene
- **Description**:
  In `MainMenu.tsx`, `handleKeyDown` includes `onEnter` in its `useCallback` dependency array. In `App.tsx`, `onEnter` is passed as an inline arrow function, which changes identity on every single render of `App`. This causes `handleKeyDown` to invalidate and re-subscribe `window.addEventListener('keydown')` on every single render.
- **Impact**:
  Unnecessary DOM listener teardown/re-binding churn whenever `App` state updates while on the Main Menu.
- **Recommended Fix Strategy**:
  Wrap `onEnter` / `onInfiniteEnter` in `useCallback` in `App.tsx` or use stable refs inside `MainMenu.tsx`.

---

## Priority 2: Confuso (Unclear Onboarding, Missing Feedback, Ambiguous UI)

### CONFUSO-01: Zero In-Run Onboarding / Tutorial for First-Time Region 1 Players
- **File Paths & Line Numbers**:
  - `src/App.tsx`: lines 635-680 (`startGame` bootstrapping `GameState.REGION_MAP`)
  - `src/scenes/menu/GameGuide.tsx`: lines 1-729
- **Severity**: **HIGH (P1)**
- **Category**: Confuso / Missing Onboarding
- **Description**:
  When a player selects a lineage and starts a new run in Region 1 (Land of Waves), they are dropped directly onto `GameState.REGION_MAP` with 3 location cards without any intro banner, tutorial popup, or guided tooltip.
- **Impact**:
  First-time players do not know what Intel (50) represents, how location danger/wealth levels work, how 10-room branching locations function, or how combat AP/Postures work unless they previously read the optional "Shinobi Handbook" from the main menu.
- **Recommended Fix Strategy**:
  Implement a lightweight 1-step Region 1 Onboarding Modal or banner upon first landing on `GameState.REGION_MAP` (e.g. "Welcome to Land of Waves: Gather Intel, choose your route wisely, and manage your Chakra").

---

### CONFUSO-02: Missing Clan Affinity & Clan Passive Details on Character Selection Cards
- **File Paths & Line Numbers**:
  - `src/scenes/menu/CharacterSelect.tsx`: lines 86-255
- **Severity**: **MEDIUM (P2)**
- **Category**: Confuso / Ambiguous UI
- **Description**:
  The Character Selection cards display Body/Mind/Technique letter ranks (S, A, B, C, D) and signature jutsu names, but do NOT explicitly list:
  1. The clan's starting elemental affinity (e.g. Uchiha = Fire, Uzumaki = Water, Yamanaka = Mental, Hyuga = Wind, Lee = Physical).
  2. The clan's signature passive trait mechanics (e.g. Uzumaki Vitality regen vs Uchiha Sharingan crit vs Hyuga Byakugan precision).
- **Impact**:
  Players must hover over the card to see raw stats or guess elemental synergies before choosing their lineage.
- **Recommended Fix Strategy**:
  Add an explicit "Element Affinity" chip and a 1-line "Clan Passive" badge to each card header in `CharacterSelect.tsx`.

---

### CONFUSO-03: Ambiguous "Revisit" Badge Explanation on Region Map Cards
- **File Paths & Line Numbers**:
  - `src/components/exploration/LocationCardDisplay.tsx`: lines 68-72
  - `src/components/exploration/RegionMap.tsx`: lines 173-176
- **Severity**: **LOW (P3)**
- **Category**: Confuso / UI Feedback
- **Description**:
  When a location card is marked as `isRevisit`, the card displays a "Revisit" badge, and the preview footer says `"Revisiting this location (reduced rewards)"`. It does not clarify what is reduced (e.g. -50% Ryo/XP) or why it is a revisit.
- **Recommended Fix Strategy**:
  Update preview text to explicitly state: `"Revisiting completed location (-50% Ryo & Exp)"`.

---

## Priority 3: Feo (Misalignments, Style Clashes, Bad Typography, Rough Transitions)

### FEO-01: Style Clash — Pixel Arcade vs Modern Tailwind Glassmorphism
- **File Paths & Line Numbers**:
  - `src/components/exploration/LocationCard.tsx`: lines 34-48 (`bg-cyan-950/40 border-zinc-700 bg-zinc-900/50`)
  - `src/components/layout/ExplorationHUD.tsx`: lines 43-143 (`rounded-full`, glass backdrop blur)
  - `src/styles/design-system/_variables.css`: lines 245-252 (`--sw-pix-shadow`, `--sw-frame`)
- **Severity**: **MEDIUM (P2)**
- **Category**: Feo / Visual Style Clash
- **Description**:
  Per the project's `pixel-arcade` design system guidelines, chrome containers, windows, cards, and buttons should use blocky borders (`border: 2-3px solid var(--sw-frame)`), 0-4px corner radii, and hard non-blurred shadows (`box-shadow: 4px 4px 0 0 var(--sw-hard)`).
  However, `LocationCard.tsx`, `ExplorationHUD.tsx`, and `PlayerHUD.tsx` still mix rounded-xl glassmorphism cards (`backdrop-blur-md`, `rounded-full` pills) with pixel-arcade elements.
- **Impact**:
  Visual inconsistency between the retro arcade Main Menu / Region Map and the modern glassmorphism exploration HUD / cards.
- **Recommended Fix Strategy**:
  Apply pixel-arcade tokens (`--sw-pix-shadow`, `--sw-frame`, 2px border) to `ExplorationHUD.css` and `LocationCard.tsx`.

---

### FEO-02: Legibility & Font Sizing for Monospaced Pixel Font (VT323)
- **File Paths & Line Numbers**:
  - `src/styles/design-system/_variables.css`: lines 173-199
  - `src/components/character/PlayerHUD.tsx`: lines 75-125
  - `src/components/combat/Hand.tsx`: lines 1-200
- **Severity**: **MEDIUM (P2)**
- **Category**: Feo / Typography
- **Description**:
  `_variables.css` maps `--sw-font-pixel: 'VT323'`. At small font sizes (9px-11px), VT323 appears pixelated, thin, and hard to read on high-DPI screens, especially in stat numbers and card descriptions.
- **Recommended Fix Strategy**:
  Ensure body/stat text using `--sw-font-pixel` has a minimum size of 13px-14px (`--sw-text-xs`), or use `Silkscreen` with 700 weight for headers and crisp monospace fallback for numbers.

---

### FEO-03: Sudden Instant Scene Snap Transitions
- **File Paths & Line Numbers**:
  - `src/App.tsx`: lines 1061-1175 (`setGameState(...)` scene switches)
  - `src/components/layout/SceneBackdrop.tsx`: lines 32-65
- **Severity**: **LOW (P3)**
- **Category**: Feo / Rough Transitions
- **Description**:
  Switching between `MENU` -> `CHAR_SELECT` -> `REGION_MAP` -> `LOCATION_EXPLORE` -> `COMBAT` instantly replaces the DOM subtree with no fade-out/fade-in or curtain wipe.
- **Recommended Fix Strategy**:
  Add a lightweight CSS opacity transition class (`animation: sw-fade-in 0.3s ease-out`) on scene wrapper containers in `App.tsx`.

---

## Priority 4: Fricción (Unresponsive Inputs, Unnecessary Clicks, Sluggish Transitions)

### FRICCION-01: Double-Click Missing on Region Map Location Cards
- **File Paths & Line Numbers**:
  - `src/components/exploration/RegionMap.tsx`: lines 135-143
  - `src/components/exploration/LocationCardDisplay.tsx`: line 62
- **Severity**: **MEDIUM (P2)**
- **Category**: Fricción / Navigation Friction
- **Description**:
  To enter a location on `RegionMap`, the player must click a card to select it, then move the cursor to the bottom and click "Enter Location" (2 separate actions). Double-clicking a location card does not trigger location entry.
- **Impact**:
  Adds unnecessary clicks for experienced players.
- **Recommended Fix Strategy**:
  Add an `onDoubleClick` handler to `LocationCardDisplay` that selects the card and calls `onEnterLocation()`.

---

### FRICCION-02: Missing Escape Key Shortcut for Approach Selector Modal & Character Select
- **File Paths & Line Numbers**:
  - `src/components/combat/ApproachSelector.tsx`: lines 1-100
  - `src/scenes/menu/CharacterSelect.tsx`: lines 43-60
- **Severity**: **MEDIUM (P2)**
- **Category**: Fricción / Unresponsive Inputs
- **Description**:
  - In `ApproachSelector.tsx` (the pre-combat approach modal), pressing `Escape` does NOT cancel/exit the approach screen. The player must manually click the "Exit Room" button at top right.
  - In `CharacterSelect.tsx`, pressing `Escape` does not return to the Main Menu.
- **Recommended Fix Strategy**:
  Add a `window.addEventListener('keydown')` listener in `ApproachSelector.tsx` for `Escape` -> `onCancel()`, and in `CharacterSelect.tsx` for `Escape` -> return to Main Menu.

---

## Priority 5: Pulido (Microinteractions, Missing Sound/FX Triggers, Polish)

### PULIDO-01: Total Absence of Audio System & Sound Triggers across Region 1
- **File Paths & Line Numbers**:
  - Entire codebase (`src/`)
- **Severity**: **HIGH (P1)**
- **Category**: Pulido / Missing Audio Triggers
- **Description**:
  There is zero audio implementation in the project (no Web Audio API, howler, or Audio elements). Region 1 has no background music (coastal ambient mist/waves theme) and no sound effects for UI clicks, card draws, jutsu activation, combat hits, or victory screens.
- **Recommended Fix Strategy**:
  Create a centralized `AudioSystem.ts` or sound manager with toggleable SFX/BGM settings, wiring key triggers (button hover/click, card play, victory).

---

### PULIDO-02: Missing CRT Overlay User Toggle in Settings / Main Menu
- **File Paths & Line Numbers**:
  - `src/config/featureFlags.ts`: line 63 (`ENABLE_CRT_OVERLAY: true`)
  - `src/scenes/menu/MainMenu.tsx`: lines 50-105
- **Severity**: **LOW (P3)**
- **Category**: Pulido / User Settings
- **Description**:
  While `ENABLE_CRT_OVERLAY` is enabled by default in `featureFlags.ts`, there is no menu toggle to let players disable CRT scanline overlay if they prefer clean graphics.
- **Recommended Fix Strategy**:
  Add a CRT scanlines toggle button on the Main Menu or in a settings modal.

---

## Out-of-Scope Items (Marked Clearly for Region 2+)

1. **Region 2 (Chunin Exams / Forest of Death)**: `src/game/constants/regions/chuninExams.ts` — Out of scope for Region 1 polish (tracked in T-024).
2. **Region 3 (Sasuke Retrieval / Valley of the End)**: `src/game/constants/regions/sasukeRetrieval.ts` — Out of scope (tracked in T-025).
3. **Region 4 (Great Ninja War / Divine Tree Roots)**: `src/game/constants/regions/greatNinjaWar.ts` — Out of scope (tracked in T-026).
4. **Infinite Tower Mode**: `src/game/systems/InfiniteTowerSystem.ts` — Out of scope post-campaign mode (tracked in T-027).

---

## Summary Table of Issues

| ID | Priority | Category | File Path & Line | Issue Description | Fix Strategy |
|---|---|---|---|---|---|
| **ROTO-01** | P1 | Roto | `MainMenu.css:28`, `CharacterSelect.css:28`, `App.tsx:328`, `LocationCardDisplay.tsx:48` | Biome & Menu background PNGs stored in root `assets/` instead of `public/assets/`, causing 404 errors | Copy 13 `location_*.png` and menu backgrounds to `public/assets/` |
| **ROTO-02** | P1 | Roto | `CharacterSelect.tsx:243` | `translucent_begin_journey.png` missing from `public/assets/` (only in backup) | Copy file to `public/assets/` or replace with CSS button |
| **ROTO-03** | P2 | Roto | `MainMenu.tsx:24-38`, `App.tsx:1066` | Inline arrow function in App causes event listener re-bind on every render | Wrap `onEnter` handler in `useCallback` |
| **CONFUSO-01** | P1 | Confuso | `App.tsx:635`, `GameGuide.tsx` | Zero onboarding/intro modal for first-time Region 1 players | Add 1-step Region 1 Intro Modal on first landing on Region Map |
| **CONFUSO-02** | P2 | Confuso | `CharacterSelect.tsx:86-255` | Clan Selection cards don't show Element Affinity or Clan Passive description | Add Affinity chip and Clan Passive badge on cards |
| **CONFUSO-03** | P3 | Confuso | `LocationCardDisplay.tsx:68`, `RegionMap.tsx:173` | Revisit penalty vague ("reduced rewards") | Clarify text to "-50% Ryo & Exp" |
| **FEO-01** | P2 | Feo | `LocationCard.tsx:34`, `ExplorationHUD.css:1`, `_variables.css:245` | Style clash: rounded glassmorphism vs blocky hard-shadow pixel-arcade | Apply pixel-arcade blocky frame tokens to HUD/Cards |
| **FEO-02** | P2 | Feo | `_variables.css:173`, `PlayerHUD.tsx:75` | VT323 pixel font legible issues at <12px sizes | Increase min font size to 13-14px for pixel font |
| **FEO-03** | P3 | Feo | `App.tsx:1061`, `SceneBackdrop.tsx:32` | Instant scene snaps with no fade/curtain transition | Add `sw-fade-in` CSS transition on scene mount |
| **FRICCION-01** | P2 | Fricción | `RegionMap.tsx:135`, `LocationCardDisplay.tsx:62` | Double-clicking a location card doesn't enter location | Add `onDoubleClick` handler to trigger location entry |
| **FRICCION-02** | P2 | Fricción | `ApproachSelector.tsx:1`, `CharacterSelect.tsx:43` | Missing Escape key listener to close modal or go back | Add Escape key event listener to cancel/back |
| **PULIDO-01** | P1 | Pulido | Entire codebase | Complete absence of Web Audio / SFX / BGM audio system | Build centralized `AudioSystem.ts` for UI/combat SFX |
| **PULIDO-02** | P3 | Pulido | `featureFlags.ts:63`, `MainMenu.tsx:50` | CRT scanline overlay lacks in-game user toggle | Add CRT toggle option in menu/settings |
