# A2 WAVE3 — Combat UI Production Polish Residual

**Agent:** A2-wave3-combat (Grok swarm)  
**Date:** 2026-07-23  
**Branch:** `develop` (no commit)  
**Scope:** Production polish only — DD/StS legibility, victory→reward cinema, approach trade-offs, seals bar, cutout path harden, residual neon chrome kill.  
**Constraints honored:** No combat math; minimal `Combat.tsx` surface; tsc clean; no commit.

---

## Mission outcomes

### 1. Victory → reward transition (cinematic CSS/timing)

`RewardModal.css` reworked as a seinen spoils sheet over the live stage:

| Layer | Behavior |
|-------|----------|
| Overlay | Darker void scrim (`0.72`), `reward-overlay-in` ~0.42s |
| Panel | Abyss→void gradient, rust top edge, hard void shadow; `reward-panel-in` scale+rise ~0.55s |
| Body rows | Staggered `reward-row-in` (0.1–0.42s delays) |
| Footer / CTA | Delayed entrance; rust plate CTA (no amber/gold pulse chrome) |

**Palette kill:** intel teal neon → fog/bone/mist plate; XP cyan → fog/bone; ryo party gold → rust heat; continue button rust/bone.

**Reduced-motion:** all reward animations disabled under `prefers-reduced-motion: reduce`.

No TS logic changes in `RewardModal.tsx` (keyboard Continue unchanged). Defeat path remains GameOver (out of scope); combat win → RewardModal only.

---

### 2. ApproachSelector — risk/trade-off before commit

| Surface | Change |
|---------|--------|
| Card face | Risk tier tag (`Low risk` → `Desperate`) from success % |
| Card face | **On failure** chips (up to 2) with rust edge — visible *before* confirm |
| Card face | Gain chips reclassed `--gain` vs `--risk` for scan contrast |
| Confirm | Lead line: “Weigh the gain against the stake…”; risk label next to success % |
| Cyan bleed | Guard/bypass accents → slate/fog; chakra cost → indigo `#a5b4fc`; loc notes → fog |

Frontal Assault still shows “Always available” (no false risk tag). Iron Guard uses “Tank path” (not cyan “new”).

---

### 3. Status seals bar — shinobi readable

| Before | After |
|--------|-------|
| Label `STATUSEFFECTS` (debug run-on) | `Seals` |
| Empty `+` inventory slots | Dashed metal plates + quiet diamond mark |
| Duration bare integer | `Nt` / `∞` with expiring rust ring |
| INFO label | `Read` |
| Tooltip type | `Foe blessing` / `Ailment on foe` |

Slot plates: hard void shadow, rust-warm foe-buff frame vs blood ailment frame — not SaaS chip chrome.

---

### 4. Reduced-motion (touched combat animations)

| File | Respects reduced-motion |
|------|-------------------------|
| `RewardModal.css` | overlay / panel / rows / CTA pulse |
| `ApproachSelector.css` | modal fade, card hover lift, success bar width transition |
| `Combat.css` | open banner, stunned banner + pulse, AP pip transitions |
| Prior (unchanged) | CinematicViewscreen parallax/hit-flash; FloatingText |

---

### 5. Enemy cutout path — generic for NEW A3 enemy_* files

**Convention (Combat.tsx):**

```ts
const enemyCutout =
  enemy.image?.startsWith('/assets/enemy_') &&
  !enemy.image.startsWith('/assets/enemy_cut_')
    ? enemy.image.replace('/assets/enemy_', '/assets/enemy_cut_')
    : undefined;
```

| Case | Result |
|------|--------|
| `/assets/enemy_forest_bandit.png` | → `/assets/enemy_cut_forest_bandit.png` |
| `/assets/enemy_village_thug.png` | → cut path (A3 wave3 assets on disk) |
| `/assets/enemy_corrupt_guard.png` | → cut path |
| `/assets/enemy_bandit_captain.png` | → cut path |
| Already `enemy_cut_*` | **skip** (no double rewrite) |
| `/assets/icons/enemies/*` | undefined → portrait mask only |

No per-id hardcodes. A3 wave3 report confirms cutouts exist for the four new pool ids; UI picks them up automatically via rewrite + `onError` portrait fallback.

---

### 6. Residual non-seinen chrome killed (combat scope)

| Location | Was | Now |
|----------|-----|-----|
| Open banner terrain line | `#7dd3fc` cyan | `--sw-fog` |
| Duration expiring tooltip | accent gold | rust-light |
| Approach guard/bypass | neon cyan accents | slate / fog metal |
| Approach chakra cost | sky cyan | chakra indigo |
| Reward intel / XP / ryo / CTA | teal + party gold | fog/bone/rust |

**Preserved:** Success risk ladder greens; lightning element card wash (type scan); treasure/merchant gold outside combat.

---

## Files touched

| File | Change |
|------|--------|
| `src/components/modals/RewardModal.css` | Cinematic entrance, seinen palette, reduced-motion |
| `src/components/combat/ApproachSelector.tsx` | Risk labels, failure chips on card, confirm trade-off lead |
| `src/components/combat/ApproachSelector.css` | Trade-off chips, cyan kill, risk tags, reduced-motion |
| `src/scenes/combat/Combat.tsx` | Seals label/duration, cutout double-rewrite guard |
| `src/scenes/combat/Combat.css` | Seal plates, terrain fog color, reduced-motion banners |
| `src/components/layout/CinematicViewscreen.tsx` | Cutout convention comment only |

**Not touched:** combat math systems, enemy AI, skill effect data, GameOver defeat screen.

---

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **Clean** (exit 0) |
| `vitest` `CinematicViewscreenProps.test.ts` | 2/2 passed |
| Cutout assets on disk for A3 new ids | Present (`enemy_cut_forest_bandit`, `_village_thug`, `_corrupt_guard`, `_bandit_captain`) |

---

## Residual / handoff

1. **Defeat → GameOver** cinematic polish still separate (menu scene, not RewardModal).
2. **Positive seal color** intentionally rust-warm (foe buff = threat heat) rather than party green — if design wants green foe-buffs for polarity scan, one CSS tweak.
3. Approach card height +2 chips may feel dense on 640px — grid already 1-col on mobile.
4. Lightning element skill borders remain bright by design (A7b / StS type readability).
5. No commit per swarm protocol.
