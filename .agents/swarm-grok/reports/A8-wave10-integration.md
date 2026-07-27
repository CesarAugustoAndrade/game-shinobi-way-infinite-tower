# A8 WAVE10 — INTEGRACIÓN production gate

**Agent:** A8 WAVE10  
**Date:** 2026-07-23  
**Branch:** develop (no commit / no git add)  
**Scope:** Glue only after WAVE9 peer landings. Final production gate. No feature rewrites. No scheduled art polish.

---

## Summary

WAVE10 is the **production gate** pass after full WAVE9 peer verification (A2–A7b) + A3 cast closeout (shrine_demon / corrupted_priest → 39/39).

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **exit 0** |
| `npm run build` | **exit 0** (~8.4s, 1857 modules) |
| Event content smoke | **18/18** |
| public → assets top-level gaps | **0** |
| assets → public runtime gaps | **0** |
| Manifest painted-png missing on disk | **0** |
| Glue TS fixes required | **None** |
| Mirror copies required | **None** |

### STOP further scheduled art/polish waves

Region 1 is **past agent art-wave and residual-polish ROI**.

**Do not open WAVE11+ scheduled art/polish** unless a **human playtest** logs a blocker (P0 soft-lock, missing asset path, broken build, critical spine identity wrong).

**Human playtest is the only remaining gate.** Fix only what a 20-minute Land of Waves run proves.

Integration is green. Residual is optional polish and OOS R2+, not blockers.

---

## 1. Peer landings (WAVE9 → WAVE10)

| Agent | Role | Status | Product delta (integration view) |
|-------|------|--------|----------------------------------|
| A2 WAVE9 | Combat production verify | done | Double-submit locks present (skill/victory/approach/end-turn/reward/elite); no new combat bugs; verify-only |
| A3 WAVE9 | Cast closeout | done | +2 enemy plates → **39/39** portraits+cuts (`shrine_demon`, `corrupted_priest`); soft elite remaps (manor/elite_guard→corrupt_guard; eldritch→treasure_guardian; assassin→hired_assassin) |
| A4 WAVE9 | Explore production verify | done | LocationComplete one-shot; secret veiled displayInfo honesty |
| A5 WAVE9 | Events production verify | done | 0 shonen residual; 41 tiedStory refs / 0 missing; verify-only |
| A6 WAVE9 | UX production verify | done | Portal tooltip flip re-anchor; treasure claim Esc residual |
| A7a WAVE9 | Loot production verify | done | Merchant Leave mutex; LOOT Leave All mutex; treasure claim UI lock |
| A7b WAVE9 | Skills/VFX residual | done | **0** new paint (21 jpg held); SkillCard cost legibility + FloatingText polish |
| A8 WAVE10 | Integration gate | **this report** | tsc/build/mirror/docs; **STOP scheduled waves** |

---

## 2. Typecheck / build / imports

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **exit 0** |
| `npm run build` | **exit 0** |
| Build notes | Chunk size warning only (`index-*.js` ~1.07 MB min / 291 kB gzip) — known, not a blocker |
| Broken imports | None |
| Glue TS fixes required | **None** |

Peers already wired WAVE9 art + residual locks. `artRegistry.ART_BACKLOG_NOTES` already at 93 / 39 / 11.

---

## 3. Full R1 inventory snapshot (authoritative WAVE10)

### Disk (top-level `public/assets/` and mirrored `assets/`)

| Asset class | Count | Notes |
|-------------|------:|-------|
| `skill_*.png` | **93** | All painted faces on disk |
| enemy portraits (non-cut) | **39** | Dedicated plates (WAVE9 +shrine_demon, +corrupted_priest) |
| `enemy_cut_*.png` | **39** | Parity 39/39 |
| `event_*.png` dedicated | **11** | Spine + key sides |
| `lamina_mid_*` | **14** | All R1 location slugs |
| `lamina_fg_*` | **14** | All R1 location slugs |
| `hero_*.png` / `hero_cut_*` | 10 / 5 | Clan select plates (not OOS residual) |
| public → assets gaps | **0** | Root `assets/` has 2 non-runtime extras: `assets_backup.zip`, `ui_seinen-sublime-…png` |
| assets → public gaps (runtime) | **0** | Excluding backup/ui extras |

### Manifest quality (WAVE10)

