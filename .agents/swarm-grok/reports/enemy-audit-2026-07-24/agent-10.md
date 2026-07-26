# Enemy Art Audit — Agent 10/16

**Date:** 2026-07-24  
**Enemies:** shrine_demon, smuggler, stranded_ronin  
**Scope:** Visual read of portrait + cut PNG only; no asset edits.

---

### shrine_demon
- paths: portrait=assets/enemy_shrine_demon.png cutout=assets/enemy_cut_shrine_demon.png
- scores: sil=9 style=9 detail=9 identity=10 cutout=8 total=45
- verdict: KEEP
- why: Muscular red-rust oni with ofuda-wrapped horns, shimenawa mallet, juzu + rust bell, torn indigo haori, and clawed feet reads instantly as the drowned-shrine guardian; hard black outlines and multi-tone cel body match combat-art cast. Cut shares solid void bg with light floor mist (project cut convention), no black-box / no identity mismatch.
- prompt_hint: n/a

### smuggler
- paths: portrait=assets/enemy_smuggler.png cutout=assets/enemy_cut_smuggler.png
- scores: sil=8 style=8 detail=9 identity=9 cutout=9 total=43
- verdict: KEEP
- why: Hooded oilskin cloak, contraband satchel, rope coil, twin blades, and cool mist palette sell Harbor Smuggler without soft-sharing cave/cove runners or puppeteer; silhouette of cape + bag is combat-readable. Cutout is clean void full-figure with fog stripped vs portrait — shippable.
- prompt_hint: n/a

### stranded_ronin
- paths: portrait=assets/enemy_stranded_ronin.png cutout=assets/enemy_cut_stranded_ronin.png
- scores: sil=8 style=9 detail=9 identity=10 cutout=9 total=45
- verdict: KEEP
- why: Rain-ruined masterless swordsman — torn blue haori/patches, low-ready blood-tipped katana, hollow tired eyes, waraji — is pure Stranded Ronin (foggy shoreline / beach pool), distinct from polished job_samurai and Gato-compound `ronin`. Portrait rain + mist are seinen; cutout drops rain/fog for clean void combat plate.
- prompt_hint: n/a

---

## Batch summary

| id | total | verdict |
|----|------:|---------|
| shrine_demon | 45 | **KEEP** |
| smuggler | 43 | **KEEP** |
| stranded_ronin | 45 | **KEEP** |

**Agent 10 result:** 3 KEEP · 0 REGENERATE · 0 DELETE · 0 DEDICATE  
None fall under REGENERATE threshold (total &lt; 30 or critical cutout/style fail). All three are dedicated painted-png cast plates (WAVE4 smuggler + stranded_ronin; WAVE9 shrine_demon) with matching enemy_cut_* voids.
