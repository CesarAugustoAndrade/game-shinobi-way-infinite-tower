# A6 WAVE6 — UX Bug Hunt Minimal

**Agent:** A6 WAVE6 (UX bug hunt minimal)  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A6-wave5-ux.md](./A6-wave5-ux.md) (Training/ScrollDiscovery residual tone)

## Goal

Hunt only: modal without Escape · focus trap · parchment flash · broken CTAs on GameOver / Victory / Interlude. Fix confirmed bugs only. `tsc` clean. No commit.

## Confirmed findings → fixes

### 1. Modal without Escape (confirmed)

| Modal | Before | After |
|-------|--------|-------|
| **RewardModal** | Space / Enter only | + **Escape** → close (parity Rest/Intel) |
| **EventResultModal** | Space / Enter only | + **Escape** → close; hint shows Esc |
| **LocationCompleteModal** | Space / Enter only | + **Escape** → continue |
| **DiceRollResultModal** | Space / Enter after roll | + **Escape** after result; hint shows Esc |
| Rest / Intel | Already Escape | Unchanged (reference) |

Continue-family modals treat Escape as dismiss/continue (not cancel-with-side-effects).

### 2. Focus trap (confirmed absent)

`aria-modal="true"` was present on dialogs, but **Tab still escaped** into map/HUD controls under fixed overlays. No shared trap existed.

| Change | Detail |
|--------|--------|
| **New** `src/hooks/useFocusTrap.ts` | Focus first focusable on open; cycle Tab / Shift+Tab inside root; restore prior focus on unmount |
| Wired on | Reward, EventResult, LocationComplete, Dice, Rest, Intel, InventoryOverlay, CharacterSheetOverlay, GameOver, Victory, Interlude |
| **autoFocus** | Primary CTA (or first boon / close control) so trap has a real initial target |
| Overlay backdrops | `tabIndex={-1}` so Tab does not land on full-screen dismiss plates |

### 3. Parchment / warm flash (SceneBackdrop)

`SceneBackdrop` painted biome `<img>` at opacity **0.48 immediately** (no load gate), unlike `CinematicViewscreen`. Path changes could flash incomplete / wrong layer over void plate.

| Fix | Detail |
|-----|--------|
| Path-gated ready/error | `bgReadyPath` / `bgErrorPath` (parity cinematic) |
| CSS | `.scene-backdrop__bg` starts `opacity: 0; visibility: hidden` |
| Ready | `.scene-backdrop__bg--ready` → opacity 0.48 (+ dim override when ready) |
| Underlay | Void/abyss gradient always paints first — no bare/warm chassis flash |

### 4. Broken CTAs — GameOver / Victory / Interlude (confirmed layout)

| Screen | Bug | Fix |
|--------|-----|-----|
| **Victory** | Root `max-width: 36rem` constrained **entire** SceneBackdrop; panel stuck top-left; backdrop not full viewport | Full `100dvh` shell; flex center content; **max-width on panel only** |
| **Interlude** | Same pattern at 48rem | Same full-viewport shell + panel max-width |
| **GameOver** | Viewport shell already correct | Focus trap + `autoFocus` on Rise Again (CTA was functional) |
| All three | No focus management | `useFocusTrap` + primary CTA / first boon autofocus |

Handlers (`onRetry` / `onMenu` / `onChooseBoon` / `onStartInfinite`) were already wired in `App.tsx` — no logic rewrite.

## Files touched

- `src/hooks/useFocusTrap.ts` **(new)**
- `src/components/layout/SceneBackdrop.tsx`
- `src/components/layout/SceneBackdrop.css`
- `src/components/modals/RewardModal.tsx`
- `src/components/modals/EventResultModal.tsx`
- `src/components/modals/LocationCompleteModal.tsx`
- `src/components/modals/DiceRollResultModal.tsx`
- `src/components/modals/RestResultModal.tsx`
- `src/components/modals/IntelResultModal.tsx`
- `src/components/layout/InventoryOverlay.tsx`
- `src/components/layout/CharacterSheetOverlay.tsx`
- `src/scenes/menu/GameOver.tsx`
- `src/scenes/menu/Victory.tsx`
- `src/scenes/menu/Victory.css`
- `src/scenes/menu/Interlude.tsx`
- `src/scenes/menu/Interlude.css`
- `.agents/swarm-grok/reports/A6-wave6-ux.md` (this file)

## Not fixed (not confirmed / out of minimal scope)

- ApproachSelector Escape already present — left alone  
- Full `inert` on background tree under modals (trap is sufficient for Tab)  
- Interlude still requires select-then-Enter (by design; not a broken CTA)  
- Combat / loot confirm Escape paths already present  

## Verification

- `npx tsc --noEmit` → **exit 0**
- No combat math changes
- No commit (per mandate)

## Success criteria

- [x] Continue modals accept Escape where Rest/Intel already did  
- [x] Dialog focus trap + autofocus on modal family + end screens + explore overlays  
- [x] SceneBackdrop no load-path parchment/broken flash  
- [x] Victory / Interlude full-viewport CTAs (GameOver autofocus parity)  
- [x] tsc clean; no commit
