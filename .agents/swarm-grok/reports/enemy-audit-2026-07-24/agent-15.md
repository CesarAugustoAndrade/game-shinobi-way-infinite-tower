# Enemy Art Audit — Agent 15/16 (CUTOUT technical quality, half A)

**Date:** 2026-07-24  
**Scope (20 ids):** `bandit_captain`, `beach_bandit`, `bridge_saboteur`, `camp_raider`, `cave_smuggler`, `clumsy_puppeteer`, `corrupt_foreman`, `corrupt_guard`, `corrupt_merchant`, `corrupted_priest`, `cove_smuggler`, `cursed_servant`, `desperate_traveler`, `dock_worker`, `drowned_sailor`, `exhausted_shinobi`, `forest_bandit`, `gato`, `hired_assassin`, `hired_muscle`  
**Focus:** cutout technical quality — alpha clean? black box / black-key matte? baked bg? silhouette usable in combat?  
**Assets inspected:** `public/assets/enemy_cut_<id>.png` (duplicates also under `assets/`); portraits noted for identity check.  
**Rubric:** silhouette · style_match · detail_richness · identity_fit · cutout_quality (0–10). REGENERATE if total &lt; 30 or any critical fail (black-box / full baked scene / pure identity mismatch).  
**Runtime note:** Combat prefers true RGBA cutouts + chakra aura; optional `blackKey` (`mix-blend-mode: lighten`) can hide solid black plates on dark layers (`CinematicViewscreen`). `scripts/blackkey-enemy-cutouts.mjs` exists to convert black matte → alpha. Black matte alone is **not** auto-DELETE, but scores cutout_quality down and should be black-keyed before ship polish.

---

### bandit_captain
- paths: portrait=`public/assets/enemy_bandit_captain.png` cutout=`public/assets/enemy_cut_bandit_captain.png` (+ `assets/` twins)
- scores: sil=9 style=9 detail=9 identity=9 cutout=6 total=42
- verdict: KEEP
- why: Full-body scarred captain (red hachimaki, rusted do-maru, purple coat, bloodied sheathed blade) has excellent combat silhouette and Neo-Retro cel/outline work. Cutout is isolated on **opaque black matte** (not true alpha; no baked environment) — black-key candidate, still readable on abyss battlefield.
- prompt_hint: n/a (optional black-key pass only)

### beach_bandit
- paths: portrait=`public/assets/enemy_beach_bandit.png` cutout=`public/assets/enemy_cut_beach_bandit.png`
- scores: sil=9 style=8 detail=8 identity=9 cutout=6 total=40
- verdict: KEEP
- why: Full-body ragged coastal thug (headband, face wrap, torn vest, rusty saber, studded boots) reads clearly at combat scale; hard outlines, cool pale skin. Opaque black plate, figure cleanly isolated — no scene bake; needs true-alpha black-key for aura polish.
- prompt_hint: n/a

### bridge_saboteur
- paths: portrait=`public/assets/enemy_bridge_saboteur.png` cutout=`public/assets/enemy_cut_bridge_saboteur.png`
- scores: sil=6 style=8 detail=8 identity=8 cutout=6 total=36
- verdict: KEEP
- why: Strong mist-ninja bust (Konoha-style plate + wet wraps + dripping dagger) is combat-usable as a portrait-cutout, but **not full-body** — silhouette weaker vs full-body cast. Opaque black, no baked bg; soft-share target for elite_mercenary per artRegistry.
- prompt_hint: optional regen to full-body combat stance on transparent BG for parity with full-body foes

### camp_raider
- paths: portrait=`public/assets/enemy_camp_raider.png` cutout=`public/assets/enemy_cut_camp_raider.png`
- scores: sil=8 style=8 detail=8 identity=9 cutout=5 total=38
- verdict: KEEP
- why: Full-body opportunistic looter (bloody tanto, loot bag, filthy kimono) has clear raider identity. **Baked ground fog/dust** at feet softens cutout edge — not a full black-box fail, but cutout_quality hit; opaque black elsewhere.
- prompt_hint: re-export same pose, strip ground fog, true RGBA alpha, keep loot bag + blade silhouette

