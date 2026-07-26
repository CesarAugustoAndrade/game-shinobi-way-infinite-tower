# A4 WAVE11 — Exploración production smoke

**Agent:** A4 WAVE11 (exploration R1)  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Leave location · Rest/Intel · LocationComplete · floor-complete leave · secret veiled · backgrounds  
**Verify:** `npx tsc --noEmit` — clean (exit 0)  
**Outcome:** **CLEAN** (verify-only; no code changes)

## Mandate

1. Production-smoke leave location, rest/intel Continue, complete one-shot, floor-complete leave honesty, secret veiled UI, always-on backgrounds  
2. Fix **only NEW** real soft-locks / CTA bugs (no floor generation rewrite)  
3. Report this file  
4. No git commit  

## Verification matrix

| Target | Verdict | Evidence |
|--------|---------|----------|
| **1. Leave location path** | OK | `LocationMap` `onLeaveLocation` → App `handleLeaveLocation` → `useLocationCards.completeLocationAndReturnToRegion` (stages panel). `completePanelOpenRef` blocks double-stage (leave + auto-return race). Keyboard Space/Enter leave when `floorComplete` + no open paths. |
| **2. Rest / Intel modals** | OK | `RestResultModal` / `IntelResultModal`: `closedRef` + `dismiss()`. App consume-first `setRestResult` / `setIntelResult` then `returnToMap()`. Map + I/C keys ignore `.rest-result` / `.intel-result`. Continue returns to map / chains next activity. |
| **3. LocationComplete one-shot** | OK | Modal `closedRef` + `dismiss()`. `confirmLocationComplete`: `completeExecuteLockRef` then consume panel then `executeLocationComplete` (single `locationsCleared++` / deck redraw / boss callback). |
| **4. Floor-complete leave honesty** | OK | `floorComplete` hides **Locked — pick a path above**. Leave CTA on selected panel when exit clear. Standalone `--leave-only` CTA when `floorComplete && !selectedRoom`. Coach / keyboard strip say return to region. |
| **5. Secret veiled UI** | OK | `getCardDisplayInfo(NONE)` `isSecret` from `flags` **or** `LocationType.SECRET`. Card/preview/coach **Veiled signal** under fog; name stays `???`. Deploy **Slip Off-Ledger**. Complete panel **Veiled routes surface**. |
| **6. Backgrounds always** | OK | RegionMap + LocationMap: void `#050608` + scrim + plate + `background_map_exploring.png` fallback. Assets on disk (`background_map_exploring.png`, 14× `location_*.png`). |
| **7. EventResult leave path** | OK | W10 residual: modal `closedRef` still present — blocks double `handleEventOutcomeClose` → double complete / leave stage. |

## What shipped

**None** — production smoke found no new soft-locks or CTA bugs in mandate scope.

W7–W10 leave / complete / rest-intel / event one-shot / veiled / leave-only CTA remain intact. No rework of floor gen.

## Explicitly not done

- No git commit  
- No floor generation rewrite / backtrack redesign  
- No rework of W7 leave wiring, W8 rest/intel locks, W9 complete one-shot / fog `isSecret`, W10 EventResult closedRef / leave-only CTA  
- No RewardModal modal-level `closedRef` (App `rewardCloseLockRef` already covers)  
- No DiceRollResultModal closedRef (outside listed leave/complete files; setState consume alone still weak under Space hold — residual risk)  
- No new unit tests  

## Files touched

| File | Role |
|------|------|
| *(none)* | Verify-only |

## Smoke checklist (code-path audit)

1. Clear exit → complete panel → hold Enter once: single region return / single `locationsCleared` bump (`closedRef` + `completeExecuteLockRef`)  
2. Leave CTA / Space on cleared floor stages complete panel once (`completePanelOpenRef` + leave guard)  
3. Exit-room **event** Continue once: single complete path (`EventResultModal.closedRef` + outcome consume)  
4. Rest Continue once: single `returnToMap` chain  
5. Intel Continue once: single `returnToMap`  
6. Floor complete + uncleared side select: leave CTA only (no false **Locked**)  
7. Floor complete + no selection: orphan leave CTA  
8. Region/Location map never blank (void underplate)  
9. Fogged secret card: **Veiled signal** + name `???`  
10. Select fogged secret: coach **Slip Off-Ledger** / veiled-signal prose  
11. `npx tsc --noEmit` clean  

## Residual risks (unchanged / out of mandate)

- Mid-width card grid / floor dead-ends / exit-on-other-branch soft-stuck remain floor-gen design (forward-only diamond; no backtrack)  
- Dice roll result modal still lacks modal-level `closedRef` (treasure path; complete stage still guarded by `completePanelOpenRef` if floor already clear)  
- Space hold through complete panel can skip scar read (power-user; one-shot still holds)  
- Fogged secret still hides true name until intel reveals — intentional  
