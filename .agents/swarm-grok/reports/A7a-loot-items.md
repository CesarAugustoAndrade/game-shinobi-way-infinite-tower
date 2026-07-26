# A7a — Loot & Items as Assets

**Agent:** A7a-loot-items  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Scope:** Presentation polish for loot / merchant / treasure item tiles; art fill wiring; Waves poverty readability. No new systems.

---

## Vision applied

| Doctrine | Implementation |
|----------|----------------|
| Item IS the asset | Cards lead with full-bleed art plates (`ArtIcon size="fill"`) |
| Stats on hover | Tooltips hold full comparison / skill depth; micro chips only on face |
| Void product language | Tooltips + cards use dark glass gradients, not parchment brown |
| TFT synthesis readable | Component tooltips list combine targets (name + mini art) |
| Waves poverty | Merchant surfaces lean economy, shortfall, purse-after |

---

## Critical find

`TreasureHuntReward.tsx` used `treasure-reward__*` classes with **zero CSS** in `treasure.css`. Master-hunt completion UI was effectively unstyled. Full reward layout styles added (header, cards grid, skill/ryo variants, claim actions).

---

## Changes by file

### Shared

| File | Change |
|------|--------|
| `src/styles/item-tile.css` | Void-glass tooltip; radial void visual plate (no gray empty box); `fill` art rules; synth list styles; optional stat chips |
| `src/components/shared/ArtIcon.tsx` | New `size="fill"` — parent-sized cover art for tile plates |

### Loot

| File | Change |
|------|--------|
| `src/scenes/rewards/Loot.tsx` | Fill art; synthesis recipe preview (top 4 + more); micro stat chips; skill card icon-first with tooltip depth |
| `src/scenes/rewards/Loot.css` | Glass card plate; full-width visual hero; type-icon alignment |

### Merchant

| File | Change |
|------|--------|
| `src/scenes/activities/Merchant.tsx` | Activity art portrait (`getActivityArt('merchant')`); lean-economy copy/chips; shortfall + after-buy on cards/preview; preview hero art |
| `src/scenes/activities/Merchant.css` | Cinematic NPC frame; lean styling; price risk/shortfall; glass preview panel |

### Treasure

| File | Change |
|------|--------|
| `src/scenes/rewards/TreasureChoice.tsx` | Fill art on revealed cards, bag-full, claim overlay |
| `src/scenes/rewards/TreasureHuntReward.tsx` | Fill item art; skill art via `getSkillArt` (was bare Scroll icon) |
| `src/scenes/rewards/treasure.css` | **Added complete `treasure-reward__*` styles** + plate sizing for claim/bag-full |

---

## Art wiring audit

- Components (9/9): `public/assets/icons/components/*.jpg` — present  
- Artifacts (spot-check + registry slug): `kubikiribocho`, `samehada`, `byakugo_seal`, `sages_scripture`, `konans_paper_wings`, `hokages_necklace` — present  
- Merchant activity: `public/assets/icons/activities/merchant.jpg` — present  
- **No image generation required** — registry paths already match on-disk JPG inventory  
- `resolveItemArt` / `getComponentArt` / `getArtifactArt` / `getSkillArt` unchanged logic (presentation-only)

---

## Waves merchant poverty UX

When `lootTheme.goldMultiplier < 1` (Waves Ryo×0.8):

- Header quote shifts to scarcity tone  
- Theme chip: `Ryo ×0.8 · Lean`  
- Note: “Wave poverty: prices hit hard…”  
- Unaffordable cards: `Need N more` + `CAN'T AFFORD`  
- Affordable + lean: residual purse when remaining < price  
- Preview panel risk border + shortfall / purse-after

Stock bias / Focus chips unchanged (T-090/T-091).

---

## Synthesis presentation

- Loot component tooltip: “Combine → N artifacts” with artifact mini-icons + names (cap 4, “+more on bag synthesize”)  
- Bag synthesis UI left intact (actual craft loop stays in inventory)

---

## Constraints respected

- No new game systems / LootSystem logic  
- No unit tests added  
- No git commit  
- `npx tsc --noEmit` — **clean (exit 0)**  
- SceneBackdrop already present on Loot / Merchant / Treasure — retained  

---

## Manual QA checklist

1. Combat victory → Loot: large item art, hover shows void tooltip + stat deltas; components show synth recipes  
2. Skill drop: art plate first; hover for full skill sheet; Learn/Replace still work  
3. Merchant (Waves): portrait image; lean banner when goldMultiplier 0.8; unaffordable shows shortfall  
4. Select item → preview shows hero art + price risk  
5. Treasure reveal: filled art on cards; claim overlay art  
6. Hunt complete: reward cards styled (not bare HTML); skills show skill art  

---

## Follow-ups (out of scope)

- Bag / EquipmentPanel dense slots still use `sm`/`xs` icons (OK for sidebar density)  
- Optional: rarity glow on loot visual plate edges  
- Optional: craft-result panel in Bag to `size="fill"` hero plate  
- No dead-code deletion beyond presentation paths  

---

## Verification

```
npx tsc --noEmit  → exit 0
```
