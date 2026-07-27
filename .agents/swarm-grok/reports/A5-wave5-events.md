# A5 WAVE5 — EVENTOS residual (consolidate storytelling)

**Agent:** A5-wave5-events  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Consolidate Waves arc tone + complete `mysteryFlavor` on all R1 `tiedStoryEvents` (no mass event add)

---

## Executive summary

Wave 5 is **consolidation only**: kill leftover shonen phrasing on the spine, put **`mysteryFlavor`** on every R1 event referenced by `landOfWaves.tiedStoryEvents`, and **skip** a new residual (coastal forest / smuggler's cave already have mystery-tied IDs from W2). Spine writers/gates/`chainTo` edges untouched.

Tone target held: cyber-terror economy of fear (ledgers, receipts, silence, invoices) — not "defend the village / show no fear / last hope."

---

## 1. Shonen tone audit → rewrites (5)

| Event | Before | After | Why |
|-------|--------|-------|-----|
| `meet_tazuna` | title **Meeting the Master Builder** | **The Builder on the Pier** | Quest-NPC framing → place + labor |
| `meet_tazuna` | "Wave's **last hope** does not stand tall" | "Wave's **last working builder** does not stand tall" | Hope-language kill |
| `protect_village` | title **Defend the Fishing Village** | **Collectors on the Boards** | Shonen defense beat → tax pressure |
| `protect_village` | "without their **pride**… contraband **hope**" | "without their **cut**… contraband **rations**" | Pride/hope → economy |
| `final_confrontation` | label **Show No Fear** | **Let the Hirelings Recalculate** | Creed line → risk-pricing stillness |

Spine structure (flags, weights, chain edges) unchanged.

---

## 2. `mysteryFlavor` coverage — all R1 `tiedStoryEvents`

### Already present (W2–W4 residuals)

| Event id | mysteryFlavor |
|----------|---------------|
| `docks_collector_ledger` | Someone is already pricing your silence. |
| `mist_omen_tide` | The fog keeps better maps than the living. |
| `shipwreck_whisper` | The drowned still count crates that never docked. |
| `manor_haunt_debt` | Not a ghost of revenge — a ghost of accounting. |
| `corrupt_merchant_scales` | The cut is heavier than the tax admits. |
| `riverside_traveler_pact` | Travelers sell roads the way collectors sell silence. |
| `bandit_outpost_toll` | Fear is the only currency that never devalues here. |
| `hidden_cove_silent_drop` | Cargo that never docks still has a schedule. |
| `drowned_shrine_black_tide` | The altar still accepts payments the living forgot how to name. |

### Added this wave (spine + orphans in preferred pools)

| Event id | mysteryFlavor |
|----------|---------------|
| `bridge_worker_plea` | Ryo buys names back. Silence buys nothing. |
| `mist_ambush_cache` | Boot-prints dry slower than the fog admits. |
| `tazuna_request` | Every plank has a price the collectors already know. |
| `meet_tazuna` | Contracts here are written in fog and unpaid wages. |
| `protect_village` | Tax is just hunger wearing a receipt. |
| `meet_inari` | Heroes are a tax paid when food runs out. |
| `protect_bridge` | Gato starves the hands that build, not the timber. |
| `final_showdown_setup` | An invoice paid in silence arrives as ice. |
| `final_confrontation` | Cruelty here is climate-controlled. |
| `gato_defeat` | Freedom in Wave is quieter than stories promised. |

### Location → tiedStoryEvents (all flavor-complete)

| Location | tiedStoryEvents | mysteryFlavor? |
|----------|-----------------|----------------|
| `the_docks` | `meet_tazuna`, `docks_collector_ledger` | yes / yes |
| `misty_beach` | `mist_ambush_cache`, `mist_omen_tide` | yes / yes |
| `coastal_forest` | `mist_omen_tide` | yes |
| `smugglers_cave` | `mist_ambush_cache` | yes |
| `fishing_village` | `protect_village`, `meet_inari`, `corrupt_merchant_scales` | yes ×3 |
| `riverside_camp` | `riverside_traveler_pact` | yes |
| `sunken_ship` | `shipwreck_whisper` | yes |
| `bridge_construction` | `protect_bridge`, `final_showdown_setup`, `bridge_worker_plea`, `tazuna_request` | yes ×4 |
| `bandit_outpost` | `bandit_outpost_toll` | yes |
| `abandoned_manor` | `manor_haunt_debt` | yes |
| `hidden_cove` | `hidden_cove_silent_drop` | yes |
| `drowned_shrine` | `drowned_shrine_black_tide` | yes |
| `gatos_compound` | `final_confrontation`, `gato_defeat` | yes / yes |

**Note:** chain-only `tazuna_road_mist` is not in any `tiedStoryEvents` list — left without flavor (UI only shows flavor when set; not a preferred-pool event).

---

## 3. Optional new residual — **not added**

Mission allowed **max 1** new event only if a location had **zero mystery**.

| Location | Existing preferred mystery | Decision |
|----------|---------------------------|----------|
| `coastal_forest` | `mist_omen_tide` (W2) | no new event |
| `smugglers_cave` | `mist_ambush_cache` (now flavored) | no new event |

No new flags, art plates, or `landOfWaves` rewiring.

---

## 4. Spine invariants (untouched)

```
meet_tazuna --chain--> tazuna_road_mist
protect_bridge (hold) --chain--> final_showdown_setup
final_confrontation (breach) --chain--> gato_defeat
```

| Flag writers/gates | Status |
|--------------------|--------|
| `tazuna_met`, `bridge_held`, `compound_breached`, `gato_settled` | unchanged |
| Residual deferred flags (`ledger_sabotaged`, `mist_omen_read`, `false_scales`, …) | unchanged |
| Weights, combat triggers, `chainTo` targets | unchanged |

---

## 5. Verification

```text
npx vitest run src/game/constants/events/__tests__/eventContent.test.ts
                 src/game/systems/__tests__/EventSystem.test.ts
→ 78 passed (2 files)

npx tsc --noEmit
→ clean (exit 0)
```

Invariants held: weights sum 100, chainTo targets exist, no chainTo+combat, flags read are written, every event has ungated escape.

---

## Files changed

| Path | Role |
|------|------|
| `src/game/constants/events/wavesArcEvents.ts` | 5 tone rewrites + 10 spine/orphan `mysteryFlavor` lines |
| `.agents/swarm-grok/reports/A5-wave5-events.md` | this report |

---

## Intentional non-goals

- No mass event add  
- No new residual for forest/cave  
- No spine rewrite / flag surgery  
- No new art / `image_gen`  
- No new unit tests  
- No commit  
- No `landOfWaves.ts` edit (wiring already complete W1–W4)  
