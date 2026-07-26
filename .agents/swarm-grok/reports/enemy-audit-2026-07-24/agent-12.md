# Agent 12 — Enemy Art Audit

**Date:** 2026-07-24  
**Scope:** `village_thug`, `war_dog` (+ `pool_guard_dog`), `water_spirit`, `wild_boar`  
**Assets inspected:** portrait + cutout PNGs under `public/assets/`  
**Rubric:** silhouette · style_match · detail_richness · identity_fit · cutout_quality (0–10); REGENERATE if total &lt; 30 or critical fail

---

### village_thug
- paths: portrait=`public/assets/enemy_village_thug.png` cutout=`public/assets/enemy_cut_village_thug.png`
- scores: sil=9 style=9 detail=9 identity=9 cutout=8 total=44
- verdict: KEEP
- why: Stocky knife-wielding extortionist with clear arcade silhouette, hard black outlines, and rich dirt/blood/sweat cel detail; portrait and cutout are matching full-body combat art on clean black (no box/mush). Reads as Village Extortionist, not generic AI sludge.
- prompt_hint: n/a

### war_dog
- paths: portrait=`public/assets/enemy_war_dog.png` cutout=`public/assets/enemy_cut_war_dog.png` (also `pool_guard_dog` → same `enemy_war_dog.png`)
- scores: sil=9 style=9 detail=9 identity=9 cutout=8 total=44
- verdict: KEEP
- why: Spiked armored war hound with glowing amber eyes, rusted plate, and aggressive three-quarter stance — strong Neo-Retro silhouette and cel tones. `pool_guard_dog` intentionally soft-shares this sprite (alias remapped); same war-dog identity fits both pool keys, so no DEDICATE.
- prompt_hint: n/a

### water_spirit
- paths: portrait=`public/assets/enemy_water_spirit.png` cutout=`public/assets/enemy_cut_water_spirit.png`
- scores: sil=8 style=8 detail=8 identity=9 cutout=8 total=41
- verdict: KEEP
- why: Tide Wraith humanoid of living water with pearl core, barnacles, and floating rusty nails — clear spirit identity and cool mist palette. Slightly softer glow-edge than hard 1–2px arcade linework, but still readable, detailed, and style-coherent on black cutout (not flat/simple).
- prompt_hint: n/a

### wild_boar
- paths: portrait=`public/assets/enemy_wild_boar.png` cutout=`public/assets/enemy_cut_wild_boar.png`
- scores: sil=9 style=9 detail=9 identity=10 cutout=8 total=45
- verdict: KEEP
- why: Battle-scarred tusked boar with mud, leaf litter, wounds, and breath fog — excellent silhouette and identity fit; high detail richness with solid black outlines and multi-tone fur. Portrait/cut pair are strong combat-ready sprites, not simple icons.
- prompt_hint: n/a

---

## Batch summary

| id | total | verdict |
|----|------:|---------|
| village_thug | 44 | **KEEP** |
| war_dog (incl. pool_guard_dog share) | 44 | **KEEP** |
| water_spirit | 41 | **KEEP** |
| wild_boar | 45 | **KEEP** |

- **KEEP:** 4  
- **REGENERATE:** 0  
- **DELETE:** 0  
- **DEDICATE:** 0  

**Notes:** All four exceed the &lt;30 regen threshold with no critical fails (no black-box cutouts, no pure soft-share identity mismatch, no photoreal/cartoon mismatch). Portrait and cutout files for each id appear to be the same full-body combat illustration (duplicate paths, clean black field). `pool_guard_dog` correctly reuses `war_dog` art per manifest alias — intentional share, not an orphan needing dedicate.
