# A7a WAVE3 — LOOT Production Finish

**Agent:** A7a WAVE3  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A7a-loot-items.md](./A7a-loot-items.md) · [A7a-wave2-loot.md](./A7a-wave2-loot.md)  
**Scope:** Empty-state voice · rarity bone/rust/fog hierarchy · keyboard/focus · EquipmentPanel/Bag void plates only. **No LootSystem balance.**

---

## Vision applied

| Doctrine | Wave3 implementation |
|----------|----------------------|
| Mysterious empty states | Merchant / Loot / Scroll / Bag synth / Equip empty use fog-voice, not "No items" |
| Rarity = palette hierarchy | Broken/common = metal·fog; rare·epic soft signals; **legendary = rust sole heat**; cursed danger red |
| Working rarity classes | `colorHelpers` abandoned dead Tailwind (`text-zinc-*`) → BEM `.rarity-text--*` global tokens |
| Void plates only | Bag + Equipment empty/filled slots leave zinc/glass gray for abyss radial plates |
| Keyboard honesty | Merchant Space+Enter select; loot/merchant `:focus-visible` rust ring; hunt reward cards `tabIndex={0}` for tooltips |

---

## Critical find

`getRarityTextColor` / `getRarityTextColorWithEffects` / `getRarityTextBorderColor` returned **non-existent Tailwind utilities** (`text-zinc-400`, `text-orange-400`, …). Project has **no Tailwind**. Bag tooltips, Equipment names, Treasure card names, craft-result `style={{ color }}`, and RewardModal loot names **did not apply rarity color**.

Fixed by:

1. Returning BEM tokens (`rarity-text--legendary`, …)
2. Defining global rarity text/border/bg + glow/pulse in `design-system/index.css`
3. Aligning CSS variables to bone/fog/rust (legendary → `--sw-rust-light`)

---

## Empty states (mysterious voice)

| Surface | Before | After |
|---------|--------|-------|
| Merchant stock empty | "The merchant has nothing left to sell." | **"The cart is bare"** + dust/reroll mist body |
| Loot all claimed | Flat subtitle only | Subtitle + **empty plate**: "Nothing left to take" |
| ScrollDiscovery empty | None | **"The seals are blank"** |
| Scroll skip CTA | "Leave without learning" | **"Leave the scrolls sealed"** |
| Bag synth no partner | Silent empty grid | **"No echo answers this piece…"** |
| Bag empty slot tooltip | "Empty void — drop gear here" | **"Hollow pocket — the mist holds nothing yet"** |
| Equip empty label | `"Empty"` | **"— vacant —"** |
| Equip empty tooltip | "Empty void — drop gear here" | **"A hollow groove — nothing worn here"** |
| Merchant preview empty slot | "(Empty Slot)" | **"— vacant groove —"** |

---

## Rarity hierarchy (tokens)

| Rarity | Token | Role |
|--------|-------|------|
| Broken | `#5a6570` metal-fog | Quiet scrap |
| Common | `--sw-fog` | Quiet baseline (no zinc) |
| Rare | soft steel-blue | Signal |
| Epic | soft violet | Signal |
| Legendary | `--sw-rust-light` | **Sole heat** |
| Cursed | muted blood | Danger |

---

## EquipmentPanel / Bag residual

### Void plates
- Bag chassis: abyss radial + rust border (was glass zinc surface)
- Bag empty slots: metal/abyss void (was glass-border gray)
- Equipment empty **and filled**: void radial plates (filled was plain black + glass-border)
- Primary slot: rust heat plate (not amber-tailwind)

### Menus / chrome
- Bag + equip menus: abyss panel + rust border (not `sw-bg-secondary` / glass)
- Craft dismiss / equip CTAs: rust + abyss (not zinc hex `#3f3f46`)
- Focus chips / F marks: rust heat (aligned with A6 tooltip Focus)

### Rarity wiring
- Craft result name: className rarity token (was broken inline `style={{ color: "text-…" }}`)
- RewardModal loot names: className rarity token

---

## Keyboard / focus

| Fix | Detail |
|-----|--------|
| Merchant cards | Enter **or Space** selects; `:focus-visible` rust outline |
| Loot cards | `:focus-visible` rust outline (already `tabIndex={0}` for tooltips) |
| TreasureHuntReward | Item + skill cards `tabIndex={0}` so keyboard focus opens item-tile tooltips |

Global `:focus-visible` already in design-system; scene-level rust rings match product chrome.

---

## Files touched

| File | Change |
|------|--------|
| `src/utils/colorHelpers.ts` | Rarity helpers → BEM tokens |
| `src/styles/design-system/_variables.css` | Rarity CSS vars bone/fog/rust hierarchy |
| `src/styles/design-system/index.css` | Global `.rarity-text/border/bg--*` + glow/pulse |
| `src/components/inventory/inventory.css` | Void plates, menus, focus rust, synth empty, no zinc |
| `src/components/inventory/Bag.tsx` | Empty tooltips, synth empty voice, craft rarity class |
| `src/components/inventory/EquipmentPanel.tsx` | Vacant voice on empty slots |
| `src/components/modals/RewardModal.tsx` | Rarity className fix |
| `src/scenes/activities/Merchant.tsx` | Empty voice, Space select, vacant preview |
| `src/scenes/activities/Merchant.css` | Empty plate styles, focus-visible, common→fog |
| `src/scenes/rewards/Loot.tsx` | Empty plate, broken name class, quiet victory voice |
| `src/scenes/rewards/Loot.css` | Empty styles, focus-visible, rarity name tokens |
| `src/scenes/rewards/ScrollDiscovery.tsx` | Subtitle voice, empty seals, skip CTA, chakra warning |
| `src/scenes/rewards/ScrollDiscovery.css` | Empty plate styles |
| `src/scenes/rewards/TreasureHuntReward.tsx` | `tabIndex={0}` on reward cards |

**Untouched (balance / systems):** `LootSystem.ts`, `synthesis.ts`, drop tables, merchant pricing.

---

## Constraints

- No LootSystem balance changes  
- No unit tests added  
- No git commit  
- `npx tsc --noEmit` → **exit 0**

---

## Manual QA checklist

1. Combat loot: claimed-all shows mist empty plate + Continue  
2. Merchant buy-out: cart bare plate; Reroll still works  
3. Merchant: Tab to card → Space/Enter selects; focus ring rust  
4. Bag empty slot hover: hollow-pocket voice  
5. Equip empty: "— vacant —" + groove tooltip  
6. Bag synthesize with no partner: "No echo answers…"  
7. Craft success: name colored by rarity (legendary rust heat)  
8. Treasure / hunt reward: Tab into card reveals tooltip  
9. Scroll discovery empty path / skip: sealed language  
10. Common vs legendary readable as fog vs rust  

---

## Follow-ups (out of scope)

- Room/combat danger helpers still use some Tailwind-ish class names in `colorHelpers` (non-loot)  
- ScrollDiscovery card shells still use `sw-bg-secondary` (skills agent territory)  
- Optional: full keyboard equip menu for bag slots without mouse  
