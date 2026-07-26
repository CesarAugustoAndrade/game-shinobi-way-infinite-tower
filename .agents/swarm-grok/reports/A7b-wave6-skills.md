# A7b WAVE6 — Skills Residual Report (ADVANCED / mid-late R1 combat faces)

**Agent:** A7b WAVE6 (SKILLS residual — ADVANCED faces)  
**Branch:** `develop` (no commit)  
**Date:** 2026-07-23  
**Scope:** Paint 12 combat-relevant mid-late R1 faces (taijutsu mid, stances, ADVANCED, HIDDEN); wire `painted-png`  
**Balance:** No formula / cost / winrate changes  
**Skill DB:** Unchanged (114 skills — no delete)

---

## Summary

| Area | Result |
|------|--------|
| Skill DB size | **114** (unchanged) |
| Manifest entries | **114/114** |
| Painted PNG total | **73** (was 61 after wave5) |
| Wave6 newly painted | **12** combat faces |
| Still imagine-jpg | **41** |
| R1 clan loadout coverage | **35/35** (closed wave3; untouched) |
| tsc `--noEmit` | **Clean** (exit 0) |

---

## 1. Selection rationale (ADVANCED / mid-late R1 combat)

Wave5 residual called out high-visibility leftovers: taijutsu mid (`rising_wind`, `strong_fist`, `sweeping_kick`, `elbow_strike`, stances), ADVANCED (`dragon_flame`, `air_bullet`, `fang_over_fang`), HIDDEN/clan (`ice_mirrors`, `shadow_possession`). All wave6 picks are combat-visible mid-late R1 (scroll loot floors ~4+, merchant/treasure ADVANCED, Haku `ice_mirrors`, Nara bind).

### Wave6 painted faces (12)

| skill id | name | tier | el | action | why mid-late R1 | file | quality |
|----------|------|------|----|--------|-----------------|------|---------|
| `rising_wind` | Leaf Rising Wind | BASIC | PHYSICAL | MAIN | Taijutsu mid kick setup | `/assets/skill_rising_wind.png` | painted-png |
| `strong_fist` | Strong Fist Combo | BASIC | PHYSICAL | MAIN | Dual-hit taijutsu staple | `/assets/skill_strong_fist.png` | painted-png |
| `sweeping_kick` | Sweeping Kick | BASIC | PHYSICAL | MAIN | Stun low-sweep MAIN | `/assets/skill_sweeping_kick.png` | painted-png |
| `elbow_strike` | Elbow Strike | BASIC | PHYSICAL | MAIN | Piercing close-range | `/assets/skill_elbow_strike.png` | painted-png |
| `focused_stance` | Focused Stance | BASIC | PHYSICAL | TOGGLE | ACC/crit stance plate | `/assets/skill_focused_stance.png` | painted-png |
| `defensive_posture` | Defensive Posture | BASIC | PHYSICAL | TOGGLE | Guard stance plate | `/assets/skill_defensive_posture.png` | painted-png |
| `aggressive_stance` | Aggressive Stance | BASIC | PHYSICAL | TOGGLE | Offense stance plate | `/assets/skill_aggressive_stance.png` | painted-png |
| `dragon_flame` | Dragon Flame Bomb | ADVANCED | FIRE | MAIN | Big fire burn MAIN | `/assets/skill_dragon_flame.png` | painted-png |
| `air_bullet` | Air Bullet | ADVANCED | WIND | MAIN | Wind DEF shred projectile | `/assets/skill_air_bullet.png` | painted-png |
| `fang_over_fang` | Fang Over Fang | ADVANCED | PHYSICAL | MAIN | Dual-rotation clan hit | `/assets/skill_fang_over_fang.png` | painted-png |
| `shadow_possession` | Shadow Possession | ADVANCED | MENTAL | MAIN | Nara bind / stun face | `/assets/skill_shadow_possession.png` | painted-png |
| `ice_mirrors` | Demonic Ice Mirrors | HIDDEN | WATER | MAIN | R1 Haku signature | `/assets/skill_ice_mirrors.png` | painted-png |

**Art style:** square pixel skill emblems, void black bg, element-coded glows (green taijutsu arcs, cyan pierce, blue shield, red aggro, fire dragon, wind cyan, amber fang spiral, purple shadow, ice cyan dome) — matches wave1–5 plates.

---

## 2. Full painted set (73 = wave1…wave6)

### Wave1 (8)
`basic_atk` → skill_taijutsu.png · `shuriken` · `fireball` · `gentle_fist` · `primary_lotus` · `shadow_clone` → skill_shadow_clones.png · `chidori` · `mind_destruction` → skill_mind_body_disturbing.png

### Wave2 (12)
`rasengan` · `basic_medical` · `shunshin` · `phoenix_flower` · `sharingan_2` · `64_palms` · `kaiten` · `byakugan` · `leaf_whirlwind` · `dynamic_entry` · `mind_transfer` · `hell_viewing`

