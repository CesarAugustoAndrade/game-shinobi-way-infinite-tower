# A6 WAVE3 — UX Production Finish

**Agent:** A6 WAVE3 (UX production finish)  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A6-wave2-ux.md](./A6-wave2-ux.md) (dual-language tooltips, HUD compact, coach voice)

## Goal

Delete dead parchment CSS, purge warm-beige text leftovers to void/abyss/bone/rust product chrome, finish GameGuide as a dark cinematic handbook, and ensure rust/bone focus rings on primary CTAs.

## What changed

### 1. Dead parchment CSS removed

| Check | Result |
|-------|--------|
| `.parchment-panel` in `*.tsx` | **0 callers** |
| Class only lived as void-shell alias in `App.css` | Deleted |

**Removed from `src/App.css`:**
- `.parchment-panel` / `::after` / `> *` full block
- Media-query companion for `.parchment-panel::after`

**Retained:** `.center-stage`, `.center-stage--explore`, `.center-stage--mission` (+ grit `::after` + reduced-motion). Center-stage is the sole stage chassis.

Comments that mention “parchment” as *negative design guidance* (e.g. “not parchment”) were left — not dead CSS.

### 2. Beige / warm-text leftovers → bone

All remaining `#f0e8d8` (warm parchment-adjacent bone) converted to `var(--sw-bone, #e8e4d9)`:

| File | Surface |
|------|---------|
| `Victory.css` | Victory CTA label |
| `Interlude.css` | Boon heading + continue CTA |
| `exploreOverlays.css` | Overlay close control |
| `inventory.css` | Bag toast name |
| `Merchant.css` | Merchant toast name |
| `Training.css` | Title / primary label |
| `Loot.css` | Loot primary label |
| `IntelResultModal.css` | Modal title |
| `LocationCompleteModal.css` | Modal title |
| `RestResultModal.css` | Modal title |
| `ExplorationHUD.css` | HUD labels (×2) |

Post-pass grep: **0** hits for `#f0e8d8`, `#f5f0e6`, or `.parchment-panel` under `src/`.

### 3. GameGuide — dark cinematic handbook

`GameGuide.css` residual chassis retuned to product language:

- **Stage:** void gradient + faint CRT scan grit (respects `prefers-reduced-motion`)
- **Container:** abyss-deep plate, rust border whisper, hard shadow + inset depth
- **Header:** abyss gradient, rust bottom edge, bone title
- **Icon plate:** rust-bg / rust border (not flat risk-red blot)
- **Back CTA:** abyss panel + rust border; hover bone; **focus-visible** rust+bone
- **Tabs:** muted bone idle → rust-dim active with bone label; **focus-visible** rust+bone
- **Content well:** soft abyss radial over abyss-deep; bone-dim body copy

Title/copy in TSX already “Shinobi Handbook” / “Return to the Gate” — unchanged.

### 4. Accessibility — rust/bone focus rings

| Layer | Change |
|-------|--------|
| Global `:focus-visible` | Amber → **rust** (`index.css`) |
| `.sw-button:focus-visible` | Rust outline + bone inner hairline |
| `.sw-card:focus-visible` | Rust outline (was amber) |
| `MainMenu` enter / secondary / infinite | Explicit rust+bone focus |
| `Victory` / `Interlude` / `GameOver` CTAs | Explicit rust+bone focus |
| `GameGuide` back + tabs | Explicit rust+bone focus |
| Region map Enter Location CTA | Explicit rust+bone focus when active |

`CharacterSelect` clan cards already had rust `focus-visible` (Wave prior) — left intact.

## Files touched

- `src/App.css`
- `src/styles/design-system/index.css`
- `src/styles/design-system/_components.css`
- `src/scenes/menu/GameGuide.css`
- `src/scenes/menu/MainMenu.css`
- `src/scenes/menu/Victory.css`
- `src/scenes/menu/Interlude.css`
- `src/scenes/menu/GameOver.css`
- `src/components/exploration/exploration.css`
- `src/components/layout/exploreOverlays.css`
- `src/components/layout/ExplorationHUD.css`
- `src/components/inventory/inventory.css`
- `src/scenes/activities/Merchant.css`
- `src/scenes/activities/Training.css`
- `src/scenes/rewards/Loot.css`
- `src/components/modals/IntelResultModal.css`
- `src/components/modals/LocationCompleteModal.css`
- `src/components/modals/RestResultModal.css`
- `.agents/swarm-grok/reports/A6-wave3-ux.md` (this file)

## Verification

- `npx tsc --noEmit` → **exit 0**
- No combat math changes
- No commit (per mandate)

## Residual / optional follow-ups

- Event continue still uses event-gold focus (`EventResultModal`) — intentional event chrome, not global product focus
- Infinite Ascent purple CTA keeps purple paint; focus ring is rust for consistency
- Comment-only “parchment” mentions in exploration/map docs remain as anti-pattern notes