### cave_smuggler
- paths: portrait=`public/assets/enemy_cave_smuggler.png` cutout=`public/assets/enemy_cut_cave_smuggler.png`
- scores: sil=9 style=8 detail=9 identity=10 cutout=6 total=42
- verdict: KEEP
- why: Distinct full-body miner-smuggler (apron, crate of jars, pickaxe, face wrap, muddy boots) — excellent identity and readable props. Clean isolation on black matte; no scene bake.
- prompt_hint: n/a

### clumsy_puppeteer
- paths: portrait=`public/assets/enemy_clumsy_puppeteer.png` cutout=`public/assets/enemy_cut_clumsy_puppeteer.png`
- scores: sil=4 style=7 detail=8 identity=9 cutout=1 total=29
- verdict: REGENERATE
- why: **Critical cutout fail:** cutout is a full **baked workshop scene** (window, shelves, hanging puppets, interior walls) — not an isolated combat sprite. Silhouette unusable against layered battlefield; pixel/cel art of puppeteer + puppet is good identity but wrong delivery format. Total &lt; 30.
- prompt_hint: Full-body clumsy purple-clad puppeteer with chunin headband, holding chakra strings to a small wooden puppet, black outlines 1–2px, 4–5 tone cel, pure transparent background, no room/shelves, combat stance, Land of Waves mist palette

### corrupt_foreman
- paths: portrait=`public/assets/enemy_corrupt_foreman.png` cutout=`public/assets/enemy_cut_corrupt_foreman.png`
- scores: sil=9 style=8 detail=9 identity=10 cutout=6 total=42
- verdict: KEEP
- why: Full-body “FOREMAN KURODA” with clipboard, crowbar, rope, toolbelt, orange bandana — instant bridge-site labor boss. Clean isolation, opaque black matte, no baked fog.
- prompt_hint: n/a

### corrupt_guard
- paths: portrait=`public/assets/enemy_corrupt_guard.png` cutout=`public/assets/enemy_cut_corrupt_guard.png`
- scores: sil=9 style=9 detail=9 identity=9 cutout=6 total=42
- verdict: KEEP
- why: Kabuto + rusted lamellar + naginata + yellow eyes = strong enforcer silhouette; dark armor still reads via plate edges/weapon. Opaque black, no baked environment. Soft-share target for manor_guardian/elite_guard.
- prompt_hint: n/a

### corrupt_merchant
- paths: portrait=`public/assets/enemy_corrupt_merchant.png` cutout=`public/assets/enemy_cut_corrupt_merchant.png`
- scores: sil=9 style=8 detail=9 identity=10 cutout=6 total=42
- verdict: KEEP
- why: Full-body crook with false scales, coin purse, bloody dagger — perfect false-merchant identity; clean black isolation, readable silhouette (robe + scale pans).
- prompt_hint: n/a

### corrupted_priest
- paths: portrait=`public/assets/enemy_corrupted_priest.png` cutout=`public/assets/enemy_cut_corrupted_priest.png`
- scores: sil=9 style=8 detail=9 identity=10 cutout=5 total=41
- verdict: KEEP
- why: Ofuda conical hat, purple cracked flesh, torn indigo kimono, prayer beads — shrine-corruption identity excellent. **Baked fog/mist around feet** and semi-opaque robe hem bleed into black; still combat-readable but cutout not pure.
- prompt_hint: optional re-export strip floor fog, keep purple miasma only as character VFX on true alpha

### cove_smuggler
- paths: portrait=`public/assets/enemy_cove_smuggler.png` cutout=`public/assets/enemy_cut_cove_smuggler.png`
- scores: sil=9 style=8 detail=9 identity=10 cutout=6 total=42
- verdict: KEEP
- why: Wet longcoat, bottle, flensing knife, grappling hook, barnacles — clear cove smuggler; full-body, clean isolation on black matte, no environment bake.
- prompt_hint: n/a

### cursed_servant
- paths: portrait=`public/assets/enemy_cursed_servant.png` cutout=`public/assets/enemy_cut_cursed_servant.png`
- scores: sil=8 style=8 detail=9 identity=10 cutout=5 total=40
- verdict: KEEP
- why: Cracked porcelain mask + butler tails + handprints + purple eyes = manor servant identity. **Baked ground fog + debris** under feet hurts cutout purity; dark suit is low-contrast at tiny size but mask/gloves still read.
- prompt_hint: re-export strip floor fog/debris; keep floating particles as optional character FX on true alpha

