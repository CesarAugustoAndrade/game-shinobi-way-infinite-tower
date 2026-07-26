# A8 WAVE9 — INTEGRACIÓN production readiness

**Agent:** A8 WAVE9  
**Date:** 2026-07-23  
**Branch:** develop (no commit / no git add)  
**Scope:** Glue only after WAVE8 peer landings. Production-readiness gate. No feature rewrites. No scheduled art polish.

---

## Summary

WAVE9 is the **production readiness** pass: re-run typecheck + production build after WAVE8 (A2–A7b residual + A3/A7b art ceiling), re-audit public↔assets mirror and painted manifests, refresh CHANGELOG / OOS, and publish the honest gate call.

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **exit 0** |
| `npm run build` | **exit 0** (~7.3s, 1857 modules) |
| Event content smoke | **18/18** |
| public → assets top-level gaps | **0** |
| Manifest painted-png missing on disk | **0** |
| Glue TS fixes required | **None** |

### Recommend: STOP scheduled art polish

Region 1 is **past agent art-wave ROI**. Further skill jpg / side-event plates / thin elite aliases are **diminishing returns**.

**Human playtest is the gate.** Fix only what a 20-minute Land of Waves run proves. Do not open WAVE10 art without human evidence.

Integration is green. Residual is optional polish and OOS R2+, not blockers.

---

## 1. Peer landings (WAVE8 baseline → WAVE9)

| Agent | Role | Status | Product delta (integration view) |
|-------|------|--------|----------------------------------|
| A2 WAVE8 | Combat residual | done (report) | Soft-lock / ref locks closed through WAVE7–8 chain |
| A3 WAVE8 | Cast residual | done | +4 enemy plates → **37/37** portraits+cuts (`camp_raider`, `ronin`, `treasure_guardian`, `cursed_servant`) |
| A4 WAVE8 | Explore residual | done (report) | Floor/map residual UX |
| A5 WAVE8 | Events residual | done (report) | Content resolve / tone residual |
| A6 WAVE8 | UX residual | done (report) | Focus traps / tooltip product chrome |
| A7a WAVE8 | Loot residual | done (report) | Claim/mutex residual |
| A7b WAVE8 | Skills residual | done | +8 painted faces → **93** painted / **21** jpg |
| WAVE9 A2–A7b | — | **none expected** | Production readiness glue only |

No WAVE9 peer reports landed at integration time — expected; WAVE9 is the gate, not another art wave.

---

## 2. Typecheck / build / imports

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **exit 0** |
| `npm run build` | **exit 0** |
| Build notes | Chunk size warning only (`index-*.js` ~1.06 MB min / 290 kB gzip) — known, not a blocker |
| Broken imports | None |
| Glue TS fixes required | **None** |

Peers already wired WAVE8 art + soft-lock fixes. `artRegistry.ART_BACKLOG_NOTES` already at 93 / 37 / 11.

---

## 3. Full R1 inventory snapshot (authoritative WAVE9)

### Disk (top-level `public/assets/` and mirrored `assets/`)

| Asset class | Count | Notes |
|-------------|------:|-------|
| `skill_*.png` | **93** | All painted faces on disk |
| enemy portraits (non-cut) | **37** | Dedicated plates |
| `enemy_cut_*.png` | **37** | Parity 37/37 |
| `event_*.png` dedicated | **11** | Spine + key sides |
| `lamina_mid_*` | **14** | All R1 location slugs |
| `lamina_fg_*` | **14** | All R1 location slugs |
| `hero_*.png` / `hero_cut_*` | 10 / 5 | Clan select plates (not OOS residual) |
| public → assets gaps | **0** | Root `assets/` has 2 non-runtime extras: `assets_backup.zip`, `ui_seinen-sublime-…png` |
| assets → public gaps (runtime) | **0** | Excluding backup/ui extras |

### Manifest quality (WAVE9)

