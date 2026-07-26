# A5 WAVE12 — EVENTOS residual softlock / one-shot parity

**Agent:** A5-wave12-events  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Production residual only — anti-softlock, EventResult one-shot, hunt dice stuck paths, DiceRollResultModal closedRef parity  
**Constraint:** No new event art. No prose style rewrite unless residual/broken copy.

---

## Executive summary

| Check | Result |
|-------|--------|
| Event.tsx zero-options anti-softlock | **INTACT** |
| EventResultModal `closedRef` one-shot dismiss | **INTACT** |
| `handleEventOutcomeClose` consume-first | **INTACT** |
| `chainTo` → real event ids | **18/18 OK** (test-guarded) |
| Risk options without outcomes / weight integrity | **OK** (weights sum 100 + logMessage) |
| DiceRollResultModal `closedRef` parity | **FIXED** (was missing) |
| Hunt dice piece path always stages modal | **HARDENED** |
| Event tests | **78/78 pass** |
| `npx tsc --noEmit` | **clean (exit 0)** |
| Prose / art | **unchanged** |

**Code changes this wave:** 2 files (DiceRollResultModal + treasure dice piece softlock harden).

---

## 1. Event anti-softlock (zero options)

`src/scenes/activities/Event.tsx`:

```ts
const availableChoices = useMemo(() => {
  const gated = player ? getAvailableChoices(activeEvent, player) : activeEvent.choices;
  // Anti-softlock guard: never open an event with zero selectable options.
  return gated.length > 0 ? gated : activeEvent.choices;
}, [activeEvent, player]);
```

- Flag gating can hide choices; if **all** are hidden, UI falls back to full `activeEvent.choices` (never zero cards).
- Content invariant: every event has ≥1 fully ungated choice (no flags/reqs/costs) — **test pass**.
- `choiceLocked` still blocks double confirm on the same event.

**Status: INTACT — no fix required.**

---

## 2. EventResultModal closedRef + App consume-first

### Modal (`EventResultModal.tsx`)

```ts
const closedRef = useRef(false);
const dismiss = useCallback(() => {
  if (closedRef.current) return;
  closedRef.current = true;
  onClose();
}, [onClose]);
```

Space / Enter / Escape / Continue button all go through `dismiss`.

### Handler (`useActivityHandlers.handleEventOutcomeClose`)

1. Consume `eventOutcome` via functional `setEventOutcome` into a box first  
2. If already null → early return (blocks double Continue)  
3. `chainTo` path stages next event **without** completing the room  
4. If `nextEventId` is set but event missing → falls through to terminal complete (no soft hang)  
5. Terminal path runs `completeActivity` once + intel + `returnToMapActivityComplete`

**Status: INTACT — no fix required.**

---

## 3. Hunt audit

### 3.1 Choices → missing events

- Event `chainTo` edges: content test requires every target in `EVENTS` (**pass**).
- Missing-target runtime: `handleEventOutcomeClose` skips chain hop and completes room (anti-softlock).
- Treasure hunt is **not** event-id driven; dice outcomes are trap / nothing / piece only.

### 3.2 Stuck dice roll without dismiss

| Layer | Before WAVE12 | After |
|-------|---------------|--------|
| Modal one-shot | **No** `closedRef` — Space+click could double-fire `onContinue` | **`closedRef` + `dismiss`** (Rest/EventResult parity) |
| Handler consume-first | `handleDiceResultContinue` already null-consumes `diceRollResult` | **INTACT** |
| Piece path modal stage | `setDiceRollResult` only if `newHunt` truthy after `addMapPiece` | **Always** stages piece result (mapPiece already consumed) |

`diceRollPending` on TreasureChoice still disables re-roll while modal open.

### 3.3 Risk options without outcome

Content invariants (test-guarded):

- Every choice `outcomes` weights sum to **100**
- Every outcome has `logMessage` + valid `logType`
- Empty outcome arrays would fail weight sum (0 ≠ 100)

**No risk choice without rollable outcome found. No fix.**

---

## 4. DiceRollResultModal closedRef parity (FIXED)

**File:** `src/components/modals/DiceRollResultModal.tsx`

**Problem:** Keyboard + button both called `onContinue` directly with no one-shot guard. Space hold / Enter+click same tick could double `returnToMap` / double stage `TREASURE_HUNT_REWARD` (handler belt helps, modal parity was missing vs Rest/EventResult).

**Fix:**

```ts
const closedRef = useRef(false);
const dismiss = useCallback(() => {
  if (closedRef.current) return;
  closedRef.current = true;
  onContinue();
}, [onContinue]);
```

- Keydown → `dismiss`
- Continue button → `dismiss`
- Comment documents double-fire risk (parity Rest/EventResult)

---

## 5. Hunt piece-path harden (residual softlock)

**File:** `src/hooks/useTreasureHandlers.ts` — `handleTreasureRollDice` piece branch

**Problem:** After consuming `mapPieceAvailable`, piece result only called `setDiceRollResult` when `updatedFloor.treasureHunt` was truthy. Floor/session hunt desync would leave player with no modal, no re-roll, activity already completable → softlock.

**Fix:** Always stage `{ type: 'piece', piecesCollected, piecesRequired }` with floor hunt preferred and session hunt as fallback counters.

---

## 6. Files touched

| File | Change |
|------|--------|
| `src/components/modals/DiceRollResultModal.tsx` | `closedRef` + `dismiss` one-shot (mandate #4) |
| `src/hooks/useTreasureHandlers.ts` | Always open dice result on piece roll |

No event copy, no event art, no commit.

---

## 7. Verification

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

## 8. Residual matrix (mandate)

| # | Mandate item | Verdict |
|---|--------------|---------|
| 1 | Event zero-options guard | PASS (intact) |
| 2 | EventResultModal + consume-first one-shot | PASS (intact) |
| 3 | Hunt: missing events / stuck dice / risk no outcome | PASS after dice modal + piece stage harden |
| 4 | DiceRollResultModal closedRef parity | **FIXED** |
| 5 | No prose rewrite | Held |

**CLEAN residual wave — 2 code fixes, 0 art, 0 prose.**
