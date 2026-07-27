# A6 WAVE7 — UX Residual Bug Hunt Minimal

**Agent:** A6 WAVE7 (UX residual bug hunt minimal)  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A6-wave6-ux.md](./A6-wave6-ux.md) (focus trap · Escape · Victory layout)

## Goal

Hunt **new** residual bugs only: CharacterSelect / MainMenu keyboard, tooltip overflow offscreen residual, GameGuide. Hold W6 focus trap + Escape + Victory layout. Fix confirmed only. `tsc` clean. No commit.

## Confirmed findings → fixes

### 1. MainMenu keyboard — Enter stole secondary CTAs

| Bug | Detail |
|-----|--------|
| **Confirmed** | Global `Enter` always called `onEnter()` with `preventDefault`, so focused **Shinobi Handbook** or **Infinite Ascent** never activated via keyboard. |
| **Fix** | Defer to native activation when target is `button` / `a` / `[role="button"]`. Enter from body or mission-rank slider still starts campaign. `I` still skips when focus is in a field. |

### 2. Victory keyboard — Enter forced Gate over Infinite

| Bug | Detail |
|-----|--------|
| **Confirmed** | Same pattern as MainMenu: window `Enter` always `onMenu()`, so Tab → **Infinite Ascent** → Enter still returned to the Gate (and blocked button click via preventDefault). |
| **Fix** | Same interactive-target deferral. `I` shortcut unchanged. Focus trap + autofocus on Return retained from W6. |

### 3. CharacterSelect keyboard — loadout tooltip never on focus

| Bug | Detail |
|-----|--------|
| **Confirmed** | Portal `Tooltip` wrapped only the non-focusable stats row. Clan cards are `tabIndex={0}` but focus never hit the tooltip host → keyboard users never saw loadout / full ranks. |
| **Fix** | Tooltip host wraps the full clan card; keyboard focus (and hover) reveals the sheet. Grid stagger moved to `.char-select__grid > *`. Field-guard on global shortcuts (defensive). |

### 4. Portal tooltip overflow residual

| Bug | Detail |
|-----|--------|
| **Confirmed** | Clamp set `top/left` but tall content (clan loadout, bag recipes) could still paint past the viewport bottom — no `max-height`, no flip when preferred side had less room. |
| **Fix** | `.tooltip`: `max-height: min(70vh, calc(100dvh - 16px))` + `overflow-y: auto`. Layout clamp flips `bottom↔top` when the opposite side has more free space, then re-pads. |

### 5. Item-tile host tooltip residual (top of viewport)

| Bug | Detail |
|-----|--------|
| **Confirmed** | Host-scoped `.item-tile__tooltip` always opens *above* the card; first-row Merchant/Loot cards clipped off the top (noted residual since Wave1/2). |
| **Fix** | `alignItemTileTooltip()` toggles `.item-tile--tooltip-below` when space above is tighter than tip height. Wired on Merchant item cards + Loot item/skill cards. CSS flips placement + notch. |

### 6. GameGuide residuals

| Bug | Detail |
|-----|--------|
| **Scroll** | Switching tabs (1–9 / click) left content scrolled mid-page on long sections (EXPLORATION/CRAFTING). |
| **Tabs a11y** | Tabs lacked `role="tablist" / tab / tabpanel`, `aria-selected`, roving tabindex. |
| **Keys** | `parseInt(e.key)` alone accepted odd keys; no ←/→ cycle despite multi-tab handbook. |
| **Fix** | `contentRef.scrollTo(0)` on `activeTab`; tablist semantics + roving tabindex; digit-only 1–9; ArrowLeft/Right cycle + focus move; hint shows ←→. Escape unchanged. |

### 7. Victory layout residual (short viewport)

| Bug | Detail |
|-----|--------|
| **Confirmed** | Full-viewport shell from W6 was correct, but dual CTAs + story chips on short viewports could sit under the fold with no scroll on the content layer. |
| **Fix** | `.victory .scene-backdrop__content`: `overflow-y: auto`, `max-height: 100dvh`, `justify-content: safe center`. |

## W6 hold (verified, not reworked)

| Surface | Status |
|---------|--------|
| `useFocusTrap` on Reward / Rest / Intel / Dice / EventResult / LocationComplete / overlays / GameOver / Victory / Interlude | Present |
| Escape dismiss on continue-family modals | Present |
| Victory / Interlude full-viewport shell (max-width on panel only) | Present; Victory scroll residual closed above |
| SceneBackdrop path-gated bg (no parchment flash) | Present |

## Files touched

- `src/scenes/menu/MainMenu.tsx`
- `src/scenes/menu/Victory.tsx`
- `src/scenes/menu/Victory.css`
- `src/scenes/menu/CharacterSelect.tsx`
- `src/scenes/menu/CharacterSelect.css`
- `src/scenes/menu/GameGuide.tsx`
- `src/components/shared/Tooltip.tsx`
- `src/components/shared/shared.css`
- `src/styles/item-tile.css`
- `src/utils/itemTileTooltip.ts` **(new)**
- `src/scenes/activities/Merchant.tsx`
- `src/scenes/rewards/Loot.tsx`
- `.agents/swarm-grok/reports/A6-wave7-ux.md` (this file)

## Not fixed (not confirmed / out of minimal scope)

- TreasureChoice / TreasureHuntReward item-tiles not wired to `alignItemTileTooltip` (same pattern available if residual shows in treasure)
- Event choice-card host tooltips (event gold chrome; different family)
- Interlude Enter still confirms selected boon globally (by design; not dual-CTA steal)
- Full `inert` on background under modals (W6 note: trap sufficient)
- Portal tooltips remain `pointer-events: none` — tall sheets are height-capped; no in-tooltip scroll interaction

## Verification

- `npx tsc --noEmit` → **exit 0**
- No combat math changes
- No commit (per mandate)

## Success criteria

- [x] MainMenu Enter does not steal Handbook / Infinite keyboard activation  
- [x] Victory Enter does not force Gate when Infinite is focused  
- [x] CharacterSelect keyboard focus reveals clan loadout tooltip  
- [x] Portal tooltip max-height + vertical flip residual closed  
- [x] Item-tile top-of-viewport flip on Merchant / Loot  
- [x] GameGuide tab scroll reset + tab semantics + ←→ / 1–9  
- [x] Victory short-viewport content scroll residual closed  
- [x] tsc clean; no commit  
