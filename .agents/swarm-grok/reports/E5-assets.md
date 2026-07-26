# E5-assets — Land of Waves Asset Gap Matrix

**Agent:** E5-assets  
**Date:** 2026-07-22  
**Scope:** `landOfWaves.ts` enemyPool + atmosphere/tiedStory events vs manifests + `public/assets`  
**Art direction:** Seinen-sublime / sober terror / Land of Waves mist (abyssal blue, fog grey, bone white, rust accents)

---

## Executive summary

| Domain | Count | Dedicated art | Shared placeholder | Missing file/manifest | Coverage (dedicated) |
|--------|------:|--------------:|-------------------:|----------------------:|---------------------:|
| Enemy pool IDs | 40 | 13 | 27 | 0 | **32.5%** |
| Manifest entries (any src) | 40 | — | — | 0 | **100%** (wired, not unique) |
| Waves arc GameEvents | 10 | 3 | 7 (cat fallback) | 0 | **30%** |
| tiedStoryEvents | 7 | 0 | 7 (cat fallback) | 0 | **0%** |
| atmosphereEvents (flavor) | 39 | 0 | N/A (text only) | N/A | **N/A** (T-046 strings) |
| Location map icons | 13 | 13 | 0 | 0 | **100%** |
| Large `location_*.png` biomes | ~14 files | biome-level | shared across locs | — | **~70%** themed |

**Headline:** Every pool id resolves to *some* image (no combat broken art), but **~2/3 of Region 1 enemies reuse `enemy_exhausted_shinobi.png`**, so the visual identity of Wave Country combat is collapsed. Story beats tied to locations have **no dedicated event art**.

---

## 1. Enemy pool inventory (`landOfWaves.ts`)

### 1.1 Unique IDs (40)

