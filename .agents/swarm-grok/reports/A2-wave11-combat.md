# A2 WAVE11 — Combat UI (Production Smoke + P0/P1 Hunt)

**Agent:** A2-wave11-combat (Grok swarm)  
**Date:** 2026-07-23  
**Branch:** `develop` (no commit)  
**Scope:** Re-verify six double-submit locks; hunt soft-lock / hang / cutout / approach / reward / end-turn bugs; FloatingText race residual after A7b.  
**Constraints honored:** No combat math balance; no CSS restyle; tsc clean; no commit.  
**Prior (W10):** CLEAN on all six locks — re-verified present.

---

## Mission outcomes

**Verdict: 1 P1 fixed — post-death enemy-turn reschedule hang. Six locks still present. Cutout rewrite OK. FloatingText race residual none.**

| Item | Result |
|------|--------|
| Six double-submit locks | **All present** |
| Enemy cutout `enemy_` → `enemy_cut_` | **OK** (39/39 disk pairs) |
| FloatingText / combat log races | **None remaining** (A7b legacy App.css float race already removed) |
| New real combat bugs | **1 P1** — fixed in `useCombat.ts` |
| Source edits | `src/hooks/useCombat.ts` only |
| `npx tsc --noEmit` | **Clean** (exit 0) |

---

## 1. Double-submit locks — re-verification

| Lock | Location | Mechanism | Unlock / reset | Status |
|------|----------|-----------|----------------|--------|
| **Skill** | `src/hooks/useCombat.ts` `skillActionLockRef` | Sync ref after validation; `turnState !== 'PLAYER'` + hand membership | Early reject; victory/defeat; `useEffect` when `PLAYER` + AP/hand; `startCombat` / `resetCombat` | **Present** |
| **Victory** | `src/hooks/useCombat.ts` `victoryLockRef` | Ref before XP/ryo/`onVictory`; `setEnemy(null)` | `startCombat` / `resetCombat` | **Present** |
| **Approach Engage** | `src/components/combat/ApproachSelector.tsx` `commitLockRef` + `commitLocked` | Sync ref first on Confirm; Esc ignored mid-commit | Remount per open | **Present** |
| **End Turn** | `src/App.tsx` `onPassTurn` + Combat keyboard | `if (turnState !== 'PLAYER') return`; Space also gates turn + `e.repeat` | State gate | **Present** |
| **Reward Continue** | `src/App.tsx` `rewardCloseLockRef` | Ref first on `handleRewardClose` | Unlock when new `combatReward` | **Present** |
| **Elite Fight/Escape** | `src/hooks/useActivityHandlers.ts` `eliteResolveLockRef` | Ref first on both handlers | Unlock when new `eliteChallengeData` | **Present** |

Anchors unchanged from W10 (skill / victory / approach / end-turn / reward / elite).

---

## 2. P1 fix — enemy-turn hang after player death

### Bug

On enemy-turn kill (`result.playerDefeated`):

1. `setGameState(GAME_OVER)` only  
2. `turnState` stayed **`ENEMY_TURN`**  
3. `enemy` stayed non-null with HP > 0  
4. `setPlayer` / `setEnemy` identity updates re-fired the enemy-turn `useEffect`  
5. Condition `turnState === 'ENEMY_TURN' && enemy && enemy.currentHp > 0` still true  
6. **`processEnemyTurn` rescheduled every `TIMING.ENEMY_TURN_DELAY` forever** while GameOver UI showed  

W8/W10 listed this as “cosmetic” (UI early-return). It is a real **post-death hang**: infinite combat processing, log spam, wasted work. Skill-path death also left enemy live so auto-pass could re-enter combat.

### Fix (`src/hooks/useCombat.ts`)

1. **Enemy-turn `playerDefeated`:** `setGameState(GAME_OVER)` + `setEnemy(null)` + `setTurnState('PLAYER')` (parity with victory teardown).  
2. **Skill-path `playerDefeated`:** same clear of enemy + turn hygiene so auto-pass / upkeep cannot re-fire.  
3. **Effect gate:** require `player.currentHp > 0` (and timer mid-delay recheck) in addition to enemy HP.  
4. **Ordering:** do not `setEnemy(corpse)` before terminal victory/defeat branches — victory already nulls enemy; defeat nulls enemy explicitly.

No combat formula changes.

---

## 3. Adjacent smoke (no further fixes)

| Path | Result |
|------|--------|
| Skill / victory / approach / end-turn / reward / elite locks | **OK** |
| Victory skill-kill + enemy-turn kill | **OK** — `victoryLockRef` + `setEnemy(null)` |
| Reward Continue double-submit | **OK** — `rewardCloseLockRef` |
| Approach never closing (happy path) | **OK** — `setShowApproachSelector(false)` on skipCombat + combat start |
| Approach Esc mid-Engage | **OK** — ignored while `commitLockRef` |
| End Turn during non-PLAYER | **OK** — App gate + disabled button + keyboard turn gate |
| Reward double XP | **OK** — victory lock + single `handleCombatVictory` apply |
| Cutout rewrite | **OK** — `Combat.tsx` generic replace; skips `enemy_cut_`; onError portrait fallback |
| Disk cutouts | **39 portraits / 39 cutouts / 0 missing** (`public/assets`) |
| FloatingText | **OK** — timer-based `onComplete`; unique ids; A7b removed App.css legacy float race |
| Combat mini-log | **OK** — presentational; no race with floats |

### Residuals (non-blocking, unchanged)

1. Posture switch still lacks ref lock (one AP spend; state-gated).  
2. Same-tick double End Turn can emit two log lines; turn advances once.  
3. RewardModal primarily under `LOCATION_EXPLORE` (live path always sets that).  
4. Soft-share enemy art is A3 backlog, not combat logic.

---

## 4. Enemy cutout rewrite confirmation

```ts
// src/scenes/combat/Combat.tsx
const enemyCutout =
  enemy.image?.startsWith('/assets/enemy_') &&
  !enemy.image.startsWith('/assets/enemy_cut_')
    ? enemy.image.replace(/^\/assets\/enemy_/, '/assets/enemy_cut_')
    : undefined;
```

| Check | Result |
|-------|--------|
| Painted pool path rewrite | **Works** |
| No `enemy_cut_cut_*` double rewrite | **Yes** |
| Non-`/assets/enemy_` paths | cutout undefined → portrait mask |
| Missing cut load | CinematicViewscreen onError → portrait |
| Disk pairs | **39/39** |

---

## Files touched

| File | Change |
|------|--------|
| `src/hooks/useCombat.ts` | P1: stop enemy-turn reschedule after player death; skill-path death hygiene; player HP gate |
| `.agents/swarm-grok/reports/A2-wave11-combat.md` | This report |

**Not touched:** combat math/systems balance, CSS, skill data, git.

---

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **Clean** (exit 0) |
| Skill lock | **Present** |
| Victory lock | **Present** |
| Approach Engage lock | **Present** |
| End Turn gate | **Present** |
| Reward Continue lock | **Present** |
| Elite Fight/Escape lock | **Present** |
| Cutout rewrite + disk | **OK 39/39** |
| FloatingText race | **None** |
| P1 death hang | **Fixed** |

---

## Handoff

- Six production locks remain intact (W6–W11).  
- **Ship-relevant fix:** player death no longer leaves combat engine spinning on `ENEMY_TURN`.  
- **No commit** per swarm protocol.