| Manifest | painted-png keys | imagine-jpg | unique painted srcs | missing files |
|----------|-----------------:|------------:|--------------------:|--------------:|
| skillArtManifest | **93** | **21** | **93** | **0** |
| enemyArtManifest | **45** | **7** | **37** | **0** |
| eventArtManifest | **12** | **36** | **11** | **0** |

**Skill residual (21 imagine-jpg):**  
`bug_swarm`, `expansion`, `sand_burial`, `sand_shield`, `summon_manda`, `puppet_crow`, `sand_coffin`, `curse_mark_2`, `curse_surge`, `tsukuyomi`, `reaper_death_seal`, `edo_tensei`, `gate_of_limit`, `shukaku_arm`, `c4_karura`, `rasenshuriken`, `amaterasu`, `kirin`, `shinra_tensei`, `kamui_impact`, `tengai_shinsei`  
→ almost all endgame / sand / kekkei — **low first-hour R1 impact**.

**Enemy residual jpg (7):**  
5 archetypes (`TANK`, `ASSASSIN`, `BALANCED`, `CASTER`, `GENJUTSU`) + `pool_shrine_demon`, `pool_corrupted_priest`.  
Soft shares still on painted plates: manor_guardian / elite_guard / eldritch_guardian → monk; river_bandit / hidden_guard / assassin → mist_ninja; elite_mercenary → bridge_saboteur.

**Event residual:** ~36 side/category still jpg/reuse; 11 dedicated plates cover spine + key sides (`tazuna_road_mist` reuses `meet_tazuna`).

**Mirror action this wave:** none — 0 public↔assets top-level gaps.  
(`public/assets/icons/**` jpg tree is intentionally public-only runtime Imagine set — not mirrored to root `assets/`.)

---

## 4. Glue changes (A8 WAVE9 only)

| File | Change |
|------|--------|
| `CHANGELOG.md` | WAVE9 production-readiness block; WAVE8 counts corrected to post-A3/A7b disk truth |
| `out-of-scope.md` | OOS-A8-02/04/05 production-readiness inventory + playtest-gate language |
| `.agents/swarm-grok/reports/A8-wave9-integration.md` | this report |

No `artRegistry` / manifest / runtime glue edits — peers already wired WAVE8; registry notes already accurate (93 / 37 / 11).

---

## 5. Docs / OOS final inventory

| ID | WAVE9 status | Honest residual |
|----|--------------|-----------------|
| **OOS-A8-02** Skills art | **partial / ceiling** — **93** painted / **21** jpg | Endgame sand/gates/summons/forbidden — **stop without playtest promotion** |
| **OOS-A8-03** Laminas | **closed (R1)** | — |
| **OOS-A8-04** Event art | **partial / ceiling** — **11** dedicated plates | ~36 side/category still jpg/reuse |
| **OOS-A8-05** Enemy pool share | **partial / ceiling** — **37** portraits/cuts | shrine_demon / corrupted_priest jpg; thin elite aliases |
| **OOS-A8-01** R2+ cast | open | Out of R1 scope |

---

## 6. Vitest smoke

```text
npx vitest run src/game/constants/events/__tests__/eventContent.test.ts
→ 18/18 passed (~774ms)
```

Cheap event-content smoke only; full suite not required for glue pass.

---

## 7. VISION-8 §13 checklist estimate

Source: `docs/VISION-8-AGENTES.md` §13 — *Criterio de éxito (playtest 20 min R1)*.  
**These are integration estimates only — not human playtest results.**

| # | Criterion | Est. readiness | Notes |
|---|-----------|----------------|-------|
| 1 | Identidad en 30 s: “ninja terror en niebla, en una máquina oscura” | **~70%** | Seinen plates + CRT chassis present; era-stack residual (map neon vs mist stage) unmeasured live |
| 2 | Combate se ve como el *show*; la mano es el mando | **~85–90%** | Laminas 14/14; cutouts 37/37; 93 skill faces; enemy stage focus wired |
| 3 | Derrota/victoria trade-off legible; sin soft-locks de modales | **~85%** | WAVE2–8 ref locks (reward/elite/victory/loot/merchant/approach Esc/focus traps); **needs human hold/double-click smoke** |
| 4 | Continuidad de tone (sin whiplash pergamino/party/pixel) | **~65–70%** | Hope-language killed; parchment chassis dead on path; residual genre polyglot still design tension |
| 5 | “Una sala más” sin necesitar R4 para entender el juego | **~80%** | Full R1 loop (map→room→combat/event/loot/amenities→boss arc) wired |
| 6 | Eventos y tooltips se sienten de producto, no de prototipo | **~75%** | Spine events + 11 plates; A6 tooltip product chrome; side events thinner |

