# Experience Polish Ledger — Pre-Combat V2

Updated: 2026-08-12

## Scope guard

- Goal: presentation, narrative, information hierarchy, assets, audio and motion polish.
- Frozen: gameplay calculations, stats, skills, combat workflow, enemy AI/configuration, RNG,
  progression, loot/synthesis formulas, save schema and Combat V2.
- Narrow exception: declarative event rewards may change only with before/after evidence and
  progression simulation.
- Existing working-tree changes are user-owned. In particular, deleted `loop/**` files must not be
  restored or recreated.
- No dependency installation, new unit tests, staging, commits or pushes.

## Baseline

| Check | Result | Evidence |
|---|---|---|
| Working tree | Pre-existing deletions only | `git status --short` lists deleted `loop/**` history/state files |
| Runtime dependencies | Blocked | `node_modules/` is absent |
| `npm run verify` | Blocked before typecheck | `tsc` is unavailable because dependencies are not installed |
| Syntax parse | Static PASS | Cached standalone esbuild parsed 25 changed TS/TSX and 14 changed CSS files; 0 failures |
| Existing production build | Unavailable | `dist/index.html` is absent |
| Browser journey | Blocked | No runnable dev server or reusable build without installing dependencies |
| Audio inventory | Confirmed absent | No `.mp3`, `.wav`, `.ogg`, `.m4a` or `.flac` files under `public/` |

The blocked gates are baseline conditions, not regressions introduced by this polish pass. A cached
standalone TypeScript binary was also attempted, but without React/Vite/Vitest packages or their type
definitions it produced dependency-cascade errors and cannot substitute for the project gate. No topic
may be marked runtime-verified until the relevant deterministic and browser gates can run.

## Audit status

| Discipline | Status | Notes |
|---|---|---|
| UI / tooltips / accessibility | Audited statically | Shared portal, native titles, modal focus, density and reduced-motion inspected; runtime pending |
| Events / narrative / rewards | Audited statically | 43 events, 166 choices and 257 outcomes inventoried; reward payloads intentionally unchanged |
| Assets / enemies / backgrounds | Audited statically | 53 enemy manifest entries valid; 44 alpha cutouts inspected by metadata; 14 complete biome stacks |
| Audio / motion | Audited statically | Audio absence confirmed; motion selectors inventoried and patched; runtime pending |

## Topic ledger

| ID | Priority | Topic | Status | Evidence / gate |
|---|---|---|---|---|
| EP-001 | P0 | Isolate event choice keyboard navigation | Static PASS | 1–9 + arrows replace colliding A/S/D/Z/X/C; overlays suspend shortcuts; independent review 88/100 |
| EP-002 | P0 | Remove false narrated stat thresholds | Static PASS | 25 misleading 12–22 thresholds removed while real `requirements` remain unchanged; narrative 91, UX 87, integrity 98 |
| EP-003 | P1 | Accessible shared Tooltip + honest event outcome inspection | Static PASS | Four-side flip/clamp, reposition, focus/F2/Escape, ARIA, scrollable portal and hotkey isolation; presentation 91, UX 92, accessibility 90, integrity 92 |
| EP-004 | P1 | Correct combat biome routing and connect parallax layers | Static PASS | Correct `/assets/locations/` regex; 56/56 referenced files exist across 14 stacks; presentation 89, integrity 97 |
| EP-005 | P1 | Focus-safe reward decisions | Static PASS | Loot/treasure/forget dialogs trap/restore focus and suspend scene shortcuts under overlays; accessibility 94, integrity 95 |
| EP-006 | P1 | Complete reduced-motion coverage on audited surfaces | Static PASS | Persistent pulses and scene entrances disabled while static borders/color/status remain; accessibility 94, integrity 96; formal CSS/browser gate blocked |
| EP-007 | P1 | Replace critical native map hints with progressive inspection | Static PASS | Room/location/HEAT details use the shared tooltip, concise permanent ARIA summaries and isolated shortcuts; UX 93, accessibility 92, integrity 94 |
| EP-008 | P1 | Deterministic overlay/shortcut ownership and visible slider focus | Static PASS | Bag owns topmost Escape; App state blocks HUD and scene shortcuts under decisions; slider restores focus-visible; UX 91, accessibility 90, integrity 92 |
| EP-009 | P1 | Compact clan inspection hierarchy | Static PASS | Starting strategy, signature kit and nine exact stats remain in five concise rows; duplicate native titles removed; UX 91, accessibility 90, integrity 92 |
| EP-010 | P0 | Deterministic exploration click, focus and shortcut ownership | PASS | Region/location maps ignore Enter/Space from focused controls; map interaction becomes inert under overlays/dialogs; Bag/Character are mutually exclusive; selected cards own Enter activation; HUD buttons expose disabled state while blocked; `npm run verify` green |

## Confirmed findings not closed in this pass

