# A4 WAVE10 — Exploración production verification

**Agent:** A4 WAVE10  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Leave location · complete locks · backgrounds always · secret veiled UI  
**Verify:** `npx tsc --noEmit` — clean (exit 0)

## Mandate

1. Production-verify leave location, rest/intel/complete locks, always-on backgrounds, secret veiled UI  
2. Fix **NEW** bugs only (do not rework W7 leave wiring, W8 rest/intel locks, W9 complete one-shot / fog `isSecret`)  
3. Report this file  
4. No git commit  

## Verification matrix

| Target | Verdict | Notes |
|--------|---------|-------|
| **Leave location** | OK + residual fixed | W7 wiring intact (`onLeaveLocation` → `handleLeaveLocation` → complete panel). Stage guard (`completePanelOpenRef`) intact. Keyboard leave on cleared floor intact. **NEW:** floor-complete + side-path select showed **Locked** next to leave; leave CTA missing if no `selectedRoom`. |
| **Complete locks** | OK + residual fixed | LocationComplete `closedRef` + `completeExecuteLockRef` (W9). Rest/Intel `closedRef` + App consume-first (W8). Reward App `rewardCloseLockRef`. **NEW:** EventResult lacked modal one-shot — Enter+click / Space could double `handleEventOutcomeClose` → double completeActivity / leave stage race. |
| **Backgrounds always** | OK (no change) | RegionMap + LocationMap: void `#050608` + scrim + plate + `background_map_exploring.png` fallback. Mission scenes: `combatBackground` via `resolveLaminaPaths` (default coastal harbor). Assets on disk (`location_*.png` ×14, map/combat plates). |
| **Secret veiled UI** | OK (no change) | Card/preview/coach **Veiled signal** under fog (W7). `getCardDisplayInfo(NONE)` `isSecret` honesty (W9). Type `SECRET` + flags fallbacks on card/RegionMap. Complete panel **Veiled routes surface**. Deck still weight-0 until discovered. |

## What shipped

### 1. Event result — one-shot Continue (complete / leave path)

| Layer | Change |
|-------|--------|
| **EventResultModal** | `closedRef` + `dismiss()` — parity Rest/Intel/LocationComplete (Space hold / Enter+click only fires `onClose` once) |

Prevents double `completeActivity` + double `returnToMapActivityComplete` when exit-room events close into location-complete staging (App consume-first alone re-reads lastRendered until commit).

### 2. Leave location — floor-complete CTA honesty

| Layer | Change |
|-------|--------|
| **LocationMap** | Hide **Locked — pick a path above** when `floorComplete` (exit already clear; side branch is not the blocker) |
| **LocationMap** | Standalone leave CTA when `floorComplete && !selectedRoom` (recovery if selection panel not mounted) |
| **exploration.css** | `--leave-only` actions row centering |

## Explicitly not done

- No git commit  
- No floor generation rewrite / backtrack redesign  
- No rework of W7 leave CTA / coach copy  
- No rework of W8 Rest/Intel modal locks (already correct)  
- No rework of W9 LocationComplete one-shot / fog `isSecret` (already correct)  
- No RewardModal modal-level `closedRef` (App `rewardCloseLockRef` already covers)  
- No DiceRollResultModal closedRef (outside leave/complete mandate)  
- No new unit tests  
- No PARTIAL intel tier rewire  

## Files touched

| File | Role |
|------|------|
| `src/components/modals/EventResultModal.tsx` | One-shot dismiss lock (event → leave/complete) |
| `src/components/exploration/LocationMap.tsx` | Floor-complete leave honesty + orphan leave CTA |
| `src/components/exploration/exploration.css` | Leave-only actions layout |

## Smoke checklist (manual)

1. Clear exit → complete panel → hold Enter once: single region return / single locationsCleared bump  
2. Leave CTA / Space on cleared floor still stages complete panel once (W7 + W8 stage guard)  
3. Exit-room **event** Continue once (hold Space / Enter): single complete panel, no double intel  
4. Rest Continue once: single chain (W8)  
5. Intel Continue once: single `returnToMap` (W8)  
6. Floor complete + click uncleared side node: leave CTA only (no **Locked** spoiler)  
7. Region/Location map never blank (void underplate visible if plate slow)  
8. Fogged secret card: **Veiled signal** + name still `???`  
9. Select fogged secret: coach **Slip Off-Ledger** / veiled-signal prose  
10. `npx tsc --noEmit` clean  

## Residual risks

- Mid-width card grid / floor dead-ends unchanged (gen territory; no backtrack)  
- Dice roll result modal still lacks modal-level `closedRef` (not leave/complete path)  
- Exit-on-other-branch soft-stuck remains floor-gen design (forward-only diamond)  
- Fogged secret still hides true name until intel reveals — intentional  
- Space hold through complete panel can skip scar read (power-user; one-shot still holds)  
