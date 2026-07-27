# A3 WAVE2 — Láminas mid/fg residual + mist cutout

**Agent:** A3-wave2 (Arte & Cámara residual)  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Scope:** asset generation only (+ one cache-rev bump)

---

## Goal

Fill the 7 missing Region-1 biome mid/fg parallax plates and the missing `enemy_cut_mist_ninja.png` cutout so combat stage layers no longer fall back to onError-hide for those slugs.

---

## Art direction applied

- Palette: void `#050608`, abyss `#1a2633`, metal `#2d3d4a`, fog `#8a9199`, bone `#e8e4dc`, rust `#a65d3f`
- Seinen sublime / Land of Waves cyber-terror mist coast (NOT bright neon city, NOT parchment)
- Mid: semi-transparent structures/silhouettes framing a black void center (1280×720 cinematic 16:9)
- Fg: edge occlusion (rails/rocks/mist/debris) with open black center/upper for stage compositing
- Cutout: mist ninja likeness on pure black void (matches existing `enemy_cut_*` convention)

---

## Generated assets (15 unique → mirrored to 2 dirs)

### Lámina mid + fg (7 slugs × 2 = 14)

| Slug | Mid | Fg | Motifs |
|------|-----|----|--------|
| `fortified_camp` | `lamina_mid_fortified_camp.png` | `lamina_fg_fortified_camp.png` | Palisade gate, watchtower, tents / barricades, shields, rope |
| `shipwreck` | `lamina_mid_shipwreck.png` | `lamina_fg_shipwreck.png` | Broken hulls, sails, beach / driftwood, barnacles, mist |
| `underground_cavern` | `lamina_mid_underground_cavern.png` | `lamina_fg_underground_cavern.png` | Stalactites, crates, barrels, pool / rocks, roots, crate |
| `underwater_temple` | `lamina_mid_underwater_temple.png` | `lamina_fg_underwater_temple.png` | Torii, pillars, lanterns, seaweed / stone markers, bubbles |
| `ruined_estate` | `lamina_mid_ruined_estate.png` | `lamina_fg_ruined_estate.png` | Broken beams, ivy stairs / roots, fence rails, rubble |
| `secret_harbor` | `lamina_mid_secret_harbor.png` | `lamina_fg_secret_harbor.png` | Cove arch, boat, teal bioluminescence / tidal rocks, oar, mist |
| `fortified_mansion` | `lamina_mid_fortified_mansion.png` | `lamina_fg_fortified_mansion.png` | Gate pillars, purple banners, torches / sandbags, crate, cloth |

### Enemy cutout (1)

| File | Notes |
|------|--------|
| `enemy_cut_mist_ninja.png` | Image-edit from `enemy_mist_ninja.png` — pink chroma → pure black void; same pose/design as source portrait (1024×1024) |

### Delivery paths

Each of the 15 files written to **both**:

- `public/assets/<name>.png` (runtime / Vite public)
- `assets/<name>.png` (project mirror)

Resolution: mid/fg **1280×720** RGBA PNG; cutout **1024×1024** RGBA PNG.

---

## Coverage after wave2

**Lámina mid/fg now complete for all 14 painted location slugs:**

```
coastal_harbor, dense_forest, foggy_shoreline, great_bridge,
mist_covered_bridge, river_banks, rural_village,
fortified_camp, shipwreck, underground_cavern, underwater_temple,
ruined_estate, secret_harbor, fortified_mansion
```

Counts under `public/assets`: **14** `lamina_mid_*.png` + **14** `lamina_fg_*.png`.

---

## Code / wiring

| Item | Action |
|------|--------|
| `resolveLaminaPaths` / `getBiomeSlug` | **No path changes** — convention already maps biome → `/assets/lamina_{mid,fg}_<slug>.png` |
| `BIOME_SLUG_ALIASES` | Unchanged (already maps `gato_mansion` / `sunken_wreck` etc.) |
| `Combat.tsx` cutout rewrite | Unchanged — `enemy_` → `enemy_cut_` picks up mist ninja automatically |
| `enemyArtManifest` | Unchanged — still points at `enemy_mist_ninja.png`; cutout derived at combat render |
| `LAMINA_ASSET_REV` | Bumped `r1chroma3` → **`r2wave2a3`** in `src/utils/colorHelpers.ts` so browsers pull new mid/fg pixels |

Optional combat ambient plate (`background_exploration_combat`) — **skipped** (existing plate sufficient; not blocking).

---

## Typecheck / tests

- No product logic changes beyond cache-rev string.
- No unit tests added (per project rules).
- No git commit (parent stages).

---

## Open notes

1. Generated mid/fg use **solid black void centers** (same practical compositing as wave1 plates), not true alpha cutouts — consistent with existing `lamina_*` on disk.
2. Some fg plates retain faint distant silhouettes (e.g. camp watchtower, estate ruin); still read as edge occlusion + atmosphere.
3. If a future pass wants true alpha PNG (checker/transparent center), re-export with chroma-key of pure black `#000000` / near-void.

---

## Files touched

| Path | Role |
|------|------|
| `public/assets/lamina_{mid,fg}_<7 slugs>.png` | New parallax plates |
| `public/assets/enemy_cut_mist_ninja.png` | New combat cutout |
| `assets/lamina_{mid,fg}_<7 slugs>.png` | Mirror |
| `assets/enemy_cut_mist_ninja.png` | Mirror |
| `src/utils/colorHelpers.ts` | `LAMINA_ASSET_REV` bump only |
| `.agents/swarm-grok/reports/A3-wave2-laminas.md` | This report |