| Priority | Surface | Finding / decision |
|---|---|---|
| P1 | Information architecture | Native `title=` remains widespread (119 TSX uses at baseline). Critical room, location, HEAT, event, item and clan surfaces were migrated; the remaining long tail still needs browser-led review. |
| P1 | Maps | Region/Location headers, previews and terrain panels repeat information. Requires browser-led density editing to avoid hiding irreversible costs or risks. |
| P1 | Later arcs | Only 14 of 53 authored biome names have complete painted background + mid/fg stacks. Arc-level fallbacks now prevent known 404s; unique art is an external production need. |
| P1 | Event continuity | Static audit found several SAFE/exit/chain/flag inconsistencies. They are documented but deliberately untouched because fixing them would change gameplay paths or Event Engine state. |
| P2 | Tooltip density | Combat skill sheets still exceed the intended 2–4 mechanical rows. They need a Combat V2-aligned inspection-panel redesign rather than indiscriminate truncation. |
| P2 | Assets | Some portrait aliases intentionally reuse art; visual distinctness and crop/halo quality still need runtime review before replacement or generation. |

## Functional invariants checked

- No changes to stats, formulas, skills, enemy definitions/AI, turn/AP/posture/distance systems,
  RNG, spawn rates, terrain modifiers, loot/crafting/synthesis formulas, progression or saves.
- Event reward payloads, outcome weights, flags, requirements and combat triggers are unchanged.
- Combat V2 architecture is untouched; combat work is limited to background routing and existing
  presentational layers.
- No assets generated, dependencies installed, tests created, files staged, commits made or pushes
  performed.
- Event reward payloads were not changed, so the reward-specific simulation exception was not invoked.

## Visual evidence

- Runtime screenshots are unavailable because no runnable dependency tree or prior `dist/` exists.
- Required future matrix: 1920×1080 and 1366×768, keyboard-only, reduced motion, four viewport
  edges, long labels, console errors and network 404s.

## Deferred external needs

- A dependency restore decision is required before TypeScript, lint, test, build and browser gates
  can run. The current mandate explicitly prohibits installing dependencies.
- Audio implementation requires original or licensed source material of production quality. Empty
  APIs, copyrighted extracts and placeholder bleeps are out of scope.
- Thirty-nine authored biome identities need original painted background/midground/foreground sets
  for full location-level visual variety; the current safe fallback is intentionally per arc.

## Worktree handoff

- Product changes: 39 tracked files modified plus this ledger as the only new untracked file.
- User-owned `loop/**` deletions remain present and untouched.
- Staging area is empty. No commit, push or merge was performed.

### Modified product files

- Orchestration: `src/App.tsx`.
- Character/combat: `PlayerHUD.tsx`, `Hand.tsx`, `SkillCard.tsx`, `SkillCard.css`.
- Exploration: `ActivityIcons.tsx`, `LocationCardDisplay.tsx`, `LocationMap.tsx`,
  `RegionMap.tsx`, `RoomCard.tsx`, `exploration.css`.
- Inventory/layout/modals: `Bag.tsx`, `EquipmentPanel.tsx`, `inventory.css`,
  `CharacterSheetOverlay.tsx`, `InventoryOverlay.tsx`, `exploreOverlays.css`,
  `StatAssignModal.css`, `eventOutcomeChanges.ts`.
- Shared presentation: `ArtIcon.tsx`, `Tooltip.tsx`, `shared.css`,
  `src/styles/design-system/index.css`, `useFocusTrap.ts`.
- Event content: `wavesArcEvents.ts`, `rogueArcEvents.ts`, `warArcEvents.ts`.
- Scenes: `Event.tsx`, `Event.css`, `Merchant.css`, `CharacterSelect.tsx`,
  `CharacterSelect.css`, `MainMenu.css`, `Loot.tsx`, `Loot.css`,
  `ScrollDiscovery.tsx`, `ScrollDiscovery.css`, `TreasureChoice.tsx`, `treasure.css`.

## Post-baseline addendum — Waves Arc visual production (2026-08-12)

This section supersedes the earlier dependency/runtime blockers for the current worktree. The original
baseline above is retained as historical evidence of the state in which the experience-polish pass began.

| Check | Current result | Evidence |
|---|---|---|
| Generated visual set | PASS | 89/89 approved: 13 location cards, 14 scenic plates, 14 combat backgrounds, 28 RGBA parallax layers and 20 event posters |
| Runtime integration | PASS | All approved outputs copied to their canonical `public/assets/` routes; cards are true JPEG rather than renamed PNG |
| Binary fidelity | PASS | 76/76 staged PNG files match their runtime copies by SHA-256; 13/13 JPEG cards decode as 1254x1254 JPEG |
| HTTP asset routes | PASS | 89/89 runtime URLs return HTTP 200 from Vite with the expected image MIME type |
| Alpha layers | PASS | All 28 MID/FG files are 1672x941 `Format32bppArgb`; transparent corners and chroma removal were checked before integration |
| `npm run verify` | PASS | TypeScript, CSS lint, 26 test files / 468 tests, production build and dist budget all pass |
| Browser journey | Environment-blocked | The in-app/extension browser list is empty in this session; no substitute browser backend was used |

Prompt source and production decisions live in `docs/event-poster-prompts-waves.md`; the complete
generation ledger and approved staging set live in `scratch/waves-arc-imagegen/`. No stats, skills,
formulas, enemy behavior, event rewards or gameplay paths were changed by this visual production wave.
