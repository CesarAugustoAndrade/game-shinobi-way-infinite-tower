# Agent 16 — Enemy Art Audit (CUTOUT half B + ARCHETYPE JPGs + residual icons)

**Scope:**  
- **PART A cutouts:** missing_nin, mist_ninja, monk, ronin, samurai, sea_creature, sea_spirit, shrine_demon, smuggler, stranded_ronin, trap_master, treasure_guardian, vengeful_ghost, village_thug, war_dog, water_spirit, wild_boar, boss_haku, boss_demon_brothers  
- **PART B archetypes:** `public/assets/icons/enemies/archetype_*.jpg`  
- **PART C residual JPGs:** non-archetype icons under `public/assets/icons/enemies/`  

**Rubric:** silhouette / style_match / detail_richness / identity_fit / cutout_quality (0–10). REGENERATE if total &lt; 30 **or** critical fail (baked BG cutout, black box, wrong identity).  
**Date:** 2026-07-24  
**No asset modifications** — report only.

---

## PART A — Combat cutouts (`enemy_cut_*`)

### missing_nin
- paths: portrait=`public/assets/enemy_missing_nin.png` cutout=`public/assets/enemy_cut_missing_nin.png`
- scores: sil=9 style=9 detail=9 identity=10 cutout=10 total=47
- verdict: **KEEP**
- why: Full-body crouch with crossed-out forehead protector, bloody short blade, torn black cloak — unmistakable missing-nin. Clean black-matte alpha, strong combat silhouette, seinen cel match.

### mist_ninja
- paths: portrait=`public/assets/enemy_mist_ninja.png` cutout=`public/assets/enemy_cut_mist_ninja.png`
- scores: sil=9 style=9 detail=9 identity=10 cutout=10 total=47
- verdict: **KEEP**
- why: Hooded Kirigakure assassin, glowing cyan eyes, dripping water FX as character-attached props (not scene). Clean alpha, high identity, arcade-ready pose.

### monk
- paths: portrait=`public/assets/enemy_monk.png` cutout=`public/assets/enemy_cut_monk.png`
- scores: sil=7 style=7 detail=8 identity=8 cutout=1 total=31
- verdict: **REGENERATE**
- why: Spiked-knuckle temple fighter identity is fine, but **cutout is a full baked temple scene** (Buddha statue, lanterns, courtyard, night sky). Critical cutout fail — cannot composite on layered combat stage. Portrait has same baked BG.
- prompt_hint: `Combat cutout transparent background, bald martial monk yellow robes prayer beads, spiked metal knuckle guards, aggressive fist stance, thick 1-2px black outline, 16-bit Neo Geo Capcom cel-shading 4-5 tones, Land of Waves mist palette, full body, NO temple NO lanterns NO background, clean alpha`

### ronin
- paths: portrait=`public/assets/enemy_ronin.png` cutout=`public/assets/enemy_cut_ronin.png`
- scores: sil=8 style=9 detail=9 identity=9 cutout=7 total=42
- verdict: **KEEP**
- why: Rain-soaked ragged kimono swordsman, dual blades, exhausted stare — clear ronin. Minor ground fog softens feet alpha but figure remains readable; shippable.

### samurai
- paths: portrait=`public/assets/enemy_samurai.png` cutout=`public/assets/enemy_cut_samurai.png`
- scores: sil=7 style=8 detail=9 identity=9 cutout=1 total=34
- verdict: **REGENERATE**
- why: Strong armored katana warrior (red do-maru, topknot, bloodied blade) but **cutout is full battlefield sunset scene** (flags, spears, sun, clouds). Critical baked-BG fail. Portrait same problem.
- prompt_hint: `Combat cutout transparent background, battle-worn samurai red lacquer armor dark scarf topknot headband, two-handed katana bloodied, thick outline 16-bit Capcom arcade cel, full body silhouette, NO sunset NO flags NO battlefield, clean alpha, Land of Waves tone`

