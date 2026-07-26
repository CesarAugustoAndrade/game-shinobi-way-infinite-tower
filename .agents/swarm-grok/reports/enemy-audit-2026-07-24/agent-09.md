# Agent 09 — Enemy Art Audit

**Date:** 2026-07-24  
**Scope:** `samurai`, `sea_creature`, `sea_spirit` (portrait + cut each)  
**Rubric:** `RUBRIC.md` (Neo-Retro arcade / combat-art)

---

### samurai
- paths: portrait=`assets/enemy_samurai.png` cutout=`assets/enemy_cut_samurai.png`
- scores: sil=8 style=8 detail=9 identity=9 cutout=3 total=37
- verdict: KEEP
- why: Battle-worn armored swordsman (ponytail, lacquered red sode, bloodied katana, headband) is a strong, readable job identity in painted Neo-Retro style with solid outlines and cel depth. Cutout is a near-copy of the full sunset battlefield portrait (flags/sun baked in), so combat alpha isolation is weak—but subject silhouette still dominates and art is not simple/generic.
- prompt_hint: n/a (optional cut reprocess only: same samurai pose on pure void black / transparent, no sky/flags/sun; hard black 1–2px outline, 4–5 tone cel armor)

### sea_creature
- paths: portrait=`assets/enemy_sea_creature.png` cutout=`assets/enemy_cut_sea_creature.png`
- scores: sil=9 style=8 detail=9 identity=9 cutout=7 total=42
- verdict: KEEP
- why: Excellent tentacle sea monster—serpentine head, torn dorsal fin, barnacle clusters, orange predatory eye, suckered coils—matches Lot E brief (“tentacle sea monster”) and Land-of-Waves abyss palette. Dark void background keys cleanly; residual mist at base is minor atmospheric fringe, not a black-box fail.
- prompt_hint: n/a

### sea_spirit
- paths: portrait=`assets/enemy_sea_spirit.png` cutout=`assets/enemy_cut_sea_spirit.png`
- scores: sil=7 style=5 detail=4 identity=1 cutout=5 total=22
- verdict: REGENERATE
- why: Critical identity mismatch and low complexity (~small ~363KB class). Asset depicts a living dock/street thug (flat cap, scarred face, spiked knuckle-duster fist, leather coat) with decorative cyan drip FX—not a “translucent blue water humanoid” spirit. Style is flatter cartoon/mobile than Neo Geo cel; portrait still shows hot magenta chroma key. Reads as wet hired muscle / beach enforcer, overlaps human-thug roster, fails spirit pool fantasy.
- prompt_hint: 16-bit Neo Geo arcade enemy portrait, translucent blue water yokai humanoid, semi-transparent rippling body, glowing cyan eyes, flowing liquid hair/tendrils, no solid clothing, hard black 1–2px outlines, 4–5 tone cel-shading, misty abyss Land of Waves palette, centered on pure black void, no text, combat-readable silhouette

---

## Batch summary

| id | total | verdict |
|----|------:|---------|
| samurai | 37 | **KEEP** |
| sea_creature | 42 | **KEEP** |
| sea_spirit | 22 | **REGENERATE** |

**Counts:** KEEP 2 · REGENERATE 1 · DELETE 0 · DEDICATE 0

### Notes
- `sea_spirit` is the only hard fail in this batch: total &lt; 30 + identity critical fail. Prefer regenerating both portrait and cut together (void black / clean alpha).
- `water_spirit` already owns a strong ethereal water-body design; new `sea_spirit` should differentiate (more yokai / foam / wave-humanoid, less nail-pierced ghost) so the two pool entries stay distinct.
- `samurai` KEEP stands on portrait quality; if combat UI shows cut as full-bleed sprite, schedule a non-generative cut-only isolation pass (remove baked sunset) before ship polish—not a full art regen.
