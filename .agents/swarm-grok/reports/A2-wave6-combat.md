# A2 WAVE6 — Combat Production Bug Hunt (minimal)

**Agent:** A2-wave6-combat (Grok swarm)  
**Date:** 2026-07-23  
**Branch:** `develop` (no commit)  
**Scope:** Real soft-lock / double-submit / CTA / Escape / cutout bugs only.  
**Constraints honored:** No combat math rewrites; no restyle; tsc clean; no commit.

---

## Mission outcomes

### 1. Soft-locks / CTA audit

| Scenario | Verification | Result |
|----------|--------------|--------|
| **Stun with no CTA** | `Combat.tsx` banner `combat-stunned-banner` + `STUNNED - PASS TURN` action; dock `combat__pass-btn--stunned`; hand block reason “Stunned — end turn”; `useSkill` rejects stun | **OK** (W4/W5 residual; no change) |
| **Empty hand turn** | `Hand.tsx` empty state: “No cards left — end your turn (Space).”; End Turn always enabled on PLAYER turn; Space → pass | **OK** (no soft-lock) |
| **Victory / defeat soft-lock** | Victory → reward path; defeat → GAME_OVER; prior `useCombatVictory` EXPLORE guards | **OK** (out of residual scope) |
| **Approach cancel → blank** | `handleApproachCancel` restores TREASURE if guardian, else map; clears half-started combat side channels | **OK** |

---

### 2. Confirmed bugs fixed

#### A. Approach modal — double Engage (double-submit)

**Bug:** `handleConfirm` had no commit lock. Double-click **Engage** could fire `onSelectApproach` twice before unmount → double approach costs, double `startCombat`, or double `completeActivity` on bypass.

**Fix (`ApproachSelector.tsx`):**
- Sync `commitLockRef` + `commitLocked` state (Event-style pattern).
- Engage / Back disabled while locked; label → “Engaging…”.
- Ref set **before** parent callback so same-tick second click cannot re-enter.

#### B. Approach modal — Escape dead while confirm open

**Bug:** Escape handler only ran when `!showConfirm`. With confirm open, Esc did nothing (no Back, no exit) — keyboard soft-trap.

**Fix:**
- Esc + confirm open → dismiss confirm (Back), unless already committing.
- Esc + no confirm → `onCancel()` (exit room), unchanged.

#### C. Combat card double-submit (stale AP / hand)

**Bug:** `useSkill` gated only on `turnState === 'PLAYER'`. Rapid double-click / key before React re-render reused stale `combatState` (same AP, card still “in hand”) → double damage / double spend.

**Fix (`useCombat.ts`):**
- `skillActionLockRef` taken after validation, before resolve.
- Reject if card id no longer in `combatState.hand`.
- Unlock on rejected paths (silence / null result / failed cast).
- Unlock when PLAYER turn + `currentAp` / `hand` commit (multi-card turns stay playable after state settles).

#### D. End Turn double-fire after already ending

**Bug:** App `onPassTurn` always logged + set `ENEMY_TURN` with no turn gate (stale PLAYER UI after first pass).

**Fix (`App.tsx`):**
```ts
if (turnState !== 'PLAYER') return;
```
before log / `setTurnState('ENEMY_TURN')`.

---

### 3. Cutout rewrite — still generic for any new `enemy_*`

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
| `/assets/icons/enemies/*` → cutout undefined → portrait mask | **Yes** |
| Disk: `assets/` + `public/assets/` portraits ↔ cutouts | **25/25 pairs present** |
| Missing cut → `CinematicViewscreen` onError portrait fallback | **Intact** |

Any future A3 `enemy_<id>.png` auto-maps to `enemy_cut_<id>.png` when present. **No code change required.**

---

## Files touched

| File | Change |
|------|--------|
| `src/components/combat/ApproachSelector.tsx` | Engage commit lock; Esc dismisses confirm then exits |
| `src/hooks/useCombat.ts` | Skill action lock + hand membership guard + unlock on commit |
| `src/App.tsx` | `onPassTurn` PLAYER-turn guard |
| `.agents/swarm-grok/reports/A2-wave6-combat.md` | This report |

**Not touched:** combat math / `CombatWorkflowSystem` / `CombatCalculationSystem`, CSS restyle, enemy AI, skill data, git.

---

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **Clean** (exit 0) |
| Stun dual CTA | Present (banner + dock) |
| Empty hand CTA | Present (copy + End Turn / Space) |
| Approach Esc on confirm | Dismisses confirm |
| Approach double Engage | Blocked by commit lock |
| Skill double-click | Blocked by action lock until state commit |
| Cutout pairs | 25/25 on disk; generic rewrite OK |

---

## Residual / handoff

1. **Same-tick double End Turn** can still emit two log lines if both fire before re-render; turn only advances once (enemy effect does not double). Acceptable residual; escalate only if playtest sees double enemy turns.
2. **Posture switch** still uses closure AP without a ref lock (lower severity; one AP spend). Out of WAVE6 minimum set.
3. **Clan token cyan** remains global for non-combat UI — combat scenes already cleaned W3–5.
4. **No commit** per swarm protocol.