| # | pool id | location(s) | manifest key | manifest src | quality | on disk | status |
|--:|---------|-------------|--------------|--------------|---------|---------|--------|
| 1 | `dock_worker` | the_docks | `enemy:pool_dock_worker` | `/assets/enemy_exhausted_shinobi.png` | painted-png | yes | **PLACEHOLDER** |
| 2 | `corrupt_guard` | the_docks | `enemy:pool_corrupt_guard` | same shinobi | painted-png | yes | **PLACEHOLDER** |
| 3 | `smuggler` | the_docks | `enemy:pool_smuggler` | same shinobi | painted-png | yes | **PLACEHOLDER** |
| 4 | `beach_bandit` | misty_beach | `enemy:pool_beach_bandit` | same shinobi | painted-png | yes | **PLACEHOLDER** |
| 5 | `sea_spirit` | misty_beach | `enemy:pool_sea_spirit` | `/assets/icons/enemies/sea_spirit.jpg` | imagine-jpg | yes | **OK dedicated** |
| 6 | `stranded_ronin` | misty_beach | `enemy:pool_stranded_ronin` | `/assets/enemy_samurai.png` | painted-png | yes | SHARED job (ok-ish) |
| 7 | `forest_bandit` | coastal_forest | `enemy:pool_forest_bandit` | shinobi | painted-png | yes | **PLACEHOLDER** |
| 8 | `wild_boar` | coastal_forest | `enemy:pool_wild_boar` | `icons/enemies/wild_boar.jpg` | imagine-jpg | yes | **OK dedicated** |
| 9 | `missing_nin` | coastal_forest | `enemy:pool_missing_nin` | `icons/enemies/missing_nin.jpg` | imagine-jpg | yes | **OK dedicated** |
| 10 | `cave_smuggler` | smugglers_cave | `enemy:pool_cave_smuggler` | shinobi | painted-png | yes | **PLACEHOLDER** |
| 11 | `trap_master` | smugglers_cave | `enemy:pool_trap_master` | `icons/enemies/trap_master.jpg` | imagine-jpg | yes | **OK dedicated** |
| 12 | `guard_dog` | smugglers_cave | `enemy:pool_guard_dog` | shinobi | painted-png | yes | **PLACEHOLDER** (could alias war_dog) |
| 13 | `village_thug` | fishing_village | `enemy:pool_village_thug` | shinobi | painted-png | yes | **PLACEHOLDER** |
| 14 | `corrupt_merchant` | fishing_village | `enemy:pool_corrupt_merchant` | shinobi | painted-png | yes | **PLACEHOLDER** |
| 15 | `hired_muscle` | fishing_village | `enemy:pool_hired_muscle` | shinobi | painted-png | yes | **PLACEHOLDER** |
| 16 | `river_bandit` | riverside_camp | `enemy:pool_river_bandit` | shinobi | painted-png | yes | **PLACEHOLDER** |
| 17 | `camp_raider` | riverside_camp | `enemy:pool_camp_raider` | shinobi | painted-png | yes | **PLACEHOLDER** |
| 18 | `desperate_traveler` | riverside_camp | `enemy:pool_desperate_traveler` | shinobi | painted-png | yes | **PLACEHOLDER** |
| 19 | `drowned_sailor` | sunken_ship | `enemy:pool_drowned_sailor` | `icons/enemies/drowned_sailor.jpg` | imagine-jpg | yes | **OK dedicated** |
| 20 | `water_spirit` | sunken_ship | `enemy:pool_water_spirit` | `icons/enemies/water_spirit.jpg` | imagine-jpg | yes | **OK dedicated** |
| 21 | `treasure_guardian` | sunken_ship | `enemy:pool_treasure_guardian` | shinobi | painted-png | yes | **PLACEHOLDER** |
| 22 | `bridge_saboteur` | bridge_construction | `enemy:pool_bridge_saboteur` | shinobi | painted-png | yes | **PLACEHOLDER** |
| 23 | `hired_assassin` | bridge_construction | `enemy:pool_hired_assassin` | shinobi | painted-png | yes | **PLACEHOLDER** |
| 24 | `corrupt_foreman` | bridge_construction | `enemy:pool_corrupt_foreman` | shinobi | painted-png | yes | **PLACEHOLDER** |
| 25 | `bandit_captain` | bandit_outpost | `enemy:pool_bandit_captain` | shinobi | painted-png | yes | **PLACEHOLDER** |
| 26 | `elite_mercenary` | bandit_outpost | `enemy:pool_elite_mercenary` | shinobi | painted-png | yes | **PLACEHOLDER** |
| 27 | `war_dog` | bandit_outpost | `enemy:pool_war_dog` | `icons/enemies/war_dog.jpg` | imagine-jpg | yes | **OK dedicated** |
| 28 | `vengeful_ghost` | abandoned_manor | `enemy:pool_vengeful_ghost` | `icons/enemies/vengeful_ghost.jpg` | imagine-jpg | yes | **OK dedicated** |
| 29 | `manor_guardian` | abandoned_manor | `enemy:pool_manor_guardian` | shinobi | painted-png | yes | **PLACEHOLDER** |
| 30 | `cursed_servant` | abandoned_manor | `enemy:pool_cursed_servant` | `icons/enemies/cursed_servant.jpg` | imagine-jpg | yes | **OK dedicated** |
| 31 | `cove_smuggler` | hidden_cove | `enemy:pool_cove_smuggler` | shinobi | painted-png | yes | **PLACEHOLDER** |
| 32 | `sea_creature` | hidden_cove | `enemy:pool_sea_creature` | `icons/enemies/sea_creature.jpg` | imagine-jpg | yes | **OK dedicated** |
| 33 | `hidden_guard` | hidden_cove | `enemy:pool_hidden_guard` | shinobi | painted-png | yes | **PLACEHOLDER** |
| 34 | `shrine_demon` | drowned_shrine | `enemy:pool_shrine_demon` | `icons/enemies/shrine_demon.jpg` | imagine-jpg | yes | **OK dedicated** |
| 35 | `corrupted_priest` | drowned_shrine | `enemy:pool_corrupted_priest` | `icons/enemies/corrupted_priest.jpg` | imagine-jpg | yes | **OK dedicated** |
| 36 | `eldritch_guardian` | drowned_shrine | `enemy:pool_eldritch_guardian` | shinobi | painted-png | yes | **PLACEHOLDER** (high priority) |
| 37 | `elite_guard` | gatos_compound | `enemy:pool_elite_guard` | `/assets/enemy_samurai.png` | painted-png | yes | SHARED job |
| 38 | `ronin` | gatos_compound | `enemy:pool_ronin` | `/assets/enemy_samurai.png` | painted-png | yes | SHARED job |
| 39 | `assassin` | gatos_compound | `enemy:pool_assassin` | shinobi | painted-png | yes | **PLACEHOLDER** |
| 40 | `gato` | gatos_compound | `enemy:pool_gato` | `icons/enemies/gato.jpg` | imagine-jpg | yes | **OK dedicated** |

