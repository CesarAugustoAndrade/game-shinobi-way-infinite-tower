# W2-ux Report — Confuso + Fricción (first-time Region 1)

**Agent:** W2-ux  
**Date:** 2026-07-22  
**Scope:** MainMenu → CharacterSelect → RegionMap → LocationMap + Walk Away / helpText  
**tsc:** Only pre-existing error in `RotoEmpiricalStress.test.ts` (LocationFlags). No errors in W2-ux touched files.

## Tasks claimed / completed

| ID | Title | Status |
|----|-------|--------|
| R1-020 | MainMenu / CharacterSelect first-time CTAs | done |
| R1-021 | Region map first location entry affordance | done |
| R1-022 | In-location first room what-to-click | done |
| R1-023 | Walk Away / empty outcome feedback | done |
| R1-024 | helpText first-time exploration tips | done |

## UX improvements

### 1. MainMenu
- Primary CTA: **Campaign** → **Begin Journey**
- Subline: "Story campaign · starts in the Land of Waves"
- Dynamic difficulty helper under the slider (D/C/B/S guidance; notes default ~40 Rank C)

### 2. CharacterSelect
- Hint: keys **or click a card**
- Beginner tip: **Uzumaki** is most forgiving (HP + chakra)

### 3. RegionMap
- Auto-selects card 1 when nothing is selected (first draw / post-location redraw)
- Disabled CTA label: **Select a Card First** vs active **Enter Location**
- Coach line when unselected; clearer footer keys

### 4. LocationMap + RoomCard
- Auto-selects **current room** on enter / after advance so **Enter Room** is always visible
- Empty selection coach + keyboard strip (1–2 / Space / Enter)
- **You are here** badge on current room
- Locked copy: "Locked — pick a path above"
- Exit hint clarified

### 5. Walk Away / event results
- Bridge Worker's Plea Walk Away: honest SAFE copy + hintText + log says you walk on unchanged
- `buildOutcomeChanges`: combat chip; pure-narrative outcomes get "Outcome · No rewards · weight carried"
- EventResultModal empty-state tone-aware copy (fallback if no chips)

### 6. Handbook / helpText
- `HELP_TEXT.EXPLORATION.FIRST_RUN` 5-step first-run journey
- GameGuide Exploration tab renders **First Steps** section

## Files changed

- `region1-polish-backlog.md`
- `src/scenes/menu/MainMenu.tsx`
- `src/scenes/menu/MainMenu.css`
- `src/scenes/menu/CharacterSelect.tsx`
- `src/scenes/menu/CharacterSelect.css`
- `src/scenes/menu/GameGuide.tsx`
- `src/components/exploration/RegionMap.tsx`
- `src/components/exploration/LocationMap.tsx`
- `src/components/exploration/RoomCard.tsx`
- `src/components/exploration/exploration.css`
- `src/components/modals/EventResultModal.tsx`
- `src/components/modals/EventResultModal.css`
- `src/components/modals/eventOutcomeChanges.ts`
- `src/game/constants/events/wavesArcEvents.ts`
- `src/game/constants/helpText.ts`
- `.agents/swarm-grok/reports/W2-ux.md` (this file)

## Verification

- Manual code-path review of first-run flow (menu → clan → region auto-select → location auto-select → enter)
- `npx tsc --noEmit`: 1 pre-existing error outside scope (`RotoEmpiricalStress.test.ts`)
- No architecture refactors; copy/CSS/small interaction-only

## Residual risk / follow-ups

- RegionMap auto-select may feel assertive if player wants to "scan" before selecting — mitigated by free re-select via 1–3
- Other arcs' Walk Away choices still use generic SAFE copy (only Waves bridge plea polished)
- Pre-existing `LocationFlags` type error blocks clean CI tsc
