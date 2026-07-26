# Enemy Art Audit — Agent 03/16

**Date:** 2026-07-24  
**Scope:** corrupt_foreman, corrupt_guard, corrupt_merchant  
**Rubric:** Neo-Retro arcade (16-bit / Neo Geo–Capcom): black outlines 1–2px, cel 4–5 tones, readable silhouette; cutouts for dark battlefield; abyss/mist/Land of Waves palette.

---

### corrupt_foreman
- paths: portrait=`assets/enemy_corrupt_foreman.png` (+ `public/assets/enemy_corrupt_foreman.png`) cutout=`assets/enemy_cut_corrupt_foreman.png` (+ `public/assets/enemy_cut_corrupt_foreman.png`)
- scores: sil=9 style=8 detail=9 identity=10 cutout=9 total=45
- verdict: KEEP
- why: Stocky bridge-site boss with orange headband, name tag “FOREMAN KURODA”, clipboard, crowbar, rope coil, and toolbelt reads instantly as corrupt construction labor control under Gato; black outlines, dirt/patch cel work, and clean full-body cutout (mist stripped) match combat Neo-Retro. Not simple or generic.
- prompt_hint: n/a

### corrupt_guard
- paths: portrait=`assets/enemy_corrupt_guard.png` (+ `public/assets/enemy_corrupt_guard.png`) cutout=`assets/enemy_cut_corrupt_guard.png` (+ `public/assets/enemy_cut_corrupt_guard.png`)
- scores: sil=9 style=9 detail=9 identity=9 cutout=9 total=45
- verdict: KEEP
- why: Kabuto + rusted lamellar + bloodstained naginata and yellow eyes form a sharp enforcer silhouette (“Gato’s Enforcer”); armor weathering and crest read arcade/seinen, cutout is solid black with no baked fog. Dedicated plate (also soft-share target for manor_guardian/elite_guard) — identity and style both strong.
- prompt_hint: n/a

### corrupt_merchant
- paths: portrait=`assets/enemy_corrupt_merchant.png` (+ `public/assets/enemy_corrupt_merchant.png`) cutout=`assets/enemy_cut_corrupt_merchant.png` (+ `public/assets/enemy_cut_corrupt_merchant.png`)
- scores: sil=9 style=8 detail=9 identity=10 cutout=9 total=45
- verdict: KEEP
- why: Sleazy full-body crook with false balance scales, coin purse, and bloody dagger is perfect Crooked Merchant / “False Scales” event identity; torn dark robes, scarf pattern, and 1–2px outlines sit in the abyss mist palette; cutout alpha is clean and combat-readable.
- prompt_hint: n/a

---

## Batch summary

| id | total | verdict |
|----|-------|---------|
| corrupt_foreman | 45 | **KEEP** |
| corrupt_guard | 45 | **KEEP** |
| corrupt_merchant | 45 | **KEEP** |

- KEEP: 3  
- REGENERATE: 0  
- DELETE: 0  
- DEDICATE: 0  

All three are dedicated painted PNG portraits with matching `enemy_cut_*` combat cutouts, totals well above 30, no critical fails (no black-box cutouts, no photoreal mush, no soft-share identity mismatch on these ids). No regeneration required.
