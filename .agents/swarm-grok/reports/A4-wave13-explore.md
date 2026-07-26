# A4 WAVE13 — Exploración regression (W12 hold)

**Agent:** A4 WAVE13 (exploration regression)  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** clearRoomIfSpent wiring · Leave/complete/rest-intel one-shots · EXPLORE blank recovery · NEW soft-lock hunt only  
**Verify:** `npx tsc --noEmit` — clean (exit 0)  
**Outcome:** **CLEAN** — W12 mandate locks still hold; **no new soft-lock fixed** (none found in scope).

## Mandate

1. `clearRoomIfSpent` still wired (LocationSystem + activity enter + returnToMap paths)  
2. Leave / complete / rest-intel one-shots held  
3. EXPLORE blank recovery held  
4. Hunt **NEW** soft-lock only — no floor gen rewrite  
5. Report this file · No git commit · tsc clean  

## Verification matrix

| Target | Verdict | Evidence |
|--------|---------|----------|
| **1a. `clearRoomIfSpent` definition** | **OK (held)** | `LocationSystem.ts` L1770–1795: if room exists, `!isCleared`, and `!getCurrentActivity` → mark cleared + unlock children immutably + recount `clearedRooms`. No-op otherwise. |
| **1b. Activity enter wire** | **OK (held)** | `useActivityHandler.executeRoomActivity`: `!activity` branch logs “Nothing remains here”, then `clearRoomIfSpent` + `setFloor` when room still `!isCleared`. Import present. |
| **1c. `returnToMap` wire** | **OK (held)** | `useExploration.returnToMap`: before chain / floor-complete / map return, recovers spent current room via `clearRoomIfSpent` + `setLocationFloor` + `logSyncWarning`. |
| **1d. `returnToMapActivityComplete` wire** | **OK (held)** | Same recovery on `floorToCheck` (updatedFloor \|\| locationFloor) before `isFloorComplete` / LOCATION_EXPLORE return. |
| **2a. Leave / LocationComplete one-shot** | **OK (held)** | `LocationCompleteModal.closedRef` + `dismiss()`. `confirmLocationComplete`: `completeExecuteLockRef` first, consume panel, then `executeLocationComplete`. Stage race: `completePanelOpenRef` blocks leave + auto double-stage. `handleLeaveLocation` also gates on `completePanelOpenRef`. |
| **2b. Rest / Intel one-shot** | **OK (held)** | `RestResultModal` / `IntelResultModal`: `closedRef` + `dismiss()`. App consume-first `setRestResult` / `setIntelResult` then `returnToMap()`. LocationMap keys ignore `.rest-result` / `.intel-result`. Activity path: `completeActivity` then modal; Continue chains via `returnToMap`. |
| **3. EXPLORE / blank map recovery** | **OK (held)** | App effect: `GameState.EXPLORE` → LOCATION_EXPLORE (if region+floor) else REGION_MAP; LOCATION_EXPLORE without region/floor → REGION_MAP. No live writer sets `GameState.EXPLORE` (recovery-only). Enter location: null `locationToBranchingFloor` aborts to REGION_MAP. LOCATION_EXPLORE render falls back name from biome / “Current site” when `getCurrentLocation` null. `resolveExploreReturnState` never returns EXPLORE. |
| **4. NEW soft-lock** | **None found** | Code-path audit of enter empty/spent, returnToMap chain, leave complete, rest/intel, activity exits (merchant/train/scroll/elite/event/treasure → `returnToMapActivityComplete`), floor-complete leave CTA / leave-only orphan, secret fog (prior waves). Residuals remain floor-gen / intentional UI, not runtime seals. |

## What shipped

**None** — regression verify-only. No source edits.

W12 `clearRoomIfSpent` + blank-map guards and W7–W11 leave / complete / rest-intel / leave-only CTA remain intact.

## Wiring detail (still live)

| Call site | File | Behavior |
|-----------|------|----------|
| Definition | `src/game/systems/LocationSystem.ts` | Export `clearRoomIfSpent` |
| Empty enter | `src/hooks/useActivityHandler.ts` | No activity → force-clear + unlock children |
| Post-activity map | `src/hooks/useExploration.ts` `returnToMap` | Recover before chain / complete / LOCATION_EXPLORE |
| Post-completeActivity map | `src/hooks/useExploration.ts` `returnToMapActivityComplete` | Recover on floor snapshot |
| EXPLORE remap | `src/App.tsx` recovery `useEffect` | Blank-shell prevention |
| Null floor enter | `src/hooks/useLocationCards.ts` | Never LOCATION_EXPLORE without floor |
| Live floor blank name | `src/App.tsx` LOCATION_EXPLORE branch | biome / “Current site” fallback |

## Smoke checklist (code-path)

1. Empty/spent room enter → children unlock (`clearRoomIfSpent` + setFloor)  
2. `returnToMap` / `returnToMapActivityComplete` with spent current room → same recovery before chain/complete  
3. Clear exit → complete panel → hold Enter once: single `locationsCleared` / deck redraw  
4. Leave CTA / Space on cleared floor stages complete once  
5. Rest Continue once: single `returnToMap`  
6. Intel Continue once: single `returnToMap`  
7. Floor complete + side select: leave only (no false Locked)  
8. Floor complete + no selection: orphan leave CTA  
9. Stray EXPLORE state remaps; deploy never lands LOCATION_EXPLORE with null floor  
10. `npx tsc --noEmit` clean  

## Residual risks (unchanged / out of mandate)

- Mid-width dead-ends / exit-on-other-branch soft-stuck remain **floor-gen design** (forward-only diamond; no backtrack) — **not fixed**  
- Empty activity rooms can still *generate* rarely (event/elite flag dropout); runtime recovery unseals without gen rewrite  
- Space hold through complete panel can skip scar read (power-user; one-shot still holds)  
- Fogged secret still hides true name until intel reveals — intentional  
- LOCATION_EXPLORE render also requires `player && playerStats` (not in recovery effect); only matters if those are null mid-run (not a normal path)

## Explicitly not done

- No git commit  
- No floor generation rewrite / backtrack redesign  
- No new unit tests  
- No rework of W7–W12 leave / complete / rest-intel / clearRoomIfSpent / blank recovery beyond regression audit  

## Files touched

| File | Role |
|------|------|
| `.agents/swarm-grok/reports/A4-wave13-explore.md` | This report only |
