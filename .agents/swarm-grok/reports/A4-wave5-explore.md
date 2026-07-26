# A4 WAVE5 — Exploración residual minimal

**Agent:** A4 WAVE5  
**Branch:** develop (no commit)  
**Date:** 2026-07-23  
**Scope:** Narrow-width overflow/clip residual · secret path copy still mysterious · tiny polish only  
**Verify:** `npx tsc --noEmit` — clean (exit 0)

## Mandate

1. Smoke-read RegionMap / LocationMap for remaining overflow/clip at narrow widths  
2. Ensure secret path copy stays mysterious, not broken English  
3. Tiny polish only  
4. Report this file  

No floor gen rewrite. No commit. W4 already fixed CTA / keyboard / void plates.

## Smoke read (pre-fix)

| Surface | Residual risk at narrow |
|---------|-------------------------|
| **Region cards grid** | Fixed `repeat(3, 1fr)` squeezed identity rows / biome quotes |
| **Region footer** | Progress + keys side-by-side, no wrap → horizontal clip |
| **Region title** | `text-4xl` + ultra tracking on long arc names |
| **Location header** | Title/stats row no wrap; title no ellipsis |
| **Selected room panel** | Info + CTA side-by-side without stack |
| **Diamond map** | Large mid-row gap + fixed room tiles could clip |
| **Card biome quote / feature / terrain** | Missing ellipsis on image label + footer |

Wave4 identity chips / void plates / deploy CTA remain solid — not reworked.

## What shipped

### 1. Narrow-width overflow residual

Base guards + media breakpoints in `exploration.css` only:

| Layer | Change |
|-------|--------|
| Card biome quote | Side inset + ellipsis |
| Terrain value / feature text | `min-width: 0` + ellipsis |
| Room card name | 2-line clamp |
| LocationMap header | Wrap + `min-width: 0`; title ellipsis |
| LocationMap stats | Flexible, full-width on phone |
| Selected room row | Wrap; desc `overflow-wrap`; CTA full-width ≤40rem |
| Region title | Word-break + smaller type ≤56rem |
| Region footer | Flex-wrap; column stack ≤40rem |
| Cards grid | Single column ≤40rem (no 3 skinny columns) |
| Diamond gaps / room tiles | Reduced padding/gap; tiles `6.25×8.25rem` ≤40rem |
| Fog / void plates | Slightly smaller min-widths on phone |

Breakpoints: **56rem** (tablet squeeze), **40rem** (phone stack).

### 2. Secret path copy (mysterious, grammatical)

| Before | After |
|--------|-------|
| CTA **Slip Into Route** (broken article) | **Slip Off-Ledger** |
| Log `Secret location revealed: X!` | `A veiled route surfaces: X.` |
| Log `You uncovered a secret route to X!` | `You uncovered a path off the ledgers: X.` |
| `colorHelpers` SECRET label `Secret` | `Veiled Route` (aligned with RegionSystem) |

**Unchanged (already clean):**

- Coach: *Veiled route confirmed. Space / Enter to slip off the ledgers.*  
- Preview: *Slip into {name} — off the ledgers*  
- Chips: **Veiled** / **Veiled route** · title *Unmarked path — not on the official route*  
- Feature / type: **Veiled Route** · **Unmarked Path**  
- LocationMap veiled chip + LocationComplete **Secrets uncovered**

### 3. Explicitly not done

- No git commit  
- No floor generation rewrite  
- No unit tests  
- No PARTIAL intel tier rewire  
- No new assets / laminas  
- Did not touch W4 keyboard/CTA/void-plate logic  

## Files touched

| File | Role |
|------|------|
| `src/components/exploration/exploration.css` | Narrow overflow residual · ellipsis guards · media queries |
| `src/components/exploration/RegionMap.tsx` | CTA label Slip Off-Ledger |
| `src/hooks/useLocationCards.ts` | Veiled unlock log lines |
| `src/hooks/useActivityHandlers.ts` | Veiled unlock log line |
| `src/utils/colorHelpers.ts` | SECRET type label → Veiled Route |

## Smoke checklist (manual)

1. RegionMap ~360px: cards stack 1-up; identity/biome no horizontal scroll  
2. Region footer: progress + keys wrap / stack; progress bar visible  
3. Long region title wraps without clipping frame  
4. LocationMap: long place name ellipsizes; Scar/Veiled chips stay; stats wrap under title  
5. Selected room: CTA stacks under prose on phone  
6. Diamond 2-path row: both room tiles fully visible (no clip)  
7. Secret card: CTA **Slip Off-Ledger**; coach/preview still “off the ledgers”  
8. Unlock logs read as veiled ops language (not “Secret location revealed!”)  
9. `npx tsc --noEmit` clean  

## Residual risks

- Mid-width (~42–55rem) still keeps 3-column card grid — intentional; only phone forces 1-col  
- `-webkit-line-clamp` on room names is WebKit-friendly; non-WebKit falls back to overflow hidden  
- Unlock log strings are presentation-only; systems/tests that assert exact log text (if any) would need update — none found in scope  
