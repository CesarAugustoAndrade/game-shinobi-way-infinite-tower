# Enemy Art Audit — Agent 05/16

**Date:** 2026-07-24  
**Scope:** `desperate_traveler`, `dock_worker`, `drowned_sailor`  
**Rubric:** `RUBRIC.md` (silhouette / style_match / detail_richness / identity_fit / cutout_quality, 0–10 each)

---

### desperate_traveler
- paths: portrait=`public/assets/enemy_desperate_traveler.png` cutout=`public/assets/enemy_cut_desperate_traveler.png`
- scores: sil=9 style=9 detail=9 identity=9 cutout=9 total=45
- verdict: KEEP
- why: Strong full-body silhouette (hood, ragged cloak, pack, chipped blade) reads at combat scale; black outlines + cel-shaded seinin tones match Neo-Retro target. Gaunt hollow stare and road-worn gear sell “starving traveler threat” without comedy; cutout is clean void black with no baked scene or box.
- prompt_hint: n/a

### dock_worker
- paths: portrait=`public/assets/enemy_dock_worker.png` cutout=`public/assets/enemy_cut_dock_worker.png`
- scores: sil=3 style=1 detail=2 identity=0 cutout=4 total=10
- verdict: REGENERATE
- why: Critical identity fail — asset is a soft cartoon water-ghost (featureless amoeba body, cyan dripping eyes, no clothes/tools) instead of a human dockhand enforcer. Small file (~276KB), flat soft paint without 1–2px black outlines or 4–5-tone cel stack; reads as generic AI sludge / emoji mascot, not Land of Waves dock labor. Cutout has black void but soft purple glow edges and wrong subject entirely.
- prompt_hint: Neo-Geo / Capcom 16-bit combat sprite, muscular brawler dockhand enforcer, salt-stained work gi and rope belt, heavy gaff hook weapon, calloused fists, grey rain mist pier, cold intimidation not fantasy heroics, black 1–2px outlines, cel-shading 4–5 tones, muted abyss blue #1a2633 fog grey bone white rust, square 1:1; cutout solid pure magenta #FF00FF or void black, no background props

### drowned_sailor
- paths: portrait=`public/assets/enemy_drowned_sailor.png` cutout=`public/assets/enemy_cut_drowned_sailor.png`
- scores: sil=9 style=9 detail=10 identity=10 cutout=9 total=47
- verdict: KEEP
- why: Corpse-green undead sailor with barnacles, crab on shoulder, mini rust anchor, phosphorescent cyan drips, and milky eyes is highly distinctive and perfect for sunken_ship. Arcade outlines + cel horror palette match combat-art target; rich costume/gunk detail; cutout clean on black void and clearly distinct from `water_spirit` (female water form with nails/orb).
- prompt_hint: n/a

---

## Batch summary

| id | total | verdict |
|----|-------|---------|
| desperate_traveler | 45 | **KEEP** |
| dock_worker | 10 | **REGENERATE** |
| drowned_sailor | 47 | **KEEP** |

**Priority action:** Replace `enemy_dock_worker.png` + `enemy_cut_dock_worker.png` (and residual `icons/enemies/dock_worker.jpg` ghost) with a human dock enforcer plate per ASSET-QUEUE Priority B brief (gaff hook, salt clothes, misty pier). Portrait fog optional; cutout must be combat-clean silhouette only.
