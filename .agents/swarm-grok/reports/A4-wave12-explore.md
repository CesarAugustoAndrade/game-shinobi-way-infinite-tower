# A4 WAVE12 — Exploración soft-lock hunt

**Agent:** A4 WAVE12 (exploration R1 soft-lock)  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Leave / LocationComplete · Rest/Intel one-shot · floor-complete leave CTA · EXPLORE blank · room select · secret fog · activity→returnToMap  
**Verify:** `npx tsc --noEmit` — clean (exit 0)  
**Outcome:** **1 real soft-lock family fixed** + defensive blank-map guards. Mandate locks still hold.

## Mandate

1. Leave location / LocationComplete double-bump still guarded  
2. Rest/Intel continue chain still one-shot  
3. Floor complete leave-only CTA still honest  
4. Hunt: stuck on EXPLORE with no UI · room select with no Enter · secret fog soft-lock · activity complete without returnToMap  
5. Fix **only real soft-locks**. No floor gen rewrite  
6. Report this file · No git commit · tsc clean  

## Verification matrix (held)

| Target | Verdict | Evidence |
|--------|---------|----------|
| **1. Leave / LocationComplete double-bump** | **OK (held)** | `LocationCompleteModal.closedRef` + `confirmLocationComplete` `completeExecuteLockRef` + consume panel; stage `completePanelOpenRef` blocks leave+auto double-stage. Single `locationsCleared++` / deck redraw. |
| **2. Rest / Intel one-shot chain** | **OK (held)** | `RestResultModal` / `IntelResultModal` `closedRef` + App consume-first then `returnToMap()`. Map I/C keys ignore `.rest-result` / `.intel-result`. |
| **3. Floor-complete leave honesty** | **OK (held)** | `floorComplete` hides **Locked**; leave CTA on selected panel; orphan `--leave-only` when no selection; Space/Enter leave; coach/keyboard strip honest. |
| **4a. Stuck EXPLORE no UI** | **Fixed (defensive)** | `GameState.EXPLORE` has no App branch. Recovery effect remaps EXPLORE → LOCATION_EXPLORE/REGION_MAP. LOCATION_EXPLORE without region/floor → REGION_MAP. Enter location aborts if `locationToBranchingFloor` null. |
| **4b. Room select with no Enter** | **OK + recovery** | Accessible+uncleared still shows Enter Room / keyboard. Auto-select current; Space snaps to open path. **NEW:** empty/spent `!isCleared` rooms force-clear so paths unlock (was branch seal). |
| **4c. Secret fog soft-lock** | **OK (held)** | Fogged secret cards keep **Veiled signal** + Slip Off-Ledger deploy; `getCardDisplayInfo(NONE)` `isSecret` honesty; complete panel **Veiled routes surface**. No deploy gate on secret. |
| **4d. Activity complete without returnToMap** | **OK (held)** | Rest/intel → `returnToMap`; merchant/train/scroll/elite escape/event/treasure → `returnToMapActivityComplete`; reward/loot leave → `returnToMap` / one-shot locks. |

## What shipped

### 1. Empty / spent room branch seal (real soft-lock)

**Cause:** Room with no remaining activities but `isCleared === false` (event/elite gen dropout when flags off / `pickEvent` null, or residue) never unlocked children. Enter logged “Nothing remains here” and returned — branch permanently sealed.

| Layer | Change |
|-------|--------|
| **`LocationSystem.clearRoomIfSpent`** | If room has no pending activity and is not cleared → mark cleared + unlock children (immutable rooms) |
| **`useActivityHandler`** | On no activity enter: call `clearRoomIfSpent` + `setFloor` |
| **`useExploration.returnToMap`** | Same recovery before chain / floor-complete / map return |
| **`useExploration.returnToMapActivityComplete`** | Same recovery on floor snapshot before complete/map |

Not a floor-gen rewrite — runtime recovery only.

### 2. Blank map guards (EXPLORE / null floor)

| Layer | Change |
|-------|--------|
| **`useLocationCards.handleEnterSelectedLocation`** | If `locationToBranchingFloor` returns null → log danger, stay/return **REGION_MAP** (never LOCATION_EXPLORE without floor) |
| **`App.tsx` LOCATION_EXPLORE render** | If `getCurrentLocation` null but floor live → still mount LocationMap with biome / “Current site” name (no blank center) |
| **`App.tsx` recovery effect** | `GameState.EXPLORE` → LOCATION_EXPLORE or REGION_MAP; LOCATION_EXPLORE without region/floor → REGION_MAP |

### 3. Explicitly not reworked (still correct)

- W7 leave CTA wiring / coach  
- W8 Rest/Intel `closedRef` + App consume  
- W9 LocationComplete one-shot / fog `isSecret`  
- W10 EventResult closedRef / leave-only CTA  
- Floor generation / backtrack redesign  
- Secret name reveal under fog (intentional)  

## Files touched

| File | Role |
|------|------|
| `src/game/systems/LocationSystem.ts` | `clearRoomIfSpent` |
| `src/hooks/useActivityHandler.ts` | Empty-room enter recovery |
| `src/hooks/useExploration.ts` | returnToMap / ActivityComplete recovery |
| `src/hooks/useLocationCards.ts` | Null floor enter abort |
| `src/App.tsx` | Blank LOCATION_EXPLORE render + EXPLORE recovery effect |
| `.agents/swarm-grok/reports/A4-wave12-explore.md` | This report |

## Smoke checklist (code-path)

1. Clear exit → complete panel → hold Enter once: single region return / single `locationsCleared` (`closedRef` + `completeExecuteLockRef`)  
2. Leave CTA / Space on cleared floor stages complete once (`completePanelOpenRef`)  
3. Rest Continue once: single `returnToMap` chain  
4. Intel Continue once: single `returnToMap`  
5. Floor complete + side select: leave only (no false **Locked**)  
6. Floor complete + no selection: orphan leave CTA  
7. Empty/spent room enter: children unlock (no sealed branch)  
8. Deploy never lands LOCATION_EXPLORE with null floor  
9. Fogged secret: **Veiled signal** + Slip Off-Ledger still deploys  
10. `npx tsc --noEmit` clean  

## Residual risks (out of mandate / gen)

- Mid-width dead-ends / exit-on-other-branch soft-stuck remain **floor-gen design** (forward-only diamond; no backtrack)  
- Empty activity rooms still *generate* rare (event/elite flag dropout); runtime recovery unseals them without rewriting gen  
- Space hold through complete panel can skip scar read (power-user; one-shot still holds)  
- Fogged secret still hides true name until intel reveals — intentional  

## Explicitly not done

- No git commit  
- No floor generation rewrite / backtrack redesign  
- No new unit tests  
- No rework of W7–W11 leave / complete / rest-intel / veiled UI wiring beyond recovery guards  
