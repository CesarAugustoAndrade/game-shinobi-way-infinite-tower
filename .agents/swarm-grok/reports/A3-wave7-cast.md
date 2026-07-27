# A3 WAVE7 — ARTE residual R1 spirits/shares

**Agent:** A3 WAVE7  
**Date:** 2026-07-23  
**Branch:** develop (**no commit**)  
**Scope:** Dedicated enemy portraits + cutouts for residual R1 spirit/share faces still on `icons/enemies/*.jpg` or soft human share; optional side-event plates for shipwreck/manor; pool_* wiring only.

---

## Goal

Close residual R1 pool entries still on jpg icons (spirits/ghost/creature) and one soft human share (`hired_muscle` off monk). Optional: paint deferred side events `shipwreck_whisper` / `manor_haunt_debt`.

Style: seinen-sublime cyber-terror mist coast · full figure on void `#050608` · rust `#a65d3f` accents · fog `#8a9199` · bone `#e8e4dc` · abyss `#1a2633`. No parchment, no bright neon city. Distinct silhouettes. Events: illustrated anime plates matching WAVE5–6 language.

---

## 1. Selection (4 residual R1 spirits/shares)

| id | R1 traffic | prior src | notes |
|----|------------|-----------|-------|
| `water_spirit` | sunken_ship pool (Tide Wraith) | `icons/enemies/water_spirit.jpg` | elemental — **distinct from** painted `sea_spirit` |
| `sea_creature` | secret_harbor / cove pool (Deep Thing) | `icons/enemies/sea_creature.jpg` | non-human tentacle beast |
| `vengeful_ghost` | ruined_estate pool | `icons/enemies/vengeful_ghost.jpg` | yurei spirit |
| `hired_muscle` | rural_village pool | soft share → `enemy_monk.png` | dockside brute enforcer |

**Not this wave:** `camp_raider` left on `enemy_missing_nin.png` share; other soft shares (treasure/manor/elite_guardian → monk) untouched.

---

## 2. New enemy assets (4 identities × portrait + cutout)

| id | portrait | cutout | prior |
|----|----------|--------|-------|
| `water_spirit` | `public/assets/enemy_water_spirit.png` | `enemy_cut_water_spirit.png` | `water_spirit.jpg` |
| `sea_creature` | `public/assets/enemy_sea_creature.png` | `enemy_cut_sea_creature.png` | `sea_creature.jpg` |
| `vengeful_ghost` | `public/assets/enemy_vengeful_ghost.png` | `enemy_cut_vengeful_ghost.png` | `vengeful_ghost.jpg` |
| `hired_muscle` | `public/assets/enemy_hired_muscle.png` | `enemy_cut_hired_muscle.png` | monk soft share |

All mirrored to `assets/` root (byte-match verified). Portrait + cutout share solid void `#050608` full-figure (WAVE5–6 cut convention). Combat rewrite `enemy_` → `enemy_cut_` applies when cut files exist.

### Identity notes
- **water_spirit** — translucent tide-water humanoid, pearl core in chest, cyan hollow eyes, barnacles + floating rust ship nails; elemental Tide Wraith (not the human `sea_spirit` thug plate).
- **sea_creature** — teal-green serpentine head, amber eye, jagged fangs, coiled tentacles with suckers + rust barnacles, fog base (Deep Thing).
- **vengeful_ghost** — pale yurei, long floating dark hair, violet hollow eyes, tattered seafoam kimono dissolving to mist, rust bloodstains, accusatory claw.
- **hired_muscle** — bulky dock enforcer, denim vest, rust brass knuckles + club/chain, rope belt, cruel grin; pure brute (no monk robes, no headband).

**Running totals after WAVE7:** 33 dedicated enemy portraits + 33 cutouts (was 29).

---

## 3. Manifest wiring — `enemyArtManifest.ts`

| pool key | new `src` | quality |
|----------|-----------|---------|
| `pool_water_spirit` | `/assets/enemy_water_spirit.png` | painted-png |
| `pool_sea_creature` | `/assets/enemy_sea_creature.png` | painted-png |
| `pool_vengeful_ghost` | `/assets/enemy_vengeful_ghost.png` | painted-png |
| `pool_hired_muscle` | `/assets/enemy_hired_muscle.png` | painted-png |

### Preserved (verified, not remapped)
- All WAVE3–6 dedicated cast (sea_spirit, wild_boar, war_dog, trap_master, drowned_sailor, smugglers, bandits, gato, assassins, etc.)
- `pool_sea_spirit` → `enemy_sea_spirit.png` (distinct from water_spirit)
- Soft shares left: camp_raider → missing_nin; treasure/manor/elite_guardian → monk; river_bandit / hidden_guard / assassin → mist_ninja; elite_mercenary → bridge_saboteur

Jobs / bosses / other pools unchanged.

`artRegistry.ts` `T021_enemies_events` inventory string updated to 33 portraits / 11 event plates.

---

## 4. Event plates (2 residual sides — optional, done)

| event id | file | prior | quality |
|----------|------|-------|---------|
| `shipwreck_whisper` | `public/assets/event_shipwreck_whisper.png` | `icons/events/abandoned_supply_cache.jpg` reuse | painted-png |
| `manor_haunt_debt` | `public/assets/event_manor_haunt_debt.png` | `icons/events/hidden_shrine_blessing.jpg` reuse | painted-png |

Wired in `src/game/constants/eventArtManifest.ts`. Mirrored to `assets/`.

- **shipwreck_whisper** — flooded ship hold; Gato rust-wax sealed chest; translucent drowned sailors counting crates in fog.
- **manor_haunt_debt** — ruined tatami room; open debt ledger + rust seals; yurei silhouette in fog doorway; rain through broken shoji.

**Running totals after WAVE7:** 11 dedicated event plates (was 9).

---

## 5. Files touched

| Path | Change |
|------|--------|
| `public/assets/enemy_{water_spirit,sea_creature,vengeful_ghost,hired_muscle}.png` | NEW portraits |
| `public/assets/enemy_cut_{water_spirit,sea_creature,vengeful_ghost,hired_muscle}.png` | NEW cutouts |
| `public/assets/event_shipwreck_whisper.png` | NEW plate |
| `public/assets/event_manor_haunt_debt.png` | NEW plate |
| `assets/*` (same 10 names) | mirror |
| `src/game/constants/enemyArtManifest.ts` | 4 pool src remaps |
| `src/game/constants/eventArtManifest.ts` | 2 event src + quality |
| `src/game/constants/artRegistry.ts` | T021 inventory string |
| `.agents/swarm-grok/reports/A3-wave7-cast.md` | this report |

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
- Soft shares: treasure_guardian / manor_guardian / elite_guard / eldritch_guardian → monk; river_bandit / hidden_guard / assassin → mist_ninja; camp_raider → missing_nin; elite_mercenary → bridge_saboteur
- Spirits still on `icons/enemies/*.jpg`: cursed_servant, shrine_demon, corrupted_priest
- Events still on jpg / reuse: residual sides (corrupt_merchant_scales, riverside_traveler_pact, etc.)
