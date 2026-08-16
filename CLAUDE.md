# CLAUDE.md — SHINOBI WAY: THE INFINITE TOWER

## Minimal project context

- Roguelike de torre por turnos (shinobi, Región → Location → Room); vertical slice actual: Land of Waves.
- Stack: React 19 + TypeScript + Vite + Vitest. Node 22 (`engines` / `.nvmrc`).
- Pure domain sin imports de framework: `src/game/systems/` (verificado por convención + RING-GUARD cuando exista config).
- Entrypoint / composition root: `src/index.tsx` · `src/App.tsx` · `src/contexts/GameContext.tsx`.

## Development system

This project is developed with **LOOP ENGINEERING** *and* the project-native loop (`loop/`, `/loop-run`).
Source of truth for the hexagonal pipeline: skill `loop-engineering` — read it BEFORE `/task-*`.
Source of truth for the topic loop: `loop/RULES.md`, `loop/LOOP-TOPICS.md`.

- No code change without a T-XXX (loop-engineering) or a loop topic that authorizes it.
- No T-XXX without a spec with executable objective tests.
- Pipeline detail lives in the skill / `loop/RULES.md` — do not duplicate it here.


## Loop-engineering commands (Soul vs tasks)

- **`/soul-loop`** — interactive research to improve `.claude/skills/soul/SOUL.md` only (never creates T-XXX, never touches `src/`).
- **`/task-new`** — creates one T-XXX: **no args** = SOUL↔code gap; **with args** = brainstorm + SOUL alignment. Then `/task-dev T-XXX` implements.
- Log of soul curation: `tasks/SOUL-LOG.md` (created by soul-loop on first apply).

## Ring map (Ring System → this repo's paths)

| Ring | Paths | Notes |
|---|---|---|
| **R0** | `src/game/systems/**`, `src/game/types.ts`, `src/game/constants/**` | pure game rules; **zero** React/DOM |
| **R1** | `src/hooks/**`, `src/contexts/**`, `src/game/**` (non-systems orchestration) | app orchestration / ports into pure systems |
| **R2** | `src/components/**`, `src/scenes/**`, `src/styles/**` | React UI / scenes / CSS |
| **R3** | `src/config/**`, `src/simulation/**`, `scripts/**`, Vite/root config, `public/**` | wiring, sims, tooling, static assets |

- A task's ring = the innermost path it touches. In doubt: the innermost.
- R0 must not import from R1–R3. R1 may call R0; UI (R2) must not own combat/loot formulas.

## Coding Rules & Conventions

- Do NOT create unit tests unless explicitly requested.
- Delete legacy code when replacing functionality (no dead code).
- When editing `PLAN.md`, edit ONLY `PLAN.md` until explicit instruction to implement.
- Keep logging logic in separate files, isolated from main game systems.
- Maintain pure game logic in `src/game/systems/` (zero React/DOM dependencies).
- Use TypeScript enums (`PrimaryStat.STRENGTH`, `Clan.UCHIHA`) instead of string literals.
- Ensure state immutability (`{ ...old, updated: value }`).

## Architecture

- **Hierarchy:** Region → Location → Room (10 rooms/location, diamond branching).
- **Core state:** `GameState` enum in `src/game/types.ts` (`EXPLORE`, `COMBAT`, `LOOT`, `MERCHANT`, `EVENT`, `TRAINING`, …).
- **Systems (`src/game/systems/`):** `StatSystem`, `CombatCalculationSystem` (pure math), `CombatWorkflowSystem` (state/turns/status), `LootSystem` (TFT synthesis), `Region`/`LocationSystem` (danger 1–7, floor scaling). Formulas: `docs/FORMULAS.md`.

## Verification commands (run by `verifier`, literally)

```bash
npm run typecheck          # tsc --noEmit
npm run lint               # stylelint CSS
npm run test               # vitest run
npm run build              # vite build
npm run budget:dist        # dist size budget
npm run verify             # typecheck + lint + test + build + budget (full gate)
npm run dev                # manual smoke (Vite)
npm run simulate:quick     # balance smoke (optional, when combat/loot touched)
```

**RING-GUARD** (standard objective gate on every T-XXX): diff must not introduce R0 files importing React/DOM or paths under `src/components`, `src/scenes`, `src/hooks`, `src/contexts`. Prefer a future `depcruise`/lint rule; until then verifier checks the task diff manually against the ring map above.

Project thresholds (skill defaults unless stated otherwise):
APPROVE score ≥80 · min dimension 60 · polish ≥90 · R0 coverage ≥90%.

## This project's skills

| Skill | When it's injected |
|---|---|
| `combat-system-creator` | combat formulas, workflow, status effects |
| `combat-ui-pattern-a` | Pattern A combat UI / panels / dock |
| `combat-art` | battle scene art direction, cutouts, CRT |
| `event-creator` | narrative events, chainTo, flags, curses |
| `exploration-creator` | regions, locations, rooms, intel paths |
| `jutsu-creator` | skills / jutsu definitions |
| `pixel-arcade` | retro UI chrome (not painted content) |
| `frontend-design` | non-combat web UI polish |
| `quality-scoring` | loop-reviewer 4 lenses |
| `brainstorming` | design sessions only |
| `art-style-creator` | new art direction docs |
| `generar-asset` / Imagine skills | any task needing art — never leave placeholders |

Calibration / scores: per-skill or `loop/` logs — do not assume Phase 3 without checking.

## Tasks (loop-engineering)

```
tasks/backlog/    # accepted specs, pending
tasks/active/     # in the pipeline (T-XXX/)
tasks/done/       # closed
```

Project-native topics also live under `loop/` and `todos/` — do not confuse with `tasks/`.

## Hard operational rules (emergency summary)

1. **Always a worktree for `/task-dev`:** `git worktree add .worktrees/T-XXX -b task/T-XXX`. FORBIDDEN to implement T-XXX in the main worktree. `.worktrees/` is in `.gitignore`.
2. **Merge conflicts:** never resolved by an agent. Escalate to the human.
3. **Auto-merge** only R2–3 + autonomous route + verify PASS + no conflicts.
4. **R0–R1:** human checkpoint on the plan; in R0 also on the merge (full diff).
5. **Out-of-scope is sacred:** detected improvements are noted, not implemented.
6. **Phase .md files** live in `tasks/active/T-XXX/` — pipeline memory, not chat context.
7. **Subagents:** raw material >2–3k tokens → subagent returns synthesis.

## Git Workflow

- Branches: `main` (prod), `develop` (dev).
- Commit format: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
- Update `CHANGELOG.md` under `[Unreleased]` before committing feature work.

## Asset generation (cutouts / alpha)

- When generating any game asset that will later be cut out for real transparency (`enemy_cut_*`, hero cutouts, mid/fg laminas, prop sprites): **prompt a flat solid chroma key background**, never pure black.
- **Default key color: pure green screen** `#00FF00`.
- If the subject is green-heavy (moss, foliage, Lee/chakra green, slime, etc.): use **magenta/hot-pink** `#FF00FF` or **pure blue** `#0000FF` instead.
- After generation, chroma-key → true RGBA PNG. Do **not** rely on black-matte keying for new cutouts.

## What does NOT go in this file

The step-by-step pipeline, per-ring policy tables, calibration phases, full worktree protocol → skill `loop-engineering` and `loop/RULES.md`. If this file and the skill disagree, the **skill wins**; report the discrepancy.
