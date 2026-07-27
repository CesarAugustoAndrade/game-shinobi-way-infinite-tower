# CLAUDE.md — Agent & Developer Guidelines

## Coding Rules & Conventions
- Do NOT create unit tests unless explicitly requested.
- Delete legacy code when replacing functionality (no dead code).
- When editing `PLAN.md`, edit ONLY `PLAN.md` until explicit instruction to implement.
- Keep logging logic in separate files, isolated from main game systems.
- Maintain pure game logic in `src/game/systems/` (zero React/DOM dependencies).
- Use TypeScript enums (`PrimaryStat.STRENGTH`, `Clan.UCHIHA`) instead of string literals.
- Ensure state immutability (`{ ...old, updated: value }`).

## Quick Commands
```bash
npm install                     # Setup
npm run dev                     # Dev server (port 5173)
npm run build                   # Production build
npx tsc --noEmit                # Type check
npm test                        # Run Vitest suite
npm run simulate                # Full balance simulation
npm run simulate:quick          # Quick simulation
npm run simulate:progression    # Progression curve simulation
```

## Core Architecture
- **Tech Stack:** React 18, TypeScript, Vite, Vitest.
- **Hierarchy:** Region → Location → Room (10 rooms/location diamond branching).
- **Core State (`src/game/types.ts`):** `GameState` enum (`EXPLORE`, `COMBAT`, `LOOT`, `MERCHANT`, `EVENT`, `TRAINING`, etc.).

### System Layer (`src/game/systems/`)
- `StatSystem.ts`: Primary (9 stats: Willpower, Chakra, Strength, Spirit, Intelligence, Calmness, Speed, Accuracy, Dexterity) to Derived stats (Max HP/Chakra, ATK, Def, Crit).
- `CombatCalculationSystem.ts`: Pure combat math (deterministic, side-effect free).
- `CombatWorkflowSystem.ts`: Combat state mutations, turn order, status effects.
- `LootSystem.ts`: TFT-style synthesis (combine 2 components into artifact), drop tables.
- `RegionSystem.ts` / `LocationSystem.ts`: Danger level (1-7), floor scaling, room activity flow.

### Formulas Summary
- **Max HP:** `Willpower × 10 + Strength × 2` | **Max Chakra:** `Chakra × 8 + Spirit × 2`
- **Phys ATK:** `Strength × 2 + Dex × 0.5` | **Elem ATK:** `Spirit × 2 + Intel × 0.5`
- **Flat Def:** `Willpower × 0.5 + Strength × 0.3` (Soft-cap: `def × (100 / (100 + def))`)
- **Percent Def:** `Calmness × 0.2 + Willpower × 0.1` (max 60%)
- **Enemy Scaling:** `effectiveFloor = 10 + (dangerLevel × 2) + floor(baseDifficulty / 20)`

## Available Skills (`.claude/skills/`)
`jutsu-creator`, `combat-system-creator`, `combat-ui-pattern-a`, `exploration-creator`, `art-style-creator`, `frontend-design`, `nano-banana-builder`, `threejs-builder`.

## Git Workflow
- Branches: `main` (prod), `develop` (dev).
- Commit format: `feat:`, `fix:`, `refactor:`, `docs:`.
- Update `CHANGELOG.md` under `[Unreleased]` before committing.
