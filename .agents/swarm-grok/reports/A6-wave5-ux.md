# A6 WAVE5 — UX Residual Minimal

**Agent:** A6 WAVE5 (UX residual minimal)  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A6-wave4-ux.md](./A6-wave4-ux.md) (modals void chassis, non-map cyan/gold purge, helpText)

## Goal

Close residual party tone on **Training** + **ScrollDiscovery** (result panels, chrome, copy), and confirm raw `#fbbf24` / `#22d3ee` live only as exploration map tokens (or design-system slots).

## What changed

### 1. Training — void/rust residual

| Surface | Before | After |
|---------|--------|-------|
| Dojo frame / icon / role | Body-orange party glow | Void plate + rust border/heat; bone role |
| Quote | Shonen: “Forge your body and spirit…” | “Steel remembers every toll. Spend vitality. Claim the mark.” |
| Resource cost preview | `--sw-accent-tertiary` (= `#fbbf24`) | Rust-light instrument heat |
| Intensity medium label | Accent tertiary gold | Rust-light |
| Intensity light/intense labels | Raw green/red hex | Risk-safe / risk-high tokens |
| Skip CTA | Soft frame | Metal border; rust hover; rust focus-visible |
| Result panel | Soft plate + **party gold** title/CTA (`#e8b84a`) | Void chassis (abyss→void, metal, rust top edge) |
| Result title / gain / continue | Gold / green phosphor / gold CTA | Bone title; rust gain heat; rust CTA + focus-visible |
| Result copy | “Training Complete” / “session” | “Session Sealed” / “drill” |

**Retained:** Body / Mind / Technique category borders on stat cards (canon triad). Focus chips remain mind-purple (shared Affinity/Focus language with Loot / Merchant / Scroll).

### 2. ScrollDiscovery — void/rust residual

| Surface | Before | After |
|---------|--------|-------|
| Header icons | Accent tertiary gold | Rust-light |
| Title / subtitle | Primary / muted | Bone / fog |
| Slot-full warning | Accent tertiary | Rust-light on rust-bg |
| Leave CTA | Underline whisper | Metal plate + rust hover/focus (parity Training skip) |
| Result panel | Soft plate + **party purple** continue | Void chassis (same Rest/Reward language) |
| Result art | Purple radial | Rust whisper over void |
| Result title / name | Purple phosphor | Bone / bone-dim |
| Chakra delta | Neon blue hex | Functional `--sw-chakra-color` only |
| Mode labels | “Technique Learned” / “Upgraded…” | “Seal Claimed” / “Seal deepened…” / “Overwrote…” |

**Retained:** Tier borders/names (advanced cyan / legendary rust / forbidden red) as skill-tier identity. Affinity/Focus theme chips shared with Merchant/Loot.

### 3. `#fbbf24` / `#22d3ee` grep (src)

| Location | Status |
|----------|--------|
| `exploration.css` wealth/treasure/training activity tags, map golds, room chips | **Intentional map tokens** |
| `_variables.css` `--sw-accent-tertiary`, `--sw-room-current`, `--sw-activity-merchant` | **Design-system slots** (map/merchant identity) |
| Training / ScrollDiscovery / menus / modals / layout HUD (raw hex) | **0** residual raw hits |

Indirect residual: some non-map surfaces still *reference* `--sw-accent-tertiary` (Merchant ryo heat, Loot victory title, treasure scene, handbook ranks). Out of wave5 minimal scope; map token values themselves left unchanged.

## Files touched

- `src/scenes/activities/Training.css`
- `src/scenes/activities/Training.tsx`
- `src/scenes/rewards/ScrollDiscovery.css`
- `src/scenes/rewards/ScrollDiscovery.tsx`
- `.agents/swarm-grok/reports/A6-wave5-ux.md` (this file)

## Verification

- `npx tsc --noEmit` → **exit 0**
- No combat math changes
- No commit (per mandate)

## Residual / optional follow-ups

- Merchant / Loot / treasure still use accent-tertiary gold for ryo/victory heat (economic gold identity; not raw map hex misuse)
- ExplorationHUD / LocationComplete scar chips still use `#e8b84a` (adjacent gold, not `#fbbf24`)
- ErrorBoundary Tailwind `bg-cyan-600` recovery button (not product chrome)
- Affinity theme chips stay sky-cyan across Merchant/Loot/Scroll (region identity, not room-current phosphor)

## Success criteria

- [x] Training + ScrollDiscovery residual tone → void / bone / rust chassis
- [x] Raw `#22d3ee` / `#fbbf24` only in exploration map + design-system map slots
- [x] tsc clean; no commit
