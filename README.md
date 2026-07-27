# Shinobi Way: The Infinite Tower

A Naruto-themed, text-based roguelike RPG / dungeon crawler built with React, TypeScript, and Vite. Players create a ninja, ascend through an infinite tower using a Region → Location → Room exploration hierarchy, manage a nine-stat character system, fight turn-based battles with elemental interactions and skill-based "approaches," and collect procedurally generated loot. The project also ships a headless battle/progression simulator for balance testing and an optional AI asset companion for generating game art.

## Features

- Region → Location → Room exploration hierarchy with card-based location selection and an intel system
- Nine primary stats organized into the "Shinobi Triad" (Body, Mind, Technique): Willpower, Chakra, Strength, Spirit, Intelligence, Calmness, Speed, Accuracy, Dexterity, plus derived stats
- Clan-based character creation with per-clan stats, growth curves, and starting skills
- Turn-based combat with elemental damage types (Fire, Wind, Lightning, Earth, Water, Physical, Mental/Genjutsu), an approach system, enemy AI, elite challenges, and scaling
- Procedural loot with equipment, components, synthesis/disassembly, and artifact upgrades
- Events driven by arc-based event pools (academy, exams, rogue, war, waves)
- Training scenes, merchants, treasure hunts (with dice rolls), and scroll discovery
- Drag-and-drop inventory (powered by `@dnd-kit`)
- AI Asset Companion scene for generating art assets via Google Gemini (`@google/genai`)
- Headless simulation suite (battle and progression simulators with statistics and JSON/console reporting)
- Unit test coverage for core systems (Vitest)

## Tech Stack

- React 19 + TypeScript
- Vite 6
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — drag-and-drop
- `lucide-react` — icons
- `@google/genai` (Google Gemini) — AI asset generation
- Vitest — testing; `tsx` — running the simulation scripts

## Getting Started

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. (Optional) Set the `GEMINI_API_KEY` in a `.env.local` file to enable AI-generated art in the Asset Companion:
   ```
   GEMINI_API_KEY=your_key_here
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

Other scripts:

- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm test` — run the test suite once (`npm run test:watch` for watch mode)
- `npm run simulate` / `npm run simulate:quick` — run the battle simulator
- `npm run simulate:progression` / `npm run simulate:progression:quick` — run the progression simulator

## Project Structure

```
src/
  App.tsx                  # Root component, top-level game state machine
  index.tsx                # Entry point
  game/
    types.ts               # Core game types (GameState, stats, elements, etc.)
    constants/             # Skills, clans, regions, events, terrain, room types
    entities/              # Player and Enemy entities
    systems/               # Combat, loot, exploration, events, scaling (+ tests)
    utils/                 # RNG, debug, formatting helpers
  components/              # UI: character, combat, exploration, inventory, modals
  scenes/                  # Menu, combat, activities, rewards, AssetCompanion
  hooks/                   # Combat, exploration, asset generation, navigation hooks
  contexts/                # GameContext
  config/                  # Art styles, asset presets, feature flags
  simulation/              # Headless battle & progression simulators
docs/                      # Art-style and atmosphere design docs
```
