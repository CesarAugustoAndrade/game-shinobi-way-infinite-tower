# Enemy Art Audit — Agent 08/16

**Date:** 2026-07-24  
**Scope:** `mist_ninja`, `monk`, `ronin`  
**Rubric:** Neo-Retro combat-art (16-bit / Neo Geo–Capcom 1–2px outlines + 4–5 tone cel; heroic painted OK; cool abyss/mist palette; cutout = clean alpha, no black box, no baked scene)  
**Mode:** Visual read of portrait + cut PNG only; no asset edits.

---

### mist_ninja
- paths: portrait=`public/assets/enemy_mist_ninja.png` cutout=`public/assets/enemy_cut_mist_ninja.png`
- scores: sil=9 style=9 detail=9 identity=9 cutout=8 total=44
- verdict: KEEP
- why: Full-body wet-hood assassin with torn pale-blue cloak, face wrap, glowing cyan eyes, blood flecks, dripping condensation, and short blade — strong combat silhouette and bold black outlines with multi-tone cel shade that match Land of Waves mist cast. Portrait and cut share the same void plate (project cut convention); not simple, not mushy.
- prompt_hint: n/a
- soft-share note: `pool_river_bandit` and `pool_hidden_guard` both point at `enemy_mist_ninja.png` (manifest + artRegistry residual). Those IDs need **DEDICATE** art later (river raider / static guard identity), not a mist_ninja plate swap. This plate stays the mist/assassin owner.

### monk
- paths: portrait=`public/assets/enemy_monk.png` cutout=`public/assets/enemy_cut_monk.png`
- scores: sil=6 style=4 detail=7 identity=8 cutout=1 total=26
- verdict: REGENERATE
- why: Identity reads (bald temple fighter, juzu beads, spiked tekko, saffron robes) but style is hard pixel-art RPG bust with a full temple/Buddha/lantern scene baked into **both** portrait and cut — critical cutout fail (no clean alpha figure, unreadable on layered battlefield). Pixel chunk style also breaks Neo-Retro painted/cel cast cohesion used by mist_ninja and most WAVE plates. Total &lt; 30 + cutout critical → replace.
- prompt_hint: Full-body warrior monk combat sprite, shaved head with three forehead dots, heavy wood/bone prayer beads, torn saffron/ochre robes with red sash, spiked iron knuckle guards, martial stance fists forward, black 1–2px outlines, 4–5 tone cel-shade (not pixel), cool abyss accent shadows + warm robe gold, pure black / transparent cutout no temple background, Neo Geo–Capcom arcade read

### ronin
- paths: portrait=`public/assets/enemy_ronin.png` cutout=`public/assets/enemy_cut_ronin.png`
- scores: sil=8 style=8 detail=8 identity=9 cutout=7 total=40
- verdict: KEEP
- why: Rain-soaked masterless swordsman — open tattered dark haori, dirty white-grey hakama, waraji, drawn katana + rusty second scabbard, hollow tired eyes — ships clear ronin identity for Gato-compound / elite pools and stays distinct from `stranded_ronin` (blue patched haori, different posture) and armored `samurai`. Heroic seinen paint with readable outlines fits rubric; cut carries soft ground fog like other kept voids (not a full baked scene box).
- prompt_hint: n/a

---

## Batch summary

| id | total | verdict |
|----|------:|---------|
| mist_ninja | 44 | **KEEP** |
| monk | 26 | **REGENERATE** |
| ronin | 40 | **KEEP** |

- **KEEP:** 2  
- **REGENERATE:** 1  
- **DELETE:** 0  
- **DEDICATE:** 0 (on this batch’s primary IDs; residual soft-shares river_bandit / hidden_guard → mist_ninja still need dedicated plates off-agent)

**Agent 08 result:** 2 KEEP · 1 REGENERATE · 0 DELETE · 0 DEDICATE  

**Notes:** All three portrait + `enemy_cut_*` pairs exist under `public/assets/` (no orphans). Only `monk` fails the &lt;30 / critical-cutout gate — regenerate both portrait and cut as matching cel plates with transparent combat void. Soft-share cleanup for river_bandit / hidden_guard is backlog, not a mist_ninja REGENERATE.
