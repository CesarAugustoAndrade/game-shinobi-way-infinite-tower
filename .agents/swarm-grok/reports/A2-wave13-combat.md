# A2 WAVE13 — Combat Regression (W11/W12 locks)

**Agent:** A2-wave13-combat (Grok swarm)  
**Date:** 2026-07-23  
**Branch:** `develop` (no commit)  
**Scope:** REGRESSION only of W11 death hang + W12 Approach Exit / victory harden + six double-submit locks + A7b W12 FREE_FIRST toggle waiver. Hunt **new** regressions from W12 only.  
**Constraints honored:** No combat math rebalance; no CSS restyle; tsc clean; no commit; fix only real P0/P1.

---

## Mission outcomes

**Verdict: CLEAN — all re-verifications hold. No new P0/P1 from W12. No source edits.**

| Item | Result |
|------|--------|
| W11 death path (enemy null + turn PLAYER + GAME_OVER) | **Still fixed** |
| Approach `handleCancel` gated on `commitLockRef` | **Still fixed** |
| Six double-submit locks | **All present** |
| FREE_FIRST toggle waiver (A7b W12) | **Correct** — no double-charge |
| New W12-only regression | **None found** |
| Source edits | **None** |
| `npx tsc --noEmit` | **Clean** (exit 0) |

---

## 1. Death path re-verification (W11)

### Skill-path `playerDefeated` — `src/hooks/useCombat.ts`

```ts
} else if (result.playerDefeated) {
  // Clear combat actors so auto-pass / enemy-turn / upkeep cannot re-fire after death
  setGameState(GameState.GAME_OVER);
  setEnemy(null);
  setTurnState('PLAYER');
  skillActionLockRef.current = false;
  return;
}
```

### Enemy-turn `playerDefeated` — same file

```ts
} else if (result.playerDefeated) {
  // P1: prior path left ENEMY_TURN + live enemy → effect re-scheduled forever
  setGameState(GameState.GAME_OVER);
  setEnemy(null);
  setTurnState('PLAYER');
  return;
}
```

### Effect gate (blocks post-death reschedule)

Requires `turnState === 'ENEMY_TURN' && player.currentHp > 0 && enemy && enemy.currentHp > 0` (+ stats). Mid-timer recheck cancels if either side dead/cleared.

| Check | Result |
|-------|--------|
| Death → `GAME_OVER` | **Present** (skill + enemy-turn) |
| Death → `setEnemy(null)` | **Present** |
| Death → `setTurnState('PLAYER')` | **Present** |
| Enemy-turn reschedule after death | **Blocked** (gate + null enemy) |
| Auto-pass after death | **Blocked** (`!enemy` clears countdown) |
| Upkeep after death | **Blocked** (requires live `enemy`) |
| GameOver UI early return | **Present** (`App.tsx` `gameState === GAME_OVER`) |

**No regression on W11 fix.**

---

## 2. Approach Exit mid-Engage (W12)

### `handleCancel` — `src/components/combat/ApproachSelector.tsx`

```ts
const handleCancel = () => {
  if (commitLockRef.current) return;
  onCancel();
};
```

### UI wiring

| Control | Gate |
|---------|------|
| Header Exit Room | `onClick={handleCancel}` + `disabled={commitLocked}` |
| Header X | same |
| Footer Exit Room | same |
| Confirm Back | `handleBackFromConfirm` + `commitLockRef` + `disabled={commitLocked}` |
| Esc key | `if (commitLockRef.current) return` before back/cancel |
| Engage Confirm | sets `commitLockRef` **first**, then `onSelectApproach` |

Parent `handleApproachCancel` still clears enemy + restores treasure/map; it is **not** callable after Engage commit (prevents blank `COMBAT` shell without enemy).

Happy path still unmounts overlay via `setShowApproachSelector(false)` on skipCombat / startCombat.

**No regression on W12 Approach P1.**

---

## 3. Six double-submit locks — re-verification

| Lock | Location | Mechanism | Status |
|------|----------|-----------|--------|
| **Skill** | `useCombat.ts` `skillActionLockRef` | Sync after validation; early reject; unlock on PLAYER+AP/hand / start / reset / death-victory | **Present** |
| **Victory** | `useCombat.ts` `victoryLockRef` | Before XP/ryo/`onVictory`; `setEnemy(null)` | **Present** |
| **Approach Engage** | `ApproachSelector.tsx` `commitLockRef` + `commitLocked` | Sync ref first on Confirm; cancel/back/Esc gated | **Present** |
| **End Turn** | `App.tsx` `onPassTurn` | `if (turnState !== 'PLAYER') return`; Combat keyboard also gates turn + `e.repeat` | **Present** |
| **Reward Continue** | `App.tsx` `rewardCloseLockRef` | Ref first on `handleRewardClose`; unlock on new `combatReward` | **Present** |
| **Elite Fight/Escape** | `useActivityHandlers.ts` `eliteResolveLockRef` | Ref first on both handlers; unlock on new `eliteChallengeData` | **Present** |

