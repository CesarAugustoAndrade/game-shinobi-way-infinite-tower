# A7b WAVE11 — Skills / VFX Production Smoke

**Agent:** A7b WAVE11 (SKILLS/VFX production smoke)  
**Branch:** `develop` (no commit)  
**Date:** 2026-07-23  
**Scope:** Verify painted skill faces, SkillCard legibility, FloatingText single-owner, R1 loadout art  
**Balance:** No formula / cost / winrate changes  
**Skill DB:** Unchanged (114 skills — no delete)  
**Art:** **No new paint** (21 imagine-jpg held at ceiling)

---

## Summary

| Area | Result |
|------|--------|
| Skill DB size | **114** (unchanged; matches manifest 1:1) |
| Manifest entries | **114/114** |
| Painted PNG total | **93** (unchanged from WAVE8–10) |
| Wave11 newly painted | **0** (verify-only; no missing painted files) |
| Still imagine-jpg | **21** (endgame / late residual — **not painted**) |
| Painted path audit | **0 missing** `public/` · **0 missing** root `assets/` · **0 orphans** |
| Imagine-jpg disk | **0 missing** under `public/assets/icons/skills/` |
| Public ↔ root mirror | **Perfect parity** (93/93) |
| R1 clan start loadout | **35/35 painted** · all `ON_DISK` |
| Core R1 + Waves-relevant | **69/69** resolve art (67 painted + 2 held jpg boss leftovers) |
| SkillCard cost legibility | **OK** (disabled greyscale bg-only; cost stack z25) |
| Hand block reasons | **OK** (`getSkillBlockReason` + face strip) |
| FloatingText dual race | **None** (WAVE10 App.css legacy removal held) |
| Combat feedback | **OK** (`SHOW_FLOATING_TEXT: true`; spawn paths intact) |
| Path/registry bugs fixed | **0** (CLEAN) |
| tsc `--noEmit` | **Clean** (exit 0) |

---

## 1. Endgame hold (explicit)

**Do not paint** the remaining 21 imagine-jpg skills. Residual list (unchanged since WAVE8):

| Bucket | ids |
|--------|-----|
| Clan ADVANCED | `bug_swarm`, `expansion`, `sand_burial`, `sand_shield`, `sand_coffin`, `puppet_crow` |
| Curse / gates late | `curse_mark_2`, `curse_surge`, `gate_of_limit` |
| Summons / mid | `summon_manda`, `c4_karura` |
| Endgame HIDDEN / FORBIDDEN | `tsukuyomi`, `reaper_death_seal`, `edo_tensei`, `shukaku_arm`, `rasenshuriken`, `amaterasu`, `kirin`, `shinra_tensei`, `kamui_impact`, `tengai_shinsei` |

Disk check: `public/assets/skill_tsukuyomi.png` / `skill_amaterasu.png` **absent** (correct). JPG icons present under `public/assets/icons/skills/`.

---

## 2. Painted set audit (93 vs manifest vs disk)

### Manifest quality split (`src/game/constants/skillArtManifest.ts` — source of truth)

| quality | count |
|---------|-------|
| `painted-png` | **93** |
| `imagine-jpg` | **21** |
| `svg-tile` | **0** |
| **Total** | **114** |

Note: `todos/skill-art-manifest.json` is **stale** (generator input residue with old `svg-tile` rows). Runtime loads **only** `skillArtManifest.ts` via `artRegistry.ts`. No runtime impact; do not regenerate paint from the JSON.

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
| Imagine-jpg files missing | **0** (all 21 + broader icons set; 114 jpg under `icons/skills/`) |
| Skill DB id ↔ manifest id | **114/114 match** (0 missing either side) |

### Known aliases (id ≠ `skill_<id>.png`)

| skill id | painted src | disk |
|----------|-------------|------|
| `basic_atk` | `/assets/skill_taijutsu.png` | OK public + root |
| `shadow_clone` | `/assets/skill_shadow_clones.png` | OK |
| `mind_destruction` | `/assets/skill_mind_body_disturbing.png` | OK |
| `kaiten` (ROTATION loadout key) | `/assets/skill_kaiten.png` | OK |
| `sharingan_2` (SHARINGAN_2TOMOE) | `/assets/skill_sharingan_2.png` | OK |
| `64_palms` (SIXTY_FOUR_PALMS) | `/assets/skill_64_palms.png` | OK |

### Cumulative paint rollup

| Metric | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 | W9 | W10 | **W11** |
|--------|----|----|----|----|----|----|----|----|----|-----|---------|
| Newly painted | 8 | 12 | 17 | 12 | 12 | 12 | 12 | 8 | 0 | 0 | **0** |
| Cumulative painted PNG | 8 | 20 | 37 | 49 | 61 | 73 | 85 | 93 | 93 | 93 | **93** |
| Remaining imagine-jpg | 106 | 94 | 77 | 65 | 53 | 41 | 29 | 21 | 21 | 21 | **21** |
| Skill DB | 114 | 114 | 114 | 114 | 114 | 114 | 114 | 114 | 114 | 114 | **114** |

**Regenerate action:** none — painted set complete vs manifest.

---

## 3. R1 loadout + Waves-relevant art (~20 core feel)

### Clan start loadouts (`CLAN_START_LOADOUT` in `src/game/constants/index.ts`)

