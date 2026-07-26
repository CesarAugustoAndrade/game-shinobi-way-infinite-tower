# A3 WAVE8 — ARTE final R1 cast residual

**Agent:** A3 WAVE8  
**Date:** 2026-07-23  
**Branch:** develop (**no commit**)  
**Scope:** Dedicated enemy portraits + cutouts for last soft shares / jpg R1 faces; pool_* wiring only. Optional event plate skipped (high-traffic R1 events already on `event_*.png`).

---

## Goal

Close residual R1 pool entries still plate-sharing or on `icons/enemies/*.jpg`:
- soft human shares (`camp_raider` → missing_nin, `ronin` → samurai, `treasure_guardian` → monk)
- one manor-path jpg residual (`cursed_servant`)

Style: seinen-sublime cyber-terror mist coast · full figure on void `#050608` · rust `#a65d3f` accents · fog `#8a9199` · bone `#e8e4dc` · abyss `#1a2633`. No parchment, no bright neon city. Distinct silhouettes from prior shared faces.

---

## 1. Selection (4 final soft-share / jpg residual)

| id | R1 traffic | prior src | notes |
|----|------------|-----------|-------|
| `camp_raider` | riverside_camp pool | soft share → `enemy_missing_nin.png` | scavenger mid-loot; **not** missing-nin mask/headband |
| `ronin` | gatos_compound pool (`pool_ronin`) | soft share → `enemy_samurai.png` | Gato-hired rain-ruined blade; **not** polished job_samurai / **not** beach `stranded_ronin` |
| `treasure_guardian` | sunken_ship pool | soft share → `enemy_monk.png` | spectral cargo-chain warden; **not** monk robes |
| `cursed_servant` | abandoned_manor pool | `icons/enemies/cursed_servant.jpg` | manor-path jpg residual (picked over shrine_demon / corrupted_priest) |

**Not this wave:** `shrine_demon`, `corrupted_priest` (still jpg on drowned_shrine); soft shares `manor_guardian` / `elite_guard` / `eldritch_guardian` → monk; `river_bandit` / `hidden_guard` / `assassin` → mist_ninja; `elite_mercenary` → bridge_saboteur.

---

## 2. New enemy assets (4 identities × portrait + cutout)

| id | portrait | cutout | prior |
|----|----------|--------|-------|
| `camp_raider` | `public/assets/enemy_camp_raider.png` | `enemy_cut_camp_raider.png` | missing_nin soft share |
| `ronin` | `public/assets/enemy_ronin.png` | `enemy_cut_ronin.png` | samurai soft share |
| `treasure_guardian` | `public/assets/enemy_treasure_guardian.png` | `enemy_cut_treasure_guardian.png` | monk soft share |
| `cursed_servant` | `public/assets/enemy_cursed_servant.png` | `enemy_cut_cursed_servant.png` | `cursed_servant.jpg` |

All mirrored to `assets/` root (byte-match verified). Portrait + cutout share solid void `#050608` full-figure (WAVE5–7 cut convention). Combat rewrite `enemy_` → `enemy_cut_` applies when cut files exist.

### Identity notes
- **camp_raider** — ragged scavenger, blood-nicked short blade, torn looted satchel (coins/spoils), mud-ash clothes, opportunistic grin, mist base; pure camp looter (no headband, no face wrap).
- **ronin** — rain-soaked torn dark haori + hakama, hollow tired eyes, chipped katana low-ready, rust scabbard; Gato compound hire (distinct from beach shipwreck `stranded_ronin` blue-haori plate).
- **treasure_guardian** — spectral skeletal warden in rust plate, cargo chains + anchor, cyan phosphorescence, barnacles/coins; drowned-hold cargo spirit (not monk).
- **cursed_servant** — ashen butler, cracked porcelain half-mask with violet eye, spectral handprints, rust wax-seal pin, curse veins; manor haunt residual (upgraded from cartoon jpg).

**Running totals after WAVE8:** 37 dedicated enemy portraits + 37 cutouts (was 33).

---

## 3. Manifest wiring — `enemyArtManifest.ts`

| pool key | new `src` | quality |
|----------|-----------|---------|
| `pool_camp_raider` | `/assets/enemy_camp_raider.png` | painted-png |
| `pool_ronin` | `/assets/enemy_ronin.png` | painted-png |
| `pool_treasure_guardian` | `/assets/enemy_treasure_guardian.png` | painted-png |
| `pool_cursed_servant` | `/assets/enemy_cursed_servant.png` | painted-png |

### Preserved (verified, not remapped)
- All WAVE3–7 dedicated cast (missing_nin, samurai job, monk job, stranded_ronin, spirits, bandits, gato, etc.)
- Soft shares left: manor_guardian / elite_guard / eldritch_guardian → monk; river_bandit / hidden_guard / assassin → mist_ninja; elite_mercenary → bridge_saboteur
- jpg residual left: shrine_demon, corrupted_priest

Jobs / bosses / other pools unchanged.

`artRegistry.ts` `T021_enemies_events` inventory string updated to 37 portraits / 11 event plates.

---

## 4. Event plates (optional — skipped)

Checked `public/assets/event_*.png`: 11 dedicated plates already present (meet_tazuna, protect_village, meet_inari, protect_bridge, final_showdown_setup, final_confrontation, gato_defeat, docks_collector_ledger, mist_omen_tide, shipwreck_whisper, manor_haunt_debt).

No new high-traffic R1 residual event plate this wave. Remaining side events still on jpg reuse (`corrupt_merchant_scales`, `riverside_traveler_pact`, `bandit_outpost_toll`, `hidden_cove_silent_drop`, `drowned_shrine_black_tide`) left for a later A5/A3 event pass.

**Running totals after WAVE8:** 11 dedicated event plates (unchanged).

---

## 5. Files touched

| Path | Change |
|------|--------|
| `public/assets/enemy_{camp_raider,ronin,treasure_guardian,cursed_servant}.png` | NEW portraits |
| `public/assets/enemy_cut_{camp_raider,ronin,treasure_guardian,cursed_servant}.png` | NEW cutouts |
| `assets/*` (same 8 names) | mirror |
| `src/game/constants/enemyArtManifest.ts` | 4 pool src remaps (+ cursed quality → painted-png) |
| `src/game/constants/artRegistry.ts` | T021 inventory string |
| `.agents/swarm-grok/reports/A3-wave8-cast.md` | this report |

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
- Soft shares: manor_guardian / elite_guard / eldritch_guardian → monk; river_bandit / hidden_guard / assassin → mist_ninja; elite_mercenary → bridge_saboteur
- Spirits still on `icons/enemies/*.jpg`: shrine_demon, corrupted_priest
- Events still on jpg / reuse: residual sides (corrupt_merchant_scales, riverside_traveler_pact, bandit_outpost_toll, hidden_cove_silent_drop, drowned_shrine_black_tide)