### 1.2 Coverage math

```
Dedicated unique pool portraits:  13 / 40 = 32.5%
Non-shinobi-placeholder:          16 / 40 = 40.0%  (13 jpg + 3 samurai)
Manifest + existing file:         40 / 40 = 100%
```

### 1.3 `public/assets/enemy_*.png` inventory

| File | Used by |
|------|---------|
| `enemy_exhausted_shinobi.png` | **24 pool ids** + job_ninja/shinobi |
| `enemy_samurai.png` | stranded_ronin, elite_guard, ronin + job_samurai |
| `enemy_monk.png` | job only (not in R1 pool) |
| `enemy_clumsy_puppeteer.png` | job only |
| `enemy_boss_haku.png` | boss cascade (not in region enemyPool) |
| `enemy_boss_demon_brothers.png` | boss cascade (not in region enemyPool) |
| `enemy_cut_*` (6) | cutout variants of above |

### 1.4 `public/assets/icons/enemies/*` (pool-relevant)

Present dedicated:  
`sea_spirit`, `wild_boar`, `missing_nin`, `trap_master`, `drowned_sailor`, `water_spirit`, `war_dog`, `vengeful_ghost`, `cursed_servant`, `sea_creature`, `shrine_demon`, `corrupted_priest`, `gato`  
+ archetypes: `archetype_{tank,assassin,balanced,caster,genjutsu}`

**Missing dedicated icons for 27 pool ids** (listed in generation queue §4).

---

## 2. Events: atmosphere + tied story vs wavesArc + eventArtManifest

### 2.1 `wavesArcEvents.ts` GameEvent IDs (10)

| id | In eventArtManifest? | File | Notes |
|----|----------------------|------|-------|
| `bridge_worker_plea` | yes | `icons/events/bridge_worker_plea.jpg` | OK |
| `mist_ambush_cache` | yes | `icons/events/mist_ambush_cache.jpg` | OK |
| `tazuna_request` | yes | `icons/events/tazuna_request.jpg` | OK |
| `meet_tazuna` | **no** | falls to `cat_story` | tiedStory: docks |
| `protect_village` | **no** | cat fallback | tiedStory: fishing_village |
| `meet_inari` | **no** | cat fallback | tiedStory: fishing_village |
| `protect_bridge` | **no** | cat fallback | tiedStory: bridge |
| `final_showdown_setup` | **no** | cat fallback | tiedStory: bridge |
| `final_confrontation` | **no** | cat fallback | tiedStory: compound |
| `gato_defeat` | **no** | cat fallback | tiedStory: compound |

**Dedicated waves event art: 3/10 = 30%**  
**tiedStoryEvents with dedicated art: 0/7 = 0%**

### 2.2 tiedStoryEvents (from locations)

