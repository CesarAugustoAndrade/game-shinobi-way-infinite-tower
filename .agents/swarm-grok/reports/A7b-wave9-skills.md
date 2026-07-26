# A7b WAVE9 — Skills / VFX Production Polish (minimal art)

**Agent:** A7b WAVE9 (SKILLS/VFX production polish)  
**Branch:** `develop` (no commit)  
**Date:** 2026-07-23  
**Scope:** Residual VFX/UI only — SkillCard cost legibility, FloatingText polish, painted-path audit  
**Balance:** No formula / cost / winrate changes  
**Skill DB:** Unchanged (114 skills — no delete)  
**Art:** **No new endgame paint** (21 imagine-jpg held, including tsukuyomi etc.)

---

## Summary

| Area | Result |
|------|--------|
| Skill DB size | **114** (unchanged) |
| Manifest entries | **114/114** |
| Painted PNG total | **93** (unchanged from WAVE8) |
| Wave9 newly painted | **0** (endgame skipped; no missing painted files) |
| Still imagine-jpg | **21** (all endgame / late residual — **not painted**) |
| Painted path audit | **0 missing** public · **0 missing** root `assets/` |
| SkillCard cost legibility | **Fixed** (disabled greyscale + FREE_FIRST honesty) |
| FloatingText | **Polished** (silhouette, drift, dtype gate) |
| tsc `--noEmit` | **Clean** (exit 0) |

---

## 1. Endgame skip (explicit)

**Do not paint** the remaining 21 imagine-jpg skills. Confirmed residual list (unchanged from WAVE8):

| Bucket | ids |
|--------|-----|
| Clan ADVANCED | `bug_swarm`, `expansion`, `sand_burial`, `sand_shield`, `sand_coffin`, `puppet_crow` |
| Curse / gates late | `curse_mark_2`, `curse_surge`, `gate_of_limit` |
| Summons / mid | `summon_manda`, `c4_karura` |
| Endgame HIDDEN / FORBIDDEN | `tsukuyomi`, `reaper_death_seal`, `edo_tensei`, `shukaku_arm`, `rasenshuriken`, `amaterasu`, `kirin`, `shinra_tensei`, `kamui_impact`, `tengai_shinsei` |

Disk check: `public/assets/skill_tsukuyomi.png` **absent** (correct).

---

## 2. Painted set audit (93 vs manifest)

| Check | Result |
|-------|--------|
| Manifest `quality: painted-png` | **93** |
| Manifest `quality: imagine-jpg` | **21** |
| `public/assets/skill_*.png` on disk | **93** |
| Missing painted src under `public/` | **0** |
| Missing painted src under root `assets/` | **0** |
| Disk orphans (png not in painted src names) | **0** |
| Known aliases (id ≠ filename) | `basic_atk` → `skill_taijutsu.png` · `shadow_clone` → `skill_shadow_clones.png` · `mind_destruction` → `skill_mind_body_disturbing.png` |
| Imagine-jpg files missing | **0** |

**Regenerate action:** none required — painted set complete vs manifest.

### Cumulative paint rollup

| Metric | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 | **W9** |
|--------|----|----|----|----|----|----|----|----|--------|
| Newly painted | 8 | 12 | 17 | 12 | 12 | 12 | 12 | 8 | **0** |
| Cumulative painted PNG | 8 | 20 | 37 | 49 | 61 | 73 | 85 | 93 | **93** |
| Remaining imagine-jpg | 106 | 94 | 77 | 65 | 53 | 41 | 29 | 21 | **21** |
| Skill DB | 114 | 114 | 114 | 114 | 114 | 114 | 114 | 114 | **114** |

---

## 3. SkillCard cost legibility (WAVE9 residual)

### Problem (confirmed)

1. **Disabled greyscale covered costs** — `.skill-card--disabled` applied `filter: grayscale` + `opacity: 0.78` to the **whole card**, and the void `::after` scrim sat at **z-index 40** above content (**z 20**), so AP/CP chips were dimmed/washed on unplayable cards (the moment cost honesty matters most).
2. **FREE_FIRST_SKILL not on face** — combat logic waived CP, but SkillCard still showed base chakra cost (dishonest toll).
3. Busy painted emblems could still compete with cost numerals (plate contrast residual).

### Fixes

| File | Change |
|------|--------|
| `SkillCard.css` | Disabled filter/opacity moved to **bg only**; scrim z **15** (below content); cost plates thicker, solid void, slightly larger nums; waived / short states |
| `SkillCard.tsx` | Props: `freeChakra`, `chakraShort`, `hpShort`; FREE_FIRST shows struck base CP + **FREE**; HP short chip |
| `Hand.tsx` | `skipFirstSkillCost` prop; computes short/waived; tooltip Toll line honesty |
| `Combat.tsx` | Passes `skipFirstSkillCost` into `Hand` |

Pure presentation — no combat math / cost formula changes.

---

## 4. FloatingText residual polish

| File | Change |
|------|--------|
| `FloatingText.tsx` | Stable id-based horizontal drift (multi-float de-stack); dtype/element classes only on `damage` / `crit` (status/heal keep their type tint) |
| `FloatingText.css` | z-index **80**; harder CRT silhouette; heal/block glow; status rise slightly longer so DoT does not compete with hits |

Wiring from `useCombat` (skill/enemy damageType + element) left intact.

---

## 5. Constraints checklist

| Constraint | Status |
|------------|--------|
| Skip endgame skill art | ✅ 21 held imagine-jpg |
| No new paint unless missing painted | ✅ 0 missing → 0 painted |
| SkillCard cost legibility | ✅ |
| FloatingText residual | ✅ |
| Broken painted path fix | ✅ none broken |
| No balance | ✅ |
| Skill DB not deleted | ✅ 114 |
| tsc clean | ✅ exit 0 |
| No commit | ✅ |

---

## 6. Files touched

| Path | Action |
|------|--------|
| `src/components/combat/SkillCard.tsx` | freeChakra / short cost face states |
| `src/components/combat/SkillCard.css` | disabled scrim + cost plate legibility |
| `src/components/combat/Hand.tsx` | skipFirstSkillCost + short signals |
| `src/scenes/combat/Combat.tsx` | wire skipFirstSkillCost → Hand |
| `src/components/combat/FloatingText.tsx` | drift + dtype gate |
| `src/components/combat/FloatingText.css` | silhouette / z-index / status |
| `src/game/constants/artRegistry.ts` | backlog note WAVE9 |
| `.agents/swarm-grok/reports/A7b-wave9-skills.md` | this report |

**No asset files added or modified.**

---

## 7. Verification

```text
Manifest painted-png : 93 entries
Manifest imagine-jpg : 21 entries (endgame held)
Disk skill_*.png     : 93 (public + root mirror)
Missing painted      : 0
Wave9 new art        : 0
Skill DB deleted     : none
Balance formulas     : untouched
tsc --noEmit         : exit 0
No git commit
```

**Done.**
