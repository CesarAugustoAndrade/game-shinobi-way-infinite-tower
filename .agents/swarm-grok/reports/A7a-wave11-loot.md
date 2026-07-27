# A7a WAVE11 — LOOT Production Verification

**Agent:** A7a WAVE11  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A7a-loot-items.md](./A7a-loot-items.md) · [A7a-wave2-loot.md](./A7a-wave2-loot.md) · [A7a-wave3-loot.md](./A7a-wave3-loot.md) · [A7a-wave4-loot.md](./A7a-wave4-loot.md) · [A7a-wave5-loot.md](./A7a-wave5-loot.md) · [A7a-wave6-loot.md](./A7a-wave6-loot.md) · [A7a-wave7-loot.md](./A7a-wave7-loot.md) · [A7a-wave8-loot.md](./A7a-wave8-loot.md) · [A7a-wave9-loot.md](./A7a-wave9-loot.md) · [A7a-wave10-loot.md](./A7a-wave10-loot.md)  
**Scope:** Production smoke — mutex hold + residual race hunt + item-tile art for R1 drops. **Verify-only if clean. No LootSystem balance. No new item art.**

---

## Verdict: **CLEAN** (verify-only, zero code changes)

W7–W10 locks still present. No new P0/P1 loot/merchant/treasure bugs found.

---

## Mandate 1 — Mutex presence (re-audit)

| Lock | Location | Status |
|------|----------|--------|
| Merchant **Leave** `merchantLeaveLockRef` | `src/hooks/useActivityHandlers.ts` | **Hold** — gates leave before room read; re-arms on `selectedBranchingRoom?.id`; leave bumps `merchantLockEpochRef` + clears service lock |
| Merchant service `merchantLockRef` + **epoch** | `useActivityHandlers.ts` | **Hold** — buy / reroll / slot / quality; timeout unlock only if epoch matches (W10 residual) |
| LOOT **Leave All** `leaveLockRef` | `src/scenes/rewards/Loot.tsx` | **Hold** — empty pile + confirm abandon; remount reset |
| LOOT claim `lootClaimLockRef` | `src/hooks/useInventoryHandlers.ts` | **Hold** — equip / sell / store |
| LOOT finish vs Learn `droppedSkillRef` | `useInventoryHandlers.ts` | **Hold** (W10) — auto-`returnToMap` uses live skill presence after 100ms claim settle |
| Treasure action `treasureActionLockRef` | `src/hooks/useTreasureHandlers.ts` | **Hold** — reveal / select / fight / dice / bag-full sell·leave·stash |
| Chest Claim & Continue UI `claimConfirmLockRef` | `src/scenes/rewards/TreasureChoice.tsx` | **Hold** (W10) — re-arms on new preview |
| Hunt reward UI `claimLockRef` | `src/scenes/rewards/TreasureHuntReward.tsx` | **Hold** — handler also atomically consumes `setTreasureHuntReward` |

---

## Mandate 2 — Race / soft-lock hunt

| Target | Finding | Status |
|--------|---------|--------|
| Double-claim chest | `treasureActionLockRef` + atomic `collected` + UI `claimConfirmLockRef` | **Clean** |
| Double-buy merchant | `merchantLockRef` + epoch + bag functional write; stock removed by id; sheet `selectedItem` derived from live list | **Clean** |
| Learn skill stale hand | Atomic `setDroppedSkill` consume; id match gate; restore on apply fail; concurrent Learn vs finish uses `droppedSkillRef` | **Clean** |
| Equip race (loot pile) | `lootClaimLockRef` + pile membership check + functional equip | **Clean** |
| Synthesis soft-lock | `applyCraftToPlayer` missing/ryo/space abort; Bag exits `synthesisMode` after attempt; Esc cancels synth | **Clean** |
| Empty loot / no Leave | Footer always renders Leave; `remainingCount === 0` → **"Step onward"**; `leaveLockRef` prevents double `returnToMap` | **Clean** |
| Leave All while claim in-flight | `requestLeave` / `confirmLeaveAll` gated on `isProcessing`; `finishLootItemClaim` only auto-leaves when pile item actually removed | **Clean** |
| Merchant leave mid-buy | Leave bumps epoch so delayed unlock cannot re-arm lock on re-enter | **Clean** |
| Fight / dice map-piece cross-path | Shared `mapPieceAvailable` consume; cancel re-arm (W8 hold) | **Clean** |

---

## Mandate 3 — Item-as-asset / item-tile paths

| Check | Result |
|-------|--------|
| LOOT / Treasure / Merchant use `item-tile` + `ArtIcon` + `resolveItemArt` | **Hold** |
| 9 components → `/assets/icons/components/*.jpg` on disk | **All present** |
| 45 artifact slugs (incl. macrons / apostrophes) → disk | **All present** (`missing: NONE`) |
| `ArtIcon` sticky `onError` reset on art identity change | **Hold** (W6) |
| Broken-img risk for common R1 drops (components) | **None** — registry `iconPath(..., 'jpg')` matches public files |

**Untouched:** no new art; no registry edits.

---

## Files touched

**None** (verify-only).

**Untouched by mandate:** `LootSystem.ts`, `synthesis.ts`, drop tables, merchant pricing, economy.

---

## Constraints

- No LootSystem balance changes  
- No unit tests added  
- No git commit  
- `npx tsc --noEmit` → **exit 0**

---

## Manual QA checklist (smoke)

1. LOOT: double Sell / Equip → single ryo / single equip (W7 hold)  
2. LOOT: 1 item + skill — Sell then Learn → single map return (W10 hold)  
3. LOOT: empty pile → **Step onward** once (W9 hold)  
4. LOOT: Leave confirm while selling → no-op until settle (W8 hold)  
5. Merchant: double Buy → single charge; bag-full blocks buy  
6. Merchant: Buy → Leave → re-enter → Buy still single-charge (epoch)  
7. Merchant: Leave shop button + Esc → single goodbye (W9 hold)  
8. Locked chest: Claim & Continue click + Enter → single bag add  
9. Hunt reward: Claim click + Enter → single ryo / single LOOT handoff  
10. Treasure bag-full: Stash [T] after free pocket  
11. Bag synth: failed craft exits synth mode; Esc cancels  
12. R1 common component drop tiles: painted jpg (not sticky broken img)

---

## Follow-ups (out of scope / optional hardening)

- Optional: `buyItem` stock membership check on latest `merchantItems` (UI already drops sold id; mutex serializes)  
- Optional: grant hunt-chamber `ryoBonus` on map-piece resolve (economy — deferred)  
- Optional: bag-full treasure multi-index pending race (last write wins; no double loot)  
- Mobile treasure/merchant bag management still desktop-sidebar biased  
- App shell dead Tailwind layout — A8  
- Optional: lift bag `synthesisMode` fully into App (W6)
