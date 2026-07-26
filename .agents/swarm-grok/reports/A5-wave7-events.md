# A5 WAVE7 — EVENTOS residual QA (no mass content)

**Agent:** A5-wave7-events  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Residual hope/destiny kill outside event DB + tiedStoryEvents resolve audit + thin-copy polish on shipwreck/manor + event tests

---

## Executive summary

Wave 7 is **residual QA only** — no new events, no spine/flag/weight surgery. Event-file hope-language was already zero after WAVE6; remaining hits lived in region/room/campaign copy. All `tiedStoryEvents` across all regions still resolve into `EVENTS`. `shipwreck_whisper` / `manor_haunt_debt` got a light description/log polish (not structural). Tests + `tsc` clean.

Tone held: ledger / silence / wages / quiet — not hope / destiny / ninja way.

---

## 1. Shonen residual audit → rewrites (6)

Grep (case-insensitive) on `src/game/**`: `hope`, `believe`, `destiny`, `ninja way`, `believe in`.

**Event files (`src/game/constants/events/**`):** 0 hits pre/post (WAVE6 already clean).

### Residual fixes (player-facing / region meta outside event DB)

| File | Field | Before | After |
|------|-------|--------|-------|
| `landOfWaves.ts` | `fishing_village.description` | "watch the bridge for **hope**" | "watch the bridge for **wages that never arrive**" |
| `landOfWaves.ts` | `LAND_OF_WAVES_CONFIG.theme` | "…**hope** in the face of despair" | "…**silence priced as survival**" |
| `campaign.ts` | Waves→Exams interlude body | "…and call it **hope**" | "…and call it **quiet enough**" |
| `roomTypes.ts` | `BOSS_GATE` WAR_ARC name | "**Destiny's** Door" | "**Last Muster** Door" |
| `sasukeRetrieval.ts` | path `dangerHint` | "**Destiny** waits" | "**The valley** waits" |
| `sasukeRetrieval.ts` | region `theme` | "Friendship vs **destiny**…" | "Friendship vs **path**…" |

Post-fix grep on `src/game/**` for those patterns: **0 matches**.

### Intentionally out of scope

| Location | Why left |
|----------|----------|
| `docs/seinen-sublime-visual-specs.md` ("hope corrupted") | Design doc, not runtime copy |
| `CHANGELOG.md` (WAVE5 hope-language kill note) | Changelog history |

No `believe` / `ninja way` hits anywhere in `src/game` before or after.

---

## 2. `tiedStoryEvents` ↔ event DB (all regions)

Script + prior WAVE6 table re-verified: every preferred id exists among authored events (`waves` / `exams` / `rogue` / `war` + generics).

| Region | Refs | Unique ids | Missing |
|--------|------|------------|---------|
| `landOfWaves` | 19 | 19 | 0 |
| `chuninExams` | 5 | 4 (`giant_serpent_nest` ×2) | 0 |
| `sasukeRetrieval` | 7 | 5 | 0 |
| `greatNinjaWar` | 10 | 6 | 0 |
| **Totals** | **41** | **34 unique** | **0** |

### landOfWaves preferred pool (still complete)

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

---

## 3. Copy polish — `shipwreck_whisper` / `manor_haunt_debt`

Neither event was structurally thin (4 choices, weights, combat branches, flags already WAVE2-grade). Polish = **prose texture only** (no flags / weights / choices / combat).

| Event | Change |
|-------|--------|
| `shipwreck_whisper` | Description: unpaid tally / intentional sink cargo; Surface Alone log: "accurate as a collector" |
| `manor_haunt_debt` | Description: de-duplicated mysteryFlavor echo; sale price under varnish; Leave Uninvited log: "unfinished business" |

Spine / flags (`shipwreck_whisper_done`, `shipwreck_listened`, `manor_haunt_done`, `manor_favor`) / outcome weights: **untouched**.

---

## 4. New events

**None.** All preferred IDs already present. Mission: no mass content; add only if missing id.

---

## 5. Verification

```text
npx vitest run src/game/constants/events/__tests__/eventContent.test.ts
                 src/game/systems/__tests__/EventSystem.test.ts
→ 78 passed (2 files)

npx vitest run src/game/systems/__tests__/RotoChallenger2Empirical.test.ts -t "Story Events"
→ 4 passed | 7 skipped

npx tsc --noEmit
→ clean (exit 0)
```

---

## Files changed

| Path | Role |
|------|------|
| `src/game/constants/regions/landOfWaves.ts` | fishing village + theme hope residual |
| `src/game/constants/regions/campaign.ts` | post-Waves interlude hope residual |
| `src/game/constants/roomTypes.ts` | WAR boss-gate Destiny residual |
| `src/game/constants/regions/sasukeRetrieval.ts` | dangerHint + theme destiny residual |
| `src/game/constants/events/wavesArcEvents.ts` | shipwreck / manor prose polish |
| `.agents/swarm-grok/reports/A5-wave7-events.md` | this report |

---

## Intentional non-goals

- No new events  
- No `landOfWaves` tiedStoryEvents rewiring  
- No spine / flag / weight / chain surgery  
- No art / image_gen  
- No new unit tests  
- No commit  
