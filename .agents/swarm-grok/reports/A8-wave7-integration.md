# A8 WAVE7 — INTEGRACIÓN residual

**Agent:** A8 WAVE7  
**Date:** 2026-07-23  
**Branch:** develop (no commit / no git add)  
**Scope:** Glue only after WAVE6 peer landings. No feature rewrites. Honest diminishing-returns call on R1 polish ceiling.

---

## Summary

Post-WAVE6 residual integration (WAVE7). **No separate WAVE7 peer art/system waves landed** — this pass reconciles full WAVE6 peer products (A2–A7b), re-runs typecheck, audits painted-png paths, verifies public↔assets top-level mirror (**0 gaps**), refreshes CHANGELOG / OOS accurate counts, smoke-tests event content.

**`npx tsc --noEmit` → exit 0.** Event content tests **18/18**. **No TS glue fixes required.**

**Honest call:** Region 1 is **near polish ceiling**. Further painted art (41 skill jpg / thin side events / soft enemy shares) is **diminishing returns** vs human playtest + ship decision. Integration is green; residual is optional art polish, not blockers.

---

## 1. Peer landings (baseline for WAVE7)

| Agent | Role | Status | Product delta (integration view) |
|-------|------|--------|----------------------------------|
| A2 WAVE6 | Combat bug hunt | done | Approach double-Engage lock; Esc dismisses confirm |
| A3 WAVE6 | Cast / events art | done | +4 enemy plates (wild_boar, war_dog, trap_master, drowned_sailor) → **29/29**; +2 event plates (docks_collector_ledger, mist_omen_tide) → **9** |
| A4 WAVE6 | Explore bug hunt | done | Map keyboard re-entry under approach; secret unlock tone; bag under modals |
| A5 WAVE6 | Events copy QA | done | Hope-language kill in `wavesArcEvents`; 19/19 tiedStoryEvents resolve |
| A6 WAVE6 | UX bug hunt | done | Esc on continue-family modals; shared focus trap |
| A7a WAVE6 | Loot bug hunt | done | Equipment synthesis preview arm; ArtIcon sticky error; merchant bag-full gate |
| A7b WAVE6 | Skills residual | done | +12 painted faces → **73** painted / **41** jpg |
| WAVE7 A2–A7b | — | **none landed** | No wave7 peer reports this pass |

> Note: A8 WAVE6 report undercounted art (61/25/7) because it ran against pre-peer-art residual. WAVE7 counts below are authoritative disk + manifest audit.

---

## 2. Typecheck / imports

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **exit 0** |
| Broken imports | None |
| Glue TS fixes required | **None** |

---

## 3. Art tree mirror + path audit

| Check | Result |
|-------|--------|
| `skill_*.png` (public top-level) | **73** |
| skill manifest painted / jpg | **73 / 41** (114 total) |
| enemy portraits (non-cut) | **29** |
| `enemy_cut_*.png` | **29** (parity) |
| enemy manifest painted keys / unique srcs / jpg | **41 / 29 / 11** (52 total) |
| `event_*.png` dedicated | **9** |
| event manifest painted keys / unique srcs / jpg | **10 / 9 / 38** (48 total; `tazuna_road_mist` reuses meet_tazuna) |
| `lamina_mid_*` / `lamina_fg_*` | **14 / 14** |
| public top-level → `assets/` gaps | **0** (root `assets/` has 2 extra non-runtime: `assets_backup.zip`, `ui_seinen-sublime-…png`) |
| Manifest painted-png missing on disk | **0** |

### Manifest quality snapshot (WAVE7 audit)

| Manifest | entries | painted-png | imagine-jpg | missing files |
|----------|---------|-------------|-------------|---------------|
| skillArtManifest | 114 | 73 | 41 | 0 |
| enemyArtManifest | 52 | 41* | 11 | 0 |
| eventArtManifest | 48 | 10** | 38 | 0 |

\* includes job/boss/pool aliases pointing at shared dedicated plates (29 unique portrait files).  
\*\* 10 painted keys = 9 dedicated files + `tazuna_road_mist` reuses `event_meet_tazuna.png`.

**Mirror action this wave:** none — 0 public→assets top-level gaps.  
(`public/assets/icons/**` jpg tree is intentionally public-only runtime Imagine set — not mirrored to root `assets/`.)

---

## 4. Glue changes (A8 WAVE7 only)

