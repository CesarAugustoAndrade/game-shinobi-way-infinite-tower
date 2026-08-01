# Event UI Mockup QA — Split Layout

**Date:** 2026-08-01  
**Sources:** `src/scenes/activities/Event.tsx`, `Event.css`, `src/App.tsx` (`showExploreChrome` / `isEventScene`)  
**Scope:** Read-only layout QA vs intended mockup (left vertical poster, right choices). No code edits.

---

## 1. Layout: left vertical poster, right choices?

**Yes — matches the mockup on desktop.**

| Piece | Implementation |
|--------|----------------|
| Split grid | `.event__split` → `grid-template-columns: minmax(15rem, 0.92fr) minmax(18rem, 1.2fr)` |
| Left poster | `<aside className="event__poster">` with 3:4 frame, art + bottom scrim copy (tag / title / flavor / description) |
| Right decision | `<section className="event__decision">` path bar + scrollable choice list |
| Stage chrome | `isEventScene` → `center-stage--event`, sidebars hidden, full-bleed stage |

Comments in TS/CSS explicitly call this “mockup style.” Title/body live **on the poster** (not a separate left text column), which is the intended cinematic plate.

---

## 2. Risk rail colors present?

**Yes.**

- CSS tokens: `--ev-risk-safe` … `--ev-risk-extreme` (green → lime → orange → red → purple).
- Choice cards: `border-left: 5px solid var(--risk)` via `.choice-card--{safe|low|medium|high|extreme}`.
- Index chip + hover border use the same `--risk`.
- `RiskMeter` badge + 5-segment bar use the matching `--meter` color per `RiskLevel`.

---

## 3. Explore HUD I/C on EVENT?

**Yes — wired correctly.**

- `isEventScene = gameState === GameState.EVENT`
- `showExploreChrome = (isExplorationMap || isEventScene) && !!player && !!playerStats`
- `ExplorationHUD` renders when `showExploreChrome`; bag/character overlays gated the same way
- Global key handlers on EVENT: **I** bag, **C** character, **Esc** closes overlay
- Path bar also documents I / C (and 1–4 / Enter / Esc for choices)
- Location label + danger on HUD when `isEventScene`

---

## 4. Bugs / missing pieces / mobile stack

### Present & solid
- Two-step select → confirm (click / Enter); Esc deselects choice
- Chain ribbon (`event--chained` / “Ledger continues”)
- Hidden-path note when flags gate choices
- Staggered choice enter + `prefers-reduced-motion` fallback
- Outcome preview tooltip (hover / focus-within)

### Gaps / soft issues (not critical blockers)
1. **Mobile stack is intentional but not portrait** — `@media (max-width: 900px)` stacks poster above choices and switches poster to **16:10** landscape (`max-height: 48vh`). Mockup “vertical poster” only holds ≥900px.
2. **Outcome tooltips are hover/focus-only** — no tap-to-pin on touch; “Possible Outcomes” is easy to miss on mobile.
3. **Esc dual ownership** — Event deselects choice; App closes bag/character first when overlay open. Fine when overlay is open; when closed, Esc only clears selection (expected). No conflict once overlay owns Esc.
4. **Number keys only 1–4** — if an event ever exposes >4 available choices, extras have no digit shortcut (cards still clickable).
5. **Poster height vs choice column** — poster capped `min(78vh, 36rem)`; long choice lists scroll in `.event__choices` while poster stays fixed height — OK, but short viewports can feel top-heavy after stack.
6. **Confirm is second click / Enter only** — “Confirm ▸” is visual; no dedicated Confirm button (by design; document for UX review only).

### Not bugs
- Sidebars hidden on EVENT is intentional (same as explore maps).
- Blocking result modals correctly suppress I/C and close overlays.

---

## 5. Three concrete CSS/TS tweaks (document only)

### A. Touch-friendly outcomes (TS + CSS)
**Where:** `ChoiceCard` outcomes wrap in `Event.tsx`; `.choice-card__tooltip` in `Event.css`  
**What:** On narrow viewports, show outcomes inline under the cue (or toggle open on click) instead of absolute tooltip above the card.  
**Why:** Hover tooltips fail on touch; first outcome at top of list can clip under path bar.

### B. Preserve poster portrait slightly longer (CSS)
**Where:** `@media (max-width: 900px)` in `Event.css`  
**What:** Keep `aspect-ratio: 3 / 4` until ~640px, or use `aspect-ratio: 4 / 5` with a higher `max-height` before flipping to 16:10.  
**Why:** Stack at 900px currently kills the vertical poster language too early on tablets.

### C. Align Esc priority explicitly (TS)
**Where:** `Event.tsx` `handleKeyDown` vs `App.tsx` explore key effect  
**What:** In Event’s Esc handler, no-op when `document.querySelector('.explore-overlay')` is present (or skip when bag/character open).  
**Why:** Today App handles Esc for overlays; documenting/guarding in Event avoids double-handling if listener order ever changes.

---

## Summary scorecard

| Criterion | Status |
|-----------|--------|
| Left poster / right choices | **Pass** (desktop) |
| Risk rail colors | **Pass** |
| Explore HUD + I/C on EVENT | **Pass** |
| Mobile stack | **Pass with notes** (stacks; poster becomes landscape) |
| Critical bugs | **None found** |

**Verdict:** Split mockup is implemented and chrome-integrated. Ship-ready for desktop; polish mobile outcomes + poster aspect if matching mockup on tablet is a hard requirement.
