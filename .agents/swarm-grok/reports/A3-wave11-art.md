# A3 WAVE11 — ARTE / camera production smoke

**Agent:** A3 WAVE11 (art/camera)  
**Date:** 2026-07-23  
**Branch:** develop (**no commit**)  
**Scope:** Production smoke only — residual parchment, always-on backgrounds, R1 lamina resolution. No Imagine gen (R1 polish ceiling; human playtest gate).

---

## Verdict: **CLEAN**

| Check | Result | Evidence |
|-------|--------|----------|
| Live `.parchment-panel` TSX callers | **0** | Grep `parchment-panel` / `className=.*parchment` across `*.{tsx,ts,css}` — no matches |
| Dead parchment CSS | None present | CHANGELOG notes void-alias; class fully absent from CSS tree (not only unused) |
| Always-on backgrounds (7 stages) | **PASS** | Matrix below |
| R1 lamina resolution 14/14 | **PASS** | All biomes → slug → disk plates |
| Blank-stage risk | **NONE** | Void underlay + plate fallbacks everywhere |
| public/assets ↔ assets mirror | **OK** | 14 location + 14 mid + 14 fg both trees; map exploring BG both |
| Code / CSS fixes this wave | **0** | No bugs found |
| New images | **0** | Ceiling respect |

---

## 1. Parchment residual

| Surface | Finding | Action |
|---------|---------|--------|
| TSX `className` / string `'parchment-panel'` | **0 live callers** | None |
| CSS `.parchment-panel` definition | **Absent** (not even dead alias on disk) | Leave — nothing to kill |
| Comment-only “parchment” mentions | `App.css`, `SceneBackdrop*`, `RegionMap.tsx`, `exploration.css` | Keep (docs / anti-regression notes) |
| `.sw-bg--guide` parchment/scroll feel | Design-token utility in `_backgrounds.css` only | **No TSX callers** — not painted on active R1 screens |
| Beige / warm paper hex on active stages | **None** found on center-stage / maps / combat / economy | N/A |

**Residual list:** none for live parchment. Optional later: delete unused `.sw-bg--guide` if design-system hygiene wave runs (OOS; not a blank-stage risk).

---

## 2. Always-on backgrounds matrix

| Screen | Underlay | Painted plate | Mechanism | Empty beige? |
|--------|----------|---------------|-----------|--------------|
| **RegionMap** | `#050608` + scrim | `background_map_exploring.png` (arc map + fallback stack) | Inline style + `center-stage--explore` | No |
| **LocationMap** | `#050608` + scrim | `resolveLaminaPaths(biome).background` → map exploring fallback | `locationStageBg` useMemo | No |
| **Combat** | `.cinematic` void gradient `#1a2633→#050608` + `center-stage--mission` | Lámina 1/2/3 via `combatLamina` | `CinematicViewscreen` onLoad/onError path-gated | No |
| **Event** | SceneBackdrop void gradient + mission stage | `combatBackground` (location plate) | `<SceneBackdrop background={…} dim={0.32}>` | No |
| **Loot** | SceneBackdrop + mission stage | `combatBackground` | SceneBackdrop | No |
| **Merchant** | SceneBackdrop + mission stage | `combatBackground` | SceneBackdrop | No |
| **Rest** | N/A full scene — **modal** over LOCATION_EXPLORE | Map stage remains under modal | `RestResultModal`: void scrim `rgba(5,6,8,0.72)` + abyss/void panel | No |

### Shell flags (`App.tsx`)

- `center-stage` base: `background-color: #050608` + void/abyss gradients (`App.css`).
- `isExplorationMap` → `center-stage--explore` (map plate underlay).
- `isMissionScene` → COMBAT | EVENT | ELITE_CHALLENGE | LOOT | MERCHANT | TRAINING | SCROLL_DISCOVERY | TREASURE | TREASURE_HUNT_REWARD → `center-stage--mission`.

### Biome plate always resolved

```ts
// App.tsx combatLamina
const biome = currentLocation?.biome || region?.biome || 'Coastal Harbor';
return resolveLaminaPaths(biome);
```

Empty/missing biome → `DEFAULT_BIOME_SLUG = 'coastal_harbor'` inside `resolveLaminaPaths`.

---

## 3. R1 lamina resolution (14 location slugs)

