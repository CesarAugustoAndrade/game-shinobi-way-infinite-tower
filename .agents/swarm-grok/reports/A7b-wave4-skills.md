# A7b WAVE4 — Skills Residual Report (mid-R1 loot faces + VFX)

**Agent:** A7b WAVE4 (SKILLS residual — mid-tier R1 loot faces + VFX check)  
**Branch:** `develop` (no commit)  
**Date:** 2026-07-23  
**Scope:** Paint ~12 mid-R1 / Waves-biased scroll & loot skill faces; wire `painted-png`; FloatingText VFX sanity  
**Balance:** No formula / cost / winrate changes  
**Skill DB:** Unchanged (114 skills — no delete)

---

## Summary

| Area | Result |
|------|--------|
| Skill DB size | **114** (unchanged) |
| Manifest entries | **114/114** |
| Painted PNG total | **49** (was 37 after wave3) |
| Wave4 newly painted | **12** mid-R1 loot/scroll faces |
| Still imagine-jpg | **65** |
| R1 clan loadout coverage | **35/35** (closed wave3; untouched) |
| FloatingText dtype colors | **Intact** (sanity only) |
| tsc `--noEmit` | **Clean** (exit 0) |

---

## 1. Mid-R1 skill selection rationale

From `LootSystem.generateSkillForFloor` + Waves `lootTheme.primaryElement = WATER`:

| Floor band | Tiers eligible |
|------------|----------------|
| 1–3 | BASIC |
| 4–7 | BASIC + ADVANCED |
| 8–12 | ADVANCED + HIDDEN |

**Waves bias:** `weightedPick` ×1.85 for WATER element skills (scroll discovery + treasure skill grants). Enemy pools also use `WATER_DRAGON` / `WATER_CLONE` (`EnemySystem`).

### Wave4 painted faces (12)

| skill id | name | tier | el | why mid-R1 | file | quality |
|----------|------|------|----|------------|------|---------|
| `mud_wall` | Mud Wall | BASIC | EARTH | Academy utility / early scroll | `/assets/skill_mud_wall.png` | painted-png |
| `kawarimi` | Body Replacement | BASIC | PHYSICAL | Academy trio; high scroll frequency | `/assets/skill_kawarimi.png` | painted-png |
| `henge` | Transformation | BASIC | MENTAL | Academy trio w/ kawarimi/bunshin | `/assets/skill_henge.png` | painted-png |
| `explosive_tag` | Explosive Tag | BASIC | FIRE | Common tool loot mid-Waves | `/assets/skill_explosive_tag.png` | painted-png |
| `water_prison` | Water Prison | ADVANCED | WATER | Waves affinity main CC | `/assets/skill_water_prison.png` | painted-png |
| `suijinheki` | Water Wall | ADVANCED | WATER | Waves affinity defense | `/assets/skill_suijinheki.png` | painted-png |
| `hidden_mist` | Hidden Mist Jutsu | ADVANCED | WATER | Waves signature field control | `/assets/skill_hidden_mist.png` | painted-png |
| `water_clone` | Water Clone Jutsu | ADVANCED | WATER | Waves + enemy skill | `/assets/skill_water_clone.png` | painted-png |
| `lightning_ball` | Lightning Ball | ADVANCED | LIGHTNING | Mid elemental scroll variety | `/assets/skill_lightning_ball.png` | painted-png |
| `earth_decapitation` | Inner Decapitation | ADVANCED | EARTH | Earth mid package w/ mud_wall | `/assets/skill_earth_decapitation.png` | painted-png |
| `great_breakthrough` | Great Breakthrough | ADVANCED | WIND | Common ADVANCED wind scroll | `/assets/skill_great_breakthrough.png` | painted-png |
| `water_dragon` | Water Dragon Jutsu | HIDDEN | WATER | Waves late-mid / enemy signature | `/assets/skill_water_dragon.png` | painted-png |

**Note:** There is no standalone `water_affinity` skill in DB (only `fire_affinity`, already painted wave3). “Water affinity” in mission = WATER-element suite biased by region loot theme.

**Art style:** square cyber-ninja mist emblems, void black bg, element-coded rings (matches wave1–3 plates).

---

## 2. Full painted set (49 = wave1 + wave2 + wave3 + wave4)

### Wave1 (8)
`basic_atk` → skill_taijutsu.png · `shuriken` · `fireball` · `gentle_fist` · `primary_lotus` · `shadow_clone` → skill_shadow_clones.png · `chidori` · `mind_destruction` → skill_mind_body_disturbing.png

### Wave2 (12)
`rasengan` · `basic_medical` · `shunshin` · `phoenix_flower` · `sharingan_2` · `64_palms` · `kaiten` · `byakugan` · `leaf_whirlwind` · `dynamic_entry` · `mind_transfer` · `hell_viewing`

