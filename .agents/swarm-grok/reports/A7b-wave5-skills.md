# A7b WAVE5 — Skills Residual Report (tools & common loot faces)

**Agent:** A7b WAVE5 (SKILLS residual — tools & common loot faces)  
**Branch:** `develop` (no commit)  
**Date:** 2026-07-23  
**Scope:** Paint 12 high-frequency BASIC tool / common combat faces players see in R1 scrolls; wire `painted-png`  
**Balance:** No formula / cost / winrate changes  
**Skill DB:** Unchanged (114 skills — no delete)

---

## Summary

| Area | Result |
|------|--------|
| Skill DB size | **114** (unchanged) |
| Manifest entries | **114/114** |
| Painted PNG total | **61** (was 49 after wave4) |
| Wave5 newly painted | **12** tools / common faces |
| Still imagine-jpg | **53** |
| R1 clan loadout coverage | **35/35** (closed wave3; untouched) |
| tsc `--noEmit` | **Clean** (exit 0) |

---

## 1. Selection rationale (tools & common)

Wave4 residual called out high-visibility leftovers: `flash_bomb`, `senbon`, `kunai_*`. All wave5 picks are **SkillTier.BASIC** — eligible from floor 1–3 scrolls onward via `LootSystem.generateSkillForFloor`, so they dominate early R1 tool loot / merchant / treasure skill grants.

### Wave5 painted faces (12)

| skill id | name | tier | el | action | why high-freq | file | quality |
|----------|------|------|----|--------|---------------|------|---------|
| `kunai_slash` | Kunai Slash | BASIC | PHYSICAL | MAIN | Melee tool, bleed package | `/assets/skill_kunai_slash.png` | painted-png |
| `kunai_throw` | Kunai Throw | BASIC | PHYSICAL | MAIN | Core ranged tool | `/assets/skill_kunai_throw.png` | painted-png |
| `shuriken_barrage` | Shuriken Barrage | BASIC | PHYSICAL | MAIN | Multi-hit upgrade of painted shuriken | `/assets/skill_shuriken_barrage.png` | painted-png |
| `windmill_shuriken` | Windmill Shuriken | BASIC | PHYSICAL | MAIN | Piercing big-star tool | `/assets/skill_windmill_shuriken.png` | painted-png |
| `senbon` | Senbon Needle | BASIC | PHYSICAL | MAIN | Silence tool, common needle face | `/assets/skill_senbon.png` | painted-png |
| `senbon_rain` | Senbon Rain | BASIC | PHYSICAL | MAIN | Poison multi-hit barrage | `/assets/skill_senbon_rain.png` | painted-png |
| `explosive_barrage` | Explosive Barrage | BASIC | FIRE | MAIN | Multi-tag upgrade of wave4 explosive_tag | `/assets/skill_explosive_barrage.png` | painted-png |
| `sword_slash` | Sword Slash | BASIC | PHYSICAL | MAIN | Common weapon MAIN | `/assets/skill_sword_slash.png` | painted-png |
| `iaido` | Iaido | BASIC | PHYSICAL | MAIN | Quick-draw sword companion | `/assets/skill_iaido.png` | painted-png |
| `poison_coat` | Poison Coat | BASIC | PHYSICAL | SIDE | Tool buff / coat face | `/assets/skill_poison_coat.png` | painted-png |
| `flash_bomb` | Flash Bomb | BASIC | PHYSICAL | SIDE | Utility bomb w/ smoke_bomb family | `/assets/skill_flash_bomb.png` | painted-png |
| `cloak_invis` | Cloak of Invisibility | BASIC | PHYSICAL | SIDE | Common stealth utility | `/assets/skill_cloak_invis.png` | painted-png |

**Art style:** square cyber-ninja pixel skill emblems, void black bg, framed plates with element-coded glows (cyan steel tools, green poison, orange multi-blast, violet stealth) — matches wave1–4 plates.

---

## 2. Full painted set (61 = wave1…wave5)

### Wave1 (8)
`basic_atk` → skill_taijutsu.png · `shuriken` · `fireball` · `gentle_fist` · `primary_lotus` · `shadow_clone` → skill_shadow_clones.png · `chidori` · `mind_destruction` → skill_mind_body_disturbing.png

### Wave2 (12)
`rasengan` · `basic_medical` · `shunshin` · `phoenix_flower` · `sharingan_2` · `64_palms` · `kaiten` · `byakugan` · `leaf_whirlwind` · `dynamic_entry` · `mind_transfer` · `hell_viewing`

### Wave3 (17)
`bunshin` · `brace` · `analyze` · `precision` · `taijutsu_training` · `chakra_reserves` · `wire_setup` · `smoke_bomb` · `sharingan_predict` · `fire_affinity` · `air_palm` · `byakugan_scan` · `dancing_leaf` · `focused_breathing` · `iron_body` · `kai` · `mental_fortitude`

