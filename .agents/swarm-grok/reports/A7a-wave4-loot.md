# A7a WAVE4 — LOOT Residual Small Polish

**Agent:** A7a WAVE4  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A7a-loot-items.md](./A7a-loot-items.md) · [A7a-wave2-loot.md](./A7a-wave2-loot.md) · [A7a-wave3-loot.md](./A7a-wave3-loot.md)  
**Scope:** Residual zinc/gray · ArtIcon real size tokens · take/leave loot voice. **No LootSystem balance.**

---

## Vision applied

| Doctrine | Wave4 implementation |
|----------|----------------------|
| Item IS the asset | ArtIcon sizes are real CSS — bag/equip/synth chips no longer rely on dead Tailwind |
| Void product language | Confirm panel, loot action buttons, merchant preview plates leave zinc hexes for abyss/metal/rust |
| Mysterious voice | Take / leave spoils language aligned with empty-plate mist copy |
| No balance churn | `LootSystem` / recipes / drops untouched |

---

## Critical find

`ArtIcon` size map used **non-existent Tailwind utilities** (`w-4 h-4`, `w-5 h-5`, `text-2xl`, `object-cover`, `image-pixelated`, …). Project has **no Tailwind**.

| Size | Before (dead) | After (BEM) |
|------|---------------|-------------|
| xs | `w-4 h-4` / `text-sm` | `.art-icon--xs` (1rem) |
| sm | `w-5 h-5` / `text-base` | `.art-icon--sm` (1.25rem) |
| md | `w-8 h-8` / `text-2xl` | `.art-icon--md` (2rem) |
| lg | `w-12 h-12` / `text-4xl` | `.art-icon--lg` (3rem) |
| xl | `w-16 h-16` / `text-5xl` | `.art-icon--xl` (4rem) |
| fill | `art-icon--fill` (worked) | unchanged + global token |

**Impact on R1 loot path:** bag slots, equip name rows, synth recipe chips, toasts, and dense tooltips used xs/sm/md. Without width/height, component/artifact JPGs either blew layout or collapsed into empty void plates. Global `.art-icon--*` tokens + bag slot `max-width/height` + `overflow: hidden` ensure art always reads.

Emoji cascade unchanged (`src` → onError → emoji → `?`).

---

## Residual zinc / gray hunt (loot path)

| Location | Before | After |
|----------|--------|-------|
| `Loot.css` confirm cancel | `#3f3f46` / `#52525b` / `#e4e4e7` | metal · abyss · bone |
| `Loot.css` confirm panel | `sw-bg-secondary` zinc plate | abyss panel + rust border |
| `Loot.css` equip/sell/replace | `sw-bg-primary` + glass zinc border | void + metal/rust border |
| `Loot.css` leave btn | `sw-text-muted` zinc | bone-muted + rust underline hover |
| `inventory.css` toast detail | `#a1a1aa` zinc | `--sw-bone-muted` |
| Merchant item frame | solid `sw-bg-secondary` | void radial plate |
| Merchant preview blocks | `sw-bg-tertiary` + glass | void fill + metal border |
| Merchant glass dividers | `sw-glass-border` | rust-border soft |
| Bag synth / tooltip chips | black-gray under-glyph | void under-glyph |

**Out of scope (non-loot):** `App.tsx` shell zinc, `colorHelpers` danger helpers, global `--sw-text-*` zinc scale, treasure card shells still on `sw-bg-*` (optional later).

---

## Take / leave voice (consistent)

| Surface | Before | After |
|---------|--------|-------|
| Subtitle (has spoils) | Claim each reward | **Take each spoil** |
| Empty plate | Nothing left to take | (kept) |
| Footer / empty | Continue | **Step onward** |
| Footer / remaining | Leave All | **Leave the spoils** |
| Keyboard hint | Leave / Continue | matches footer |
| Confirm body | Leave now and they are lost | **Walk away and the mist keeps them** |
| Confirm cancel | Cancel | **Keep taking** |
| Confirm leave | Leave anyway | **Leave them behind** |

“Take” language on the field pairs with empty “Nothing left to take” and confirm “Keep taking”. “Leave the spoils” pairs with empty-body mist reclaim.

---

## Files touched

| File | Change |
|------|--------|
| `src/components/shared/ArtIcon.tsx` | Dead Tailwind → BEM size classes |
| `src/styles/design-system/index.css` | Global `.art-icon` / `--xs…--xl` / `--fill` / `--emoji` |
| `src/styles/item-tile.css` | Synth chip `.art-icon` sizing + void underplate |
| `src/components/inventory/inventory.css` | Bag slot art fill, toast bone, synth/recipe art-icon, equip name row |
| `src/components/inventory/Bag.tsx` | Drop dead `inline-block align-middle mr-1` → `bag__tooltip-art` |
| `src/components/inventory/EquipmentPanel.tsx` | Drop dead `inline-flex…` → `equipment-panel__slot-name-row` |
| `src/scenes/rewards/Loot.tsx` | Take/leave voice consistency |
| `src/scenes/rewards/Loot.css` | Zinc confirm/actions/leave → abyss/metal/rust |
| `src/scenes/activities/Merchant.css` | Residual void plates + bone labels on preview/services |

**Untouched:** `LootSystem.ts`, `synthesis.ts`, drop tables, artRegistry paths, balance.

---

## Constraints

- No LootSystem balance changes  
- No unit tests added  
- No git commit  
- `npx tsc --noEmit` → **exit 0**

---

## Manual QA checklist

1. Combat loot: component cards show full-bleed art (fill) — no empty gray plate  
2. Bag: common/broken components show JPG (or emoji) sized inside void slot  
3. Equip row: xs icon + name aligned; vacant still “— vacant —”  
4. Bag tooltip forge rows: result art + partner chip sized  
5. Synth preview: result art sm + ingredient xs  
6. Bag toast equip/sell: art plate 2.25rem, detail bone-muted  
7. Loot leave with unclaimed → confirm mist voice → Leave them behind / Keep taking  
8. Loot all claimed → “Step onward” footer + empty plate  
9. Merchant preview: description/stats/price void plates, not zinc gray  
10. Merchant stock art still fill; leave shop unchanged  

---

## Follow-ups (out of scope)

- Global `--sw-text-secondary/tertiary/muted` still zinc hexes (design-token wave)  
- Treasure `sw-bg-*` card shells (treasure residual)  
- App shell zinc sidebars (layout / A8)  
- Optional: bag slots use `size="fill"` inside constrained plate for larger hero icons  
