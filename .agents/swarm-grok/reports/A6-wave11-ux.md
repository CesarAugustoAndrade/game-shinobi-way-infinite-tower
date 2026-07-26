# A6 WAVE11 — UX Production Smoke (Tooltips / CTAs / Esc)

**Agent:** A6 WAVE11 (tooltips/UX product chrome)  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A6-wave10-ux.md](./A6-wave10-ux.md) (Bag Esc layers · Scroll/Training Esc · e.repeat hygiene)  
**Context:** WAVE9 portal tooltip flip re-anchor; treasure claim Esc residual noted.

## Goal

Production smoke only — **no full chrome rewrite**. Hunt broken tooltips, first-hour CTAs, Esc soft-locks. Fix **only** real P0/P1 (soft-lock, empty CTA, tooltip crash). `tsc` clean. No commit.

## Result: **CLEAN** (verify-only)

No new P0/P1 UX bugs confirmed this wave. W7–W10 holds verified in source; no code changes.

## Hunt matrix

### 1. Tooltips

| Surface | Check | Status |
|---------|-------|--------|
| Portal `Tooltip.tsx` vertical flip | Free space from **host** edges; re-resolve anchor after flip; final `position` for CSS/arrow | **Hold** (W9) |
| Portal max-height clamp | `max-height: min(70vh, calc(100dvh - 16px))` + layout pad clamp | **Hold** (W7) |
| Item-tile flip util | `alignItemTileTooltip` → `.item-tile--tooltip-below` | **Hold** |
| Merchant item cards | `onMouseEnter` / `onFocus` → align | **Hold** |
| Loot item + skill cards | align wired | **Hold** |
| TreasureChoice revealed cards | align wired | **Hold** (W9) |
| TreasureHuntReward item + skill | align wired | **Hold** (W9) |
| Combat hand skill tooltips | Force / Precision / Toll / Marks / preview vs enemy | **Hold** — critical stats present |
| ScrollDiscovery skill tooltips | Cost, type, mult, element, effects, requirements | **Hold** |
| Bag / Equipment portal tips | Name, stats, sell, forge path; empty slots have copy | **Hold** — not empty |
| Clan loadout (CharacterSelect) | Tooltip host wraps full card | **Hold** (W7) |

**No** off-screen crash, empty-content crash, or missing portal re-anchor found.

### 2. First-hour CTAs

| CTA (mandate wording) | Live product label | Wired |
|----------------------|--------------------|-------|
| Menu Begin Journey | **Enter the Mist** (`MainMenu` + campaign `CharacterSelect`) | Yes → `CHAR_SELECT` / start run |
| Infinite entry | **Infinite Ascent** / **Begin Ascent** | Yes (when unlocked) |
| Region Enter Location | **Enter Location** (+ fog/revisit variants) | Yes `RegionMap` → `onEnterLocation` |
| Room Enter Room | **Enter Room** / **Enter Guardian** | Yes `LocationMap` → `onRoomEnter` |
| Leave location | **Return to Region** (Space/Enter when floor complete) | Yes `onLeaveLocation` → `handleLeaveLocation` |

Coach copy still steers: mark path → Enter Location → Enter Room → Return to Region.

### 3. Esc behavior (no soft-lock)

| Surface | Behavior | Status |
|---------|----------|--------|
| Merchant | Esc: toast → deselect → **Leave shop** | **Hold** |
| Treasure claim | Space / Enter / **Escape** → confirm claim | **Hold** (W9 residual closed) |
| Treasure hunt reward | Space / Enter / **Escape** claim | **Hold** (W9) |
| Bag overlay | Capture: toast → craft → menu → synthesis; bubble close | **Hold** (W10) |
| Equipment | Capture: toast → slot menu | **Hold** (W10) |
| Scroll result | Esc continue-family | **Hold** (W10) |
| Training result | Esc continue-family | **Hold** (W10) |
| Continue-family modals | Reward / Rest / Intel / Event / Dice / LocationComplete | **Hold** |
| CharacterSelect / Victory / GameOver / GameGuide | Esc dismiss / Gate / Rise Again | **Hold** |
| Approach | Esc: confirm → cancel approach | **Hold** |
| App explore overlay | Esc closes bag/character when open | **Hold** |

No Esc soft-lock reproduced in static review.

## Confirmed findings → fixes

*None.* Production smoke found no new soft-lock, empty CTA, or tooltip crash.

## Files touched

- `.agents/swarm-grok/reports/A6-wave11-ux.md` (this file only)

## Residual notes (not P0/P1 — do not redesign)

- Portal tooltips remain `pointer-events: none` — height-capped; no in-tooltip scroll interaction (W9/W10)
- Left/right portal flip not implemented (only vertical); edge cases rely on pad clamp
- Merchant Esc lacks `e.repeat` ignore (W10 hygiene elsewhere); held Esc can step toast → leave quickly — not a soft-lock
- ApproachSelector Esc also no `e.repeat` — same class of minor thrash
- Loot Esc only cancels leave-confirm (does not leave) — intentional confirm gate
- Event Esc deselects choice only (no free leave mid-event) — by design
- Interlude global Enter still confirms selected boon (by design; single primary action)
- Event choice-card host tooltips (event gold chrome; different family)
- In-run ExplorationHUD still has no dedicated “Ascent N” chip (region name embeds `· Ascent N`)
- Infinite death still Gate-only (no one-click “Climb Again” — feature)
- Full `inert` under modals (W6: focus trap sufficient)
- Menu CTA product language is **Enter the Mist**, not literal “Begin Journey”

## Verification

- `npx tsc --noEmit` → **exit 0**
- No combat math changes
- No product code edits
- No commit (per mandate)

## Success criteria

- [x] Tooltip hunt: portal flip + item-tile flip + skill/item critical stats held
- [x] First-hour CTAs present (menu / region / room / leave)
- [x] Esc merchant + modals: no soft-lock residual confirmed
- [x] No P0/P1 fix required → CLEAN verify-only
- [x] Report written; tsc clean; no commit
