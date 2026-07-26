# A7b WAVE7 — Skills Residual Report (mid-tier residual paint batch)

**Agent:** A7b WAVE7 (SKILLS residual — preferred mid-tier faces)  
**Branch:** `develop` (no commit)  
**Date:** 2026-07-23  
**Scope:** Paint 12 remaining R1-relevant combat faces from residual imagine-jpg list; wire `painted-png`  
**Balance:** No formula / cost / winrate changes  
**Skill DB:** Unchanged (114 skills — no delete)

---

## Summary

| Area | Result |
|------|--------|
| Skill DB size | **114** (unchanged) |
| Manifest entries | **114/114** |
| Painted PNG total | **85** (was 73 after wave6) |
| Wave7 newly painted | **12** combat faces |
| Still imagine-jpg | **29** |
| R1 clan loadout coverage | **35/35** (closed wave3; untouched) |
| tsc `--noEmit` | **Clean** (exit 0) |

---

## 1. Selection rationale (preferred residual list)

Wave6 residual called out BASIC tools (`feint_strike`, `counter_stance`), passives (`weapon_proficiency`, `quick_reflexes`), clan ADVANCED / genjutsu / HIDDEN leftovers. Wave7 paints the full preferred residual set from the agent brief — all were still `imagine-jpg` under `icons/skills/`.

### Wave7 painted faces (12)

| skill id | name | tier / el | action | why mid-tier residual | file | quality |
|----------|------|-----------|--------|----------------------|------|---------|
| `feint_strike` | Feint Strike | BASIC / PHYSICAL | MAIN | Deceptive taijutsu tool | `/assets/skill_feint_strike.png` | painted-png |
| `counter_stance` | Counter Stance | BASIC / PHYSICAL | MAIN | Reactive guard MAIN | `/assets/skill_counter_stance.png` | painted-png |
| `water_vortex` | Giant Water Vortex | ADVANCED / WATER | MAIN | Big water spiral MAIN | `/assets/skill_water_vortex.png` | painted-png |
| `false_surroundings` | False Surroundings | ADVANCED / MENTAL | MAIN | Terrain-illusion genjutsu | `/assets/skill_false_surroundings.png` | painted-png |
| `temple_nirvana` | Temple of Nirvana | ADVANCED / MENTAL | MAIN | Sleep-petal genjutsu | `/assets/skill_temple_nirvana.png` | painted-png |
| `clone_explosion` | Clone Great Explosion | ADVANCED / FIRE | MAIN | Explosive clone sacrifice | `/assets/skill_clone_explosion.png` | painted-png |
| `killing_intent` | Killing Intent | BASIC / MENTAL | SIDE | Intimidation aura SIDE | `/assets/skill_killing_intent.png` | painted-png |
| `chidori_stream` | Chidori Stream | HIDDEN / LIGHTNING | MAIN | AOE lightning stream | `/assets/skill_chidori_stream.png` | painted-png |
| `weapon_proficiency` | Weapon Proficiency | BASIC / PHYSICAL | PASSIVE | Weapon mastery passive | `/assets/skill_weapon_proficiency.png` | painted-png |
| `quick_reflexes` | Quick Reflexes | BASIC / PHYSICAL | PASSIVE | Speed/reaction passive | `/assets/skill_quick_reflexes.png` | painted-png |
| `hidden_lotus` | Hidden Lotus | HIDDEN / PHYSICAL | MAIN | Reverse lotus TRUE dmg | `/assets/skill_hidden_lotus.png` | painted-png |
| `1000_years` | 1000 Years of Death | BASIC / PHYSICAL | MAIN | Classic mid-comedy MAIN | `/assets/skill_1000_years.png` | painted-png |

**Art style:** square pixel skill emblems, void black bg, element-coded glows (green feint afterimage, cyan counter rings, water cyan spiral, purple illusion eye, pink sleep petals, fire explosion, crimson killing aura, blue lightning corona, gold weapon star, lime reflex catch, green reverse lotus, yellow comedy jab) — matches wave1–6 plates.

---

## 2. Full painted set (85 = wave1…wave7)

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

### Wave7 (12) — this pass
`feint_strike` · `counter_stance` · `water_vortex` · `false_surroundings` · `temple_nirvana` · `clone_explosion` · `killing_intent` · `chidori_stream` · `weapon_proficiency` · `quick_reflexes` · `hidden_lotus` · `1000_years`

