# E2-map Report — Land of Waves exploration loop

**Agent:** E2-map (Grok swarm)  
**Date:** 2026-07-22  
**Scope:** Region map → locations → rooms → events/atmosphere → boss → region 2  
**Mode:** Read-only analysis + backlog append only  

## Journey map (as implemented)

```
MENU → char select → REGION_MAP (1–3 LocationCards)
  → Enter → LOCATION_EXPLORE (room diamond, LocationMap)
    → room activities: combat / merchant / rest / training / event / treasure / …
    → exit guardian clear → LocationCompleteModal
    → mark complete + secret unlock + redraw cards
  → when Gato’s Compound complete → onRegionBossDefeated
    → INTERLUDE (campaign) → Chunin Exams
    → or infinite ascent / VICTORY if no next config
```

**PathChoiceModal removed** — travel is card-draw, not graph walking.  
`secretPaths` still matter for T-030 discovery on location complete.

## What works

| Area | Status |
|------|--------|
| 13 Waves locations in `landOfWaves.ts` | OK |
| Location icons under `public/assets/icons/locations/` for all Waves IDs | OK (registry + files) |
| Biome card art `location_*.png` for Waves biomes | OK in public |
| Secret unlock via completing locations with `secretPaths` | OK (`discoverSecretsFromCompletedLocation`) |
| Flag unlock via `discoverSecretsFromEventFlags` | Wired; flags set in events |
| Boss gate at 75% progress (non-secret total = 10) | OK in `drawLocationCards` |
| Boss clear → interlude → region 2 (`App.tsx` + `campaign.ts`) | OK for campaign mode |
| Rest has `RestResultModal` (T-050) | Modal exists; chain incomplete (see bugs) |
| Atmosphere flavor on enter (T-046) | OK as flavor line only |
| `tiedStoryEvents` → `preferredEventIds` when event room rolls | Partial (preference only) |

## Critical findings (top 5)

1. **P0 Roto — Missing public backgrounds**  
   `LocationMap` uses `/assets/background_map_exploring.png`; `App.css` uses `/assets/background_exploration_combat.png`. Files live in repo-root `assets/` but **not** `public/assets/` → broken URL in dev. → **R1-001, R1-002**

2. **P0 Confuso — Merchant/Rest/Training cards lie**  
   Flags drive card chips / special feature text, **not** room generation. → **R1-003, R1-012**

3. **P1 Roto — Rest soft-stall**  
   Rest completes activity but never calls `returnToMapActivityComplete` after modal; multi-activity chain / floor complete can stall. → **R1-004**

4. **P1 Confuso — Authored path graph is dead UI**  
   Rich routes/danger hints unused for player navigation; secrets still use path meta only. → **R1-005, R1-011**

5. **P1 Narrative — Climax + secret intel RNG**  
   `final_confrontation` / `gato_defeat` not forced on compound clear; `mist_ambush_cache` not location-tied for ship/cove flags. Boss transition code is fine; story payload is optional. → **R1-006, R1-007, R1-008**

## Additional findings

- **LocationMap title = biome**, not location name → **R1-009**
- **atmosphereEvents never fire as GameEvents** (flavor humanize only) → **R1-010**
- Story preferred events still need a lucky event activity roll → **R1-013**
- Dual entry locations not special-cased in first draw → **R1-015**
- Path-unlock secrets do not set discovery flags → event flag combat modifiers can miss → **R1-016**
- Likely dead UI: `LocationCard.tsx`, `LocationPanel.tsx` → **R1-014**
- Event art gaps for most Waves story ids (location icons OK)
- `handlePathChoice` still in hooks but App comment: path modal removed
- Location runtime ids `location-<configId>-<uuid>` — boss check already robust via `flags.isBoss`

## Asset audit (Waves locations)

| Location ID | Icon JPG | Registry |
|-------------|----------|----------|
| the_docks … gatos_compound (13) | present | present |

**Missing public:** `background_map_exploring.png`, `background_exploration_combat.png`  
**Event icons missing:** meet_tazuna, protect_village, meet_inari, protect_bridge, final_showdown_setup, final_confrontation, gato_defeat  

## Secret reachability

| Secret | Path unlock | Flag unlock |
|--------|-------------|-------------|
| sunken_ship | Complete misty_beach | mist_ambush_cache outcomes |
| hidden_cove | Complete smugglers_cave | mist_ambush_cache outcomes |
| drowned_shrine | Complete sunken_ship or hidden_cove | meet_tazuna (docks preferred) |

Secrets are **reachable** via path completion without events. Flag path is alternate and unevenly authored.

## Region 2 transition

`onRegionBossDefeated` in `App.tsx`: campaign uses `getNextPlayableRegionIndex` → INTERLUDE with boons → next config (Chunin Exams). No broken transition found; gap is pre-interlude narrative (R1-007).

## Backlog tasks added

**R1-001 … R1-016** (16 atomic tasks). IDs free before E2-map (only R1-000 existed).

## Out of scope notes

No OOS rows required for pure R2–R4 content; Chunin Exams only referenced as transition target.

## Suggested worker order

1. W1-fix: R1-001, R1-002, R1-004  
2. W2-ux: R1-003, R1-005, R1-009, R1-015  
3. W4-narrative: R1-006, R1-007, R1-013, R1-016  
4. A1-bg / A2-loc / E5-assets: R1-001/002 copy + R1-008  
5. Feature: R1-012 after R1-003 design call  
