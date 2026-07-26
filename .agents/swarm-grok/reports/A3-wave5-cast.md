# A3 WAVE5 — ARTE residual R1 cast closeout

**Agent:** A3 WAVE5  
**Date:** 2026-07-23  
**Branch:** develop (**no commit**)  
**Scope:** Dedicated enemy portraits + cutouts for residual shared-pool R1 faces still on puppeteer/samurai; two high-traffic side event plates; manifest wiring only.

---

## Goal

Close remaining human R1 pool shares still aliasing `enemy_clumsy_puppeteer.png` / `enemy_samurai.png`, and upgrade two story spine side-event plates still on `icons/events/*.jpg`.

Style: seinen-sublime cyber-terror mist coast · full figure on void `#050608` · rust `#a65d3f` accents · fog `#8a9199` · bone `#e8e4dc` · abyss `#1a2633`. No parchment, no bright neon city. Distinct silhouettes.

---

## 1. New enemy assets (4 identities × portrait + cutout)

| id | portrait | cutout | prior src (shared) |
|----|----------|--------|--------------------|
| `cave_smuggler` | `public/assets/enemy_cave_smuggler.png` | `enemy_cut_cave_smuggler.png` | `enemy_clumsy_puppeteer.png` |
| `corrupt_merchant` | `public/assets/enemy_corrupt_merchant.png` | `enemy_cut_corrupt_merchant.png` | `enemy_clumsy_puppeteer.png` |
| `corrupt_foreman` | `public/assets/enemy_corrupt_foreman.png` | `enemy_cut_corrupt_foreman.png` | `enemy_samurai.png` |
| `cove_smuggler` | `public/assets/enemy_cove_smuggler.png` | `enemy_cut_cove_smuggler.png` | `enemy_clumsy_puppeteer.png` |

All mirrored to `assets/` root (byte-match verified).

### Identity notes
- **cave_smuggler** — stocky cavern runner: face wrap, heavy leather apron, crate of contraband jars on shoulder, pickaxe + curved knife, rust sash, cave grit boots (not puppeteer, not dock smuggler).
- **corrupt_merchant** — greasy coastal merchant thug: torn dark haori, balance scale with rust weights, fat coin purse, concealed dagger, smug smile (not puppeteer).
- **corrupt_foreman** — bridge labor overseer: rust bandana, clipboard, crowbar + rope, tool belt nails/hammer, name-tag plaque, mud boots (not samurai / no katana).
- **cove_smuggler** — wet cove runner: salt-wet hair, oilcloth half-mask, dripping oilskin coat, liquor bottle, grappling hook + rope, barnacle boots (distinct from cave + dock smuggler).

Cutouts: solid void `#050608` bg (WAVE3/4 cut convention). Combat rewrite `enemy_` → `enemy_cut_` applies automatically when cut files exist.

**Running totals after WAVE5:** 25 dedicated enemy portraits + 25 cutouts (was 21 cutouts).

---

## 2. Manifest wiring — `enemyArtManifest.ts`

Remapped **only** these pool keys:

| pool key | new `src` | quality |
|----------|-----------|---------|
| `pool_cave_smuggler` | `/assets/enemy_cave_smuggler.png` | painted-png |
| `pool_corrupt_merchant` | `/assets/enemy_corrupt_merchant.png` | painted-png |
| `pool_corrupt_foreman` | `/assets/enemy_corrupt_foreman.png` | painted-png |
| `pool_cove_smuggler` | `/assets/enemy_cove_smuggler.png` | painted-png |

### Preserved (verified, not remapped)
- `pool_smuggler` → `enemy_smuggler.png` (WAVE4 dedicated)
- `pool_beach_bandit` → `enemy_beach_bandit.png`
- `pool_stranded_ronin` → `enemy_stranded_ronin.png`
- `pool_desperate_traveler` → `enemy_desperate_traveler.png`
- `pool_gato` → `enemy_gato.png`
- `pool_hired_assassin` → `enemy_hired_assassin.png`
- `pool_bridge_saboteur` → `enemy_bridge_saboteur.png`
- `pool_missing_nin` → `enemy_missing_nin.png`
- `pool_forest_bandit` → `enemy_forest_bandit.png`
- `pool_village_thug` → `enemy_village_thug.png`
- `pool_corrupt_guard` → `enemy_corrupt_guard.png`
- `pool_bandit_captain` → `enemy_bandit_captain.png`
- `pool_ronin` still shares `enemy_samurai.png` (not this wave)

Jobs / bosses / other pools unchanged.

`artRegistry.ts` `T021_enemies_events` inventory string updated to 25 portraits / 7 event plates.

---

## 3. Event plates (2 high-traffic spine sides)

| event id | file | prior | quality |
|----------|------|-------|---------|
| `protect_village` | `public/assets/event_protect_village.png` | `icons/events/protect_village.jpg` | painted-png |
| `final_showdown_setup` | `public/assets/event_final_showdown_setup.png` | `icons/events/final_showdown_setup.jpg` | painted-png |

Wired in `src/game/constants/eventArtManifest.ts`. Mirrored to `assets/`.

- **protect_village** — mist fishing village street; mother in doorway empty hands; two Gato collector silhouettes with ledger/clubs; nets, lanterns, rust stain on porch.
- **final_showdown_setup** — frozen bridge span; executioner blade against post; ice-mirror shards; distant Zabuza + Haku silhouettes in dense fog.

Deferred residual sides (still jpg / reuse): `docks_collector_ledger`, `mist_omen_tide`, shipwreck/manor secrets, etc.

**Running totals after WAVE5:** 7 dedicated event plates (was 5).

---

## 4. Files touched

| Path | Change |
|------|--------|
| `public/assets/enemy_{cave_smuggler,corrupt_merchant,corrupt_foreman,cove_smuggler}.png` | NEW portraits |
| `public/assets/enemy_cut_{cave_smuggler,corrupt_merchant,corrupt_foreman,cove_smuggler}.png` | NEW cutouts |
| `public/assets/event_protect_village.png` | NEW plate |
| `public/assets/event_final_showdown_setup.png` | NEW plate |
| `assets/*` (same 10 names) | mirror |
| `src/game/constants/enemyArtManifest.ts` | 4 pool src remaps |
| `src/game/constants/eventArtManifest.ts` | 2 event src + quality |
| `src/game/constants/artRegistry.ts` | T021 inventory string |
| `.agents/swarm-grok/reports/A3-wave5-cast.md` | this report |

No combat math, no systems, no unit tests, no git commit.

---

## 5. Typecheck

```
npx tsc --noEmit
```

**Result:** exit 0 (clean for A3 edits).

---

## 6. Residual backlog (not this wave)

Still plate-sharing / icon-only (candidates for later):
- Humans still on samurai: `pool_ronin`
- Soft shares: hired_muscle / manor_guardian / elite_guard → monk; river_bandit / hidden_guard / assassin → mist_ninja; camp_raider → missing_nin; elite_mercenary → bridge_saboteur
- Animals / spirits on `icons/enemies/*.jpg` (war_dog, wild_boar, shrine_demon, drowned_sailor, sea_creature, …)
- Events still on jpg / reuse: `docks_collector_ledger`, `mist_omen_tide`, shipwreck_whisper, manor_haunt_debt, residual sides
