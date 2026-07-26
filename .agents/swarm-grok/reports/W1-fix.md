# W1-fix Report — Region 1 bugs P0/P1

**Agent:** W1-fix  
**Date:** 2026-07-22  
**Scope:** Rest soft-stall, public backgrounds, location-card activity honesty  
**tsc:** `npx tsc --noEmit` — **pass**

## Tasks completed

| ID | Title | Status |
|----|-------|--------|
| R1-REST-FIX / R1-004 | Rest modal close never returns to map | **done** |
| R1-BG-PUBLIC / R1-001 / R1-002 | Public map + combat backgrounds | **done** (verify) |
| R1-003 | Merchant/Rest/Training card honesty | **done** (UI soft fix) |

---

## 1. R1-REST-FIX / R1-004 — Rest soft-stall

### Bug
`useActivityHandler` rest path:
1. Heals player
2. `completeActivity(..., 'rest')` + `setFloor`
3. Opens `RestResultModal` via `setRestResult`

**Before:** `App.tsx` closed the modal with only `setRestResult(null)`.  
Never called `returnToMap` / `returnToMapActivityComplete` → multi-activity rooms did not chain; exit-room rest never ran `isFloorComplete` → location stuck incomplete.

### Fix
`src/App.tsx` — RestResultModal `onClose`:

```ts
setRestResult(null);
returnToMap();
```

`returnToMap` (in `useExploration.ts`) after rest:
- Reads updated `locationFloor` (rest already `completeActivity`'d)
- If room has next incomplete activity → `executeRoomActivity` chain
- Else if `isFloorComplete` → `completeLocationAndReturnToRegion`
- Else → stay on `LOCATION_EXPLORE`

**Why `returnToMap` not `returnToMapActivityComplete`:** the latter skips activity chaining (by design). Rest needs both chain + floor-complete.

**Bonus:** same return path applied to `IntelResultModal` (identical incomplete-close pattern).

### Files
- `src/App.tsx` (modal onClose)
- (logic already correct) `src/hooks/useActivityHandler.ts`, `src/hooks/useExploration.ts`

### Verification
- Code-path review of rest → modal → Continue/Enter/Escape → `returnToMap`
- `npx tsc --noEmit` clean

---

## 2. R1-BG-PUBLIC / R1-001 / R1-002 — Public backgrounds

### Check
| Asset | Path | Status |
|-------|------|--------|
| Map explore BG | `public/assets/background_map_exploring.png` | **present** (lead copy) |
| Combat/explore BG | `public/assets/background_exploration_combat.png` | **present** (lead copy) |

### Code references (correct — Vite public root)
- `LocationMap.tsx`: `url(/assets/background_map_exploring.png)`
- `App.css`: `url('/assets/background_exploration_combat.png')`

### Fix
None required — paths already match files on disk.

---

## 3. R1-003 — Card activity honesty (soft UI)

### Issue
`location.flags.hasMerchant|hasRest|hasTraining` drive card chips and FULL-intel special feature text as if guaranteed. Room generation (`LocationSystem.generateActivities`) is weighted-random by room type and **does not** consume those flags.

Full generation rewrite deferred (R1-012 / architecture).

### Soft fix (honesty in UI)
| Surface | Change |
|---------|--------|
| `determineSpecialFeature` | "Merchant Available" → **"May have Merchant"** (same for Training/Rest) |
| `getLocationActivities` | merchant/rest/training/info → status `'special'` (not `'normal'`) |
| `ActivityIcons` | special → tooltip **"May have {label}"**, mark `≈` |
| `LocationCard` (legacy) | chip titles **"May have …"** |

Boss / secret / story features remain definitive.

### Files
- `src/game/systems/RegionSystem.ts`
- `src/components/exploration/ActivityIcons.tsx`
- `src/components/exploration/LocationCard.tsx`

---

## Out of scope / follow-ups

- **R1-012:** Generate rooms from flags (architecture) — not done; UI honesty only.
- Merchant/training multi-activity chain already uses `returnToMapActivityComplete` (no auto-chain); rest now uses `returnToMap` which does chain — intentional asymmetry documented.

## Changelog

`CHANGELOG.md` `[Unreleased]` — Fixed (Region 1 polish — W1-fix).
