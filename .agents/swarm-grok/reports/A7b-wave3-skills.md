# A7b WAVE3 — Skills Art Residual Report

**Agent:** A7b WAVE3 (SKILLS art residual — R1 loadout faces)  
**Branch:** `develop` (no commit)  
**Date:** 2026-07-23  
**Scope:** Paint remaining 17 R1 clan-loadout utility/passive skill faces; wire `painted-png`  
**Balance:** No formula / cost / winrate changes  
**Skill DB:** Unchanged (114 skills — no delete)

---

## Summary

| Area | Result |
|------|--------|
| Skill DB size | **114** (unchanged) |
| Manifest entries | **114/114** |
| Painted PNG total | **37** (was 20 after wave2) |
| Wave3 newly painted | **17** / 17 residual list |
| Still imagine-jpg | **77** |
| R1 clan loadout coverage | **35/35 unique loadout ids** painted |
| tsc `--noEmit` | **Clean** (exit 0) |

> Goal “R1 clan full loadouts art-backed (~20+ quality faces)” **exceeded**: 37 painted faces total; every skill on every clan’s `CLAN_START_LOADOUT` now has a painted PNG face.

---

## 1. Wave3 painted faces (17)

All residual imagine-jpg R1 utility/passives from wave2 backlog.

| skill id | name | el | role | file | quality |
|----------|------|----|------|------|---------|
| `bunshin` | Clone Technique | MENTAL | side utility | `/assets/skill_bunshin.png` | painted-png |
| `brace` | Brace | PHYSICAL | side defense | `/assets/skill_brace.png` | painted-png |
| `analyze` | Analyze Enemy | MENTAL | side intel | `/assets/skill_analyze.png` | painted-png |
| `precision` | Precision | PHYSICAL | passive | `/assets/skill_precision.png` | painted-png |
| `taijutsu_training` | Taijutsu Training | PHYSICAL | passive | `/assets/skill_taijutsu_training.png` | painted-png |
| `chakra_reserves` | Chakra Reserves | PHYSICAL | passive | `/assets/skill_chakra_reserves.png` | painted-png |
| `wire_setup` | Wire Trap Setup | PHYSICAL | side setup | `/assets/skill_wire_setup.png` | painted-png |
| `smoke_bomb` | Smoke Bomb | PHYSICAL | side utility | `/assets/skill_smoke_bomb.png` | painted-png |
| `sharingan_predict` | Sharingan: Predict | MENTAL | side | `/assets/skill_sharingan_predict.png` | painted-png |
| `fire_affinity` | Fire Affinity | FIRE | passive | `/assets/skill_fire_affinity.png` | painted-png |
| `air_palm` | Air Palm | WIND | Hyuga main | `/assets/skill_air_palm.png` | painted-png |
| `byakugan_scan` | Tenketsu Scan | MENTAL | side | `/assets/skill_byakugan_scan.png` | painted-png |
| `dancing_leaf` | Shadow of Dancing Leaf | PHYSICAL | side setup | `/assets/skill_dancing_leaf.png` | painted-png |
| `focused_breathing` | Focused Breathing | PHYSICAL | side | `/assets/skill_focused_breathing.png` | painted-png |
| `iron_body` | Iron Body | PHYSICAL | passive | `/assets/skill_iron_body.png` | painted-png |
| `kai` | Release | MENTAL | side cleanse | `/assets/skill_kai.png` | painted-png |
| `mental_fortitude` | Mental Fortitude | MENTAL | passive | `/assets/skill_mental_fortitude.png` | painted-png |

**Art style:** square cyber-ninja mist emblems, void black bg, element-coded color (matches wave1/wave2 plates: fireball/chidori/sharingan reds, kaiten cyan-lavender, mental purples).

---

## 2. Full painted set (37 = wave1 + wave2 + wave3)

### Wave1 (8)
`basic_atk` → skill_taijutsu.png · `shuriken` · `fireball` · `gentle_fist` · `primary_lotus` · `shadow_clone` → skill_shadow_clones.png · `chidori` · `mind_destruction` → skill_mind_body_disturbing.png

