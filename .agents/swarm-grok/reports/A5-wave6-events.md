# A5 WAVE6 — EVENTOS residual copy QA

**Agent:** A5-wave6-events  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Residual shonen copy kill in `wavesArcEvents` + landOfWaves `tiedStoryEvents` DB integrity

---

## Executive summary

Wave 6 is **copy QA only**: strip leftover **hope** phrasing from Waves arc event text (no structure/flag/weight changes), confirm every `landOfWaves.tiedStoryEvents` id resolves in the event DB, and re-run event integrity tests. **No new events** (all preferred IDs already wired and present).

Tone held: ledger / silence / ration economy — not hope / destiny / ninja way.

---

## 1. Shonen leftover audit → rewrites (3)

Grep targets in `wavesArcEvents.ts` (case-insensitive): `hope`, `believe`, `ninja way`, `destiny`.

| Event | Field | Before | After |
|-------|-------|--------|-------|
| `bridge_worker_plea` | logMessage (Leave a Purse) | "without **hope**" | "without **counting on more**" |
| `meet_inari` | hintText (Speak Without Theater) | "**Hope** is rationed here…" | "**Silence** is rationed here…" |
| `meet_inari` | logMessage (Speak Without Theater) | "— not **hope**. Attention." | "— not **a vow**. Attention." |

Post-fix grep on `wavesArcEvents.ts` for those four patterns: **0 matches**.

### Intentionally left (not in target list / anti-shonen framing)

| Snippet | Why kept |
|---------|----------|
| `mysteryFlavor` / description "Heroes are a tax…" (`meet_inari`) | Cynical economy framing from W5, not creed language |
| "buy passage, not friendship" (`manor_haunt_debt`) | Explicit anti-bond framing |

No `believe` / `ninja way` / `destiny` hits in the file before or after.

---

## 2. landOfWaves `tiedStoryEvents` ↔ event DB

All preferred ids are defined in `WAVES_ARC_EVENTS` and exported via `EVENTS` (`src/game/constants/index.ts`).

| Location | tiedStoryEvents | In WAVES_ARC_EVENTS / EVENTS |
|----------|-----------------|------------------------------|
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

**Totals:** 19 preferred references · **19 unique ids** · **0 missing** · **0 new events**

Chain-only (not in any `tiedStoryEvents`): `tazuna_road_mist` — present in DB, correctly unwired from preferred pools.

---

## 3. New events

**None.** Mission rule: add only for unwired `tiedStoryEvent`. No such bug.

---

## 4. Verification

```text
npx vitest run src/game/constants/events/__tests__/eventContent.test.ts
                 src/game/systems/__tests__/EventSystem.test.ts
→ 78 passed (2 files)

npx vitest run src/game/systems/__tests__/RotoChallenger2Empirical.test.ts -t "Story Events"
→ 4 passed (spine present + pick + location ties + resolve)

npx tsc --noEmit
→ clean (exit 0)
```

Spine structure, flags, weights, `chainTo` edges: **untouched**.

---

## Files changed

| Path | Role |
|------|------|
| `src/game/constants/events/wavesArcEvents.ts` | 3 residual hope-copy rewrites |
| `.agents/swarm-grok/reports/A5-wave6-events.md` | this report |

---

## Intentional non-goals

- No new events / residual content  
- No `landOfWaves.ts` edits (wiring complete)  
- No spine / flag / weight / chain surgery  
- No art / image_gen  
- No new unit tests  
- No commit  
