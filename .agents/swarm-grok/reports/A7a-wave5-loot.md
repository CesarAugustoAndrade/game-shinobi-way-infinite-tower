# A7a WAVE5 — LOOT Residual Minimal

**Agent:** A7a WAVE5  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A7a-loot-items.md](./A7a-loot-items.md) · [A7a-wave2-loot.md](./A7a-wave2-loot.md) · [A7a-wave3-loot.md](./A7a-wave3-loot.md) · [A7a-wave4-loot.md](./A7a-wave4-loot.md)  
**Scope:** Dead `w-4 h-4` / Tailwind size leftovers · zinc-# on loot path · merchant sold-out / can't-afford voice. **No LootSystem balance.**  
**Note:** ArtIcon BEM size tokens fixed W4 — re-audit only.

---

## Audit: dead Tailwind size classes

| Pattern | Loot / inventory / merchant path | Status |
|---------|----------------------------------|--------|
| `w-4 h-4` / `h-4 w-4` | **0 hits** (ArtIcon W4) | Clean |
| `w-5 h-5` | `TreasureChoice.tsx` Sparkles badge | **Fixed** → `size={20}` |
| `text-green-500` / `text-red-500` | Merchant afford icons | **Fixed** → BEM modifiers |
| `ml-1 text-amber-400` | Treasure artifact ★ | **Fixed** → `.treasure-card__artifact-star` |
| ArtIcon `SIZE_CLASS` | BEM only (`art-icon--xs`…`--fill`) | Clean (W4 hold) |

Post-fix re-grep on Merchant / Loot / Bag / Equipment / Treasure / Scroll / ArtIcon / item-tile / inventory: **no** `w-*` / `h-*` / `text-green-*` / `text-red-*` / `text-amber-*` / `zinc-*` class strings.

---

## Audit: zinc-# on loot path

| Surface | Result |
|---------|--------|
| `Merchant.tsx` / `.css` | No `zinc-*` classes |
| `Loot.tsx` / `.css` | No `zinc-*` classes |
| `inventory/*` / `item-tile.css` | No `zinc-*` classes |
| `TreasureChoice` / `treasure.css` | No `zinc-*` classes |
| `ScrollDiscovery` | No `zinc-*` classes |

**Out of scope (non-loot residual):** `App.tsx` shell zinc sidebars; `colorHelpers` / `tooltipFormatters` / `roomTypeMapping` / `helpText` still return or embed `text-zinc-*` / `bg-zinc-*` for non-loot chrome. Design-token wave / A8.

**Note:** Several loot CSS files still reference **semantic tokens** (`--sw-text-muted`, `--sw-glass-border`) whose underlying hex may be zinc-family. Wave4 already migrated confirm/void plates to bone/abyss/rust; full token remap is not this residual.

---

## Merchant sold-out / can't-afford voice

### Sold-out (empty stock) — already solid (W3)

| Surface | Copy |
|---------|------|
| Title | **The cart is bare** |
| Body | Dust settles where wares once waited. Reroll the stock — or walk on into the mist. |

No change — not thin.

### Can't afford — was thin / transactional

| Surface | Before | After |
|---------|--------|-------|
| Card BUY disabled | `CAN'T AFFORD` | **THIN PURSE** |
| Card shortfall | `Need {n} more` | **Purse short {n}** |
| Card tooltip shortfall | `Need` / `+{n} more` | **Purse** / `short {n}` |
| Preview confirm disabled | `Cannot Afford` | **Purse too thin** |
| Preview shortfall | `Short by {n} Ryo` | **Purse runs short — need {n} more Ryo** |
| Buy fail log | `Not enough Ryō! Need {price}.` | **Purse runs short — need {price} Ryō.** |

"Purse" language pairs with empty-cart dust voice and Waves lean-economy poverty UX without changing prices or stock rules.

### Dead afford icon colors

Merchant CheckCircle / AlertTriangle used dead Tailwind (`text-green-500` / `text-red-500` — no effect without Tailwind). Wired to:

- `.item-card__afford-indicator--ok` → `--sw-accent-tertiary`
- `.item-card__afford-indicator--risk` → `--sw-risk-high-light`

---

## Files touched

| File | Change |
|------|--------|
| `src/scenes/activities/Merchant.tsx` | Afford BEM classes; thin-purse voice on card/tooltip/preview |
| `src/scenes/activities/Merchant.css` | `--ok` / `--risk` afford indicator colors |
| `src/scenes/rewards/TreasureChoice.tsx` | Drop dead `w-5 h-5` / `text-amber-400` |
| `src/scenes/rewards/treasure.css` | `.treasure-card__artifact-star` + badge flex |
| `src/hooks/useActivityHandlers.ts` | Buy-fail log purse voice |

**Untouched:** `LootSystem.ts`, `synthesis.ts`, drop tables, merchant pricing, ArtIcon (W4 clean).

---

## Constraints

- No LootSystem balance changes  
- No unit tests added  
- No git commit  
- `npx tsc --noEmit` → **exit 0**

---

## Manual QA checklist

1. Merchant item unaffordable: button reads **THIN PURSE**; shortfall **Purse short N**  
2. Select unaffordable item: preview confirm **Purse too thin**; shortfall sentence with N  
3. Afford icons: green-tint check / risk-tint warning (not unstyled gray)  
4. Force buy fail (if possible): log **Purse runs short — need X Ryō.**  
5. Empty stock still **The cart is bare** + dust body  
6. TreasureChoice artifact card: Sparkles ~20px; ★ amber via CSS  
7. Bag / loot / ArtIcon sizes still BEM (no layout regression)

---

## Follow-ups (out of scope)

- Global `--sw-text-muted` / glass-border zinc hex remap (design-token wave)  
- App shell zinc sidebars (A8)  
- `colorHelpers` / `roomTypeMapping` zinc utilities outside loot  
- Merchant unaffordable buy button still uses `--sw-text-muted` / glass border tokens (semantic; optional risk-tint polish later)
