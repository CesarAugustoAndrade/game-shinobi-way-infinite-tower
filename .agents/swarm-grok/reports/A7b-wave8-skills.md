# A7b WAVE8 — Skills Residual Report (R1 enemy/boss kit residual)

**Agent:** A7b WAVE8 (SKILLS residual — R1 enemy/boss kits only)  
**Branch:** `develop` (no commit)  
**Date:** 2026-07-23  
**Scope:** Paint 8 remaining R1-relevant combat faces from residual imagine-jpg list (enemy kits / ambush signatures / early-mid drops); wire `painted-png`  
**Balance:** No formula / cost / winrate changes  
**Skill DB:** Unchanged (114 skills — no delete)

---

## Summary

| Area | Result |
|------|--------|
| Skill DB size | **114** (unchanged) |
| Manifest entries | **114/114** |
| Painted PNG total | **93** (was 85 after wave7) |
| Wave8 newly painted | **8** combat faces |
| Still imagine-jpg | **21** |
| R1 clan loadout coverage | **35/35** (closed wave3; untouched) |
| tsc `--noEmit` | **Clean** (exit 0) |

---

## 1. Selection rationale (R1 enemy kits / ambush / early residual)

Wave7 left **29** imagine-jpg. Brief priority: `demon_slash`, `poison_fog`, `bone_drill`, `gate_prep` (`killing_intent` already painted wave7). Grep of `EnemySystem` / `BOSS_BY_ARC` / `AMBUSH_ENEMIES` confirmed:

| Skill | R1 / combat visibility |
|-------|------------------------|
| `demon_slash` | WAVES danger 1 Demon Brothers; Zabuza kit push; Gato + Elite Guard d6–7; ambush Zabuza; Bandit Captain fallback |
| `poison_fog` | Ambush Hanzo; early event grant path; EXAMS Orochimaru signature (high-visibility residual) |
| `bone_drill` | Ambush Kimimaro; default danger-5 / ROGUE Kimimaro signature |
| `gate_prep` | Lee gate continuum utility (FORBIDDEN SIDE) |
| `gate_of_life` | 3rd Gate pair with `gate_prep` (not full endgame `gate_of_limit`) |
| `copy_jutsu` | Mid combat Sharingan face (loot/merchant visible) |
| `curse_mark_1` | Early curse-mark combat face (not stage-2 endgame) |
| `summon_gamabunta` | Mid summon (WATER element); skip `summon_manda` / kekkei endgame |

**Explicitly skipped (endgame grind):** `tsukuyomi`, `amaterasu`, `kirin`, `shinra_tensei`, `kamui_impact`, `tengai_shinsei`, `rasenshuriken`, `edo_tensei`, `reaper_death_seal`, `shukaku_arm`, sand clan kit, etc.

Water skill plates (suijinheki, water_dragon, water_prison, water_clone, hidden_mist, ice_mirrors, water_vortex) were already painted in waves 4–7.

### Wave8 painted faces (8)

| skill id | name | tier / el | action | why R1 residual | file | quality |
|----------|------|-----------|--------|-----------------|------|---------|
| `demon_slash` | Demon Slash | FORBIDDEN / PHYSICAL | MAIN | Zabuza/Gato/Demon Brothers kit | `/assets/skill_demon_slash.png` | painted-png |
| `poison_fog` | Ibuse Poison Fog | FORBIDDEN / FIRE | MAIN | Ambush + event-visible poison MAIN | `/assets/skill_poison_fog.png` | painted-png |
| `bone_drill` | Dance of Clematis | FORBIDDEN / PHYSICAL | MAIN | Ambush Kimimaro TRUE drill | `/assets/skill_bone_drill.png` | painted-png |
| `gate_prep` | Gate Release Prep | FORBIDDEN / PHYSICAL | SIDE | Lee gate prep SIDE | `/assets/skill_gate_prep.png` | painted-png |
| `gate_of_life` | Gate of Life (3rd Gate) | FORBIDDEN / PHYSICAL | TOGGLE | Gate continuum (not 5th/end) | `/assets/skill_gate_of_life.png` | painted-png |
| `copy_jutsu` | Sharingan: Copy | HIDDEN / PHYSICAL | MAIN | Mid copy utility face | `/assets/skill_copy_jutsu.png` | painted-png |
| `curse_mark_1` | Curse Mark Stage 1 | HIDDEN / PHYSICAL | TOGGLE | Early curse seal face | `/assets/skill_curse_mark_1.png` | painted-png |
| `summon_gamabunta` | Summoning: Gamabunta | HIDDEN / WATER | MAIN | Mid toad summon (not manda) | `/assets/skill_summon_gamabunta.png` | painted-png |

**Art style:** square pixel skill emblems, void black bg, element-coded glows (crimson executioner cleaver, toxic green skull fog, ivory bone drill, emerald gate fist/torii, red tomoe copy rings, purple curse seal vines, amber toad boss) — matches wave1–7 plates.

---

## 2. Full painted set (93 = wave1…wave8)

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

### Wave6 (12)
`rising_wind` · `strong_fist` · `sweeping_kick` · `elbow_strike` · `focused_stance` · `defensive_posture` · `aggressive_stance` · `dragon_flame` · `air_bullet` · `fang_over_fang` · `shadow_possession` · `ice_mirrors`

