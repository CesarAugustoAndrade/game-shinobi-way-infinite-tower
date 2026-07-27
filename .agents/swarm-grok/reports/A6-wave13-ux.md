# A6 WAVE13 — UX First-Hour Regression (post App.tsx W12)

**Agent:** A6 WAVE13 (UX first-hour regression)  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A6-wave12-ux.md](./A6-wave12-ux.md) (CLEAN verify-only)  
**Context:** Re-verify CTAs / Esc / tooltips after App.tsx WAVE12 soft-lock landings (A2 RewardModal on REGION_MAP, A4 EXPLORE recovery, A7a LOOT `exitLootOnce`).

## Goal

Mandate regression only — **no redesign**:

1. CTAs still wired: **Enter the Mist** / **Enter Location** / **Enter Room** / **Return to Region** after App.tsx W12  
2. Esc merchant / bag / continue-modals — no soft-lock  
3. Tooltips — no crash  
4. Fix only **NEW** P0/P1  

`tsc` clean. No commit.

## Result: **CLEAN** (verify-only)

No new P0/P1 first-hour UX bugs after W12 App.tsx delta. CTA wires, Esc paths, and tooltip surfaces hold. No product code changes.

## App.tsx W12 surface under review

| W12 change (peer) | Risk to first-hour UX | Regression check |
|-------------------|----------------------|------------------|
| RewardModal also under `REGION_MAP` when `combatReward` | Space/Enter might double as Enter Location | RegionMap capture early-returns on `.reward-modal`; RewardModal capture continues with `rewardCloseLockRef` | **Hold** |
| EXPLORE / blank LOCATION_EXPLORE recovery effect | Kick user out mid-enter if floor lags | `handleEnterSelectedLocation` sets floor before `LOCATION_EXPLORE`; batch commit keeps recovery inert on happy path | **Hold** |
| LOOT `exitLootOnce` + `useLayoutEffect` rearm | Leave soft-stick / double returnToMap | Leave All / Learn empty-pile share one-shot; rearm on LOOT open | **Hold** |
| Overlay close when blocking modals present | Esc bag stuck under victory panel | `combatReward` forces `exploreOverlay = 'none'`; I/C blocked under `.reward-modal` | **Hold** |

## Hunt matrix

### 1. First-hour CTAs (still wired)

| CTA (mandate) | Live product label | Wire path | Status |
|---------------|--------------------|-----------|--------|
| Enter the Mist | **Enter the Mist** (`MainMenu` + campaign `CharacterSelect`; Infinite: **Begin Ascent**) | `onEnter` → `CHAR_SELECT` / `onSelectClan` → `startGame` | **Hold** |
| Enter Location | **Enter Location** (+ Deploy into Fog / Revisit / Slip Off-Ledger) | `RegionMap` `onEnterLocation={handleEnterSelectedLocation}` (`App.tsx` ~1618) | **Hold** |
| Enter Room | **Enter Room** / **Enter Guardian** | `LocationMap` `onRoomEnter={handleLocationRoomEnter}` (`App.tsx` ~1657) | **Hold** |
| Return to Region | **Return to Region** (panel + leave-only recovery + Space/Enter when floor complete) | `onLeaveLocation={handleLeaveLocation}` → complete panel / meta | **Hold** |

Coach / handbook still steers mark path → Enter Location → Enter Room → Return to Region (`helpText` + region/location coach + first-run log coach in `startGame`).

### 2. Esc paths (no soft-lock)

| Surface | Behavior | Double-leave / stuck guard | Status |
|---------|----------|----------------------------|--------|
| Merchant | Esc: toast → deselect → **Leave shop** | `merchantLeaveLockRef` in `leaveMerchant` | **Hold** |
| Bag overlay | Capture layers: toast → craft → menu → synthesis; bubble `InventoryOverlay` closes | `e.repeat` ignored (Bag + overlay) | **Hold** |
| Character sheet | Capture Esc → close | `e.repeat` ignored | **Hold** |
| App explore overlay | Esc closes bag/character when open; I/C blocked under result/approach | Blocking selector includes `.reward-modal` | **Hold** |
| Continue-family | Reward / Rest / Intel / Event / Dice / LocationComplete / Treasure claim & hunt | Ref mutex and/or consume state | **Hold** |
| Reward on REGION_MAP (W12) | Esc/Space/Enter Continue; map deploy gated off while modal open | `rewardCloseLockRef` + RegionMap modal query | **Hold** |
| Game over | Enter / Escape → Rise Again | `e.repeat` ignored | **Hold** |
| Approach | Esc: confirm back → cancel approach | Cancel idempotent; Exit Room mid-Engage gated (A2 W12) | **Hold** |

**Not fixed (not P0/P1):** Merchant Esc still lacks local `e.repeat` — leave is mutex-locked; held Esc steps toast → leave, not soft-lock / not double-leave.

### 3. Tooltips (no crash)

| Surface | Critical content | Status |
|---------|------------------|--------|
| Portal `Tooltip.tsx` | Host-edge vertical flip + re-resolve anchor; max-height clamp | **Hold** |
| Item-tile flip util | `alignItemTileTooltip` → `.item-tile--tooltip-below` | **Hold** |
| Merchant / Loot / Treasure item tips | Name, type, stats (+ compare on merchant); mouseenter/focus align | **Hold** |
| Bag / Equipment portal tips | Name, stats, sell, forge path; empty slots have copy | **Hold** |
| Combat hand skill tips | Force / Precision / Toll (AP·CP·HP·CD) / Marks / preview vs enemy | **Hold** |
| ScrollDiscovery skill tips | Cost, type, mult, element, effects, requirements | **Hold** |
| `ENABLE_TOOLTIPS` | `true` in feature flags | **Hold** |

No crash path or empty critical-stat sheet found on skill/item tips. Portal remains `pointer-events: none` (height-capped) — residual only, not P0.

## Confirmed findings → fixes

*None.* Post–App.tsx W12 regression found no dead first-hour CTA, Esc soft-lock, or tooltip crash.

## Files touched

- `.agents/swarm-grok/reports/A6-wave13-ux.md` (this file only)

## Residual notes (not P0/P1 — do not redesign)

- Merchant Esc still lacks `e.repeat` (leave mutex prevents double-leave)
- ApproachSelector Esc still no `e.repeat` — cancel thrash only
- Portal tooltips: vertical flip only; pad clamp covers lateral edges
- Loot Esc only cancels leave-confirm (does not leave) — intentional
- Event Esc deselects choice only (no free leave mid-event) — by design
- Menu CTA product language remains **Enter the Mist**, not “Begin Journey”
- Do **not** unify whole design system (mandate)

## Verification

- `npx tsc --noEmit` → **exit 0**
- Static wire audit: `App.tsx` CTA props + Esc handlers + tooltip hosts
- No combat math changes
- No product code edits
- No commit (per mandate)

## Success criteria

- [x] Enter the Mist / Enter Location / Enter Room / Return to Region still wired after App.tsx W12
- [x] Esc merchant + bag + continue-modals: no soft-lock
- [x] Tooltips: no crash / empty critical skill-item stats
- [x] Fix only NEW P0/P1 (none found)
- [x] No redesign
- [x] Report written; tsc clean; no commit
