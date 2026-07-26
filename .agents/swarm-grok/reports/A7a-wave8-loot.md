# A7a WAVE8 — LOOT Final Residual Bug Hunt

**Agent:** A7a WAVE8  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A7a-loot-items.md](./A7a-loot-items.md) · [A7a-wave2-loot.md](./A7a-wave2-loot.md) · [A7a-wave3-loot.md](./A7a-wave3-loot.md) · [A7a-wave4-loot.md](./A7a-wave4-loot.md) · [A7a-wave5-loot.md](./A7a-wave5-loot.md) · [A7a-wave6-loot.md](./A7a-wave6-loot.md) · [A7a-wave7-loot.md](./A7a-wave7-loot.md)  
**Scope:** NEW residual bugs only on loot / merchant / treasure / bag. W7 fixed double-sell, merchant races, bag-full stash. **Fix confirmed only. No LootSystem balance.**

---

## Hunt summary

| Target | Finding | Status |
|--------|---------|--------|
| Treasure **Fight + Dice** cross-path | `handleTreasureFightGuardian` did **not** consume `mapPieceAvailable` (dice did). Approach modal sits over TREASURE; keyboard **D** / dice button still worked → dice roll **and** later guardian victory could **double map pieces** | **Fixed** (fight consumes flag; cancel re-arms) |
| Treasure claim / bag-full double-fire | Select / Fence / Leave / Stash relied on eager `useState` side-effects without a sync ref → same-frame double-click could double ryo / double bag insert / double `completeActivity` | **Fixed** (`treasureActionLockRef`) |
| Treasure reveal free / double chakra | Reveal marked first, then charged; failed charge = free peek; double-click race | **Fixed** (lock + charge-first + refund if already revealed) |
| LOOT Leave confirm vs in-flight sell | Confirm dialog’s **Leave them behind** ignored `isProcessing` → leave while sell timeout pending → `finishLootItemClaim` could **double `returnToMap`** (re-chain activity / floor complete) | **Fixed** (gate confirm + only auto-leave when pile item was actually removed) |
| W7 loot claim mutex / merchant lock / bag-full stash | Re-audit | **Hold** |
| W6 synth equip session / ArtIcon / merchant bag-full buy | Re-audit | **Hold** |
| `LootSystem.ts` / recipes / drop tables | Untouched (no balance) | **Hold** |

### Re-audit clean (no change)

| Area | Result |
|------|--------|
| LOOT equip/sell/store `lootClaimLockRef` | Hold |
| Merchant buy/reroll/slot/quality shared lock | Hold |
| Treasure bag-full Stash [T] + false hunter ryo UI | Hold |
| Loot skill `learnSkill` atomic drop consume | Hold |
| Hunt reward claim UI `claimed` + reward consume | Hold |
| Bag craft `applyCraftToPlayer` missing-material guard | Hold |

---

## Fixes

### 1. Fight / dice map-piece cross-path (`useTreasureHandlers` + `App`)

**Root cause:** Dice atomically set `mapPieceAvailable: false`. Fight only *checked* the flag, then opened Approach while TREASURE stayed mounted with Fight/Dice still live (and window keydown **F**/**D** still bound).

**Exploit path:**

1. Treasure Hunter chamber → **Confront Guardian** (Approach open)  
2. Press **D** (or Dice) → roll resolves, activity may complete, piece may grant  
3. Finish Approach fight → victory `addMapPiece` again  

**Fix:**

- Fight: atomic `mapPieceAvailable: false` before spawning guardian (same as dice)  
- Dice: refuse if already consumed; copy notes fight-or-dice commit  
- Approach **cancel**: restore `mapPieceAvailable: true` so player can re-choose fight or dice  
- Combat start / skip-guardian still clear treasure as before  

### 2. Treasure action sync mutex (`useTreasureHandlers`)

**Root cause:** Same class as W6/W7 merchant/loot — state flags lag one frame; eager updater “consumed” flags are not a hard mutex under double-click.

**Fix:**

- `treasureActionLockRef` gates reveal / select / fight / dice / bag-full sell·leave·stash  
- Unlock on fresh uncollected chest (`useEffect`)  
- Reveal: charge chakra first, then reveal; refund if reveal already applied  

### 3. LOOT leave vs in-flight claim (`Loot.tsx` + `useInventoryHandlers`)

**Root cause:**

1. `confirmLeaveAll` did not re-check `isProcessing` after confirm opened  
2. `finishLootItemClaim` always `returnToMap()` when remaining pile empty — even when Leave All already cleared `droppedItems`  

**Fix:**

- Confirm leave gated + button `disabled={isProcessing}`  
- `finishLootItemClaim` tracks `removed`; auto-leave only if an item was actually pulled from the pile  

### 4. Hygiene

- `completeTreasureAndReturn` clears `pendingBagFullItem` so bag-full panel cannot leak into the next room  

---

## Files touched

| File | Change |
|------|--------|
| `src/hooks/useTreasureHandlers.ts` | Fight consumes map piece; action lock; reveal charge-first; bag-full lock; clear pending on complete |
| `src/App.tsx` | Approach cancel re-arms `mapPieceAvailable` for treasure guardian |
| `src/hooks/useInventoryHandlers.ts` | `finishLootItemClaim` no double-return after Leave All |
| `src/scenes/rewards/Loot.tsx` | Confirm leave respects `isProcessing` |

**Untouched:** `LootSystem.ts`, `synthesis.ts`, drop tables, merchant pricing, ArtIcon, bag synth session (W6).

---

## Constraints

- No LootSystem balance changes  
- No unit tests added  
- No git commit  
- `npx tsc --noEmit` → **exit 0**

---

## Manual QA checklist

1. Treasure Hunter: **Fight** → Approach open → **D** must **not** roll; status shows attempt spent  
2. Treasure Hunter: **Fight** → **Cancel** Approach → Fight and Dice both available again  
3. Treasure Hunter: **Dice** once → cannot Fight for a second piece  
4. Locked chest: double-click a relic with bag space → single bag add, single ryo bonus, single room complete  
5. Bag full: double **Fence** / **Stash** / **Leave** → single resolution  
6. Reveal: double **R** → single chakra spend, contents revealed once  
7. LOOT: open Leave confirm → Sell a drop → **Leave them behind** disabled / no-op until sell settles  
8. LOOT: Sell last item (no skill) → single return to map (no double chain)  
9. W7 hold: LOOT double Sell still single ryo; merchant double Reroll still single charge; bag-full Stash after free pocket still works  

---

## Follow-ups (out of scope)

- Mobile treasure bag management still desktop-sidebar biased (W6/W7)  
- App shell dead Tailwind layout (`h-screen`, zinc) — A8  
- Optional: grant hunt-chamber `ryoBonus` on map-piece resolve (economy — deferred W7)  
- Optional: pass `showApproachSelector` into TreasureChoice for friendlier “Approaching guardian…” copy under modal  
- Merchant leave does not hard-reset `merchantLockRef` (timeout unlock ~100–150ms; low risk)  
