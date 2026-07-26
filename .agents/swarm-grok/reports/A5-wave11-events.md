# A5 WAVE11 — EVENTOS storytelling production smoke

**Agent:** A5-wave11-events  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Residual shonen audit + EventResultModal one-shot dismiss + chainTo/SAFE/art spine smoke  
**Constraint:** No prose rewrites unless residual. No new event art. Fix only broken resolve / missing critical id / double-complete.

---

## Executive summary

Wave 11 is **production smoke only**. All checks hold from WAVE10; no regressions.

| Check | Result |
|-------|--------|
| Shonen residual (`hope` / `believe` / `destiny` / `ninja way` / `believe in`) in `src/**` | **0 hits** |
| `EventResultModal` `closedRef` one-shot dismiss (A4 WAVE10) | **INTACT** |
| `handleEventOutcomeClose` consume-first double-complete guard | **INTACT** |
| `chainTo` edges resolve to real event ids | **18/18 OK** (unique targets: 5) |
| `tiedStoryEvents` → event DB | **41 refs / 34 unique / 0 missing** |
| Critical spine art files + ids | **4/4 present** |
| Event tests | **78/78 pass** (+ Story Events 4/4; tiedStory 3/3) |
| `npx tsc --noEmit` | **clean (exit 0)** |
| Code changes this wave | **none** |

**CLEAN: matrix + 0 code.**

---

## 1. Shonen residual audit

Grep (case-insensitive) across `src/**` `*.{ts,tsx,json}`:

```text
hope | believe | destiny | ninja way | believe in
hopeful | believing | destined | ninja.?way | never give up | our destiny
```

| Scope | Hits |
|-------|------|
| `src/game/constants/events/**` | 0 |
| Full `src/**` | **0** |

No NEW residual. No copy edits.

---

## 2. EventResultModal one-shot dismiss

`src/components/modals/EventResultModal.tsx` (A4 WAVE10 parity):

```ts
const closedRef = useRef(false);
const dismiss = useCallback(() => {
  if (closedRef.current) return;
  closedRef.current = true;
  onClose();
}, [onClose]);
```

- Space / Enter / Escape → `dismiss`
- Continue button → `dismiss`
- Comment documents double `completeActivity` / `returnToMapActivityComplete` risk

Belt-and-suspenders in `useActivityHandlers.handleEventOutcomeClose`:

1. Consume `eventOutcome` via functional `setEventOutcome` into a box first  
2. If already null → early return (blocks double Continue)  
3. `chainTo` path stages next event **without** completing the room  
4. Terminal path runs `completeActivity` once

**Status: INTACT — no fix required.**

---

## 3. Smoke matrix

### 3.1 `chainTo` edges (all resolve)

| Source arc | Target id | Edges | Exists |
|------------|-----------|-------|--------|
| waves | `tazuna_road_mist` | 1 | yes |
| waves | `final_showdown_setup` | 5 | yes |
| waves | `gato_defeat` | 7 | yes |
| waves | `tazuna_request` | 1 | yes |
| rogue | `orochimaru_experiment_result` | 2 | yes |
| war | `reanimated_envoy_fate` | 2 | yes |

**Missing targets: 0.** No `chainTo` + `triggerCombat` co-occurrence (test-guarded).

### 3.2 Land of Waves spine + critical art

Spine (authored comment in `wavesArcEvents.ts`):

`meet_tazuna` → `tazuna_road_mist` → `protect_bridge` → `final_showdown_setup` → `final_confrontation` → `gato_defeat`

| Event id | In EVENTS | Painted plate (`public/assets/`) |
|----------|-----------|----------------------------------|
| `meet_tazuna` | yes | `event_meet_tazuna.png` |
| `protect_bridge` | yes | `event_protect_bridge.png` |
| `final_confrontation` | yes | `event_final_confrontation.png` |
| `gato_defeat` | yes | `event_gato_defeat.png` |

(Also present, non-critical for this mandate: `event_final_showdown_setup.png`, reuse of meet_tazuna for `tazuna_road_mist`.)

**No missing critical event art. Ceiling held — no new paint.**

### 3.3 `tiedStoryEvents` resolve

| Region file | Refs | Unique | Missing |
|-------------|------|--------|---------|
| `landOfWaves.ts` | 21 | 19 | 0 |
| `chuninExams.ts` | 5 | 4 | 0 |
| `sasukeRetrieval.ts` | 7 | 5 | 0 |
| `greatNinjaWar.ts` | 8 | 6 | 0 |
| **Totals** | **41** | **34** | **0** |

Catalog: **43** events. Preferred pool coverage 100%.

### 3.4 SAFE / anti-softlock exits

- Global invariant test: every event has ≥1 fully ungated choice (no flags/reqs/costs) — **pass**
- 40/43 events expose at least one `RiskLevel.SAFE` choice
- 3 intentional non-SAFE exits (still ungated / LOW risk leave):
  - `rival_team_encounter` — "Flee into the Forest" (LOW)
  - `curse_mark_amplifier` — leave path (ungated, not SAFE-labeled)
  - `white_zetsu_paranoia` — "Flee Through the Chaos" (LOW)

These do **not** promise SAFE in copy; leave is legible. **No fix.**

---

## 4. Verification commands

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
| `.agents/swarm-grok/reports/A5-wave11-events.md` | this report only |

**Source edits: 0.**

---

## Intentional non-goals

- No prose style rewrites  
- No new events / spine / flag surgery  
- No event art / image_gen  
- No commit  
- No CHANGELOG residual (not runtime)

---

## WAVE11 status

**EVENTOS storytelling production smoke: PASS (CLEAN).**  
Shonen residual = 0 · closedRef intact · chainTo 100% · tiedStory 100% · critical art spine 4/4 · tests + tsc clean · **0 code delta**.  
**No commit.**
