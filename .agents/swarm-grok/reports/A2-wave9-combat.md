# A2 WAVE9 — Combat Production Verification

**Agent:** A2-wave9-combat (Grok swarm)  
**Date:** 2026-07-23  
**Branch:** `develop` (no commit)  
**Scope:** Production verification — double-submit locks + residual soft-lock smoke only.  
**Constraints honored:** No combat math; no restyle; tsc clean; no commit.  
**Prior fixed (not re-fixed):** W6 skill/approach Engage lock + Esc + End Turn gate; W7 victory / reward Continue / elite Fight-Escape locks; W8 enemy AI hang + status clear + cutout smoke.

---

## Mission outcomes

**Verdict: CLEAN — all six double-submit locks present. No new real combat bugs found. Verification report only.**

No source files modified.

---

### 1. Double-submit locks — production verification

| Lock | Location | Mechanism | Unlock / reset | Status |
|------|----------|-----------|----------------|--------|
| **Skill double-submit** | `src/hooks/useCombat.ts` `skillActionLockRef` | Sync ref after validation; gate `turnState !== 'PLAYER'` + hand membership | Cleared on early reject; victory/defeat; `useEffect` when `turnState === 'PLAYER'` + AP/hand commit; `startCombat` / `resetCombat` | **Present** |
| **Victory double-apply** | `src/hooks/useCombat.ts` `victoryLockRef` | Ref taken before XP/ryo/`onVictory`; also `setEnemy(null)` | `startCombat` / `resetCombat` | **Present** |
| **Approach Engage** | `src/components/combat/ApproachSelector.tsx` `commitLockRef` + `commitLocked` | Sync ref first on Confirm; button disabled / “Engaging…”; Esc ignored mid-commit | Component remount per open (stateful) | **Present** |
| **End Turn gate** | `src/App.tsx` `onPassTurn` | `if (turnState !== 'PLAYER') return` before log + `setTurnState('ENEMY_TURN')` | N/A (state gate) | **Present** |
| **Reward Continue** | `src/App.tsx` `rewardCloseLockRef` | Ref first on `handleRewardClose` before `setCombatReward(null)` | `useEffect` unlock when new `combatReward` set | **Present** |
| **Elite Fight/Escape** | `src/hooks/useActivityHandlers.ts` `eliteResolveLockRef` | Ref first on both handlers before consume | Unlock when new `eliteChallengeData` prompt | **Present** |

#### Code anchors (smoke-read)

**Skill** (`useCombat.ts`):
```ts
if (turnState !== 'PLAYER') return;
if (skillActionLockRef.current) return;
// …validation…
skillActionLockRef.current = true;
```

**Victory** (`useCombat.ts`):
```ts
if (victoryLockRef.current) return;
if (!enemy) return;
victoryLockRef.current = true;
// …setEnemy(null); onVictory(...)
```

**Approach** (`ApproachSelector.tsx`):
```ts
if (!selectedApproach || commitLockRef.current) return;
commitLockRef.current = true;
setCommitLocked(true);
onSelectApproach(selectedApproach);
```

**End Turn** (`App.tsx` → Combat):
```ts
onPassTurn={() => {
  if (turnState !== 'PLAYER') return;
  addLog("You focus on defense and wait.", 'info');
  setTurnState('ENEMY_TURN');
}}
```

**Reward** (`App.tsx`):
```ts
if (rewardCloseLockRef.current) return;
if (!combatReward) return;
rewardCloseLockRef.current = true;
setCombatReward(null);
```

**Elite** (`useActivityHandlers.ts`):
```ts
if (eliteResolveLockRef.current) return;
if (!eliteChallengeData) return;
eliteResolveLockRef.current = true;
// Fight → approach; Escape → attemptEliteEscape / completeActivity
```

---

### 2. Adjacent combat soft-lock smoke (no re-fix)

| Path | Result |
|------|--------|
| Enemy turn requires `player && enemy && hp>0 && stats` | **OK** — timer + cleanup intact |
| Victory from skill kill / enemy-turn kill | **OK** — `handleVictory` + `victoryLockRef` + turn `PLAYER` |
| Auto-pass depends on `enemy` | **OK** — null enemy clears countdown |
| Approach Esc mid-Engage | **OK** — ignored while `commitLockRef` held |
| Approach cancel | **OK** — clears enemy/pendingArtifact; treasure path restores TREASURE |
| Reward keyboard (Space/Enter/Esc) | **OK** — routes through `onClose` → locked handler |
| Primary victory route | **OK** — `currentLocationId` → `LOCATION_EXPLORE` + RewardModal |

---

### 3. New real bugs?

**None found.** No production soft-locks, double-apply races, or lock regressions relative to W6–W8.

Not in scope (prior residuals, non-blocking):

1. **Posture switch** still lacks ref lock (W6; one AP spend only).
2. **Same-tick double End Turn** can still emit two log lines before re-render; turn advances once (W6).
3. **`playerDefeated` → GAME_OVER** does not clear `turnState` / enemy; GameOver UI early-return is fine (W8 cosmetic).
4. **RewardModal only under `LOCATION_EXPLORE`** (W7) — primary location combat always sets `currentLocationId` → LOCATION_EXPLORE. Theoretical REGION_MAP + orphaned `combatReward` not hit on live path.
5. Soft-share enemy art remains A3 backlog, not combat logic.

---

## Files touched

| File | Change |
|------|--------|
| `.agents/swarm-grok/reports/A2-wave9-combat.md` | This report only |

**Not touched:** combat math, systems, CSS, skill data, git.

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
| New real combat bugs | **None** |
| Source edits | **None** |

---

## Handoff

- Combat double-submit surface is production-ready for the six named locks.
- Remaining residuals are cosmetic / theoretical only; do not block ship.
- **No commit** per swarm protocol.
