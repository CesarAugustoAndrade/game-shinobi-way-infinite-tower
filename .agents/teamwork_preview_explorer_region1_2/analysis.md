# Deep Analysis Report: Region 1 (Land of Waves) Map, Events, Data, Flags & Region Transition

**Author**: Explorer 2 (Region 1 Polish Specialist)  
**Target Workspace**: `C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower`  
**Date**: 2026-07-22  

---

## Executive Summary

This report provides a comprehensive, evidence-based investigation into **Region 1 (Land of Waves)** in *Shinobi Way: The Infinite Tower*. The investigation covered:
1. **Region 1 Map & Node Generation** (`LocationSystem.ts`, `RegionSystem.ts`, `RegionMap.tsx`, `LocationMap.tsx`, `useLocationCards.ts`, `useRoomNavigation.ts`, `useExploration.ts`).
2. **Event System & Content** (`EventSystem.ts`, `wavesArcEvents.ts`, `genericEvents.ts`, `Event.tsx`, `EventResultModal.tsx`, `useActivityHandlers.ts`).
3. **Shop & Rest Nodes** (`Merchant.tsx`, `Training.tsx`, `RestResultModal.tsx`, `LocationSystem.ts`).
4. **Persistent Flags & Reward Mechanics** (`requiresFlags`, `excludesFlags`, `setFlags`, `grantSkillById`, `curse`, `removeRandomItem`, run modifiers, `LandOfWaves` config).
5. **Region 1 -> Region 2 Transition Logic** (`CampaignSystem.ts`, `campaign.ts`, `Interlude.tsx`, `LocationCompleteModal.tsx`, `isRegionBossDefeated`).

All Findings are categorized by priority: **Roto** (Bugs/Failures), **Confuso** (Ambiguity/Feedback), **Feo** (Visual Layout), **Fricción** (UI Tedium), and **Pulido** (Transition & Sound Polish).

---

## Findings Table & Priority Matrix

| ID | Category | Title | Affected Files & Lines | Severity |
|---|---|---|---|---|
| **R1-01** | Roto | Unlinked Story Event IDs in Land of Waves Config | `src/game/constants/regions/landOfWaves.ts` (47, 176, 271, 426) | HIGH |
| **R1-02** | Roto | Orphan Secret Unlock Flag `drowned_shrine_discovered` | `src/game/constants/regions/landOfWaves.ts` (407) | MEDIUM |
| **R1-03** | Roto | Region Progress Percentage Overflow (>100%) | `src/components/exploration/RegionMap.tsx` (74, 200), `LocationCompleteModal.tsx` (54, 89) | HIGH |
| **R1-04** | Roto | Event Combat Difficulty Scaling Defect | `src/hooks/useActivityHandlers.ts` (705) | HIGH |
| **R1-05** | Roto | `triggerCombat.floor: 0` Danger Fallback Falsy Check | `src/hooks/useActivityHandlers.ts` (683) | MEDIUM |
| **C1-01** | Confuso | Zero Reward & Missing Feedback on Paid Event Choice | `src/game/constants/events/wavesArcEvents.ts` (48-63) | MEDIUM |
| **C1-02** | Confuso | Mixed Language in Merchant UI & Event Choice Descriptions | `src/scenes/activities/Merchant.tsx` (699), `wavesArcEvents.ts` (14, 45, 68) | LOW |
| **C1-03** | Confuso | Inconsistent Log Types in `intelligence_network` | `src/game/constants/events/genericEvents.ts` (420-430) | LOW |
| **F1-01** | Feo | Card Grid Overflow on Region Map Viewports | `src/components/exploration/RegionMap.tsx` (132-152), `exploration.css` | MEDIUM |
| **F1-02** | Feo | Event Result Modal Empty State Plain Styling | `src/components/modals/EventResultModal.tsx` (85-87) | LOW |
| **F1-03** | Feo | Choice Card Risk Meter & Lock Badge Layout Collision | `src/scenes/activities/Event.tsx` (284-310), `Event.css` | LOW |
| **FR1-01** | Fricción | Shop Preview Panel Collapses on Every Item Purchase | `src/scenes/activities/Merchant.tsx` (627, 637) | MEDIUM |
| **FR1-02** | Fricción | Two-Step Re-entry to Uncleared Rooms with Multiple Activities | `src/components/exploration/LocationMap.tsx` (160-170) | LOW |
| **FR1-03** | Fricción | Keypress Bleed-Through on `RestResultModal` Dismissal | `src/components/modals/RestResultModal.tsx` (31-45) | LOW |
| **P1-01** | Pulido | Abrupt Scene Transition on Chained Events (`chainTo`) | `src/scenes/activities/Event.tsx` (408-415), `useActivityHandlers.ts` (823) | LOW |
| **P1-02** | Pulido | Silent Region 1 -> Region 2 Interlude Transition | `src/scenes/menu/Interlude.tsx` (217-225) | LOW |

