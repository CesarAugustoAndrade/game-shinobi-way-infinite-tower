# A5 WAVE3 — EVENTOS production storytelling residual

**Agent:** A5-wave3-events  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** R1 location-tied mystery residual + deferred payoffs + Event mystery flavor + Waves generic soft-gate

---

## Executive summary

Region 1 gains **three short location-tied mystery side events** (false merchant scales, riverside ashfire travelers, bandit outpost toll) with investigate / pay / sabotage-or-intimidate / leave postures, legible risk, and **flag hooks that reappear on the spine**. Residual W2 events and the three new ones carry optional **`mysteryFlavor`** one-liners under the title. SceneBackdrop retained. Permanent-power caravan generic soft-gated out of Waves free pool.

Tone unchanged: cyber-terror economy of fear (weights, sold roads, unwritten tolls). No spine flag breakage.

---

## 1. New residual events (`wavesArcEvents.ts`)

| id | Title | Location preferred | Postures | Flags written | Deferred spend |
|----|--------|-------------------|----------|---------------|----------------|
| `corrupt_merchant_scales` | False Scales | `fishing_village` | investigate / pay / sabotage / leave | `merchant_scales_done`, `false_scales` | `protect_village` “Weigh the False Scales” |
| `riverside_traveler_pact` | Ashfire Pact | `riverside_camp` | investigate / pay / sabotage / leave | `camp_pact_done`, `traveler_route` (+ optional `hidden_cove_discovered` on sabotage success) | `protect_bridge` “Take the Traveler's Cut” → chain `final_showdown_setup` |
| `bandit_outpost_toll` | Toll of Stakes | `bandit_outpost` | investigate / pay / intimidate / leave | `outpost_toll_done`, `outpost_cowed` | `final_confrontation` “Walk the Cowed Road” → chain `gato_defeat` |

### Choice risk copy pattern (matches W2)

- **Investigate** — LOW, stat gate, intel + flag  
- **Pay** — SAFE, ryo cost, quiet flag  
- **Sabotage / Intimidate** — MEDIUM/HIGH, combat-weighted  
- **Leave** — SAFE ungated escape (anti-softlock)

No new `chainTo` edges from these residuals (payoffs are deferred spine choices only). Sabotage success on travelers may unlock `hidden_cove_discovered` (natural intel, not event chain).

---

## 2. Deferred payoffs (flags reappear later)

| Flag | Written by | Spent on |
|------|------------|----------|
| `false_scales` | merchant investigate/pay/sabotage success | `protect_village` “Weigh the False Scales” |
| `traveler_route` | camp investigate/pay/sabotage success | `protect_bridge` “Take the Traveler's Cut” → `final_showdown_setup` |
| `outpost_cowed` | outpost investigate/pay/intimidate success | `final_confrontation` “Walk the Cowed Road” → `gato_defeat` |

Existing W2 flags (`ledger_sabotaged`, `mist_omen_read`, `manor_favor`, `shipwreck_listened`, `waves_cold`) untouched.

Spine writers/gates (`tazuna_met`, `bridge_held`, `compound_breached`, `gato_settled`, etc.) **unchanged**.

---

## 3. landOfWaves wiring (`tiedStoryEvents`)

| Location | tiedStoryEvents (after) |
|----------|-------------------------|
| `fishing_village` | `protect_village`, `meet_inari`, **`corrupt_merchant_scales`** |
| `riverside_camp` | **`riverside_traveler_pact`** (new preferred pool) |
| `bandit_outpost` | **`bandit_outpost_toll`** (new preferred pool) |

Preferred pool + `requiresFlags` / `excludesFlags` still order the spine. Residual IDs are real `GameEvent`s in `WAVES_ARC_EVENTS`.

---

## 4. Event UI residual

- **`GameEvent.mysteryFlavor?: string`** in `types.ts`
- **Event.tsx**: one-line gold uppercase tag under title when set
- **Event.css**: `.event__mystery-flavor` (display font, tracking, subtle gold)
- **SceneBackdrop** kept (`dim={0.32}`)
- Populated on W2 residuals + all three W3 residuals

---

## 5. Soft-gate Waves generics

| Event | Change |
|-------|--------|
| `traveling_merchant_caravan` | Soft-gated out of Waves (`allowedArcs` academy/exams/rogue/war). R1 uses location false scales + dock economy; permanent `addMerchantSlot` diluted spine pressure. |
| `ancient_treasure_map` / `hidden_shrine_blessing` | Already soft-gated (W1) |
| `abandoned_supply_cache` / `intelligence_network` | Still in Waves (COMMON anchor + intel economy) |

---

## 6. Art (`eventArtManifest.ts`)

| Event id | Plate (reuse) | Category |
|----------|---------------|----------|
| `corrupt_merchant_scales` | `/assets/icons/events/traveling_merchant_caravan.jpg` | story |
| `riverside_traveler_pact` | `/assets/icons/events/intelligence_network.jpg` | story |
| `bandit_outpost_toll` | `/assets/icons/events/mist_ambush_cache.jpg` | danger |

**No new `image_gen` plates** — reuse only.

---

## 7. Verification

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
| `src/game/types.ts` | optional `mysteryFlavor` on `GameEvent` |
| `src/game/constants/events/wavesArcEvents.ts` | 3 residual events + deferred spine choices + flavor lines |
| `src/game/constants/regions/landOfWaves.ts` | `tiedStoryEvents` wiring |
| `src/game/constants/eventArtManifest.ts` | plates + `EVENT_CATEGORY_BY_ID` |
| `src/game/constants/events/genericEvents.ts` | soft-gate caravan out of Waves |
| `src/scenes/activities/Event.tsx` | mystery flavor under title |
| `src/scenes/activities/Event.css` | `.event__mystery-flavor` |
| `.agents/swarm-grok/reports/A5-wave3-events.md` | this report |

---

## Intentional non-goals

- No spine rewrite (Tazuna → road → bridge → showdown → compound → gato)  
- No hidden cove smuggler event this wave (camp sabotage can still unlock cove flag)  
- No new unit tests authored  
- No commit  
- Optional later: dedicated plates for W2/W3 residuals if reuse feels thin  

---

## Quick play map (W3 residual → payoff)

```
corrupt_merchant_scales  --false_scales---->  protect_village soft defense
riverside_traveler_pact  --traveler_route-->  protect_bridge sure hold → showdown
                         --sabotage------->  hidden_cove_discovered (intel)
bandit_outpost_toll      --outpost_cowed--->  compound soft breach → gato_defeat
```
