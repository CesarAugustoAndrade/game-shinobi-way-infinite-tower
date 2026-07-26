# Agent 07 — Enemy Art Audit

**Date:** 2026-07-24  
**Scope:** `hired_assassin`, `hired_muscle`, `missing_nin`  
**Rubric:** `RUBRIC.md` (Neo-Retro arcade / combat-art)

---

### hired_assassin
- paths: portrait=`public/assets/enemy_hired_assassin.png` cutout=`public/assets/enemy_cut_hired_assassin.png`
- scores: sil=9 style=8 detail=8 identity=9 cutout=7 total=41
- verdict: KEEP
- why: Wide dual-kunai combat stance and hooded mask read clearly at combat size; solid black outlines and cel-shading match Neo-Retro arcade. Portrait and cutout are near-identical full-body plates on pure black (no soft mush, no wrong identity); cutout is clean enough for dark stage use though not a distinct alpha crop.
- prompt_hint: n/a

### hired_muscle
- paths: portrait=`public/assets/enemy_hired_muscle.png` cutout=`public/assets/enemy_cut_hired_muscle.png`
- scores: sil=8 style=7 detail=9 identity=9 cutout=5 total=38
- verdict: KEEP
- why: Bulky denim-vest thug with brass knuckles, bat, and chain is unmistakable hired muscle for Wave settlement pools; rich dirt/sweat/patch detail. Style leans heroic painted comic rather than pure 16-bit cel, and cutout bakes soft smoke vignette into the black field (weaker battlefield alpha), but silhouette and identity are strong enough to keep.
- prompt_hint: n/a

### missing_nin
- paths: portrait=`public/assets/enemy_missing_nin.png` cutout=`public/assets/enemy_cut_missing_nin.png`
- scores: sil=9 style=9 detail=9 identity=10 cutout=7 total=44
- verdict: KEEP
- why: Scratched X forehead protector, tattered cloak, bandages, scars, and bloody short blade are textbook missing-nin; crouch silhouette is highly readable. Strong black outlines, 4–5 tone cel, and seinen grit match target combat-art style; cutout matches portrait hard-edge on black with no baked scenery.
- prompt_hint: n/a

---

## Batch summary

| id | total | verdict |
|----|-------|---------|
| hired_assassin | 41 | KEEP |
| hired_muscle | 38 | KEEP |
| missing_nin | 44 | KEEP |

**Counts:** KEEP=3 · REGENERATE=0 · DELETE=0 · DEDICATE=0  
**Notes:** All three are dedicated painted-png pool entries (manifest quality `painted-png`) with matching `enemy_cut_*` files. No simple/flat/emoji assets. Weakest link is `hired_muscle` cutout smoke vignette; still above regen threshold (total ≥30, no critical black-box / soft-share fail).
