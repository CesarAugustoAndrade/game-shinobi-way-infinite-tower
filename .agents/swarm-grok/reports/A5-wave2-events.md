# A5 WAVE2 — EVENTOS residual (mysterious R1 side beats)

**Agent:** A5-wave2-events  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Residual Land of Waves side events + deferred flag payoffs + risk-chip polish

---

## Executive summary

Region 1 now has **four short mysterious side events** (docks ledger, mist omen, shipwreck whisper, manor haunt) with hunt / pay / sabotage / leave postures, legible risk before roll, and **flag hooks that reappear on the spine**. Orphan side content (`bridge_worker_plea`, `tazuna_request`) is preferred at the bridge. Art reuses existing plates (no new `image_gen`). Event choice risk chips are thicker, higher-contrast chips.

Tone: Darkest Dungeon pressure + cyber-terror economy of fear (collectors, contracts, silence for sale). No shonen cheer.

---

## 1. New residual events (`wavesArcEvents.ts`)

| id | Title | Location(s) preferred | Postures | Flags written | chainTo |
|----|--------|----------------------|----------|---------------|---------|
| `docks_collector_ledger` | Collector's Ledger | `the_docks` | investigate / pay / sabotage / leave (+ Tazuna cross-check) | `docks_ledger_done`, `docks_ledger_read`, `ledger_sabotaged` | → `tazuna_request` (if `tazuna_met` & no `bridge_labor`) |
| `mist_omen_tide` | Omen in the Mist | `misty_beach`, `coastal_forest` | investigate / pay(HP) / sabotage / leave | `mist_omen_done`, `mist_omen_read` | — |
| `shipwreck_whisper` | Whispers in the Hold | `sunken_ship` | investigate / hunt loot / sabotage(calm) / leave | `shipwreck_whisper_done`, `shipwreck_listened` | — |
| `manor_haunt_debt` | The Manor's Debt | `abandoned_manor` | investigate / pay / sabotage / leave | `manor_haunt_done`, `manor_favor` | — |

### Choice risk copy pattern (every residual)

- **Investigate** — LOW, stat gate, intel + flag  
- **Pay** — SAFE/MEDIUM, ryo or HP cost, quiet flag  
- **Sabotage / Hunt** — MEDIUM/HIGH, combat-weighted  
- **Leave** — SAFE ungated escape (anti-softlock)

---

## 2. Deferred payoffs (flags reappear later)

| Flag | Written by | Spent on |
|------|------------|----------|
| `ledger_sabotaged` | docks sabotage success | `protect_village` “Exploit the Cooked Ledger”; `final_confrontation` “Walk the Cooked Books” → chain `gato_defeat` |
| `mist_omen_read` | mist omen success paths | `protect_bridge` “Trust the Tide Omen” → chain `final_showdown_setup` |
| `manor_favor` | manor name/pay/burn success | `final_confrontation` “Call the Manor's Debt” → chain `gato_defeat` |
| `shipwreck_listened` | wreck whisper success | `gato_defeat` “Open the Hold Gato Hid” (second coffer) |
| `waves_cold` | existing walk-away on worker plea | `protect_village` “Face Your Cold Reputation” (HIGH hunt); `gato_defeat` “Buy Back the Names You Left” (pay 150 ryo) |

Spine flags (`tazuna_met`, `bridge_held`, `compound_breached`, `gato_settled`, etc.) **unchanged** in writers/gates from Wave1.

---

## 3. landOfWaves wiring (`tiedStoryEvents`)

| Location | tiedStoryEvents (after) |
|----------|-------------------------|
| `the_docks` | `meet_tazuna`, **`docks_collector_ledger`** |
| `misty_beach` | `mist_ambush_cache`, **`mist_omen_tide`** |
| `coastal_forest` | **`mist_omen_tide`** |
| `sunken_ship` | **`shipwreck_whisper`** |
| `bridge_construction` | `protect_bridge`, `final_showdown_setup`, **`bridge_worker_plea`**, **`tazuna_request`** |
| `abandoned_manor` | **`manor_haunt_debt`** |

Preferred pool + `requiresFlags` / `excludesFlags` still order the spine (e.g. `final_showdown_setup` only after `bridge_held`). Residual IDs are real GameEvents in `WAVES_ARC_EVENTS` (not dead data).

---

## 4. Art (`eventArtManifest.ts`)

| Event id | Plate (reuse) | Category |
|----------|---------------|----------|
| `docks_collector_ledger` | `/assets/icons/events/intelligence_network.jpg` | story |
| `mist_omen_tide` | `/assets/icons/events/mist_ambush_cache.jpg` | danger |
| `shipwreck_whisper` | `/assets/icons/events/abandoned_supply_cache.jpg` | danger |
| `manor_haunt_debt` | `/assets/icons/events/hidden_shrine_blessing.jpg` | story |

**No new `image_gen` plates** — reuse only.

---

## 5. Event.css risk-chip polish

- Choice left rail **4px → 6px** + inset risk tint  
- Risk badge: uppercase, hard border, hard shadow, min-width, glow  
- Risk segments larger + lit glow when on  
- Index chip borders/tint match risk  
- Hover/active preserve inset rail so risk color does not vanish on interaction  

---

## 6. Verification

```text
npx vitest run src/game/constants/events/__tests__/eventContent.test.ts
                 src/game/systems/__tests__/EventSystem.test.ts
→ 78 passed

RotoChallenger2Empirical story-event block: 4/4 pass
  (unrelated CRT z-index assert still fails pre-existing)

npx tsc --noEmit
→ pre-existing only: LocationMap.tsx BranchingFloor.isSecret (unrelated)
```

Invariants held: weights sum 100, chainTo targets exist, no chainTo+combat, flags read are written, every event has ungated escape.

---

## Files changed

| Path | Role |
|------|------|
| `src/game/constants/events/wavesArcEvents.ts` | 4 residual events + deferred spine choices |
| `src/game/constants/regions/landOfWaves.ts` | `tiedStoryEvents` wiring |
| `src/game/constants/eventArtManifest.ts` | plates + `EVENT_CATEGORY_BY_ID` |
| `src/scenes/activities/Event.css` | risk chip / rail polish |
| `.agents/swarm-grok/reports/A5-wave2-events.md` | this report |

---

## Intentional non-goals

- No spine rewrite (Tazuna → road → bridge → showdown → compound → gato)  
- No new unit tests authored  
- No commit  
- No permanent power generics re-opened in Waves free pool  
- Optional later: dedicated painted plates for the four residuals if reuse feels thin in play  

---

## Quick play map (residual → payoff)

```
docks_collector_ledger  --ledger_sabotaged-->  village / compound soft breach
                        --chain--> tazuna_request (if tazuna_met)
mist_omen_tide          --mist_omen_read---->  protect_bridge sure hold
shipwreck_whisper       --shipwreck_listened->  gato_defeat second coffer
manor_haunt_debt        --manor_favor-------->  compound side-gate breach
waves_cold (existing)   --------------------->  village hunt / gato buyback
```
