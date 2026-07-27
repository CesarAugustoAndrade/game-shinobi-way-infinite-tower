# A2 WAVE5 — Combat Residual (minimal)

**Agent:** A2-wave5-combat (Grok swarm)  
**Date:** 2026-07-23  
**Branch:** `develop` (no commit)  
**Scope:** Residual verification + EliteChallenge chrome align only.  
**Constraints honored:** No combat math; small CSS only; tsc clean; no commit.

---

## Mission outcomes

### 1. Neon cyan / max-height overflow (Combat.css / Combat.tsx)

| Check | Result |
|-------|--------|
| `#06b6d4` in Combat.css / Combat.tsx | **None** (only comments: “not neon cyan”) |
| `#22d3ee` in Combat.css / Combat.tsx | **None** |
| Literal cyan/teal hex in combat components | **None** (ApproachSelector/RewardModal already cleaned W3–4) |
| `.cinematic__panel-slot` max-height | **Intact** — `max-height: calc(100% - 2 * var(--sw-space-4))` + `overflow-y: auto` + thin scrollbar (WAVE4) |
| `.combat` overflow belt | `overflow-x/y: hidden` on root; stage `overflow: hidden`; deck/hand clamps unchanged |

**Out of combat scope (left alone):** design-system clan tokens (`--sw-clan-yamanaka: #06b6d4`), exploration training icon `#22d3ee`, character INT icon — not combat chrome.

**Intentionally preserved in combat tooltips (W4 policy):** element/stat scan colors (STR orange, SPD green, INT fog-indigo `#7a9eb5`, etc.).

---

### 2. Generic cutout rewrite — A3 WAVE4 new enemy ids

**Combat.tsx rewrite (unchanged; verified correct):**

```ts
const enemyCutout =
  enemy.image?.startsWith('/assets/enemy_') &&
  !enemy.image.startsWith('/assets/enemy_cut_')
    ? enemy.image.replace(/^\/assets\/enemy_/, '/assets/enemy_cut_')
    : undefined;
```

| Source path (A3 WAVE4 + prior) | Derived cutout | Disk |
|--------------------------------|----------------|------|
| `/assets/enemy_beach_bandit.png` | `enemy_cut_beach_bandit` | ✓ |
| `/assets/enemy_stranded_ronin.png` | `enemy_cut_stranded_ronin` | ✓ |
| `/assets/enemy_smuggler.png` | `enemy_cut_smuggler` | ✓ |
| `/assets/enemy_desperate_traveler.png` | `enemy_cut_desperate_traveler` | ✓ |
| All 21 `enemy_*.png` portraits (excl. cuts) | matching `enemy_cut_*` | **0 missing** |
| Already `enemy_cut_*` | skip (no double rewrite) | — |
| `/assets/icons/enemies/*` | undefined → portrait mask | — |

Rewrite uses **resolved image path**, not pool id — any future A3 `enemy_<id>.png` auto-picks `enemy_cut_<id>.png` when present; missing cut → CinematicViewscreen `onError` → portrait mask.

---

### 3. EliteChallenge residual palette → main combat chrome

**Found off-palette residuals** (only surface still carrying neon cyan in combat scenes):

| Surface | Was | Now |
|---------|-----|-----|
| Escape btn bg / border | Teal `rgba(8,145,178)` / `rgba(14,116,144)` | Metal wash `rgba(45,61,74,…)` / `--sw-metal` |
| Escape icon + title | `--sw-clan-yamanaka` (`#06b6d4` neon) | `--sw-fog` → bone on hover |
| SPD stat value | `--sw-clan-yamanaka` neon | Fog-mint `#6b9e8a` (scanable, not party cyan) |
| Conditions label | Tailwind slate `#94a3b8` | `--sw-fog` |

**Already aligned (no change):** void-glass chassis, rust top edge / left rail, bone title, abyss enemy panel, fight btn blood/risk-high language, hard void shadows — same as combat dock/panel tokens.

Post-fix grep on `src/scenes/combat/**`: **zero** `#06b6d4` / `#22d3ee` / `clan-yamanaka` / teal rgba.

---

## Files touched

| File | Change |
|------|--------|
| `src/scenes/combat/EliteChallenge.css` | Escape chrome → fog/metal; SPD fog-mint; conditions label fog |
| `.agents/swarm-grok/reports/A2-wave5-combat.md` | This report |

**Not touched:** Combat.tsx, Combat.css, CinematicViewscreen, combat math/systems, enemy AI, skill data, git.

---

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **Clean** (exit 0) |
| Neon cyan in Combat.css/tsx | **Clear** |
| Panel max-height overflow clamp | **Present** (WAVE4 residual OK) |
| Cutout rewrite + A3 WAVE4 assets | **Correct**; 21/21 portrait↔cutout pairs |
| EliteChallenge cyan residual | **Killed** (CSS only) |

---

## Residual / handoff

1. Clan design tokens still hold neon cyan globally (`--sw-clan-yamanaka`) — fine for character/clan UI; combat scenes no longer consume them.
2. Stun banner remains blood-red by design (W4 urgency).
3. Defeat → GameOver cinematic polish remains out of combat residual scope.
4. **No commit** per swarm protocol.
