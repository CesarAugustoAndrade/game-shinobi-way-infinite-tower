# A7a WAVE9 — LOOT Production Verification

**Agent:** A7a WAVE9  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A7a-loot-items.md](./A7a-loot-items.md) · [A7a-wave2-loot.md](./A7a-wave2-loot.md) · [A7a-wave3-loot.md](./A7a-wave3-loot.md) · [A7a-wave4-loot.md](./A7a-wave4-loot.md) · [A7a-wave5-loot.md](./A7a-wave5-loot.md) · [A7a-wave6-loot.md](./A7a-wave6-loot.md) · [A7a-wave7-loot.md](./A7a-wave7-loot.md) · [A7a-wave8-loot.md](./A7a-wave8-loot.md)  
**Scope:** Production verification of loot / merchant / treasure locks from W7–W8. **NEW residual bugs only. No LootSystem balance.**

---

## Hunt summary

| Target | Finding | Status |
|--------|---------|--------|
| Merchant **Leave** double-submit | `leaveMerchant` only closed over `selectedBranchingRoom` then nullled it — button + Esc / double-click could **double `completeActivity` + double `returnToMapActivityComplete`** (re-chain / double location-complete meta). W8 noted leave vs lock residual; leave itself had no ref mutex | **Fixed** (`merchantLeaveLockRef` + hard-reset service lock on leave) |
| LOOT **Leave All** double-return | W8 gated confirm on `isProcessing` but empty-pile / confirm leave still lacked a sync mutex → double Enter / Leave them behind could **double `returnToMap`** | **Fixed** (`leaveLockRef` in `Loot.tsx`) |
| Treasure hunt reward claim UI | `claimed` state lags one frame (click + Enter) | **Fixed** (`claimLockRef`; handler consume already atomic) |
| W8 fight/dice map-piece cross-path | Re-audit | **Hold** |
| W8 treasure action mutex / reveal charge-first / bag-full | Re-audit | **Hold** |
| W8 LOOT leave vs in-flight sell / `finishLootItemClaim` removed-only auto-leave | Re-audit | **Hold** |
| W7 loot claim mutex / merchant service lock / bag-full stash / false hunter ryo | Re-audit | **Hold** |
| W6 synth equip session / ArtIcon / merchant bag-full buy | Re-audit | **Hold** |
| `LootSystem.ts` / recipes / drop tables | Untouched (no balance) | **Hold** |

### Re-audit clean (no change)

| Area | Result |
|------|--------|
| `lootClaimLockRef` equip/sell/store + functional `finishLootItemClaim` | Hold |
| `merchantLockRef` buy / reroll / slot / quality | Hold |
| `treasureActionLockRef` reveal / select / fight / dice / bag-full sell·leave·stash | Hold |
| Fight consumes `mapPieceAvailable`; Approach cancel re-arms | Hold |
| Treasure bag-full **Stash [T]** + no false hunter ryo strip | Hold |
| Loot skill `learnSkill` atomic drop consume | Hold |
| Hunt reward handler atomic `setTreasureHuntReward` consume | Hold |
| Bag craft `applyCraftToPlayer` missing-material guard | Hold |
| ArtIcon sticky `imageError` reset on art identity change | Hold |
| Bag `synthesisSession` equip-path arm | Hold |

---

## Fixes

### 1. Merchant leave double-complete (`useActivityHandlers.ts`)

**Root cause:** Same class as W7/W8 service locks — room pointer from render closure is not a hard mutex until React commits. Leave shop (button + Esc) could run `completeActivity` and `returnToMapActivityComplete` twice.

**Fix:**

- `merchantLeaveLockRef` gates leave before reading room  
- Re-arm when `selectedBranchingRoom?.id` is set (new shop visit)  
- On leave: clear `merchantLockRef` + `isProcessingLoot` so mid-buy timeout cannot strand processing after exit (W8 follow-up)

### 2. LOOT leave-all double-return (`Loot.tsx`)

**Root cause:** Confirm path re-checked `isProcessing` but not a sync ref. Empty pile or confirmed abandon could double-fire `onLeaveAll` → `returnToMap` → double activity chain / floor complete.

**Fix:**

- `leaveLockRef` on `requestLeave` (empty pile) and `confirmLeaveAll`  
- Resets on LOOT remount (next victory pile)

### 3. Hunt reward claim UI mutex (`TreasureHuntReward.tsx`)

**Root cause:** `claimed` useState lags; click + Enter same tick both pass.

**Fix:** `claimLockRef` before `setClaimed` / `onClaim` (handler still consumes reward atomically).

---

## Files touched

| File | Change |
|------|--------|
| `src/hooks/useActivityHandlers.ts` | `merchantLeaveLockRef`; leave clears service processing lock |
| `src/scenes/rewards/Loot.tsx` | `leaveLockRef` on leave-all paths |
| `src/scenes/rewards/TreasureHuntReward.tsx` | `claimLockRef` on claim |

**Untouched:** `LootSystem.ts`, `synthesis.ts`, drop tables, merchant pricing, `useInventoryHandlers` claim mutex, `useTreasureHandlers` action lock (W7–W8 hold).

---

## Constraints

- No LootSystem balance changes  
- No unit tests added  
- No git commit  
- `npx tsc --noEmit` → **exit 0**

---

## Manual QA checklist

1. Merchant: double-click **Leave shop** → single goodbye log; single return to map; no double location clear  
2. Merchant: **Esc** leave once with no selection → same single complete  
3. Merchant: buy then immediately leave → purchase sticks; map returns once; no stuck processing  
4. LOOT empty pile: double **Enter** → single `returnToMap`  
5. LOOT with spoils: confirm **Leave them behind** double-click → single abandon  
6. LOOT: open leave confirm → sell drop → leave stays disabled / no-op while processing (W8 hold)  
7. Treasure hunt reward: click Claim + Enter same tick → single ryo / single LOOT transition  
8. W8 hold: Fight then **D** blocked; Fight → Cancel → Fight/Dice available again  
9. W7 hold: LOOT double Sell single ryo; merchant double Reroll single charge; bag-full **Stash [T]** works  

---

## Follow-ups (out of scope)

- Mobile treasure/merchant bag management still desktop-sidebar biased  
- App shell dead Tailwind layout (`h-screen`, zinc) — A8  
- Optional: grant hunt-chamber `ryoBonus` on map-piece resolve (economy — deferred)  
- Optional: bag-full treasure multi-index pending race (last write wins; no double loot)  
- Optional: lift bag `synthesisMode` fully into App (W6)  
