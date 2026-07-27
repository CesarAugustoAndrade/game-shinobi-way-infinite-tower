# A4 — Exploración Región 1 (location-as-transform)

**Agent:** A4  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Land of Waves as product manifesto — location identity, cinematic maps, scar feedback  
**Verify:** `npx tsc --noEmit` — clean (exit 0)

## Mandate

Each R1 location transforms the ninja (terrain, enemyPool, lootTheme, flags, atmosphere). RegionMap = ops table; LocationMap = filming room-to-room. Always backgrounds; no parchment UI.

## What shipped

### 1. Location data (`landOfWaves.ts`)

| Location | Change |
|----------|--------|
| The Docks / Misty Beach / Coastal Forest / Bridge / Outpost / Compound | Stronger authored prose (tyranny + fog identity) |
| Fishing Village | Soft terrain: water +10%, ambush −10% (safe mid-run haven) |
| Abandoned Manor | Danger **3 → 4**; mental +25%, visibility −10%; late detour identity |
| All 13 | Biomes still map 1:1 → `public/assets/location_*.png` |

Danger arc toward Gato (unchanged structure, manor bump for late-game pressure):

```
D1 Misty Beach, Fishing Village
D2 The Docks
D3 Coastal Forest, Riverside Camp
D4 Smuggler's Cave, Bridge, Hidden Cove, Abandoned Manor
D5 Sunken Ship, Bandit Outpost
D6 Drowned Shrine
D7 Gato's Compound
```

### 2. Systems hooks (no React)

- `BranchingFloor.isRevisit?: boolean` in `types.ts`
- `locationToBranchingFloor` sets `isRevisit` when `location.isCompleted`
- Atmosphere flavor path unchanged (ATMOSPHERE_PROSE + enter log)

### 3. UI — cinematic maps (not parchment)

| Surface | Polish |
|---------|--------|
| **RegionMap** | `background_map_exploring.png` + scrim; region biome line; preview chips (biome / danger / scar); “Deploy to…” CTA |
| **LocationMap** | Biome `location_*.png` via `resolveLaminaPaths` + map fallback; D# + Scar chips; diamond room framing class; “Film the path…” intel hint |
| **RoomCard** | Mission-tile gradient (not flat cell) |
| **LocationCardDisplay** | Terrain tag under stats |
| **ExplorationHUD** | Location name + D# when in `LOCATION_EXPLORE`; region name on map |
| **exploration.css** | Chips, title row, diamond rhythm, terrain tag styles |

### 4. Visit scar (small, wired)

- Region preview chip: `Scar · reduced rewards`
- LocationMap header chip: `Scar`
- Enter log: *“{Name} bears your earlier visit. Loot will be thinner here.”*
- Floor flag `isRevisit` for UI without re-querying region state

### 5. Enemy art aliases (no new systems)

Remapped pool faces onto existing painted PNGs / imagine JPGs for clearer variety:

- `beach_bandit` → dock_worker  
- `forest_bandit` / `river_bandit` / `assassin` / `hidden_guard` → mist_ninja  
- `camp_raider` / `bandit_captain` → missing_nin  
- `elite_mercenary` → bridge_saboteur  
- `water_spirit` → `icons/enemies/water_spirit.jpg`  

Pool IDs + humanized names already distinct per location; presentation path is `poolId → enemy:pool_* → archetype fallback`.

## Background resolution (R1)

Every Waves biome has `location_<slug>.png` in `public/assets/`:

coastal_harbor, foggy_shoreline, dense_forest, underground_cavern, rural_village, river_banks, shipwreck, great_bridge, fortified_camp, ruined_estate, secret_harbor, underwater_temple, fortified_mansion  

+ region fallback `background_map_exploring.png`  
Combat still uses `resolveLaminaPaths(biome)` (lámina mid/fg where installed).

## Files touched

| File | Role |
|------|------|
| `src/game/constants/regions/landOfWaves.ts` | Prose + terrain + manor D4 |
| `src/game/types.ts` | `isRevisit` on floor |
| `src/game/systems/RegionSystem.ts` | Pass revisit flag |
| `src/hooks/useLocationCards.ts` | Scar log line |
| `src/components/exploration/RegionMap.tsx` | Ops-table cinematic + chips |
| `src/components/exploration/LocationMap.tsx` | Film stage chips + diamond class |
| `src/components/exploration/LocationCardDisplay.tsx` | Terrain tag |
| `src/components/exploration/exploration.css` | Visual polish |
| `src/components/layout/ExplorationHUD.tsx` + `.css` | Location/danger chrome |
| `src/App.tsx` | HUD wiring |
| `src/game/constants/enemyArtManifest.ts` | Art alias diversity |

## Explicitly not done

- No git commit  
- No new unit tests  
- No new enemy portrait generation  
- No lamina_mid/fg for remaining biomes (asset pipeline)  
- Authored path graph still unused for navigation (R1-005 backlog)  

## Smoke checklist (manual)

1. Start campaign → RegionMap shows map art, not parchment  
2. Select card → biome + danger chips; Enter Location CTA  
3. Inside location → biome plate, D#, atmosphere line  
4. Clear location, redraw, re-enter → Scar chip + thinner-loot log  
5. Combat faces vary by location pool (not one exhausted shinobi face)  
