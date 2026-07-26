# A8 WAVE4 — INTEGRACIÓN residual

**Agent:** A8 WAVE4  
**Date:** 2026-07-23  
**Branch:** develop (no commit / no git add)  
**Scope:** Glue only after WAVE3 peer landings. No feature rewrites.

---

## Summary

Post-WAVE3 residual integration pass (WAVE4). Re-ran typecheck, fixed the **getEnemyArt mist-keyword → beach_bandit/dock_worker misroute**, verified public↔assets top-level mirror (**0 gaps**), refreshed CHANGELOG / out-of-scope / ART_BACKLOG_NOTES, smoked event content tests. **`npx tsc --noEmit` → exit 0.** Event content tests **18/18**.

No WAVE4 feature-peer reports landed after A8-w3 (A2–A7b-wave3 remain the latest product landings). This wave is glue + residual bugfix only.

---

## 1. Typecheck / imports

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **exit 0** |
| Broken imports after WAVE3 | None |
| Glue TS fixes required | **None** |

---

## 2. getEnemyArt mist-keyword fix (A8-w3 residual)

### Bug

`getEnemyArt` name-keyword branch for `mist` resolved via:

```ts
ART_REGISTRY['enemy:pool_beach_bandit']  // src = /assets/enemy_dock_worker.png
```

So any enemy whose **display name** contained “mist” (and lacked a successful `poolId` hit) showed a **dock worker** plate, not the painted mist-ninja. Comment claimed “mist-ninja plate” but the key was wrong after beach_bandit was intentionally aliased to dock_worker (OOS-A8-05).

### Fix (glue only)

```ts
// Name keyword "mist" → pool_assassin → /assets/enemy_mist_ninja.png
// Same plate already used by river_bandit / hidden_guard / assassin pools.
ART_REGISTRY['enemy:pool_assassin']
```

`poolId: 'beach_bandit'` still correctly returns dock_worker (intentional residual share). Only the **name-keyword** path changed.

### Not changed (still OOS-A8-05)

| Pool id | Shared plate |
|---------|--------------|
| `beach_bandit` | dock_worker |
| `smuggler` / `cave_smuggler` / `corrupt_merchant` | puppeteer |
| `stranded_ronin` | samurai |
| `assassin` | mist_ninja |
| animals / traps | imagine-jpg archetypes |

---

## 3. Art tree mirror

| Check | Result |
|-------|--------|
| public top-level file count | 136 |
| assets/ top-level (excl. backup zip / extra UI) | 138 (2 assets-only extras, not runtime) |
| public-only top-level gaps | **0** |
| Nested `icons/*` | public-only (canonical runtime under `public/assets/icons/`); not mirrored historically — no new WAVE4 requirement |
| New WAVE4 painted plates | **None** |

**Mirror action this wave:** none required (WAVE3 residual mirrors still complete).

### Painted inventory (unchanged from WAVE3)

| Asset class | Count |
|-------------|-------|
| `skill_*.png` | **37** |
| enemy portraits (non-cut) | **17** |
| `enemy_cut_*.png` | **17** |
| `event_*.png` | **3** (meet_tazuna, protect_bridge, final_confrontation) |
| `lamina_mid_*` / `lamina_fg_*` | **14 / 14** |

---

## 4. Docs / OOS progress

| File | Change |
|------|--------|
| `CHANGELOG.md` | WAVE4 integration residual block |
| `out-of-scope.md` | OOS-A8-04 still **partial** (no WAVE4 event-art progress); OOS-A8-05 → **partial** (mist keyword fixed; pool shares remain) |
| `artRegistry.ART_BACKLOG_NOTES` | T021 notes mist keyword fix + residual shares |
| This report | Ready-for-playtest honesty |

---

## 5. Optional smoke tests

```text
npx vitest run src/game/constants/events/__tests__/eventContent.test.ts
→ 18/18 passed (730ms)
```

---

## 6. Residual product gaps (honest — carry from WAVE3 + this fix)

