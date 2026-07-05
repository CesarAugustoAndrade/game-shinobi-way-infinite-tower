# Changelog

All notable changes to SHINOBI WAY: THE INFINITE TOWER will be documented in this file.

## [Unreleased]

### Added (T-015 attempt 2)

- **LevelSystem.ts** (`src/game/systems/LevelSystem.ts`): extracted `applyLevelUp(player): Player` as the single source of truth for level-up logic, shared by `App.tsx` and `CampaignSimulator`. Fully immutable — each while iteration creates a new Player via spread (never mutates input or shallow copy). App.tsx `checkLevelUp` now delegates the data transform to `applyLevelUp` (preserving UI side-effects: addLog, levelUpInfo). 20 new parity tests in `LevelSystem.test.ts` covering all clans, multi-level-up, immutability, and the CLAN_GROWTH contract.
- **simulatorUtils.ts** (`src/simulation/simulatorUtils.ts`): shared `prepareForCombat` and `pickNextRoom` extracted from the copy-paste between LocationSimulator and CampaignSimulator. Both simulators now import from this single module; local copies removed.
- **getEffectiveAtk** in `StatSystem.ts`: `getEffectiveAtk(player): number` added as the canonical formula for effective ATK (physical/elemental/mental) per player element. CampaignSimulator uses this instead of its previously hardcoded local function.
- **CampaignSimulator**: (1) Bug fix: `player.locationsCleared` now propagated after each cleared location (`player = { ...result.player, locationsCleared }`) — without this, `generateEnemy` received progressionMult=1.0 for all locations, making enemies 16-20% weaker than the real game; (2) `merchantMarkupMultiplier` field in CampaignConfig (default 1.5) — price = `Math.floor(item.value × markup)` approximates real merchant pricing; (3) `simulateMerchant` exported for unit testing; (4) `deathRate` + `incompleteRate` fields added to CampaignAggregate; (5) `playerLocationsCleared` snapshot per location in LocationStats; (6) Report: width 72 (matching LocationSimulator), units on power-curve headers ("HP pts"/"stat pts"), PRNG-noise and level-comparability caveats printed in header, INCOMPL column in section [7]; (7) Docblock corrected (was claiming `runCampaignComparison` and "byte-identical PRNG" — both false). 4 new tests: `simulateMerchant` (no-buy, buy+equip, markup gate) + `simulateCampaignRun` locationsCleared propagation.

### Added (T-015)

- Campaign Simulator: multi-location run with full itemization. New `src/simulation/CampaignSimulator.ts` chains N locations with carry-over of HP/chakra/ryo/equipment/XP across the campaign. Key additions: (1) `scoreItem()` — element-affinity-weighted heuristic scoring (spirit×3 for elemental builds, strength×3 for physical, intelligence×3 for mental). (2) `tryEquipOrSell()` — deterministic IA that equips an item if it improves the worst equipment slot score, sells otherwise. (3) `simulateCampaignLocation()` — full location room loop with optional itemization: combat wins drop loot, treasure rooms drop components, merchant rooms generate stock and auto-buy upgrades; XP/ryo granted per combat via `calculateLocationXP` / `calculateLocationRyo`. (4) `runCampaignSimulation()` — runs the same seed with items ON and OFF (`installSeededRandom` reset between batches for fair comparison), then prints a 7-section report: clear rate by depth (with/without items), gear delta comparativa, power curve (effective HP and ATK), ryo economy. New npm scripts: `simulate:campaign` and `simulate:campaign:quick`. New `--campaign` CLI mode in `src/simulation/index.ts` with `--locations`, `--start-danger`, `--runs`, `--level`, `--difficulty`, `--no-elite`, `--quick`, `--seed` flags. 0 TypeScript errors · 273/273 tests · all existing simulate scripts regression-free.

### Added