**Aggregate playtest-gate estimate:** **~75–80%** of VISION-8 §13 is *plausibly* present in code/assets.  
**Only a 20-min human run can pass/fail the checklist.** Do not claim §13 complete from agent waves alone.

---

## 8. TOP residual only

1. **Human playtest (P0 next)** — 20-min Land of Waves; log real friction against VISION-8 §13.  
2. **21 skill imagine-jpg** — late-tier sand/gates/summons/forbidden; R1 loadouts already closed.  
3. **Side-event art thin** — outside 11 spine/key plates, residual jpg/reuse.  
4. **Enemy thin residual** — shrine_demon / corrupted_priest jpg; soft elite aliases.  
5. **Genre stack leftovers** — CRT map instrument vs mist combat stage (by design); residual chrome cohesion only if playtest complains.

**Not residual blockers:** tsc, production build, painted path integrity, cutout parity, event content unit smoke, public↔assets mirror.

---

## 9. Playtest vs ship (production readiness)

| Signal | Status |
|--------|--------|
| Typechecks | **GO** (`tsc` clean) |
| Production build | **GO** (`npm run build` clean) |
| Event content unit smoke | **GO** (18/18) |
| Art paths for painted manifests | **GO** (0 missing) |
| public ↔ assets top-level mirror | **GO** (0 gaps) |
| Cutout parity (37/37) | **GO** |
| Known P0 soft-lock open from this audit | **None** |
| **Ready for human playtest** | **YES — GO for 20-min R1 playtest** |
| **Ship as “R1 vertical slice done”** | **NOT YET** — playtest first; optional art only after human verdict |
| **Further R1 scheduled art agent waves** | **STOP** — diminishing returns; human playtest is the gate |

### Plain language

- **Playtest-ready:** **Yes.** Typecheck + production build clean, event content green, WAVE8 peer bug hunts + art coherent, 0 mirror gaps. Hand a human a 20-minute Land of Waves run.  
- **Ship-ready:** **No — wait for human verdict.** Residual jpg skill tiles (21), thin side-event art, and soft enemy shares are **optional polish**, not integration blockers. Claiming “R1 done / release” without playtest would oversell.  
- **Art-wave-ready:** **No.** Ceiling reached. Prefer playtest → fix proven P0/P1 only.

### Diminishing returns (explicit)

Further agent art waves on R1 are past the steep part of the curve. Prefer:

1. Human playtest → log real P0/P1 friction  
2. Fix only what playtest proves  
3. Leave OOS art residual until promoted  
4. Do not open WAVE10 art without human evidence

---

## Verification

```text
npx tsc --noEmit                                              → exit 0
npm run build                                                 → exit 0 (~7.3s)
npx vitest run …/events/__tests__/eventContent.test.ts        → 18/18
public skill_*.png                                            → 93
public enemy portraits / cuts                                 → 37 / 37
public event_*.png                                            → 11
public lamina_mid_ / _fg_                                     → 14 / 14
public → assets top-level gap                                 → 0
manifest painted-png missing                                  → 0
skill / enemy / event painted counts                          → 93 / 45 keys (37 unique) / 12 keys (11 files)
```

No git commit / no git add (parent stages).

---

## Files touched (A8 WAVE9)

- `CHANGELOG.md` — WAVE9 production-readiness block + WAVE8 count correction  
- `out-of-scope.md` — OOS-A8-02/04/05 final inventory + playtest-gate language  
- `.agents/swarm-grok/reports/A8-wave9-integration.md` (this file)
