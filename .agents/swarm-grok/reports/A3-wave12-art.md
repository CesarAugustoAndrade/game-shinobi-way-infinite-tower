# A3 WAVE12 — ARTE / first-hour cinematic shell residual

**Agent:** A3 WAVE12 (art/camera cinematic shell)  
**Date:** 2026-07-23  
**Branch:** develop (**no commit**)  
**Scope:** Residual first-hour shell only — Menu → CharacterSelect → RegionMap → LocationMap → Combat/Event/Loot.  
**Ceiling:** R1 art RECONFIRMED. No Imagine gen. No skill/enemy/event/lamina paints.

---

## Verdict: **CLEAN**

| Check | Result | Evidence |
|-------|--------|----------|
| Center-stage void underlay `#050608` | **PASS** | `App.css` `.center-stage` / `--explore` / `--mission` all pin void first |
| Live parchment TSX callers | **0** | Grep `parchment-panel` / `className=.*parchment` / `background_parchment` — none in TSX |
| Beige / warm paper hex on active stages | **NONE** | No parchment palette on menu/maps/combat/event/loot surfaces |
| First-hour shell blank flash | **NONE** | Void underplate + path-gated image opacity on every stage |
| Critical map BG / combat lamina paths | **OK** | 14×3 plates + map exploring BG present both trees |
| public/assets ↔ assets mirror | **OK** | Critical shell + lamina plates mirrored |
| Code / CSS fixes this wave | **0** | No blank-stage bugs found |
| New images | **0** | Ceiling respect |

**Prefer verify-only → satisfied. No fixes applied.**

---

## 1. First-hour shell trace

| Step | Screen | State / route | Stage underlay | Painted plate | Empty beige flash? |
|------|--------|---------------|----------------|---------------|--------------------|
| 1 | **MainMenu** | Full-screen early return (`GameState.MENU`) | `linear-gradient(abyss → void #050608)` on `.main-menu` | `/assets/naruto_kyubi_main_menu.png` via `::before` (blur + dim) | No — void CSS first |
| 2 | **CharacterSelect** | Full-screen early return (`GameState.CHAR_SELECT`) | Same abyss→void gradient on `.char-select` | `/assets/character_select_background.png` via `::before` (heavy dim) | No |
| 3 | **RegionMap** | In-shell `center-stage--explore` | `#050608` + explore map plate underlay | Inline: void + scrim + `background_map_exploring.png` stack | No |
| 4 | **LocationMap** | In-shell `center-stage--explore` | `#050608` + explore underlay | `locationStageBg`: void + scrim + `resolveLaminaPaths(biome).background` + map fallback | No |
| 5a | **Combat** | In-shell `center-stage--mission` | Mission void + `.cinematic` gradient `#1a2633→#050608` | Lámina 1/2/3 via `combatLamina` / `CinematicViewscreen` (opacity 0 until onLoad; onError hides) | No |
| 5b | **Event** | In-shell `center-stage--mission` | SceneBackdrop void gradient | `combatBackground` dim 0.32 | No |
| 5c | **Loot** | In-shell `center-stage--mission` | SceneBackdrop void gradient | `combatBackground` | No |

### Shell flags (`App.tsx`)

- `isExplorationMap` = `REGION_MAP | LOCATION_EXPLORE` → `center-stage--explore`
- `isMissionScene` = `COMBAT | EVENT | ELITE_CHALLENGE | LOOT | MERCHANT | TRAINING | SCROLL_DISCOVERY | TREASURE | TREASURE_HUNT_REWARD` → `center-stage--mission`
- Base `.center-stage`: `background-color: #050608` always

### Body chrome

- `body` → `--sw-bg-primary: #0a0a0b` (near-void, not parchment)
- Design tokens: `--sw-void: #050608`, `--sw-abyss: #1a2633`

---

## 2. LIVE parchment residual

| Surface | Finding | Action |
|---------|---------|--------|
| TSX `parchment-panel` / `parchment` className | **0 callers** | None |
| CSS `.parchment-panel` definition | **Absent** | Leave |
| `background_parchment.png` | On disk both trees; **0 code refs** | Orphan asset — not painted live (OOS delete) |
| Comment-only “parchment” notes | `App.css`, `SceneBackdrop*`, `RegionMap.tsx`, `exploration.css` | Keep (anti-regression docs) |
| `.sw-bg--guide` “Parchment/scroll feel” | Design-token in `_backgrounds.css` only | **0 TSX `sw-bg--*` callers** — dead utility; gradient is still dark (`--sw-bg-primary`), not beige paper |
| Beige / warm paper hex on center-stage / maps / combat | **None** | N/A |

