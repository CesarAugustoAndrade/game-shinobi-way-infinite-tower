# CLAUDE.md — Agent & Developer Guidelines

## Coding Rules & Conventions
- Do NOT create unit tests unless explicitly requested.
- Delete legacy code when replacing functionality (no dead code).
- When editing `PLAN.md`, edit ONLY `PLAN.md` until explicit instruction to implement.
- Keep logging logic in separate files, isolated from main game systems.
- Maintain pure game logic in `src/game/systems/` (zero React/DOM dependencies).
- Use TypeScript enums (`PrimaryStat.STRENGTH`, `Clan.UCHIHA`) instead of string literals.
- Ensure state immutability (`{ ...old, updated: value }`).

## Architecture
- **Stack:** React 18, TypeScript, Vite, Vitest.
- **Hierarchy:** Region → Location → Room (10 rooms/location, diamond branching).
- **Core state:** `GameState` enum in `src/game/types.ts` (`EXPLORE`, `COMBAT`, `LOOT`, `MERCHANT`, `EVENT`, `TRAINING`, …).
- **Systems (`src/game/systems/`):** `StatSystem`, `CombatCalculationSystem` (pure math), `CombatWorkflowSystem` (state/turns/status), `LootSystem` (TFT synthesis), `Region`/`LocationSystem` (danger 1-7, floor scaling). Stat & combat formulas: `docs/FORMULAS.md`.

## Commands
- See `package.json` scripts: `npm run dev` / `build` / `test`, and `npm run simulate[:quick|:progression]` (balance sims). Type check: `npx tsc --noEmit`.

## Git Workflow
- Branches: `main` (prod), `develop` (dev).
- Commit format: `feat:`, `fix:`, `refactor:`, `docs:`.
- Update `CHANGELOG.md` under `[Unreleased]` before committing.
