# A7b WAVE12 — Skills / Hand Residual

**Agent:** A7b WAVE12 (skills/hand residual)  
**Branch:** `develop` (no commit)  
**Date:** 2026-07-23  
**Scope:** Starter clan art paths; hand unusable reasons + SkillCard cost legibility; hunt skill-cast soft-locks (AP no effect, FREE_FIRST edge, empty hand no pass, silence/stun feedback)  
**Balance:** No formula / cost / winrate changes  
**Skill DB:** Unchanged (114 skills — no delete)  
**Art:** **No new skill paint** (ceiling 93 PNG + 21 jpg endgame held)

---

## Summary

| Area | Result |
|------|--------|
| Skill DB size | **114** (unchanged) |
| Painted PNG | **93** (no new paint) |
| Imagine-jpg held | **21** (endgame residual) |
| R1 clan start loadout art | **35/35** resolve + ON_DISK painted |
| SkillCard cost legibility | **Held** (WAVE9 bg-only grey; cost stack z25) |
| Hand block reasons | **Held** (`getSkillBlockReason` + face strip) |
| FREE_FIRST toggle edge | **Fixed** (activation chakra waiver + flag consume) |
| FREE_FIRST sim parity | **Fixed** (`skipFirstSkillCost` alone gates waiver) |
| Silence feedback | **Fixed** (status banner + existing card strips) |
| Empty / blocked hand pass | **Fixed** (nudge banner + End Turn highlight) |
| AP spent / no effect soft-lock | **None found** (reject paths unlock + 0 AP) |
| tsc `--noEmit` | **Clean** (exit 0) |

---

## 1. Art ceiling (explicit)

**No new skill paint.** Manifest still **93** `painted-png` + **21** `imagine-jpg`.

Disk: `public/assets/skill_*.png` = **93**, root `assets/skill_*.png` = **93**, parity clean. Endgame ids (tsukuyomi, amaterasu, …) remain jpg-only under `public/assets/icons/skills/`.

---

## 2. Starter clan loadouts → art paths

Source: `CLAN_START_LOADOUT` / `getClanStartingSkills` in `src/game/constants/index.ts`.

| Clan | unique skill ids | painted ON_DISK |
|------|------------------|-----------------|
| UZUMAKI | 8 | 8 |
| UCHIHA | 9 | 9 |
| HYUGA | 9 | 9 |
| LEE | 8 | 8 |
| YAMANAKA | 7 | 7 |
| **Union (deduped)** | **35** | **35** |

- Manifest / disk missing for loadout ids: **0**
- Skill DB ↔ manifest: **114/114**
- Aliases still resolve: `basic_atk` → `skill_taijutsu.png`, `shadow_clone` → `skill_shadow_clones.png`, `kaiten`, `sharingan_2`, `64_palms`

`getSkillArt()` cascade (registry → skill.image → emoji) unchanged. CharacterSelect / Hand / SkillCard still use it.

---

## 3. SkillCard cost + unusable reasons (held)

| Check | Status |
|-------|--------|
| Disabled greyscale **bg only** | OK — `.skill-card--disabled .skill-card__bg` |
| Cost stack above scrim (`z-index: 25`) | OK |
| FREE_FIRST face (strike + FREE) | OK — `freeChakra` |
| Block reason face strip | OK when `!usable && cooldown===0` |
| `getSkillBlockReason` | stun / silence / CD / AP / chakra / HP |
| Hand wires `blockReason` | OK |

No presentation regression from WAVE9–11.

---

## 4. Soft-lock / residual hunt

### 4.1 AP spent but no effect

Traced `useCombat.useSkill` + `PlayerTurnSystem.useSkill`:

| Path | AP | Lock |
|------|----|------|
| Stun (pre-lock) | 0 | not taken |
| Silence (post-lock reject) | 0 | released |
| Insufficient AP / chakra / HP | 0 | released |
| Cooldown → `null` | 0 | released |
| Toggle silence / chakra reject | 0 | released |
| Accepted skill (hit/miss/buff) | paid | held until AP/hand commit |