1. **~77 skill cards still imagine-jpg** — R1 start loadouts fully painted; loot/late-tier kits remain jpg.  
2. **Event art thin outside spine** — 3 dedicated painted event PNGs; side residuals reuse plates.  
3. **Enemy pool sharing remains** — table above; only mist **name-keyword** path fixed this wave.  
4. **Lamina mid/fg** — solid black void centers (not true alpha); fine for stage stack.  
5. **Genre stack** — CRT map instrument vs mist combat stage intentional; watch party cyan / parchment regression.  
6. **Mystery side-event discoverability** — residual events depend on preferred pools + rolls; short runs may miss flags.  
7. **No WAVE4 feature peers** — if more land after this report, re-run `npx tsc --noEmit` before parent stages.  
8. **Human playtest still required** — systems + art present; §13 mood not measured live.

---

## 7. Production readiness vs VISION-8 §13 (20-min R1)

Checkbox status = **honest estimate** from code/art audit + peer WAVE3 reports + this glue pass — **not a live playtest**.

| # | Criterion | Est. | Notes |
|---|-----------|------|-------|
| 1 | Identidad en 30 s: ninja terror en niebla / máquina oscura | [~] **partial → likely** | Void stage + painted enemies/laminas; CRT map instrument. Needs human eye on first boot. |
| 2 | Combate = show; mano = mando | [x] **likely** | Enemy-focus stage, cutouts, seals, R1 painted skill faces. Mist keyword no longer shows dock worker for mist-named foes. |
| 3 | Derrota/victoria legible; sin soft-locks | [~] **partial** | Prior soft-lock fixes landed; full defeat mood needs playtest. |
| 4 | Continuidad de tone | [~] **partial → improved** | Parchment dead; rarity colors fixed; residual jpg tiles + CRT still two languages by design. |
| 5 | “Una sala más” sin R4 | [x] **likely** | Coach CTAs, spine events, amenities honesty. |
| 6 | Eventos/tooltips de producto | [~] **partial** | Spine + residual mystery + tooltips; event art sparse outside 3 plates. |

### Go / no-go

| Signal | Status |
|--------|--------|
| Builds / typechecks | **GO** (`tsc` clean) |
| Event content unit smoke | **GO** (18/18) |
| Art paths for painted manifests | **GO** (0 missing top-level) |
| public ↔ assets top-level mirror | **GO** (0 gaps) |
| Known P0 soft-lock open | **None from this audit** |
| **Ready for human playtest** | **YES — GO for 20-min R1 playtest** |
| **Ship as “R1 vertical slice done”** | **NOT YET** — playtest first; OOS art optional polish after human verdict |

### Ready for playtest vs ship (plain language)

- **Playtest-ready:** Yes. Typecheck clean, event content tests green, painted spine/combat art wired, mist keyword no longer misroutes, no known integration glue breakers. Hand a human a 20-minute Land of Waves run.  
- **Ship-ready:** No. Residual jpg skill tiles, shared enemy pool plates, sparse side-event art, and unmeasured mood criteria mean this is a **playtest candidate**, not a “R1 done / release” claim.

---

## Verification

```text
npx tsc --noEmit                                              → exit 0
npx vitest run …/events/__tests__/eventContent.test.ts        → 18/18
public skill_*.png                                            → 37
public enemy portraits / cuts                                 → 17 / 17
public event_*.png                                            → 3
public lamina_mid_ / _fg_                                     → 14 / 14
public → assets top-level gap                                 → 0
getEnemyArt mist keyword                                      → pool_assassin / mist_ninja
```

No git commit / no git add (parent stages).

---

## Files touched (A8 WAVE4)

- `src/game/constants/artRegistry.ts` — mist keyword fix + ART_BACKLOG_NOTES T021
- `CHANGELOG.md` — WAVE4 residual block
- `out-of-scope.md` — OOS-A8-04/05 progress
- `.agents/swarm-grok/reports/A8-wave4-integration.md` (this file)
