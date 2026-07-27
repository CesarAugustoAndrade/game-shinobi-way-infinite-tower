# A5 WAVE13 — EVENTOS regression (closedRef / treasure stage / chainTo / shonen)

**Agent:** A5-wave13-events  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Mandate regression only — DiceRollResultModal one-shot, treasure piece modal stage, EventResult closedRef + zero-options, chainTo + shonen residual  
**Constraint:** Fix only NEW bugs. No art. No prose rewrite. No commit.

---

## Executive summary

| Check | Result |
|-------|--------|
| DiceRollResultModal `closedRef` one-shot | **INTACT** |
| Treasure piece path always stages modal (`useTreasureHandlers`) | **INTACT** |
| EventResultModal `closedRef` one-shot | **INTACT** |
| `handleEventOutcomeClose` consume-first | **INTACT** |
| Event.tsx zero-options anti-softlock | **INTACT** |
| `chainTo` → real event ids | **18/18 OK** (test-guarded) |
| Shonen residual (`hope` / `believe` / `destiny` / `ninja way` / …) in `src/**` | **0 hits** |
| Event tests | **78/78 pass** |
| `npx tsc --noEmit` | **clean (exit 0)** |
| Code changes this wave | **none** |

**CLEAN regression wave — 0 fixes, 0 art, 0 prose.**

---

## 1. DiceRollResultModal closedRef one-shot

**File:** `src/components/modals/DiceRollResultModal.tsx` (WAVE12)

```ts
const closedRef = useRef(false);
const dismiss = useCallback(() => {
  if (closedRef.current) return;
  closedRef.current = true;
  onContinue();
}, [onContinue]);
```

- Keydown (Space / Enter / Escape, after result shown) → `dismiss`
- Continue button → `dismiss`
- Comment documents double `returnToMap` / `TREASURE_HUNT_REWARD` stage risk

**Handler belt:** `handleDiceResultContinue` still null-consumes `diceRollResult` before side effects.

**Status: INTACT — no fix required.**

---

## 2. Treasure piece path always stages modal

**File:** `src/hooks/useTreasureHandlers.ts` — `handleTreasureRollDice` piece branch (WAVE12 harden)

```ts
// Prefer floor hunt; fall back to session hunt so the result modal always opens
// (mapPieceAvailable already consumed — no modal = softlock).
const newHunt = updatedFloorWithPiece.treasureHunt ?? currentTreasureHunt;
// ...
// Always stage dismissable result (trap/nothing paths always set; piece must match)
setDiceRollResult({
  type: 'piece',
  piecesCollected,
  piecesRequired,
});
```

- Trap / nothing / piece all call `setDiceRollResult` after consuming `mapPieceAvailable`
- Piece counters prefer floor hunt, fall back to session hunt
- Complete-hunt path still stages modal + stores reward before early return

**Status: INTACT — no fix required.**

---

## 3. EventResult closedRef + zero-options guard

### 3.1 EventResultModal (`EventResultModal.tsx`)

```ts
const closedRef = useRef(false);
const dismiss = useCallback(() => {
  if (closedRef.current) return;
  closedRef.current = true;
  onClose();
}, [onClose]);
```

Space / Enter / Escape / Continue all go through `dismiss`.

### 3.2 `handleEventOutcomeClose` (useActivityHandlers)

1. Consume `eventOutcome` via functional `setEventOutcome` into a box first  
2. If already null → early return (blocks double Continue)  
3. `chainTo` path stages next event **without** completing the room  
4. Missing `nextEventId` target falls through to terminal complete (no soft hang)

### 3.3 Event.tsx zero-options

```ts
const availableChoices = useMemo(() => {
  const gated = player ? getAvailableChoices(activeEvent, player) : activeEvent.choices;
  // Anti-softlock guard: never open an event with zero selectable options.
  return gated.length > 0 ? gated : activeEvent.choices;
}, [activeEvent, player]);
```

`choiceLocked` still blocks double confirm.

**Status: INTACT — no fix required.**

---

## 4. chainTo / shonen residual

### 4.1 chainTo

- 18 `chainTo:` edges across waves / rogue / war arc event files  
- Content test: every target exists in `EVENTS`; no `chainTo` + `triggerCombat` same outcome  
- Runtime missing-target: terminal complete (see §3.2)

**18/18 OK.**

### 4.2 Shonen residual

Grep (case-insensitive) across `src/**` `*.{ts,tsx,json}`:

```text
hope | believe | destiny | ninja way | believe in
hopeful | believing | destined | never give up | our destiny
```

| Scope | Hits |
|-------|------|
| `src/game/constants/events/**` | 0 |
| Full `src/**` | **0** |

**Residual = 0. No copy edits.**

---

## 5. Verification

```text
npx vitest run src/game/constants/events/__tests__/eventContent.test.ts
                 src/game/systems/__tests__/EventSystem.test.ts
→ 78 passed (2 files)

npx tsc --noEmit
→ clean (exit 0)
```

---

## 6. Residual matrix (mandate)

| # | Mandate item | Verdict |
|---|--------------|---------|
| 1 | DiceRollResultModal closedRef still one-shots | PASS (intact) |
| 2 | Treasure piece path always stages modal | PASS (intact) |
| 3 | EventResult closedRef + zero-options guard | PASS (intact) |
| 4 | chainTo / shonen residual 0 + event tests | PASS (18/18, 0 hits, 78/78) |
| 5 | Fix only NEW bugs | N/A — none found |

**CLEAN regression — 0 code delta, 0 art, 0 prose, no commit.**
