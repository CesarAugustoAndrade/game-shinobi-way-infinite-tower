# Agent 06 — Enemy Art Audit

**Date:** 2026-07-24  
**Scope:** `exhausted_shinobi`, `forest_bandit`, `gato`  
**Rubric:** `.agents/swarm-grok/reports/enemy-audit-2026-07-24/RUBRIC.md`  
**Method:** Visual read of portrait + cutout PNGs under `assets/`; cross-check `enemyArtManifest.ts` wiring and soft-share notes. No asset edits.

---

### exhausted_shinobi
- paths: portrait=`assets/enemy_exhausted_shinobi.png` cutout=`assets/enemy_cut_exhausted_shinobi.png`
- scores: sil=9 style=9 detail=9 identity=10 cutout=9 total=46
- verdict: KEEP
- why: Strong Neo Geo / 16-bit combat portrait — black outlines, multi-tone cel shading, ragged indigo gi, bloodied bandages, half-drawn katana, exhausted glare. Portrait moon/pagoda plate fits card use; cutout is a clean black-matte bust with no bg shards. Soft-shared by `job_ninja` / `job_shinobi` (manifest aliases) as intentional generic-shinobi fallback — art itself is not simple or mismatched for *exhausted_shinobi*.
- prompt_hint: n/a
- soft_share: `enemy:job_ninja`, `enemy:job_shinobi` → same PNG. Acceptable job cascade; only DEDICATE those jobs if product wants distinct fresh-genin / generic-ninja faces later (out of this id’s KEEP).

### forest_bandit
- paths: portrait=`assets/enemy_forest_bandit.png` cutout=`assets/enemy_cut_forest_bandit.png`
- scores: sil=9 style=8 detail=9 identity=9 cutout=9 total=44
- verdict: KEEP
- why: Full-body combat stance with ragged earth-tone vest, face wrap, bandages, dirt/blood, and raised rusty knife — readable silhouette at stage size, cool mist rim light, 4–5 tone cel shading matching WAVE key regen cast (`mist_ninja` tier). Portrait and cutout are essentially the same clean cut (black field, no baked environment). Distinct from exhausted_shinobi; no longer a soft-share placeholder.
- prompt_hint: n/a

### gato
- paths: portrait=`assets/enemy_gato.png` cutout=`assets/enemy_cut_gato.png`
- scores: sil=5 style=2 detail=3 identity=7 cutout=6 total=23
- verdict: REGENERATE
- why: Critical style fail for R1 climax boss. Flat webtoon/NFT cartoon with solid hot-magenta portrait plate, chibi hands, 2–3 tone fills, no arcade cel depth or abyss/mist palette — reads as emoji villain, not Capcom/Neo Geo combat art. Costume identity (slick hair, white suit, jewel rings, ship pin, dual canes) is right for shipping-magnate Gato, but execution is mush-simple (~small file, low paint density). Cutout drops magenta cleanly to black but inherits the same flat art; total 23 &lt; 30 and cartoon mismatch triggers REGENERATE.
- prompt_hint: Neo Geo / Capcom 16-bit boss portrait of Gato — short slick-haired shipping magnate, cruel sneer, white double-breasted suit + black wave-pattern cape, gold anchor necklace, gem rings, dual gold-capped canes with lantern glow; 1–2px black outlines, 4–5 tone cel shading, cool abyss mist palette (no magenta plate); heroic painted illustration OK; combat cutout perfectly clean silhouette, transparent bg, zero background remnants; bust-to-waist stage-readable.

---

## Batch summary

| id | total | verdict |
|----|-------|---------|
| exhausted_shinobi | 46 | **KEEP** |
| forest_bandit | 44 | **KEEP** |
| gato | 23 | **REGENERATE** |

**Priority regen:** `gato` only (boss-tier visual liability).  
**Do not touch:** `exhausted_shinobi`, `forest_bandit` (ship as-is).  
**Optional follow-up (not this batch’s REGENERATE):** dedicated art for soft-share jobs `job_ninja` / `job_shinobi` if product wants them distinct from the exhausted face.
