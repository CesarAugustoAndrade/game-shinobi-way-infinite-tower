# Agent 01 — Enemy Art Audit

**Date:** 2026-07-24  
**Scope:** bandit_captain, beach_bandit, bridge_saboteur  
**Style target:** Neo-Retro arcade combat-art (1–2px black outlines, 4–5 tone cel-shade, readable silhouette, Land of Waves cool/mist palette)

---

### bandit_captain
- paths: portrait=`public/assets/enemy_bandit_captain.png` cutout=`public/assets/enemy_cut_bandit_captain.png`
- scores: sil=9 style=8 detail=9 identity=9 cutout=8 total=43
- verdict: KEEP
- why: Full-body scarred leader with torn purple coat, rusted lamellar, blood, and katana — strong readable silhouette and rich cel-shaded detail that clearly reads as a bandit captain. Cutout matches portrait cleanly on pure black with no baked scene or box.
- prompt_hint: n/a

### beach_bandit
- paths: portrait=`public/assets/enemy_beach_bandit.png` cutout=`public/assets/enemy_cut_beach_bandit.png`
- scores: sil=8 style=8 detail=7 identity=8 cutout=9 total=40
- verdict: KEEP
- why: Lean full-body coastal thug with mask, torn sleeveless kit, rusted cutlass, and studded boots; cool pale palette fits mist/waves. Portrait correctly keeps fog/ground; cutout is clean alpha on black with matching figure.
- prompt_hint: n/a

### bridge_saboteur
- paths: portrait=`public/assets/enemy_bridge_saboteur.png` cutout=`public/assets/enemy_cut_bridge_saboteur.png`
- scores: sil=5 style=8 detail=7 identity=4 cutout=8 total=32
- verdict: REGENERATE
- why: Bust-only composition weakens combat silhouette vs full-body peers; Konoha leaf plate on a bridge saboteur (Gato/Wave merc) is identity-wrong, and the hot-magenta portrait plate fights the abyss/mist UI palette. Outlines/cel quality is fine but ship as wrong character framing.
- prompt_hint: Full-body Land of Waves bridge saboteur, no village headband (blank cloth or scavenged iron plate), tattered grey cloak with purple damp stains, face wrap dripping mist/water, tanto or demolition charges/wire spool, black 1–2px outlines, 4–5 tone cel-shade, cool abyss/mist palette, pure black transparent cutout, dynamic sabotage stance

---

## Batch summary

| id | total | verdict |
|----|-------|---------|
| bandit_captain | 43 | **KEEP** |
| beach_bandit | 40 | **KEEP** |
| bridge_saboteur | 32 | **REGENERATE** |

- KEEP: 2  
- REGENERATE: 1  
- DELETE: 0  
- DEDICATE: 0  

**Notes:** All three pairs exist under `public/assets/` (no orphans). Captain and beach bandit are production-ready Neo-Retro combat art. Bridge saboteur needs a full-body regenerate without Leaf symbolism and with cutout-first alpha.
