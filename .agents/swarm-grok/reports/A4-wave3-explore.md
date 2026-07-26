# A4 WAVE3 — Exploración R1 production finish

**Agent:** A4 WAVE3  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** RegionMap + LocationMap production pass · first-run StS clarity · fogged mystery · CRT visor · scar complete · solid BGs  
**Verify:** `npx tsc --noEmit` — clean (exit 0)

## Mandate

1. Production pass on RegionMap + LocationMap only  
2. LocationCompleteModal / room complete: location-as-transform scar if thin  
3. Backgrounds always show (lamina / map plate) — no empty panels  
4. Fix `isSecret` / BranchingFloor TS if present  
5. Report this file  

## What shipped

### 1. First-run clarity (StS map)

Player always sees **one next meaningful action**.

| Surface | Behavior |
|---------|----------|
| **RegionMap** | Auto-select card 0 (unchanged). Always-on coach: mark path → deploy / fog deploy / scar return / veiled slip. CTA label tracks selection (`Enter Location` / `Deploy into Fog` / `Revisit Location` / `Slip Into Route`). First tip: *pick a card, then Enter Location* + Gato endgame. |
| **LocationMap** | Dynamic coach from map state: enter current · path set · node spent choose 1–2 · guardian · locked path. Exit room CTA becomes **Enter Guardian**. Coach always visible (not only empty selection). |

### 2. Mystery — fogged intel / danger misdirection (honest)

No fabricated danger numbers. Fog says “unreadable,” not a wrong D#.

| Layer | Copy / UI |
|-------|-----------|
| Card identity (NONE) | Chip **Threat unreadable** |
| Card art glitch | Caption **Signal fogged** on void plate |
| Card footer | `Signal fogged · threat unreadable` |
| Region preview | Chips: Signal fogged + Threat unreadable |
| Preview prose | *Destination unconfirmed — the fog misleads without inventing numbers* |
| Fog diamond cells | Title: *Fogged intel — advance to scout (threat unreadable, not empty)* |

### 3. CRT-as-visor (not world neon)

- RegionMap / LocationMap: scanlines + vignette remain **instrument chrome** over void underplate.  
- Region coach dialed from candy gold pulse → fog/bone readout.  
- Location coach → bone `#e8e4dc`.  
- LocationCompleteModal title/CTA: party green → bone + **rust instrument** CTA (matches deploy language).  
- Palette anchors: void `#050608` · metal `#2d3d4a` · fog `#8a9199` · bone `#e8e4dc` · rust `#a65d3f`.

### 4. Location-as-transform scar (complete panel)

`LocationCompleteModal` always shows a scar/transform line:

| Case | Message pattern |
|------|-----------------|
| First clear | `{place} leaves a mark… ops table will show a scar on return` |
| Revisit | `Scar deepens… thinner loot, same ground` + Scar tag + no-clear-credit note |
| Boss | `{place} falls. The region shifts…` |

`LocationCompleteResult.biome` passed from `useLocationCards` for place identity.  
LocationMap header already had Scar chip; added **Scar active — loot thinner** under intel when `isRevisit`.

### 5. Backgrounds always show

| Surface | Guarantee |
|---------|-----------|
| **RegionMap** | `backgroundColor: #050608` + scrim + arc map + `background_map_exploring.png` fallback |
| **LocationMap** | void underplate + scrim + `resolveLaminaPaths(biome).background` + map exploring fallback (even if biome missing) |
| **Cards** | Mystery = void glitch plate; revealed = art + LocationIcon fallback on `onError` |

### 6. TypeScript `isSecret` / BranchingFloor

- `npx tsc --noEmit` exit **0** before and after.  
- No type fixes required; `BranchingFloor.isSecret?` / card flags already consistent from wave2.

## Files touched

| File | Role |
|------|------|
| `src/components/exploration/RegionMap.tsx` | Next-action coach · dynamic CTA · threat chips · solid multi-layer BG |
| `src/components/exploration/LocationMap.tsx` | Dynamic coach · Enter Guardian · scar note · solid plate BG |
| `src/components/exploration/LocationCardDisplay.tsx` | Fog identity chip · glitch caption · honest threat footer |
| `src/components/exploration/exploration.css` | Fog chips · coach tone · scar-note · threat preview chip |
| `src/components/modals/LocationCompleteModal.tsx` | Always-on scar transform message · Scar tag · biome field |
| `src/components/modals/LocationCompleteModal.css` | Scar styles · rust continue CTA · bone title |
| `src/hooks/useLocationCards.ts` | Pass `biome` into complete result |

## Explicitly not done

- No git commit  
- No floor generation rewrite  
- No new unit tests  
- No new lamina / plate generation  
- Did not rewire PARTIAL intel onto unrevealed cards (still FULL/NONE via `revealedCount`) — PARTIAL display path remains available for future honesty tiers  

## Smoke checklist (manual)

1. RegionMap: void plate + map art visible; metal frame; no cyan/magenta party bloom  
2. First run: tip + auto-selected card + coach says Space/Enter to deploy  
3. Low-intel mystery card: Threat unreadable / Signal fogged — no fake D#  
4. Enter location: biome plate + D# + optional Scar/Veiled  
5. LocationMap: coach tracks enter / path pick / guardian; diamond fog shows ???  
6. Clear location: scar transform line present; revisit shows Scar tag + thinner-loot line  
7. `npx tsc --noEmit` clean  

## Residual risks

- Mid/fg laminas still incomplete for some biomes — combat stage separate; map plates path-stable  
- Activity icon training still uses teal (semantic, not map climate)  
- Authored path graph unused for navigation (R1-005 backlog)  
- Coach always-on adds a line of vertical chrome on tight heights — acceptable for StS clarity  
