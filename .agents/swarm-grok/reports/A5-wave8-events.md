# A5 WAVE8 — EVENTOS final residual QA

**Agent:** A5-wave8-events  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Final residual hope/destiny kill audit + full `tiedStoryEvents` resolve + event tests + `tsc`  
**Constraint:** No new events. No commit. Residual fixes only.

---

## Executive summary

Wave 8 is **final residual QA only** — no new events, no copy rewrites, no spine/flag/weight surgery.

| Check | Result |
|-------|--------|
| Shonen residual (`hope` / `believe` / `destiny` / `ninja way`) in `src/**` | **0 hits** |
| `tiedStoryEvents` → event DB resolve | **41 refs / 34 unique / 0 missing** |
| Event tests | **78/78 pass** (+ Story Events empirical 4/4) |
| `npx tsc --noEmit` | **clean (exit 0)** |
| Code changes this wave | **none** (WAVE7 already zeroed residuals) |

Tone held from prior waves: ledger / silence / wages / quiet — not hope / destiny / ninja way.

---

## 1. Shonen residual audit

Grep (case-insensitive) across entire `src/**` for:

```text
hope | believe | destiny | ninja way | ninja.?way
```

### Results

| Scope | Hits | Notes |
|-------|------|-------|
| `src/game/constants/events/**` | 0 | Event DB clean since WAVE6 |
| `src/game/**` (regions, campaign, roomTypes, etc.) | 0 | WAVE7 residual rewrites held |
| `src/components/**`, `src/hooks/**`, `src/App.tsx` | 0 true | Only false-positive substring **destination** (not destiny) |
| Full `src/**` node walk | **0** | Confirmed script + ripgrep |

### Intentionally out of scope (not runtime copy)

| Location | Why left |
|----------|----------|
| `docs/seinen-sublime-visual-specs.md` ("hope corrupted") | Design doc, not runtime |
| `CHANGELOG.md` (WAVE5 hope-language kill note) | Changelog history |

No `believe` / `ninja way` hits anywhere in `src`. **No residual fixes required this wave.**

---

## 2. `tiedStoryEvents` ↔ event DB (all regions)

Every preferred id on location configs was matched against authored event `id` fields in:

- `wavesArcEvents.ts` (20)
- `examsArcEvents.ts` (4)
- `rogueArcEvents.ts` (5)
- `warArcEvents.ts` (6)
- `academyArcEvents.ts` (3)
- `genericEvents.ts` (5)

**Catalog size:** 43 events. **Missing preferred ids:** none.

| Region file | Refs | Unique ids | Missing |
|-------------|------|------------|---------|
| `landOfWaves.ts` | 21 | 19 | 0 |
| `chuninExams.ts` | 5 | 4 (`giant_serpent_nest` ×2) | 0 |
| `sasukeRetrieval.ts` | 7 | 5 | 0 |
| `greatNinjaWar.ts` | 8 | 6 | 0 |
| **Totals** | **41** | **34 unique** | **0** |

> Note: WAVE7 table listed landOfWaves as 19 refs / war as 10; recount is **21 / 8**. Unique totals unchanged (34 / 0 missing).

### landOfWaves preferred pool (complete)

| Location | tiedStoryEvents | Resolves |
|----------|-----------------|----------|
| `the_docks` | `meet_tazuna`, `docks_collector_ledger` | yes |
| `misty_beach` | `mist_ambush_cache`, `mist_omen_tide` | yes |
| `coastal_forest` | `mist_omen_tide` | yes |
| `smugglers_cave` | `mist_ambush_cache` | yes |
| `fishing_village` | `protect_village`, `meet_inari`, `corrupt_merchant_scales` | yes |
| `riverside_camp` | `riverside_traveler_pact` | yes |
| `sunken_ship` | `shipwreck_whisper` | yes |
| `bridge_construction` | `protect_bridge`, `final_showdown_setup`, `bridge_worker_plea`, `tazuna_request` | yes |
| `bandit_outpost` | `bandit_outpost_toll` | yes |
| `abandoned_manor` | `manor_haunt_debt` | yes |
| `hidden_cove` | `hidden_cove_silent_drop` | yes |
| `drowned_shrine` | `drowned_shrine_black_tide` | yes |
| `gatos_compound` | `final_confrontation`, `gato_defeat` | yes |

Chain-only (not preferred): `tazuna_road_mist` — still in DB, unwired from preferred pools (correct).

### Other regions (complete)

| Region | Unique preferred ids |
|--------|----------------------|
| `chuninExams` | `forest_death_trap`, `rival_team_encounter`, `scroll_merchant`, `giant_serpent_nest` |
| `sasukeRetrieval` | `valley_vision`, `sound_four_ritual`, `curse_mark_amplifier`, `orochimaru_experiment`, `orochimaru_experiment_result` |
| `greatNinjaWar` | `scavengers_field`, `reanimated_envoy`, `reanimated_envoy_fate`, `white_zetsu_paranoia`, `envoy_gratitude_repaid`, `bijuu_chakra_fragment` |

Resolve path remains: `Location.tiedStoryEvents` → `RegionSystem` `preferredEventIds` → `pickEventForLocation` / `ensureStoryEvent` (T-033).

---

## 3. New events

**None.** Mission forbade new events; all preferred IDs already present.

---

## 4. Verification

```text
npx vitest run src/game/constants/events/__tests__/eventContent.test.ts
                 src/game/systems/__tests__/EventSystem.test.ts
→ 78 passed (2 files)

npx vitest run src/game/systems/__tests__/LocationSystem.test.ts -t "tiedStory"
→ 3 passed | 22 skipped

npx vitest run src/game/systems/__tests__/RotoChallenger2Empirical.test.ts -t "Story Events"
→ 4 passed | 7 skipped

npx tsc --noEmit
→ clean (exit 0)
```

---

## Files changed

| Path | Role |
|------|------|
| `.agents/swarm-grok/reports/A5-wave8-events.md` | this report only |

No source edits — residual surface already clean after WAVE7.

---

## Intentional non-goals

- No new events  
- No `tiedStoryEvents` rewiring  
- No spine / flag / weight / chain surgery  
- No art / image_gen  
- No new unit tests  
- No commit  
- No docs/CHANGELOG hope-string edits (not runtime)

---

## WAVE8 final status

**EVENTOS residual QA: PASS.**  
Hope-language residual = 0 · tiedStory resolve = 100% · tests + tsc clean · no code delta.
