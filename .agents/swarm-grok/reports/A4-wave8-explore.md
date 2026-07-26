# A4 WAVE8 — Exploración final residual

**Agent:** A4 WAVE8  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Final residual explore hunt after W7 leave-location stuck floor  
**Verify:** `npx tsc --noEmit` — clean (exit 0)

## Mandate

1. Hunt **NEW** residual exploration bugs only  
2. W7 already fixed leave location stuck floor — do not rework  
3. Fix only confirmed issues  
4. Report this file  

No floor gen rewrite. No commit.

## Hunt results

| Target | Verdict | Action |
|--------|---------|--------|
| **Leave location stuck floor** | Already fixed W7 | Not re-touched (`onLeaveLocation` wiring + coach/CTA) |
| **Rest / Intel double Continue** | Confirmed residual | Space hold / Enter+click fired `returnToMap` twice → double activity chain (`setTimeout` ×2) |
| **Complete panel double-stage** | Confirmed residual | Leave CTA + auto `returnToMap` could both stage `LocationCompleteModal` same tick |
| **Intel Gathering tag missing** | Confirmed residual | RoomCard showed intel icon; selected-room panel listed every activity **except** `infoGathering` |
| **RoomCard exit title honesty** | Confirmed residual | Cleared exit / current still said “defeat Guardian” / “enter to resolve” |
| **Stale room pointer on deploy** | Confirmed mild residual | Entering a new site did not clear `selectedBranchingRoom` from prior activity residue |
| **Approach keyboard / bag under modals** | Already fixed W6 | Not re-touched |
| **Secret veiled signal under fog** | Already fixed W7 | Not re-touched |
| **Floor dead-ends / no backtrack** | Gen territory | Not rewritten (same as W4–W7) |

## What shipped

### 1. Rest / Intel double Continue → double `returnToMap`

| Layer | Change |
|-------|--------|
| **RestResultModal** | `closedRef` + `dismiss()` — one Continue only (key + button) |
| **IntelResultModal** | Same pattern |
| **App.tsx** | Consume-first `setRestResult` / `setIntelResult` before `returnToMap` (eager updater box, parity EventOutcome / Reward) |

Prevents double activity chain when Space is held or Enter+click lands same tick after rest/intel payoff.

### 2. Location complete panel double-stage guard

| Layer | Change |
|-------|--------|
| **useLocationCards** | `completePanelOpenRef` — stage once until Continue executes |
| **handleLeaveLocation** | No-op while panel already staging |
| **confirmLocationComplete** | Clears ref after consume, then `executeLocationComplete` |

Covers leave CTA + auto complete race after exit clear (W7 leave path still works; only duplicate stage blocked).

### 3. Intel Gathering honesty on LocationMap

Selected room activity list now includes **Intel Gathering** (+gain %) with teal `--intel` tag style. Matches RoomCard radio icon + `ACTIVITY_FULL_NAMES.infoGathering`.

### 4. RoomCard title honesty (post-clear)

| State | Title |
|-------|--------|
| Exit cleared | **Guardian fallen — location exit cleared** |
| Room cleared | **Room cleared** |
| Current, open | You are here — enter… (unchanged) |
| Exit open | Exit room — defeat the Guardian… (unchanged) |

### 5. Deploy hygiene

`handleEnterSelectedLocation` clears `selectedBranchingRoom` before building the new floor so prior approach/activity room ids cannot leak into the next site.

## Explicitly not done

- No git commit  
- No floor generation rewrite  
- No new unit tests  
- No approach keyboard rework (W6)  
- No leave-location rework (W7)  
- No backtrack / dead-end floor redesign (gen territory)  
- No PARTIAL intel tier rewire  

## Files touched

| File | Role |
|------|------|
| `src/components/modals/RestResultModal.tsx` | One-shot dismiss lock |
| `src/components/modals/IntelResultModal.tsx` | One-shot dismiss lock |
| `src/App.tsx` | Consume-first rest/intel close → `returnToMap` |
| `src/hooks/useLocationCards.ts` | Complete panel stage ref · leave guard · clear room on enter |
| `src/components/exploration/LocationMap.tsx` | Intel Gathering activity tag |
| `src/components/exploration/exploration.css` | `--intel` tag color |
| `src/components/exploration/RoomCard.tsx` | Cleared exit/room titles |

## Smoke checklist (manual)

1. Rest room → Continue once (hold Space): single chain / single complete panel  
2. Intel room → Continue once: single `returnToMap`  
3. Exit clear → reward/loot → complete modal once (leave CTA does not re-open a second panel)  
4. W7 leave path still works when map lands with exit already cleared  
5. Room with intel gathering: selected panel shows **Intel Gathering (+N%)**  
6. Cleared exit card title never says “defeat the Guardian”  
7. Deploy into new location: no stale approach room from previous site  
8. `npx tsc --noEmit` clean  

## Residual risks

- Mid-width card grid / floor dead-ends unchanged (gen territory; no backtrack)  
- `confirmLocationComplete` still uses eager setState box (works in event handlers; now paired with `completePanelOpenRef`)  
- Exit-on-other-branch soft-stuck remains floor-gen design (forward-only diamond)  
- Treasure / dice modals already had consume patterns — not re-audited beyond explore path  