- Combat stage parallax + CRT upgrade (T-013): three-layer parallax system and full CRT overlay added to `CinematicViewscreen` on top of the T-014 Buriedbornes stage. (1) **Parallax láminas**: the existing biome background (`location_*.png`) becomes Lámina 1 with a very slow ambient CSS `translateX` drift (40 s loop); two new optional layers — Lámina 2 middleground (`lamina_mid_<biomeSlug>.png`) at medium speed (25 s) and Lámina 3 foreground (`lamina_fg_<biomeSlug>.png`) at the fastest (18 s, z 11, in front of the enemy for occlusion depth). All three use pure CSS `@keyframes` (no JS scroll tracking); `prefers-reduced-motion: reduce` stops all animations. When mid/fg props are absent (default, since assets don't exist yet), no `<img>` elements are rendered — zero 404s. `onError` silently hides any layer that fails to load. (2) **CRT frame**: new `.cinematic__crt-frame` div (z 5) with double inset `box-shadow` to simulate CRT spherical screen curvature; rendered only when `FeatureFlags.ENABLE_CRT_OVERLAY` is `true` (default ON). The flag is added in `src/config/featureFlags.ts`. Existing scanlines (z updated 3 → 4) and vignette are preserved. (3) **Cutout wiring**: `Combat.tsx` now derives `enemyCutout = enemy.image.replace('/assets/enemy_', '/assets/enemy_cut_')` (only when image starts with `/assets/enemy_`) and passes it to `CinematicViewscreen`. When cutout files don't exist yet, `onError` falls back to the portrait with mask (zero regression). (4) **Chakra aura on cutouts**: when the `--cutout` variant is active, the enemy sprite gets two stacked `drop-shadow` filters — an outer glow at the element's color (derived from `ELEMENT_COLORS[enemy.element]` → RGBA 65% opacity via `hexColorToRgba`) and an inner white halo; set as `--chakra-aura` CSS variable from Combat.tsx. Portrait fallback has no aura. Both sprite variants gain `image-rendering: pixelated`. **Asset convention** documented in `CinematicViewscreen.css` header and TSDoc comments. z-index layer map updated (mid z 1 inserted, gradient z 1 → 2, vignette z 2 → 3, scanlines z 3 → 4, CRT frame z 5 new, fg z 11 new; enemy z 10 and panel z 20 unchanged). Dead code: none (fully additive). 0 TypeScript errors · 254/254 tests · build OK · 0 CSS lint errors.

### Changed

- Combat deck redesign (T-014 v4 — deck band compaction): the deck below the stage goes from 5 stacked rows (tall PlayerHUD / econ bar / keyboard hints / hand / turn-control row) to 2 visual bands. Band 1 is a command bar: new `compact` variant of `PlayerHUD` (opt-in prop; map screens keep the roomy default) — 2.25rem avatar, name + Lv chip and thin HP/CP bars on a single line, XP reduced to a 3px sliver pinned to the strip's bottom edge — fused with the econ cluster (AP pips · stance · passives · keyboard whisper · Auto · End Turn) right-aligned in the same row. Band 2 is the hand: deck width cap removed (`--cb-info-max-w` deleted, deck now full-width like the stage) so the 4-column card grid stretches edge to edge, and cards grow to 8.5rem tall on ≥1024px. The standalone keyboard-hints row and the separate turn-control row are deleted — cards already carry Z/X/C/V badges; a muted `SPACE end · TAB auto` whisper (desktop-only) lives in the econ cluster; Auto/End Turn buttons moved into the command bar (End Turn padding tightened to match). Freed vertical space goes to the stage automatically (row `1fr`). Mobile intact: zero horizontal overflow at 390px, icon-only postures, hand scroll-snap strip; compact HUD stacks name above bars and the econ cluster spreads full-width below the HUD. Dead CSS removed: `combat__hints`, `combat__hint`, `combat__controls`, `--cb-info-max-w`. Stage/panel/enemy compositing untouched. 0 TypeScript errors · 254/254 tests · build OK · 0 CSS lint errors.

- Combat screen cinematic overhaul (T-014 v3 — final): floating enemy info panel overlaid on the LEFT of the cinematic stage, replacing the old `combat__enemy-info` row below the stage. Panel has 5 rows matching the reference image: (1) target icon + Silkscreen name (ellipsis on overflow) + `Lv. N` badge; (2) tier tag (red chip) + affinity badge (element color + icon); (3) PHYS / ELEM / MND defense columns with icons and color coding (orange/purple/blue); (4) STATUS EFFECTS — 4 square slots (empty `+` or buff chip with turn counter, full tooltip on hover) — and INFO — archetype description from constants; (5) HP label + VT323 large current/max in red + bar. Buff chips removed from the top-right stage corner (old `cinematic__buffs`) and consolidated into the status-effects section. Enemy sprite repositioned from centered card to RIGHT-anchored, bottom-anchored scene element: portrait images use a radial `mask-image` that blends all edges into the background (no card frame, no box-shadow); transparent cutout sprites (`/assets/enemy_cut_<id>.png`) supported via `enemyCutout` prop rendered without the mask. `CinematicViewscreen` props cleaned up: `buffContent` removed (dead), `floatingPanel` added (the panel slot), `enemyCutout` added (cutout-vs-portrait logic with `onError` fallback). `Enemy` type gains optional `archetype` and `dangerLevel` fields; `EnemySystem.generateEnemy()` sets both on every generated enemy. Archetype descriptions and element icon/color maps live in `src/game/constants/enemyArchetypes.ts` (not hardcoded in the component). Mobile overflow root cause fixed: `combat` grid is now 2-row (enemy-info row gone), `overflow-x: hidden` on root, `min-width: 0` on all flex/grid children that contain text, panel is `position: absolute` inside the stage so it cannot trigger document-level horizontal scroll. Dead CSS removed: all `combat__enemy-info*`, `combat__enemy-name`, `combat__enemy-tags*`, `combat__enemy-hp*`, `combat__enemy-defense*`, `combat__buff`, `combat__buff--*`, `combat__buff-duration--*`, `cinematic__enemy-card`, `cinematic__enemy-img`, `cinematic__buffs` (10 classes and their variants). 0 TypeScript errors · 254/254 tests · build OK · 0 CSS lint errors.

- Combat screen cinematic overhaul (T-014 v2 — Buriedbornes pixel-arcade): full redesign of the combat stage. Layout is now a 3-row grid (`1fr auto auto`: stage / enemy-info bar / deck); `max-width` is on the content rows, not the root, so the stage is edge-to-edge within its container. `CinematicViewscreen` rewritten with new props (`enemyImage`, `backgroundImage`, `buffContent`) and five explicit layers: biome background (object-cover, opacity 0.42, no blur) + dark gradient + vignette + scanlines (always visible, opacity raised) + enemy portrait card (`min(360px, 52vw)`, 2px `--sw-frame` border, `4px 4px 0 var(--sw-hard)` shadow, mask-image bottom-25% fade). On `<img onError>` the background image hides and the CSS gradient fallback (`#0c0e1a → #05070c`) with scanlines shows through. Buff chips (`buffContent`) render top-right inside the stage (dramatic placement). Enemy stats moved out of `CinematicViewscreen` to a new `combat__enemy-info` bar (row 2): name + tags on the left, HP value + bar on the right, defense readout spanning both columns on row 2. Enemy name uses Silkscreen display face, `clamp(0.85rem, 2.5vw, 1.4rem)`, `text-shadow: 2px 2px 0 var(--sw-hard)`. Mobile `≤480px`: keyboard hints hidden; hand `overflow-x: auto` + `scroll-snap-type: x mandatory`; card `min-width: 80px; flex-shrink: 0` (zero horizontal overflow at 390px). `App.tsx` computes biome background path using `getBiomeSlug()` extracted to `colorHelpers.ts` (shared with `LocationCardDisplay.tsx`, no duplication). Dead CSS removed: `cinematic__atmosphere*`, `cinematic__atmosphere-img`, `cinematic__atmosphere-fallback`, `cinematic__scrim-bottom`, `cinematic__overlay`, old `cinematic__enemy-frame`, old `cinematic__enemy-img`; `combat__enemy-overlay` (grid layout), `combat__enemy-stats` (grid wrapper), `combat__enemy-buffs` (grid wrapper).

### Balance (T-012)

- **Event balance pass (T-012):** rebalanced event outcomes to tighten EV across risk tiers. (1) `envoy_gratitude_repaid` "Accept the War Cache" was zero-variance SAFE (450 ryo + 100 exp); now LOW risk with 65/35 split (EV ≈ 210 ryo + 49.5 exp), proportional to a WAR_ARC mercy-chain investment. (2) Chain B `orochimaru_experiment_result` freed-path bad outcome reduced (exp 70 → 40, intel 15 → 10) so the mercy route does not accumulate risk-free. (3) Added `abandoned_supply_cache` COMMON event to `genericEvents` — without a COMMON anchor the pool (3 RARE + 1 EPIC) let the EPIC surface at ~12 % vs the intended ~7 %; the new event anchors the distribution to ~7.1 %. (4) `tazuna_request` "Work the Full Shift" riskLevel corrected MEDIUM → SAFE (single weight-100 positive outcome, no real variance). (5) Added `selectWeightedEvent([common, rare], 1.0)` boundary test to `EventSystem.test.ts`. Chain scene standalone protection (Advisory 3) confirmed already gated via `requiresFlags` on both chain scenes (no code change needed). **Attempt 2 corrections:** (6) `giant_serpent_nest` "Challenge the Serpents" weights swapped 30/70 → 65/35 (combat/prize) so EXTREME has a majority-downside; description updated to telegraph the real risk. (7) "Ask for Their Blade" 30%-fail path gains `hpChange: { percent: -10 }` — the borrowed blade slips during inspection, justifying the LOW risk label. (8) `orochimaru_experiment_result` freed-path weight-25 logMessage rewritten from "leaving nothing" to acknowledge the +40 XP / +10 Intel partial gain (eliminates the contradiction visible in the What Changed panel). (9) `abandoned_supply_cache` explicit `allowedArcs: []` removed to match the omit-field convention used by the other generic events. (10) Added contract test: `abandoned_supply_cache` must surface in ≥2 arcs via `getEventsForArc`. 254 tests pass.

### Added

- Event scene polish (T-011): reworked the event activity screen onto the pixel-arcade chassis with a dedicated amber/gold identity palette. Choice cards are blocky with a segmented risk meter, a hover/focus tooltip (`ⓘ Possible Outcomes`) instead of an inline expansion, and clear gated-choice indicators (`Requires: STRENGTH 20` / `Costs: 200 Ryo`). New `EventResultModal` shows the narrative outcome plus a legible "What Changed" delta panel (HP/Chakra/Ryo exact before→after; XP/Intel/stats/skill/curse/lost-item/flags), and chained outcomes now route through the result panel with a "Continue the Story ▸" / chain ribbon so multi-scene events read as a continuous story. Threads a presentation-only `cameFromChain` flag; the event engine and types are untouched. Removes the dead `EventChoicePanel`.
- Event content: arc fill + real chains (T-010): 6 new events authored via the `event-creator` skill on the T-008 engine. War arc 2→6 and Rogue arc 3→5, including two multi-scene chained events that branch on run flags (`reanimated_envoy`→`reanimated_envoy_fate`; `orochimaru_experiment`→`orochimaru_experiment_result`), one persistent-consequence event that a later event reads back (`envoy_gratitude_repaid` via `requiresFlags`), and legible-trade-off uses of the new effects (`grantSkillById`, `curse`, `removeRandomItem`) — every event keeps a SAFE ungated exit. Adds a 16-test content-integrity suite (weights sum to 100, chains/flags/skill-ids all resolve). Data only; fine balance tuning is deferred to T-012.
- event-creator local skill (T-009): `.agents/skills/event-creator/` (SKILL.md + references/templates.md) documenting the T-008 event model — GameEvent/EventChoice/EventOutcome field tables, golden rules, chain/flag/effect semantics, copyable TypeScript templates (simple / chained / gated), and a registration checklist — so event content can be authored consistently in T-010. Docs only; verified field-by-field against the live code and surfaces real discrepancies (aggregator is `EVENTS` not `ALL_EVENTS`; `effects.items`/`effects.skills`, `rarity` and `clanBonus` are declared but currently no-ops).
- Event engine 2.0 (T-008): additive event chains, flags and effects. New optional `EventOutcome` effects — `chainTo` (multi-scene chains that open the next event for real), `setFlags`, `grantSkillById`, `curse`, `removeRandomItem` — plus `requiresFlags`/`excludesFlags` gating on `GameEvent` and `EventChoice`, backed by a per-run `Player.eventFlags` counter map. Chain resolution, flag persistence and gating are handled in the pure `EventSystem` (curse reuses the existing mitigation pipeline) and wired through `useActivityHandlers`/`Event.tsx`/`LocationSystem`; gated choices fall back to the full list so an event never opens with no options. +26 unit tests (232 total). No existing events changed; balance-neutral — content and tuning land in T-010/T-012.
- RegionMap retro-arcade restyle (T-007 phase F1): redesigned the location-selection screen to the neon retro-arcade reference (`docs/references/regionmap-retro-reference.png`) — vertical cards with thin glowing neon borders (cyan unlocked / magenta locked), boxed number badges, classification legends (WILDERNESS/SETTLEMENT/UNKNOWN), italic biome nicknames, segmented DANGER (green) / WEALTH (orange→yellow) bars, color-coded status footer (REST POINT / MERCHANT AVAILABLE / UNKNOWN), glitch-styled locked card, neon ENTER LOCATION button, region-progress bar and shortcut footer, over a CRT/scanline texture. Touches `RegionMap.tsx`/`LocationCardDisplay.tsx`/`exploration.css` and the danger/wealth/activity bar components; no game logic changed. The pixel-art card backgrounds are keyed by biome slug and wired with a graceful icon fallback.
- RegionMap location backgrounds (T-007 phase F2): generated 14 pixel-art scene backgrounds for the Land of Waves biomes (`assets/location_*.png` — foggy_shoreline, coastal_harbor, rural_village, dense_forest, underground_cavern, river_banks, shipwreck, great_bridge, fortified_camp, ruined_estate, secret_harbor, underwater_temple, fortified_mansion, mist_covered_bridge) via the `/generar-asset` (Codex) pipeline, 1024×576 opaque, matching the retro reference. They fill the previously icon-fallback card background slot (keyed by biome). Versioned via a `.gitignore` exception (`!/assets/location_*.png`). Completes T-007.
- Combat art assets (T-005, partial): 8 pixel-art skill-card backgrounds (`assets/skill_*.png` — shuriken, fireball, taijutsu, primary_lotus, shadow_clones, gentle_fist, mind_body_disturbing, chidori) and 6 enemy portraits (`assets/enemy_*.png` — samurai, monk, clumsy_puppeteer, exhausted_shinobi, boss_haku, boss_demon_brothers), generated via the `/generar-asset` (Codex) pipeline following the `combat-art` art direction. Fills the previously-404 art slots already wired in `SkillCard`/`EnemySystem`. These combat assets are now versioned (gitignore exception for `assets/{skill,enemy}_*.png`).
- Self-improving development loop (`/loop-run`): lead-orchestrated maker/checker cycle with bounded retries and on-disk memory. Includes the `quality-scoring` skill (4 lenses: architecture, system, presentation, balance with a >=85 gate), the `loop-maker` and `loop-reviewer` agents, and `loop/` state files (VISION, LOOP-TOPICS, LOOP-STATE, RULES, logs).
- Pixel-Arcade UI restyle (T-001): Silkscreen/VT323 pixel fonts, blocky panels/cards and hard-shadow buttons (no blur) applied through the design-system tokens across Main Menu, Character Select, Exploration and Combat. Sprites/illustrations untouched.
- SkillCard chakra-cost badge (T-002): combat skill cards now show the chakra cost as a pixel-arcade chip (`{n} CP` / `FREE` for non-passive skills), consistent with the sibling badges. Also defined the missing `--sw-space-0-5`/`--sw-space-1-5` spacing tokens.
- combat-art local skill (T-003): structured `.agents/skills/combat-art/` skill (layered scene composition, sprite style rules, CSS aura/CRT implementation, AI asset-prompt formulas) derived from `docs/guia_direccion_de_arte_combate.md`, for future combat art/asset work.
- Location-run balance simulator (T-006 phase B.1): a `--location` simulator mode that measures the real difficulty unit — clearing a full location (~10 rooms in sequence with HP/chakra attrition, real room generation/navigation, rest healing, and the exit guardian) — reported as clear-rate per build × danger level. Reuses the real `LocationSystem`; deterministic per seed. Surfaces balance the 1v1 sim flattened (strong clans clear ~100% to D7; glassy builds collapse). Base math untouched.
- Combat refactor groundwork (T-004 phase F1): additive data model + constants for the upcoming cards/AP/posture combat system — `Posture` enum, `Skill.apCost`/`stanceShift`, derived `actionPointsPerTurn`, `CombatState` hand/deck/AP/posture fields, and pure `combatCards` helpers. Not yet wired into combat (no behavior change). See `plan.md`.
- Legacy turn-economy cleanup (T-004 phase F5): removed the now-dead Side/Main turn-phase model — `TurnPhaseState`, `createInitialTurnPhaseState`, `Skill.sideActionLimit`, and the orphaned phase-bar CSS — left isolated after the cards/AP refactor. `ActionType` is retained as the card category. Pure deletion, no behavior change. Completes the T-004 combat refactor.
- Battle simulator AP/cards/postures (T-004 phase F4): the balance simulator's player turn now models the real AP/card/posture economy — reusing `DeckSystem`/`PostureSystem`/`combatCards` so sim metrics match gameplay — instead of the legacy Main/Side model. Added AP-economy metrics (cards/turn, AP used) to the report. Base damage math untouched; remaining absolute win-rate outliers are pre-existing and deferred to a balance pass.
- Combat UI polish (T-004 phase F3): extracted the hand and posture control into dedicated `Hand` and `PostureIndicator` components; pixel-arcade AP pip bar; posture segmented control with icons and a deal/take trade-off tooltip; fixed the skill-card shortcut/title overlap, the 3-digit damage-value collision, and a duplicated card title (decorative background image alt text). No gameplay change.
- Cards/AP/posture combat core (T-004 phase F2): the player turn is now a deckbuilder AP economy. Each turn draws a posture-weighted hand of up to 4 cards from the player's skills; playing a card spends Action Points (`AP_BASE + speed/AP_PER_SPEED_DIV`), and the turn ends when AP runs out or on Space — replacing the fixed Side/Main structure. Three postures (Aggressive/Balanced/Defensive) bias the draw and apply symmetric ±15% deal/take modifiers; some skills shift posture on play. New `DeckSystem`/`PostureSystem` (pure, unit-tested) and a Z/X/C/V hand UI with an AP bar and posture control. Base damage math unchanged; the battle simulator still models the legacy turn (updated in a later phase).

### Changed

- Event engine honesty pass (T-016): resolved the four declared-but-inert event fields exposed while documenting the engine in T-009. `GameEvent.rarity` now **weights event selection** — `generateEventActivity` (`LocationSystem`) draws from the eligible arc pool proportionally to a new `EVENT_RARITY_WEIGHTS` table (COMMON 100 / RARE 45 / EPIC 18 / LEGENDARY·CURSED 7) via the pure, unit-tested `selectWeightedEvent`/`getEventSelectionWeight` helpers in `EventSystem`, instead of the previous uniform pick, so authored rarities finally matter (this feeds the T-012 balance pass). Updated the `event-creator` skill (field tables, golden rules, discrepancy notes) to match. +6 unit tests.
- Endgame-hardening balance pass (T-006 phase B.2): retuned so the difficulty curve now *descends* — measured as clearing a full location (attrition), strong builds no longer clear ~100% to D7. Compressed the willpower→HP spread (`HP_PER_WILLPOWER` 12→9, `HP_BASE` 50→80), steepened danger scaling (`DANGER_BASE` 0.55→0.30, `DANGER_PER_LEVEL` 0.15→0.24), and added two danger-keyed enemy multipliers — `ENEMY_HP_DANGER_FACTOR` (an endgame HP wall so bursts no longer one-shot) and `ENEMY_DMG_DANGER_FACTOR` — leaving the early game accessible. Raised `CHAKRA_REGEN_PER_INT` 0.2→0.5 and `PLAYER_DAMAGE_MULTIPLIER` 1.0→1.10 to converge slow-killing caster/squishy builds upward; trimmed the dominant clans' growth (Hyuga/Lee/Uzumaki) and retuned 6 skill multipliers. Result (seed 12345): all in-scope builds land in the D6-D7 ~20-40% clear band (Hyuga left as the rewarded optimized peak; the extreme min-max sim fixtures Glass Cannon/Speed Demon are documented as out of the target curve). Base combat math untouched. Completes T-006.
- Remove Ryo option from revealed treasure choices (players now pick only from items)
- Enable ENABLE_MANUAL_COMBAT feature flag (manual/interactive combat instead of auto-simulated)

### Removed

- Dead event fields (T-016): removed `EventOutcome.effects.items` and `effects.skills` (declared but never applied by `applyOutcomeEffects` — only tinted the outcome preview; no event used them) and `EventChoice.clanBonus` (a probabilistic no-op — `rollOutcome` scaled all outcome weights by the same factor and renormalized, so it never biased anything; no event used it). Skills are still granted via the live `grantSkillById`; clan agency stays available via `requirements.requiredClan`. Cleaned up the `Event.tsx` preview and the stale `clanBonus` unit test.
- Removed Asset Companion tool and associated scenes, components, configs, hooks, and feature flags.

## 2025-12-29

### Added

- Dual Treasure System with Locked Chests (reveal-or-blind) and Treasure Hunter (map pieces)
- TreasureChoice scene for treasure selection UI
- TreasureHuntReward scene for map completion rewards
- useTreasureHandlers hook extracting treasure logic from App.tsx
- Treasure balance constants in featureFlags.ts (config, dice odds, trap damage, map pieces)
- DEV_MODE feature flag for development-only features
- ImageTest scene for AI image generation testing (dev-only)

### Changed

- Extract treasure handlers to dedicated hook for better separation of concerns
- Use TreasureType enum instead of string literals
- Gate ImageTest behind DEV_MODE flag

### Fixed

- Battle simulator fidelity + determinism (T-006 phase A): the simulator now mirrors the live game's turn order — player DoT ticks after the player acts (not before), toggle upkeep is charged, and execute applies after mitigation — and is now deterministic via a seeded PRNG (`--seed`, default 12345), so two same-seed runs produce identical metrics (previously up to 14 win-rate points of run-to-run noise). Makes the simulator trustworthy for balance tuning. Base damage math untouched.
- Enemy skill cooldowns never decremented in live combat: `EnemyTurnResult` didn't carry the enemy's skills and the combat hook rebuilt the enemy without them, so cooldowns set on use were discarded every turn — enemies eventually fell back to spamming their first skill. Enemy cooldowns now tick down (and the skills persist through the turn result). Found by a holistic review of the T-004 combat refactor; pre-existing bug.
- TreasureChoice card sizing (all options now same size)
- Type safety improvements (removed `any` types in ImageTest and TreasureHuntReward)

## 2025-12-24

### Added

- Centralized feature flags system (`src/config/featureFlags.ts`)
- Combat keyboard shortcuts (1-4 for skills, Space to pass turn)
- Shortcut key badges on skill cards

## 2025-12-17

### Added

- Intel system integration with story events

### Changed

- Import scaling functions directly from ScalingSystem
- Extract combat types to eliminate circular imports
- Major code modularization and separation of concerns

## 2025-12-16

### Added

- Wealth level and intel gathering system

### Changed

- Enforce separation of concerns between RegionSystem and LocationSystem

### Fixed

- Elite escape infinite loop
- Remove CombatSystem barrel export causing issues

## 2025-12-15

### Added

- Region-based exploration system (Region -> Location -> Room hierarchy)

### Changed

- Rename BranchingFloorSystem to LocationSystem
- Reorganize components into categorized subdirectories

## 2025-12-13

### Added

- Exploration creator skill for adding regions/locations/rooms
- RightSidebarPanel component

### Changed

- Refactor bag system to fixed-slot array architecture
- Align PlayerHUD width with BranchingExplorationMap

## 2025-12-11

### Added

- Artifact passive effects integrated into combat system

### Changed

- Refactor event system to use enhanced events with outcome modal

## 2025-12-10

### Added

- Combat Calculation and Workflow Systems (dual-system architecture)
- Unit tests for EventSystem, LootSystem, StatSystem
- Combat mechanics documentation and combat-system-creator skill
- Detailed buff tooltips and mechanics breakdown in PlayerHUD
- Comprehensive combat logging

### Changed

- Revamp combat mechanics with nerfed stealth ambush
- Improved enemy AI skill selection
- Refined damage calculations
- Enhance Stat System with Passive Skill Bonuses

## 2025-12-09

### Added

- Comprehensive Jutsu card system
- Simulation progression mode with confidence intervals

### Changed

- Revamp project structure
