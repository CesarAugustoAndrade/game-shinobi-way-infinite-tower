# A6 — Tooltips & UX Product Language

**Agent:** A6 (Tooltips & UX product language)  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Vision anchors:** VISION-8 A6 — stage first; one tooltip language; shinobi voice not debug

## Goal

Unify combat / loot / merchant / HUD tooltips into one product chrome, and align menu/end-of-run screens to the same cinematic voice without spreadsheet or parchment leftover.

## What changed

### 1. One tooltip chrome (void / bone / rust)

| Surface | Before | After |
|---------|--------|-------|
| Portal `.tooltip` (`shared.css` + `Tooltip.tsx`) | Glass border, soft blur shadow, low z | **Abyss panel**, rust border, hard pixel shadow, `--sw-z-tooltip` |
| Item-tile popover (`item-tile.css`) | Soft glass / cyan tint / backdrop-filter | Same abyss + rust + hard shadow (no blur) |
| Combat tooltip content (`Combat.css`) | Glass dividers, mixed hex | Bone hierarchy, rust section titles/dividers |
| HUD buff tooltips (`character.css`) | Glass borders | Rust dividers, bone text |

**Design tokens** added in `_variables.css`:

- `--sw-abyss`, `--sw-abyss-panel`, `--sw-abyss-deep`
- `--sw-bone`, `--sw-bone-dim`, `--sw-bone-muted`
- `--sw-rust`, `--sw-rust-light`, `--sw-rust-border`, `--sw-rust-glow`

**Viewport clamp:** `Tooltip.tsx` measures the portal after open and clamps to the viewport (pad 8px). Pre-clamp CSS transforms still anchor; post-clamp uses absolute top/left + `tooltip--clamped`.

### 2. Product copy — shinobi voice

| Area | Change |
|------|--------|
| `tooltipFormatters.ts` | Buff/effect descriptions, mechanics lines, tips, damage/method blurbs — tactical shinobi, not debug dump |
| `PlayerHUD` / combat status tooltips | “What it does” / Blessing·Burden / From / Left — no “Mechanics” / “Tip:” prefix |
| `CharacterSheetOverlay` | Path marks · Lingering effects · This land favors |
| `MainMenu` | **Enter the Mist**; Mission Rank; rank blurbs cinematic |
| `CharacterSelect` | Choose Your Lineage; card CTA **Enter the Mist** |
| `GameOver` | Epitaph tone; **Rise Again**; marks you carried |
| `Victory` / `Interlude` | Same chrome language + CTAs (Return to the Gate / Claim one mark / Walk on) |
| `GameGuide` | Return to the Gate |
| `helpText.FIRST_RUN` | Aligned to new CTAs |

### 3. HUD / sheet product clarity

- Character sheet sections renamed away from spreadsheet labels.
- Explore overlay panel: abyss + rust frame (matches end screens).
- Victory / Interlude panels: abyss + rust chrome (not gold carnival border).

### 4. Parchment

- Center stage already void-shell (`.parchment-panel` legacy alias) — left intact; not reintroduced.

## Files touched

- `src/styles/design-system/_variables.css`
- `src/components/shared/Tooltip.tsx`
- `src/components/shared/shared.css`
- `src/styles/item-tile.css`
- `src/scenes/combat/Combat.css`
- `src/scenes/combat/Combat.tsx` (buff tooltip labels)
- `src/game/utils/tooltipFormatters.ts`
- `src/components/character/PlayerHUD.tsx`
- `src/components/character/character.css`
- `src/components/layout/CharacterSheetOverlay.tsx`
- `src/components/layout/exploreOverlays.css`
- `src/scenes/menu/MainMenu.tsx`
- `src/scenes/menu/CharacterSelect.tsx`
- `src/scenes/menu/GameOver.tsx`
- `src/scenes/menu/Victory.tsx`
- `src/scenes/menu/Victory.css`
- `src/scenes/menu/Interlude.tsx`
- `src/scenes/menu/Interlude.css`
- `src/scenes/menu/GameGuide.tsx`
- `src/game/constants/helpText.ts`
- `.agents/swarm-grok/reports/A6-tooltips-ux.md` (this file)

## Verification

- `npx tsc --noEmit` → **exit 0**
- No combat math changes
- No commit (per mandate)

## Residual / follow-ups

- Inventory bag/equipment “Drag to move - Click for actions” still slightly utility-voice (out of primary A6 menu/tooltip pass).
- Rank color helpers in formatters still use Tailwind class names (`text-red-500` etc.) — chrome is unified; color utility migration is optional cleanup.
- Item-tile is still host-scoped (not portal); clamp is implicit via card width — if tall tooltips clip near top of viewport, a future pass could portal item tooltips with the same clamp.
- MainMenu hero asset still Kyubi-era art; tone is product copy, not art swap.

## Success criteria (VISION-8 A6)

- [x] One tooltip language (combat portal + item-tile + HUD content)
- [x] Stage-first reveal doctrine preserved (surface name/rarity; depth in tooltip)
- [x] Trade-offs legible (cost/type/mechanics lines kept, voice fixed)
- [x] Menus / GameOver / Interlude / Victory same chrome vocabulary
- [x] Shinobi voice over debug voice on touched copy
