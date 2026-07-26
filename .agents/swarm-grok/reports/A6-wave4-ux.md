# A6 WAVE4 — UX Consistency Residual

**Agent:** A6 WAVE4 (UX consistency residual)  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Prior:** [A6-wave3-ux.md](./A6-wave3-ux.md) (parchment deleted, focus rust, GameGuide void)

## Goal

Close leftover party cyan/gold on non-map surfaces, unify Rest / Intel / Dice / EventResult modals under the same void chassis language as Reward / LocationComplete, and scrub residual shonen coach one-liners in `helpText`.

## What changed

### 1. Party cyan `#22d3ee` / gold `#fbbf24` — non-map purge

| Surface | Before | After |
|---------|--------|-------|
| `CharacterSelect` mind labels / ranks / int | Party cyan | Category mind purple; rank C fog; technique emerald (canon triad) |
| `ExplorationHUD` warn button | Amber / `#fbbf24` | Rust border + rust-light text |
| `layout.css` treasure-hunt chrome | `#fbbf24` | Rust-light |
| `shared.css` badge warning | `#fbbf24` | Rust-bg / rust-light |
| `treasure.css` (rewards) | Undefined `--sw-text-gold` → `#fbbf24` | Rust-light heat; scene title **bone** |
| Rest / Intel / Dice / EventResult | Teal / green / carnival gold | Void chassis (below) |

**Intentionally retained (map / token):**

- `exploration.css` wealth bars, treasure activity tags, map golds
- `--sw-room-current: #22d3ee` (map current room)
- `--sw-activity-merchant: #fbbf24` (map activity chip)
- `--sw-accent-tertiary: #fbbf24` (design-system accent slot)

Post-pass non-map hex grep for raw `#22d3ee` / `#fbbf24` under menus, modals, layout HUD, shared badges, treasure rewards: **0**.

### 2. Modal family — void chassis language

Shared language (matches `RewardModal` / `LocationCompleteModal`):

- Overlay: `rgba(5, 6, 8, 0.72)` void scrim  
- Panel: abyss → void gradient, metal border, **rust top edge**, hard `6px 6px 0` void shadow  
- Titles: **bone**  
- Body / flavor: **fog** / bone-dim  
- Primary CTA: rust-bg + rust border + bone label; **focus-visible** rust + bone hairline  
- Functional signals only: HP red / CP blue (Rest), trap danger red (Dice), up/down/curse (Event)

| Modal | Residual language | Fix |
|-------|-------------------|-----|
| **Rest** | Party green title/CTA; soft black plate | Void panel; bone title; rust CTA; HP/CP resource identity kept |
| **Intel** | Party teal phosphor (`#5eead4` / `#2dd4bf`) | Bone title; fog intel bar; rust fog-note; rust CTA |
| **Dice** | Carnival gold (`--sw-text-gold` undefined → gold) | Bone chrome; rust piece heat; danger trap; rust continue |
| **EventResult** | Event-gold panel / chain / focus | Void gradient; rust heat + chain ribbon; rust focus (not event-gold) |

**TSX hygiene:** Rest flavor → “Breath steadies. Steel cools. The path waits.”; removed duplicate `Enter` shortcut span.

### 3. helpText — residual shonen one-liners

| Entry | Before (shonen / guide) | After (cyber-ninja) |
|-------|-------------------------|---------------------|
| Clan strategies (5) | “Burst enemies…”, “control the battlefield” | Short path ledger lines |
| Difficulty ranks | “Beginner-friendly” / “Extreme danger” | Thin / usual / hard / maximum pressure |
| Crafting synthesis tip | “Experiment… discover new artifacts!” | “Unknown pairs still fuse…” |
| Crafting combine/disassemble | Utility shop copy | Fence / unmake voice |

Handbook STATS / EFFECTS / formulas left technical (reference manual, not first-run coach) — consistent with Wave2 residual note.

## Files touched

- `src/components/modals/RestResultModal.css`
- `src/components/modals/RestResultModal.tsx`
- `src/components/modals/IntelResultModal.css`
- `src/components/modals/DiceRollResultModal.css`
- `src/components/modals/EventResultModal.css`
- `src/scenes/menu/CharacterSelect.css`
- `src/components/layout/ExplorationHUD.css`
- `src/components/layout/layout.css`
- `src/components/shared/shared.css`
- `src/scenes/rewards/treasure.css`
- `src/game/constants/helpText.ts`
- `.agents/swarm-grok/reports/A6-wave4-ux.md` (this file)

## Verification

- `npx tsc --noEmit` → **exit 0**
- No combat math changes
- No commit (per mandate)

## Residual / optional follow-ups

- Map exploration still uses cyan room-current and gold wealth/treasure chips by design
- `ErrorBoundary` still has Tailwind `bg-cyan-600` utility (error recovery, not product chrome)
- Treasure scene has many rust-light accents after gold purge; optional pass to bone-primary + rust-only-for-ryo
- Event continue CTA copy already ledger-toned; no further TSX change required

## Success criteria

- [x] Non-map leftover `#22d3ee` / `#fbbf24` converted to fog/rust/bone where wrong
- [x] Rest / Intel / Dice / EventResult share void chassis language
- [x] helpText residual shonen one-liners revoiced
- [x] tsc clean; no commit