| Manifest | painted-png keys | imagine-jpg | unique painted srcs | missing files |
|----------|-----------------:|------------:|--------------------:|--------------:|
| skillArtManifest | **93** | **21** | **93** | **0** |
| enemyArtManifest | **47** | **5** | **39** | **0** |
| eventArtManifest | **12** | **36** | **11** | **0** |

**Skill residual (21 imagine-jpg):**  
`bug_swarm`, `expansion`, `sand_burial`, `sand_shield`, `summon_manda`, `puppet_crow`, `sand_coffin`, `curse_mark_2`, `curse_surge`, `tsukuyomi`, `reaper_death_seal`, `edo_tensei`, `gate_of_limit`, `shukaku_arm`, `c4_karura`, `rasenshuriken`, `amaterasu`, `kirin`, `shinra_tensei`, `kamui_impact`, `tengai_shinsei`  
→ almost all endgame / sand / kekkei — **low first-hour R1 impact**. **Do not schedule paint.**

**Enemy residual jpg (5):**  
Archetypes only (`TANK`, `ASSASSIN`, `BALANCED`, `CASTER`, `GENJUTSU`).  
**R1 named/pool jpg residual: none.** Soft shares remaining: river_bandit / hidden_guard → mist_ninja; elite_mercenary → bridge_saboteur; (+ job_ninja/job_shinobi → exhausted_shinobi; guard_dog → war_dog; manor/elite_guard → corrupt_guard; eldritch → treasure_guardian; assassin → hired_assassin).

**Event residual:** ~36 side/category still jpg/reuse; 11 dedicated plates cover spine + key sides (`tazuna_road_mist` reuses `meet_tazuna`).

**Mirror action this wave:** none — 0 public↔assets top-level gaps.  
(`public/assets/icons/**` jpg tree is intentionally public-only runtime Imagine set — not mirrored to root `assets/`.)

---

## 4. Glue changes (A8 WAVE10 only)

| File | Change |
|------|--------|
| `CHANGELOG.md` | WAVE10 production-gate block; WAVE9 enemy count note (37 at A8-w9 → 39 after A3-w9) |
| `out-of-scope.md` | **R1 polish ceiling** stamp; OOS-A8-02/04/05 ceiling + human playtest gate |
| `.agents/swarm-grok/reports/A8-wave10-integration.md` | this report |

No `artRegistry` / manifest / runtime glue edits — peers already wired WAVE9; registry notes already accurate (93 / 39 / 11).

---

## 5. Docs / OOS final inventory

| ID | WAVE10 status | Honest residual |
|----|---------------|-----------------|
| **OOS-A8-02** Skills art | **partial / ceiling** — **93** painted / **21** jpg | Endgame sand/gates/summons/forbidden — **STOP without playtest promotion** |
| **OOS-A8-03** Laminas | **closed (R1)** | — |
| **OOS-A8-04** Event art | **partial / ceiling** — **11** dedicated plates | ~36 side/category still jpg/reuse |
| **OOS-A8-05** Enemy pool share | **partial / ceiling** — **39** portraits/cuts | 5 archetype jpg; thin soft aliases only |
| **OOS-A8-01** R2+ cast | open | Out of R1 scope |

**R1 polish ceiling:** stamped. Gate = human playtest only.

---

## 6. Vitest smoke

```text
npx vitest run src/game/constants/events/__tests__/eventContent.test.ts
→ 18/18 passed (~726ms)
```

Cheap event-content smoke only; full suite not required for glue pass. A5 WAVE9 reported broader event suite 78/78 in peer pass.

---

## 7. VISION-8 §13 checklist estimate

Source: `docs/VISION-8-AGENTES.md` §13 — *Criterio de éxito (playtest 20 min R1)*.  
**These are integration estimates only — not human playtest results.**

| # | Criterion | Est. readiness | Notes |
|---|-----------|----------------|-------|
| 1 | Identidad en 30 s: “ninja terror en niebla, en una máquina oscura” | **~70–75%** | Seinen plates + CRT chassis present; 39 enemy cast closed; era-stack residual (map neon vs mist stage) unmeasured live |
| 2 | Combate se ve como el *show*; la mano es el mando | **~85–90%** | Laminas 14/14; cutouts 39/39; 93 skill faces; enemy stage focus wired; SkillCard cost honesty WAVE9 |
| 3 | Derrota/victoria trade-off legible; sin soft-locks de modales | **~90%** | WAVE2–9 ref locks (reward/elite/victory/loot/merchant/leave/approach Esc/focus traps/LocationComplete); **needs human hold/double-click smoke** |
| 4 | Continuidad de tone (sin whiplash pergamino/party/pixel) | **~65–70%** | Hope-language killed; parchment chassis dead on path; residual genre polyglot still design tension |
| 5 | “Una sala más” sin necesitar R4 para entender el juego | **~80%** | Full R1 loop (map→room→combat/event/loot/amenities→boss arc) wired |
| 6 | Eventos y tooltips se sienten de producto, no de prototipo | **~75–80%** | Spine events + 11 plates; A6 tooltip product chrome; side events thinner |

