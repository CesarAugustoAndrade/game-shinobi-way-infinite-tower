# Handoff Report: Explorer 2 (Region 1 Map, Events, Data, Flags & Transition)

**Working Directory**: `C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\.agents\teamwork_preview_explorer_region1_2`  
**Target Scope**: Region 1 (Land of Waves) Map/Node Generation, Event System, Data/Config, Persistent Flags, Rewards, Shop/Rest, and Region 1 -> Region 2 Transition.

---

## 1. Observation

- **Obs-1 (Unlinked Event IDs)**:
  In `src/game/constants/regions/landOfWaves.ts`:
  Line 47: `THE_DOCKS`: `tiedStoryEvents: ['meet_tazuna']`
  Line 176: `FISHING_VILLAGE`: `tiedStoryEvents: ['protect_village', 'meet_inari']`
  Line 271: `BRIDGE_CONSTRUCTION`: `tiedStoryEvents: ['protect_bridge', 'final_showdown_setup']`
  Line 426: `GATOS_COMPOUND`: `tiedStoryEvents: ['final_confrontation', 'gato_defeat']`
  None of these 7 event IDs exist in `EVENTS` (`wavesArcEvents.ts` line 3–270 or `genericEvents.ts` line 7–489).

- **Obs-2 (Orphan Flag)**:
  In `src/game/constants/regions/landOfWaves.ts` line 407:
  `DROWNED_SHRINE` sets `unlockCondition: { type: 'intel', requirement: 'drowned_shrine_discovered' }`.
  Searching the codebase for `drowned_shrine_discovered` (`grep_search`) returned only `landOfWaves.ts`. No event outcome in `wavesArcEvents.ts` or `genericEvents.ts` sets `drowned_shrine_discovered`.

- **Obs-3 (Region Progress Overflow)**:
  In `src/game/systems/RegionSystem.ts` line 358: `totalLocations = locations.filter(l => !l.flags.isSecret).length` (10 non-secret locations).
  In `src/components/exploration/RegionMap.tsx` line 74: `progressPercent = Math.round((region.locationsCompleted / region.totalLocations) * 100)`.
  When 11, 12, or 13 locations (including secrets) are cleared, `progressPercent` evaluates to 110%, 120%, 130%.
  Line 200: `<div className="region-map__progress-fill" style={{ width: `${progressPercent}%` }} />` causes CSS width overflow (>100%).
  In `src/components/modals/LocationCompleteModal.tsx` line 89: Displays `13/10 (130%)`.

- **Obs-4 (Event Combat Scaling Defect)**:
  In `src/hooks/useActivityHandlers.ts` line 705:
  `const combatEnemy = generateEnemy(combatDangerLevel, player?.locationsCleared ?? 0, enemyType, combatConfig.difficulty || difficulty, ...)`
  In `wavesArcEvents.ts` lines 23, 126, 158: `triggerCombat: { floor: 0, difficulty: 10, ... }`.
  Because `combatConfig.difficulty` is 10, line 705 passes 10 as absolute difficulty instead of adding to base difficulty (40 in Region 1), reducing `diffMult` in `EnemySystem.ts` line 47 from `0.60` to `0.45`.

- **Obs-5 (Unrewarded Paid Choice)**:
  In `src/game/constants/events/wavesArcEvents.ts` lines 48–63:
  Choice 2 ("Negotiate Payment Terms") has `costs: { ryo: 200 }` and `requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 14 } }`.
  Outcome 1 (70% weight) log message states: `"You broker a deal. The child's parents are grateful, if poorer."`
  The `effects` object is `{ logMessage: ..., logType: 'gain' }` (0 XP, 0 Ryo refund, 0 items).

- **Obs-6 (Shop Selection Reset Friction)**:
  In `src/scenes/activities/Merchant.tsx` line 627:
  `tryBuy` executes `setSelectedItemId(null)`, closing `PreviewPanel` on every purchase.

- **Obs-7 (Test Suite Result)**:
  Ran `npm test -- --runInBand`.
  Result: 22 test files passed, 443 tests passed cleanly.

---

## 2. Logic Chain