### sea_creature
- paths: portrait=`public/assets/enemy_sea_creature.png` cutout=`public/assets/enemy_cut_sea_creature.png`
- scores: sil=9 style=9 detail=9 identity=10 cutout=8 total=45
- verdict: **KEEP**
- why: Barnacle-covered eel-kraken hybrid, orange eye, tentacle mass — perfect sea-creature identity. Light mist at base only; silhouette reads huge and hostile.

### sea_spirit
- paths: portrait=`public/assets/enemy_sea_spirit.png` cutout=`public/assets/enemy_cut_sea_spirit.png`
- scores: sil=7 style=8 detail=8 identity=2 cutout=9 total=34
- verdict: **REGENERATE**
- why: Art is a **frost-coated dock thug** (flat cap, peacoat, spiked knuckle glove, ice drip FX) — **identity mismatch for “sea spirit”**. Clean cutout quality cannot save wrong character. Compare to `water_spirit` (actual spirit body) which already owns the ethereal niche. Portrait and cutout both wrong.
- prompt_hint: `Combat cutout transparent background, ethereal sea spirit — translucent humanoid water body, glowing cyan core, barnacles and ship nails piercing form, dripping seawater, no legs fade to mist, thick black outline, 16-bit arcade cel, clean alpha, NOT a human dock worker, Land of Waves`

### shrine_demon
- paths: portrait=`public/assets/enemy_shrine_demon.png` cutout=`public/assets/enemy_cut_shrine_demon.png`
- scores: sil=9 style=9 detail=9 identity=10 cutout=8 total=45
- verdict: **KEEP**
- why: Red oni with ofuda headband, kanabo, prayer beads, torn indigo wrap — pure shrine-demon read. Ground fog only; body alpha solid.

### smuggler
- paths: portrait=`public/assets/enemy_smuggler.png` cutout=`public/assets/enemy_cut_smuggler.png`
- scores: sil=9 style=9 detail=9 identity=10 cutout=10 total=47
- verdict: **KEEP**
- why: Hooded masked runner, satchel of vials, rope, bloody knife — perfect cove smuggler. Flawless black-field cutout.

### stranded_ronin
- paths: portrait=`public/assets/enemy_stranded_ronin.png` cutout=`public/assets/enemy_cut_stranded_ronin.png`
- scores: sil=8 style=9 detail=8 identity=9 cutout=10 total=44
- verdict: **KEEP**
- why: Distinct from `ronin` via satchel, more patches, weary droop — stranded wanderer read. Clean full-body alpha. Soft-similar to ronin but dedicated enough.

### trap_master
- paths: portrait=`public/assets/enemy_trap_master.png` cutout=`public/assets/enemy_cut_trap_master.png`
- scores: sil=9 style=9 detail=9 identity=10 cutout=10 total=47
- verdict: **KEEP**
- why: Goggles, wire spool, barbed wire, tripwire tools, manriki — identity slam dunk. Clean cutout, dynamic crouch.

### treasure_guardian
- paths: portrait=`public/assets/enemy_treasure_guardian.png` cutout=`public/assets/enemy_cut_treasure_guardian.png`
- scores: sil=9 style=9 detail=10 identity=9 cutout=9 total=46
- verdict: **KEEP**
- why: Undead armored skeleton with rust plate, chains, barnacles, anchor weapon, ghost-glow — shipwreck guardian. Clean alpha with subtle vapor FX only.

### vengeful_ghost
- paths: portrait=`public/assets/enemy_vengeful_ghost.png` cutout=`public/assets/enemy_cut_vengeful_ghost.png`
- scores: sil=9 style=9 detail=9 identity=10 cutout=9 total=46
- verdict: **KEEP**
- why: Pale onryō kimono, purple eyes, floating lower body into mist — textbook vengeful ghost. Mist is part of silhouette, not a scene plate.

### village_thug
- paths: portrait=`public/assets/enemy_village_thug.png` cutout=`public/assets/enemy_cut_village_thug.png`
- scores: sil=9 style=9 detail=9 identity=10 cutout=10 total=47
- verdict: **KEEP**
- why: Fat sweaty knife thug, rope belt, filthy shirt — perfect low-tier village trash. Perfect cutout.

