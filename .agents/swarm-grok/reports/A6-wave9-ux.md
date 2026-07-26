# A6 WAVE9 — UX Production Verification

**Agent:** A6 WAVE9 (UX production verification)  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A6-wave8-ux.md](./A6-wave8-ux.md) (CharacterSelect Esc Infinite · tower height · end-screen Esc · void/rust Infinite CTAs)

## Goal

Production-verify **menus**, **tooltips**, **Escape**, and **Infinite path W8 fixes**. Fix **new** residual bugs only. Hold W7–W8. `tsc` clean. No commit.

## W8 hold (verified, not reworked)

| Surface | Status |
|---------|--------|
| CharacterSelect Esc / Mission Brief → `setPendingRunMode('campaign')` + MENU | Present (`App.tsx` onBack) |
| CharacterSelect `e.repeat` ignored on Esc / 1–5 | Present |
| CharacterSelect Infinite mode chip + Begin Ascent CTA + tip | Present |
| CharacterSelect short viewport `max-height: 100dvh` + `overflow-y: auto` + `safe center` | Present |
| GameOver Infinite `towerHeight={infiniteHeightFromFloor(infiniteFloor)}` (never 0) | Present |
| Victory Esc → Gate; GameOver Esc → Rise Again | Present |
| Victory / GameOver leave resets pending + runMode + floor | Present |
| MainMenu / Victory Infinite CTAs void/rust (not party purple) | Present |
| MainMenu + Victory Enter defers to focused `button` / `a` / `[role="button"]` | Present |
| Portal tooltip `max-height` + item-tile Merchant/Loot flip | Present (portal flip re-anchor fixed this wave) |
| CharacterSelect tooltip host wraps full clan card | Present |
| GameGuide tab scroll reset + ←→ / 1–9 + Esc | Present |

## Confirmed findings → fixes

### 1. Portal tooltip vertical flip re-anchored wrong edge (confirmed)

| Bug | Detail |
|-----|--------|
| **Confirmed** | W7 flip measured free space from the **preferred-side anchor point** and kept that point after flipping. Bottom→top still used `rect.bottom + 8` as the attachment, so `top = anchor − th` left tall sheets **overlapping the host** (clan loadout, dense HUD tips). CSS class still used pre-flip side. |
| **Fix** | Store host rect. Measure free space from **host top/bottom**. After flip, **re-resolve** anchor via `resolveAnchor(hostRect, pos)`. Placement state carries final `position` for CSS class / arrow. |

### 2. Treasure claim continue modal — Escape dead (confirmed)

| Bug | Detail |
|-----|--------|
| **Confirmed** | `TreasureChoice` claim dialog accepted Space/Enter only. Escape did nothing (keyboard soft-trap vs W6 continue-family). |
| **Fix** | Escape → `confirmClaim()` (parity RewardModal / Rest). Hint shows Esc. `e.repeat` ignored. |

### 3. Treasure hunt reward — Escape dead (confirmed)

| Bug | Detail |
|-----|--------|
| **Confirmed** | `TreasureHuntReward` claim accepted Space/Enter only; Esc dead. |
| **Fix** | Escape → `handleClaimOnce()`. Hint shows Esc. `e.repeat` ignored. |

### 4. Treasure item-tile tooltips — no top-of-viewport flip (confirmed)

| Bug | Detail |
|-----|--------|
| **Confirmed** | W7 residual: Merchant/Loot wired `alignItemTileTooltip`; TreasureChoice revealed cards + TreasureHuntReward item/skill cards still always opened **above** → first-row clip. |
| **Fix** | Wire `alignItemTileTooltip` on mouseenter + focus for those hosts (same util as Merchant/Loot). |

## Files touched

- `src/components/shared/Tooltip.tsx`
- `src/scenes/rewards/TreasureChoice.tsx`
- `src/scenes/rewards/TreasureHuntReward.tsx`
- `.agents/swarm-grok/reports/A6-wave9-ux.md` (this file)

## Not fixed (not confirmed / out of minimal scope)

- Interlude global Enter still confirms selected boon (by design; single primary action)
- Full `inert` under modals (W6: focus trap sufficient)
- Portal tooltips remain `pointer-events: none` — height-capped; no in-tooltip scroll interaction
- In-run ExplorationHUD still has no dedicated “Ascent N” chip (region name embeds `· Ascent N`)
- Infinite death still Gate-only (no one-click “Climb Again” — feature)
- Event choice-card host tooltips (event gold chrome; different family)

## Verification

- `npx tsc --noEmit` → **exit 0**
- No combat math changes
- No commit (per mandate)

## Success criteria

- [x] W8 Infinite path + CharacterSelect Esc + end-screen Esc held
- [x] Portal tooltip flip attaches to correct host edge after flip
- [x] Treasure claim + hunt reward Escape continue-family
- [x] Treasure item-tiles flip below when top space is tight
- [x] Menus / tooltips / Escape production residual hunt closed for confirmed bugs
- [x] tsc clean; no commit
