# W4-narrative Report — WAVES_ARC sober terror + mini-arc

**Agent:** W4-narrative  
**Date:** 2026-07-22  
**Scope:** Content + wiring only (no EventSystem architecture changes)

## Claim / backlog

| ID | Title | Status |
|----|-------|--------|
| R1-301 | Verify Waves `tiedStoryEvents` IDs | done |
| R1-302 | Elevate high-visibility event copy | done |
| R1-303 | Mini-arc flags/chains Tazuna → bridge → Gato | done |
| R1-006 | `mist_ambush_cache` location-tied for secret flags | done |

## tiedStoryEvents audit (`landOfWaves.ts`)

All pre-existing IDs already matched real `WAVES_ARC_EVENTS`:

| Location | tiedStoryEvents |
|----------|-----------------|
| the_docks | `meet_tazuna` |
| fishing_village | `protect_village`, `meet_inari` |
| bridge_construction | `protect_bridge`, `final_showdown_setup` |
| gatos_compound | `final_confrontation`, `gato_defeat` |

**Wiring added (R1-006):**

| Location | tiedStoryEvents |
|----------|-----------------|
| misty_beach | `mist_ambush_cache` (new) |
| smugglers_cave | `mist_ambush_cache` (new) |

No broken / orphan IDs found.

## Events touched (copy + risk/reward clarity)

| Event ID | Changes |
|----------|---------|
| `bridge_worker_plea` | Sober poverty/kidnap copy; clearer costs; `waves_mercy` on success |
| `mist_ambush_cache` | Mist dread copy; risk/reward telegraph; grammar fix |
| `meet_tazuna` | Builder under tyranny tone; sets `tazuna_met`; Accept **chains** |
| `tazuna_road_mist` | **NEW** chain scene (road dread); `requiresFlags` + `excludesFlags` |
| `protect_village` | Quiet tyranny; `village_defended` on success |
| `protect_bridge` | Fog ambush tone; `bridge_held`; Tazuna-gated choice |
| `final_showdown_setup` | Zabuza/Haku restraint (not cartoon); can set `bridge_held` |
| `final_confrontation` | Compound dread; `compound_breached`; bridge-gated choice |
| `gato_defeat` | Hollow/quiet victory (not parade); compound-gated honor choice |

Unchanged: `tazuna_request`, `meet_inari` (still valid; lower priority).

## Chains + flags (mini-arc)

```
meet_tazuna (Accept)
  setFlags: { tazuna_met: 1, drowned_shrine_discovered: 1 }
  chainTo:  tazuna_road_mist
       │
       ▼
tazuna_road_mist  (requiresFlags: tazuna_met ≥ 1)
  setFlags: { tazuna_road_done: 1 }  // excludes re-roll
       │  (persistent — later locations)
       ▼
protect_bridge
  success → bridge_held: 1
  choice "Hold the Span for Tazuna" requires tazuna_met
       │
       ▼
final_confrontation
  success → compound_breached: 1
  choice "Strike for the Bridge" requires bridge_held
       │
       ▼
gato_defeat
  choice "Name the Bridge for the Living" requires compound_breached
```

### Flags written

| Flag | Writers |
|------|---------|
| `tazuna_met` | meet_tazuna |
| `tazuna_road_done` | tazuna_road_mist |
| `bridge_held` | protect_bridge, final_showdown_setup |
| `compound_breached` | final_confrontation |
| `waves_mercy` | bridge_worker_plea |
| `village_defended` | protect_village |
| (existing) `drowned_shrine_discovered` / `sunken_ship_discovered` / `hidden_cove_discovered` | preserved |

### chainTo edges

| From | To |
|------|-----|
| `meet_tazuna` (Accept) | `tazuna_road_mist` |

## Verification

- `npx vitest run src/game/constants/events/__tests__/eventContent.test.ts` — **18/18 pass**
- Combined with EventSystem tests earlier — **78 pass**
- `npx tsc --noEmit` — pre-existing error in `RotoEmpiricalStress.test.ts` (unrelated to Waves events)
- Weights sum 100, ungated escape choices preserved, no `chainTo` + `triggerCombat` co-occurrence

## Files modified

- `src/game/constants/events/wavesArcEvents.ts`
- `src/game/constants/regions/landOfWaves.ts`
- `region1-polish-backlog.md`
- `.agents/swarm-grok/SWARM-STATE.md`
- `.agents/swarm-grok/reports/W4-narrative.md` (this file)

## Out of scope / handoff

- R1-007 still open: compound climax not forced before interlude (system/UX, not pure content).
- Path-complete secret unlock vs flag unlock dual system still exists; only preferred pool for cache was fixed.
- No EventSystem / LocationSystem architecture edits.
