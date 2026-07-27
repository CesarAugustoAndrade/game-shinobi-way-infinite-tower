# E1-menu — First-player journey UI (pre–Region Map)

**Agent:** E1-menu  
**Date:** 2026-07-22  
**Scope:** MainMenu, CharacterSelect, GameGuide, Interlude, App start flow, helpText, feature flags  
**Tasks added:** R1-001 … R1-020 (20)

## Flow audited

```
MENU → (optional GUIDE) → CHAR_SELECT → startGame(clan)
     → bootstrapRegionMap → REGION_MAP
```

- Campaign / Infinite set `pendingRunMode` then share the same char select.
- `SKIP_CHAR_SELECT` can bypass lineage; **no tutorial/onboarding flag**.
- Interlude is post-region (boon 1-of-3) but listed in mission files.

## Top 10 issues (priority order)

| # | ID | Severity | Category | Issue |
|---|-----|----------|----------|--------|
| 1 | R1-001 | P0 | Confuso | Clan pick dumps player on Region Map with zero intro / next-action coach |
| 2 | R1-002 | P1 | Fricción | Char select: no Back / Escape to menu or difficulty retune |
| 3 | R1-003 | P1 | Fricción | Clan card `cursor:pointer` but only bottom CTA selects (dead clicks) |
| 4 | R1-004 | P1 | Confuso | Cards hide role/playstyle/weakness; ranks-only surface |
| 5 | R1-005 | P1 | Confuso | Mission Difficulty slider has no effect copy / recommend |
| 6 | R1-006 | P1 | Confuso | Handbook opens as 9-tab systems bible, not first-hour guide |
| 7 | R1-008 | P2 | Roto | helpText activities: duplicate Scroll Discovery, missing Info Gathering |
| 8 | R1-007 | P2 | Confuso | Difficulty ranks skip A (D/C/B/S); unused CSS `--a` |
| 9 | R1-009 | P2 | Fricción | Keys 1–5 hard-commit run with no confirm |
| 10 | R1-010 / R1-011 / R1-012 | P2 | Feo | No 16:9 stage; guide tabs wrap; Interlude emoji-only stats/summary |

## Also noted (lower)

- R1-013–R1-014: no Handbook nudge; no `ENABLE_ONBOARDING` flag  
- R1-015: “Infinite Tower” subtitle vs Campaign-first Waves fantasy  
- R1-016: DERIVED crit copy conflates chance vs mult  
- R1-017: raw `boon.kind` strings on Interlude  
- R1-018: `background-attachment: fixed` menu jank  
- R1-019: missing Waves-tone flavor on char select header  
- R1-020: Elements tab Lucide-only  

## Non-issues / OK

- **EN/ES mix:** menu journey strings are English-only (no mix found).  
- **Begin Journey asset:** `/assets/translucent_begin_journey.png` present under `public/assets`.  
- **Clan crests:** registry points at `icons/clans/*.jpg` with emoji fallback via ArtIcon.  
- **HP formulas in helpText** (`80 + WIL×9`) match `STAT_FORMULAS` (Claude.md “×10” is docs drift, not UI).  
- **Main menu Campaign CTA + Enter** is clear when on MENU.

## Recommended worker order

1. **W2-ux:** R1-001 (with W4-narrative copy), R1-002, R1-003, R1-009  
2. **W2-ux + W4-narrative:** R1-004, R1-005, R1-006, R1-015, R1-019  
3. **W1-fix:** R1-008, R1-007, R1-016  
4. **W3-visual:** R1-010, R1-011, R1-012, R1-017, R1-018, R1-020  
5. **Feature:** R1-014 (+ wire R1-001/R1-013)

## Out of scope logged

None new (menu path stayed in mandate). Victory/GameOver not deep-audited.