Source biomes: `src/game/constants/regions/landOfWaves.ts` (13 locations + region biome; 14 unique biome strings).

| Biome display name | Slug | location_ | lamina_mid_ | lamina_fg_ |
|--------------------|------|-----------|-------------|------------|
| Coastal Harbor | `coastal_harbor` | ✓ | ✓ | ✓ |
| Foggy Shoreline | `foggy_shoreline` | ✓ | ✓ | ✓ |
| Dense Forest | `dense_forest` | ✓ | ✓ | ✓ |
| Underground Cavern | `underground_cavern` | ✓ | ✓ | ✓ |
| Rural Village | `rural_village` | ✓ | ✓ | ✓ |
| River Banks | `river_banks` | ✓ | ✓ | ✓ |
| Shipwreck | `shipwreck` | ✓ | ✓ | ✓ |
| Great Bridge | `great_bridge` | ✓ | ✓ | ✓ |
| Fortified Camp | `fortified_camp` | ✓ | ✓ | ✓ |
| Ruined Estate | `ruined_estate` | ✓ | ✓ | ✓ |
| Secret Harbor | `secret_harbor` | ✓ | ✓ | ✓ |
| Underwater Temple | `underwater_temple` | ✓ | ✓ | ✓ |
| Fortified Mansion | `fortified_mansion` | ✓ | ✓ | ✓ |
| Mist Covered Bridge | `mist_covered_bridge` | ✓ | ✓ | ✓ |

- **Resolver:** `getBiomeSlug` + `BIOME_SLUG_ALIASES` + default → `resolveLaminaPaths` (`src/utils/colorHelpers.ts`, `LAMINA_ASSET_REV=r2wave2a3`).
- **Disk:** `public/assets` and root `assets/` both hold 14×3 = **42** plates + `background_map_exploring.png`.
- **SceneBackdrop / CinematicViewscreen:** layers opacity 0 until `onLoad`; `onError` hides layer → void gradient remains (no broken-image flash, no beige).

Aliases present (prose safety only; R1 data already uses canonical names):  
`misty_beach→foggy_shoreline`, `the_bridge→great_bridge`, `gato_mansion→fortified_mansion`, `sunken_wreck→shipwreck`, `fishing_village→rural_village`, `coastal_forest→dense_forest`, `the_docks→coastal_harbor`, etc.

---

## 4. Mirror / critical path gaps

| Asset class | public/assets | assets/ | Gap? |
|-------------|---------------|---------|------|
| location_*.png (R1) | 14 | 14 | No |
| lamina_mid_*.png | 14 | 14 | No |
| lamina_fg_*.png | 14 | 14 | No |
| background_map_exploring.png | present | present | No |

**No mirror action required.**

---

## 5. Fixes applied

**None.** Smoke found no blank-stage or live parchment callers.

---

## 6. Residual backlog (not WAVE11 work — ceiling)

Per `out-of-scope.md` / WAVE10: human playtest is the gate. Residual polish (not blockers):

1. Optional soft-share enemy uniqueness (river_bandit / hidden_guard / elite_mercenary).
2. 21 endgame skill imagine-jpg → painted (post-R1).
3. ~36 side-event plates still jpg/reuse.
4. R2+ enemy cast plates.
5. Cosmetic: remove unused `.sw-bg--guide` if design-system sweep.

**R1 laminas:** closed (WAVE2, reconfirmed WAVE10 + WAVE11).  
**Parchment chassis:** closed (no live callers; shell is void/mission/explore).  
**Always-on stage plates:** closed.

---

## 7. Files inspected (read-only)

- `src/utils/colorHelpers.ts` — `resolveLaminaPaths` / aliases / default
- `src/components/layout/SceneBackdrop.tsx` + `.css`
- `src/components/layout/CinematicViewscreen.tsx` + `.css`
- `src/components/exploration/RegionMap.tsx`, `LocationMap.tsx`
- `src/App.tsx` (center-stage flags, combatLamina, scene `background=` wiring)
- `src/App.css` (center-stage void / explore / mission)
- `src/game/constants/regions/landOfWaves.ts` (14 biomes)
- `src/components/modals/RestResultModal.css`
- Disk: `public/assets` + `assets` lamina + map plates

**No git commit. No `git add`.**