### desperate_traveler
- paths: portrait=`public/assets/enemy_desperate_traveler.png` cutout=`public/assets/enemy_cut_desperate_traveler.png`
- scores: sil=9 style=8 detail=8 identity=10 cutout=6 total=41
- verdict: KEEP
- why: Full-body gaunt hooded figure, ragged cloak, rusty blade, satchel, terrified eyes — perfect desperate road-ambush identity; clean black isolation, strong silhouette.
- prompt_hint: n/a

### dock_worker
- paths: portrait=`public/assets/enemy_dock_worker.png` cutout=`public/assets/enemy_cut_dock_worker.png`
- scores: sil=5 style=4 detail=3 identity=1 cutout=4 total=17
- verdict: REGENERATE
- why: **Critical identity fail:** both portrait and cutout depict a simple **cyan-eyed water ghost/sprite**, not a human dock worker. Portrait sits on **magenta key plate** (not combat-ready); cutout is a low-detail cartoon ghost on black. Manifest wires `pool_dock_worker` → `/assets/enemy_dock_worker.png` and region pool uses `dock_worker` — ships wrong art. Total 17 ≪ 30.
- prompt_hint: Full-body Land of Waves dock laborer, dirty fundoshi/happi or work jacket, rope/hook or cargo crate, muscular tired stance, black 1–2px outlines, cel 4–5 tones, cool mist palette, pure transparent BG, combat-readable silhouette (not a ghost)

### drowned_sailor
- paths: portrait=`public/assets/enemy_drowned_sailor.png` cutout=`public/assets/enemy_cut_drowned_sailor.png`
- scores: sil=9 style=9 detail=9 identity=10 cutout=6 total=43
- verdict: KEEP
- why: Undead sailor with barnacles, crab shoulder, glowing slime, sailor suit, rope-anchor — outstanding identity and silhouette. Isolated on black; water glow at feet is character VFX not full scene bake. Slight lower-body crop still combat-usable.
- prompt_hint: n/a

### exhausted_shinobi
- paths: portrait=`public/assets/enemy_exhausted_shinobi.png` cutout=`public/assets/enemy_cut_exhausted_shinobi.png`
- scores: sil=7 style=8 detail=8 identity=9 cutout=6 total=38
- verdict: KEEP
- why: 3/4-body wounded ninja (torn gi, bloody wraps, scratched headband, half-drawn blade) reads as exhausted/missing-nin combat foe; pixel-lean Neo-Retro outline. Opaque black, no baked scene; missing lower legs reduces full-body sil score.
- prompt_hint: optional full-body regen for parity; not required

### forest_bandit
- paths: portrait=`public/assets/enemy_forest_bandit.png` cutout=`public/assets/enemy_cut_forest_bandit.png`
- scores: sil=9 style=8 detail=8 identity=9 cutout=6 total=40
- verdict: KEEP
- why: Full-body combat stance (raised rusty knife, headband, face wrap, bandaged arms, torn grey gi) — classic forest bandit silhouette, clean isolation on black matte.
- prompt_hint: n/a

### gato
- paths: portrait=`public/assets/enemy_gato.png` cutout=`public/assets/enemy_cut_gato.png`
- scores: sil=6 style=6 detail=7 identity=9 cutout=6 total=34
- verdict: KEEP
- why: Bust-only chibi-leaning Gato (white suit, gold rings, dual canes, ship pin, oily grin) is recognizably Gato and combat-usable as boss bust. Style is flatter/cartoon vs painted full-body cast (style_match mid); opaque black, clean isolation, no baked bg. Below full-body quality bar but total ≥ 30 and no critical fail.
- prompt_hint: optional full-body Gato boss plate, Neo-Retro cel, transparent BG, canes + rings + smug stance for style parity

### hired_assassin
- paths: portrait=`public/assets/enemy_hired_assassin.png` cutout=`public/assets/enemy_cut_hired_assassin.png`
- scores: sil=9 style=8 detail=8 identity=9 cutout=6 total=40
- verdict: KEEP
- why: Full-body dual-kunai hooded assassin in black gear, blood splash — strong combat pose and silhouette. Clean black isolation; soft-share target for pool `assassin`.
- prompt_hint: n/a

