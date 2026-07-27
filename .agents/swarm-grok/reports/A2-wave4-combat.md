# A2 WAVE4 — Combat Playtest Blockers Residual

**Agent:** A2-wave4-combat (Grok swarm)  
**Date:** 2026-07-23  
**Branch:** `develop` (no commit)  
**Scope:** Residual playtest blockers only — CSS chrome, cutout rewrite verify, stun/telegraph legibility, mid/fg flash harden.  
**Constraints honored:** No combat math; small surface; tsc clean; no commit.

---

## Mission outcomes

### 1. Cyan / gold / party chrome + 16:9 layout (CSS only)

| Location | Was | Now |
|----------|-----|-----|
| Tooltip INT abbr | `#06b6d4` neon cyan | `#7a9eb5` fog-indigo |
| Floating panel slot | No height clamp | `max-height: calc(100% - 2×pad)` + thin scroll — short 16:9 stages no longer spill seals/telegraph into the deck |
| Panel telegraph plate | Low-contrast `0.55` void wash | Darker plate `0.78`, rust-light label, bone skill + hard shadow |

**Grep residual (intentionally preserved):**
- Element / stat type colors (STR orange, SPI purple, etc.) for StS scan.
- Success-risk greens on approach / open-banner.
- Stun banner blood red (urgency signal, not party gold).
- Reward/Approach cyan kill already done in WAVE3.

Stage stays `1fr` + lámina `object-cover` (no forced aspect-ratio on `.combat__stage` — avoids deck collision).

---

### 2. Enemy cutouts — generic `enemy_` → `enemy_cut_` (no hardcodes)

**Combat.tsx rewrite (hardened anchor):**

```ts
const enemyCutout =
  enemy.image?.startsWith('/assets/enemy_') &&
  !enemy.image.startsWith('/assets/enemy_cut_')
    ? enemy.image.replace(/^\/assets\/enemy_/, '/assets/enemy_cut_')
    : undefined;
```

| Source path | Derived cutout | Disk |
|-------------|----------------|------|
| `/assets/enemy_dock_worker.png` (beach_bandit share) | `enemy_cut_dock_worker` | ✓ |
| `/assets/enemy_samurai.png` (stranded_ronin share) | `enemy_cut_samurai` | ✓ |
| `/assets/enemy_forest_bandit.png` (A3 WAVE3) | `enemy_cut_forest_bandit` | ✓ |
| `/assets/enemy_village_thug.png` | `enemy_cut_village_thug` | ✓ |
| `/assets/enemy_corrupt_guard.png` | `enemy_cut_corrupt_guard` | ✓ |
| `/assets/enemy_bandit_captain.png` | `enemy_cut_bandit_captain` | ✓ |
| Already `enemy_cut_*` | skip (no double rewrite) | — |
| `/assets/icons/enemies/*` | undefined → portrait mask | — |

Rewrite uses **resolved image path**, not pool id — shared plates and future A3 `enemy_*` ids pick up cutouts automatically. Missing cut → CinematicViewscreen `onError` → portrait mask.

---

### 3. Stun / defeat / victory / telegraph

| Surface | Residual check | Action |
|---------|----------------|--------|
| **Stun** | Banner + dual pass (banner CTA + End Turn rust pulse); cards block with “Stunned — end turn” | No soft-lock; left alone (blood urgency OK) |
| **Victory** | RewardModal cinematic (WAVE3); soft-lock guards already in `useCombatVictory` | No change |
| **Defeat** | GameOver scene (out of scope) | No change |
| **Telegraph** | Panel chip could wash under CRT | Contrast bump (CSS only); stage intent chip unchanged |

---

### 4. CinematicViewscreen mid/fg onError flash — hardened

**Root cause residual:** ready/error flags reset in `useEffect` after paint → one frame where a new path still carried the previous path’s `--ready` opacity (broken icon / wrong layer flash).

**Fix:**
1. **Path-gated ready/error** — `*ReadyPath` / `*ErrorPath` must equal current prop; no useEffect reset race.
2. **`key={layer:path}`** on each img — remount on path change.
3. **`visibility: hidden` until `--ready`** (bg / mid / fg / cutout) — broken icons never paint.
4. **`hideFailedLayer()` on onError** — synchronous opacity+visibility kill before React commit.
5. **`decoding="async"`** on stage layers.

Portrait fallback still mounts immediately when cutout fails (intended).

---

## Files touched

| File | Change |
|------|--------|
| `src/components/layout/CinematicViewscreen.tsx` | Path-gated ready/error; key remount; hideFailedLayer; drop useEffect resets |
| `src/components/layout/CinematicViewscreen.css` | visibility gate on layers; panel max-height scroll for short stages |
| `src/scenes/combat/Combat.tsx` | Cutout rewrite `^` anchor + shared-plate comment |
| `src/scenes/combat/Combat.css` | INT fog-indigo; telegraph contrast |

**Not touched:** combat math systems, enemy AI, skill data, RewardModal TS, GameOver.

---

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **Clean** (exit 0) |
| `vitest` `CinematicViewscreenProps.test.ts` | **2/2 passed** |
| Cutout rewrite matrix (shared + A3 WAVE3) | Disk present for all listed cutouts |

---

## Residual / handoff

1. **beach_bandit / stranded_ronin** still share dock_worker / samurai plates (art identity OOS-A8-05) — cutouts work via share path; dedicated art is A3 scope.
2. **Stun banner** still arcade-blood red by design (playtest urgency); not party gold.
3. **Defeat → GameOver** cinematic polish still separate (menu scene).
4. Lightning / element skill borders remain bright for type scan (A7b).
5. No commit per swarm protocol.
