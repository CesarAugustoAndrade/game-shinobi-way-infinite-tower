# Event poster alias plan (Land of Waves residual)

**Source of truth:** `src/game/constants/eventArtManifest.ts`  
**Scope:** Event IDs that **reuse another event’s plate** (same `src` as a different id’s dedicated art).  
**Goal:** Recommend which aliases should get **dedicated vertical posters** first, ordered by Land of Waves residual impact.  
**Policy:** Documentation only — do **not** retarget the manifest until dedicated `event_<id>.png` plates exist (or a deliberate remap of orphan art is approved).

---

## Summary

| Kind | Count | Notes |
|------|------:|-------|
| Manifest event keys (excl. categories) | 39 | Includes aliases |
| Category plates (`cat_*`) | 5 | Own art; not aliases |
| **Alias events (reuse another plate)** | **6** | Listed below |
| Unique on-disk plate owners used by aliases | 5 | `meet_tazuna`, caravan, intel, mist_ambush, shrine_blessing |
| Orphan `public/assets/event_*.png` (not in manifest) | **2** | See [Orphan art](#orphan-art) |

Every residual alias already has a painted fallback; nothing is broken or emoji-only. Work is **identity polish** for the vertical Event poster (left rail).

---

## Alias inventory

An entry is an **alias** when its `src` filename does **not** match `event_<id>.png` for that entry’s `id` (or when two event keys share one file).

| Alias event id | Title (content) | Category | Plate reused (`src`) | Plate owner id | Manifest section |
|----------------|-----------------|----------|----------------------|----------------|------------------|
| `tazuna_road_mist` | Road Through the Mist | story | `/assets/event_meet_tazuna.png` | `meet_tazuna` | Spine (intentional soft share) |
| `corrupt_merchant_scales` | False Scales | story | `/assets/event_traveling_merchant_caravan.png` | `traveling_merchant_caravan` | A5 WAVE3 residual sides |
| `riverside_traveler_pact` | Ashfire Pact | story | `/assets/event_intelligence_network.png` | `intelligence_network` | A5 WAVE3 residual sides |
| `bandit_outpost_toll` | Toll of Stakes | danger | `/assets/event_mist_ambush_cache.png` | `mist_ambush_cache` | A5 WAVE3 residual sides |
| `hidden_cove_silent_drop` | Silent Drop | story | `/assets/event_intelligence_network.png` | `intelligence_network` | A5 WAVE4 residual secrets |
| `drowned_shrine_black_tide` | Black Tide Vow | danger | `/assets/event_hidden_shrine_blessing.png` | `hidden_shrine_blessing` | A5 WAVE4 residual secrets |

### Shared plate pressure

| Plate file | Owner | Also shown as |
|------------|-------|----------------|
| `event_meet_tazuna.png` | `meet_tazuna` | `tazuna_road_mist` |
| `event_traveling_merchant_caravan.png` | `traveling_merchant_caravan` | `corrupt_merchant_scales` |
| `event_intelligence_network.png` | `intelligence_network` | `riverside_traveler_pact`, **`hidden_cove_silent_drop`** (two aliases) |
| `event_mist_ambush_cache.png` | `mist_ambush_cache` | `bandit_outpost_toll` |
| `event_hidden_shrine_blessing.png` | `hidden_shrine_blessing` | `drowned_shrine_black_tide` |

`intelligence_network` is the only plate reused by **two** residual events — highest collision risk on a full map route that hits both riverside camp and hidden cove.

---

## Land of Waves residual context

Tied story events from `src/game/constants/regions/landOfWaves.ts` + residual blocks in `wavesArcEvents.ts`:

| Event id | Location | Location type / danger | Residual wave |
|----------|----------|------------------------|---------------|
| `corrupt_merchant_scales` | `fishing_village` | Settlement, D1 (main path) | WAVE3 sides |
| `riverside_traveler_pact` | `riverside_camp` | Wilderness branch, D3 | WAVE3 sides |
| `bandit_outpost_toll` | `bandit_outpost` | Stronghold, D5 | WAVE3 sides |
| `hidden_cove_silent_drop` | `hidden_cove` | Secret, D4 | WAVE4 secrets |
| `drowned_shrine_black_tide` | `drowned_shrine` | Secret, D6 | WAVE4 secrets |
| `tazuna_road_mist` | Spine chain after `meet_tazuna` | Story escort beat | Soft alias (same fog corridor) |

WAVE2 residual sides (`docks_collector_ledger`, `mist_omen_tide`, `shipwreck_whisper`, `manor_haunt_debt`) already have **dedicated** plates — out of scope for this plan.

Spine story plates (`meet_tazuna`, `protect_village`, `meet_inari`, `protect_bridge`, `final_showdown_setup`, `final_confrontation`, `gato_defeat`, etc.) are dedicated except `tazuna_road_mist`.

---

## Recommended paint order (dedicated art first)

Priority weights: **thematic mismatch** × **player encounter likelihood** × **location gravity** (danger / secret payoff) × **multi-alias plate collision**.

### P0 — paint next

| # | Event id | Target file | Why first |
|---|----------|-------------|-----------|
| 1 | `bandit_outpost_toll` | `public/assets/event_bandit_outpost_toll.png` | **Worst category/theme mismatch:** danger/toll at stake walls + war hounds, plate is a **reward-coded mist ambush cache**. Late D5 stronghold beat — high-stakes poster should not look like loot fog. |
| 2 | `drowned_shrine_black_tide` | `public/assets/event_drowned_shrine_black_tide.png` | **Polarity mismatch:** danger “black tide vow” / debt altar under water reuses **hidden shrine *blessing*** (reward/holy). R1’s deepest secret (D6) deserves its own atmosphere. |

### P1 — high residual value

| # | Event id | Target file | Why |
|---|----------|-------------|-----|
| 3 | `corrupt_merchant_scales` | `public/assets/event_corrupt_merchant_scales.png` | **Main-path village** (`fishing_village`); market scales + Gato seal vs **traveling caravan** (road reward). High encounter rate mid-arc. Orphan `event_fishing_village_event.png` is a **candidate remap** only if the image actually reads as false scales / tax stall — otherwise generate new. |
| 4 | `hidden_cove_silent_drop` | `public/assets/event_hidden_cove_silent_drop.png` | Secret cove silent drop; shares **intel network** with riverside residual → two distinct beats, one poster. Cove needs skiff / oilcloth crates / tide manifest, not generic intel. |

### P2 — acceptable soft share longer

| # | Event id | Target file | Why later |
|---|----------|-------------|-----------|
| 5 | `riverside_traveler_pact` | `public/assets/event_riverside_traveler_pact.png` | Camp ashfire + fish-skin maps; intel plate is vague but less contradictory than cache/blessing. After #4, `intelligence_network` is free of multi-alias pressure. |
| 6 | `tazuna_road_mist` | `public/assets/event_tazuna_road_mist.png` (optional) | **Intentional soft share** (manifest comment: same fog-corridor beat as `meet_tazuna`). Chain-adjacent; lowest identity bug. Only paint if spine poster variety is a playtest complaint. |

---

## Suggested poster beats (prompt seeds)

Keep full-bleed vertical posters, solid chroma key only if later cutout is needed; for Event UI these are typically opaque plates. Tone: Land of Waves mist, debt, Gato economy — not bright reward fantasy.

| Event id | Poster beat (one sentence) |
|----------|----------------------------|
| `bandit_outpost_toll` | Stake walls in grey rain; captain with Gato coin at collar; war hound at rest; unlisted “toll” as fear, not a cache chest. |
| `drowned_shrine_black_tide` | Underwater pillars, tide-debt script, air-bubble altar of old chakra — **vow/debt**, not blessing light. |
| `corrupt_merchant_scales` | Stilt-village stall; seal apron; rice scale with dark counterweight; villagers who do not argue. |
| `hidden_cove_silent_drop` | Lanternless skiff; oilcloth crates above high-water; wet manifest under a stone. |
| `riverside_traveler_pact` | Wrong-smoke campfire (salt-wood); three travelers; fish-skin maps of mist approaches. |
| `tazuna_road_mist` | Grey throat road; Tazuna half a step behind; wet milestone blood; bridge hammers distant — only if splitting from pier meet. |

---

## Wire-up checklist (when art lands)

For each new dedicated plate:

1. Drop `public/assets/event_<id>.png` (and mirror under project `assets/` if the tree still dual-tracks).
2. In `eventArtManifest.ts`, set that entry’s `src` to `/assets/event_<id>.png` (leave `quality: "painted-png"`).
3. Do **not** change owner events’ paths.
4. Smoke: open Event UI for the residual id; confirm poster ≠ previous shared plate; category fallback still works if `src` missing.
5. Optional: one-line note under `ART_BACKLOG_NOTES.T021_enemies_events` residual residual reuse list.

No unit tests unless explicitly requested.

---

## Orphan art

`public/assets/event_*.png` files present on disk but **not referenced** by any `src` in `EVENT_ART_MANIFEST`:

| File | Notes |
|------|--------|
| `public/assets/event_fishing_village_event.png` | No game event id `fishing_village_event`. Location id is `fishing_village`. Likely legacy location-themed plate. **Possible** candidate for `corrupt_merchant_scales` if visual matches market/tax — verify before remap. |
| `public/assets/event_gatos_compound_event.png` | No game event id `gatos_compound_event`. Boss location is `gatos_compound`; climax events already have dedicated plates (`final_confrontation`, `gato_defeat`). Keep as stock or retire; do not silently alias residual secrets to it. |

**Not orphans:** category plates (`event_cat_*.png`) and every other `event_*.png` currently listed as a manifest `src` owner or shared target.

**Cross-check method:** set of basenames `event_*.png` under `public/assets/` minus set of basenames appearing in `EVENT_ART_MANIFEST[].src`.

---

## Explicit non-goals

- Do not invent new residual events for orphan plates.
- Do not retarget aliases to orphans without visual review.
- Do not treat spine soft-share (`tazuna_road_mist` → `meet_tazuna`) as a blocker for R1 ship.
- Chunin / non-Waves events with dedicated plates are out of this residual queue.

---

## Quick reference — alias → owner

```
tazuna_road_mist          → meet_tazuna
corrupt_merchant_scales   → traveling_merchant_caravan
riverside_traveler_pact   → intelligence_network
bandit_outpost_toll       → mist_ambush_cache
hidden_cove_silent_drop   → intelligence_network
drowned_shrine_black_tide → hidden_shrine_blessing
```

**Paint order (short):**  
`bandit_outpost_toll` → `drowned_shrine_black_tide` → `corrupt_merchant_scales` → `hidden_cove_silent_drop` → `riverside_traveler_pact` → (`tazuna_road_mist` optional).
