# Enemy Art Audit — Agent 02/16

**Date:** 2026-07-24  
**Scope:** camp_raider, cave_smuggler, clumsy_puppeteer  
**Rubric:** Neo-Retro combat-art (16-bit / Neo Geo–Capcom outlines, cel 4–5 tones, readable combat silhouette; cutout clean alpha on dark battlefield)

---

### camp_raider
- paths: portrait=`public/assets/enemy_camp_raider.png` cutout=`public/assets/enemy_cut_camp_raider.png`
- scores: sil=8 style=7 detail=8 identity=9 cutout=7 total=39
- verdict: KEEP
- why: Dynamic three-quarter combat stance with bloody katana and overstuffed loot sack reads instantly as a camp raider; black outlines and dirt/tear detail land as painted arcade illustration, not mush. Portrait and cut are near-duplicates on pure black (soft foot-mist only) — acceptable on layered combat, not a baked scene.
- prompt_hint: n/a

### cave_smuggler
- paths: portrait=`public/assets/enemy_cave_smuggler.png` cutout=`public/assets/enemy_cut_cave_smuggler.png`
- scores: sil=8 style=6 detail=7 identity=9 cutout=8 total=38
- verdict: KEEP
- why: Identity is excellent — face wrap, filthy apron, shoulder crate of jarred contraband, belt pickaxe/sickle all sell “Cave Runner” smuggler without reading as a generic bandit clone. Style is flatter webtoon/anime (solid white gloves, softer fills) than hard Neo Geo cel, but silhouette and pure-black cutout stay combat-readable; not simple sludge.
- prompt_hint: n/a

### clumsy_puppeteer
- paths: portrait=`public/assets/enemy_clumsy_puppeteer.png` cutout=`public/assets/enemy_cut_clumsy_puppeteer.png`
- scores: sil=5 style=8 detail=8 identity=6 cutout=2 total=29
- verdict: REGENERATE
- why: Closest 16-bit/pixel Neo-Retro look of this batch (limited purple palette, hard edges, puppet strings), but **critical cutout fail** — `enemy_cut_clumsy_puppeteer` is the same full workshop scene as the portrait (shelves, hanging dolls, window), not an isolated alpha figure for dark combat layers. Silhouette muddies at combat size under clutter; “clumsy” reads as sinister expert instead of bumbling weak-tier puppeteer.
- prompt_hint: `16-bit Neo Geo arcade combat sprite, clumsy puppet-master shinobi in messy purple robes and half-mask, wild hair, awkward off-balance pose with tangled chakra control strings and a small wooden puppet slipping from grip, black 1-2px outlines, cel-shading 4-5 tones, cool abyss purple palette, full body, pure black transparent background, NO environment or workshop set, SNES Capcom enemy asset style -- combat cutout`

---

## Batch summary

| id | total | verdict |
|----|------:|---------|
| camp_raider | 39 | **KEEP** |
| cave_smuggler | 38 | **KEEP** |
| clumsy_puppeteer | 29 | **REGENERATE** |

**Batch notes:** 2/3 KEEP. Only clumsy_puppeteer fails rubric threshold (total &lt; 30 + baked-background cutout). Prefer regenerating both portrait and cut as matching pair: portrait may keep a subtle vignette; cut must be figure+puppet only on clean black/alpha.
