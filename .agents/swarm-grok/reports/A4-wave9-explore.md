# A4 WAVE9 — Exploración production verification

**Agent:** A4 WAVE9  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Leave location · rest/intel locks · backgrounds always · secret veiled UI  
**Verify:** `npx tsc --noEmit` — clean (exit 0)

## Mandate

1. Production-verify leave location, rest/intel Continue locks, always-on backgrounds, secret veiled UI  
2. Fix **NEW** bugs only (do not rework W7 leave wiring or W8 rest/intel modal locks)  
3. Report this file  
4. No git commit  

## Verification matrix

| Target | Verdict | Notes |
|--------|---------|-------|
| **Leave location** | OK + residual fixed | W7 wiring intact (`onLeaveLocation` → `handleLeaveLocation` → complete panel). Stage guard (`completePanelOpenRef`) intact. **NEW:** complete panel could double-execute leave meta on Enter (keydown + autofocus click). |
| **Rest / Intel locks** | OK (no change) | `RestResultModal` / `IntelResultModal` `closedRef` + App consume-first → single `returnToMap`. Map/I/C key guards include `.rest-result` / `.intel-result`. |
| **Backgrounds always** | OK (no change) | RegionMap + LocationMap: void `#050608` + scrim + plate + `background_map_exploring.png` fallback. Mission scenes: `combatBackground` via `resolveLaminaPaths` (default coastal harbor). Assets on disk (`location_*.png`, map/combat plates). |
| **Secret veiled UI** | OK + residual fixed | Card/preview/coach **Veiled signal** under fog (W7). Complete panel **Veiled routes surface**. **NEW:** `getCardDisplayInfo(NONE)` forced `isSecret: false` (UI only recovered via flags); type-only secrets could miss veiled tag. |

## What shipped

### 1. Leave path — LocationComplete one-shot Continue

| Layer | Change |
|-------|--------|
| **LocationCompleteModal** | `closedRef` + `dismiss()` — same pattern as Rest/Intel (Space/Enter keydown + autofocus button click only fires meta once) |
| **useLocationCards** | `completeExecuteLockRef` — hold until next panel stages; blocks same-tick double `executeLocationComplete` if Continue is invoked twice before commit |

Prevents double `locationsCleared++`, double deck redraw, and double region-boss callback when holding Enter on **Return to Region / Choose next destination**.

### 2. Secret veiled under fog — displayInfo honesty

| Layer | Change |
|-------|--------|
| **RegionSystem.getCardDisplayInfo** | `IntelRevealLevel.NONE` (and default) sets `isSecret` from `flags.isSecret` **or** `LocationType.SECRET` — name stays `???` |
| **LocationCardDisplay** | `isSecret` also checks `LocationType.SECRET` (defense in depth) |
| **RegionMap** | Selected secret preview/coach/CTA same type fallback |

Fogged secret destinations still show **Veiled signal** / Slip Off-Ledger without leaking the sealed name.

## Explicitly not done

- No git commit  
- No floor generation rewrite / backtrack redesign  
- No rework of W7 leave CTA / coach copy  
- No rework of W8 Rest/Intel modal locks (already correct)  
- No RewardModal / EventResultModal closedRef (outside this mandate’s rest/intel leave path)  
- No new unit tests  
- No PARTIAL intel tier rewire  

## Files touched

| File | Role |
|------|------|
| `src/components/modals/LocationCompleteModal.tsx` | One-shot dismiss lock (leave complete) |
| `src/hooks/useLocationCards.ts` | Execute-once ref for leave meta confirm |
| `src/game/systems/RegionSystem.ts` | Fog intel `isSecret` honesty |
| `src/components/exploration/LocationCardDisplay.tsx` | Type SECRET veiled tag fallback |
| `src/components/exploration/RegionMap.tsx` | Type SECRET selected veiled fallback |

## Smoke checklist (manual)

1. Clear exit → complete panel → hold Enter once: single region return / single locationsCleared bump  
2. Leave CTA / Space on cleared floor still stages complete panel once (W7 + W8 stage guard)  
3. Rest Continue once (hold Space): single chain, no double activity  
4. Intel Continue once: single `returnToMap`  
5. Region/Location map never blank (void underplate visible if plate slow)  
6. Fogged secret card: **Veiled signal** + name still `???`  
7. Select fogged secret: coach **Slip Off-Ledger** / veiled-signal prose  
8. `npx tsc --noEmit` clean  

## Residual risks

- Mid-width card grid / floor dead-ends unchanged (gen territory; no backtrack)  
- Reward / Event result modals still lack modal-level `closedRef` (consume patterns exist on some handlers; not re-audited this wave)  
- Exit-on-other-branch soft-stuck remains floor-gen design (forward-only diamond)  
- Fogged secret still hides true name until intel reveals — intentional  
