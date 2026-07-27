# A6 WAVE12 — Residual UX (Tooltips / First-hour CTAs / Esc)

**Agent:** A6 WAVE12 (tooltips/UX first-hour)  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A6-wave11-ux.md](./A6-wave11-ux.md) (production smoke CLEAN)  
**Context:** Residual mandate only — no design-system unify.

## Goal

Residual UX only (no redesign):

1. First-hour CTAs still wired: Enter the Mist / Enter Location / Enter Room / Return to Region  
2. Esc paths: merchant, bag, continue-modals, game over — no soft-lock; `e.repeat` only if missing **and** causes double-leave  
3. Tooltip crashes or empty critical stats on skill/item — fix if broken  
4. Do **not** unify whole design system  

`tsc` clean. No commit.

## Result: **CLEAN** (verify-only)

No new P0/P1 residual UX bugs confirmed. W7–W11 holds verified in source. No product code changes.

## Hunt matrix

### 1. First-hour CTAs

| CTA (mandate) | Live product label | Wire path | Status |
|---------------|--------------------|-----------|--------|
| Enter the Mist | **Enter the Mist** (`MainMenu` + campaign `CharacterSelect`) | Menu → `CHAR_SELECT` / clan start; Infinite: **Begin Ascent** | **Hold** |
| Enter Location | **Enter Location** (+ Deploy into Fog / Revisit / Slip Off-Ledger variants) | `RegionMap` → `onEnterLocation` → `handleEnterSelectedLocation` (`App.tsx`) | **Hold** |
| Enter Room | **Enter Room** / **Enter Guardian** | `LocationMap` → `onRoomEnter` → `handleLocationRoomEnter` | **Hold** |
| Return to Region | **Return to Region** (panel + leave-only recovery + Space/Enter when floor complete) | `onLeaveLocation` → `handleLeaveLocation` → complete panel / meta | **Hold** |

Coach / handbook still steers: mark path → Enter Location → Enter Room → Return to Region (`helpText` + region/location coach copy).

### 2. Esc paths (no soft-lock)

| Surface | Behavior | Double-leave guard | Status |
|---------|----------|--------------------|--------|
| Merchant | Esc: toast → deselect → **Leave shop** | `merchantLeaveLockRef` in `leaveMerchant` | **Hold** — no soft-lock |
| Bag overlay | Capture layers: toast → craft → menu → synthesis; bubble closes overlay | `e.repeat` ignored (Bag + InventoryOverlay) | **Hold** (W10) |
| Equipment | Capture: toast → slot menu | `e.repeat` ignored | **Hold** (W10) |
| Continue-family | Reward / Rest / Intel / Event / Dice / LocationComplete / Treasure claim & hunt | Ref mutex and/or consume state (`rewardCloseLockRef`, `closedRef`, dice `hadResult`) | **Hold** |
| Game over | Enter / Escape → Rise Again | `e.repeat` ignored | **Hold** |
| App explore overlay | Esc closes bag/character when open | Sets overlay `none` | **Hold** |
| Approach | Esc: confirm back → cancel approach | Cancel is idempotent (no meta double-leave) | **Hold** |

**`e.repeat` residual (not fixed — does not cause double-leave):**

- Merchant Esc: no `e.repeat`; held Esc steps toast → deselect → leave. Leave is **mutex-locked** (`merchantLeaveLockRef`) → not double-leave.
- ApproachSelector Esc: no `e.repeat`; cancel does not double-complete rooms/locations.
- RegionMap / LocationMap Space·Enter: no `e.repeat`; leave/complete path gated by `completePanelOpenRef` / `completeExecuteLockRef`.
- RewardModal keyboard: no local `e.repeat`; parent `rewardCloseLockRef` blocks double Continue.

Mandate: add `e.repeat` **only if missing and causes double-leave** → **no change**.

### 3. Tooltips (crash / empty critical stats)

| Surface | Critical content | Status |
|---------|------------------|--------|
| Portal `Tooltip.tsx` | Host-edge vertical flip + re-resolve anchor; max-height clamp | **Hold** (W9) |
| Item-tile flip util | `alignItemTileTooltip` → `.item-tile--tooltip-below` | **Hold** |
| Merchant item cards | Name, type, stats + compare deltas, focus marks; mouseenter/focus align | **Hold** |
| Bag / Equipment portal tips | Name, stats, sell, forge path; empty slots have copy | **Hold** |
| Combat hand skill tips | Force / Precision / Toll (AP·CP·HP·CD) / Marks / preview vs enemy | **Hold** — critical stats present |
| ScrollDiscovery skill tips | Cost, type, mult, element, effects, requirements | **Hold** |
| TreasureChoice / TreasureHuntReward | Item stats + skill cost/type/scaling; align wired | **Hold** (W9) |
| `ENABLE_TOOLTIPS` | `true` in feature flags | **Hold** |

`Item.stats` is required on `Item` (`types.ts`); skill tooltips always render Force/Precision/Toll rows. No crash path or empty critical-stat sheet found.

## Confirmed findings → fixes

*None.* Residual smoke found no soft-lock, dead first-hour CTA, tooltip crash, or double-leave from missing `e.repeat`.

## Files touched

- `.agents/swarm-grok/reports/A6-wave12-ux.md` (this file only)

## Residual notes (not P0/P1 — do not redesign)

- Merchant Esc still lacks `e.repeat` (hygiene elsewhere); leave mutex prevents double-leave
- ApproachSelector Esc still no `e.repeat` — cancel thrash only
- Portal tooltips remain `pointer-events: none` — height-capped; no in-tooltip scroll
- Left/right portal flip not implemented (vertical only); pad clamp covers edges
- Loot Esc only cancels leave-confirm (does not leave) — intentional confirm gate
- Event Esc deselects choice only (no free leave mid-event) — by design
- Interlude global Enter still confirms selected boon (by design)
- In-run ExplorationHUD still has no dedicated “Ascent N” chip (region name embeds `· Ascent N`)
- Infinite death still Gate-only (no one-click “Climb Again” — feature)
- Full `inert` under modals (focus trap sufficient)
- Menu CTA product language is **Enter the Mist**, not literal “Begin Journey”
- Do **not** unify whole design system (mandate)

## Verification

- `npx tsc --noEmit` → **exit 0**
- No combat math changes
- No product code edits
- No commit (per mandate)

## Success criteria

- [x] First-hour CTAs present and wired (Mist / Location / Room / Return Region)
- [x] Esc merchant + bag + continue-modals + game over: no soft-lock
- [x] `e.repeat` not added where double-leave already guarded
- [x] Tooltip hunt: no crash / empty critical skill-item stats
- [x] No design-system unify
- [x] Report written; tsc clean; no commit
