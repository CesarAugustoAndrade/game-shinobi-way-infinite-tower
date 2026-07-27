# A7b WAVE13 — Skills Regression

**Agent:** A7b WAVE13 (skills regression)  
**Branch:** `develop` (no commit)  
**Date:** 2026-07-23  
**Scope:** Mandate regression only — FREE_FIRST toggle waiver + sim parity; silence banner + empty-hand pass nudge; starter loadout art 35/35  
**Art:** **No new skill paint** (ceiling **93** PNG + **21** jpg endgame held)  
**Balance / skill DB:** Untouched (114 skills)

---

## Summary

| Area | Result |
|------|--------|
| FREE_FIRST toggle waiver + flag clear (`useCombat`) | **HELD** |
| FREE_FIRST sim parity (`CombatSimulationService`) | **HELD** |
| FREE_FIRST regular-card path + unit tests | **HELD** (54/54 related tests) |
| Silence banner | **HELD** |
| Empty-hand / all-blocked pass nudge | **HELD** |
| Hand empty copy | **HELD** |
| End Turn highlight (`--nudge` / “no plays”) | **HELD** |
| R1 clan start loadout art | **35/35** resolve + ON_DISK painted |
| Painted PNG ceiling | **93** (no new paint) |
| Imagine-jpg held | **21** (endgame residual) |
| Skill DB size | **114** (unchanged) |
| NEW real bugs | **None** — no code changes |
| `tsc --noEmit` | **Clean** (exit 0) |

---

## 1. FREE_FIRST — toggle waiver + flag clear + sim parity

### 1.1 Live toggle path (`src/hooks/useCombat.ts`)

| Check | Status | Evidence |
|-------|--------|----------|
| Activation chakra waived when `skipFirstSkillCost` | ✅ | `skipToggleChakra = Boolean(combatState.skipFirstSkillCost) && !isActive && skill.chakraCost > 0`; `effectiveToggleChakra = skipToggleChakra ? 0 : …` |
| Silence still keys off **base** `chakraCost` | ✅ | Silence gate before waiver; free-first does not bypass silence |
| Pay 0 chakra on activate when waived | ✅ | `newChakra -= effectiveToggleChakra` |
| Log `Activated! FREE!` when waived | ✅ | `skipToggleChakra ? … FREE! : … Activated!` |
| Clear `skipFirstSkillCost` on accepted toggle play | ✅ | `setCombatState(prev => ({ …prev, skipFirstSkillCost: false }))` after successful toggle |
| Regular cards still clear flag | ✅ | Post-accept block: `skipFirstSkillCost: combatState.skipFirstSkillCost ? false : prev…` |
| UI face / can-play treats effective CP as 0 | ✅ | `Combat.tsx` `canUseSkill` + `Hand` `freeChakra` / tooltip waived CP |

### 1.2 Sim parity (`src/game/systems/CombatSimulationService.ts`)

| Check | Status | Evidence |
|-------|--------|----------|
| Waiver gated by flag alone (not `isFirstTurn && flag`) | ✅ | `const skipCost = Boolean(ctx.skipFirstSkillCost)` |
| Clear flag when waiver applied | ✅ | `ctx.skipFirstSkillCost = false` in cost-deduct branch |
| Comment documents live parity | ✅ | “parity with PlayerTurnSystem / useCombat: flag alone gates the waiver” |

### 1.3 Pure systems + tests

| Check | Status |
|-------|--------|
| `PlayerTurnSystem` effective chakra from `skipFirstSkillCost` | ✅ |
| `EquipmentPassiveSystem` sets flag from `FREE_FIRST_SKILL` | ✅ |
| Vitest: `EquipmentPassiveSystem` FREE_FIRST | ✅ |
| Vitest: `CombatSimulationService` skips first skill chakra | ✅ |
| Vitest: `PlayerTurnSystem` FREE_FIRST low-chakra / 0 CP | ✅ |
| Suite run (3 files) | **54 passed** |

**Regression verdict: HELD.** No fix required.

---

## 2. Silence banner + empty-hand pass nudge

### 2.1 Silence feedback (`Combat.tsx` + `Combat.css`)

| Check | Status |
|-------|--------|
| Status banner when silenced + PLAYER turn + not stunned | ✅ `combat-silence-banner` |
| Copy: chakra jutsu blocked; free taijutsu / Space | ✅ |
| Card-level strip via `getSkillBlockReason` | ✅ “Silenced — chakra jutsu blocked” |
| Free taijutsu still playable (`chakraCost === 0`) | ✅ `silencedBlocked` only when `chakraCost > 0 && !isActive` |
| Toggle deactivation allowed under silence | ✅ |
| CSS + reduced-motion | ✅ |

