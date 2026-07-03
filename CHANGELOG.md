# Changelog

All notable changes to SHINOBI WAY: THE INFINITE TOWER will be documented in this file.

## [Unreleased]

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
