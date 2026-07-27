# A7a WAVE12 — LOOT / Merchant Soft-Lock Hunt

**Agent:** A7a WAVE12  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A7a-loot-items.md](./A7a-loot-items.md) · [A7a-wave2-loot.md](./A7a-wave2-loot.md) · … · [A7a-wave11-loot.md](./A7a-wave11-loot.md)  
**Scope:** Mutex verify + soft-lock hunt (merchant leave/buy, loot leave-all, treasure claim, learn-skill finish race). **Fix only real P0/P1. No economy rebalance. No new item art.**

---

## Verdict: **1 P1 fixed** (LOOT multi-path double `returnToMap`)

W7–W11 locks still present. Hunt targets (empty shop leave, synth materials, bag-full claim, treasure approach cancel) **clean**. New residual: concurrent LOOT exit paths could double-fire `returnToMap`.

---

## Mandate 1 — Mutex presence (re-audit)

| Lock | Location | Status |
|------|----------|--------|
| Merchant **Leave** `merchantLeaveLockRef` | `src/hooks/useActivityHandlers.ts` | **Hold** — gates leave before room read; re-arms on `selectedBranchingRoom?.id`; leave bumps `merchantLockEpochRef` + clears service lock |
| Merchant service `merchantLockRef` + **epoch** | `useActivityHandlers.ts` | **Hold** — buy / reroll / slot / quality; timeout unlock only if epoch matches (W10) |
| LOOT **Leave All** `leaveLockRef` | `src/scenes/rewards/Loot.tsx` | **Hold** — empty pile + confirm abandon; remount reset |
| LOOT claim `lootClaimLockRef` | `src/hooks/useInventoryHandlers.ts` | **Hold** — equip / sell / store |
| LOOT finish vs Learn `droppedSkillRef` | `useInventoryHandlers.ts` | **Hold** (W10) — auto-leave uses live skill after 100ms settle |
| LOOT multi-path exit `lootExitLockRef` | `useInventoryHandlers.ts` + `App.tsx` | **Fixed (W12)** — Leave All / Learn empty-pile / finish claim share one-shot `exitLootOnce` |
| Treasure action `treasureActionLockRef` | `src/hooks/useTreasureHandlers.ts` | **Hold** — reveal / select / fight / dice / bag-full sell·leave·stash |
| Chest Claim & Continue UI `claimConfirmLockRef` | `src/scenes/rewards/TreasureChoice.tsx` | **Hold** (W10) |
| Hunt reward UI `claimLockRef` | `src/scenes/rewards/TreasureHuntReward.tsx` | **Hold** |

---

## Mandate 2 — Soft-lock / race hunt

| Target | Finding | Status |
|--------|---------|--------|
| **Empty shop no leave** | Bare cart empty state still renders **Leave shop** + Esc → `leaveMerchant` (not gated by `isProcessing`) | **Clean** |
| **Synth without materials hang** | `applyCraftToPlayer` aborts missing/ryo/space; Bag exits `synthesisMode` after attempt; Esc / Cancel clears mode; empty partners status (not a hang) | **Clean** |
| **Bag full claim hang** | Select sets `pendingBagFullItem` without action lock; Fence / Leave / Stash [T] resolve under `treasureActionLockRef`; `completeTreasureAndReturn` clears pending | **Clean** |
| **Treasure approach cancel soft-lock** | Cancel restores `GameState.TREASURE` + re-arms `mapPieceAvailable` when `currentTreasure` still held; clears half-started enemy/artifact | **Clean** |
| **Learn skill finish race (W10)** | `droppedSkillRef` still prevents empty LOOT stick after concurrent Learn during 100ms claim settle | **Hold** |
| **LOOT multi-exit double `returnToMap`** | Leave All / confirm abandon, Learn (empty pile), and delayed `finishLootItemClaim` each called raw `returnToMap` with no shared mutex → double activity chain / double floor-complete meta | **Fixed** |

### Re-audit clean (no change)

| Area | Result |
|------|--------|
| Merchant leave vs delayed unlock epoch | Hold |
| Merchant leave double-complete | Hold |
| LOOT leave while sell in-flight (`isProcessing` gate) | Hold |
| Fight / dice map-piece cross-path + cancel re-arm | Hold |
| Treasure bag-full no false hunter ryo | Hold |
| Hunt reward atomic consume | Hold |
| ArtIcon sticky onError reset | Hold (no art work this wave) |

---

## Fix

### LOOT multi-path one-shot exit (`useInventoryHandlers.ts` + `App.tsx`)

**Root cause:** Three independent LOOT exit callers shared no mutex:

1. `Loot` Leave All / Step onward → `onLeaveAll` → `returnToMap`  
2. `learnSkill` when pile empty → `returnToMap`  
3. `finishLootItemClaim` (100ms after sell/equip/store) when pile empty + no skill → `returnToMap`  

`leaveLockRef` only covers (1) inside the Loot scene. Same-tick **confirm abandon + Learn**, or **finish settle + Leave**, could both enter `returnToMap` → re-chain `executeRoomActivity` or double `completeLocationAndReturnToRegion`.

**Fix:**

- `lootExitLockRef` + `exitLootOnce()` / `rearmLootExit()` in `useInventoryHandlers`  
- `finishLootItemClaim` auto-leave uses `exitLootOnce`  
- `learnSkill` empty-pile leave uses `exitLootOnce`  
- Loot `onLeaveAll={exitLootOnce}`  
- `useLayoutEffect` rearms when `gameState === LOOT` (before paint so a leftover lock cannot block Leave on first frame)

---

## Files touched

| File | Change |
|------|--------|
| `src/hooks/useInventoryHandlers.ts` | `lootExitLockRef`, `exitLootOnce`, `rearmLootExit`; finish uses one-shot exit |
| `src/App.tsx` | Wire `exitLootOnce` / rearm on LOOT; Learn + Leave All use one-shot exit |

**Untouched:** `LootSystem.ts`, `synthesis.ts`, drop tables, merchant pricing, treasure handler locks (W7–W10 hold), item art.

---

## Constraints

- No economy rebalance  
- No new item art  
- No unit tests added  
- No git commit  
- `npx tsc --noEmit` → **exit 0**

---

## Manual QA checklist

1. LOOT skill only: Learn + Step onward same breath → single map return (no double chain)  
2. LOOT skill only: confirm **Leave them behind** + Learn same tick → single abandon / single return  
3. LOOT last item sell settle + Leave → single return (finish + leave mutex)  
4. LOOT: 1 item + skill — Sell then Learn → single return after settle (W10 hold)  
5. LOOT empty pile double Enter → single Step onward  
6. Merchant empty cart: **Leave shop** + Esc → single goodbye  
7. Merchant: Buy → Leave → re-enter → Buy still single-charge (epoch)  
8. Bag synth: no partners / failed craft → Cancel/Esc exits mode (no hang)  
9. Treasure bag-full: Stash [T] / Fence / Leave all resolve  
10. Treasure Hunter: Fight → Cancel → Fight/Dice available again  

---

## Follow-ups (out of scope / optional)

- Optional: `buyItem` stock membership check on latest `merchantItems`  
- Optional: grant hunt-chamber `ryoBonus` on map-piece resolve (economy)  
- Optional: bag-full treasure multi-index pending race  
- Mobile treasure/merchant bag management still desktop-sidebar biased  
- Optional: lift bag `synthesisMode` fully into App (W6)  