### Wave2 (12)
`rasengan` · `basic_medical` · `shunshin` · `phoenix_flower` · `sharingan_2` · `64_palms` · `kaiten` · `byakugan` · `leaf_whirlwind` · `dynamic_entry` · `mind_transfer` · `hell_viewing`

### Wave3 (17) — this pass
`bunshin` · `brace` · `analyze` · `precision` · `taijutsu_training` · `chakra_reserves` · `wire_setup` · `smoke_bomb` · `sharingan_predict` · `fire_affinity` · `air_palm` · `byakugan_scan` · `dancing_leaf` · `focused_breathing` · `iron_body` · `kai` · `mental_fortitude`

On-disk: all 37 under `public/assets/skill_*.png` **and** mirrored to root `assets/skill_*.png`.

---

## 3. R1 clan loadout — full coverage

| Clan | Loadout skills | Painted |
|------|----------------|---------|
| **Uzumaki** | basic_atk, rasengan, basic_medical, bunshin, shunshin, brace, shadow_clone, chakra_reserves | 8/8 |
| **Uchiha** | basic_atk, shuriken, fireball, wire_setup, smoke_bomb, sharingan_predict, phoenix_flower, sharingan_2, fire_affinity, precision | 10/10 |
| **Hyuga** | basic_atk, gentle_fist, 64_palms, air_palm, kaiten, byakugan_scan, analyze, byakugan, precision, taijutsu_training | 10/10 |
| **Lee** | basic_atk, leaf_whirlwind, dynamic_entry, primary_lotus, dancing_leaf, focused_breathing, brace, taijutsu_training, iron_body | 9/9 |
| **Yamanaka** | basic_atk, shuriken, mind_transfer, hell_viewing, bunshin, analyze, kai, mental_fortitude | 8/8 |

**Unique R1 loadout ids:** 35/35 painted.  
Also painted outside pure loadout (loot/legacy): `chidori`, `mind_destruction` → **37** total painted faces.

---

## 4. Wiring changes

### `src/game/constants/skillArtManifest.ts`
17 entries upgraded:

```
src: /assets/icons/skills/<id>.jpg  + quality: imagine-jpg
  →  /assets/skill_<id>.png         + quality: painted-png
```

Cascade unchanged: `getSkillArt()` → registry → `skill.image` → emoji.

### `src/game/constants/artRegistry.ts`
`ART_BACKLOG_NOTES.T020_skills` updated: 37 painted faces; ~77 remain imagine-jpg.

### Assets added (×2 mirrors)
```
public/assets/skill_bunshin.png
public/assets/skill_brace.png
public/assets/skill_analyze.png
public/assets/skill_precision.png
public/assets/skill_taijutsu_training.png
public/assets/skill_chakra_reserves.png
public/assets/skill_wire_setup.png
public/assets/skill_smoke_bomb.png
public/assets/skill_sharingan_predict.png
public/assets/skill_fire_affinity.png
public/assets/skill_air_palm.png
public/assets/skill_byakugan_scan.png
public/assets/skill_dancing_leaf.png
public/assets/skill_focused_breathing.png
public/assets/skill_iron_body.png
public/assets/skill_kai.png
public/assets/skill_mental_fortitude.png
```
(+ identical copies under root `assets/`)

---

## 5. Totals rollup

| Metric | Wave1 | Wave2 | Wave3 | **Now** |
|--------|-------|-------|-------|---------|
| Newly painted this wave | 8 | 12 | **17** | — |
| Cumulative painted PNG | 8 | 20 | **37** | **37** |
| Remaining imagine-jpg | 106 | 94 | **77** | **77** |
| R1 loadout unique painted | partial | 18/35 | **35/35** | **full** |
| Skill DB | 114 | 114 | 114 | 114 |

---

## 6. Constraints checklist

| Constraint | Status |
|------------|--------|
| No balance changes | ✅ |
| Skill DB not deleted | ✅ (114 intact) |
| tsc clean | ✅ |
| No commit | ✅ |
| Manifest ids match skill ids | ✅ |
| public + assets mirror | ✅ |

---

## 7. Residual (out of scope)

- 77 non-R1-loadout skills still `imagine-jpg` under `public/assets/icons/skills/`.
- Optional future polish: downscale very large PNG plates for bundle size; skill DB `image` fields only set on a few legacy skills (cascade prefers manifest).
