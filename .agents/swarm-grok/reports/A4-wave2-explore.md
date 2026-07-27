# A4 WAVE2 — Exploración R1 residual

**Agent:** A4  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Neon-vs-mist dial · location variety readability · veiled/secret mystery · biome BG verify · diamond framing polish  
**Verify:** `npx tsc --noEmit` — clean (exit 0)

## Mandate

RegionMap = CRT/ops table **instrument**. World climate stays fog / metal / void / rust. Location cards read danger + biome + terrain/scar at a glance (StS clarity). Secrets feel veiled without new systems.

## What shipped

### 1. Neon → instrument (not world climate)

Dialed party cyan/magenta bloom off RegionMap / location cards / HUD chrome. CRT scanlines + vignette stay as **visor instrument**; ambient frame is metal/void.

| Surface | Before (party neon) | After (instrument) |
|---------|---------------------|--------------------|
| RegionMap border / title glow | Cyan + magenta bloom | Metal `#2d3d4a` · bone `#e8e4dc` · rust flourish |
| Progress bar | Hot pink/magenta fill | Rust oxide `#6b3d2a → #a65d3f → #c47a52` |
| Enter Location CTA | Cyan phosphor glow | Rust instrument heat + hard shadow |
| Location cards | Cyan / magenta neon edges | Fog-metal accent; secret = rust void |
| Mystery glitch | Magenta disco | Void fog `#050608` / `#1a2633` |
| ExplorationHUD loc chip | Cyan `#a5f3fc` | Fog/metal `#b8bcc2` / `#2d3d4a` |
| Room HERE badge | Cyan neon | Rust `#6b3d2a` / `#a65d3f` |
| LocationMap Enter Room | Cyan teal | Rust instrument CTA |

**Palette anchors (seinen-sublime):** void `#050608` · abyss `#1a2633` · metal `#2d3d4a` · fog `#8a9199` · bone `#e8e4dc` · rust `#a65d3f`.

### 2. Location variety readability (StS scan)

Each destination card now surfaces identity without clutter:

- **D# badge** color-coded (1–7) on card header identity row  
- **Biome chip** (same language as plate art)  
- **Terrain tag** under stats (when known)  
- **Scar** chip + revisit corner badge (rust)  
- **Veiled** chip when secret  
- Preview under cards: biome · danger · terrain · veiled · scar (mystery = “Signal fogged” only)

### 3. Secret / branch mystery (copy + chips only)

No new unlock systems — pure presentation over existing `flags.isSecret` / `LocationType.SECRET`:

| Layer | Copy / UI |
|-------|-----------|
| Intel NONE | Subtitle `Signal Fogged` · footer `Signal fogged` · preview “Destination unconfirmed…” |
| Type label | `Veiled Route` (was Secret Area) |
| Special feature FULL | `Veiled Route` / `Unmarked Path` |
| Card class | `location-card--secret` rust void accent |
| Region preview | Chip `Veiled route` · CTA “Slip into {name} — off the ledgers” |
| LocationMap header | Chip `Veiled` when `branchingFloor.isSecret` |
| Floor flag | `BranchingFloor.isSecret?` pass-through from location flags/type |

First-tip: *“Plan the strike on Gato’s Compound. Side paths and veiled routes surface as intel rises.”*

### 4. R1 biome background resolution — verified

All **14** Waves biomes resolve `location_<slug>.png` under `public/assets/`:

| Biome | Plate |
|-------|-------|
| Coastal Harbor | `location_coastal_harbor.png` |
| Foggy Shoreline | `location_foggy_shoreline.png` |
| Dense Forest | `location_dense_forest.png` |
| Underground Cavern | `location_underground_cavern.png` |
| Rural Village | `location_rural_village.png` |
| River Banks | `location_river_banks.png` |
| Shipwreck | `location_shipwreck.png` |
| Great Bridge | `location_great_bridge.png` |
| Fortified Camp | `location_fortified_camp.png` |
| Ruined Estate | `location_ruined_estate.png` |
| Secret Harbor | `location_secret_harbor.png` |
| Underwater Temple | `location_underwater_temple.png` |
| Fortified Mansion | `location_fortified_mansion.png` |
| Mist Covered Bridge | `location_mist_covered_bridge.png` |

- Cards + LocationMap stage use `resolveLaminaPaths(biome).background` (aliases + default + rev query).  
- Missing mid/fg laminas for fortified_camp / shipwreck / etc. still hide via onError when A3 adds them later — paths already correct.  
- Region fallback: `background_map_exploring.png`.

### 5. Room diamond cinematic framing (residual)

- Diamond plate: void scrim, metal inset border, rust floor heat radial  
- Far row: scale 0.94 + slight desat (path ahead)  
- Mid row: wider gap (binary choice)  
- You-are-here: thin fog stem connector above current room  
- Fog cells: mist radial + dashed metal, not bright slate neon  
- HERE badge / Enter CTA: rust instrument language

## Files touched

| File | Role |
|------|------|
| `src/components/exploration/exploration.css` | Neon dial · card identity · diamond frame · secret chips |
| `src/components/exploration/LocationCardDisplay.tsx` | D#/biome/scar/veiled row · resolveLaminaPaths art · secret class |
| `src/components/exploration/RegionMap.tsx` | Preview chips · mystery/veiled deploy copy · first tip |
| `src/components/exploration/LocationMap.tsx` | Veiled header chip |
| `src/components/layout/ExplorationHUD.css` | Loc + theme chips → fog/metal |
| `src/game/systems/RegionSystem.ts` | Veiled copy · isSecret floor pass-through · card isSecret flags |
| `src/game/types.ts` | `BranchingFloor.isSecret?` |

## Explicitly not done

- No git commit  
- No floor generation rewrite  
- No new unit tests  
- No new lamina / location plate generation  
- Authored path graph still unused for navigation (R1-005 backlog)

## Smoke checklist (manual)

1. RegionMap: metal frame, rust progress/CTA — no cyan/magenta party bloom  
2. Select docks vs forest vs secret (when unlocked): distinct D# + biome + terrain  
3. Low intel card: “Signal fogged” / void glitch, not magenta neon  
4. Secret destination: rust/void card, “Veiled route”, slip-into CTA  
5. Enter location: biome plate + D# + optional Scar/Veiled chips  
6. Room diamond: framed stage, fog ??? cells, rust HERE badge  
7. `npx tsc --noEmit` clean  

## Residual risks

- Activity icon training still uses a teal accent (semantic color, not chrome climate)  
- Merchant/rest feature footers keep warm gold/pink as **amenity** signals (readable, not map climate)  
- Mid/fg laminas incomplete for some biomes — combat/map plates already path-stable for A3 drops  