### hired_muscle
- paths: portrait=`public/assets/enemy_hired_muscle.png` cutout=`public/assets/enemy_cut_hired_muscle.png`
- scores: sil=9 style=8 detail=9 identity=10 cutout=5 total=41
- verdict: KEEP
- why: Full-body bruiser (denim vest, bat, knuckle dusters, chain, scars) sells hired thug perfectly. **Atmospheric smoke haze** around body is mild baked FX — not full black-box; still slightly impure cutout edge.
- prompt_hint: optional strip body smoke for pure alpha; keep sweat/dirt on figure

---

## File / size notes (visual + layout)

| cutout | body crop | black matte | baked env/FX | relative density |
|--------|-----------|-------------|--------------|------------------|
| bandit_captain | full | yes | none | large painted |
| beach_bandit | full | yes | none | large painted |
| bridge_saboteur | **bust** | yes | none | mid (portrait crop) |
| camp_raider | full | yes | **ground fog** | large painted |
| cave_smuggler | full | yes | none | large painted |
| clumsy_puppeteer | bust+puppet | n/a | **FULL workshop scene** | dense pixel scene |
| corrupt_foreman | full | yes | none | large painted |
| corrupt_guard | full (legs cropped) | yes | none | large painted |
| corrupt_merchant | full | yes | none | large painted |
| corrupted_priest | full | yes | **floor fog** | large painted |
| cove_smuggler | full | yes | none | large painted |
| cursed_servant | full | yes | **fog + debris** | large painted |
| desperate_traveler | full | yes | none | large painted |
| dock_worker | full ghost | yes / portrait **magenta** | none | **tiny/simple sprite** |
| drowned_sailor | 3/4–full | yes | foot slime VFX | large painted |
| exhausted_shinobi | 3/4 | yes | none | mid pixel-cel |
| forest_bandit | full | yes | none | large painted |
| gato | **bust** | yes | none | mid cartoon bust |
| hired_assassin | full | yes | none | large painted |
| hired_muscle | full | yes | **body smoke** | large painted |

No zero-byte / missing cutouts in this batch — all 20 `enemy_cut_*.png` exist under both `public/assets/` and `assets/`. Tiny/outlier: **dock_worker** (wrong simple ghost art).

---

## Batch summary

| id | total | verdict |
|----|------:|---------|
| bandit_captain | 42 | **KEEP** |
| beach_bandit | 40 | **KEEP** |
| bridge_saboteur | 36 | **KEEP** |
| camp_raider | 38 | **KEEP** |
| cave_smuggler | 42 | **KEEP** |
| clumsy_puppeteer | 29 | **REGENERATE** |
| corrupt_foreman | 42 | **KEEP** |
| corrupt_guard | 42 | **KEEP** |
| corrupt_merchant | 42 | **KEEP** |
| corrupted_priest | 41 | **KEEP** |
| cove_smuggler | 42 | **KEEP** |
| cursed_servant | 40 | **KEEP** |
| desperate_traveler | 41 | **KEEP** |
| dock_worker | 17 | **REGENERATE** |
| drowned_sailor | 43 | **KEEP** |
| exhausted_shinobi | 38 | **KEEP** |
| forest_bandit | 40 | **KEEP** |
| gato | 34 | **KEEP** |
| hired_assassin | 40 | **KEEP** |
| hired_muscle | 41 | **KEEP** |

### Counts
- **KEEP:** 18  
- **REGENERATE:** 2 (`clumsy_puppeteer`, `dock_worker`)  
- **DELETE:** 0  
- **DEDICATE:** 0  

### Cutout tech priorities (half-A)
1. **REGENERATE now:** `clumsy_puppeteer` (scene bake), `dock_worker` (wrong ghost art + magenta portrait).  
2. **Black-key batch (non-blocking KEEP):** almost all painted cutouts still appear as **opaque black matte** rather than true RGBA — run `node scripts/blackkey-enemy-cutouts.mjs` (or re-export with alpha) so chakra aura drop-shadow works without relying on `blackKey` blend.  
3. **Strip baked FX (optional polish):** `camp_raider`, `corrupted_priest`, `cursed_servant`, `hired_muscle` ground/body fog.  
4. **Crop parity (optional):** `bridge_saboteur`, `gato`, `exhausted_shinobi` are bust/¾ — usable but weaker vs full-body combat cast.

No asset files modified by this agent. Report only.