### 2.2 Empty / blocked hand pass CTA

| Check | Status |
|-------|--------|
| `handEmptyNeedsPass` when hand length 0 on PLAYER | ✅ |
| `allCardsBlocked` when every hand card fails `canUseSkill` | ✅ |
| Pass-nudge banner + End Turn button | ✅ `combat-pass-nudge` |
| End Turn class `combat__pass-btn--nudge` | ✅ when `needsPassHighlight && !isStunned` |
| Label “End Turn (no plays)” | ✅ empty or all-blocked |
| Hand empty copy | ✅ “Hand empty” / “End your turn (Space) — AP does not carry over.” |
| Space still ends turn | ✅ keyboard handler held |

**Regression verdict: HELD.** No fix required.

---

## 3. Starter loadouts → art paths (35/35)

Source: `CLAN_START_LOADOUT` / `getClanStartingSkills` in `src/game/constants/index.ts`.  
Resolution: `getSkillArt()` → `ART_REGISTRY[skill:<id>]` from `SKILL_ART_MANIFEST`.

| Clan | unique skill ids | painted ON_DISK |
|------|------------------|-----------------|
| UZUMAKI | 8 | 8 |
| UCHIHA | 10 | 10 |
| HYUGA | 10 | 10 |
| LEE | 9 | 9 |
| YAMANAKA | 8 | 8 |
| **Union (deduped)** | **35** | **35** |

> Note: WAVE12 report listed slightly lower per-clan uniques (shared-skill bookkeeping). **Union 35/35** is unchanged and re-verified this wave.

- Manifest / disk missing for loadout ids: **0**
- Skill DB ↔ manifest: **114/114** with `src`
- Aliases still resolve:
  - `basic_atk` → `/assets/skill_taijutsu.png`
  - `shadow_clone` → `/assets/skill_shadow_clones.png`
  - `kaiten`, `sharingan_2`, `64_palms` (and remaining loadout ids) painted on disk
- Disk: `public/assets/skill_*.png` = **93**, root `assets/skill_*.png` = **93**
- Manifest quality: **93** `painted-png` + **21** `imagine-jpg` (endgame held — **no new paint**)

---

## 4. Soft-lock / residual re-scan (no new bugs)

| Path | Result |
|------|--------|
| FREE_FIRST toggle click vs face cost | Waiver + flag consume still aligned |
| FREE_FIRST sim vs live gate | Flag-only both sides |
| Silence without banner | Banner still present |
| Empty hand soft-lock | Nudge + End Turn highlight still present |
| AP spent / no effect | Prior WAVE12 reject paths still unlock lock + 0 AP (not re-broken) |

**NEW real bugs found: 0.**  
**Code / asset changes: 0.**

---

## 5. Constraints checklist

| Constraint | Status |
|------------|--------|
| No new skill paint (93 + 21 held) | ✅ |
| FREE_FIRST toggle waiver + flag clear | ✅ held |
| FREE_FIRST sim parity | ✅ held |
| Silence banner + empty-hand pass | ✅ held |
| Starter loadouts 35/35 art | ✅ |
| Fix only NEW real bugs | ✅ none found |
| No formulas rebalance | ✅ |
| No skill DB delete | ✅ 114 |
| No git commit | ✅ |
| tsc clean | ✅ exit 0 |

---

## 6. Files touched

| Path | Action |
|------|--------|
| `.agents/swarm-grok/reports/A7b-wave13-skills.md` | **Created** (this report) |

**No game source, CSS, tests, or asset files modified.**

---

## 7. Verification

```text
Manifest painted-png : 93
Manifest imagine-jpg : 21 (endgame held)
Disk skill_*.png     : 93 public + 93 root
R1 loadout art       : 35/35 painted ON_DISK
Skill DB             : 114 (no delete)
FREE_FIRST toggle    : waived CP + flag clear (held)
FREE_FIRST sim       : flag-only gate (held)
Silence feedback     : banner + card strip (held)
Empty/blocked hand   : nudge + End Turn highlight (held)
Related vitest       : 54 passed (3 files)
Balance formulas     : untouched
tsc --noEmit         : exit 0
No git commit
No paint / no code fix
```

**Done — WAVE13 skills regression clean; ceiling held; no new bugs.**