---

## Detailed Investigation & Evidence Chains

### 1. Priority 1: ROTO (Bugs & Structural Defects)

#### Finding R1-01: Unlinked Story Event IDs in Land of Waves Config
- **Observation**: In `src/game/constants/regions/landOfWaves.ts`:
  - Line 47 (`THE_DOCKS`): `tiedStoryEvents: ['meet_tazuna']`
  - Line 176 (`FISHING_VILLAGE`): `tiedStoryEvents: ['protect_village', 'meet_inari']`
  - Line 271 (`BRIDGE_CONSTRUCTION`): `tiedStoryEvents: ['protect_bridge', 'final_showdown_setup']`
  - Line 426 (`GATOS_COMPOUND`): `tiedStoryEvents: ['final_confrontation', 'gato_defeat']`
  None of these 7 event IDs (`meet_tazuna`, `protect_village`, `meet_inari`, `protect_bridge`, `final_showdown_setup`, `final_confrontation`, `gato_defeat`) exist in `EVENTS` (`wavesArcEvents.ts` or `genericEvents.ts`).
- **Logic Chain**:
  1. `LocationSystem.ts` lines 437–443 (`pickEventForLocation`) checks: `if (preferredEventIds) { const preferred = basePool.filter(e => preferredEventIds.includes(e.id)); if (preferred.length > 0) return ...; }`.
  2. Because all 7 `tiedStoryEvents` IDs in `landOfWaves.ts` do not exist in `EVENTS`, `preferred.length` is always 0.
  3. Consequently, location-tied story events for Region 1 never trigger, and the generator falls back to un-themed generic events.
- **Recommended Fix**:
  Update `tiedStoryEvents` in `landOfWaves.ts` to reference the existing Region 1 event IDs (`tazuna_request`, `bridge_worker_plea`, `mist_ambush_cache`), or author event definitions for the missing story IDs in `wavesArcEvents.ts`.

#### Finding R1-02: Orphan Secret Unlock Flag `drowned_shrine_discovered`
- **Observation**: `src/game/constants/regions/landOfWaves.ts` line 407:
  `DROWNED_SHRINE` defines `unlockCondition: { type: 'intel', requirement: 'drowned_shrine_discovered' }`.
  Searching the codebase for `drowned_shrine_discovered` shows it is ONLY referenced in `landOfWaves.ts`.
- **Logic Chain**:
  1. `EventSystem.ts` / `wavesArcEvents.ts` set flags `sunken_ship_discovered` and `hidden_cove_discovered` (e.g. `mist_ambush_cache` choices 1 & 2 & 3).
  2. No event outcome in the entire game sets `drowned_shrine_discovered`.
  3. Therefore, `discoverSecretsFromEventFlags` in `RegionSystem.ts` (lines 706–726) can never unlock `DROWNED_SHRINE` via event flag gating. It can only be unlocked via completing `SUNKEN_SHIP` or `HIDDEN_COVE` location paths.
- **Recommended Fix**:
  Add `setFlags: { drowned_shrine_discovered: 1 }` to a suitable outcome in `wavesArcEvents.ts` or `genericEvents.ts` (e.g., in a high-intel choice or secret outcome).

#### Finding R1-03: Region Progress Percentage Overflow (>100%)
- **Observation**: `src/game/systems/RegionSystem.ts` line 358 calculates `totalLocations = locations.filter(l => !l.flags.isSecret).length` (10 non-secret locations in Land of Waves).
  When secret locations (`sunken_ship`, `hidden_cove`, `drowned_shrine`) are completed, `locationsCompleted` increments to 11, 12, or 13.
  In `src/components/exploration/RegionMap.tsx` lines 74–76: `progressPercent = Math.round((locationsCompleted / totalLocations) * 100)` (yields 110%, 120%, 130%).
- **Logic Chain**:
  1. `RegionMap.tsx` line 200 renders: `<div className="region-map__progress-fill" style={{ width: `${progressPercent}%` }} />`.
  2. A percentage > 100% causes the CSS fill bar to extend outside its parent container bounds.
  3. `LocationCompleteModal.tsx` line 89 renders `Region progress: 13/10 (130%)`.
- **Recommended Fix**:
  Clamp `progressPercent` to 100% max using `Math.min(100, Math.round((region.locationsCompleted / region.totalLocations) * 100))`, or update `totalLocations` when secret locations are discovered.

