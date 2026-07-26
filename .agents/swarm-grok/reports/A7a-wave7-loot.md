# A7a WAVE7 — LOOT Residual Bug Hunt Minimal

**Agent:** A7a WAVE7  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A7a-loot-items.md](./A7a-loot-items.md) · [A7a-wave2-loot.md](./A7a-wave2-loot.md) · [A7a-wave3-loot.md](./A7a-wave3-loot.md) · [A7a-wave4-loot.md](./A7a-wave4-loot.md) · [A7a-wave5-loot.md](./A7a-wave5-loot.md) · [A7a-wave6-loot.md](./A7a-wave6-loot.md)  
**Scope:** NEW residual bugs only on loot / merchant / treasure / bag. W6 fixed synth arm / ArtIcon sticky error / merchant buy mutex. **Fix confirmed only. No LootSystem balance.**

---

## Hunt summary

| Target | Finding | Status |
|--------|---------|--------|
| Loot equip/sell/store double-click | `isProcessingLoot` alone lags one frame → **double sell = double Ryō**; equip/store races on same pile | **Fixed** (ref mutex + functional writes) |
| `finishLootItemClaim` stale pile | Filtered from closure `droppedItems` → sequential A→B could restore phantom A or leave LOOT early | **Fixed** (functional filter) |
| Merchant reroll / slot / quality | Buy mutex only; service buttons could double-charge on rapid click | **Fixed** (shared `merchantLockRef`) |
| Treasure bag-full after free slot | Sidebars stay open on TREASURE; sell/equip frees pocket but UI only offered Sell/Leave — **no way to take the relic** | **Fixed** (`handleBagFullStash` + [T] Stash) |
| Treasure hunter false ryo UI | `+N Ryō discovered` shown on hunter path but **never granted** (ryo only on locked-chest claim) | **Fixed** (hide false promise; no economy grant) |
| Loot skill learn double-click | `learnSkill` could double-upgrade before `droppedSkill` cleared | **Fixed** (atomic drop consume) |

### Re-audit clean (no change)

| Area | Result |
|------|--------|
| W6 synth equip → bag session arm | Hold |
| W6 ArtIcon imageError reset | Hold |
| W6 merchant BUY bag-full UI | Hold |
| Component / artifact icons on disk | Untouched |
| `LootSystem.ts` / synthesis recipes / drop tables | **Untouched** (no balance) |

---

## Fixes

### 1. Loot claim race + stale finish (`useInventoryHandlers.ts`)

**Root cause:** Same class as W6 merchant buy — state flag lags; sell granted ryo without claim mutex. Finish filtered a stale pile snapshot.

**Fix:**

- `lootClaimLockRef` gates equip / sell / store
- equip / store use functional `setPlayer` + outcome box
- `finishLootItemClaim` uses `setDroppedItems(prev => prev.filter…)` and unlocks the mutex

### 2. Merchant service double-charge (`useActivityHandlers.ts`)

**Root cause:** Buy used `merchantBuyLockRef`; reroll / slot / quality only checked `isProcessingLoot`.

**Fix:** Shared `merchantLockRef` across buy + reroll + slot + quality; unlock on fail and after success timeout. Reroll reads slot/quality from the charged player snapshot.

### 3. Treasure bag-full stash (`useTreasureHandlers` + `TreasureChoice` + `App`)

**Root cause:** After bag-full, pending panel had Sell / Leave only. Player can free a bag slot via right sidebar during TREASURE but could not take the relic.

**Fix:**

- `handleBagFullStash` — pre-check space, claim chest, functional bag + ryo, complete
- UI: **Stash in Bag [T]** when `bagHasSpace`; copy guides free-pocket path
- Fence copy → **Fence the Relic** (secondary when stash available)

### 4. False hunter ryo display (`TreasureChoice.tsx`)

**Root cause:** `ryoBonus` only applied on locked-chest item claim (select / bag-full sell-leave-stash). Hunter UI still rendered `+N Ryō discovered` with no grant path.

**Fix:** Remove hunter ryo bonus strip (no balance grant — honesty only).

### 5. Loot skill double-learn (`App.tsx` `learnSkill`)

**Root cause:** Drop cleared after skill mutation; double-click could upgrade twice.

**Fix:** Atomic `setDroppedSkill` consume first; functional skill write; restore drop only on rare fail.

---

## Files touched

| File | Change |
|------|--------|
| `src/hooks/useInventoryHandlers.ts` | Loot claim mutex; functional equip/store; finish filter; drop unused `sellItemFn` import |
| `src/hooks/useActivityHandlers.ts` | Shared merchant lock on buy/reroll/slot/quality |
| `src/hooks/useTreasureHandlers.ts` | Functional treasure claim; `handleBagFullStash` |
| `src/scenes/rewards/TreasureChoice.tsx` | Stash UI + keys; hide hunter false ryo |
| `src/App.tsx` | Wire stash; harden `learnSkill` |

**Untouched:** `LootSystem.ts`, `synthesis.ts`, drop tables, merchant pricing constants, ArtIcon, bag synth session (W6).

---

## Constraints

- No LootSystem balance changes  
- No unit tests added  
- No git commit  
- `npx tsc --noEmit` → **exit 0**

---

## Manual QA checklist

1. Loot: rapid double-click **Sell** on one drop → single ryo grant; pile advances once  
2. Loot: equip then immediately equip second drop → both claim correctly; no phantom return  
3. Loot: bag full → Store disabled; free slot → Store works once  
4. Loot skill: double-click Learn/Upgrade → single level-up  
5. Merchant: rapid Reroll → charged once; stock refreshes once  
6. Merchant: Buy still bag-full gated (W6 hold); double-buy still blocked  
7. Treasure locked chest, bag full → Sell / Leave work; free a bag slot in sidebar → **Stash in Bag [T]** takes relic + ryo  
8. Treasure hunter: **no** `+N Ryō discovered` strip; fight/dice unchanged  
9. Bag equip-path Synthesize still arms preview (W6 hold)  
10. Merchant preview art still switches (W6 ArtIcon hold)

---

## Follow-ups (out of scope)

- Optional: grant hunt-chamber ryoBonus on map-piece resolve (would be economy change — deferred)  
- Mobile treasure bag management still desktop-sidebar biased  
- App shell dead Tailwind layout (`h-screen`, zinc) — A8  
- Lift bag `synthesisMode` fully into App (W6 optional follow-up)  
