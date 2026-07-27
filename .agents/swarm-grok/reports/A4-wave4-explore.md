# A4 WAVE4 — Exploración residual small polish

**Agent:** A4 WAVE4  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** First-run friction · location-card identity overflow · void underplates never empty  
**Verify:** `npx tsc --noEmit` — clean (exit 0)

## Mandate

1. Fix remaining first-run friction (CTA disabled without reason, keyboard Enter not working, etc.)  
2. Ensure every location card has readable identity row without overflow  
3. Ambient: void underplates never empty  
4. Report this file  

No floor gen rewrite. No commit.

## What shipped

### 1. First-run friction

| Issue | Fix |
|-------|-----|
| CTA disabled while cards exist but `selectedIndex === null` (auto-pick race) | CTA enables on `drawnCards.length > 0` via `resolvedIndex` (defaults to 0). Label only greys when deck empty. |
| Silent no-op on Space/Enter with null selection | `handleEnterSelectedLocation` falls back to card **0** when selection missing/OOB; syncs parent index. |
| Focused card button swallowing Enter/Space | Map key handlers use **capture** + `preventDefault`/`stopPropagation`. Cards `onFocus` select so tab+Enter targets the focused path. |
| Disabled CTA with no reason | Empty deck → label **No Path Available** + visible reason line + `title`/`aria-label`. |
| Spent LocationMap node: Enter did nothing | Space/Enter marks first open child path; second press enters. Coach copy updated. |
| Numpad 1–2 ignored on LocationMap | Numpad keys map like Digit keys. |
| Capture stealing keys from modals | Guard: skip map keys when dialog/overlay/reward roots present (includes `.reward-modal` without `role=dialog`). |

**RegionMap deploy path:** `canDeploy` · `handleDeployClick` · coach never says “Mark a path first” when a card is already resolvable.

### 2. Location card identity row (no overflow)

| Layer | Change |
|-------|--------|
| Header | `align-items: flex-start`, `min-width: 0`, badge offset |
| Title / legend | Ellipsis + `max-width: 100%` |
| Identity row | `max-width: 100%`, `max-height: 2.6rem`, overflow hidden, wrap |
| D# badge | `flex: 0 0 auto` (never shrinks away) |
| Biome chip | `location-card__id-chip--biome` + `max-width: min(9.5rem, 100%)` + full name in `title` |
| Scar / Veiled | `flex: 0 0 auto` so status chips stay readable |
| Fog chip | Full-width cap for “Threat unreadable” |

Long biomes (`Mist Covered Bridge`, `Underground Cavern`, etc.) ellipsis without blowing the card or clipping D#/Scar.

### 3. Void underplates never empty

| Surface | Guarantee |
|---------|-----------|
| **RegionMap** root | `background-color: #050608` in CSS + inline scrim/map stack |
| **Low-intel placeholders** | Void plate gradient + inset shadow (not transparent dash only) |
| **Location card image** | Void `#050608` under gradient (mystery + revealed) |
| **LocationMap fog** | Already plated (unchanged) |
| **Grandchild `...` placeholder** | Solid void plate matching fog language |
| **Empty branch / missing current** | `location-map__void-plate` (+ `--here` size for you-are-here slot) |

Diamond frame never reads as a bare beige/empty panel when rooms are missing.

## Files touched

| File | Role |
|------|------|
| `src/hooks/useLocationCards.ts` | Enter falls back to card 0; selection sync |
| `src/components/exploration/RegionMap.tsx` | resolvedIndex · deploy CTA · capture keyboard · disabled reason |
| `src/components/exploration/LocationMap.tsx` | Spent-node Enter · numpad · modal guard · void plates |
| `src/components/exploration/LocationCardDisplay.tsx` | Biome chip class · focus selects · aria-pressed |
| `src/components/exploration/exploration.css` | Identity overflow · void underplates · disabled reason |

## Explicitly not done

- No git commit  
- No floor generation rewrite  
- No new unit tests  
- No new lamina / plate assets  
- Did not wire PARTIAL intel tiers beyond existing FULL/NONE  

## Smoke checklist (manual)

1. New run → RegionMap: card 0 selected, **Enter Location** active, Space/Enter deploys immediately  
2. Empty deck edge: CTA **No Path Available** + reason text (not mute grey)  
3. Focus card 2 via Tab → Enter deploys that card (focus selects)  
4. Open bag (I): Space/Enter does **not** deploy under overlay  
5. Cards: long biome + D# + Scar/Veiled — no horizontal overflow; ellipsis on biome  
6. LocationMap: clear a node → Space marks path 1 → Space enters; numpad works  
7. Fog / empty diamond rows show void plates (never blank)  
8. `npx tsc --noEmit` clean  

## Residual risks

- RewardModal still lacks `role="dialog"`; guard uses `.reward-modal` class — keep class stable or add proper dialog role later  
- Two-press Enter on spent node (mark then enter) is intentional StS; one-press auto-enter of child was rejected as too aggressive for path choice  
- Mid/fg laminas incomplete for some biomes remain A3 territory; map plates path-stable  