### Wave3 (17)
`bunshin` · `brace` · `analyze` · `precision` · `taijutsu_training` · `chakra_reserves` · `wire_setup` · `smoke_bomb` · `sharingan_predict` · `fire_affinity` · `air_palm` · `byakugan_scan` · `dancing_leaf` · `focused_breathing` · `iron_body` · `kai` · `mental_fortitude`

### Wave4 (12) — this pass
`mud_wall` · `kawarimi` · `henge` · `explosive_tag` · `water_prison` · `suijinheki` · `hidden_mist` · `water_clone` · `lightning_ball` · `earth_decapitation` · `great_breakthrough` · `water_dragon`

On-disk: all 49 under `public/assets/skill_*.png` **and** mirrored to root `assets/skill_*.png`.

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
`ART_BACKLOG_NOTES.T020_skills` updated: 49 painted faces; ~65 remain imagine-jpg.

### Assets added (×2 mirrors)
```
public/assets/skill_mud_wall.png
public/assets/skill_kawarimi.png
public/assets/skill_henge.png
public/assets/skill_explosive_tag.png
public/assets/skill_water_prison.png
public/assets/skill_suijinheki.png
public/assets/skill_hidden_mist.png
public/assets/skill_water_clone.png
public/assets/skill_lightning_ball.png
public/assets/skill_earth_decapitation.png
public/assets/skill_great_breakthrough.png
public/assets/skill_water_dragon.png
```
(+ identical copies under root `assets/`)

---

## 4. VFX sanity — FloatingText damage type colors

Checked only (no code changes required):

| Surface | Status |
|---------|--------|
| `FloatingText.tsx` dtype class map (physical/elemental/mental/true) | Intact |
| `FloatingText.css` `.floating-text--dtype-physical` `#fb923c` | Intact |
| `FloatingText.css` `.floating-text--dtype-elemental` `#c4b5fd` | Intact |
| `FloatingText.css` `.floating-text--dtype-mental` `#d8b4fe` | Intact |
| `FloatingText.css` `.floating-text--dtype-true` `#fef08a` + yellow glow | Intact |
| Crit variants for all 4 dtypes | Intact |
| Element glows fire/water/lightning/earth/wind/mental/physical | Intact (relevant for new water/earth/wind faces) |

No balance, combat math, or SkillCard structural edits this wave.

---

## 5. Totals rollup

| Metric | Wave1 | Wave2 | Wave3 | Wave4 | **Now** |
|--------|-------|-------|-------|-------|---------|
| Newly painted this wave | 8 | 12 | 17 | **12** | — |
| Cumulative painted PNG | 8 | 20 | 37 | **49** | **49** |
| Remaining imagine-jpg | 106 | 94 | 77 | **65** | **65** |
| R1 loadout unique painted | partial | 18/35 | **35/35** | 35/35 | **full** |
| Skill DB | 114 | 114 | 114 | 114 | 114 |

**Painted vs jpg residual:** 49 painted PNG · 65 imagine-jpg · 114 total.

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
| Mid-R1 / Waves focus | ✅ water suite + academy + mid ADVANCED |

---

## 7. Residual (out of scope / next waves)

- **65** non-painted skills still `imagine-jpg` under `public/assets/icons/skills/`.
- High visibility leftovers: tool skills (`flash_bomb`, `senbon`, `kunai_*`), more ADVANCED (`dragon_flame`, `air_bullet`, `fang_over_fang`), HIDDEN (`ice_mirrors`, `shadow_possession`, clan summons).
- Optional: compress large PNG plates (~0.9–1.8 MB each) if bundle size matters.

---

## 8. Files touched

| Path | Action |
|------|--------|
| `public/assets/skill_mud_wall.png` | **new** painted |
| `public/assets/skill_kawarimi.png` | **new** painted |
| `public/assets/skill_henge.png` | **new** painted |
| `public/assets/skill_explosive_tag.png` | **new** painted |
| `public/assets/skill_water_prison.png` | **new** painted |
| `public/assets/skill_suijinheki.png` | **new** painted |
| `public/assets/skill_hidden_mist.png` | **new** painted |
| `public/assets/skill_water_clone.png` | **new** painted |
| `public/assets/skill_lightning_ball.png` | **new** painted |
| `public/assets/skill_earth_decapitation.png` | **new** painted |
| `public/assets/skill_great_breakthrough.png` | **new** painted |
| `public/assets/skill_water_dragon.png` | **new** painted |
| `assets/skill_*.png` (12 mirrors) | **new** painted |
| `src/game/constants/skillArtManifest.ts` | 12 → painted-png |
| `src/game/constants/artRegistry.ts` | backlog note |
| `.agents/swarm-grok/reports/A7b-wave4-skills.md` | this report |

---

## 9. Verification

```text
Manifest painted-png : 49 entries
Manifest imagine-jpg : 65 entries
Entries              : 114
Wave4 disk assets    : 12/12 present (public + root assets)
Skill DB deleted     : none
Balance formulas     : untouched
FloatingText dtypes  : intact (no edits)
tsc --noEmit         : exit 0
No git commit
```

**Done.**