| id | location | GameEvent exists? | event art |
|----|----------|-------------------|-----------|
| `meet_tazuna` | the_docks | yes (wavesArc) | missing |
| `protect_village` | fishing_village | yes | missing |
| `meet_inari` | fishing_village | yes | missing |
| `protect_bridge` | bridge_construction | yes | missing |
| `final_showdown_setup` | bridge_construction | yes | missing |
| `final_confrontation` | gatos_compound | yes | missing |
| `gato_defeat` | gatos_compound | yes | missing |

### 2.3 atmosphereEvents (39 unique — T-046 flavor strings, not GameEvents)

These are humanized as ambient copy via `pickAtmosphereFlavor`; they do **not** use `eventArtManifest`. Optional ambient plates only if product wants illustrated flavor.

| location | atmosphereEvents |
|----------|------------------|
| the_docks | suspicious_cargo, overheard_conversation, dock_brawl |
| misty_beach | washed_up_treasure, stranded_sailor, ghost_ship_sighting |
| coastal_forest | animal_attack, hidden_cache, bandit_camp |
| smugglers_cave | hidden_stash, cave_in, smuggler_deal |
| fishing_village | villager_plea, hidden_resistance, tax_collection |
| riverside_camp | campfire_tales, river_crossing, supply_trade |
| sunken_ship | trapped_air_pocket, spectral_captain, treasure_cache |
| bridge_construction | bridge_sabotage, worker_strike, gato_threat |
| bandit_outpost | prisoner_rescue, supply_raid, commander_duel |
| abandoned_manor | ghostly_wailing, hidden_passage, noble_treasure |
| hidden_cove | smuggler_meeting, rare_cargo, sea_monster |
| drowned_shrine | dark_ritual, forbidden_knowledge, ancient_curse |
| gatos_compound | gato_speech, servant_whispers, display_of_power |

---

## 3. Locations (context — mostly complete)

