# A4 WAVE6 — Exploración bug hunt minimal

**Agent:** A4 WAVE6  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Stuck map · missing background · broken secret unlock copy · keyboard traps with modals  
**Verify:** `npx tsc --noEmit` — clean (exit 0)

## Mandate

1. Hunt real exploration bugs (stuck map, missing BG, secret unlock copy, modal keyboard traps)  
2. Fix only confirmed issues  
3. Report this file  

No floor gen rewrite. No commit.

## Hunt results

| Target | Verdict | Action |
|--------|---------|--------|
| **Stuck map** | Confirmed soft-stuck via keyboard | Map Enter/Space re-fired room enter under ApproachSelector; bag could open under result modals (z-index 40 under 50–70) |
| **Missing background** | Not confirmed | `public/assets/background_map_exploring.png` present; RegionMap/LocationMap multi-layer void + plate + fallback intact (W3/W4) |
| **Broken secret unlock copy** | Confirmed residual | Location complete still said **Secrets uncovered** + bare names; rest of explore uses veiled / off-ledger language |
| **Keyboard traps w/ modals** | Confirmed | ApproachSelector missing dialog role + map key guard; I/C opened bag under higher modals; ApproachSelector lacked focus trap |

## What shipped

### 1. Stuck map / keyboard re-entry under ApproachSelector

LocationMap + RegionMap capture handlers only skipped known modal classes. **`.approach-modal` / `.confirm-modal` were missing**, so with approach open:

- Space/Enter still ran map enter → `moveToRoom` + `executeRoomActivity` again  
- Soft-stuck / double-start combat setup feel

**Fix:** extend modal guard selectors to include `.approach-modal, .confirm-modal`.

### 2. Bag/character under result modals (stuck-under overlay)

| Layer | Change |
|-------|--------|
| App I/C keys | Skip when result/approach dialog present (not bag itself) |
| App effect | Force `exploreOverlay = 'none'` when reward/event/intel/rest/complete/dice/approach is open |
| ExplorationHUD | Bag/Character buttons no-op while those modals block |

### 3. Modal keyboard / focus hygiene (exploration-facing)

| Modal | Change |
|-------|--------|
| **ApproachSelector** | `role="dialog" aria-modal="true"` + `useFocusTrap` + root ref |
| **RewardModal** | `role="dialog" aria-modal="true"` (class fallback remains) |
| **LocationComplete** | Continue `autoFocus`; secret block copy (below) |

Map guards already covered bag via `.explore-overlay` / `role=dialog`.

### 4. Secret unlock copy (mysterious, grammatical)

LocationComplete unlock block:

| Before | After |
|--------|-------|
| Title **Secrets uncovered** | **Veiled routes surface** |
| Bare `<li>{name}</li>` | Name + tag **off the ledgers** |

Aligned with W5 log lines and RegionMap coach/preview language.

### 5. Missing background — verified only

No code change:

- `public/assets/background_map_exploring.png` on disk  
- All 14 Waves `location_*.png` present  
- LocationMap: void `#050608` + scrim + `resolveLaminaPaths(biome).background` + map fallback  
- RegionMap: void + scrim + arc map + map fallback  

## Files touched

| File | Role |
|------|------|
| `src/components/exploration/LocationMap.tsx` | Modal guard + approach/confirm |
| `src/components/exploration/RegionMap.tsx` | Modal guard + approach/confirm |
| `src/components/combat/ApproachSelector.tsx` | dialog role · focus trap |
| `src/components/modals/RewardModal.tsx` | dialog role (a11y + guards) |
| `src/components/modals/LocationCompleteModal.tsx` | Veiled unlock copy · autoFocus |
| `src/components/modals/LocationCompleteModal.css` | Secret row layout/tags |
| `src/App.tsx` | Close bag under modals · I/C block · HUD guard |

## Explicitly not done

- No git commit  
- No floor generation rewrite  
- No new unit tests  
- No new lamina / plate assets  
- Did not redesign relative diamond navigation (dead-end floors remain gen territory)  

## Smoke checklist (manual)

1. Enter combat room → Approach open → Space/Enter does **not** re-enter room  
2. Esc on approach still exits room  
3. Victory reward open → I/C do not open bag under panel  
4. Location complete open → bag forced closed; Enter continues to region  
5. Clear location that unlocks a secret → panel shows **Veiled routes surface** + name + **off the ledgers**  
6. RegionMap / LocationMap still show painted plates (not empty beige)  
7. `npx tsc --noEmit` clean  

## Residual risks

- Full Tab focus trap on ApproachSelector depends on `useFocusTrap` + focusable children (many approach cards) — Tab cycles inside modal; map keys still blocked by dialog role  
- Mid-width card grid / floor dead-ends unchanged  
- `confirmLocationComplete` still uses eager setState box pattern (works via React eager reducers; not rewritten this wave)  
