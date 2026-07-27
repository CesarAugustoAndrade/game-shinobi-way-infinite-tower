# A3 — Arte & Cámara

**Agent:** A3-art-camera  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Scope:** presentation / CSS / background wiring only

---

## Goal

Kill parchment as the default center-stage look; ensure every screen sits on a void/abyss or location/combat take; align CRT/vignette/parallax with seinen-sublime (void `#050608`, abyss `#1a2633`, rust `#a65d3f`, bone `#e8e4dc`).

---

## What was done

### 1. Center stage — parchment dead as default

- `src/App.css` — `.center-stage` is the live shell (wired from `App.tsx` via `centerStageClass`):
  - Base void/abyss gradient + rust whisper (no `background_parchment.png`)
  - `--explore`: map ops underlay (`background_map_exploring.png`) + dim scrim
  - `--mission`: deep mission void for combat/event/loot/amenities
  - CRT grit via `::after` scanlines + noise; `prefers-reduced-motion` softens opacity
- `.parchment-panel` kept as **legacy alias** of the same void shell (no warm paper)

### 2. Always backgrounds

| Surface | Change |
|---------|--------|
| **CinematicViewscreen** | Already 3-layer parallax + CRT; void/abyss fallback confirmed |
| **SceneBackdrop** | Void/abyss fallback; bg opacity 0.48; slow drift; stronger scrim/vignette; scanlines as visor chrome |
| **Event** | Wrapped in `SceneBackdrop`; `background` prop from `App` (`combatBackground` / lamina L1) |
| **LocationMap** | Biome plate via `resolveLaminaPaths(biome).background` + map-exploring fallback layer; CRT scanlines + vignette; void base color |
| **RegionMap** | Already map plate + CRT (left intact) |
| **Combat / loot / merchant / etc.** | Existing `combatBackground` / mid / fg path via `resolveLaminaPaths` (W3) — unchanged, still live |

### 3. Menu / clan presentation

- **MainMenu.css** — heavier dim, vignette + scanlines, bone title, rust frame heat, rust CTA, abyss glass difficulty panel, reduced-motion hooks
- **CharacterSelect.css** — same language: void underlay, CRT vignette, bone title, rust hover/role, abyss glass clan cards, reduced-motion

### 4. Lámina mid/fg

Already resolved by `resolveLaminaPaths` + Combat → CinematicViewscreen. Assets present for:

`coastal_harbor`, `dense_forest`, `foggy_shoreline`, `great_bridge`, `mist_covered_bridge`, `river_banks`, `rural_village`

Missing mid/fg PNGs simply hide via `onError` (no 404 crash).

---

## Files changed (this agent)

| File | Role |
|------|------|
| `src/App.css` | Void center-stage + explore/mission variants; parchment alias |
| `src/App.tsx` | Comment; Event already receives `background={combatBackground}` |
| `src/components/layout/SceneBackdrop.tsx` | Doc comments |
| `src/components/layout/SceneBackdrop.css` | Void fallback, drift, opacity, CRT |
| `src/components/exploration/LocationMap.tsx` | Biome BG + CRT layers |
| `src/components/exploration/exploration.css` | Location-map void base, scanlines/vignette, z-index chrome |
| `src/scenes/activities/Event.tsx` | SceneBackdrop + `background` prop |
| `src/scenes/menu/MainMenu.css` | Cinematic calling card |
| `src/scenes/menu/CharacterSelect.css` | Cinematic clan select |
| `.agents/swarm-grok/reports/A3-art-camera.md` | This report |

No new systems. No combat math. No unit tests. No git commit.

---

## Typecheck

```
npx tsc --noEmit
```

- **A3 files:** clean (no errors in Event / LocationMap / SceneBackdrop / menus).
- **Pre-existing unrelated:** `Combat.tsx` FloatingText `damageType` / `element` prop mismatch (other agent work) — out of presentation scope.

---

## Residual gaps

1. **Lámina mid/fg missing** for Waves biomes that only have `location_*`:  
   `fortified_camp`, `fortified_mansion`, `ruined_estate`, `secret_harbor`, `shipwreck`, `underground_cavern`, `underwater_temple` — BG plate works; mid/fg stay empty until assets land.
2. **Non-Waves biomes** (Exams/Rogue/War) often lack matching `location_<slug>.png` — LocationMap falls back to `background_map_exploring.png`.
3. **No dedicated void plate PNG** — CSS gradients only (acceptable; optional future plate under `public/assets/`).
4. **`public/assets/background_parchment.png` still on disk** but unused by stage CSS (safe to delete later as dead asset).
5. **GameGuide** still notes parchment history in comment only; already dark-themed.
6. Concurrent combat FloatingText TS errors should be fixed by the combat UI owner.

---

## Mood checklist

- [x] No warm parchment as default center look  
- [x] Void / abyss / rust palette on stage + menus  
- [x] CRT/scanlines as visor chrome (not neon-washed world art)  
- [x] Location/combat/map BGs prefer painted plates when assets exist  
- [x] `prefers-reduced-motion` respected on stage grit, backdrop drift, menus  
- [x] Left stats panels left alone (still themed images)  
