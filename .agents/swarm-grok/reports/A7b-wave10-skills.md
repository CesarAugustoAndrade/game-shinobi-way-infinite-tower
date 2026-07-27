# A7b WAVE10 — Skills / VFX Production Verify

**Agent:** A7b WAVE10 (SKILLS/VFX production verify)  
**Branch:** `develop` (no commit)  
**Date:** 2026-07-23  
**Scope:** Audit painted skill paths on disk; light VFX residual **only if broken**; hold endgame art  
**Balance:** No formula / cost / winrate changes  
**Skill DB:** Unchanged (114 skills — no delete)  
**Art:** **No new endgame paint** (21 imagine-jpg held)

---

## Summary

| Area | Result |
|------|--------|
| Skill DB size | **114** (unchanged; matches manifest 1:1) |
| Manifest entries | **114/114** |
| Painted PNG total | **93** (unchanged from WAVE8/9) |
| Wave10 newly painted | **0** (endgame skipped; no missing painted files) |
| Still imagine-jpg | **21** (endgame / late residual — **not painted**) |
| Painted path audit | **0 missing** `public/` · **0 missing** root `assets/` · **0 orphans** |
| Imagine-jpg disk | **0 missing** under `public/assets/icons/skills/` |
| Public ↔ root mirror | **Perfect parity** (93/93) |
| Light VFX residual | **1 fix** — remove legacy `App.css` float animation race |
| tsc `--noEmit` | **Clean** (exit 0) |

---

## 1. Endgame skip (explicit)

**Do not paint** the remaining 21 imagine-jpg skills. Residual list (unchanged since WAVE8):

| Bucket | ids |
|--------|-----|
| Clan ADVANCED | `bug_swarm`, `expansion`, `sand_burial`, `sand_shield`, `sand_coffin`, `puppet_crow` |
| Curse / gates late | `curse_mark_2`, `curse_surge`, `gate_of_limit` |
| Summons / mid | `summon_manda`, `c4_karura` |
| Endgame HIDDEN / FORBIDDEN | `tsukuyomi`, `reaper_death_seal`, `edo_tensei`, `shukaku_arm`, `rasenshuriken`, `amaterasu`, `kirin`, `shinra_tensei`, `kamui_impact`, `tengai_shinsei` |

Disk check: `public/assets/skill_tsukuyomi.png` (and other endgame ids above) **absent** (correct — no paint this wave).

---

## 2. Painted set audit (93 vs manifest vs disk)

### Manifest quality split

| quality | count |
|---------|-------|
| `painted-png` | **93** |
| `imagine-jpg` | **21** |
| `svg-tile` | **0** |
| **Total** | **114** |

### Disk presence

| Check | Result |
|-------|--------|
| `public/assets/skill_*.png` | **93** |
| root `assets/skill_*.png` | **93** |
| Missing painted `src` under `public/` | **0** |
| Missing painted `src` under root `assets/` | **0** |
| Disk orphans (png not in painted src basenames) | **0** |
| Mirror only-public / only-root | **0 / 0** |
| Tiny / empty plates (&lt;1 KB) | **0** |
| Imagine-jpg files missing | **0** (all 21 + broader icons set present under `public/assets/icons/skills/`) |
| Skill DB id ↔ manifest id | **114/114 match** (0 missing either side) |

### Known aliases (id ≠ `skill_<id>.png`)

| skill id | painted src |
|----------|-------------|
| `basic_atk` | `/assets/skill_taijutsu.png` |
| `shadow_clone` | `/assets/skill_shadow_clones.png` |
| `mind_destruction` | `/assets/skill_mind_body_disturbing.png` |

All three aliases resolve on disk (public + root).

### Cumulative paint rollup

