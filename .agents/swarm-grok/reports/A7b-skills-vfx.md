# A7b — Skills & VFX Report

**Agent:** A7b (SKILLS & VFX)  
**Branch:** `develop` (no commit)  
**Date:** 2026-07-23  
**Scope:** R1 skill art wiring, SkillCard face presentation, FloatingText damage-type VFX  
**tsc:** clean (`npx tsc --noEmit`)

---

## Summary

| Area | Result |
|------|--------|
| Skill DB size | **114** skills (unchanged — no mass delete) |
| Manifest coverage | **114/114** ids have `src` + on-disk asset |
| Painted PNG wired | **8** signature faces (was Imagine-jpg only) |
| Clan R1 loadouts | All start skills art-backed |
| SkillCard | Element tint, AP/CP cost stack, True dmg, effect chips |
| FloatingText | Damage-type + element classes; wired from combat spawn |
| Balance | No formula / cost / winrate changes |

---

## 1. R1 primary skill set (~quality focus)

Clan start loadouts (`CLAN_START_LOADOUT` in `src/game/constants/index.ts`) define the R1-reachable core. Unique playable ids across all five clans:

### Shared / academy
| id | name | element | art quality |
|----|------|---------|-------------|
| `basic_atk` | Taijutsu | Physical | **painted-png** |
| `shuriken` | Shuriken | Physical | **painted-png** |
| `bunshin` | Clone Technique | Mental | imagine-jpg |
| `brace` | Brace | Physical | imagine-jpg |
| `analyze` | Analyze Enemy | Mental | imagine-jpg |
| `precision` | Precision | Physical | imagine-jpg |
| `taijutsu_training` | Taijutsu Training | Physical | imagine-jpg |

### Uzumaki
| id | name | element | art |
|----|------|---------|-----|
| `rasengan` | Rasengan | Wind | imagine-jpg |
| `basic_medical` | Basic Medical Jutsu | Physical | imagine-jpg |
| `shunshin` | Body Flicker | Physical | imagine-jpg |
| `shadow_clone` | Shadow Clone Jutsu | Physical | **painted-png** |
| `chakra_reserves` | Chakra Reserves | Physical | imagine-jpg |

### Uchiha
| id | name | element | art |
|----|------|---------|-----|
| `fireball` | Fireball Jutsu | Fire | **painted-png** |
| `phoenix_flower` | Phoenix Flower | Fire | imagine-jpg |
| `wire_setup` | Wire Trap Setup | Physical | imagine-jpg |
| `smoke_bomb` | Smoke Bomb | Physical | imagine-jpg |
| `sharingan_predict` | Sharingan: Predict | Mental | imagine-jpg |
| `sharingan_2` | Sharingan (2-Tomoe) | Fire | imagine-jpg |
| `fire_affinity` | Fire Affinity | Fire | imagine-jpg |

### Hyuga
| id | name | element | art |
|----|------|---------|-----|
| `gentle_fist` | Gentle Fist | Physical | **painted-png** |
| `64_palms` | 8 Trigrams 64 Palms | Physical | imagine-jpg |
| `air_palm` | Air Palm | Wind | imagine-jpg |
| `kaiten` | 8 Trigrams Rotation | Physical | imagine-jpg |
| `byakugan_scan` | Tenketsu Scan | Mental | imagine-jpg |
| `byakugan` | Byakugan | Physical | imagine-jpg |

### Lee
| id | name | element | art |
|----|------|---------|-----|
| `leaf_whirlwind` | Leaf Whirlwind | Physical | imagine-jpg |
| `dynamic_entry` | Dynamic Entry | Physical | imagine-jpg |
| `primary_lotus` | Primary Lotus | Physical | **painted-png** |
| `dancing_leaf` | Shadow of Dancing Leaf | Physical | imagine-jpg |
| `focused_breathing` | Focused Breathing | Physical | imagine-jpg |
| `iron_body` | Iron Body | Physical | imagine-jpg |

### Yamanaka
| id | name | element | art |
|----|------|---------|-----|
| `mind_transfer` | Mind Transfer Jutsu | Mental | imagine-jpg |
| `hell_viewing` | Hell Viewing Technique | Mental | imagine-jpg |
| `kai` | Release | Mental | imagine-jpg |
| `mental_fortitude` | Mental Fortitude | Mental | imagine-jpg |

**Also painted (loot / clan legacy):** `chidori`, `mind_destruction`.

**~20 quality faces that matter most for R1 hand feel:**  
`basic_atk`, `shuriken`, `fireball`, `gentle_fist`, `primary_lotus`, `shadow_clone`, `rasengan`, `phoenix_flower`, `leaf_whirlwind`, `dynamic_entry`, `air_palm`, `64_palms`, `mind_transfer`, `hell_viewing`, `sharingan_2`, `byakugan`, `kaiten`, `brace`, `bunshin`, `chidori`.

---

## 2. Art wiring changes

### File: `src/game/constants/skillArtManifest.ts`
Upgraded 8 entries from `/assets/icons/skills/*.jpg` (`imagine-jpg`) → painted plates:

