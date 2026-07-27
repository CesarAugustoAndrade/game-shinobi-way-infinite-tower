# E3-combat Report — Region 1 Combat Presentation

**Agent:** E3-combat (Grok swarm)  
**Date:** 2026-07-22  
**Scope:** Combat stage, cinematic layers, enemy art/cutouts, ApproachSelector, SkillCard, EliteChallenge, CRT flags  
**Mode:** Read-only audit + backlog append (`R1-001`–`R1-015`)

---

## Summary

| Metric | Value |
|--------|------:|
| New backlog tasks | **15** (`R1-001`–`R1-015`) |
| Critical (P0) | **4** |
| High (P1) | **5** |
| Medium/low (P2–P3) | **6** |

Region 1 **location backgrounds exist** for all Land of Waves biomes, but the **three-lámina parallax design is half-built**: mid/fg props are implemented in `CinematicViewscreen` and **never passed from `Combat.tsx`**, and **zero** `lamina_mid_*` / `lamina_fg_*` files exist. Enemy presentation collapses to **one reused shinobi cutout** for most of the R1 journey. Hero cutouts never fire. Stage is not 16:9-locked and is heavily darkened by opacity+CRT stack.

---

## Top 5 critical findings

1. **Midground/foreground never wired (R1-001)**  
   `CinematicViewscreen` accepts `midgroundImage` / `foregroundImage`; only call site (`Combat.tsx` ~641–657) passes `backgroundImage={background}`. Grep shows mid/fg props only inside CinematicViewscreen itself.

2. **Zero lamina assets (R1-002 / R1-013)**  
   `public/assets/` has `location_*.png` for all R1 biomes, but no `lamina_mid_*` or `lamina_fg_*`. Art guide and CHANGELOG/T-013 expect 1024×576 RGBA layers.

3. **Enemy identity collapse (R1-003)**  
   ~24 of 39 Waves pool IDs in `enemyArtManifest.ts` point at `/assets/enemy_exhausted_shinobi.png`. Distinct pool names (dock worker, saboteur, assassin…) share one face/cutout. `guard_dog` incorrectly maps to shinobi art.

4. **Cutout pipeline gaps (R1-004)**  
   Cutouts on disk: only 6 (`enemy_cut_{boss_demon_brothers,boss_haku,clumsy_puppeteer,exhausted_shinobi,monk,samurai}.png`).  
   Derivation in Combat: only if `enemy.image.startsWith('/assets/enemy_')`.  
   All `/assets/icons/enemies/*.jpg` pool entries (spirits, boar, gato, etc.) **never** get cutouts → portrait radial mask only.

5. **Hero side empty of cutouts (R1-005)**  
   Clan art is `/assets/icons/clans/*.jpg`; cutout path requires `/assets/hero_*`. No hero assets → stage is enemy-only silhouette combat vs art-direction dual-sprite intent.

---

## Architecture notes (how things resolve)

### Background (Lámina 1)
- `App.tsx` `combatBackground` = ``/assets/location_${getBiomeSlug(biome)}.png``  
- Biome from `currentLocation.biome || region.biome`  
- `getBiomeSlug`: lower + non-alnum → `_`  
- R1 biomes all have matching `location_*.png` in public (coastal_harbor, foggy_shoreline, dense_forest, underground_cavern, rural_village, river_banks, shipwreck, great_bridge, fortified_camp, ruined_estate, secret_harbor, underwater_temple, fortified_mansion, mist_covered_bridge).

### Mid / Foreground (Láminas 2–3)
- Convention documented; **not constructed in App/Combat**; **assets missing**.

### Enemy art cascade (`getEnemyArt` / `EnemySystem`)
1. `poolId` → `enemy:pool_<id>`  
2. Boss name keywords (haku / demon)  
3. Job keywords (puppeteer / monk / samurai / ninja)  
4. Archetype imagine-jpg  
5. Emoji mystery  

Pool art set at spawn via `resolveEnemyImageSrc({ poolId })`. Combat/EliteChallenge fallbacks often **omit poolId**.

### Cutouts
- `enemy_cut_<id>` only from painted `/assets/enemy_*` paths.  
- Aura only on cutout path.

### CRT
- `FeatureFlags.ENABLE_CRT_OVERLAY: true`  
- Scanlines always on; CRT frame gated.  
- Stack + bg opacity 0.42 → very dark stage (R1-007).

### Layout / 16:9
- Docs: 1024×576 stage.  
- CSS: fluid `1fr` stage, `min-height: 200px`, **no aspect-ratio** (R1-006).

---

## R1 enemyPool vs art (Land of Waves)