| Metric | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 | W9 | **W10** |
|--------|----|----|----|----|----|----|----|----|----|---------|
| Newly painted | 8 | 12 | 17 | 12 | 12 | 12 | 12 | 8 | 0 | **0** |
| Cumulative painted PNG | 8 | 20 | 37 | 49 | 61 | 73 | 85 | 93 | 93 | **93** |
| Remaining imagine-jpg | 106 | 94 | 77 | 65 | 53 | 41 | 29 | 21 | 21 | **21** |
| Skill DB | 114 | 114 | 114 | 114 | 114 | 114 | 114 | 114 | 114 | **114** |

**Regenerate action:** none — painted set complete vs manifest.

---

## 3. Wiring verify (no balance)

| Path | Status |
|------|--------|
| `skillArtManifest.ts` → `SKILL_ART_MANIFEST` | 114 entries; 93 painted + 21 jpg |
| `artRegistry.ts` loads manifest into `skill:<id>` | ✅ |
| `getSkillArt()` cascade (registry → skill.image → emoji) | ✅ intact |
| SkillCard / Hand / loot / scroll use `getSkillArt` | ✅ |
| FREE_FIRST / cost face (WAVE9) | ✅ still wired (`freeChakra`, `chakraShort`, `hpShort`, `skipFirstSkillCost`) |
| FloatingText dtype/element gate + drift (WAVE9) | ✅ component CSS owns animations post-fix |

---

## 4. Light VFX residual (only broken path)

### Problem (confirmed)

`src/App.css` still declared global:

```css
.floating-text { animation: floatUp 1.2s ease-out forwards; }
.floating-text-crit { animation: critFloat ... }   /* non-BEM; unused by component */
.floating-text-fade { animation: fadeOnly ... }    /* non-BEM; unused by component */
```

`FloatingText.tsx` uses BEM modifiers (`floating-text--crit`, etc.) and `FloatingText.css` keyframes (`floating-text-rise` / `floating-text-crit` / `floating-text-fade`). The base `.floating-text` rule in `App.css` **raced** the component animation depending on CSS injection order (Vite global CSS), so WAVE9 silhouette/rise polish could be silently clobbered by legacy `floatUp`.

### Fix

| File | Change |
|------|--------|
| `src/App.css` | **Deleted** legacy float keyframes + application rules; comment points ownership to `FloatingText.css` |
| `src/game/constants/artRegistry.ts` | Backlog note → WAVE10 verify status |

No SkillCard / Hand / Combat / formula edits. Presentation only.

### WAVE9 residuals re-checked (not reworked)

| Item | Status |
|------|--------|
| Disabled greyscale only on bg (cost chips legible) | OK |
| FREE_FIRST face honesty | OK |
| FloatingText z-index 80, dtype gate, drift | OK after App.css race removed |

---

## 5. Constraints checklist

| Constraint | Status |
|------------|--------|
| Skip endgame skill art (21 jpg) | ✅ held |
| No new paint unless missing painted | ✅ 0 missing → 0 painted |
| Audit painted paths on disk | ✅ 93/93 public + root |
| Light VFX only if broken | ✅ one race fixed |
| No balance | ✅ |
| Skill DB not deleted | ✅ 114 |
| tsc clean | ✅ exit 0 |
| No commit | ✅ |

---

## 6. Files touched

| Path | Action |
|------|--------|
| `src/App.css` | remove legacy floating-text animation race |
| `src/game/constants/artRegistry.ts` | `T020_skills` backlog note WAVE10 |
| `.agents/swarm-grok/reports/A7b-wave10-skills.md` | this report |

**No asset files added, painted, or deleted.**

---

## 7. Verification

```text
Manifest painted-png : 93 entries
Manifest imagine-jpg : 21 entries (endgame held)
Disk skill_*.png     : 93 public + 93 root (parity)
Missing painted      : 0
Orphans              : 0
Skill DB ↔ manifest  : 114/114
Wave10 new art       : 0
VFX residual         : App.css legacy float removed
Skill DB deleted     : none
Balance formulas     : untouched
tsc --noEmit         : exit 0
No git commit
```

**Done.**
