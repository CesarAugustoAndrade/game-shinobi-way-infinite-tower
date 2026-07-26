# A3 WAVE13 — cinematic shell REGRESSION (post-WAVE12)

**Agent:** A3 WAVE13 (cinematic shell regression)  
**Date:** 2026-07-23  
**Branch:** develop (**no commit**)  
**Scope:** REGRESSION ONLY of WAVE12 shell claims. Art ceiling holds.  
**Ceiling:** No Imagine. No new art. Fix ONLY if NEW blank-stage / missing critical path after WAVE12 landings.

---

## Verdict: **CLEAN**

| Check | Result | Evidence |
|-------|--------|----------|
| Live parchment TSX callers | **0** | Grep `parchment` / `parchment-panel` / `background_parchment` / `className=.*parchment` in `*.{tsx,ts}` — comments only |
| Menu→Clan→Region→Location→Combat/Event/Loot void underlay | **PASS** | All stages pin `#050608` / abyss→void gradient; no beige flash hex on active stages |
| Laminas mid/fg + location plates | **14/14 × 3** | Both `public/assets` and `assets` trees |
| Map exploring BG + shell critical plates | **OK** | Present both trees |
| New blank-stage / missing critical path post-WAVE12 | **NONE** | App.tsx shell flags + combatLamina wiring intact |
| Code / CSS fixes this wave | **0** | Prefer CLEAN — nothing to fix |
| New images | **0** | Ceiling respect |

**Prefer verify-only → satisfied. No fixes applied.**

---

## 1. Live parchment residual (reconfirm WAVE12)

| Surface | Finding |
|---------|---------|
| TSX `parchment` string | **2 comment-only** hits: `RegionMap.tsx` (“not parchment”), `SceneBackdrop.tsx` (“never bare parchment flash”) |
| `parchment-panel` / `className=.*parchment` | **0** |
| `background_parchment.png` code refs | **0** (orphan on disk both trees — not live) |
| `.sw-bg--*` utility classes | Defined in `_backgrounds.css` only; **0 TSX callers** |
| Beige / warm paper hex (`#f5e6*`, `#e8d5*`, cream, papyrus) on stage CSS | **None** (only unrelated “scream” string noise in event data) |

**Residual list for live parchment:** empty. Same as WAVE12.

---

## 2. First-hour shell underlay trace

| Step | Screen | Underlay | Painted plate | Beige flash? |
|------|--------|----------|---------------|--------------|
| 1 | **MainMenu** | `linear-gradient(abyss → void #050608)` on `.main-menu` | `/assets/naruto_kyubi_main_menu.png` via `::before` | No |
| 2 | **CharacterSelect** | Same abyss→void on `.char-select` | `/assets/character_select_background.png` via `::before` | No |
| 3 | **RegionMap** | Inline `backgroundColor: '#050608'` + scrim + map stack | Arc map + `background_map_exploring.png` fallback | No |
| 4 | **LocationMap** | `locationStageBg`: `#050608` + scrim + lamina bg + map fallback | `resolveLaminaPaths(biome).background` | No |
| 5a | **Combat** | `center-stage--mission` + `.cinematic` void gradient | Lámina 1/2/3 via `combatLamina` / CinematicViewscreen (opacity 0 until onLoad) | No |
| 5b | **Event** | Mission void + `SceneBackdrop` void gradient; dim 0.32 | `combatBackground` | No |
| 5c | **Loot** | Mission void + `SceneBackdrop` void gradient | `combatBackground` | No |

### Shell flags (`App.tsx` — unchanged intent from WAVE12)

- `isExplorationMap` = `REGION_MAP | LOCATION_EXPLORE` → `center-stage--explore`
- `isMissionScene` = `COMBAT | EVENT | ELITE_CHALLENGE | LOOT | MERCHANT | TRAINING | SCROLL_DISCOVERY | TREASURE | TREASURE_HUNT_REWARD` → `center-stage--mission`
- Base `.center-stage`: `background-color: #050608` always
- `combatLamina` always resolves painted plate (`currentLocation?.biome || region?.biome || 'Coastal Harbor'`)

