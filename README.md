# SHINOBI WAY: THE INFINITE TOWER

Roguelike deckbuilder / exploration game set in a Naruto-inspired ninja world. React + TypeScript + Vite.

## Stack

| Piece | Version |
|-------|---------|
| React | 19 |
| TypeScript | ~5.8 (strict) |
| Vite | 6 |
| Vitest | 4 |
| Node | 22 (`engines` + `.nvmrc`) |

Pure game logic lives in `src/game/systems/` (no React/DOM). UI in `src/components` and `src/scenes`. Balance sims in `src/simulation/`.

## Prerequisites

- **Node.js 22** (see `.nvmrc`)
- npm 11+ (see `packageManager` in `package.json`)

```bash
nvm use   # or install Node 22
npm ci
```

No Gemini / AI Studio API key is required. Client-side GenAI was removed; painted assets ship under `public/assets/`.

## Commands

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server (port **3010**) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Stylelint on `src/**/*.css` |
| `npm run test` | Vitest (unit) |
| `npm run budget:dist` | Fail if `dist/` exceeds size budgets |
| `npm run verify` | typecheck + lint + test + build + budget |
| `npm run audit:prod` | Production dependency audit (high+) |
| `npm run simulate[:quick\|:progression\|:campaign]` | Balance simulations |

CI runs the same gate on `main` / `develop` (see `.github/workflows/ci.yml`).

## Architecture (short)

- **Hierarchy:** Region → Location → Room (branching diamond, ~10 rooms/location)
- **Core state:** `GameState` in `src/game/types.ts`
- **Systems:** combat calc vs workflow split, loot/TFT synthesis, region/location generation
- **Formulas:** `docs/FORMULAS.md`
- **Combat single path notes:** `docs/combat-single-path.md`

## Assets

Runtime assets are under `public/assets/` and are copied wholesale into `dist/` by Vite.

- Prefer cutouts with chroma-key (`#00FF00`, or `#FF00FF` / `#0000FF` for green subjects) — see `AGENTS.md`.
- Dead / legacy folders (e.g. `old_square_skills`, skill `_qa`, root `public/enemies`) were purged for deploy size.
- Size gate: `npm run budget:dist` after build. Long-term goal: total artifact &lt; 250 MB, initial JS+CSS &lt; 5 MB.

## Repo hygiene

| Issue | Status / plan |
|-------|----------------|
| Client API key leakage | Fixed — no Vite `define` of Gemini keys |
| `@google/genai` dead dep | Removed |
| Dist ~1 GB | Reduced by purging unused public trees; further CDN/offload planned |
| `.git` ~5.5 GB (LFS + history) | See `docs/git-history-migration.md` (coordinated rewrite) |
| Dual React state + `GameSessionStore` | Incremental dual-write migration (session store is source of truth for new paths) |

## Documentation

- `AGENTS.md` / `Claude.md` — agent & contributor rules
- `CHANGELOG.md` — `[Unreleased]` notes
- `docs/` — formulas, combat path, art canons, migration plans
- `loop/` — development loop topics & vision

## License / content

Fan-inspired game project. Not affiliated with official Naruto rights holders.
