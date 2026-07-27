# A2 WAVE2 — Combat UI Residual Report

**Agent:** A2-wave2-combat (Grok swarm)  
**Date:** 2026-07-23  
**Branch:** `develop` (no commit)  
**Scope:** Incremental combat presentation polish only — cutout fallbacks, stage intent chip, hand/cost legibility, residual arcade-gold trim.  
**Constraints honored:** No combat math rewrites; no mass `Combat.tsx` refactor; element tints left for A7b; tsc clean on touched combat UI files.

---

## 1. mist_ninja cutout fallback — verified

**Convention (unchanged, generic):**

```ts
// Combat.tsx
const enemyCutout = enemy.image?.startsWith('/assets/enemy_')
  ? enemy.image.replace('/assets/enemy_', '/assets/enemy_cut_')
  : undefined;
```

| Portrait | Derived cutout | Special-case? |
|----------|----------------|---------------|
| `/assets/enemy_mist_ninja.png` | `/assets/enemy_cut_mist_ninja.png` | **None** — same rewrite as all pool/boss ids |
| `/assets/icons/enemies/*.jpg` | (undefined — no cutout attempt) | Correct skip |

**On disk today:** `public/assets/enemy_mist_ninja.png` present; `enemy_cut_mist_ninja.png` **not yet** (A3 asset).  
**When A3 drops the cut file:** CinematicViewscreen will load it automatically; no UI remapping needed.

**Hardening this wave:**
- `cutoutError` / load-ready state **reset when `enemyCutout` path changes** (new fight / new id).
- Missing cutout: opacity 0 until load, `onError` → portrait mask (no broken-image flash).
- Comment on prop documents convention for art pipeline.

---

## 2. Mid / fg graceful degrade — no broken-image flash

Layers (`bg` / `mid` / `fg`) now:

1. Render only when path prop present.
2. Start at **`opacity: 0`**.
3. Gain `--ready` class on **`onLoad`** (fade to target opacity).
4. **`onError`** unmounts layer (gradient + mist floor remain cinematic).
5. Path change via `useEffect` resets error + ready flags.

Stage stays void/abyss gradient + mist floor + vignette if mid/fg missing or 404 — no browser broken-icon flash.

**Note:** Several `lamina_mid_*` / `lamina_fg_*` assets already exist on disk (including mist bridge); degrade path still matters for biomes without láminas.

---

## 3. Darkest Dungeon intent near cutout (optional, low clutter)

| Surface | What |
|---------|------|
| **Panel** (existing) | `combat__ip-telegraph` — `Next · {skill}` |
| **Stage** (new) | Compact `cinematic__intent` chip over cutout: ⚔ + truncated skill name |

- Prop: `intentLabel={enemy.intendedSkillName}` on `CinematicViewscreen`.
- Rust border / void plate / mono uppercase — matches panel telegraph vocabulary.
- Omitted when no intended skill; `aria-live="polite"`.
- Intentionally small (secondary to panel chip).

---

## 4. Slay the Spire hand clarity + cost vs element wash

| Change | Detail |
|--------|--------|
| Hover lift | `-2px / -4px` + void hard shadow; `z-index: 2` |
| Focus-visible | Rust outline + border (keyboard selected) |
| Hand stacking | `isolation: isolate`; hover/focus-within sibling `z-index: 3` |
| Cost badges | Void plate `0.94` opacity, double shadow, `text-shadow`, `z-index` on stack |
| AP badge | Solid void + rust tint gradient (not translucent wash that element lightning can drown) |

**Left alone (A7b):** element border + wash modifiers (`skill-card--el-*`).

---

## 5. Arcade-gold → seinen residual trim (combat CSS)

| File | Before | After |
|------|--------|--------|
| `SkillCard.css` | Active toggle `#f59e0b` amber override | `--sw-rust-light` |
| `Combat.css` tooltips | Super-eff / crit / ACC gold | Rust-light / bone-warm `#d4a574` |
| `Combat.css` open banner | Effects/condition gold | Rust-light / bone-dim |
| `GameLog.css` | Combat lines `#facc15` | Rust-light |
| `ApproachSelector.css` | Medium success + condition gold | Rust heat map |
| Comments | “pixel-arcade” / “gold fill” | Seinen / rust wording |

**Preserved on purpose:** Lightning **element** border/wash yellow (type scan, not chrome). Treasure/merchant gold outside combat scope.

---

## Files touched

| File | Change |
|------|--------|
| `src/components/layout/CinematicViewscreen.tsx` | Load/error reset; opacity-ready cascade; `intentLabel` chip; cutout docs |
| `src/components/layout/CinematicViewscreen.css` | `--ready` opacities; intent chip; cutout hide-until-ready |
| `src/scenes/combat/Combat.tsx` | Pass `intentLabel` only (+1 prop) |
| `src/components/combat/SkillCard.css` | Hover/focus, cost plate, toggle rust |
| `src/components/combat/SkillCard.tsx` | Comment only (AP rust wording) |
| `src/components/combat/Hand.css` | Hover/focus stack |
| `src/scenes/combat/Combat.css` | Gold → rust/bone in tooltips + open banner |
| `src/components/combat/GameLog.css` | Combat line rust |
| `src/components/combat/ApproachSelector.css` | Medium bar + condition rust |
| `src/components/combat/PostureIndicator.css` | Comment fix |

**Not touched:** `CombatCalculationSystem`, `CombatWorkflowSystem`, enemy AI, skill effect data.

---

## Verification

| Check | Result |
|-------|--------|
| `vitest` `CinematicViewscreenProps.test.ts` | 2/2 passed |
| tsc on A2-touched combat UI files | Clean |
| Full `npx tsc --noEmit` | Pre-existing error in `src/components/inventory/Bag.tsx` (`recipe` prop) — **unrelated** to this wave |

---

## Residual / handoff

1. **A3:** Generate `enemy_cut_mist_ninja.png` — UI already wired; no further A2 work.
2. **Bag.tsx** `recipe` type error — inventory agent / separate fix for full-repo tsc green.
3. Intent chip is name-only (no ATK/BUFF/DEBUFF glyph set) — enough for DD “threat line”; richer icons need skill-category data without math rewrites.
4. Lightning element wash remains bright by design (StS type readability).
5. Approach success **high/good** still green (risk ladder); only medium gold was retuned.
