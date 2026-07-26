# A2 WAVE8 — Combat Final Residual Bug Hunt

**Agent:** A2-wave8-combat (Grok swarm)  
**Date:** 2026-07-23  
**Branch:** `develop` (no commit)  
**Scope:** NEW residual only — enemy AI hang, status clear, cutout rewrite for new A3 ids.  
**Constraints honored:** No combat math; no restyle; tsc clean; no commit.  
**Prior fixed (not re-fixed):** W6 double-submit / approach Esc / End Turn gate; W7 victory lock / reward Continue lock / elite Fight-Escape lock.

---

## Mission outcomes

**Verdict: CLEAN — no new real combat bugs found. Verification report only.**

No source files modified.

---

### 1. Enemy AI / enemy-turn hang — verified clean

| Path | Result |
|------|--------|
| `ENEMY_TURN` effect requires `player && enemy && hp>0 && stats` | **OK** — schedules `processEnemyTurn` after `TIMING.ENEMY_TURN_DELAY` (800ms) |
| Timer cleanup on dep change | **OK** — `clearTimeout` on re-run |
| Empty kit | **OK** — `selectEnemySkillDecision` → `skill: undefined`; `executeEnemyAction` early-returns; turn → `PLAYER` |
| All skills on cooldown | **OK** — AI falls back to `skills[0]` (legacy spam; not a hang); CD decrement Phase 5 still runs |
| Stun (duration 1) | **OK** — skips action, expires in Phase 4b (unit test + live path) |
| Confuse self-kill / reflect / counter kill | **OK** — `enemyDefeated` → `handleVictory` + turn `PLAYER` |
| DoT kill before action | **OK** — early return + still ticks buffs |
| Victory clears enemy before re-run | **OK** — `setEnemy(null)` + `victoryLockRef` + turn `PLAYER` |
| Enemy kits always non-empty | **OK** — archetype kits ≥3 skills; `defaultIntent` safe if empty |
| Unit tests | **20/20** pass (`EnemyTurnSystem` + `EnemyAISystem`) |

**No enemy-turn soft-lock or AI hang residual found.**

---

### 2. Status clear — verified clean

| Check | Result |
|-------|--------|
| Combat-start hygiene | **OK** — drops leftover combat buffs; keeps only `source === 'event'` or `CURSE`; resets CDs + deactivates toggles |
| Player DoT / stun / silence tick | **OK** — Phase 2 of enemy turn via `processBuffTicks` → `tickBuffDurations` |
| Enemy stun duration 1 | **OK** — present for action check; expires Phase 4b (A-004) |
| Deferred invuln / reflection | **OK** — survive Phase 2, block Phase 4 hit, expire Phase 4b |
| Permanent buffs (`duration === -1`) | **OK** — never auto-expire (event/curse only in live data) |
| Skill STUN/SILENCE/CONFUSION durations | **OK** — all finite (1–3); no permanent CC in kits |
| HEAL cleanse poison/bleed | **OK** — description-gated cleanse (player + enemy paths); intentional, not a hang |
| Cross-fight stack | **OK** — next `startCombat` strips non-persistent buffs again |

**No status-stuck / never-clear residual found.**

---

### 3. Cutout rewrite — A3 WAVE7 + disk inventory

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
| A3 WAVE7 `water_spirit` | portrait + cutout **public + assets** |
| A3 WAVE7 `sea_creature` | portrait + cutout **public + assets** |
| A3 WAVE7 `vengeful_ghost` | portrait + cutout **public + assets** |
| A3 WAVE7 `hired_muscle` | portrait + cutout **public + assets** |
| Manifest pool wiring for those 4 | `/assets/enemy_<id>.png` → auto cutout |
| Disk portrait ↔ cutout pairs | **37/37** (public + assets mirror) |
| Rewrite+disk map for every portrait | **37/37 OK** |
| Icons path (`/assets/icons/enemies/*`) | cutout undefined → portrait mask |
| Missing cut / load fail | `CinematicViewscreen` onError → portrait fallback **intact** |

Any future `enemy_<id>.png` auto-maps to `enemy_cut_<id>.png` when present. **No code change required.**

---

## Prior-wave locks still present (smoke)

| Lock | Location | Status |
|------|----------|--------|
| Skill double-submit | `useCombat.skillActionLockRef` | Present |
| Victory double-apply | `useCombat.victoryLockRef` | Present |
| Approach Engage | `ApproachSelector.commitLockRef` | Present |
| End Turn gate | `App.onPassTurn` `turnState !== 'PLAYER'` | Present |
| Reward Continue | `App.rewardCloseLockRef` | Present |
| Elite Fight/Escape | `useActivityHandlers.eliteResolveLockRef` | Present |

---

## Files touched

| File | Change |
|------|--------|
| `.agents/swarm-grok/reports/A2-wave8-combat.md` | This report only |

**Not touched:** combat math, `CombatWorkflowSystem` / `EnemyTurnSystem` / `EnemyAISystem`, CSS, skill data, git.

---

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **Clean** (exit 0) |
| Enemy turn / AI hang paths | **None found** |
| Status clear / cross-fight hygiene | **OK** |
| Cutout pairs (public + assets) | **37/37** |
| A3 WAVE7 new ids cutout-wired | **4/4** |
| Vitest EnemyTurn + EnemyAI | **20/20 pass** |

---

## Residual / handoff (non-blocking)

1. **Posture switch** still lacks ref lock (W6 residual; one AP spend). Acceptable.
2. **Same-tick double End Turn** can still emit two log lines before re-render; turn advances once (W6 residual).
3. **`playerDefeated` → GAME_OVER** does not clear `turnState` / enemy; App early-returns GameOver so UI is fine. Background enemy-turn effect could re-schedule once more before unmount of combat UI is irrelevant (hooks stay mounted). Cosmetic / log noise only — not a player soft-lock.
4. **RewardModal only under `LOCATION_EXPLORE`** (W7 residual) — primary combat path OK.
5. Soft-share pool faces (guardian→monk, etc.) remain art backlog (A3), not combat bugs.
6. **No commit** per swarm protocol.