**No AP-spent-without-effect soft-lock found.** Reject heuristic (`apCost===0 && danger`) still short-circuits before `finishCardPlay`.

### 4.2 FREE_FIRST edge — **real bug fixed**

**Problem:** FREE_FIRST face showed waived CP on **all** hand cards (including toggles), and `canUseSkill` treated activation as free, but the toggle branch in `useCombat`:

1. Still charged full `skill.chakraCost` on activate
2. Rejected 0-chakra activation while the card looked playable (click → log only)
3. **Never cleared** `skipFirstSkillCost` after a successful toggle play

**Fix (`useCombat.ts`):**

- Activation uses effective chakra cost `0` while `skipFirstSkillCost` (silence still keys off base cost)
- Log `Activated! FREE!` when waived
- Clear `skipFirstSkillCost` on any accepted toggle play (parity with regular cards)

**Sim parity (`CombatSimulationService.ts`):**

- Waiver was `skipFirstSkillCost && isFirstTurn` (too narrow vs live `skipFirstSkillCost` alone)
- Now: `Boolean(ctx.skipFirstSkillCost)`; clear flag when applied

### 4.3 Hand empty / no playable cards — **feedback fixed**

Pass was already always enabled on PLAYER turn (Space + End Turn). Residual: empty hand / fully blocked hand looked inert.

**Fix:**

- `Hand.tsx` empty state: clearer “Hand empty / End turn (Space)” copy
- `Combat.tsx`: pass-nudge banner when hand empty **or** every card unplayable
- End Turn button `combat__pass-btn--nudge` + label “End Turn (no plays)”

### 4.4 Silence / stun feedback

| Status | Before | After |
|--------|--------|-------|
| Stun | Banner + dual pass + card strip | **Held** |
| Silence | Card strip + reject log only | **+ status banner** (non-blocking; free taijutsu still playable) |

Silence banner copy: chakra jutsu blocked; free taijutsu or Space to end turn.

---

## 5. Constraints checklist

| Constraint | Status |
|------------|--------|
| No new skill paint (93 + 21 held) | ✅ |
| Starter loadouts resolve art | ✅ 35/35 |
| Hand unusable reasons surface | ✅ held + silence/empty CTAs |
| SkillCard cost legible | ✅ held |
| Fix only real bugs | ✅ FREE_FIRST toggle + sim + feedback |
| No formulas rebalance | ✅ |
| No skill DB delete | ✅ 114 |
| No git commit | ✅ |
| tsc clean | ✅ exit 0 |

---

## 6. Files touched

| Path | Action |
|------|--------|
| `src/hooks/useCombat.ts` | FREE_FIRST on toggle activate + consume flag |
| `src/game/systems/CombatSimulationService.ts` | FREE_FIRST gate parity with live |
| `src/scenes/combat/Combat.tsx` | silence banner; empty/blocked pass nudge; End Turn highlight |
| `src/scenes/combat/Combat.css` | silence / pass-nudge styles + reduced-motion |
| `src/components/combat/Hand.tsx` | stronger empty-hand copy |
| `src/components/combat/Hand.css` | empty-hand layout |
| `src/game/constants/artRegistry.ts` | `T020_skills` backlog note → WAVE12 |
| `.agents/swarm-grok/reports/A7b-wave12-skills.md` | this report |

**No asset files added or painted.**

---

## 7. Verification

```text
Manifest painted-png : 93
Manifest imagine-jpg : 21 (endgame held)
Disk skill_*.png     : 93 public + 93 root
R1 loadout art       : 35/35 painted ON_DISK
Skill DB             : 114 (no delete)
FREE_FIRST toggle    : waived CP + flag clear
FREE_FIRST sim       : flag-only gate
Silence feedback     : banner + card strip
Empty/blocked hand   : nudge + End Turn highlight
AP no-effect lock    : none found
Balance formulas     : untouched
tsc --noEmit         : exit 0
No git commit
```

**Done — residual bugs fixed; art ceiling held.**