| Location | enemyPool | Art notes |
|----------|-----------|-----------|
| the_docks | dock_worker, corrupt_guard, smuggler | All exhausted_shinobi |
| misty_beach | beach_bandit, sea_spirit, stranded_ronin | bandit=shinobi; spirit=jpg; ronin=samurai |
| coastal_forest | forest_bandit, wild_boar, missing_nin | bandit=shinobi; others jpg no cutout |
| smugglers_cave | cave_smuggler, trap_master, guard_dog | dog wrongly shinobi |
| fishing_village | village_thug, corrupt_merchant, hired_muscle | all shinobi |
| riverside_camp | river_bandit, camp_raider, desperate_traveler | all shinobi |
| sunken_ship | drowned_sailor, water_spirit, treasure_guardian | mixed; guardian shinobi |
| bridge_construction | bridge_saboteur, hired_assassin, corrupt_foreman | all shinobi |
| bandit_outpost | bandit_captain, elite_mercenary, war_dog | dog jpg; rest shinobi |
| abandoned_manor | vengeful_ghost, manor_guardian, cursed_servant | ghost/servant jpg |
| hidden_cove | cove_smuggler, sea_creature, hidden_guard | mixed |
| drowned_shrine | shrine_demon, corrupted_priest, eldritch_guardian | demons jpg; guardian shinobi |
| gatos_compound | elite_guard, ronin, assassin, gato | gato jpg only; guards samurai/shinobi |

**Painted unique sheets:** monk, samurai, exhausted_shinobi, clumsy_puppeteer, boss_haku, boss_demon_brothers.  
**Cutouts:** same set only.

---

## Other findings

- **ApproachSelector:** name text only, no portrait (R1-009).  
- **SkillCard:** robust emoji fallback; R1 starters need art audit (R1-010).  
- **EliteChallenge:** card UI + SceneBackdrop, not cinematic dual-sprite; gato underwhelming (R1-011).  
- **pixelated** on all stage images harms JPG quality (R1-012).  
- **Haku / Demon Brothers** painted assets underused by pool spawn (R1-014).  
- Mini-log vs left floating panel possible overlap (R1-015).

---

## Imagine asset generation priorities (16:9)

Order for generation (portrait full-bleed + transparent cutout where noted). Style: terror sobrio / seinen-sublime / Land of Waves mist; combat-ready silhouette; 16:9 stage-friendly (1024×576 layers; character cutouts full-body transparent PNG).

### Wave A — Stage depth (pilot)
1. `lamina_mid_coastal_harbor.png` + `lamina_fg_coastal_harbor.png`  
2. `lamina_mid_dense_forest.png` + `lamina_fg_dense_forest.png`  
3. `lamina_mid_great_bridge.png` + `lamina_fg_great_bridge.png`  
4. `lamina_mid_mist_covered_bridge.png` + `lamina_fg_mist_covered_bridge.png` (region default)

### Wave B — Distinct R1 enemies (portrait + cutout)
5. Dock enforcer / corrupt guard (entry)  
6. Beach bandit / mist thug  
7. Bridge saboteur / hired assassin  
8. Gato (boss painted + cutout) — climax  
9. Sea spirit / water spirit (ethereal, not human shinobi)  
10. War dog / guard dog (fix wrong art)  
11. Missing-nin (coastal forest)  
12. Bandit captain (elite-adjacent)

### Wave C — Heroes + remaining biomes
13. Hero cutouts for 5 clans (`hero_<clan>.png` + `hero_cut_<clan>.png`)  
14. Remaining lamina pairs: foggy_shoreline, river_banks, rural_village, fortified_camp, fortified_mansion, underground_cavern, shipwreck, ruined_estate, secret_harbor, underwater_temple  
15. Secondary pool faces: smuggler, merchant thug, drowned sailor, shrine demon, cursed servant

### Manifest/code follow-ups after assets land
- Point `enemyArtManifest` pool entries off `exhausted_shinobi` where unique art exists.  
- Extend cutout resolver beyond `/assets/enemy_` prefix (or co-locate painted under that prefix).  
- Wire mid/fg in Combat (R1-001) before expecting visual payoff.

---

## Files reviewed

- `src/scenes/combat/Combat.tsx`, `Combat.css`  
- `src/scenes/combat/EliteChallenge.tsx`, `EliteChallenge.css`  
- `src/components/layout/CinematicViewscreen.tsx`, `.css`  
- `src/components/combat/{ApproachSelector,SkillCard,Hand}.*`  
- `src/game/constants/{enemyArtManifest,artRegistry,regions/landOfWaves}.ts`  
- `src/game/systems/EnemySystem.ts`  
- `src/config/featureFlags.ts`  
- `src/utils/colorHelpers.ts` (`getBiomeSlug`)  
- `src/App.tsx` (`combatBackground`)  
- `public/assets/` inventory (locations, enemies, cutouts, icons/enemies)  
- `docs/guia_direccion_de_arte_combate.md`

---

## Out of scope (not filed)

- Regions 2+ combat presentation  
- Runtime AI enemy images (`ENABLE_AI_IMAGES: false`)  
- Balance/combat math (already covered by historical TASK-R*)

---

## Deliverables

- Backlog: `region1-polish-backlog.md` ← **R1-001 … R1-015**  
- This report: `.agents/swarm-grok/reports/E3-combat.md`