| Clan | unique skill ids | painted | missing |
|------|------------------|---------|---------|
| UZUMAKI | 8 | 8 | 0 |
| UCHIHA | 9 | 9 | 0 |
| HYUGA | 9 | 9 | 0 |
| LEE | 8 | 8 | 0 |
| YAMANAKA | 7 | 7 | 0 |
| **Union (deduped)** | **35** | **35** | **0** |

All resolve through `getSkillArt()` → registry `skill:<id>` → painted PNG on disk. Spot-checked: taijutsu, fireball, rasengan, kaiten, 64_palms, primary_lotus, hell_viewing, shadow_clones, mind_body_disturbing.

### Broader R1 / Waves-relevant pool (starters + common pool / bosses)

Checked **69** ids (loadout union + Waves kit: mist / water / weapons / senbon / wire / explosive / dragon_flame / chidori / demon_slash / ice_mirrors / etc.):

| Result | count |
|--------|-------|
| Resolve + on disk | **69** |
| Painted PNG | **67** |
| Imagine-jpg (held endgame leftovers in boss table: e.g. `sand_coffin`, `shinra_tensei`) | **2** |
| Missing manifest / missing file | **0** |

**Cap note:** ~20 core R1 feel is fully covered by clan starters (all painted). No path fixes required.

---

## 4. SkillCard cost legibility + hand block reasons

| Check | Status | Where |
|-------|--------|-------|
| Disabled greyscale **bg only** (not whole card) | OK | `SkillCard.css` `.skill-card--disabled .skill-card__bg` |
| Cost stack above scrim (`z-index: 25`) | OK | `.skill-card__cost-stack` |
| AP rust / CP cool blue plates | OK | `--ap` / `--cp` badges |
| FREE_FIRST face honesty (strike + FREE) | OK | `freeChakra` → waived chip |
| `chakraShort` / `hpShort` short signals | OK | Hand → SkillCard props |
| Block reason face strip | OK | `.skill-card__block-reason` when `!usable && cooldown===0` |
| Block reason text sources | OK | `Combat.getSkillBlockReason`: stun / silence / CD / AP / chakra / HP |
| Hand wires `blockReason` | OK | `Hand.tsx` (`Enemy turn` / `getSkillBlockReason` / `Cannot play`) |

No presentation regressions from WAVE9/10.

---

## 5. VFX / FloatingText (no dual race)

| Check | Status |
|-------|--------|
| Single animation owner | **`FloatingText.css`** only (`floating-text-rise` / `floating-text-crit` / `floating-text-fade`) |
| Legacy `App.css` float rules | **Gone** (WAVE10) — comment only remains pointing ownership to component CSS |
| Dual `.floating-text { animation: floatUp … }` race | **Absent** (grep: only WAVE10 comment + component keyframes) |
| BEM modifiers | `floating-text--damage|crit|heal|miss|block|status|chakra` + dtype/element |
| z-index | **80** (above hand chrome, below modals) |
| Drift de-stack | `driftFromId` −18..+18 px held |
| Feature flag | `SHOW_FLOATING_TEXT: true` |
| Spawn paths | `useCombat` → `combatRef.spawnFloatingText` (player/enemy hit, miss, heal) |
| Render | `Combat.tsx` maps `floatingTexts` → `<FloatingText />` |

**No dual race systems.** Combat feedback still wired. No VFX code changes this wave.

---

## 6. Wiring verify (no balance)

| Path | Status |
|------|--------|
| `skillArtManifest.ts` → `SKILL_ART_MANIFEST` | 114 entries; 93 painted + 21 jpg |
| `artRegistry.ts` loads manifest into `skill:<id>` | ✅ |
| `getSkillArt()` cascade (registry → skill.image → emoji) | ✅ intact |
| SkillCard / Hand / loot / scroll / CharacterSelect use `getSkillArt` | ✅ |
| FREE_FIRST / cost face (WAVE9) | ✅ still wired |
| FloatingText dtype/element gate + drift (WAVE9) | ✅ single CSS owner post-WAVE10 |

---

## 7. Constraints checklist

| Constraint | Status |
|------------|--------|
| No new Imagine / paint assets | ✅ 0 new files |
| Endgame 21 jpg held | ✅ |
| Fix only path/registry if broken | ✅ 0 bugs found |
| No skill DB delete | ✅ 114 |
| No balance | ✅ |
| No git commit | ✅ |
| tsc clean | ✅ exit 0 |
| Report path | ✅ this file |

---

## 8. Files touched

| Path | Action |
|------|--------|
| `src/game/constants/artRegistry.ts` | `T020_skills` backlog note → WAVE11 smoke status |
| `.agents/swarm-grok/reports/A7b-wave11-skills.md` | this report |

**No asset files added, painted, or deleted. No SkillCard / Hand / Combat / formula edits.**

---

## 9. Verification

```text
Manifest painted-png : 93 entries
Manifest imagine-jpg : 21 entries (endgame held)
Disk skill_*.png     : 93 public + 93 root (parity)
Missing painted      : 0
Orphans              : 0
Skill DB ↔ manifest  : 114/114
R1 loadout art       : 35/35 painted ON_DISK
Core R1+Waves pool   : 69/69 resolve (0 path breaks)
SkillCard costs      : legible when disabled (bg-only grey)
Hand block reasons   : wired + face strip
FloatingText race    : none (single owner)
SHOW_FLOATING_TEXT   : true
Wave11 new art       : 0
Path/registry fixes  : 0 (CLEAN)
Skill DB deleted     : none
Balance formulas     : untouched
tsc --noEmit         : exit 0
No git commit
```

**Done — CLEAN verify-only.**
