# A6 WAVE2 — Tooltips & UX Residual

**Agent:** A6 WAVE2 (Tooltips & UX residual)  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A6-tooltips-ux.md](./A6-tooltips-ux.md) (Wave1 — portal/item-tile abyss chrome, clamp, menu CTAs)

## Goal

Close dual-language tooltip leftovers (glass blur vs hard void), finish menu/HUD residual polish, re-voice coach/help lines as mysterious cyber-ninja (not tutorial shonen), and ensure `prefers-reduced-motion` on animations we touch.

## What changed

### 1. Dual-language tooltip hunt → unified abyss chrome

| Surface | Residual | Fix |
|---------|----------|-----|
| Bag tooltips (`inventory.css` + `Bag.tsx`) | Glass dividers, purple focus, utility “Drag to move” | Bone/rust hierarchy; Focus in rust; “Fence / forge / drag to shift” voice |
| Equipment tooltips (`inventory.css` + `EquipmentPanel.tsx`) | Same glass + utility | Matched bag; “unmake” / empty void |
| Drag preview (`layout.css`) | `backdrop-filter: blur(8px)` glass | Hard abyss plate + pixel shadow |
| Stat bar track (`shared.css`) | Glass border + blur | Abyss track + rust border (no blur) |
| Hand combat sections (`Hand.tsx`) | Spreadsheet labels (Damage / Hit Chance / Cost / Effects) | Force · Precision · Toll · Marks; stance lock |
| Item-tile popover | Transform open without reduced-motion | `@media (prefers-reduced-motion: reduce)` |

Portal `.tooltip` + item-tile chrome from Wave1 left intact (already void/rust/bone).

### 2. Menus residual

| Screen | Residual | Fix |
|--------|----------|-----|
| **GameOver** | `sw-bg-secondary` panel (could flash warmer vs Victory) | Abyss-deep panel + death-red frame; bone text; rust hint divider; reduced-motion on vignette/icon/CTA |
| **Victory** | Already abyss/rust | `prefers-reduced-motion` on buttons |
| **Interlude** | Already abyss/rust | `prefers-reduced-motion` on boon/continue |
| **MainMenu / CharacterSelect** | CTAs already “Enter the Mist” | CharSelect tip: “Unknown path? Uzumaki endures…” |
| **RegionMap** | Utility coach + “Select a Card First” | “Mark a Path First”; coach: “The path waits. Mark a card (1–3)…” |
| **LocationMap** | Tutorial coach | “You stand in the glow. Press Enter Room — or branch above” |

No parchment hex (#f5f0e6) remaining in menu CSS; legacy `.parchment-panel` still void-shell alias.

### 3. PlayerHUD combat dock (StS hand + DD stress)

Compact command-bar HUD (`character.css`):

- Abyss panel + rust border + hard inset shadow (not glass gradient strip)
- Bone name / muted mono labels
- Hard stress tracks (HP/CP) — no frosted fill glow
- XP sliver uses rust heat
- Path marks tooltip: “Path marks from choices this run”

Readability first without spreadsheet chrome.

### 4. helpText / coach — cyber-ninja tone

- `HELP_TEXT.EXPLORATION.FIRST_RUN` — mysterious path language; CTAs preserved (Enter the Mist / Enter Location / Enter Room)
- App first-run log: “The mist opens. Mark a path (1–3) → Enter Location → cut toward Gato’s Compound.”
- Region / location coaches as above
- Bag footer: “Drag to shift or equip · click to act · right-click to fence”

### 5. prefers-reduced-motion

Added/extended on: GameOver (pulse, float, CTA lift), Victory buttons, Interlude boon/continue, item-tile tooltip transition.  
Already present: MainMenu, CharacterSelect, SceneBackdrop, CinematicViewscreen, FloatingText, App center-stage.

### 6. tsc hygiene (blocking)

- `Bag.tsx`: typed `getCompatibleRecipes` return to include `recipe` tuple (was `{ name: string }[]` vs ArtifactDefinition usage)
- `wavesArcEvents.ts`: `Rarity.UNCOMMON` → `Rarity.COMMON` (enum has no UNCOMMON; blocked clean tsc — events agent residual)

## Files touched

- `src/components/inventory/inventory.css`
- `src/components/inventory/Bag.tsx`
- `src/components/inventory/EquipmentPanel.tsx`
- `src/components/layout/layout.css`
- `src/components/shared/shared.css`
- `src/components/character/character.css`
- `src/components/character/PlayerHUD.tsx`
- `src/components/combat/Hand.tsx`
- `src/styles/item-tile.css`
- `src/scenes/menu/GameOver.css`
- `src/scenes/menu/Victory.css`
- `src/scenes/menu/Interlude.css`
- `src/scenes/menu/CharacterSelect.tsx`
- `src/components/exploration/RegionMap.tsx`
- `src/components/exploration/LocationMap.tsx`
- `src/game/constants/helpText.ts`
- `src/App.tsx`
- `src/game/constants/events/wavesArcEvents.ts` (tsc only)
- `.agents/swarm-grok/reports/A6-wave2-ux.md` (this file)

## Verification

- `npx tsc --noEmit` → **exit 0**
- No combat math changes
- No commit (per mandate)

## Residual / follow-ups

- Combat deck CRT `backdrop-filter: blur(3px)` on chassis intentionally kept (visor, not tooltip chrome)
- Rank color helpers still use Tailwind-ish utility classes in formatters (optional)
- Item-tile still host-scoped (not portal-clamped); tall tooltips near viewport top can clip
- Handbook STATS/EFFECTS body text still technical (reference manual, not first-run coach)
- MainMenu hero still Kyubi-era art (copy tone only)

## Success criteria

- [x] No dual glass-blur vs blocky tooltip language on bag/equipment/drag/stat tracks
- [x] Menus / GameOver / Victory / Interlude consistent abyss + cinematic CTAs; no parchment flash
- [x] Combat dock stress readable (void plate + hard bars) without spreadsheet feel
- [x] Coach / FIRST_RUN / bag hints mysterious cyber-ninja
- [x] prefers-reduced-motion on new/touched animations
- [x] tsc clean; no commit
