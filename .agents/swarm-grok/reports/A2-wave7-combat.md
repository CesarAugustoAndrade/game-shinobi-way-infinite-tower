# A2 WAVE7 — Combat Residual Bug Hunt (minimal)

**Agent:** A2-wave7-combat (Grok swarm)  
**Date:** 2026-07-23  
**Branch:** `develop` (no commit)  
**Scope:** Real residual soft-lock / race bugs only — enemy turn, victory→reward, elite escape, cutout rewrite.  
**Constraints honored:** No combat math; no restyle; tsc clean; no commit.  
**Prior:** W6 fixed double-submit (skill/approach Engage) + approach Esc + End Turn gate.

---

## Mission outcomes

### 1. Enemy turn soft-lock — verified clean

| Check | Result |
|-------|--------|
| `ENEMY_TURN` effect requires `player && enemy && hp>0 && stats` | **OK** — schedules `processEnemyTurn` after `TIMING.ENEMY_TURN_DELAY` |
| Timer cleanup on dep change | **OK** — `clearTimeout` on re-run |
| Empty kit / all CD / stun / confuse | **OK** — `executeEnemyAction` early-returns; turn returns to `PLAYER` |
| DoT / reflection / counter kill on enemy turn | **OK** — `enemyDefeated` → `handleVictory` + `setTurnState('PLAYER')` |
| Victory clears enemy before re-run | **OK** — `setEnemy(null)` + turn PLAYER batched |
| Auto-pass during victory | **OK** — effect depends on `enemy`; null clears timer |

**No new enemy-turn soft-lock found.** No code change.

---

### 2. Confirmed bugs fixed

#### A. Reward after victory — double Continue race

**Bug:** `handleRewardClose` used only a `setCombatReward` box consume. React `useState` updaters re-read `lastRenderedState` until commit, so Space hold / Enter+click same-tick both saw a live reward → double `returnToMap` / double LOOT open (activity chain / floor-complete meta twice).

**Fix (`App.tsx`):**
- `rewardCloseLockRef` taken before clear.
- Unlock when a new `combatReward` is presented (`useEffect`).
- Dropped fragile box-updater pattern for close.

#### B. Elite challenge Fight / Escape — same-tick double resolve

**Bug:** W5 “consume `eliteChallengeData` first” via functional setState was incomplete: two events (button + F/E, or double-click) before commit both read the challenge → double approach / double escape roll / double `completeActivity` + `returnToMapActivityComplete`.

**Fix (`useActivityHandlers.ts`):**
- `eliteResolveLockRef` (same pattern as merchant / approach commit locks).
- Unlock when a new `eliteChallengeData` prompt appears.
- Read challenge from closure, then `setEliteChallengeData(null)`.

Success escape still completes floor + `returnToMapActivityComplete(updatedFloor)` (stale-snapshot safe). Fail still forces approach + `pendingArtifact`. Approach cancel still clears artifact (W6).

#### C. Victory double-apply guard

**Bug residual:** `handleVictory` gated only on `if (enemy)` — async `setEnemy(null)` does not block a same-tick second call → double XP/ryo / double `setCombatReward`.

**Fix (`useCombat.ts`):**
- `victoryLockRef` taken on first victory.
- Cleared in `startCombat` / `resetCombat` (with skill lock reset).

---

### 3. Cutout rewrite — still generic for new enemy ids

**Combat.tsx (unchanged; re-verified):**

```ts
const enemyCutout =
  enemy.image?.startsWith('/assets/enemy_') &&
  !enemy.image.startsWith('/assets/enemy_cut_')
    ? enemy.image.replace(/^\/assets\/enemy_/, '/assets/enemy_cut_')
    : undefined;
```

| Check | Result |
|-------|--------|
| Path rewrite uses resolved image, not pool id | **Yes** |
| Already `enemy_cut_*` → no double rewrite | **Yes** |
| A3 WAVE6 ids (`wild_boar`, `war_dog`, `trap_master`, `drowned_sailor`) | **Auto-map** to matching cutouts |
| Manifest `/assets/enemy_*` sources | **33** unique; **0** missing portraits |
| Matching `enemy_cut_*` on disk | **33/33** (0 missing cutouts) |
| Missing cut / icons path | `CinematicViewscreen` onError → portrait mask **intact** |

Any future A3 `enemy_<id>.png` auto-maps to `enemy_cut_<id>.png` when present. **No code change required.**

---

## Files touched

| File | Change |
|------|--------|
| `src/hooks/useActivityHandlers.ts` | Elite Fight/Escape ref lock + unlock on new prompt |
| `src/App.tsx` | RewardModal Continue ref lock + unlock on new reward |
| `src/hooks/useCombat.ts` | Victory ref lock; clear locks on start/reset combat |
| `.agents/swarm-grok/reports/A2-wave7-combat.md` | This report |

**Not touched:** combat math / `CombatWorkflowSystem` / `CombatCalculationSystem` / `EnemyTurnSystem`, CSS restyle, enemy AI, skill data, git.

---

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **Clean** (exit 0) |
| Enemy turn soft-lock paths | **None found** |
| Victory → reward (LOCATION_EXPLORE + RewardModal) | Path intact; Continue double-fire blocked |
| Elite escape success / fail | Consume + ref lock; fail → approach |
| Cutout pairs | **33/33** on disk; generic rewrite OK |

---

## Residual / handoff

1. **RewardModal only mounts under `LOCATION_EXPLORE`** (not `REGION_MAP`). Normal location combat sets `currentLocationId` → LOCATION_EXPLORE after 100ms. Theoretical hang if victory ever routes to REGION_MAP with `combatReward` set (HUD blocked, no modal). Not hit on primary location path; leave unless playtest sees it.
2. **~100ms blank** between `setEnemy(null)` and explore transition (combat unmounts while still `COMBAT`) — cosmetic only.
3. **Posture switch** still lacks ref lock (W6 residual; one AP spend). Out of WAVE7 minimum set.
4. **No commit** per swarm protocol.
