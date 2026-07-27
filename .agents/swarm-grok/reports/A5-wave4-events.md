# A5 WAVE4 — EVENTOS residual storytelling (secrets)

**Agent:** A5-wave4-events  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Hidden Cove + Drowned Shrine location-tied residual events, deferred payoffs, soft spine copy polish

---

## Executive summary

Region 1 secret locations finally get residual mystery beats: **Silent Drop** (hidden cove) and **Black Tide Vow** (drowned shrine). Both use investigate / pay / sabotage / leave postures, write payoff flags, and reappear on the spine without touching spine writers (`tazuna_met`, `bridge_held`, `compound_breached`, `gato_settled`, etc.).

Soft polish: missing `hintText` on several spine choices + denser one-line copy on three existing event intros. Preferred pools wired on `hidden_cove` / `drowned_shrine`. Art reuses plates only.

Tone unchanged: cyber-terror economy of fear (unlogged cargo, salt ledgers, silence as currency).

---

## 1. New residual events (`wavesArcEvents.ts`)

| id | Title | Location preferred | Postures | Flags written | Deferred spend |
|----|--------|-------------------|----------|---------------|----------------|
| `hidden_cove_silent_drop` | Silent Drop | `hidden_cove` | investigate / pay / sabotage / leave | `cove_drop_done`, `cove_manifest` | `final_confrontation` “Follow the Silent Manifest” → `gato_defeat` |
| `drowned_shrine_black_tide` | Black Tide Vow | `drowned_shrine` | investigate / pay(HP) / sabotage / leave | `shrine_vow_done`, `black_tide_read` | `gato_defeat` “Claim the Black Tide Vault” |

### Choice risk copy pattern (matches W2/W3)

- **Investigate** — LOW, stat gate, intel + payoff flag  
- **Pay** — SAFE/MEDIUM (ryo or HP), quiet payoff flag  
- **Sabotage** — HIGH, combat-weighted  
- **Leave** — SAFE ungated escape (anti-softlock)

No new `chainTo` edges from residuals (payoffs are deferred spine choices only).

---

## 2. Deferred payoffs (flags reappear later)

| Flag | Written by | Spent on |
|------|------------|----------|
| `cove_manifest` | cove investigate/pay/sabotage success | `final_confrontation` “Follow the Silent Manifest” → chain `gato_defeat` |
| `black_tide_read` | shrine investigate/offer/break success | `gato_defeat` “Claim the Black Tide Vault” (extra coffer) |

Existing residual flags (`ledger_sabotaged`, `mist_omen_read`, `manor_favor`, `shipwreck_listened`, `false_scales`, `traveler_route`, `outpost_cowed`, `waves_cold`, …) **untouched**.

Spine writers/gates **unchanged**.

---

## 3. landOfWaves wiring (`tiedStoryEvents`)

| Location | tiedStoryEvents (after) |
|----------|-------------------------|
| `hidden_cove` | **`hidden_cove_silent_drop`** (new preferred pool) |
| `drowned_shrine` | **`drowned_shrine_black_tide`** (new preferred pool) |

Location blurbs tightened to match residual tone (tide schedules / salt accounts).

---

## 4. Soft polish (existing events, no walls of text)

| Event | Change |
|-------|--------|
| `tazuna_request` | Intro: collectors price missing planks as names |
| `final_showdown_setup` | Intro tightened; `hintText` on senbon + shield choices |
| `docks_collector_ledger` | Intro tightened (fog prices you first) |
| `protect_bridge` | `hintText` on chakra clear |
| `final_confrontation` | `hintText` on roof infiltrate |
| `gato_defeat` | `hintText` on return coin + fund village |

---

## 5. Art (`eventArtManifest.ts`)

| Event id | Plate (reuse) | Category |
|----------|---------------|----------|
| `hidden_cove_silent_drop` | `/assets/icons/events/intelligence_network.jpg` | story |
| `drowned_shrine_black_tide` | `/assets/icons/events/hidden_shrine_blessing.jpg` | danger |

**No new `image_gen` plates** — reuse only.

---

## 6. Verification

```text
npx vitest run src/game/constants/events/__tests__/eventContent.test.ts
                 src/game/systems/__tests__/EventSystem.test.ts
→ 78 passed

npx tsc --noEmit
→ clean (exit 0)
```

Invariants held: weights sum 100, chainTo targets exist, no chainTo+combat, flags read are written, every event has ungated escape.

---

## Files changed

| Path | Role |
|------|------|
| `src/game/constants/events/wavesArcEvents.ts` | 2 residual events + deferred spine choices + soft polish |
| `src/game/constants/regions/landOfWaves.ts` | preferred pools + secret location blurbs |
| `src/game/constants/eventArtManifest.ts` | plates + `EVENT_CATEGORY_BY_ID` |
| `.agents/swarm-grok/reports/A5-wave4-events.md` | this report |

---

## Intentional non-goals

- No spine rewrite (Tazuna → road → bridge → showdown → compound → gato)  
- No docks residual rewrite (already W2-complete; only soft intro polish)  
- No new unit tests authored  
- No commit  
- Optional later: dedicated plates for secret residuals if reuse feels thin  

---

## Quick play map (W4 residual → payoff)

```
hidden_cove_silent_drop   --cove_manifest---->  final_confrontation soft breach → gato_defeat
drowned_shrine_black_tide --black_tide_read-->  gato_defeat black tide vault coffer
```
