# A7a WAVE2 — Loot / Items Residual

**Agent:** A7a WAVE2  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Scope residual:** gray-box / emoji-only / broken paths; synthesis StS-clear; SceneBackdrop retention. No LootSystem balance.

---

## Vision applied

| Doctrine | Wave2 implementation |
|----------|----------------------|
| Item IS the asset | ScrollDiscovery skill plates use void fill art; bag craft reveal uses hero plate |
| Result identity first (StS / TFT) | Bag synthesize options lead with result art + name; partner ingredients secondary |
| Void product language | Bag filled slots + scroll art plates leave zinc/gray for abyss radial plates |
| No balance churn | `LootSystem` / recipes / drop tables untouched |

---

## Audit findings

### Icons on disk vs registry

| Category | Status |
|----------|--------|
| Components (9) | All `public/assets/icons/components/*.jpg` present; registry wired |
| Artifacts (45) | Slug audit: 0 missing, 0 extra vs `ARTIFACT_META` |
| Activities (merchant / treasure / scroll_discovery) | Present |
| Skills (ScrollDiscovery) | 114 skill JPGs; `getSkillArt` + ArtIcon |

**Image generation:** not required — no critical component/artifact icons missing.

### Reward / merchant scenes (gray / emoji / paths)

| Scene | Wave1 | Wave2 residual |
|-------|-------|----------------|
| Loot | fill art, void tooltips, synth list | Partner chip on synth rows (result still first) |
| Merchant | fill art, poverty UX, activity portrait | No residual gray item tiles |
| TreasureChoice | fill art on cards / claim / bag-full | Unchanged; still SceneBackdrop |
| TreasureHuntReward | fill item + skill art + CSS | Unchanged; still SceneBackdrop |
| ScrollDiscovery | ArtIcon xl on gray primary plate | **Fixed:** void plate + `size="fill"` |
| Bag (synthesis) | Text/partner-first preview | **Fixed:** StS result-first rows + art tooltips |

No emoji-only item tiles remain in reward scenes (emoji only as ArtIcon onError cascade).

### SceneBackdrop retention

Confirmed still wrapping:

- `Loot.tsx`
- `Merchant.tsx` (activity, not under rewards/)
- `TreasureChoice.tsx` (all branches)
- `TreasureHuntReward.tsx`
- `ScrollDiscovery.tsx` (main + learn-result)

---

## Changes by file

### Synthesis — result identity first

| File | Change |
|------|--------|
| `src/components/inventory/Bag.tsx` | `craftResultArt()`; synthesis options show **result art + name + mode**, then `A + B →`; component tooltips list forge targets with result art + partner need; craft reveal uses fill plate |
| `src/components/inventory/inventory.css` | StS synthesis option layout; void bag filled slots; craft-result-plate; tooltip recipe rows |
| `src/scenes/rewards/Loot.tsx` | Synth tooltip: result name + art first, partner component chip second |
| `src/styles/item-tile.css` | `.item-tooltip__synth-result` / `__partner` styles |

### Residual gray / plate polish

| File | Change |
|------|--------|
| `src/scenes/rewards/ScrollDiscovery.tsx` | Skill card + learn-result use `ArtIcon size="fill"` |
| `src/scenes/rewards/ScrollDiscovery.css` | Void radial art plate (no `sw-bg-primary` gray box); cover fill |

### Untouched (audit clean)

- `LootSystem.ts` (balance / craft rules)
- `synthesis.ts` recipes
- `artRegistry.ts` (paths already correct)
- No new icons under `public/assets/icons/`

---

## Synthesis UX (before → after)

**Bag combine preview (synthesis mode)**

- Before: `+ [partner icon] - previewName` (partner-led, easy to misread)
- After:
  - Row hero: **[RESULT art] RESULT name** + mode (`Synthesize` / `Upgrade` / `Forge Epic`)
  - Secondary: selected + partner →

**Component tooltips (bag / loot)**

- Before: plain text recipe names
- After: `[artifact art] Artifact Name  +[partner art]` (result first)

**Craft reveal**

- Before: small `lg` icon
- After: void hero plate with `size="fill"` cover art

---

## Constraints respected

- No LootSystem balance overhaul  
- No unit tests added  
- No git commit  
- `npx tsc --noEmit` → **exit 0** (re-checked after parallel A4 type merge)

---

## Manual QA checklist

1. Loot component hover: Forge list shows artifact art/name first, partner chip on the right  
2. Bag → Synthesize on Common: preview lists **result** large; click partner crafts  
3. Bag tooltip on Common: forge rows with result art  
4. Craft success: purple void plate with full artifact art + Equip CTA  
5. Scroll Discovery: skill cards use filled void plates (not gray boxes)  
6. Loot / Merchant / Treasure / ScrollDiscovery still have biome SceneBackdrop  
7. Merchant Waves poverty chips still present (wave1, not regressed)

---

## Follow-ups (out of scope)

- Equipment dense slots still `xs` icons (sidebar density OK)  
- Optional rarity glow on loot visual plate edges  
- Optional: show full 36-recipe matrix UI (current cap 3–4 previews is intentional density)