| File | Change |
|------|--------|
| `CHANGELOG.md` | WAVE7 integration residual block + WAVE6 count correction note |
| `out-of-scope.md` | OOS-A8-02/04/05 accurate WAVE7 audit counts |
| `.agents/swarm-grok/reports/A8-wave7-integration.md` | this report |

No `artRegistry` / manifest / runtime glue edits required — peers already wired WAVE6 art; registry notes already at 73/29/9.

---

## 5. Docs / OOS progress

| ID | WAVE7 status | Honest residual |
|----|--------------|-----------------|
| **OOS-A8-02** Skills art | **partial** — **73** painted / **41** jpg | Late gates/summons/forbidden/niche — low first-hour impact |
| **OOS-A8-03** Laminas | **closed (R1)** | — |
| **OOS-A8-04** Event art | **partial** — **9** dedicated plates | **38** side/category still jpg/reuse |
| **OOS-A8-05** Enemy pool share | **partial** — **29** portraits/cuts | water_spirit/ghosts jpg; soft human aliases |
| **OOS-A8-01** R2+ cast | open | Out of R1 scope |

---

## 6. Optional smoke tests

```text
npx vitest run src/game/constants/events/__tests__/eventContent.test.ts
→ 18/18 passed (~753ms)
```

Cheap event-content smoke only; full suite not required for glue pass.

---

## 7. TOP residual only (diminishing returns)

1. **41 skill cards still imagine-jpg** — R1 loadouts + mid-late combat faces painted; remaining are late-tier / niche (gates, summons, forbidden).  
2. **Side-event art thin** — outside 9 spine/key plates, residual still jpg/reuse.  
3. **Enemy residual shares** — `pool_ronin`→samurai; soft muscle/guardian→monk; animals/spirits mostly painted except water_spirit / sea_creature / ghosts.  
4. **Human playtest still required** — systems + art present; VISION-8 mood / first-hour feel not measured live.  
5. **Genre stack leftovers** — CRT map instrument vs mist combat stage by design; non-combat shell tokens outside mission path.

**R1 polish ceiling note:** Waves spine art, lamina set, cutout parity, major UX soft-locks, and mid-late skill faces are in. More art waves buy less per hour than a real playtest + ship cut.

---

## 8. Playtest vs ship

| Signal | Status |
|--------|--------|
| Builds / typechecks | **GO** (`tsc` clean) |
| Event content unit smoke | **GO** (18/18) |
| Art paths for painted manifests | **GO** (0 missing) |
| public ↔ assets top-level mirror | **GO** (0 gaps) |
| Cutout parity (29/29) | **GO** |
| Known P0 soft-lock open | **None from this audit** |
| **Ready for human playtest** | **YES — GO for 20-min R1 playtest** |
| **Ship as “R1 vertical slice done”** | **NOT YET** — playtest first; optional art after human verdict |

### Plain language

- **Playtest-ready:** **Yes.** Typecheck clean, event content green, WAVE6 peer bug hunts + art coherent, 0 mirror gaps. Hand a human a 20-minute Land of Waves run.  
- **Ship-ready:** **No — wait for human verdict.** Residual jpg skill tiles (41), thin side-event art, and soft enemy shares are **optional polish**, not integration blockers. Claiming “R1 done / release” without playtest would oversell.

### Diminishing returns (explicit)

Further agent art waves on R1 are past the steep part of the curve. Prefer:

1. Human playtest → log real P0/P1 friction  
2. Fix only what playtest proves  
3. Leave OOS art residual until promoted

---

## Verification

```text
npx tsc --noEmit                                              → exit 0
npx vitest run …/events/__tests__/eventContent.test.ts        → 18/18
public skill_*.png                                            → 73
public enemy portraits / cuts                                 → 29 / 29
public event_*.png                                            → 9
public lamina_mid_ / _fg_                                     → 14 / 14
public → assets top-level gap                                 → 0
manifest painted-png missing                                  → 0
skill / enemy / event painted counts                          → 73 / 41 keys (29 unique) / 10 keys (9 files)
```

No git commit / no git add (parent stages).

---

## Files touched (A8 WAVE7)

- `CHANGELOG.md` — WAVE7 residual block + WAVE6 count correction note  
- `out-of-scope.md` — OOS-A8-02/04/05 accurate WAVE7 counts  
- `.agents/swarm-grok/reports/A8-wave7-integration.md` (this file)