**Residual list for live parchment:** empty.

Optional later (not WAVE12 / not blank-stage):

1. Delete orphan `background_parchment.png` if asset hygiene wave runs.
2. Remove unused `.sw-bg--guide` (and other unused `.sw-bg--*`) in design-system sweep.

---

## 3. Critical runtime asset paths

| Asset | Path used | public/assets | assets/ | 404 risk |
|-------|-----------|---------------|---------|----------|
| Map exploring BG | `/assets/background_map_exploring.png` | ✓ | ✓ | No |
| Menu plate | `/assets/naruto_kyubi_main_menu.png` | ✓ | ✓ | No |
| Char select plate | `/assets/character_select_background.png` | ✓ | ✓ | No |
| Begin journey UI | `/assets/translucent_begin_journey.png` | ✓ | ✓ | No |
| Combat exploration card | `/assets/background_exploration_combat.png` | ✓ | ✓ | No |
| R1 location_*.png × 14 | `resolveLaminaPaths` → `/assets/location_<slug>.png?v=r2wave2a3` | 14/14 | 14/14 | No |
| R1 lamina_mid_*.png × 14 | same | 14/14 | 14/14 | No |
| R1 lamina_fg_*.png × 14 | same | 14/14 | 14/14 | No |

### Biome resolution safety

```ts
// App.tsx
const biome = currentLocation?.biome || region?.biome || 'Coastal Harbor';
return resolveLaminaPaths(biome);
// DEFAULT_BIOME_SLUG = 'coastal_harbor' inside resolveLaminaPaths
```

Missing/blank biome → Coastal Harbor plate. Mid/fg missing → onError hide layer; void gradient remains.

### R1 slug set (reconfirmed 14/14)

`coastal_harbor`, `foggy_shoreline`, `dense_forest`, `underground_cavern`, `rural_village`, `river_banks`, `shipwreck`, `great_bridge`, `fortified_camp`, `ruined_estate`, `secret_harbor`, `underwater_temple`, `fortified_mansion`, `mist_covered_bridge`

**No mirror or path fix required.**

---

## 4. Image load flash controls (no blank beige)

| Component | Behavior |
|-----------|----------|
| `SceneBackdrop` | BG opacity 0 / visibility hidden until `onLoad`; path-gated ready/error; void gradient always under |
| `CinematicViewscreen` | Same path-gated stack; `.cinematic` void→abyss gradient base |
| RegionMap / LocationMap | Inline `backgroundColor: '#050608'` always; multi-layer CSS image stack with map fallback |
| MainMenu / CharacterSelect | CSS gradient base; painted plate in `::before` (never replaces void) |

---

## 5. Fixes applied

**None.** Residual shell audit found no blank-stage or live parchment callers.

---

## 6. Residual backlog (not WAVE12 — ceiling / OOS)

Per prior A3 waves + `out-of-scope.md`. Human playtest remains the gate.

1. Optional soft-share enemy uniqueness (river_bandit / hidden_guard / elite_mercenary).
2. 21 endgame skill imagine-jpg → painted (post-R1).
3. ~36 side-event plates still jpg/reuse.
4. R2+ enemy cast plates.
5. Cosmetic: orphan `background_parchment.png` delete; unused `.sw-bg--guide` removal.

**R1 laminas:** closed (WAVE2, reconfirmed WAVE10–12).  
**Parchment chassis:** closed (no live callers; shell is void/mission/explore).  
**First-hour cinematic shell:** closed for blank-stage / parchment residual.

---

## 7. Files inspected (read-only)

- `src/App.tsx` — early returns Menu/CharSelect; center-stage flags; combatLamina wiring
- `src/App.css` — center-stage void / explore / mission
- `src/utils/colorHelpers.ts` — `resolveLaminaPaths` / aliases / default
- `src/components/layout/SceneBackdrop.tsx` + `.css`
- `src/components/layout/CinematicViewscreen.css`
- `src/components/exploration/RegionMap.tsx`, `LocationMap.tsx`, `exploration.css`
- `src/scenes/menu/MainMenu.css`, `CharacterSelect.css`
- `src/styles/design-system/index.css`, `_variables.css`, `_backgrounds.css`
- Disk: `public/assets` + `assets` critical shell + 14×3 laminas

**No git commit. No `git add`. No Imagine assets.**