---

## 4. FREE_FIRST toggle waiver (A7b W12) — re-verification

### Live path — `useCombat.useSkill` toggle branch

| Step | Behavior | OK? |
|------|----------|-----|
| Waiver gate | `skipToggleChakra = skipFirstSkillCost && !isActive && chakraCost > 0` | Yes |
| Effective cost | `0` when waived; deactivation always `0` | Yes |
| Silence | Still keys off **base** `chakraCost` (FREE_FIRST does not bypass silence) | Yes |
| Charge | `newChakra -= effectiveToggleChakra` once only | Yes — **no double-charge** |
| Flag consume | `skipFirstSkillCost → false` on any accepted toggle play | Yes |
| AP | Only via `finishCardPlay` (single AP spend) | Yes |
| No `useSkillCombat` on toggles | Early return before regular math | Yes |

### Regular cards (parity)

- `PlayerTurnSystem`: `effectiveChakraCost = skipCost ? 0 : skill.chakraCost`; deduct once; flag cleared by caller.
- `useCombat`: clears `skipFirstSkillCost` after accepted play.

### UI parity

- `Combat.canUseSkill` / `Hand` / `SkillCard`: treat activation chakra as 0 while flag set.
- Matches live charge path (no “looks free, click rejects” for toggles).

### Sim parity — `CombatSimulationService`

- Waiver: `Boolean(ctx.skipFirstSkillCost)` alone (not `&& isFirstTurn`).
- Clears flag when applied.

**FREE_FIRST toggle waiver still correct; no double-charge path found.**

---

## 5. W12-only regression hunt

W12 product delta re-read for side effects:

| W12 change | Hunt | Result |
|------------|------|--------|
| Approach cancel gated on commit | Pre-commit Exit/Esc still works? | **OK** — gate only when `commitLockRef` |
| Approach cancel gated | Stuck if Engage early-returns after lock? | **Theoretical only** — modal mount guards match parent guards (`player` / room / enemy); happy path always closes selector on skip/start. Not a live P0/P1 without a proven path. |
| `resolveExploreReturnState` victory return | Blank `LOCATION_EXPLORE` without floor? | **OK** — prefers location only when `region.currentLocationId && hasLocationFloor` |
| RewardModal on `REGION_MAP` | Double modal with LOCATION_EXPLORE? | **OK** — mutually exclusive `gameState` branches |
| Reward Continue under REGION_MAP | Same `handleRewardClose` + lock | **OK** — LOOT / returnToMap unchanged |
| Victory `setTimeout(100)` | Soft-lock during blank gap? | Cosmetic residual only (W12 list) |

| Adjacent (not W12-new) | Result |
|------------------------|--------|
| Elite escape success/fail | Unchanged; lock held |
| Auto-pass / AP0 | Enemy null clears; no naïve AP0 auto-end |
| Stun infinite | Not reopened |
| Approach HP floor | `applyApproachCosts` clamps HP to ≥1 |

**No new P0/P1 introduced by W12.**

---

## 6. Files touched

| File | Change |
|------|--------|
| `.agents/swarm-grok/reports/A2-wave13-combat.md` | This report |

**Not touched:** combat math/systems, CSS, skill data, git, product source.

---

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **Clean** (exit 0) |
| Death path W11 | **Still fixed** |
| Approach Exit W12 | **Still fixed** |
| Six locks | **All present** |
| FREE_FIRST toggle | **Correct / no double-charge** |
| New W12 regression | **None** |

---

## Residuals (non-blocking, unchanged from W11/W12)

1. Posture switch still lacks ref lock (one AP spend; state-gated).  
2. Same-tick double End Turn can emit two log lines; turn advances once.  
3. ~100ms blank between `setEnemy(null)` and explore transition after victory (cosmetic).  
4. Soft-share enemy art remains A3 backlog.  
5. Engage commit + theoretical parent early-return: selector stays locked until remount — not observed under normal open conditions; cancel correctly blocked only post-commit.

---

## Handoff

- W11 death teardown and W12 Approach Exit / victory reward harden remain intact.  
- Six production double-submit locks remain intact.  
- A7b FREE_FIRST toggle chakra waiver remains correct (single charge, flag consume, silence parity).  
- **No product code change** this wave.  
- **No commit** per swarm protocol.