| skill id | new src | quality |
|----------|---------|---------|
| `basic_atk` | `/assets/skill_taijutsu.png` | painted-png |
| `shuriken` | `/assets/skill_shuriken.png` | painted-png |
| `fireball` | `/assets/skill_fireball.png` | painted-png |
| `gentle_fist` | `/assets/skill_gentle_fist.png` | painted-png |
| `primary_lotus` | `/assets/skill_primary_lotus.png` | painted-png |
| `shadow_clone` | `/assets/skill_shadow_clones.png` | painted-png |
| `chidori` | `/assets/skill_chidori.png` | painted-png |
| `mind_destruction` | `/assets/skill_mind_body_disturbing.png` | painted-png |

`getSkillArt()` cascade unchanged: registry → `skill.image` → emoji.  
Full DB retained; dead/high-tier skills stay art-backed via Imagine jpgs (no delete).

### Audit result
- Skills in DB: **114**
- Manifest entries: **114**
- Missing ids: **none**
- Extra ids: **none**
- On-disk: all R1 + painted paths exist under `public/assets/`

---

## 3. SkillCard / Hand presentation

### Files
- `src/components/combat/SkillCard.tsx`
- `src/components/combat/SkillCard.css`
- `src/components/combat/Hand.css` (minor grid stability)

### Changes
1. **Face art** — registry art, emoji cascade on 404; painted faces preferred for signatures.
2. **Elemental tint** — `skill-card--el-{fire|water|lightning|earth|wind|mental|physical}` border + wash overlay (StS readability). Does not obscure AP/CP badges.
3. **Cost legibility first**
   - Cost stack: **AP** (rust gold) + **CP** (cool blue) as paired chips
   - Larger numeral (`0.8rem`) + unit label (`AP` / `CP`)
   - FREE chip for 0 CP
4. **Damage channel colors** — Physical / Elemental / Mental / **True** on type tag + DMG number
5. **Trade-off preview**
   - HP cost (`−N HP`)
   - Toggle upkeep (`N CP/t`)
   - Primary effect chip (icon + short label) for status/setup skills
6. Card height **7.5rem** for cost stack room
7. `data-element` / `data-damage-type` attributes for QA / styling hooks

Pure presentation only — no combat math changes.

---

## 4. FloatingText / combat VFX

### Files
- `src/components/combat/FloatingText.tsx`
- `src/components/combat/FloatingText.css`
- `src/scenes/combat/Combat.tsx` (`FloatingTextOptions`, spawn API)
- `src/hooks/useCombat.ts` (passes skill/enemy damage channel)

### Changes
1. Extended spawn API:
   ```ts
   spawnFloatingText(target, text, type, options?: { damageType?, element? })
   ```
2. Float classes:
   - Type: `floating-text--{damage|crit|heal|miss|block|status|chakra}`
   - Channel: `floating-text--dtype-{physical|elemental|mental|true}`
   - Element glow: `floating-text--el-{fire|water|…}`
3. Player hits → skill.damageType + skill.element  
4. Enemy hits → intended skill / first skill channel + element  
5. DoT ticks → `status` tint (not flat red damage)  
6. Keeps seinen-sublime base typography; damage-type recolor layered on top  
7. Does **not** hide AP pips, posture, or enemy telegraph (floats are hit feedback only)

---

## 5. What was deliberately not done

| Item | Reason |
|------|--------|
| Mass skill DB prune | Mission: keep DB; quality-focus R1 set |
| Balance / chakra / AP re-cost | Outside VFX scope; would skew winrate |
| New painted art for all 20 R1 faces | 8 painted plates already on disk; 106 Imagine tiles cover rest |
| image_gen batch | Existing assets sufficient for R1 completeness; optional backlog below |

---

## 6. Follow-ups (optional, not blocking)

1. **Painted upgrades** for high-use non-painted R1 faces: `rasengan`, `leaf_whirlwind`, `dynamic_entry`, `mind_transfer`, `air_palm`, `phoenix_flower`, `64_palms`, `sharingan_2`.
2. Sync `todos/skill-art-manifest.json` if generation scripts still read that file (runtime uses TS manifest).
3. Loot / ScrollDiscovery skill cards could reuse `SkillCard` face patterns for consistency.
4. Consider HP-cost skills flashing cost chip red on insufficient HP (UI only).

---

## 7. Files touched

| Path | Action |
|------|--------|
| `src/game/constants/skillArtManifest.ts` | Painted src for 8 signatures |
| `src/game/constants/artRegistry.ts` | ART_BACKLOG_NOTES note |
| `src/components/combat/SkillCard.tsx` | Element tint, cost stack, effect chip |
| `src/components/combat/SkillCard.css` | Element washes, cost/dmg/effect styles |
| `src/components/combat/Hand.css` | Grid min-width stability |
| `src/components/combat/FloatingText.tsx` | damageType/element props |
| `src/components/combat/FloatingText.css` | dtype + element classes |
| `src/scenes/combat/Combat.tsx` | Spawn options + pass-through |
| `src/hooks/useCombat.ts` | Wire skill/enemy channel into floats |
| `.agents/swarm-grok/reports/A7b-skills-vfx.md` | This report |

---

## 8. Verification

```text
npx tsc --noEmit   → exit 0
Painted files      → all 8 public/assets/skill_*.png present
Manifest paint map → verified via node audit
```

**No git commit** (per mission).