### Wave3 (17)
`bunshin` · `brace` · `analyze` · `precision` · `taijutsu_training` · `chakra_reserves` · `wire_setup` · `smoke_bomb` · `sharingan_predict` · `fire_affinity` · `air_palm` · `byakugan_scan` · `dancing_leaf` · `focused_breathing` · `iron_body` · `kai` · `mental_fortitude`

### Wave4 (12)
`mud_wall` · `kawarimi` · `henge` · `explosive_tag` · `water_prison` · `suijinheki` · `hidden_mist` · `water_clone` · `lightning_ball` · `earth_decapitation` · `great_breakthrough` · `water_dragon`

### Wave5 (12)
`kunai_slash` · `kunai_throw` · `shuriken_barrage` · `windmill_shuriken` · `senbon` · `senbon_rain` · `explosive_barrage` · `sword_slash` · `iaido` · `poison_coat` · `flash_bomb` · `cloak_invis`

### Wave6 (12) — this pass
`rising_wind` · `strong_fist` · `sweeping_kick` · `elbow_strike` · `focused_stance` · `defensive_posture` · `aggressive_stance` · `dragon_flame` · `air_bullet` · `fang_over_fang` · `shadow_possession` · `ice_mirrors`

On-disk: all 73 under `public/assets/skill_*.png` **and** mirrored to root `assets/skill_*.png`.

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
`ART_BACKLOG_NOTES.T020_skills` updated: 73 painted faces; ~41 remain imagine-jpg.

### Assets added (×2 mirrors)
```
public/assets/skill_rising_wind.png
public/assets/skill_strong_fist.png
public/assets/skill_sweeping_kick.png
public/assets/skill_elbow_strike.png
public/assets/skill_focused_stance.png
public/assets/skill_defensive_posture.png
public/assets/skill_aggressive_stance.png
public/assets/skill_dragon_flame.png
public/assets/skill_air_bullet.png
public/assets/skill_fang_over_fang.png
public/assets/skill_shadow_possession.png
public/assets/skill_ice_mirrors.png
```
(+ identical copies under root `assets/`)

---

## 4. Totals rollup

| Metric | Wave1 | Wave2 | Wave3 | Wave4 | Wave5 | Wave6 | **Now** |
|--------|-------|-------|-------|-------|-------|-------|---------|
| Newly painted this wave | 8 | 12 | 17 | 12 | 12 | **12** | — |
| Cumulative painted PNG | 8 | 20 | 37 | 49 | 61 | **73** | **73** |
| Remaining imagine-jpg | 106 | 94 | 77 | 65 | 53 | **41** | **41** |
| R1 loadout unique painted | partial | 18/35 | **35/35** | 35/35 | 35/35 | 35/35 | **full** |
| Skill DB | 114 | 114 | 114 | 114 | 114 | 114 | 114 |

**Painted vs jpg residual:** 73 painted PNG · 41 imagine-jpg · 114 total.

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
| ADVANCED / mid-late R1 combat focus | ✅ taijutsu mid + stances + ADVANCED + HIDDEN ice |

---

## 6. Residual (out of scope / next waves)

- **41** non-painted skills still `imagine-jpg` under `public/assets/icons/skills/`.
- Next high-visibility leftovers: remaining BASIC tools (`feint_strike`, `counter_stance`, passives `weapon_proficiency` / `quick_reflexes`), clan ADVANCED (`bug_swarm`, `expansion`, sand kit), HIDDEN/FORBIDDEN (`chidori_stream`, genjutsu `false_surroundings` / `temple_nirvana`, gates, summons, endgame kekkei).
- Optional: compress large PNG plates if bundle size matters (several wave6 plates >1MB).

---

## 7. Files touched

| Path | Action |
|------|--------|
| `public/assets/skill_rising_wind.png` | **new** painted |
| `public/assets/skill_strong_fist.png` | **new** painted |
| `public/assets/skill_sweeping_kick.png` | **new** painted |
| `public/assets/skill_elbow_strike.png` | **new** painted |
| `public/assets/skill_focused_stance.png` | **new** painted |
| `public/assets/skill_defensive_posture.png` | **new** painted |
| `public/assets/skill_aggressive_stance.png` | **new** painted |
| `public/assets/skill_dragon_flame.png` | **new** painted |
| `public/assets/skill_air_bullet.png` | **new** painted |
| `public/assets/skill_fang_over_fang.png` | **new** painted |
| `public/assets/skill_shadow_possession.png` | **new** painted |
| `public/assets/skill_ice_mirrors.png` | **new** painted |
| `assets/skill_*.png` (12 mirrors) | **new** painted |
| `src/game/constants/skillArtManifest.ts` | 12 → painted-png |
| `src/game/constants/artRegistry.ts` | backlog note |
| `.agents/swarm-grok/reports/A7b-wave6-skills.md` | this report |

---

## 8. Verification

```text
Manifest painted-png : 73 entries
Manifest imagine-jpg : 41 entries
Entries              : 114
Wave6 disk assets    : 12/12 present (public + root assets)
Skill DB deleted     : none
Balance formulas     : untouched
tsc --noEmit         : exit 0
No git commit
```

**Done.**