#### Finding R1-04: Event Combat Difficulty Scaling Defect
- **Observation**: In `src/hooks/useActivityHandlers.ts` line 705:
  `const combatEnemy = generateEnemy(combatDangerLevel, player?.locationsCleared ?? 0, enemyType, combatConfig.difficulty || difficulty, ...)`
  In `wavesArcEvents.ts` (lines 23, 126, 158) and `genericEvents.ts` (lines 257, 456), `triggerCombat.difficulty` is set to values like `10`, `12`, or `15`.
- **Logic Chain**:
  1. In Region 1, `difficulty` is `LAND_OF_WAVES_CONFIG.baseDifficulty` (40).
  2. Because `combatConfig.difficulty` is truthy (10), line 705 evaluates `combatConfig.difficulty || difficulty` to `10`.
  3. `generateEnemy` calculates `diffMult = 0.40 + (difficulty / 200)`.
  4. Passing `10` instead of `40 + 10` (50) reduces `diffMult` from `0.60` (or `0.65`) down to `0.45`, making event enemies (~25% weaker) than regular room enemies in Region 1.
- **Recommended Fix**:
  In `useActivityHandlers.ts` line 705, pass `difficulty + (combatConfig.difficulty || 0)` or `combatConfig.difficulty < difficulty ? difficulty + combatConfig.difficulty : combatConfig.difficulty`.

#### Finding R1-05: `triggerCombat.floor: 0` Danger Fallback Falsy Check
- **Observation**: In `src/hooks/useActivityHandlers.ts` line 683:
  `const combatDangerLevel = combatConfig.floor ? Math.min(7, Math.max(1, Math.ceil(combatConfig.floor / 3))) : currentDangerLevel;`
- **Logic Chain**:
  1. `floor: 0` in event config is falsy in JS, so it falls back to `currentDangerLevel`.
  2. However, if an event passes `floor: 1` or `floor: 3`, `Math.ceil(floor / 3)` evaluates to danger level 1, overriding the location's explicit `dangerLevel` (e.g. forcing a Danger 5 location fight down to Danger 1).
- **Recommended Fix**:
  Use `combatConfig.floor && combatConfig.floor > 0 ? Math.min(7, Math.max(1, Math.ceil(combatConfig.floor / 3))) : currentDangerLevel`.

---

### 2. Priority 2: CONFUSO (Clarity & Feedback Issues)

#### Finding C1-01: Zero Reward & Missing Feedback on Paid Event Choice
- **Observation**: `src/game/constants/events/wavesArcEvents.ts` lines 48–63:
  In `bridge_worker_plea` choice 2 ("Negotiate Payment Terms"), the choice costs 200 Ryo (`costs: { ryo: 200 }`) and requires `minStat: INT 14`.
  Outcome 1 (70% weight) log message states: `"You broker a deal. The child's parents are grateful, if poorer."`
  The `effects` object is empty `{ logMessage: ..., logType: 'gain' }`.
- **Logic Chain**:
  1. The player pays 200 Ryo to execute a high-INT choice.
  2. The choice succeeds, but `applyOutcomeEffects` modifies nothing (0 XP, 0 Ryo refund, 0 items).
  3. The player receives a net loss of 200 Ryo on a "successful" choice with zero positive reward.
- **Recommended Fix**:
  Add `exp: 50` and/or `ryo: 100` (or `intelGain: 15` / `statChanges: { intelligence: 1 }`) to reward choice success.

#### Finding C1-02: Mixed Language in Merchant UI & Event Choice Descriptions
- **Observation**: `src/scenes/activities/Merchant.tsx` line 699 ("TRAVELING MERCHANT", `"From the far corners..."`), `wavesArcEvents.ts` lines 14, 45, 68 ("HIGH RISK - Combat for justice", "SAFE - Honest labor").
- **Logic Chain**:
  1. Most event logs and UI dialogs in *Shinobi Way* are in Spanish.
  2. Merchant headers and choice descriptions contain raw English strings.
- **Recommended Fix**:
  Standardize choice descriptions and NPC subtitle quotes to Spanish.

#### Finding C1-03: Inconsistent Log Types in `intelligence_network`
- **Observation**: `src/game/constants/events/genericEvents.ts` lines 420–430:
  Choice 4 ("Observe Silently") outcome 3 has `logMessage: 'They spot you and flee before you learn much.'`, `intelGain: 5`, but `logType: 'info'`.
- **Logic Chain**:
  1. Failed observation results in being spotted and receiving minimal intel (5%).
  2. Other negative outcomes use `logType: 'danger'`.
- **Recommended Fix**:
  Change `logType` to `'danger'`.

---

### 3. Priority 3: FEO (Visual Layout & Alignment)

#### Finding F1-01: Card Grid Overflow on Region Map Viewports
- **Observation**: `src/components/exploration/RegionMap.tsx` lines 132–152 and `exploration.css`:
  `.region-map__cards-grid` displays drawn location cards in a fixed flex row without responsive wrap constraints.
