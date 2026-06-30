# Changelog

All notable changes to SHINOBI WAY: THE INFINITE TOWER will be documented in this file.

## [Unreleased]

### Added

- Self-improving development loop (`/loop-run`): lead-orchestrated maker/checker cycle with bounded retries and on-disk memory. Includes the `quality-scoring` skill (4 lenses: architecture, system, presentation, balance with a >=85 gate), the `loop-maker` and `loop-reviewer` agents, and `loop/` state files (VISION, LOOP-TOPICS, LOOP-STATE, RULES, logs).
- Pixel-Arcade UI restyle (T-001): Silkscreen/VT323 pixel fonts, blocky panels/cards and hard-shadow buttons (no blur) applied through the design-system tokens across Main Menu, Character Select, Exploration and Combat. Sprites/illustrations untouched.
- SkillCard chakra-cost badge (T-002): combat skill cards now show the chakra cost as a pixel-arcade chip (`{n} CP` / `FREE` for non-passive skills), consistent with the sibling badges. Also defined the missing `--sw-space-0-5`/`--sw-space-1-5` spacing tokens.
- combat-art local skill (T-003): structured `.agents/skills/combat-art/` skill (layered scene composition, sprite style rules, CSS aura/CRT implementation, AI asset-prompt formulas) derived from `docs/guia_direccion_de_arte_combate.md`, for future combat art/asset work.
- Combat refactor groundwork (T-004 phase F1): additive data model + constants for the upcoming cards/AP/posture combat system — `Posture` enum, `Skill.apCost`/`stanceShift`, derived `actionPointsPerTurn`, `CombatState` hand/deck/AP/posture fields, and pure `combatCards` helpers. Not yet wired into combat (no behavior change). See `plan.md`.
- Legacy turn-economy cleanup (T-004 phase F5): removed the now-dead Side/Main turn-phase model — `TurnPhaseState`, `createInitialTurnPhaseState`, `Skill.sideActionLimit`, and the orphaned phase-bar CSS — left isolated after the cards/AP refactor. `ActionType` is retained as the card category. Pure deletion, no behavior change. Completes the T-004 combat refactor.
- Battle simulator AP/cards/postures (T-004 phase F4): the balance simulator's player turn now models the real AP/card/posture economy — reusing `DeckSystem`/`PostureSystem`/`combatCards` so sim metrics match gameplay — instead of the legacy Main/Side model. Added AP-economy metrics (cards/turn, AP used) to the report. Base damage math untouched; remaining absolute win-rate outliers are pre-existing and deferred to a balance pass.
- Combat UI polish (T-004 phase F3): extracted the hand and posture control into dedicated `Hand` and `PostureIndicator` components; pixel-arcade AP pip bar; posture segmented control with icons and a deal/take trade-off tooltip; fixed the skill-card shortcut/title overlap, the 3-digit damage-value collision, and a duplicated card title (decorative background image alt text). No gameplay change.
- Cards/AP/posture combat core (T-004 phase F2): the player turn is now a deckbuilder AP economy. Each turn draws a posture-weighted hand of up to 4 cards from the player's skills; playing a card spends Action Points (`AP_BASE + speed/AP_PER_SPEED_DIV`), and the turn ends when AP runs out or on Space — replacing the fixed Side/Main structure. Three postures (Aggressive/Balanced/Defensive) bias the draw and apply symmetric ±15% deal/take modifiers; some skills shift posture on play. New `DeckSystem`/`PostureSystem` (pure, unit-tested) and a Z/X/C/V hand UI with an AP bar and posture control. Base damage math unchanged; the battle simulator still models the legacy turn (updated in a later phase).

### Changed

- Remove Ryo option from revealed treasure choices (players now pick only from items)
- Enable ENABLE_MANUAL_COMBAT feature flag (manual/interactive combat instead of auto-simulated)

### Removed

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