**Aggregate playtest-gate estimate:** **~78–82%** of VISION-8 §13 is *plausibly* present in code/assets.  
**Only a 20-min human run can pass/fail the checklist.** Do not claim §13 complete from agent waves alone.

---

## 8. TOP residual for human only

1. **Human playtest (P0 next)** — 20-min Land of Waves; log real friction against VISION-8 §13. **Only gate.**  
2. **21 skill imagine-jpg** — late-tier sand/gates/summons/forbidden; R1 loadouts already closed. Paint only if playtest hits those cards and complains.  
3. **Side-event art thin** — outside 11 spine/key plates, residual jpg/reuse.  
4. **Enemy thin residual** — 5 archetype jpg fallbacks; soft aliases (river_bandit/hidden_guard→mist_ninja, elite_mercenary→bridge_saboteur).  
5. **Genre stack leftovers** — CRT map instrument vs mist combat stage (by design); residual chrome cohesion only if playtest complains.

**Not residual blockers:** tsc, production build, painted path integrity, cutout parity 39/39, event content unit smoke, public↔assets mirror, R1 named-enemy jpg residual (closed).

---

## 9. Playtest vs ship (production gate)

| Signal | Status |
|--------|--------|
| Typechecks | **GO** (`tsc` clean) |
| Production build | **GO** (`npm run build` clean) |
| Event content unit smoke | **GO** (18/18) |
| Art paths for painted manifests | **GO** (0 missing) |
| public ↔ assets top-level mirror | **GO** (0 gaps) |
| Cutout parity (39/39) | **GO** |
| Known P0 soft-lock open from this audit | **None** |
| **Ready for human playtest** | **YES — GO for 20-min R1 playtest** |
| **Ship as “R1 vertical slice done”** | **NOT YET** — playtest first; optional art only after human verdict |
| **Further R1 scheduled art/polish agent waves** | **STOP** — ceiling reached; human playtest is the gate |

### Plain language

- **Playtest-ready:** **Yes.** Typecheck + production build clean, event content green, WAVE9 peer verification + cast closeout coherent, 0 mirror gaps. Hand a human a 20-minute Land of Waves run.  
- **Ship-ready:** **No — wait for human verdict.** Residual jpg skill tiles (21), thin side-event art, and soft enemy shares are **optional polish**, not integration blockers. Claiming “R1 done / release” without playtest would oversell.  
- **Art/polish-wave-ready:** **No.** Ceiling reached. Prefer playtest → fix proven P0/P1 only.

### Diminishing returns (explicit)

Further agent art or residual-polish waves on R1 are past the steep part of the curve. Prefer:

1. Human playtest → log real P0/P1 friction  
2. Fix only what playtest proves  
3. Leave OOS art residual until promoted  
4. **Do not open WAVE11+ scheduled art/polish without human blocker evidence**

---

## Verification

```text
npx tsc --noEmit                                              → exit 0
npm run build                                                 → exit 0 (~8.4s)
npx vitest run …/events/__tests__/eventContent.test.ts        → 18/18
public skill_*.png                                            → 93
public enemy portraits / cuts                                 → 39 / 39
public event_*.png                                            → 11
public lamina_mid_ / _fg_                                     → 14 / 14
public → assets top-level gap                                 → 0
manifest painted-png missing                                  → 0
skill / enemy / event painted counts                          → 93 / 47 keys (39 unique) / 12 keys (11 files)
enemy imagine-jpg residual                                    → 5 archetypes only
```

No git commit / no git add (parent stages).

---

## Files touched (A8 WAVE10)

- `CHANGELOG.md` — WAVE10 production-gate block  
- `out-of-scope.md` — R1 polish ceiling stamp + OOS inventory  
- `.agents/swarm-grok/reports/A8-wave10-integration.md` (this file)
