# A3 WAVE6 — ARTE residual R1 non-human + side events

**Agent:** A3 WAVE6  
**Date:** 2026-07-23  
**Branch:** develop (**no commit**)  
**Scope:** Dedicated enemy portraits + cutouts for highest-traffic R1 non-human / jpg residual faces; two side-event plates deferred from WAVE5; manifest wiring only.

---

## Goal

Close residual R1 pool entries still on `icons/enemies/*.jpg` (non-human + trap engineer), and upgrade the two WAVE5-deferred side-event plates still on jpg reuse.

Style: seinen-sublime cyber-terror mist coast · full figure on void `#050608` · rust `#a65d3f` accents · fog `#8a9199` · bone `#e8e4dc` · abyss `#1a2633`. No parchment, no bright neon city. Distinct silhouettes. Events: illustrated anime plates matching WAVE5 `protect_village` language.

---

## 1. Selection (4 highest R1 traffic still jpg)

| id | R1 traffic | prior src | notes |
|----|------------|-----------|-------|
| `wild_boar` | dense_forest pool | `icons/enemies/wild_boar.jpg` | pure animal |
| `war_dog` | cavern `guard_dog` + outpost `war_dog` | `icons/enemies/war_dog.jpg` | one plate wires both pools |
| `trap_master` | underground_cavern pool | `icons/enemies/trap_master.jpg` | wire/trap engineer human but jpg residual |
| `drowned_sailor` | sunken_ship pool | `icons/enemies/drowned_sailor.jpg` | undead non-human |

**Deferred this wave:** `water_spirit` (still jpg, distinct from painted `sea_spirit`) — next residual non-human pass. Human soft-shares (`hired_muscle`/`treasure_guardian`/`camp_raider`) left on monk/missing_nin.

---

## 2. New enemy assets (4 identities × portrait + cutout)

| id | portrait | cutout | prior |
|----|----------|--------|-------|
| `wild_boar` | `public/assets/enemy_wild_boar.png` | `enemy_cut_wild_boar.png` | `wild_boar.jpg` |
| `war_dog` | `public/assets/enemy_war_dog.png` | `enemy_cut_war_dog.png` | `war_dog.jpg` |
| `trap_master` | `public/assets/enemy_trap_master.png` | `enemy_cut_trap_master.png` | `trap_master.jpg` |
| `drowned_sailor` | `public/assets/enemy_drowned_sailor.png` | `enemy_cut_drowned_sailor.png` | `drowned_sailor.jpg` |

All mirrored to `assets/` root (byte-match verified). Portrait + cutout share solid void `#050608` full-figure (WAVE5 cut convention). Combat rewrite `enemy_` → `enemy_cut_` applies when cut files exist.

### Identity notes
- **wild_boar** — mud-caked forest boar, blood-stained tusks, red eyes, steam breath, leaf grit (not cute mascot).
- **war_dog** — spiked rust plate harness, amber eyes, steam snarl, mastiff war hound (no kanji/glyphs on armor).
- **trap_master** — goggles, barbed-wire spool, knuckle-kunai cable, leather tool harness, cruel grin (not generic assassin).
- **drowned_sailor** — corpse-green undead sailor, barnacles, cyan phosphorescent drip, crab on shoulder, mini anchor, milky eyes (distinct from `sea_spirit` thug plate).

**Running totals after WAVE6:** 29 dedicated enemy portraits + 29 cutouts (was 25).

---

## 3. Manifest wiring — `enemyArtManifest.ts`

| pool key | new `src` | quality |
|----------|-----------|---------|
| `pool_wild_boar` | `/assets/enemy_wild_boar.png` | painted-png |
| `pool_trap_master` | `/assets/enemy_trap_master.png` | painted-png |
| `pool_guard_dog` | `/assets/enemy_war_dog.png` | painted-png |
| `pool_war_dog` | `/assets/enemy_war_dog.png` | painted-png |
| `pool_drowned_sailor` | `/assets/enemy_drowned_sailor.png` | painted-png |

### Preserved (verified, not remapped)
- All WAVE3–5 dedicated human cast (smuggler, beach_bandit, forest_bandit, thug, gato, assassins, etc.)
- `pool_sea_spirit` → `enemy_sea_spirit.png` (distinct from deferred water_spirit)
- Soft shares: hired_muscle / treasure_guardian / manor → monk; camp_raider → missing_nin; river_bandit / assassin → mist_ninja

Jobs / bosses / other pools unchanged.

`artRegistry.ts` `T021_enemies_events` inventory string updated to 29 portraits / 9 event plates.

---

## 4. Event plates (2 WAVE5-deferred sides)

| event id | file | prior | quality |
|----------|------|-------|---------|
| `docks_collector_ledger` | `public/assets/event_docks_collector_ledger.png` | `icons/events/intelligence_network.jpg` reuse | painted-png |
| `mist_omen_tide` | `public/assets/event_mist_omen_tide.png` | `icons/events/mist_ambush_cache.jpg` reuse | painted-png |

Wired in `src/game/constants/eventArtManifest.ts`. Mirrored to `assets/`.

- **docks_collector_ledger** — mist pier; open ledger + rust wax seal beside fish crate; collector silhouette with club/lantern in fog; nets + paper lanterns.
- **mist_omen_tide** — ring of dead gulls on black sand; rust-red foam tide line; collapsed pier posts in dense fog.

**Running totals after WAVE6:** 9 dedicated event plates (was 7).

---

## 5. Files touched

| Path | Change |
|------|--------|
| `public/assets/enemy_{wild_boar,war_dog,trap_master,drowned_sailor}.png` | NEW portraits |
| `public/assets/enemy_cut_{wild_boar,war_dog,trap_master,drowned_sailor}.png` | NEW cutouts |
| `public/assets/event_docks_collector_ledger.png` | NEW plate |
| `public/assets/event_mist_omen_tide.png` | NEW plate |
| `assets/*` (same 10 names) | mirror |
| `src/game/constants/enemyArtManifest.ts` | 5 pool src remaps (4 ids; guard+war share) |
| `src/game/constants/eventArtManifest.ts` | 2 event src + quality |
| `src/game/constants/artRegistry.ts` | T021 inventory string |
| `.agents/swarm-grok/reports/A3-wave6-cast.md` | this report |

No combat math, no systems, no unit tests, no git commit.

---

## 6. Typecheck

```
npx tsc --noEmit
```

**Result:** exit 0 (clean for A3 edits).

---

## 7. Residual backlog (not this wave)

Still plate-sharing / icon-only (candidates for later):
- Humans still on samurai: `pool_ronin`
- Soft shares: hired_muscle / manor_guardian / elite_guard / treasure_guardian / eldritch_guardian → monk; river_bandit / hidden_guard / assassin → mist_ninja; camp_raider → missing_nin; elite_mercenary → bridge_saboteur
- Animals / spirits still on `icons/enemies/*.jpg`: water_spirit, sea_creature, vengeful_ghost, cursed_servant, shrine_demon, corrupted_priest
- Events still on jpg / reuse: shipwreck_whisper, manor_haunt_debt, residual sides