1. **Unlinked Story Event IDs (Obs-1)**:
   - `LocationSystem.ts` line 437–443 (`pickEventForLocation`) filters `EVENTS` by `preferredEventIds` from location configs.
   - Because `meet_tazuna`, `protect_village`, `meet_inari`, `protect_bridge`, `final_showdown_setup`, `final_confrontation`, and `gato_defeat` do not exist in `EVENTS`, `basePool.filter(e => preferredEventIds.includes(e.id))` returns an empty array.
   - Therefore, the system silently ignores location-tied events and serves generic un-themed events.

2. **Orphan Secret Unlock Flag (Obs-2)**:
   - `DROWNED_SHRINE` expects `drowned_shrine_discovered` flag to unlock via intel gating.
   - Since no event writes `drowned_shrine_discovered: 1`, flag-based secret discovery will never reveal `DROWNED_SHRINE`.

3. **Region Progress Percentage Overflow (Obs-3)**:
   - `totalLocations` is initialized to 10 (excluding secrets).
   - Clearing secret locations increments `locationsCompleted` past 10 up to 13.
   - `locationsCompleted / totalLocations * 100` yields >100%, causing progress bar CSS overflow (`width: 130%`) in `RegionMap.tsx` and invalid string format `13/10 (130%)` in `LocationCompleteModal.tsx`.

4. **Event Combat Scaling Defect (Obs-4)**:
   - `triggerCombat` defines `difficulty: 10`.
   - `useActivityHandlers.ts` evaluates `combatConfig.difficulty || difficulty`, yielding `10`.
   - `EnemySystem.ts` calculates `diffMult = 0.40 + (difficulty / 200)`.
   - Passing `10` sets `diffMult = 0.45` instead of `0.60` (base difficulty 40), making event combat enemies significantly underpowered compared to location danger.

5. **Unrewarded Paid Choice (Obs-5)**:
   - The player pays 200 Ryo and passes an INT check.
   - The outcome grants no rewards or XP, resulting in a net loss of 200 Ryo on a successful choice without clear feedback.

---

## 3. Caveats

- **Region 2+ Content**:
  Region 2 (Chunin Exams), Region 3 (Sasuke Retrieval), Region 4 (Great Ninja War), and Infinite Tower Mode were deliberately kept out-of-scope as specified in the assignment.
- **Read-Only Scope**:
  This investigation is read-only. Proposed fix strategies in `analysis.md` and `handoff.md` describe exact changes required without modifying project files outside `.agents/teamwork_preview_explorer_region1_2/`.

---

## 4. Conclusion

Region 1 (Land of Waves) mechanics (map/node generation, event system, shop/rest, persistent flags, rewards, and region 1 -> 2 transition) are functionally intact and passing all unit tests, but suffer from **5 Roto issues** (unlinked story event IDs, orphan secret flag, progress bar >100% overflow, event combat difficulty scaling drop, and falsy danger floor checks), **3 Confuso issues** (unrewarded paid choices, mixed localization, inconsistent log types), **3 Feo issues** (card grid layout wrapping, modal empty state styling, choice card lock badge collision), **3 Fricción issues** (shop preview panel collapse on buy, two-step room re-entry, rest result keypress bleed-through), and **2 Pulido issues** (abrupt event chaining, silent interlude region transition).

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Unit Tests**:
   Run `npm test` from the workspace root. Confirm 443 tests pass across 22 test files.
2. **Verify Unlinked Event IDs**:
   Inspect `src/game/constants/regions/landOfWaves.ts` lines 47, 176, 271, 426 and compare against `EVENTS` in `src/game/constants/events/wavesArcEvents.ts`. Confirm IDs `meet_tazuna`, `protect_village`, `meet_inari`, `protect_bridge`, `final_showdown_setup`, `final_confrontation`, `gato_defeat` are absent.
3. **Verify Progress Bar Overflow**:
   Simulate clearing 11+ locations in `RegionMap.tsx` and observe `progressPercent` calculating `>100%`.
4. **Verify Event Combat Scaling**:
   Inspect `src/hooks/useActivityHandlers.ts` line 705 and `wavesArcEvents.ts` line 23. Confirm `10` overrides `baseDifficulty` 40.
