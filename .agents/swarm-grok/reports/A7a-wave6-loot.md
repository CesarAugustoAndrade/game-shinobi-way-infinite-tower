# A7a WAVE6 — LOOT Bug Hunt Minimal

**Agent:** A7a WAVE6  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A7a-loot-items.md](./A7a-loot-items.md) · [A7a-wave2-loot.md](./A7a-wave2-loot.md) · [A7a-wave3-loot.md](./A7a-wave3-loot.md) · [A7a-wave4-loot.md](./A7a-wave4-loot.md) · [A7a-wave5-loot.md](./A7a-wave5-loot.md)  
**Scope:** Broken synthesis preview · missing icons · merchant buy soft-lock · dead Tailwind on loot path. **Fix confirmed only. No LootSystem balance.**

---

## Hunt summary

| Target | Finding | Status |
|--------|---------|--------|
| Broken synthesis preview | Equipment **Synthesize** moved piece to bag + set `selectedComponent`, but Bag local `synthesisMode` never armed → no preview grid, no partner craft click | **Fixed** |
| Missing icons | `ArtIcon` sticky `imageError` after onError; switching art (merchant preview / synth rows / toasts) stayed on emoji | **Fixed** |
| Merchant buy soft-lock | Bag full still showed BUY / Confirm; double-click race could overwrite bag slots; card BUY ignored `isProcessing` | **Fixed** |
| Dead Tailwind (loot path) | `TreasureChoice` used `className="text-center"` (no Tailwind in project) | **Fixed** |

### Re-audit clean (no change)

| Area | Result |
|------|--------|
| Component icons (9) | On disk under `public/assets/icons/components/` |
| Artifact icons (45) | On disk; registry slugs match |
| ArtIcon size tokens | Still BEM (`art-icon--xs`…`--fill`) from W4 |
| Merchant zinc / afford voice | W5 hold |
| LootSystem / synthesis recipes | Untouched (no balance) |

---

## Fixes

### 1. Synthesis preview — equipment path

**Root cause:** `startSynthesisEquipped` only set parent `selectedComponent`. Bag keeps `synthesisMode` local and only sets it from bag menu **Synthesize / Upgrade**.

**Fix:**

- `startSynthesisEquipped` returns `boolean` success
- App bumps `bagSynthesisSession` on success
- Prop chain: App → RightSidebarPanel → Bag
- Bag `useEffect` on session token arms `synthesisMode`, clears menu/craft reveal

### 2. Missing icons — ArtIcon sticky error

**Root cause:** `imageError` never reset when `art` / `artKey` / `src` changed on a mounted instance (merchant preview switch, synthesis partners, toasts).

**Fix:** `useEffect` clears error on identity change; `key` on `<img>` forces reload for new src.

### 3. Merchant buy soft-lock

**Root causes:**

1. Bag full → UI still offered BUY / Confirm Purchase → click only logged fail (felt stuck)
2. Card BUY did not honor `isProcessing`
3. `buyItem` used stale `player` snapshot without sync mutex → double-click race

**Fix:**

- UI: `bagFull` disables buy; **BAG FULL** / preview **Bag full** copy; risk afford styling
- Card + preview gate: `canBuy = affordable && !bagFull && !isProcessing`
- Handler: ref mutex + functional `setPlayer`; unlock on fail; success unlock after 100ms

### 4. Dead Tailwind — treasure ryo bonus

**Before:** `<div className="text-center">` (no-op)  
**After:** `.ryo-bonus-wrap` flex center in `treasure.css`

---

## Files touched

| File | Change |
|------|--------|
| `src/hooks/useInventoryHandlers.ts` | `startSynthesisEquipped` → `boolean` |
| `src/hooks/useActivityHandlers.ts` | Merchant buy mutex + functional bag write |
| `src/App.tsx` | `bagSynthesisSession` + equip synth wrapper |
| `src/components/layout/RightSidebarPanel.tsx` | Pass `synthesisSession` |
| `src/components/inventory/Bag.tsx` | Arm synthesisMode from session |
| `src/components/shared/ArtIcon.tsx` | Reset imageError on art change |
| `src/scenes/activities/Merchant.tsx` | Bag-full + isProcessing buy gates |
| `src/scenes/rewards/TreasureChoice.tsx` | Drop dead `text-center` |
| `src/scenes/rewards/treasure.css` | `.ryo-bonus-wrap` |

**Untouched:** `LootSystem.ts`, `synthesis.ts`, drop tables, merchant pricing constants, artRegistry paths.

---

## Constraints

- No LootSystem balance changes  
- No unit tests added  
- No git commit  
- `npx tsc --noEmit` → **exit 0**

---

## Manual QA checklist

1. Equip a Common component → menu **Synthesize** → bag shows Result preview rows; click partner crafts  
2. Equip Broken → **Upgrade** path same; cancel clears mode  
3. Merchant: fill bag → cards show **BAG FULL**; Confirm disabled with bag-full copy  
4. Merchant: free a slot → BUY works; rapid double-click does not duplicate/overwrite  
5. Merchant: select different items in preview — art updates (not sticky emoji)  
6. Treasure hunter ryo bonus row is centered via CSS  
7. Bag menu Synthesize (non-equip path) still works unchanged  

---

## Follow-ups (out of scope)

- Mobile merchant: sidebars `hidden lg:flex` — bag management still desktop-biased  
- App shell still uses dead Tailwind layout classes (`h-screen`, `bg-zinc-*`) — A8 / layout  
- Global `--sw-text-muted` zinc hex remap (design-token wave)  
- Optional: lift `synthesisMode` fully into App instead of session token  
