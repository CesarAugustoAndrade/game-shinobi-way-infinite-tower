# Enemy Art Audit — Agent 04/16

**Date:** 2026-07-24  
**Scope:** `corrupted_priest`, `cove_smuggler`, `cursed_servant`  
**Rubric:** Neo-Retro combat-art (16-bit / Neo Geo–Capcom outlines + cel tones; heroic painted OK; not photoreal mush / flat emoji / AI sludge)

---

### corrupted_priest
- paths: portrait=`assets/enemy_corrupted_priest.png` cutout=`assets/enemy_cut_corrupted_priest.png`
- scores: sil=9 style=8 detail=9 identity=10 cutout=8 total=44
- verdict: KEEP
- why: Distinct conical ofuda-hat + torn indigo kimono + purple cracked flesh + floating prayer beads reads instantly as fallen clergy for Drowned Shrine; clean full-body silhouette and cool abyss palette. Portrait and cut share the same painted hero plate with intentional ground fog (not a black-box fail).
- prompt_hint: n/a

### cove_smuggler
- paths: portrait=`assets/enemy_cove_smuggler.png` cutout=`assets/enemy_cut_cove_smuggler.png`
- scores: sil=8 style=8 detail=9 identity=9 cutout=9 total=43
- verdict: KEEP
- why: Wet longcoat, face wrap, bottle, flensing knife, grappling hook, anchor buckle, and barnacles sell Hidden Cove smuggler without soft-sharing another archetype; hard outlines and wet cel sheen fit Neo-Retro combat art. Cutout is clean alpha on pure black with no baked environment box.
- prompt_hint: n/a

### cursed_servant
- paths: portrait=`assets/enemy_cursed_servant.png` cutout=`assets/enemy_cut_cursed_servant.png`
- scores: sil=7 style=8 detail=9 identity=10 cutout=8 total=42
- verdict: KEEP
- why: Porcelain cracked mask with matching purple eye, tattered butler tails, wax seal, gloves, and ghostly handprints nail “cursed manor servant” identity for Abandoned Manor. Style is solid outlined anime/seinen cel; only mild risk is dark suit low-contrast at tiny combat scale (mask/gloves still read). Cutout alpha clean with atmospheric mist, not a residual JPG box.
- prompt_hint: n/a

---

## Batch summary

| id | total | verdict |
|----|------:|---------|
| corrupted_priest | 44 | **KEEP** |
| cove_smuggler | 43 | **KEEP** |
| cursed_servant | 42 | **KEEP** |

- **KEEP:** 3  
- **REGENERATE:** 0  
- **DELETE:** 0  
- **DEDICATE:** 0  

No critical fails (no black-box cutouts, no soft-share identity mismatch, no photoreal/cartoon sludge). All three exceed the total&lt;30 REGENERATE threshold and ship as dedicated painted-png portrait + cut pairs.
