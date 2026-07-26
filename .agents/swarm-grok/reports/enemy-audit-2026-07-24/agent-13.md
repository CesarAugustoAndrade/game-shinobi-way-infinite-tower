# Agent 13 — Boss Enemy Art Audit

**Scope:** `boss_haku`, `boss_demon_brothers`  
**Bar:** Boss-tier epic (harsher than trash/elite). Cutouts must composite on dark layered battlefield.  
**Date:** 2026-07-24

---

### boss_haku
- paths: portrait=`public/assets/enemy_boss_haku.png` cutout=`public/assets/enemy_cut_boss_haku.png`
- scores: sil=5 style=7 detail=7 identity=8 cutout=1 total=28
- verdict: REGENERATE
- why: Portrait is a solid Haku identity (white ANBU mask, senbon, Demonic Ice Mirrors reflections, ice shard field) with decent neo-retro cel outlines and cool blue palette—but it is a **baked full-scene illustration**, not a composable combat sprite. The so-called cutout is effectively the **same full ice-mirror background** (crystals, diamond lattice, dual mirror doubles, vapor trails)—zero clean alpha, unusable on layered combat stages. At combat size the ice lattice mush and twin reflections kill silhouette read. Boss bar not met for combat use.
- portrait_bg: **BAKED full environment** (ice mirrors, crystal shards, blue atmospheric fill) — problem for combat layers; OK only as card/panel art if cut is fixed.
- prompt_hint: `Boss combat cutout, transparent background, Haku of the Mist — androgynous shinobi, long dark hair topknot with hairpins, blank white porcelain mask red cheek marks, white/blue kimono sash, holding four ice senbon between fingers, cold mist ribbons only as character FX, thick 1-2px black outline, 16-bit Neo Geo Capcom arcade cel-shading 4-5 tones, readable full-body silhouette, no ice floor no mirror background no scene, Land of Waves mist palette, epic boss pose, clean alpha`

---

### boss_demon_brothers
- paths: portrait=`public/assets/enemy_boss_demon_brothers.png` cutout=`public/assets/enemy_cut_boss_demon_brothers.png`
- scores: sil=7 style=8 detail=8 identity=8 cutout=3 total=34
- verdict: REGENERATE
- why: Strongest art in this batch—dual Gozu/Meizu read is excellent (steel vs green oni masks, horned, claw gauntlets, connecting chain, dark plate armor, glowing eyes). Style match is true arcade/pixel-cel with metal rivet detail and toxic green key color. Portrait is boss-epic as a card. **Critical fail:** cutout sits on **opaque pure black box**, not clean alpha; residual purple vapor still reads as scene mush when composited. Dual-figure silhouette is good but black-box cut fails the combat-layer contract. Total ≥30 only because portrait carries it—still REGENERATE per black-box critical rule.
- portrait_bg: **BAKED full environment** (toxic green moon, pagoda silhouettes, swirling green fog) — fine for portrait/card; do not reuse as combat sprite.
- prompt_hint: `Boss combat cutout dual characters transparent background, Demon Brothers Gozu and Meizu side by side — one grey steel oni mask horns yellow eyes, one green oni mask horns yellow eyes, black ninja armor gold rivets spiked pauldrons, oversized metal claw gauntlets, iron chain linking their wrists, purple scarf and high ponytail on green mask, aggressive lunging pose, thick 1-2px black outline, 16-bit Neo Geo Capcom arcade cel 4-5 tones, readable dual silhouette, no moon no pagoda no fog floor, pure clean alpha, epic Land of Waves boss`

---

## Batch summary

| id | total | verdict | critical issues |
|----|-------|---------|-----------------|
| boss_haku | 28 | **REGENERATE** | Cutout = full baked ice scene (not cut); portrait baked bg |
| boss_demon_brothers | 34 | **REGENERATE** | Cutout black box (opaque #000); portrait baked green moon/pagoda scene |

**Verdict counts:** KEEP 0 · REGENERATE 2 · DELETE 0 · DEDICATE 0

**Notes for art pipeline**
1. Both portraits ship as **heroic scene cards** (baked backgrounds). That is acceptable for UI panels/cards if cutouts are real sprites.
2. Both current “cut” files fail combat layering: Haku has full scene; Demon Brothers have black box.
3. Priority order: fix cutouts first (transparent alpha, no bg, boss silhouette). Re-export portraits only if style drift is desired; Demon Brothers portrait quality is already near KEEP for panel use alone.
4. Boss bar: neither asset pair is shippable as a combat boss until cutouts are true clean sprites.
