# A2 WAVE12 — Combat UI Soft-Lock Hunt

**Agent:** A2-wave12-combat (Grok swarm)  
**Date:** 2026-07-23  
**Branch:** `develop` (no commit)  
**Scope:** Re-verify W11 death hang fix; hunt approach cancel, elite escape, victory→map reward chain, auto-pass AP0, status stun infinite, GAME_OVER. Fix only real P0/P1 soft-locks.  
**Constraints honored:** No combat math balance; no CSS restyle; tsc clean; no commit.  
**Prior (W11):** P1 post-death enemy-turn reschedule hang fixed; six double-submit locks present.

---

## Mission outcomes

**Verdict: W11 death hang still fixed. 1 P1 soft-lock fixed (approach Exit during Engage). Victory reward chain hardened. Other hunt targets clean.**

| Item | Result |
|------|--------|
| W11 post-death hang | **Still fixed** — re-verified in `useCombat.ts` |
| Six double-submit locks | **All present** |
| Approach cancel soft-lock | **P1 fixed** — Exit Room mid-Engage |
| Elite escape | **OK** |
| Victory reward → map | **Hardened** (resolveExploreReturnState + REGION_MAP RewardModal) |
| Auto-pass / AP0 | **OK** (no soft-lock) |
| Status stun infinite | **OK** (finite durations + pass CTA) |
| GAME_OVER path | **OK** (W11 teardown intact) |
| Source edits | `ApproachSelector.tsx`, `useCombatVictory.ts`, `App.tsx` |
| `npx tsc --noEmit` | **Clean** (exit 0) |

---

## 1. W11 death/victory re-verification

### Enemy-turn `playerDefeated` (W11)

```ts
// src/hooks/useCombat.ts — enemy turn effect
} else if (result.playerDefeated) {
  setGameState(GameState.GAME_OVER);
  setEnemy(null);
  setTurnState('PLAYER');
  return;
}
```

### Skill-path `playerDefeated` (W11)

```ts
} else if (result.playerDefeated) {
  setGameState(GameState.GAME_OVER);
  setEnemy(null);
  setTurnState('PLAYER');
  skillActionLockRef.current = false;
  return;
}
```

### Effect gate (W11)

Requires `player.currentHp > 0` and `enemy.currentHp > 0`; mid-timer recheck cancels if either side is dead/cleared.

| Check | Result |
|-------|--------|
| Death clears enemy + turn `PLAYER` | **Present** |
| Enemy-turn reschedule after death | **Blocked** |
| Victory `victoryLockRef` + `setEnemy(null)` | **Present** |
| Auto-pass depends on `enemy` | **Present** (null clears countdown) |

**No regression on W11 fix.**

---

## 2. Six double-submit locks — re-verification

| Lock | Location | Status |
|------|----------|--------|
| **Skill** | `useCombat.ts` `skillActionLockRef` | **Present** |
| **Victory** | `useCombat.ts` `victoryLockRef` | **Present** |
| **Approach Engage** | `ApproachSelector.tsx` `commitLockRef` | **Present** (+ cancel gated) |
| **End Turn** | `App.tsx` `onPassTurn` turn gate | **Present** |
| **Reward Continue** | `App.tsx` `rewardCloseLockRef` | **Present** |
| **Elite Fight/Escape** | `useActivityHandlers.ts` `eliteResolveLockRef` | **Present** |

---

## 3. Soft-lock hunt results

### A. Approach cancel — **P1 FIXED**

**Bug:** Esc was ignored while `commitLockRef` held, but **Exit Room / X / footer Exit** called `onCancel` unguarded. After Engage:

1. `commitLockRef = true` → `onSelectApproach` → `startCombat` sets `COMBAT` + live enemy  
2. User (or double-click) hits Exit Room while approach overlay still mounted  
3. `handleApproachCancel` → `setEnemy(null)` while `gameState` stays **`COMBAT`**  
4. Combat UI requires `enemy` → **blank center forever** (soft-lock)

**Fix (`ApproachSelector.tsx`):**

- `handleCancel()` gates on `commitLockRef`  
- Header Exit, X, footer Exit use `handleCancel` + `disabled={commitLocked}`  
- Esc blocks cancel/back while committed (already for confirm; now unified)

