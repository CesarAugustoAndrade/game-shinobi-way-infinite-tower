# A6 WAVE8 — UX Final Residual Bug Hunt

**Agent:** A6 WAVE8 (UX final residual)  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A6-wave7-ux.md](./A6-wave7-ux.md) (MainMenu Enter · tooltip clamp · CharacterSelect focus tooltips)

## Goal

Hunt **new** residual bugs only on **CharacterSelect Esc** and the **Infinite Tower path**. Hold W7 MainMenu Enter deferral + portal/item-tile tooltip clamp. Fix confirmed only. `tsc` clean. No commit.

## Confirmed findings → fixes

### 1. CharacterSelect Esc left silent Infinite pending (confirmed)

| Bug | Detail |
|-----|--------|
| **Confirmed** | Menu → **Infinite Ascent** / Victory → **Infinite** set `pendingRunMode = 'infinite'`, then `CHAR_SELECT`. Esc / Mission Brief only called `setGameState(MENU)` — **pending mode stayed infinite**. |
| **Risk** | Gate re-entry kept a silent pending mode until the next explicit Campaign CTA overwrote it; hygiene hole on cancel path. |
| **Fix** | `onBack` now `setPendingRunMode('campaign')` then `MENU`. CharacterSelect Esc also ignores `e.repeat` so held Esc does not thrash parent state. |

### 2. CharacterSelect silent about Infinite Ascent (confirmed)

| Bug | Detail |
|-----|--------|
| **Confirmed** | Campaign and Infinite shared the same lineage screen: title, tip, and card CTA all said **Enter the Mist** with no mode chip. |
| **Fix** | `runMode={pendingRunMode}` prop. Infinite path shows **Infinite Ascent** status line + tower tip; card CTA / aria → **Begin Ascent**. Campaign copy unchanged. |

### 3. CharacterSelect short viewport clip (confirmed)

| Bug | Detail |
|-----|--------|
| **Confirmed** | `.char-select { overflow: hidden }` + centered 5-card grid could clip **Mission Brief** / Esc path and lower cards on short viewports (W7 fixed Victory scroll; CharacterSelect residual). |
| **Fix** | `max-height: 100dvh`, `overflow-y: auto`, `justify-content: safe center` — back control and cards remain reachable. |

### 4. Infinite GameOver Tower Height = 0 (confirmed)

| Bug | Detail |
|-----|--------|
| **Confirmed** | `towerHeight={computeTowerScore(regionsCompleted)}` → **0** when dying on first ascent floor (no boss cleared). Label “Tower Height” read as empty climb. |
| **Fix** | `infiniteHeightFromFloor(infiniteFloor)` (floor index + 1). First-floor death shows **1**; climbs track current ascent. Dropped unused `computeTowerScore` import from `App.tsx`. |

### 5. End-screen Esc residual on Infinite path (confirmed)

| Surface | Before | After |
|---------|--------|-------|
| **Victory** | Enter / I only; Esc dead | **Escape → Gate** (cancel before Infinite); hint keys Enter + Esc |
| **GameOver** | Enter only | **Escape → Rise Again** (parity continue-family); hint keys Enter + Esc |
| Both | Stale `runMode` / `infiniteFloor` / `pendingRunMode` after exit | Reset campaign pending + floor on Gate / Rise Again |

### 6. Infinite CTA party purple residual (confirmed)

| Surface | Before | After |
|---------|--------|-------|
| **MainMenu** Infinite Ascent | Neon purple plate (`#2a1040` / `#c44dff`) | Void gradient + rust border + bone label |
| **Victory** Infinite btn | Purple border / lilac text | Rust border / rust-light → bone hover |

Aligns Infinite entry chrome with product void/rust language (W3–W4 hold).

## W7 hold (verified, not reworked)

| Surface | Status |
|---------|--------|
| MainMenu Enter defers to focused `button` / `a` / `[role="button"]` | Present |
| Victory Enter same deferral (Infinite not forced to Gate) | Present |
| Portal tooltip max-height + vertical flip | Present |
| Item-tile top-of-viewport flip (Merchant / Loot) | Present |
| CharacterSelect tooltip host wraps full clan card | Present |
| GameGuide tab scroll + ←→ / 1–9 | Present |

## Files touched

- `src/scenes/menu/CharacterSelect.tsx`
- `src/scenes/menu/CharacterSelect.css`
- `src/scenes/menu/Victory.tsx`
- `src/scenes/menu/Victory.css`
- `src/scenes/menu/GameOver.tsx`
- `src/scenes/menu/MainMenu.css`
- `src/App.tsx`
- `.agents/swarm-grok/reports/A6-wave8-ux.md` (this file)

## Not fixed (not confirmed / out of minimal scope)

- In-run ExplorationHUD still has no dedicated “Ascent N” chip (region name already embeds `· Ascent N`)
- Infinite death still returns to Gate only (no one-click “Climb Again” — feature, not residual bug)
- TreasureChoice / event host tooltips (W7 residual note)
- Full `inert` under modals (W6 note)
- Interlude global Enter still confirms selected boon (by design)

## Verification

- `npx tsc --noEmit` → **exit 0**
- No combat math changes
- No commit (per mandate)

## Success criteria

- [x] CharacterSelect Esc cancels pending Infinite (mode reset to campaign)
- [x] CharacterSelect shows Infinite vs Campaign mode on lineage screen
- [x] CharacterSelect short viewport scrolls (Esc / Mission Brief reachable)
- [x] Infinite GameOver Tower Height never shows 0 on first-floor death
- [x] Victory / GameOver Esc leave end screens (Infinite path cancel / rise)
- [x] Infinite CTAs void/rust (not party purple)
- [x] W7 MainMenu Enter + tooltip clamp held
- [x] tsc clean; no commit
