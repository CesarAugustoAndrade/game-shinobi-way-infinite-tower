# Agent 11 — Enemy Art Audit

**Date:** 2026-07-24  
**Scope:** trap_master, treasure_guardian, vengeful_ghost  
**Assets inspected:** portrait + cutout PNGs under `public/assets/`  
**Style target:** 16-bit / Neo Geo–Capcom arcade combat-art (black 1–2px outlines, cel 4–5 tones, readable silhouette; Land of Waves cool abyss / mist)

---

### trap_master
- paths: portrait=`public/assets/enemy_trap_master.png` cutout=`public/assets/enemy_cut_trap_master.png`
- scores: sil=9 style=8 detail=8 identity=9 cutout=8 total=42
- verdict: KEEP
- why: Distinct crouch combat silhouette with goggles, barbed-wire spool, knuckle-kunai, and tool pouches; cel-shaded navy/brown palette with clean black outlines reads as trap engineer ninja, not generic bandit. Portrait and cut are matching full-body plates on pure black with no baked scenery or black-box frame.
- prompt_hint: n/a

### treasure_guardian
- paths: portrait=`public/assets/enemy_treasure_guardian.png` cutout=`public/assets/enemy_cut_treasure_guardian.png`
- scores: sil=9 style=9 detail=10 identity=9 cutout=8 total=45
- verdict: KEEP
- why: Massive undead armored skeleton with rusted plate, barnacles, gold coins, padlock/chains, and seaweed-wrapped anchor reads immediately as a shipwreck vault warden (underwater temple / secret loot). High cel detail and cool cyan-glow silhouette work on dark combat fields; no mush or style mismatch. Note: `eldritch_guardian` soft-shares this same portrait (`enemy_treasure_guardian.png`) and should get its own dedicated art under a separate DEDICATE pass — not a defect of this asset for treasure_guardian itself.
- prompt_hint: n/a

### vengeful_ghost
- paths: portrait=`public/assets/enemy_vengeful_ghost.png` cutout=`public/assets/enemy_cut_vengeful_ghost.png`
- scores: sil=9 style=9 detail=9 identity=10 cutout=8 total=45
- verdict: KEEP
- why: Classic onryō/yūrei — pale floating woman, torn blood-stained kimono, wild black hair, purple eye-glow and claw reach — matches prompt identity (“pale yurei floating hair”) and ruined-estate manor pool. Strong horror-seinen cel with readable silhouette; cutout alpha on black is clean with intentional mist dissolve, not a baked photo box.
- prompt_hint: n/a

---

## Batch summary

| id | total | verdict |
|----|-------|---------|
| trap_master | 42 | **KEEP** |
| treasure_guardian | 45 | **KEEP** |
| vengeful_ghost | 45 | **KEEP** |

- **KEEP:** 3  
- **REGENERATE:** 0  
- **DELETE:** 0  
- **DEDICATE (related):** `eldritch_guardian` still soft-shares `enemy_treasure_guardian.png` — needs own plate (out of primary batch; flag only).

No asset edits performed. All three primary enemies clear the ≥30 threshold with no critical cutout/style fails.