### war_dog
- paths: portrait=`public/assets/enemy_war_dog.png` cutout=`public/assets/enemy_cut_war_dog.png`
- scores: sil=9 style=9 detail=9 identity=10 cutout=10 total=47
- verdict: **KEEP**
- why: Spiked-harness mastiff, glowing eyes, scarred snarl — elite guard dog. Clean full-body alpha.

### water_spirit
- paths: portrait=`public/assets/enemy_water_spirit.png` cutout=`public/assets/enemy_cut_water_spirit.png`
- scores: sil=9 style=9 detail=9 identity=10 cutout=9 total=46
- verdict: **KEEP**
- why: Translucent water humanoid, glowing chest pearl, floating nails/barnacles — true spirit identity (contrast with broken `sea_spirit`). Clean alpha.

### wild_boar
- paths: portrait=`public/assets/enemy_wild_boar.png` cutout=`public/assets/enemy_cut_wild_boar.png`
- scores: sil=9 style=9 detail=9 identity=10 cutout=9 total=46
- verdict: **KEEP**
- why: Muddy scarred forest boar, tusks, breath fog — excellent beast trash. Light ground mist OK.

### boss_haku
- paths: portrait=`public/assets/enemy_boss_haku.png` cutout=`public/assets/enemy_cut_boss_haku.png`
- scores: sil=6 style=8 detail=9 identity=10 cutout=1 total=34
- verdict: **REGENERATE**
- why: Portrait identity is excellent (white mask, senbon, ice mirrors theme) but **cutout is a full ice-mirror scene card** (crystal lattice, dual mirror clones, ice floor fill) — not a composable boss sprite. Critical cutout fail. Aligns with agent-13 boss bar.
- prompt_hint: `Boss combat cutout transparent background, Haku — androgynous Mist shinobi long dark hair topknot hairpins, blank white porcelain mask red cheek marks, white-blue kimono sash, four ice senbon in fingers, cold mist ribbons as character FX only, thick outline Capcom 16-bit cel, full body readable silhouette, NO ice floor NO mirror background NO scene, clean alpha, epic boss pose`

### boss_demon_brothers
- paths: portrait=`public/assets/enemy_boss_demon_brothers.png` cutout=`public/assets/enemy_cut_boss_demon_brothers.png`
- scores: sil=9 style=9 detail=9 identity=10 cutout=9 total=46
- verdict: **KEEP**
- why: Dual Gozu/Meizu (steel + green oni masks, claw gauntlets, linking chain) — boss-epic dual silhouette. Cutout is figure-only on pure black field with no pagoda/moon plate (cleaner than portrait). Ship as combat cutout; note agent-13 may flag residual black-matte pipeline — visual read here is shippable dual boss sprite.

---

## PART B — Archetype UI icons (`public/assets/icons/enemies/`)

Manifest (`src/game/constants/enemyArtManifest.ts`) still points all 5 archetypes at these JPGs.

### archetype_tank.jpg
- scores: sil=7 style=6 detail=7 identity=2 cutout=n/a total≈22 (icon axes)
- verdict: **REGENERATE**
- why: **Western plate knight + heater shield + polearm** — thematic mismatch for a shinobi/Naruto-world game. Readable as “tank” generically, wrong franchise. Needs armored **shinobi/sumo/iron-body** tank, not medieval Europe.
- prompt_hint: `UI icon pixel-cel, shinobi tank archetype — bulky armored leaf/missing-nin with iron body stance, large iron shield or heavy gauntlets, no European knight plate, purple abyss bg, 16-bit Capcom, readable at 64px`

### archetype_assassin.jpg
- scores: sil=8 style=7 detail=6 identity=8 total≈29
- verdict: **KEEP**
- why: Purple hooded dual-kunai leap, red eyes, motion blur — assassin-coded and UI-readable. Slightly chibi but fine for archetype chip.