### Flash controls (still present)

- `SceneBackdrop`: bg opacity 0 / visibility hidden until onLoad; path-gated ready/error; void gradient always under
- `CinematicViewscreen`: same path-gated stack; `.cinematic` abyss→void base
- RegionMap / LocationMap: void underplate + multi-layer CSS image stack

---

## 3. Critical runtime asset paths (disk)

| Asset | public/assets | assets/ |
|-------|---------------|---------|
| `background_map_exploring.png` | ✓ | ✓ |
| `naruto_kyubi_main_menu.png` | ✓ | ✓ |
| `character_select_background.png` | ✓ | ✓ |
| `translucent_begin_journey.png` | ✓ | ✓ |
| `background_exploration_combat.png` | ✓ | ✓ |
| R1 `location_*.png` × 14 | 14/14 | 14/14 |
| R1 `lamina_mid_*.png` × 14 | 14/14 | 14/14 |
| R1 `lamina_fg_*.png` × 14 | 14/14 | 14/14 |

**Slug set (14/14 reconfirmed):**  
`coastal_harbor`, `foggy_shoreline`, `dense_forest`, `underground_cavern`, `rural_village`, `river_banks`, `shipwreck`, `great_bridge`, `fortified_camp`, `ruined_estate`, `secret_harbor`, `underwater_temple`, `fortified_mansion`, `mist_covered_bridge`

`resolveLaminaPaths` → `/assets/location_|lamina_mid_|lamina_fg_<slug>.png?v=r2wave2a3` with aliases + `DEFAULT_BIOME_SLUG = coastal_harbor`.

**No mirror or path fix required.**

---

## 4. App.tsx post-WAVE12 blank-stage check

| Concern | Status |
|---------|--------|
| Early full-screen Menu / CharSelect | Present; own void gradients |
| center-stage explore/mission class wiring | Present; void first |
| Combat lamina props (bg/mid/fg) | Wired to Combat |
| Event / Loot / amenities `background={combatBackground}` | Wired; SceneBackdrop consumers intact |
| Missing biome fallback Coastal Harbor | Intact in `resolveLaminaPaths` + App biome chain |
| NEW blank-stage / missing critical path | **None found** |

---

## 5. Fixes applied

**None.** Regression reconfirmed WAVE12 CLEAN claims. Prefer CLEAN.

---

## 6. Residual backlog (not WAVE13 — ceiling / OOS)

Human playtest remains the gate (OOS STOP agent waves).

1. Optional: delete orphan `background_parchment.png` (hygiene only).
2. Optional: remove dead `.sw-bg--*` utilities in design-system sweep.
3. Prior A3 backlog: soft-share enemy uniqueness; 21 endgame skill jpg→painted; side-event plates; R2+ cast.

**R1 laminas:** closed (WAVE2; reconfirmed WAVE10–13).  
**Parchment chassis:** closed (0 live callers).  
**First-hour cinematic shell:** closed for blank-stage / parchment residual.

---

## 7. Files inspected (read-only)

- `src/App.tsx` — early returns; center-stage flags; combatLamina; scene props
- `src/App.css` — center-stage void / explore / mission
- `src/utils/colorHelpers.ts` — `resolveLaminaPaths`
- `src/components/layout/SceneBackdrop.tsx` + `.css`
- `src/components/layout/CinematicViewscreen.css`
- `src/components/exploration/RegionMap.tsx`, `LocationMap.tsx`
- `src/scenes/menu/MainMenu.css`, `CharacterSelect.css`
- `src/scenes/activities/Event.tsx`, `src/scenes/rewards/Loot.tsx` (SceneBackdrop consumers)
- Disk: `public/assets` + `assets` critical shell + 14×3 laminas/locations
- Prior: `.agents/swarm-grok/reports/A3-wave12-art.md`

**No git commit. No `git add`. No Imagine assets. No code changes.**
