# A6 WAVE10 — UX Production Verification

**Agent:** A6 WAVE10 (UX production verification)  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A6-wave9-ux.md](./A6-wave9-ux.md) (portal flip re-anchor · treasure Esc · treasure item-tile flip)

## Goal

Production-verify **menus**, **tooltips**, **Escape**, and **Infinite path**. Fix **new** residual bugs only. Hold W7–W9. `tsc` clean. No commit.

## W7–W9 hold (verified, not reworked)

| Surface | Status |
|---------|--------|
| CharacterSelect Esc / Mission Brief → `setPendingRunMode('campaign')` + MENU | Present |
| CharacterSelect Infinite mode chip + Begin Ascent CTA + tip | Present |
| CharacterSelect short viewport scroll + tooltip host wraps full clan card | Present |
| GameOver Infinite `towerHeight={infiniteHeightFromFloor(infiniteFloor)}` (never 0) | Present |
| Victory Esc → Gate; GameOver Esc → Rise Again; leave resets pending + runMode + floor | Present |
| MainMenu / Victory Infinite CTAs void/rust (not party purple) | Present |
| MainMenu + Victory Enter defers to focused `button` / `a` / `[role="button"]` | Present |
| Portal tooltip host-edge flip + max-height clamp | Present |
| Item-tile Merchant / Loot / Treasure `alignItemTileTooltip` | Present |
| Treasure claim + hunt reward Escape continue-family | Present |
| GameGuide tab scroll reset + ←→ / 1–9 + Esc | Present |
| Infinite region name embeds `· Ascent N`; boss climb advances floor | Present |

## Confirmed findings → fixes

### 1. Bag / Equipment Esc swallowed by InventoryOverlay (confirmed)

| Bug | Detail |
|-----|--------|
| **Confirmed** | Overlay Esc used **capture** and always closed the bag. Bag/Equipment toast Esc only registered on **bubble**, so equip/sell toast + open slot menus never layered — Esc always slammed the overlay (unlike Merchant toast → selection → leave). Craft reveal and synthesis had **no Esc path** at all. |
| **Fix** | Bag capture Esc layers: **toast → craft reveal → slot menu → synthesis cancel** (stopPropagation). Equipment: **toast → slot menu**. InventoryOverlay Esc moved to **bubble** so child capture can win first; still stopPropagation so App map Esc does not double-handle. `e.repeat` ignored. |

### 2. ScrollDiscovery result — Escape dead (confirmed)

| Bug | Detail |
|-----|--------|
| **Confirmed** | Browse path had Esc leave; **result seal screen** only accepted Space/Enter (W9 continue-family residual). |
| **Fix** | Result: Space / Enter / Escape → `handleResultContinue()`. Hint shows Esc. `e.repeat` ignored. |

### 3. Training result — Escape dead (confirmed)

| Bug | Detail |
|-----|--------|
| **Confirmed** | Result screen intentionally blocked Esc (comment: “must continue”) but only Enter applied the session — soft keyboard trap vs continue-family. |
| **Fix** | Result Escape → `handleResultContinue()` (parity Scroll/Reward). Browse Esc still deselects then leave. Hint shows Esc. |

### 4. Escape key-repeat hygiene (minor)

| Surface | Fix |
|---------|-----|
| GameGuide Esc | Ignore `e.repeat` |
| CharacterSheetOverlay Esc | Ignore `e.repeat` |
| InventoryOverlay Esc | Ignore `e.repeat` |

## Files touched

- `src/components/inventory/Bag.tsx`
- `src/components/inventory/EquipmentPanel.tsx`
- `src/components/layout/InventoryOverlay.tsx`
- `src/components/layout/CharacterSheetOverlay.tsx`
- `src/scenes/rewards/ScrollDiscovery.tsx`
- `src/scenes/activities/Training.tsx`
- `src/scenes/menu/GameGuide.tsx`
- `.agents/swarm-grok/reports/A6-wave10-ux.md` (this file)

## Not fixed (not confirmed / out of minimal scope)

- Interlude global Enter still confirms selected boon (by design; single primary action)
- Full `inert` under modals (W6: focus trap sufficient)
- Portal tooltips remain `pointer-events: none` — height-capped; no in-tooltip scroll interaction
- In-run ExplorationHUD still has no dedicated “Ascent N” chip (region name embeds `· Ascent N`)
- Infinite death still Gate-only (no one-click “Climb Again” — feature)
- Event choice-card host tooltips (event gold chrome; different family)
- Loot Esc only cancels leave-confirm (does not leave) — intentional confirm gate

## Verification

- `npx tsc --noEmit` → **exit 0**
- No combat math changes
- No commit (per mandate)

## Success criteria

- [x] W7–W9 menus / tooltips / Infinite path / continue-family held
- [x] Bag overlay Esc layers toast / craft / menu / synthesis before close
- [x] Scroll + Training result Escape continue-family
- [x] Esc key-repeat ignored on guide / overlays
- [x] tsc clean; no commit