### Wave4 (12)
`mud_wall` · `kawarimi` · `henge` · `explosive_tag` · `water_prison` · `suijinheki` · `hidden_mist` · `water_clone` · `lightning_ball` · `earth_decapitation` · `great_breakthrough` · `water_dragon`

### Wave5 (12) — this pass
`kunai_slash` · `kunai_throw` · `shuriken_barrage` · `windmill_shuriken` · `senbon` · `senbon_rain` · `explosive_barrage` · `sword_slash` · `iaido` · `poison_coat` · `flash_bomb` · `cloak_invis`

On-disk: all 61 under `public/assets/skill_*.png` **and** mirrored to root `assets/skill_*.png`.

---

## 3. Wiring changes

### `src/game/constants/skillArtManifest.ts`
12 entries upgraded:

```
src: /assets/icons/skills/<id>.jpg  + quality: imagine-jpg
  →  /assets/skill_<id>.png         + quality: painted-png
```

Cascade unchanged: `getSkillArt()` → registry → `skill.image` → emoji.

### `src/game/constants/artRegistry.ts`
`ART_BACKLOG_NOTES.T020_skills` updated: 61 painted faces; ~53 remain imagine-jpg.

### Assets added (×2 mirrors)
```
public/assets/skill_kunai_slash.png
public/assets/skill_kunai_throw.png
public/assets/skill_shuriken_barrage.png
public/assets/skill_windmill_shuriken.png
public/assets/skill_senbon.png
public/assets/skill_senbon_rain.png
public/assets/skill_explosive_barrage.png
public/assets/skill_sword_slash.png
public/assets/skill_iaido.png
public/assets/skill_poison_coat.png
public/assets/skill_flash_bomb.png
public/assets/skill_cloak_invis.png
```
(+ identical copies under root `assets/`)

---

## 4. Totals rollup

| Metric | Wave1 | Wave2 | Wave3 | Wave4 | Wave5 | **Now** |
|--------|-------|-------|-------|-------|-------|---------|
| Newly painted this wave | 8 | 12 | 17 | 12 | **12** | — |
| Cumulative painted PNG | 8 | 20 | 37 | 49 | **61** | **61** |
| Remaining imagine-jpg | 106 | 94 | 77 | 65 | **53** | **53** |
| R1 loadout unique painted | partial | 18/35 | **35/35** | 35/35 | 35/35 | **full** |
| Skill DB | 114 | 114 | 114 | 114 | 114 | 114 |

**Painted vs jpg residual:** 61 painted PNG · 53 imagine-jpg · 114 total.

---

## 5. Constraints checklist

| Constraint | Status |
|------------|--------|
| No balance changes | ✅ |
| Skill DB not deleted | ✅ (114 intact) |
| tsc clean | ✅ |
| No commit | ✅ |
| Manifest ids match skill ids | ✅ |
| public + assets mirror | ✅ |
| Tools / common R1 focus | ✅ all 12 BASIC tool/common |

---

## 6. Residual (out of scope / next waves)

- **53** non-painted skills still `imagine-jpg` under `public/assets/icons/skills/`.
- Next high-visibility leftovers: taijutsu mid (`rising_wind`, `strong_fist`, `sweeping_kick`, `elbow_strike`, stances), ADVANCED (`dragon_flame`, `air_bullet`, `fang_over_fang`), HIDDEN/clan (`ice_mirrors`, `shadow_possession`, summons, gates).
- Optional: compress large PNG plates if bundle size matters.

---

## 7. Files touched

| Path | Action |
|------|--------|
| `public/assets/skill_kunai_slash.png` | **new** painted |
| `public/assets/skill_kunai_throw.png` | **new** painted |
| `public/assets/skill_shuriken_barrage.png` | **new** painted |
| `public/assets/skill_windmill_shuriken.png` | **new** painted |
| `public/assets/skill_senbon.png` | **new** painted |
| `public/assets/skill_senbon_rain.png` | **new** painted |
| `public/assets/skill_explosive_barrage.png` | **new** painted |
| `public/assets/skill_sword_slash.png` | **new** painted |
| `public/assets/skill_iaido.png` | **new** painted |
| `public/assets/skill_poison_coat.png` | **new** painted |
| `public/assets/skill_flash_bomb.png` | **new** painted |
| `public/assets/skill_cloak_invis.png` | **new** painted |
| `assets/skill_*.png` (12 mirrors) | **new** painted |
| `src/game/constants/skillArtManifest.ts` | 12 → painted-png |
| `src/game/constants/artRegistry.ts` | backlog note |
| `.agents/swarm-grok/reports/A7b-wave5-skills.md` | this report |

---

## 8. Verification

```text
Manifest painted-png : 61 entries
Manifest imagine-jpg : 53 entries
Entries              : 114
Wave5 disk assets    : 12/12 present (public + root assets)
Skill DB deleted     : none
Balance formulas     : untouched
tsc --noEmit         : exit 0
No git commit
```

**Done.**
