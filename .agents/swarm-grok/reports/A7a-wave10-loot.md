# A7a WAVE10 — LOOT Production Verification

**Agent:** A7a WAVE10  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A7a-loot-items.md](./A7a-loot-items.md) · [A7a-wave2-loot.md](./A7a-wave2-loot.md) · [A7a-wave3-loot.md](./A7a-wave3-loot.md) · [A7a-wave4-loot.md](./A7a-wave4-loot.md) · [A7a-wave5-loot.md](./A7a-wave5-loot.md) · [A7a-wave6-loot.md](./A7a-wave6-loot.md) · [A7a-wave7-loot.md](./A7a-wave7-loot.md) · [A7a-wave8-loot.md](./A7a-wave8-loot.md) · [A7a-wave9-loot.md](./A7a-wave9-loot.md)  
**Scope:** Production verification of merchant / loot / treasure locks from W7–W9. **NEW residual bugs only. No LootSystem balance.**

---

## Hunt summary

| Target | Finding | Status |
|--------|---------|--------|
| LOOT finish after concurrent Learn | `finishLootItemClaim` (100ms after sell/equip/store) closed over stale `droppedSkill` → after Learn consumed the scroll, empty pile still saw skill truthy and **skipped auto-`returnToMap`** (stuck empty LOOT until Step onward) | **Fixed** (`droppedSkillRef`) |
| Merchant leave vs delayed unlock | W9 cleared `merchantLockRef` on leave, but buy/reroll/slot/quality `setTimeout` unlock could still fire and **clear a lock taken by a re-entered shop** (or re-arm processing mid-flight) | **Fixed** (`merchantLockEpochRef`) |
| Locked-chest Claim & Continue UI | W9 added `claimLockRef` on hunt-reward claim; chest claim dialog still relied only on handler lock for click + Enter same tick | **Fixed** (`claimConfirmLockRef` in `TreasureChoice`) |
| W9 merchant leave double-complete | Re-audit | **Hold** |
| W9 LOOT leave-all `leaveLockRef` | Re-audit | **Hold** |
| W9 hunt reward `claimLockRef` + handler consume | Re-audit | **Hold** |
| W8 fight/dice map-piece cross-path + cancel re-arm | Re-audit | **Hold** |
| W8 treasure action mutex / reveal charge-first / bag-full | Re-audit | **Hold** |
| W8 LOOT leave vs in-flight sell / `finishLootItemClaim` removed-only | Re-audit | **Hold** |
| W7 loot claim mutex / merchant service lock / bag-full stash / false hunter ryo | Re-audit | **Hold** |
| W6 synth equip session / ArtIcon / merchant bag-full buy | Re-audit | **Hold** |
| `LootSystem.ts` / recipes / drop tables | Untouched (no balance) | **Hold** |

### Re-audit clean (no change)

| Area | Result |
|------|--------|
| `lootClaimLockRef` equip/sell/store + functional finish filter | Hold |
| `merchantLeaveLockRef` + re-arm on room id | Hold |
| `merchantLockRef` buy / reroll / slot / quality | Hold (+ epoch) |
| `treasureActionLockRef` reveal / select / fight / dice / bag-full | Hold |
| Fight consumes `mapPieceAvailable`; Approach cancel re-arms | Hold |
| Treasure bag-full **Stash [T]** + no false hunter ryo strip | Hold |
| Loot skill `learnSkill` atomic drop consume | Hold |
| Hunt reward handler atomic `setTreasureHuntReward` consume | Hold |
| Bag craft `applyCraftToPlayer` missing-material guard | Hold |
| ArtIcon sticky `imageError` reset on art identity change | Hold |
| Bag `synthesisSession` equip-path arm | Hold |
| LOOT `leaveLockRef` on leave-all paths | Hold |

---

## Fixes

### 1. LOOT finish vs concurrent Learn (`useInventoryHandlers.ts`)

**Root cause:** Sell/equip/store schedule `finishLootItemClaim` after 100ms. That callback closed over render-time `droppedSkill`. Learn in that window nulls the skill drop, but finish still saw the old skill and refused auto-leave when the pile was empty.

**Fix:**

- Keep `droppedSkillRef.current` synced every render  
- Finish auto-`returnToMap` uses the ref (live skill presence), not the stale closure

### 2. Merchant service lock epoch (`useActivityHandlers.ts`)

**Root cause:** Success paths unlock via `setTimeout(100|150)`. Leave hard-reset the ref (W9) but did not invalidate the pending timeout. Fast leave → re-enter shop → new buy could have its mutex cleared by the previous timeout.

**Fix:**

- `merchantLockEpochRef` increments on every lock take and on leave  
- Timeout / fail unlock only applies when epoch still matches  
- Leave bumps epoch before clearing lock

### 3. Chest claim dialog UI mutex (`TreasureChoice.tsx`)

**Root cause:** Same class as W9 hunt-reward claim — `claimResult` useState lags; Claim & Continue click + Enter same tick both pass. Handler lock already blocked double bag write; UI lock closes the gap and matches hunt-reward pattern.

**Fix:**

- `claimConfirmLockRef` gates `confirmClaim`  
- Re-arm when opening a new claim preview via `requestSelectItem`

---

## Files touched

| File | Change |
|------|--------|
| `src/hooks/useInventoryHandlers.ts` | `droppedSkillRef` for finish auto-leave |
| `src/hooks/useActivityHandlers.ts` | `merchantLockEpochRef` on buy/reroll/slot/quality + leave |
| `src/scenes/rewards/TreasureChoice.tsx` | `claimConfirmLockRef` on Claim & Continue |

**Untouched:** `LootSystem.ts`, `synthesis.ts`, drop tables, merchant pricing, bag synth session, ArtIcon, treasure handler action lock (W7–W8 hold), LOOT `leaveLockRef` (W9 hold).

---

## Constraints

- No LootSystem balance changes  
- No unit tests added  
- No git commit  
- `npx tsc --noEmit` → **exit 0**

---

## Manual QA checklist

1. LOOT: 1 item + skill — Sell then Learn in same breath → skill learned, single map return (no empty LOOT stick)  
2. LOOT: Learn skill only (no items) → single returnToMap  
3. Merchant: Buy → immediate Leave shop → single goodbye; no stuck processing  
4. Merchant: Buy → leave → re-enter shop quickly → Buy still single-charge (epoch holds)  
5. Merchant: double Leave / Esc → single complete (W9 hold)  
6. Locked chest: Claim & Continue click + Enter same tick → single bag add / single ryo / single room complete  
7. Treasure Hunter: Fight → D blocked; Fight → Cancel → Fight/Dice available (W8 hold)  
8. Bag full: Stash [T] after free pocket works (W7 hold)  
9. LOOT double Sell → single ryo (W7 hold); leave confirm while selling → no-op until settle (W8 hold)

---

## Follow-ups (out of scope)

- Mobile treasure/merchant bag management still desktop-sidebar biased  
- App shell dead Tailwind layout (`h-screen`, zinc) — A8  
- Optional: grant hunt-chamber `ryoBonus` on map-piece resolve (economy — deferred)  
- Optional: bag-full treasure multi-index pending race (last write wins; no double loot)  
- Optional: unexpected bag-full after claim pre-check still “mist” path (rare same-tick sidebar fill)  
- Optional: lift bag `synthesisMode` fully into App (W6)  