On-disk: all 85 under `public/assets/skill_*.png` **and** mirrored to root `assets/skill_*.png`.

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
`ART_BACKLOG_NOTES.T020_skills` updated: 85 painted faces; ~29 remain imagine-jpg.

### Assets added (×2 mirrors)
```
public/assets/skill_feint_strike.png
public/assets/skill_counter_stance.png
public/assets/skill_water_vortex.png
public/assets/skill_false_surroundings.png
public/assets/skill_temple_nirvana.png
public/assets/skill_clone_explosion.png
public/assets/skill_killing_intent.png
public/assets/skill_chidori_stream.png
public/assets/skill_weapon_proficiency.png
public/assets/skill_quick_reflexes.png
public/assets/skill_hidden_lotus.png
public/assets/skill_1000_years.png
```
(+ identical copies under root `assets/`)

---

## 4. Totals rollup

| Metric | Wave1 | Wave2 | Wave3 | Wave4 | Wave5 | Wave6 | Wave7 | **Now** |
|--------|-------|-------|-------|-------|-------|-------|-------|---------|
| Newly painted this wave | 8 | 12 | 17 | 12 | 12 | 12 | **12** | — |
| Cumulative painted PNG | 8 | 20 | 37 | 49 | 61 | 73 | **85** | **85** |
| Remaining imagine-jpg | 106 | 94 | 77 | 65 | 53 | 41 | **29** | **29** |
| R1 loadout unique painted | partial | 18/35 | **35/35** | 35/35 | 35/35 | 35/35 | 35/35 | **full** |
| Skill DB | 114 | 114 | 114 | 114 | 114 | 114 | 114 | 114 |

**Painted vs jpg residual:** 85 painted PNG · 29 imagine-jpg · 114 total.

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
| Preferred residual focus | ✅ full preferred 12 |

---

## 6. Residual (out of scope / next waves)

- **29** non-painted skills still `imagine-jpg` under `public/assets/icons/skills/`:
  - Clan ADVANCED: `bug_swarm`, `expansion`, `sand_burial`, `sand_shield`, `sand_coffin`, `puppet_crow`, `bone_drill`
  - Curse / gates: `curse_mark_1`, `curse_mark_2`, `curse_surge`, `gate_of_life`, `gate_of_limit`, `gate_prep`
  - Summons / mid: `summon_gamabunta`, `summon_manda`, `demon_slash`, `poison_fog`, `copy_jutsu`, `c4_karura`
  - Endgame / HIDDEN / FORBIDDEN: `tsukuyomi`, `reaper_death_seal`, `edo_tensei`, `shukaku_arm`, `rasenshuriken`, `amaterasu`, `kirin`, `shinra_tensei`, `kamui_impact`, `tengai_shinsei`
- Optional: compress large PNG plates if bundle size matters (several plates >0.5MB).

---

## 7. Files touched

| Path | Action |
|------|--------|
| `public/assets/skill_feint_strike.png` | **new** painted |
| `public/assets/skill_counter_stance.png` | **new** painted |
| `public/assets/skill_water_vortex.png` | **new** painted |
| `public/assets/skill_false_surroundings.png` | **new** painted |
| `public/assets/skill_temple_nirvana.png` | **new** painted |
| `public/assets/skill_clone_explosion.png` | **new** painted |
| `public/assets/skill_killing_intent.png` | **new** painted |
| `public/assets/skill_chidori_stream.png` | **new** painted |
| `public/assets/skill_weapon_proficiency.png` | **new** painted |
| `public/assets/skill_quick_reflexes.png` | **new** painted |
| `public/assets/skill_hidden_lotus.png` | **new** painted |
| `public/assets/skill_1000_years.png` | **new** painted |
| `assets/skill_*.png` (12 mirrors) | **new** painted |
| `src/game/constants/skillArtManifest.ts` | 12 → painted-png |
| `src/game/constants/artRegistry.ts` | backlog note |
| `.agents/swarm-grok/reports/A7b-wave7-skills.md` | this report |

---

## 8. Verification

```text
Manifest painted-png : 85 entries
Manifest imagine-jpg : 29 entries
Entries              : 114
Wave7 disk assets    : 12/12 present (public + root assets)
Skill DB deleted     : none
Balance formulas     : untouched
tsc --noEmit         : exit 0
No git commit
```

**Done.**