### Wave7 (12)
`feint_strike` · `counter_stance` · `water_vortex` · `false_surroundings` · `temple_nirvana` · `clone_explosion` · `killing_intent` · `chidori_stream` · `weapon_proficiency` · `quick_reflexes` · `hidden_lotus` · `1000_years`

### Wave8 (8) — this pass
`demon_slash` · `poison_fog` · `bone_drill` · `gate_prep` · `gate_of_life` · `copy_jutsu` · `curse_mark_1` · `summon_gamabunta`

On-disk: all 93 under `public/assets/skill_*.png` **and** mirrored to root `assets/skill_*.png`.

---

## 3. Wiring changes

### `src/game/constants/skillArtManifest.ts`
8 entries upgraded:

```
src: /assets/icons/skills/<id>.jpg  + quality: imagine-jpg
  →  /assets/skill_<id>.png         + quality: painted-png
```

Cascade unchanged: `getSkillArt()` → registry → `skill.image` → emoji.

### `src/game/constants/artRegistry.ts`
`ART_BACKLOG_NOTES.T020_skills` updated: 93 painted faces; ~21 remain imagine-jpg.

### Assets added (×2 mirrors)
```
public/assets/skill_demon_slash.png
public/assets/skill_poison_fog.png
public/assets/skill_bone_drill.png
public/assets/skill_gate_prep.png
public/assets/skill_gate_of_life.png
public/assets/skill_copy_jutsu.png
public/assets/skill_curse_mark_1.png
public/assets/skill_summon_gamabunta.png
```
(+ identical copies under root `assets/`)

---

## 4. Totals rollup

| Metric | Wave1 | Wave2 | Wave3 | Wave4 | Wave5 | Wave6 | Wave7 | Wave8 | **Now** |
|--------|-------|-------|-------|-------|-------|-------|-------|-------|---------|
| Newly painted this wave | 8 | 12 | 17 | 12 | 12 | 12 | 12 | **8** | — |
| Cumulative painted PNG | 8 | 20 | 37 | 49 | 61 | 73 | 85 | **93** | **93** |
| Remaining imagine-jpg | 106 | 94 | 77 | 65 | 53 | 41 | 29 | **21** | **21** |
| R1 loadout unique painted | partial | 18/35 | **35/35** | 35/35 | 35/35 | 35/35 | 35/35 | 35/35 | **full** |
| Skill DB | 114 | 114 | 114 | 114 | 114 | 114 | 114 | 114 | 114 |

**Painted vs jpg residual:** 93 painted PNG · 21 imagine-jpg · 114 total.

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
| R1 enemy kit residual focus | ✅ demon_slash / ambush trio + gates / mid faces |
| No endgame grind | ✅ skipped tsukuyomi/amaterasu/kirin/etc. |

---

## 6. Residual (out of scope / next waves)

- **21** non-painted skills still `imagine-jpg` under `public/assets/icons/skills/`:
  - Clan ADVANCED: `bug_swarm`, `expansion`, `sand_burial`, `sand_shield`, `sand_coffin`, `puppet_crow`
  - Curse / gates late: `curse_mark_2`, `curse_surge`, `gate_of_limit`
  - Summons / mid: `summon_manda`, `c4_karura`
  - Endgame / HIDDEN / FORBIDDEN: `tsukuyomi`, `reaper_death_seal`, `edo_tensei`, `shukaku_arm`, `rasenshuriken`, `amaterasu`, `kirin`, `shinra_tensei`, `kamui_impact`, `tengai_shinsei`
- Optional next residual (if another skills wave): sand kit for EXAMS bosses, `curse_mark_2` / `curse_surge` for ROGUE, `gate_of_limit` for late Lee — still avoid pure endgame kekkei unless requested.
- Optional: compress large PNG plates if bundle size matters (several plates >0.5MB).

---

## 7. Files touched

| Path | Action |
|------|--------|
| `public/assets/skill_demon_slash.png` | **new** painted |
| `public/assets/skill_poison_fog.png` | **new** painted |
| `public/assets/skill_bone_drill.png` | **new** painted |
| `public/assets/skill_gate_prep.png` | **new** painted |
| `public/assets/skill_gate_of_life.png` | **new** painted |
| `public/assets/skill_copy_jutsu.png` | **new** painted |
| `public/assets/skill_curse_mark_1.png` | **new** painted |
| `public/assets/skill_summon_gamabunta.png` | **new** painted |
| `assets/skill_*.png` (8 mirrors) | **new** painted |
| `src/game/constants/skillArtManifest.ts` | 8 → painted-png |
| `src/game/constants/artRegistry.ts` | backlog note |
| `.agents/swarm-grok/reports/A7b-wave8-skills.md` | this report |

---

## 8. Verification

```text
Manifest painted-png : 93 entries
Manifest imagine-jpg : 21 entries
Entries              : 114
Wave8 disk assets    : 8/8 present (public + root assets)
Skill DB deleted     : none
Balance formulas     : untouched
tsc --noEmit         : exit 0
No git commit
```

**Done.**