| location id | icons/locations/*.jpg | large location_*.png (biome) |
|-------------|----------------------|------------------------------|
| the_docks | yes | coastal_harbor (shared) |
| misty_beach | yes | foggy_shoreline |
| coastal_forest | yes | dense_forest |
| smugglers_cave | yes | underground_cavern |
| fishing_village | yes | rural_village |
| riverside_camp | yes | river_banks |
| sunken_ship | yes | shipwreck |
| bridge_construction | yes | great_bridge / mist_covered_bridge |
| bandit_outpost | yes | fortified_camp |
| abandoned_manor | yes | ruined_estate |
| hidden_cove | yes | secret_harbor |
| drowned_shrine | yes | underwater_temple |
| gatos_compound | yes | fortified_mansion |

Location icons: **100%**. Large scenic plates exist at biome grain; optional 16:9 per-location upgrades deferred to A1-bg / A2-loc.

---

## 4. Asset generation queue (missing / weak identity)

**Style base (all prompts):**  
Seinen sublime atmospheric, sober terror, Land of Waves mist, muted abyssal blue `#1a2633`, fog grey, bone white highlights, restrained palette, no comic speedlines, no bright neon, cinematic lighting, film grain subtle, professional game UI art.

### 4.1 Priority A — Boss / late-game identity (portrait 3:4 or 4:5 → store as jpg square-safe)

| Filename | Prompt brief |
|----------|--------------|
| `public/assets/icons/enemies/eldritch_guardian.jpg` | Portrait: drowned shrine guardian — half-statue, half-flesh, waterlogged lacquer, coral growth, empty eyes, abyssal pressure, mist tendrils; sober cosmic dread |
| `public/assets/icons/enemies/assassin.jpg` | Portrait: mist assassin in soaked dark cloak, half-face mask, senbon glint, fog silhouette, no heroic pose — predatory stillness |
| `public/assets/icons/enemies/elite_guard.jpg` | Portrait: Gato compound elite — polished black armor plates, mon crest of greed, rain-slick, cold discipline (not generic samurai) |
| `public/assets/icons/enemies/ronin.jpg` | Portrait: rain-ruined ronin, chipped blade, empty eyes, poverty and murder-for-hire; Wave coast background blur |
| `public/assets/icons/enemies/bandit_captain.jpg` | Portrait: scarred captain of Gato's thugs, heavy coat, cruel calm, fortified camp torches behind fog |
| `public/assets/icons/enemies/elite_mercenary.jpg` | Portrait: professional foreign mercenary, better gear than bandits, impassive, mud and mist |
| `public/assets/icons/enemies/treasure_guardian.jpg` | Portrait: spectral or armored figure fused with shipwreck cargo chains, wet metal, phosphorescent cold light |
| `public/assets/icons/enemies/manor_guardian.jpg` | Portrait: ruined-estate guardian — faded ceremonial armor, dust and moonlight, wrong stillness |

### 4.2 Priority B — Human thugs / coastal grit (portrait)

| Filename | Prompt brief |
|----------|--------------|
| `public/assets/icons/enemies/dock_worker.jpg` | Brawler dockhand turned enforcer, gaff hook, salt-stained clothes, grey rain, intimidation not fantasy |
| `public/assets/icons/enemies/corrupt_guard.jpg` | Harbor guard with Gato badge, bribed eyes, rusted polearm, misty pier |
| `public/assets/icons/enemies/smuggler.jpg` | Night smuggler, oilskin coat, sealed crates, lantern glow swallowed by fog |
| `public/assets/icons/enemies/beach_bandit.jpg` | Shore bandit half-buried in fog, wet sand, scavenged gear |
| `public/assets/icons/enemies/forest_bandit.jpg` | Coastal forest ambusher, bark camouflage, damp leaves, restraint and dread |
| `public/assets/icons/enemies/cave_smuggler.jpg` | Underground cave runner, damp stone, rope and seal tags, low lantern |
| `public/assets/icons/enemies/cove_smuggler.jpg` | Hidden cove operative, rare goods satchel, tide pool reflections |
| `public/assets/icons/enemies/village_thug.jpg` | Village tax thug, crude club, fishing village poverty backdrop |
| `public/assets/icons/enemies/corrupt_merchant.jpg` | Soft-faced merchant with hard eyes, abacus and ledger of fear, cold rain |
| `public/assets/icons/enemies/hired_muscle.jpg` | Bare-armed enforcer, bruises, cheap iron, no honor |
| `public/assets/icons/enemies/river_bandit.jpg` | River raider, skiff silhouette, reeds and mist |
| `public/assets/icons/enemies/camp_raider.jpg` | Camp raider mid-loot, torn packs, dying campfire embers |
| `public/assets/icons/enemies/desperate_traveler.jpg` | Hollow-eyed traveler who attacks out of starvation — tragic threat, not comedy |
| `public/assets/icons/enemies/bridge_saboteur.jpg` | Saboteur on scaffold, rope and explosive tags, incomplete bridge spans in fog |
| `public/assets/icons/enemies/hired_assassin.jpg` | Contract killer on bridge beams, lean silhouette, rain |
| `public/assets/icons/enemies/corrupt_foreman.jpg` | Bridge foreman in Gato's pocket, clipboard and crowbar, workers blurred behind |
| `public/assets/icons/enemies/hidden_guard.jpg` | Camouflaged sentry at secret cove, barely visible in mist |
| `public/assets/icons/enemies/guard_dog.jpg` | Lean war hound of smugglers, wet fur, chain collar, cave mouth — sober, not cartoon |
| `public/assets/icons/enemies/stranded_ronin.jpg` | Optional upgrade from shared samurai: shipwrecked blade-for-hire on beach |

### 4.3 Priority A — Story event art (16:9 cinematic plates)

| Filename | Prompt brief |
|----------|--------------|
| `public/assets/icons/events/meet_tazuna.jpg` | 16:9: weary bridge builder Tazuna on rainy docks, pleading silhouette, Gato enforcers distant in fog — hope under tyranny |
| `public/assets/icons/events/protect_village.jpg` | 16:9: fishing village under tax intimidation, empty nets, children half-hidden, thugs at the gate |
| `public/assets/icons/events/meet_inari.jpg` | 16:9: quiet dockside encounter with Inari, empty boats, mist, fragile courage |
| `public/assets/icons/events/protect_bridge.jpg` | 16:9: incomplete great bridge in mist, workers frozen mid-task, threat approaching along planks |
| `public/assets/icons/events/final_showdown_setup.jpg` | 16:9: path to Gato compound gates, banners of greed, rain, low horizon dread |
| `public/assets/icons/events/final_confrontation.jpg` | 16:9: compound courtyard confrontation, magnate's mansion, enforcers ring, cold power |
| `public/assets/icons/events/gato_defeat.jpg` | 16:9: aftermath — fallen tyranny, empty throne of wealth, villagers distant silhouettes, restrained catharsis |

### 4.4 Optional — Atmosphere plates (16:9, only if elevating flavor UI)

Generate only after story events; map id → `icons/events/atm_{id}.jpg` if product adds illustrated ambient. Skip for MVP.

### 4.5 Wire-up after generate

1. Drop files under `public/assets/icons/enemies/` or `events/`.  
2. Update `enemyArtManifest.ts` / `eventArtManifest.ts` `src` + `quality: 'imagine-jpg'`.  
3. For events: add `EVENT_CATEGORY_BY_ID` only if new categories.  
4. No code path change needed for enemies if keys already `pool_*` / `event:{id}`.

---

## 5. Gap severity ranking (for workers)

| Rank | Gap | Impact |
|-----:|-----|--------|
| 1 | 24 enemies share exhausted shinobi | Combat feels samey every room |
| 2 | 7/7 tiedStory events lack dedicated art | Narrative climax looks generic |
| 3 | eldritch_guardian / treasure_guardian / manor_guardian on shinobi | Secret/horror locations lose terror |
| 4 | Gato compound humans (assassin, elite_guard, ronin) weak identity | Boss approach underwhelming |
| 5 | guard_dog on shinobi | Absurd silhouette mismatch |
| 6 | atmosphere art absent | Low — text-only by design |

---

## 6. Source file references

- `src/game/constants/regions/landOfWaves.ts`
- `src/game/constants/enemyArtManifest.ts`
- `src/game/constants/eventArtManifest.ts`
- `src/game/constants/events/wavesArcEvents.ts`
- `src/game/constants/artRegistry.ts` (`getEnemyArt`, `getEventArt`)
- `public/assets/enemy_*.png`
- `public/assets/icons/enemies/*`
- `public/assets/icons/events/*`
- `public/assets/icons/locations/*`

---

## 7. Backlog tasks filed

See `region1-polish-backlog.md` → **R1-400 … R1-407** (Asset).

---

## 8. Return metrics (swarm)

| Metric | Value |
|--------|------:|
| Enemy dedicated portrait coverage | **32.5%** (13/40) |
| Enemy any-src coverage | **100%** (40/40) |
| Waves GameEvent dedicated art | **30%** (3/10) |
| tiedStory dedicated art | **0%** (0/7) |
| Location icon coverage | **100%** (13/13) |

**Top missing assets (generate first):**  
1. `eldritch_guardian.jpg`  
2. Story set: `meet_tazuna`, `protect_village`, `meet_inari`, `protect_bridge`, `final_showdown_setup`, `final_confrontation`, `gato_defeat` (16:9)  
3. `assassin.jpg`, `bandit_captain.jpg`, `treasure_guardian.jpg`  
4. `guard_dog.jpg` (or point manifest at `war_dog.jpg`)  
5. Dock/village thug set (dock_worker, corrupt_guard, village_thug, hired_muscle)
