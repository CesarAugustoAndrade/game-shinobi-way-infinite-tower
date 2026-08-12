# Integration readiness plan

Branch: `chore/integration-readiness`  
Source diagnosis: security, 1 GB dist, no CI, dual state, RNG, combat multi-path, tooling.

## Status legend

- [x] Done on this branch
- [~] Partial / foundation only
- [ ] Not started

## Verification snapshot (this branch)

| Check | Result |
|-------|--------|
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm run test` | **468** pass |
| `npm run build` | pass (scene CSS/JS chunks + vendor splits) |
| `npm run budget:dist` | **~689 MB** total / **1.80 MB** JS+CSS (budget 750 / 5) |
| `npm audit` / `audit:prod` | **0** vulnerabilities |

Baseline was ~**1.14 GB** dist and 15 audit findings.

---

## P0 — Security & green baseline

| Item | Status | Notes |
|------|--------|-------|
| Remove client GenAI (`useGenAI`, `generateEnemyImage`, `@google/genai`) | [x] | No browser API key path |
| Remove Vite `define` of GEMINI/API keys | [x] | `vite.config.ts` cleaned |
| Remove AI Studio importmap | [x] | `index.html` |
| Replace Tailwind CDN with local utilities for App shell | [x] | Minimal CSS in `index.html`; full Tailwind build optional later |
| Fix Stylelint duplicate selectors | [x] | `ApproachSelector.css` |
| Stabilize flaky LocationSystem test | [x] | Seeded `Math.random` sequence in test |
| Scripts: `typecheck`, `lint`, `verify`, `audit:prod`, `budget:dist` | [x] | `package.json` |
| Pin Node 22 (`engines`, `.nvmrc`, `packageManager`) | [x] | |
| `tsconfig` include/exclude (no dist/scratch) | [x] | `allowJs: false` |
| Bump vulnerable deps (vite 6.4.3, vitest 4.1.10 + overrides) | [x] | audit 0 |
| Production audit clean (high+) | [x] | |

**Exit criteria:** met on this branch.

---

## P1 — Assets, repo, CI

| Item | Status | Notes |
|------|--------|-------|
| Purge `old_square_skills` (~209 MB) | [x] | No code refs |
| Purge skills `_qa` (~61 MB) | [x] | |
| Purge `public/enemies` (~91 MB) | [x] | Game uses `/assets/enemies/` |
| Purge QA `buenos`/`malos` + flat icon supersets | [x] | ~87 MB more |
| Heuristic unreferenced list | [x] | `scripts/list-unreferenced-assets.mjs` → `docs/asset-unreferenced-candidates.txt` |
| Strict allowlist from manifests only | [~] | Heuristic exists; many false positives remain |
| PNG/JPG optimization + CDN offload | [ ] | Laminas alone ~3.5 MB each — next win |
| Dist size budget script | [x] | Default total 750 MB → tighten to 250 |
| GitHub Actions CI | [x] | `.github/workflows/ci.yml` |
| Git history / LFS rewrite | [ ] | Plan only: `docs/git-history-migration.md` |

**Progress:** artifact **689 MB** (was 1136); JS+CSS **1.80 MB** (&lt; 5 MB target).

---

## P2 — Determinism & purity

| Item | Status | Notes |
|------|--------|-------|
| `RandomGenerator` utils | [x] | `src/game/utils/rng.ts` |
| Inject RNG on floor generation critical path | [x] | `FloorGenerationConfig.rng` + roomTypes helpers |
| Dual install with sim seed | [x] | `seededRandom` + `setGlobalRng` same stream |
| Full LocationSystem / DeckSystem / combat migration | [~] | Many bare `Math.random` remain |
| Stop global `Math.random` monkey-patch | [ ] | Override kept for legacy sites |
| Extract localStorage / external I/O from systems | [ ] | |

---

## P3 — Architecture depth

| Item | Status | Notes |
|------|--------|-------|
| Converge auto/balance on manual combat orchestrator | [~] | Checklist: `docs/combat-single-path.md` § Next convergence |
| Split `types.ts` / skills / events by domain | [ ] | Barrels for migration |
| Shrink `App.tsx` / large hooks | [ ] | Session dual-write continues |

---

## P4 — Performance & docs

| Item | Status | Notes |
|------|--------|-------|
| Vendor manualChunks (react, icons, dnd) | [x] | `vite.config.ts` |
| React.lazy scene splitting | [x] | `src/scenes/lazyScenes.tsx` |
| Self-host fonts / full CSS pipeline | [~] | Google Fonts link remains; Tailwind CDN gone |
| CSP headers at host | [~] | Doc ready: `docs/hosting-security-headers.md` |
| README rewrite | [x] | No AI Studio inheritance |
| AGENTS.md React 19 | [x] | |

---

## Suggested next PRs

1. **Compress laminas / combat BGs** or serve from CDN — biggest remaining MB.
2. **RNG:** migrate DeckSystem + combat rolls off bare `Math.random`; then drop global override.
3. **Combat convergence P0** from `docs/combat-single-path.md` (shared mult factories in auto/balance).
4. **Git LFS rewrite** — human-led, after backup (`docs/git-history-migration.md`).
5. **Self-host Silkscreen + VT323** and tighten CSP on the host.