### archetype_balanced.jpg
- scores: sil=8 style=7 detail=7 identity=8 total≈30
- verdict: **KEEP**
- why: Standard masked shinobi with leaf headband + sword — clear “balanced fighter” UI glyph. Consistent pixel-cel set language.

### archetype_caster.jpg
- scores: sil=8 style=8 detail=8 identity=9 total≈33
- verdict: **KEEP**
- why: Best of set — dual elemental orbs (blue/purple), ofuda tags, seal kanji forehead — clear ninjutsu caster. Strong UI icon.

### archetype_genjutsu.jpg
- scores: sil=8 style=8 detail=7 identity=9 total≈32
- verdict: **KEEP**
- why: Hooded face, hypno spiral red eyes, smirk — instant genjutsu read. Perfect badge size.

---

## PART C — Residual enemy JPGs under `icons/enemies/`

**Code refs:** only `archetype_*.jpg` are wired in `enemyArtManifest.ts`. No TS/TSX hits for residual job/pool JPGs (dock_worker.jpg, gato.jpg, etc.). Combat uses painted `public/assets/enemy_*.png` + cutout rewrite.

| residual JPG | painted PNG supersedes? | notes | verdict |
|---|---|---|---|
| `dock_worker.jpg` | yes → `enemy_dock_worker.png` | Pink chroma; art is ghost blob, not dock worker | **DELETE** |
| `gato.jpg` | yes → `enemy_gato.png` | Pink chroma cartoon Gato | **DELETE** |
| `hired_assassin.jpg` | yes → `enemy_hired_assassin.png` | Pink chroma; **duplicate face of missing_nin.jpg** (same mist-assassin plate) | **DELETE** |
| `missing_nin.jpg` | yes → `enemy_missing_nin.png` | Pink chroma; soft-share twin of hired_assassin.jpg | **DELETE** |
| `sea_spirit.jpg` | yes → `enemy_sea_spirit.png` (wrong identity pair) | Frost dock thug on pink — same wrong art as PNG | **DELETE** residual; **REGENERATE** painted pair (Part A) |
| `sea_creature.jpg` | yes → `enemy_sea_creature.png` | Low-res pixel icon; painted supersedes | **DELETE** |
| `war_dog.jpg` | yes → `enemy_war_dog.png` | Different armored-dog pixel head; unused | **DELETE** |
| `wild_boar.jpg` | yes → `enemy_wild_boar.png` | Simple pixel head; unused | **DELETE** |
| `shrine_demon.jpg` | yes → `enemy_shrine_demon.png` | Framed icon variant; combat uses PNG | **DELETE** |
| `trap_master.jpg` | yes → `enemy_trap_master.png` | Stylized bust icon; unused path | **DELETE** |
| `vengeful_ghost.jpg` | yes → `enemy_vengeful_ghost.png` | Pixel bust; unused | **DELETE** |
| `water_spirit.jpg` | yes → `enemy_water_spirit.png` | Chibi water blob; unused | **DELETE** |
| `drowned_sailor.jpg` | yes → `enemy_drowned_sailor.png` | Residual icon; painted exists | **DELETE** |
| `corrupted_priest.jpg` | yes → `enemy_corrupted_priest.png` | Residual icon; painted exists | **DELETE** |
| `cursed_servant.jpg` | yes → `enemy_cursed_servant.png` | Residual icon; painted exists | **DELETE** |

**KEEP residual JPGs:** none (except archetypes handled in Part B).

---

## Batch summary

### PART A cutouts — loop lists

