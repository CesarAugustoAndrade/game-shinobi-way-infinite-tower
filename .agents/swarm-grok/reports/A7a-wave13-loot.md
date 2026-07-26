# A7a WAVE13 — LOOT Double-Exit Regression

**Agent:** A7a WAVE13  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A7a-loot-items.md](./A7a-loot-items.md) · … · [A7a-wave12-loot.md](./A7a-wave12-loot.md)  
**Scope:** Regression — `lootExitLockRef` / `exitLootOnce` still guards Leave All + Learn + finish claim; merchant/treasure mutexes held; hunt **NEW** double-exit only. **Fix P0/P1 only. No economy. No art.**

---

## Verdict: **CLEAN** (verify-only, zero code changes)

W12 multi-path LOOT exit mutex still present and wired on all three exit callers. Merchant + treasure mutex stack held. No new P0/P1 double-exit found.

---

## Mandate 1 — `lootExitLockRef` / `exitLootOnce` (Leave All + Learn + finish claim)

| Path | Wire | Status |
|------|------|--------|
| Core one-shot | `useInventoryHandlers.ts` — `lootExitLockRef` → `exitLootOnce()` → single `returnToMap()` | **Hold** |
| Re-arm on LOOT open | `App.tsx` `useLayoutEffect` when `gameState === LOOT` → `rearmLootExit()` (layout so first frame is not soft-stuck) | **Hold** |
| **Leave All / Step onward** | `Loot` `onLeaveAll={exitLootOnce}` + scene `leaveLockRef` (empty pile / confirm abandon) | **Hold** |
| **Learn** (empty pile) | `App.learnSkill` → `if (droppedItems.length === 0) exitLootOnce()` | **Hold** |
| **Finish claim** (100ms settle) | `finishLootItemClaim` → `removed && remainingCount === 0 && !droppedSkillRef.current` → `exitLootOnce()` | **Hold** |
| No raw bypass | Grep: no LOOT exit path calls `returnToMap()` outside `exitLootOnce` for Leave/Learn/finish | **Hold** |

### Cross-path same-breath cases (static)

| Race | Guard chain | Result |
|------|-------------|--------|
| Confirm abandon + Learn | `leaveLockRef` + `exitLootOnce` | First wins; second no-ops |
| Finish settle + Leave | `exitLootOnce` (finish may fire while UI still LOOT during chain window) | Second blocked |
| Skill-only Learn + Step onward | Shared `exitLootOnce` | Single return |
| Leave All then finish (pile cleared by `returnToMap`) | `finishLootItemClaim` `removed === false` → skips exit | No double |

---

## Mandate 2 — Merchant / treasure mutexes

| Lock | Location | Status |
|------|----------|--------|
| Merchant **Leave** `merchantLeaveLockRef` | `useActivityHandlers.ts` | **Hold** — gates leave before room read; re-arms only when `selectedBranchingRoom?.id` truthy (null after leave does **not** re-arm) |
| Merchant service `merchantLockRef` + **epoch** | `useActivityHandlers.ts` | **Hold** — buy / reroll / slot / quality; timeout unlock only if epoch matches; leave bumps epoch + clears service lock |
| LOOT claim `lootClaimLockRef` | `useInventoryHandlers.ts` | **Hold** — equip / sell / store |
| LOOT finish vs Learn `droppedSkillRef` | `useInventoryHandlers.ts` | **Hold** (W10) |
| LOOT scene `leaveLockRef` | `Loot.tsx` | **Hold** |
| Treasure action `treasureActionLockRef` | `useTreasureHandlers.ts` | **Hold** — reveal / select / fight / dice / bag-full sell·leave·stash |
| Chest Claim & Continue UI `claimConfirmLockRef` | `TreasureChoice.tsx` | **Hold** |
| Hunt reward UI `claimLockRef` + handler consume | `TreasureHuntReward.tsx` + `handleTreasureHuntRewardClaim` | **Hold** |
| Dice continue consume | `handleDiceResultContinue` null-first `setDiceRollResult` | **Hold** |

---

## Mandate 3 — NEW double-exit hunt

| Target | Finding | Status |
|--------|---------|--------|
| LOOT multi-path (Leave / Learn / finish) | All three share `exitLootOnce` (W12) | **Clean** — no regression |
| LOOT leave during in-flight sell | `isProcessing` gates request/confirm; finish only exits when item removed | **Clean** |
| Chain window (`returnToMap` keeps LOOT until 100ms `executeRoomActivity`) | `lootExitLockRef` stays true; rearm only on `gameState` re-entry to LOOT | **Clean** |
| Merchant Leave + Esc same tick | `merchantLeaveLockRef` sync first | **Clean** |
| Merchant leave mid-buy / re-enter | Epoch invalidates stale unlock | **Clean** |
| Treasure Claim & Continue click + Enter | UI + handler locks | **Clean** |
| Treasure bag-full multi-button | `treasureActionLockRef` + atomic `collected` | **Clean** |
| Dice continue double | Result consume | **Clean** |
| Hunt reward claim double → LOOT/map | UI lock + atomic reward null | **Clean** |
| `completeTreasureAndReturn` double | Only after action lock + `collected`; lock not re-armed while collected/null | **Clean** |

**No P0/P1 double-exit residual found.**

---

## Files touched

**None** (verify-only).

**Untouched by mandate:** `LootSystem.ts`, `synthesis.ts`, drop tables, merchant pricing, item art.

---

## Constraints

- No economy rebalance  
- No new item art  
- No unit tests added  
- No git commit  
- `npx tsc --noEmit` → **exit 0**

---

## Manual QA checklist (regression)

1. LOOT skill only: Learn + Step onward same breath → single map return  
2. LOOT skill only: confirm **Leave them behind** + Learn same tick → single abandon / single return  
3. LOOT last item sell settle + Leave → single return (finish + leave mutex)  
4. LOOT: 1 item + skill — Sell then Learn → single return after settle  
5. LOOT empty pile double Enter → single Step onward  
6. Merchant empty cart: **Leave shop** + Esc → single goodbye  
7. Merchant: Buy → Leave → re-enter → Buy still single-charge (epoch)  
8. Locked chest: Claim & Continue click + Enter → single bag add  
9. Hunt reward: Claim click + Enter → single ryo / single LOOT handoff  
10. Treasure bag-full: Stash [T] / Fence / Leave all resolve once  

---

## Follow-ups (out of scope / optional)

- Optional: `buyItem` stock membership check on latest `merchantItems`  
- Optional: grant hunt-chamber `ryoBonus` on map-piece resolve (economy)  
- Optional: bag-full treasure multi-index pending race  
- Optional: global `returnToMap` one-shot at exploration layer (defense-in-depth; LOOT/merchant/treasure already local)