- **Impact**: Card elements overflow horizontally on small screens.
- **Recommended Fix**: Add `flex-wrap: wrap` and responsive media queries in `exploration.css`.

#### Finding F1-02: Event Result Modal Empty State Plain Styling
- **Observation**: `src/components/modals/EventResultModal.tsx` lines 85–87:
  When an outcome produces no stat or resource changes, `No change — the moment passes.` is rendered as plain text.
- **Impact**: Appears inconsistent with the Pixel-Arcade card border styling of active changes.
- **Recommended Fix**: Wrap the empty state text in `.event-result__no-change-chip`.

#### Finding F1-03: Choice Card Risk Meter & Lock Badge Layout Collision
- **Observation**: `src/scenes/activities/Event.tsx` lines 284–310 and `Event.css`:
  Long labels on choice cards collide with `.risk-meter` badges and `.choice-card__gate` lock icons.
- **Recommended Fix**: Apply `flex-shrink: 0` to `.risk-meter` and `min-width: 0` to `.choice-card__label`.

---

### 4. Priority 4: FRICCIÓN (UI Tedium & Control Mechanics)

#### Finding FR1-01: Shop Preview Panel Collapses on Every Item Purchase
- **Observation**: `src/scenes/activities/Merchant.tsx` lines 627, 637:
  In `tryBuy`, calling `setSelectedItemId(null)` collapses the `PreviewPanel` on every purchase.
- **Impact**: Players buying multiple items must re-click item cards after every purchase.
- **Recommended Fix**: Keep the selection active or automatically select the next available item card.

#### Finding FR1-02: Two-Step Re-entry to Uncleared Rooms with Multiple Activities
- **Observation**: `src/components/exploration/LocationMap.tsx` lines 160–170:
  When returning to a room with remaining activities, pressing `Space`/`Enter` selects the room first, requiring a second press to enter.
- **Impact**: Adds unnecessary keypress friction during room clearing.
- **Recommended Fix**: Automatically enter the room's next activity when pressing `Space`/`Enter` if the current room has pending activities.

#### Finding FR1-03: Keypress Bleed-Through on `RestResultModal` Dismissal
- **Observation**: `src/components/modals/RestResultModal.tsx` lines 31–45:
  `RestResultModal` listens to `Enter`/`Space` keydown events immediately upon mounting.
- **Impact**: Holding `Enter` to confirm rest instantly closes the modal before stats can be read.
- **Recommended Fix**: Add a short ~150ms debounce before accepting dismiss keypresses.

---

### 5. Priority 5: PULIDO (Polish & Sound/Animation Triggers)

#### Finding P1-01: Abrupt Scene Transition on Chained Events (`chainTo`)
- **Observation**: `src/scenes/activities/Event.tsx` lines 408–415, `useActivityHandlers.ts` line 823:
  Chained events transition instantly without animation.
- **Recommended Fix**: Add a CSS fade-in or chain icon transition animation when `cameFromChain` is true.

#### Finding P1-02: Silent Region 1 -> Region 2 Interlude Transition
- **Observation**: `src/scenes/menu/Interlude.tsx` lines 217–225:
  Advancing from Region 1 (Land of Waves) to Region 2 (Chunin Exams) has no audio cue or screen transition effect on clicking "Continue".
- **Recommended Fix**: Trigger a region transition sound effect or screen fade when confirming boon selection.

---

## Out-of-Scope Items

As requested, the following items belonging to Region 2+ or external systems were identified during investigation and marked **OUT-OF-SCOPE**:
- Region 2 (Chunin Exams) Data & Config (`chuninExams.ts`, `examsArcEvents.ts`).
- Region 3 (Sasuke Retrieval) Data & Config (`sasukeRetrieval.ts`, `rogueArcEvents.ts`).
- Region 4 (Great Ninja War) Data & Config (`greatNinjaWar.ts`, `warArcEvents.ts`).
- Infinite Tower Mode System (`InfiniteTowerSystem.ts`).

---

## Verification Method

1. **Test Suite Verification**:
   Run `npm test` from project root to ensure all 443 existing tests pass.
2. **Flag & Event Link Verification**:
   Inspect `landOfWaves.ts` and `wavesArcEvents.ts` to confirm event ID matching and flag resolution.
3. **Region Progress Verification**:
   Complete all locations in Land of Waves (including secret locations) and verify `progressPercent` remains clamped at `<= 100%`.
4. **Event Combat Scaling Verification**:
   Trigger an event fight in Land of Waves and verify `generateEnemy` difficulty equals `baseDifficulty + combatConfig.difficulty`.
