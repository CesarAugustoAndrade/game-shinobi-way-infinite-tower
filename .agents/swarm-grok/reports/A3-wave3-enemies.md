# A3 WAVE3 — ARTE residual (R1 enemy + event plates)

**Agent:** A3 WAVE3  
**Date:** 2026-07-23  
**Branch:** develop (**no commit**)  
**Scope:** New painted enemy portraits + cutouts; high-spine event plates; manifest wiring only.

---

## Goal

Fill residual R1 combat identity for pool roles still sharing plates (samurai / mist_ninja / dock_worker / missing_nin aliases) and upgrade two spine event plates off small `icons/events/*.jpg`.

Style: seinen-sublime cyber-terror mist coast · full figure on void `#050608` · rust `#a65d3f` accents · fog `#8a9199` · bone `#e8e4dc` · abyss `#1a2633`. No parchment, no bright neon city.

---

## 1. New enemy assets (4 identities × portrait + cutout)

| id | portrait | cutout | prior src (shared) |
|----|----------|--------|--------------------|
| `forest_bandit` | `public/assets/enemy_forest_bandit.png` | `enemy_cut_forest_bandit.png` | `enemy_mist_ninja.png` |
| `village_thug` | `public/assets/enemy_village_thug.png` | `enemy_cut_village_thug.png` | `enemy_dock_worker.png` |
| `corrupt_guard` | `public/assets/enemy_corrupt_guard.png` | `enemy_cut_corrupt_guard.png` | `enemy_samurai.png` |
| `bandit_captain` | `public/assets/enemy_bandit_captain.png` | `enemy_cut_bandit_captain.png` | `enemy_missing_nin.png` |

All mirrored to `assets/` root.

### Identity notes
- **forest_bandit** — lean woods outlaw, bandana, rust sash, chipped blade, void stage.
- **village_thug** — stocky fishing-village extortionist, rope belt, rust wraps, crude knife.
- **corrupt_guard** — Gato enforcer in rust-corroded armor, naginata + side katana, mon crest.
- **bandit_captain** — scarred outpost captain, salt-stained coat over scavenged plates, drawn katana.

Cutouts: solid black void bg (matches `enemy_cut_missing_nin` / dock_worker cut convention; true alpha not required). Combat rewrite `enemy_` → `enemy_cut_` in `Combat.tsx` / `CinematicViewscreen` applies automatically.

---

## 2. Manifest wiring — `enemyArtManifest.ts`

Remapped **only** these pool keys (W5 preserved):

| pool key | new `src` | quality |
|----------|-----------|---------|
| `pool_forest_bandit` | `/assets/enemy_forest_bandit.png` | painted-png |
| `pool_village_thug` | `/assets/enemy_village_thug.png` | painted-png |
| `pool_corrupt_guard` | `/assets/enemy_corrupt_guard.png` | painted-png |
| `pool_bandit_captain` | `/assets/enemy_bandit_captain.png` | painted-png |

### W5 untouched (verified)
- `pool_gato` → `enemy_gato.png`
- `pool_hired_assassin` → `enemy_hired_assassin.png`
- `pool_bridge_saboteur` → `enemy_bridge_saboteur.png`
- `pool_missing_nin` → `enemy_missing_nin.png`
- `pool_assassin` left as-is (`enemy_mist_ninja.png` in live manifest; not remapped this wave)

Jobs / bosses / other pools unchanged.

---

## 3. Event plates (2 spine beats)

| event id | file | prior | quality |
|----------|------|-------|---------|
| `protect_bridge` | `public/assets/event_protect_bridge.png` | `icons/events/protect_bridge.jpg` | painted-png |
| `final_confrontation` | `public/assets/event_final_confrontation.png` | `icons/events/final_confrontation.jpg` | painted-png |

Wired in `src/game/constants/eventArtManifest.ts`. Mirrored to `assets/`.

- **protect_bridge** — incomplete Great Bridge vanishing into coastal fog; abandoned tools; threat silhouettes on wet planks.
- **final_confrontation** — rain-slick Gato compound gates; tycoon + elite guards on steps; abyss fog / torchlight.

`gatos_compound` is a **location** (not an event id); spine cover for compound is `final_confrontation` (location already has `icons/locations/gatos_compound.jpg`).

---

## 4. Files touched

| Path | Change |
|------|--------|
| `public/assets/enemy_{forest_bandit,village_thug,corrupt_guard,bandit_captain}.png` | NEW portraits |
| `public/assets/enemy_cut_{forest_bandit,village_thug,corrupt_guard,bandit_captain}.png` | NEW cutouts |
| `public/assets/event_protect_bridge.png` | NEW plate |
| `public/assets/event_final_confrontation.png` | NEW plate |
| `assets/*` (same 10 names) | mirror |
| `src/game/constants/enemyArtManifest.ts` | 4 pool src remaps |
| `src/game/constants/eventArtManifest.ts` | 2 event src + quality |
| `.agents/swarm-grok/reports/A3-wave3-enemies.md` | this report |

No combat math, no systems, no unit tests, no git commit.

---

## 5. Typecheck

```
npx tsc --noEmit
```

**Result:** exit 0 (clean for A3 edits).

---

## 6. Residual backlog (not this wave)

Still plate-sharing / icon-only (candidates for WAVE4+):
- Humans on samurai: `stranded_ronin`, `corrupt_foreman`, `ronin`
- Exhausted alias: `desperate_traveler`
- Smuggler family still on puppeteer plate
- Animals / spirits on `icons/enemies/*.jpg` (war_dog, wild_boar, shrine_demon, …)
- Events still on jpg icons: `protect_village`, `meet_inari`, `final_showdown_setup`, `gato_defeat`, etc.

Optional secondary remaps (reuse new plates without new gen): `beach_bandit` / `river_bandit` / `camp_raider` → `forest_bandit`; `corrupt_foreman` → `corrupt_guard` — deferred to avoid scope creep.
