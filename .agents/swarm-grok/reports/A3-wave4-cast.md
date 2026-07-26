# A3 WAVE4 — ARTE residual R1 cast diversity

**Agent:** A3 WAVE4  
**Date:** 2026-07-23  
**Branch:** develop (**no commit**)  
**Scope:** New painted enemy portraits + cutouts for shared-pool R1 faces; two high-traffic side event plates; manifest wiring only.

---

## Goal

Break remaining shared-pool R1 human faces still aliasing dock_worker / samurai / puppeteer / exhausted_shinobi, and upgrade two story side-event plates still on `icons/events/*.jpg`.

Style: seinen-sublime cyber-terror mist coast · full figure on void `#050608` · rust `#a65d3f` accents · fog `#8a9199` · bone `#e8e4dc` · abyss `#1a2633`. No parchment, no bright neon city.

---

## 1. New enemy assets (4 identities × portrait + cutout)

| id | portrait | cutout | prior src (shared) |
|----|----------|--------|--------------------|
| `beach_bandit` | `public/assets/enemy_beach_bandit.png` | `enemy_cut_beach_bandit.png` | `enemy_dock_worker.png` |
| `stranded_ronin` | `public/assets/enemy_stranded_ronin.png` | `enemy_cut_stranded_ronin.png` | `enemy_samurai.png` |
| `smuggler` | `public/assets/enemy_smuggler.png` | `enemy_cut_smuggler.png` | `enemy_clumsy_puppeteer.png` |
| `desperate_traveler` | `public/assets/enemy_desperate_traveler.png` | `enemy_cut_desperate_traveler.png` | `enemy_exhausted_shinobi.png` |

All mirrored to `assets/` root.

### Identity notes
- **beach_bandit** — lean coastal outlaw, torn sleeveless wrap, face half-mask, rusty cutlass, sand grit, rust sash.
- **stranded_ronin** — rain-ruined masterless samurai, torn haori, chipped katana low, empty tired eyes, rust under-sash.
- **smuggler** — hooded oilskin cloak, satchel of contraband, rope + twin blades, calculating eyes (not puppeteer).
- **desperate_traveler** — gaunt road-bandit traveler, ragged cloak/pack, hollow stare, chipped blade (not exhausted shinobi).

Cutouts: solid void `#050608` bg (matches WAVE3 cut convention; true alpha not required). Combat rewrite `enemy_` → `enemy_cut_` in combat UI applies automatically when cut files exist.

---

## 2. Manifest wiring — `enemyArtManifest.ts`

Remapped **only** these pool keys:

| pool key | new `src` | quality |
|----------|-----------|---------|
| `pool_beach_bandit` | `/assets/enemy_beach_bandit.png` | painted-png |
| `pool_stranded_ronin` | `/assets/enemy_stranded_ronin.png` | painted-png |
| `pool_smuggler` | `/assets/enemy_smuggler.png` | painted-png |
| `pool_desperate_traveler` | `/assets/enemy_desperate_traveler.png` | painted-png |

### Preserved (verified, not remapped)
- `pool_gato` → `enemy_gato.png`
- `pool_hired_assassin` → `enemy_hired_assassin.png`
- `pool_bridge_saboteur` → `enemy_bridge_saboteur.png`
- `pool_missing_nin` → `enemy_missing_nin.png`
- `pool_forest_bandit` → `enemy_forest_bandit.png`
- `pool_village_thug` → `enemy_village_thug.png`
- `pool_corrupt_guard` → `enemy_corrupt_guard.png`
- `pool_bandit_captain` → `enemy_bandit_captain.png`

Jobs / bosses / other pools unchanged.  
`pool_cave_smuggler` / `pool_cove_smuggler` still share `enemy_clumsy_puppeteer.png` (OR-slot chose `smuggler` dedicated plate only).

---

## 3. Event plates (2 high-traffic sides)

| event id | file | prior | quality |
|----------|------|-------|---------|
| `meet_inari` | `public/assets/event_meet_inari.png` | `icons/events/meet_inari.jpg` | painted-png |
| `gato_defeat` | `public/assets/event_gato_defeat.png` | `icons/events/gato_defeat.jpg` | painted-png |

Wired in `src/game/constants/eventArtManifest.ts`. Mirrored to `assets/`.

- **meet_inari** — fog-swallowed fishing pier; solitary child outline at lantern; empty boats; fragile courage.
- **gato_defeat** — rain-slick compound courtyard after fall; limp mon banners, scattered coin crates, dropped weapons, cold torchlight.

Deferred (still jpg / reuse): `docks_collector_ledger`, `mist_omen_tide`, `protect_village`, `final_showdown_setup`.

---

## 4. Files touched

| Path | Change |
|------|--------|
| `public/assets/enemy_{beach_bandit,stranded_ronin,smuggler,desperate_traveler}.png` | NEW portraits |
| `public/assets/enemy_cut_{beach_bandit,stranded_ronin,smuggler,desperate_traveler}.png` | NEW cutouts |
| `public/assets/event_meet_inari.png` | NEW plate |
| `public/assets/event_gato_defeat.png` | NEW plate |
| `assets/*` (same 10 names) | mirror |
| `src/game/constants/enemyArtManifest.ts` | 4 pool src remaps |
| `src/game/constants/eventArtManifest.ts` | 2 event src + quality |
| `.agents/swarm-grok/reports/A3-wave4-cast.md` | this report |

No combat math, no systems, no unit tests, no git commit.

---

## 5. Typecheck

```
npx tsc --noEmit
```

**Result:** exit 0 (clean for A3 edits).

---

## 6. Residual backlog (not this wave)

Still plate-sharing / icon-only (candidates for WAVE5+):
- Smuggler family residual: `cave_smuggler`, `cove_smuggler`, `corrupt_merchant` still on puppeteer plate
- Humans still on samurai: `corrupt_foreman`, `ronin` (pool)
- Animals / spirits on `icons/enemies/*.jpg` (war_dog, wild_boar, shrine_demon, drowned_sailor, …)
- Events still on jpg icons: `protect_village`, `final_showdown_setup`, `docks_collector_ledger`, `mist_omen_tide`, residual sides
