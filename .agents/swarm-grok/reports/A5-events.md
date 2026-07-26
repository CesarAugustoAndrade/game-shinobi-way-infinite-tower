# A5 — EVENTOS (combate moral) — Region 1 Waves

**Agent:** A5-events  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Waves arc prose/spine, Event scene of choice UI, art wiring, generic soft-gate

---

## Executive summary

Region 1 events now behave as **moral combat of the tower**: cyber-terror seinen voice, legible hunt/pay/sabotage/leave postures, a real mini-arc spine with `chainTo` + deferred flag payoffs, and an Event UI that always sits on a **location biome take** (SceneBackdrop + cinematic plate). Generics that diluted permanent power in Waves free pool were soft-gated.

---

## 1. Waves arc data (`src/game/constants/events/wavesArcEvents.ts`)

### Voice kill-list (shonen → cyber-terror)

| Before | After |
|--------|--------|
| Tazuna's Request / honest work, spirit lighter | **Tazuna's Ledger** — unpaid wages, collectors counting boards |
| Inspire Him with Ninja Creed / teary hope | **Inari's Silence** — hunger, theater, attention not hope |
| The Clashing of Wills | **Ice on the Span** |
| Confronting Gato's Fortress | **Gato's Compound** |
| Tutorial walk-away hint ("result panel will confirm") | Ledger language only |

### Spine + chains

```
meet_tazuna  --chain-->  tazuna_road_mist
protect_bridge (hold success)  --chain-->  final_showdown_setup
final_confrontation (breach)  --chain-->  gato_defeat
```

| Flag | Written by | Used by |
|------|------------|---------|
| `tazuna_met` | meet_tazuna | tazuna_road_mist, tazuna_request, Hold Span for Tazuna |
| `tazuna_road_done` | tazuna_road_mist | excludes re-fire |
| `bridge_labor` | tazuna_request | excludes re-fire |
| `bridge_held` | protect_bridge (hold paths) | final_showdown_setup requires; Strike for the Bridge; Name the Bridge |
| `mist_showdown` | final_showdown_setup | excludes re-fire |
| `compound_breached` | final_confrontation breach | **gato_defeat requires** (anti pre-climax treasury) |
| `gato_settled` | gato_defeat | excludes re-fire |
| `waves_mercy` / `waves_cold` | bridge_worker_plea | village mercy path |
| `village_defended` | protect_village | gato_defeat "Fund the Village First" |
| `inari_met` / `inspired_inari` | meet_inari | gato_defeat "Put Inari on the Books" |

### Choice posture (consistent risk copy)

- **Hunt** — combat-weighted (kidnappers, collectors, storm gate, challenge Zabuza)
- **Pay** — ryo costs / buy freedom / treasury split
- **Sabotage** — quiet cache ruin, infiltrate roof
- **Leave** — walk away / shadows / perimeter / mist exit (always one ungated escape)

### Anti-climax fix

- `gato_defeat` now `requiresFlags: { compound_breached: 1 }` — cannot roll treasury before breach.
- `final_showdown_setup` requires `bridge_held` (free pool) and chains from hold success.
- Preferred location lists unchanged (tests still see all 7 story IDs tied); eligibility does the ordering.

---

## 2. Event UI (`Event.tsx` / `Event.css`)

- **SceneBackdrop** with `dim={0.32}` — event always feels like a take over location BG.
- **Cinematic plate**: `event__plate` / `event__plate-frame` / "Scene of Choice" tag; gold-bottom frame over plate art.
- Chain ribbon: **"Ledger continues"** (matches result modal).
- `background` prop already wired from `App.tsx` (`combatBackground`).
- Risk meters + outcome tooltips retained (legible risk before roll).

---

## 3. Result modals (tone consistency)

| Modal | Change |
|-------|--------|
| `EventResultModal` | "Outcome" title; ledger copy; "Continue the Ledger ▸" on chain |
| `DiceRollResultModal` | Sober results (no cheerleader caps); bait/dust/fragment prose |

---

## 4. Art (`eventArtManifest.ts`)

| Event id | Plate |
|----------|--------|
| All prior R1 story IDs | Existing icons/events/*.jpg or painted meet_tazuna |
| **tazuna_road_mist** (new wire) | Reuses `/assets/event_meet_tazuna.png` (same fog corridor) |

No new `image_gen` assets — reuse preferred.

---

## 5. Generics vs Waves spine (`genericEvents.ts`)

| Event | Waves free pool |
|-------|-----------------|
| `abandoned_supply_cache` | **Kept** (COMMON, low stakes); tone tightened |
| `traveling_merchant_caravan` | **Kept** (trade pressure fits docks) |
| `intelligence_network` | **Kept** (intel tax fits Gato economy) |
| `ancient_treasure_map` | **Soft-gated out** → ACADEMY/EXAMS/ROGUE/WAR only |
| `hidden_shrine_blessing` (EPIC) | **Soft-gated out** → same (no permanent power in R1 free pool) |

---

## 6. Tests touched

- `RotoChallenger2Empirical.test.ts`: preferred pick supplies per-event open flags for `final_showdown_setup` / `gato_defeat`.
- Event content + EventSystem suites: **78 passed**.
- No new unit tests authored.

---

## Files changed

| Path | Role |
|------|------|
| `src/game/constants/events/wavesArcEvents.ts` | Prose, chains, flags, deferred payoffs |
| `src/game/constants/events/genericEvents.ts` | Soft-gate + tone |
| `src/game/constants/eventArtManifest.ts` | tazuna_road_mist plate |
| `src/scenes/activities/Event.tsx` | Plate header, ledger chain, dim backdrop |
| `src/scenes/activities/Event.css` | Cinematic plate frame |
| `src/components/modals/EventResultModal.tsx` | Ledger tone |
| `src/components/modals/DiceRollResultModal.tsx` | Sober dice copy |
| `src/game/systems/__tests__/RotoChallenger2Empirical.test.ts` | Flag-aware pick |

---

## Intentional non-goals / follow-ups

- No boss identity rewrite (Zabuza vs Gato dual climax still exists; order is fixed by flags/chains).
- `waves_cold` is written but not yet a deferred punishment path — reserved for later heat.
- Combat-win paths that never set `bridge_held` / `compound_breached` still rely on retry (pre-existing pattern).
- Interlude/Victory chips for Tazuna/Inari still out of scope for A5.

---

## Verification

```text
npx vitest run src/game/constants/events/__tests__/eventContent.test.ts
                 src/game/systems/__tests__/EventSystem.test.ts
→ 78 passed
npx tsc --noEmit → clean
```