| id | total | verdict | critical |
|----|-------|---------|----------|
| missing_nin | 47 | **KEEP** | — |
| mist_ninja | 47 | **KEEP** | — |
| monk | 31 | **REGENERATE** | baked temple BG |
| ronin | 42 | **KEEP** | mild foot fog |
| samurai | 34 | **REGENERATE** | baked battlefield BG |
| sea_creature | 45 | **KEEP** | — |
| sea_spirit | 34 | **REGENERATE** | **wrong identity** (dock frost thug) |
| shrine_demon | 45 | **KEEP** | — |
| smuggler | 47 | **KEEP** | — |
| stranded_ronin | 44 | **KEEP** | — |
| trap_master | 47 | **KEEP** | — |
| treasure_guardian | 46 | **KEEP** | — |
| vengeful_ghost | 46 | **KEEP** | — |
| village_thug | 47 | **KEEP** | — |
| war_dog | 47 | **KEEP** | — |
| water_spirit | 46 | **KEEP** | — |
| wild_boar | 46 | **KEEP** | — |
| boss_haku | 34 | **REGENERATE** | full ice-mirror scene as “cutout” |
| boss_demon_brothers | 46 | **KEEP** | dual boss sprite OK |

**PART A counts:** KEEP **15** · REGENERATE **4** · DELETE **0** · DEDICATE **0**

### PART B archetypes

| file | verdict |
|------|---------|
| archetype_tank.jpg | **REGENERATE** (Western knight ≠ shinobi tank) |
| archetype_assassin.jpg | **KEEP** |
| archetype_balanced.jpg | **KEEP** |
| archetype_caster.jpg | **KEEP** |
| archetype_genjutsu.jpg | **KEEP** |

**PART B counts:** KEEP **4** · REGENERATE **1**

### PART C residual icons — DELETE list (for loop)

```
DELETE public/assets/icons/enemies/dock_worker.jpg
DELETE public/assets/icons/enemies/gato.jpg
DELETE public/assets/icons/enemies/hired_assassin.jpg
DELETE public/assets/icons/enemies/missing_nin.jpg
DELETE public/assets/icons/enemies/sea_spirit.jpg
DELETE public/assets/icons/enemies/sea_creature.jpg
DELETE public/assets/icons/enemies/war_dog.jpg
DELETE public/assets/icons/enemies/wild_boar.jpg
DELETE public/assets/icons/enemies/shrine_demon.jpg
DELETE public/assets/icons/enemies/trap_master.jpg
DELETE public/assets/icons/enemies/vengeful_ghost.jpg
DELETE public/assets/icons/enemies/water_spirit.jpg
DELETE public/assets/icons/enemies/drowned_sailor.jpg
DELETE public/assets/icons/enemies/corrupted_priest.jpg
DELETE public/assets/icons/enemies/cursed_servant.jpg
```

**Do NOT delete:** `archetype_tank.jpg` (regenerate in place), `archetype_assassin.jpg`, `archetype_balanced.jpg`, `archetype_caster.jpg`, `archetype_genjutsu.jpg` — still referenced by manifest.

### Loop priority (agent-16)

1. **REGENERATE cutouts (high):** `monk`, `samurai`, `boss_haku` — baked full scenes masquerading as cutouts.  
2. **REGENERATE identity (high):** `sea_spirit` portrait + cutout — currently frost dock thug; rewrite as ethereal water entity (or reassign thug art to dock/cove humanoid and give sea_spirit new art).  
3. **REGENERATE archetype (med):** `archetype_tank.jpg` → shinobi-world tank glyph.  
4. **DELETE residual JPGs (low risk):** 15 files above — zero code refs, painted PNGs own combat paths.  
5. **KEEP ship list:** missing_nin, mist_ninja, ronin, sea_creature, shrine_demon, smuggler, stranded_ronin, trap_master, treasure_guardian, vengeful_ghost, village_thug, war_dog, water_spirit, wild_boar, boss_demon_brothers (+ 4 archetype icons).

### Cross-notes for merge
- `sea_spirit` PNG pair and residual JPG share the same wrong frost-thug art; deleting JPG alone does not fix combat identity.  
- `dock_worker.png` (out of Part A list) also appears to be a wrong ghost plate — flag for another agent/loop if not already covered.  
- Boss pair: agent-13 scored both bosses REGENERATE (stricter black-box bar); this agent **KEEP**s `boss_demon_brothers` cutout after visual read (figures only, no scene plate). Loop lead should reconcile boss_demon_brothers cutout alpha vs black-matte pipeline.