Pre-commit Exit Room still works (treasure restore / map leave unchanged).

### B. Elite escape — **OK**

| Path | Result |
|------|--------|
| Success + `locationFloor` | `completeActivity` + `returnToMapActivityComplete(updatedFloor)` |
| Success + branching only | `REGION_MAP` |
| Fail | approach + `pendingArtifact`; cancel clears artifact (W6) |
| Double Fight/Escape | `eliteResolveLockRef` |
| Fight → approach cancel | map; elite incomplete → re-enter reopens challenge |

### C. Victory reward chain → map — **HARDENED**

| Path | Result |
|------|--------|
| Primary location combat | `resolveExploreReturnState` → `LOCATION_EXPLORE` when floor live + RewardModal |
| No location floor / no `currentLocationId` | `REGION_MAP` + **RewardModal now mounts there too** |
| Continue lock | `rewardCloseLockRef` |
| Elite artifact Continue | LOOT then `returnToMap` |
| No-loot Continue | `returnToMap` chain / complete |

**Change:** `useCombatVictory` uses `resolveExploreReturnState(region, !!locationFloor)` (avoids blank `LOCATION_EXPLORE` without floor). `App.tsx` renders RewardModal under `REGION_MAP` when `combatReward` set.

### D. Auto-pass / AP0 — **OK**

| Check | Result |
|-------|--------|
| Card exhausts AP | `finishCardPlay` → `ENEMY_TURN` when `apAfter <= 0` |
| Posture exhausts AP | same |
| Max AP floor | `Math.max(1, …)` terrain penalties — never open with 0 AP player turn after upkeep |
| Empty hand | “end your turn (Space)” + End Turn enabled |
| Auto-end toggle | countdown only when `enemy` live + PLAYER turn |
| Naïve “AP0 → auto end” effect | **Must not add** without `upkeepProcessedThisTurn` (enemy-first opens PLAYER briefly at AP 0 before upkeep) |

No soft-lock: player can always End Turn / Space on PLAYER turn.

### E. Status stun infinite — **OK**

| Check | Result |
|-------|--------|
| Skill STUN durations | Finite 1–2 (no permanent CC in kits) |
| Player stun | Banner + “STUNNED - PASS TURN”; Space works |
| Player stun tick | Enemy-turn Phase 2 `tickBuffDurations` |
| Enemy stun duration 1 | Skips action; expires Phase 4b |
| Cross-fight | `startCombat` strips non-event/CURSE buffs |

No infinite stun soft-lock.

### F. GAME_OVER path — **OK**

| Check | Result |
|-------|--------|
| Enemy-turn death | GAME_OVER + `setEnemy(null)` + turn PLAYER (W11) |
| Skill-path death | same |
| GameOver UI | early return; Enter/Esc → menu |
| Post-death engine spin | blocked by HP/enemy gates |

---

## Files touched

| File | Change |
|------|--------|
| `src/components/combat/ApproachSelector.tsx` | **P1:** gate Exit Room / X / footer cancel on Engage commit lock |
| `src/hooks/useCombatVictory.ts` | Victory post-state via `resolveExploreReturnState` |
| `src/App.tsx` | RewardModal on `REGION_MAP` when `combatReward` set |
| `.agents/swarm-grok/reports/A2-wave12-combat.md` | This report |

**Not touched:** combat math/systems balance, CSS restyle, skill data, git.

---

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **Clean** (exit 0) |
| W11 death hang | **Still fixed** |
| Six locks | **Present** |
| Approach Exit mid-Engage | **Fixed** |
| Elite escape | **OK** |
| Victory → reward modal | **Hardened** |
| AP0 / stun / GAME_OVER | **OK** |

---

## Residuals (non-blocking)

1. Posture switch still lacks ref lock (one AP spend; state-gated).  
2. Same-tick double End Turn can emit two log lines; turn advances once.  
3. ~100ms blank between `setEnemy(null)` and explore transition after victory (cosmetic).  
4. Soft-share enemy art remains A3 backlog.

---

## Handoff

- **Ship-relevant fix:** Exit Room during Engage can no longer clear the enemy under `COMBAT` and freeze the shell.  
- W11 death teardown re-verified intact.  
- Victory reward chain uses floor-aware return state; RewardModal available on region map fallback.  
- **No commit** per swarm protocol.
