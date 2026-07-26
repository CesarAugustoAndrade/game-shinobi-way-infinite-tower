# A4 WAVE7 — Exploración residual bug hunt minimal

**Agent:** A4 WAVE7  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Stuck floor complete · secret path UI residual  
**Verify:** `npx tsc --noEmit` — clean (exit 0)

## Mandate

1. Hunt NEW residual exploration bugs (stuck floor complete, secret path UI)  
2. W6 already fixed approach keyboard traps — do not rework  
3. Fix only confirmed issues  
4. Report this file  

No floor gen rewrite. No commit.

## Hunt results

| Target | Verdict | Action |
|--------|---------|--------|
| **Stuck floor complete** | Confirmed soft-stuck residual | Exit cleared but LocationMap still said “defeat Guardian”; `handleLeaveLocation` existed and was destructured in App but **never wired**; Space/Enter no-op’d with no open paths |
| **Secret path UI** | Confirmed residual | Fogged (NONE intel) secret cards looked identical to normal fog — no “veiled signal”; after LocationComplete “Veiled routes surface”, player could not map unlock → card |
| **Approach keyboard traps** | Already fixed W6 | Not re-touched (modal guard + ApproachSelector dialog/focus trap) |
| **LocationComplete secret copy** | W6 copy OK | Tiny a11y/key polish only (`role=status`, stable list keys) |

## What shipped

### 1. Stuck floor complete — escape hatch + honest map copy

When `isFloorComplete(branchingFloor)` (exit room cleared):

| Layer | Before | After |
|-------|--------|-------|
| Coach | “Floor exit — defeat the Guardian…” on cleared exit | **Location cleared. Space / Enter — return to the ops table…** |
| Header hint | Always “find and defeat the Guardian” once exit known | **Exit cleared — return to the ops table when ready** |
| Diamond exit plate | Same defeat-Guardian string while cleared | **Guardian fallen — location clear** |
| CTA | Only “Cleared” span | **Return to Region** (Enter shortcut) |
| Keyboard | Space/Enter fell through → no-op | Calls `onLeaveLocation` → same complete modal path as auto-finish |
| App wiring | `handleLeaveLocation` dead | `onLeaveLocation={handleLeaveLocation}` on LocationMap |

Auto-complete via `returnToMap` / rewards still stages `LocationCompleteModal` first. Leave CTA is the recovery path if the player lands on the map with floor already complete (stale path, reward edge, etc.).

### 2. Secret path UI — veiled signal under fog (no name leak)

| Surface | Change |
|---------|--------|
| **LocationCardDisplay** (mystery + secret) | Identity chip **Veiled signal**; footer *Signal fogged · veiled route (name sealed)* |
| **RegionMap** mystery preview | **Veiled signal** chip when flags mark secret |
| **RegionMap** coach / CTA | Mystery+secret → veiled-signal coach + **Slip Off-Ledger** (not generic Deploy into Fog only) |
| **RegionMap** preview prose | *Veiled signal in the fog — name sealed…* |
| **LocationCompleteModal** | Secrets block `role="status"`; list keys `veiled-${index}-${name}` |

Still mysterious: no name / danger fabricated under fog. Aligns with complete-panel “Veiled routes surface” so unlocks remain findable on the ops table.

### 3. Explicitly not done

- No git commit  
- No floor generation rewrite  
- No new unit tests  
- No approach keyboard rework (W6)  
- No PARTIAL intel tier rewire  
- No new assets / laminas  

## Files touched

| File | Role |
|------|------|
| `src/components/exploration/LocationMap.tsx` | Floor-complete detect · leave CTA · coach/hint/exit copy · keyboard leave |
| `src/components/exploration/exploration.css` | Leave CTA + clear exit message styles |
| `src/App.tsx` | Wire `onLeaveLocation={handleLeaveLocation}` |
| `src/components/exploration/LocationCardDisplay.tsx` | Fogged veiled signal chip + footer |
| `src/components/exploration/RegionMap.tsx` | Mystery+secret coach/CTA/preview chips + prose |
| `src/components/modals/LocationCompleteModal.tsx` | Secret unlock a11y/keys polish |

## Smoke checklist (manual)

1. Clear exit guardian → reward/loot close → LocationComplete modal still appears (auto path)  
2. If still on LocationMap with exit cleared: coach says **location cleared**; CTA **Return to Region**  
3. Space/Enter on cleared floor opens complete panel (not silent no-op)  
4. Hint/exit plate never say “defeat Guardian” after clear  
5. Clear a site that unlocks a secret → complete panel **Veiled routes surface** + name + **off the ledgers**  
6. Fogged secret card shows **Veiled signal** (not bare ??? only); name still sealed  
7. Selecting fogged secret: coach/CTA **Slip Off-Ledger** / veiled-signal prose  
8. Approach open: Space/Enter still does **not** re-enter room (W6 intact)  
9. `npx tsc --noEmit` clean  

## Residual risks

- `confirmLocationComplete` still uses eager setState box pattern (works via React event-handler updaters; not rewritten)  
- Mid-width card grid / floor dead-ends unchanged (gen territory)  
- Fogged secret still hides true name until intel FULL — intentional  
- Leave CTA can sit under result modals briefly; map keys still blocked by dialog guards while modals open  
